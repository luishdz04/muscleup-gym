-- ==========================================
-- MIGRATION: Survey System
-- ==========================================

-- 1. Create surveys table
-- ==========================================
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_responses_per_user INTEGER DEFAULT 1,
  created_by UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create survey_questions table
-- ==========================================
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- 'multiple_choice', 'text', 'rating', 'yes_no'
  options JSONB, -- Para opciones de multiple choice: ["Opción 1", "Opción 2"]
  is_required BOOLEAN NOT NULL DEFAULT false,
  question_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create survey_responses table
-- ==========================================
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_option VARCHAR(255),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_surveys_active ON surveys(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey ON survey_questions(survey_id, question_order);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id, user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user ON survey_responses(user_id, submitted_at DESC);

-- Add comments
COMMENT ON TABLE surveys IS 'Encuestas configurables para clientes';
COMMENT ON TABLE survey_questions IS 'Preguntas de cada encuesta';
COMMENT ON TABLE survey_responses IS 'Respuestas de usuarios a encuestas';
COMMENT ON COLUMN survey_questions.question_type IS 'Tipos: multiple_choice, text, rating, yes_no';
COMMENT ON COLUMN surveys.max_responses_per_user IS 'Número máximo de veces que un usuario puede responder (1 = solo una vez)';

-- 4. Enable Row Level Security
-- ==========================================
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active surveys" ON surveys;
DROP POLICY IF EXISTS "Admins can manage surveys" ON surveys;
DROP POLICY IF EXISTS "Anyone can view questions of active surveys" ON survey_questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON survey_questions;
DROP POLICY IF EXISTS "Users can view their own responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can submit responses" ON survey_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON survey_responses;

-- Surveys policies
CREATE POLICY "Anyone can view active surveys"
  ON surveys
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND start_date <= NOW()
    AND end_date >= NOW()
  );

CREATE POLICY "Admins can manage surveys"
  ON surveys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".id = auth.uid()
      AND "Users".rol IN ('admin', 'empleado')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".id = auth.uid()
      AND "Users".rol IN ('admin', 'empleado')
    )
  );

-- Survey questions policies
CREATE POLICY "Anyone can view questions of active surveys"
  ON survey_questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM surveys
      WHERE surveys.id = survey_questions.survey_id
      AND surveys.is_active = true
      AND surveys.start_date <= NOW()
      AND surveys.end_date >= NOW()
    )
  );

CREATE POLICY "Admins can manage questions"
  ON survey_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".id = auth.uid()
      AND "Users".rol IN ('admin', 'empleado')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".id = auth.uid()
      AND "Users".rol IN ('admin', 'empleado')
    )
  );

-- Survey responses policies
CREATE POLICY "Users can view their own responses"
  ON survey_responses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can submit responses"
  ON survey_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all responses"
  ON survey_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".id = auth.uid()
      AND "Users".rol IN ('admin', 'empleado')
    )
  );

-- 5. Create triggers for updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_surveys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_surveys_updated_at ON surveys;

CREATE TRIGGER trigger_update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW
  EXECUTE FUNCTION update_surveys_updated_at();

-- 6. Insert sample survey
-- ==========================================
DO $$
DECLARE
  sample_survey_id UUID;
BEGIN
  -- Insert sample survey
  INSERT INTO surveys (title, description, start_date, end_date, is_active, max_responses_per_user)
  VALUES (
    'Encuesta de Satisfacción - Muscle Up GYM',
    'Ayúdanos a mejorar nuestros servicios respondiendo esta breve encuesta.',
    NOW(),
    NOW() + INTERVAL '30 days',
    true,
    1
  )
  RETURNING id INTO sample_survey_id;

  -- Insert sample questions
  INSERT INTO survey_questions (survey_id, question_text, question_type, options, is_required, question_order)
  VALUES
    (
      sample_survey_id,
      '¿Cómo calificarías tu experiencia general en el gimnasio?',
      'rating',
      NULL,
      true,
      1
    ),
    (
      sample_survey_id,
      '¿Qué tan satisfecho estás con la limpieza de las instalaciones?',
      'multiple_choice',
      '["Muy satisfecho", "Satisfecho", "Neutral", "Insatisfecho", "Muy insatisfecho"]'::jsonb,
      true,
      2
    ),
    (
      sample_survey_id,
      '¿Recomendarías nuestro gimnasio a un amigo?',
      'yes_no',
      NULL,
      true,
      3
    ),
    (
      sample_survey_id,
      '¿Qué podríamos mejorar? (Opcional)',
      'text',
      NULL,
      false,
      4
    );
END $$;

-- 7. Verification queries (optional)
-- ==========================================
-- SELECT * FROM surveys;
-- SELECT * FROM survey_questions ORDER BY survey_id, question_order;
-- SELECT COUNT(*) as total_responses FROM survey_responses;
