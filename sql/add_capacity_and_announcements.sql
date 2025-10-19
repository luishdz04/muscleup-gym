-- ==========================================
-- MIGRATION: Add Capacity Tracking & Announcements
-- ==========================================

-- 1. Add max_capacity to gym_settings
-- ==========================================
ALTER TABLE gym_settings
ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 100;

COMMENT ON COLUMN gym_settings.max_capacity IS 'Capacidad máxima del gimnasio (número de personas)';


-- 2. Create client_announcements table
-- ==========================================
CREATE TABLE IF NOT EXISTS client_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  priority INTEGER NOT NULL DEFAULT 0, -- Higher number = higher priority
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_client_announcements_active
  ON client_announcements(is_active, priority DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_announcements_dates
  ON client_announcements(start_date, end_date);

-- Add comments
COMMENT ON TABLE client_announcements IS 'Mensajes y anuncios para mostrar a los clientes en el dashboard';
COMMENT ON COLUMN client_announcements.type IS 'Tipo de mensaje: info, warning, success, error';
COMMENT ON COLUMN client_announcements.priority IS 'Prioridad de visualización (mayor número = mayor prioridad)';


-- 3. Enable Row Level Security
-- ==========================================
ALTER TABLE client_announcements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active announcements" ON client_announcements;
DROP POLICY IF EXISTS "Admins and employees can insert announcements" ON client_announcements;
DROP POLICY IF EXISTS "Admins and employees can update announcements" ON client_announcements;
DROP POLICY IF EXISTS "Admins can delete announcements" ON client_announcements;

-- Policy: Anyone authenticated can read active announcements
CREATE POLICY "Anyone can view active announcements"
  ON client_announcements
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Only admins and employees can insert
CREATE POLICY "Admins and employees can insert announcements"
  ON client_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".id = auth.uid()
      AND "Users".rol IN ('admin', 'empleado')
    )
  );

-- Policy: Only admins and employees can update
CREATE POLICY "Admins and employees can update announcements"
  ON client_announcements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".id = auth.uid()
      AND "Users".rol IN ('admin', 'empleado')
    )
  );

-- Policy: Only admins can delete
CREATE POLICY "Admins can delete announcements"
  ON client_announcements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Users"
      WHERE "Users".id = auth.uid()
      AND "Users".rol = 'admin'
    )
  );


-- 4. Create trigger for updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_client_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_announcements_updated_at ON client_announcements;

CREATE TRIGGER trigger_update_client_announcements_updated_at
  BEFORE UPDATE ON client_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_client_announcements_updated_at();


-- 5. Insert sample announcements
-- ==========================================
INSERT INTO client_announcements (title, message, type, priority, is_active)
VALUES
  (
    '¡Bienvenido a Muscle Up GYM!',
    'Estamos felices de tenerte aquí. Recuerda mantener tu membresía activa para disfrutar de todas nuestras instalaciones y servicios.',
    'success',
    10,
    true
  ),
  (
    'Horarios Especiales',
    'Los días festivos el gimnasio tiene horario especial. Verifica la sección de configuración o pregunta en recepción.',
    'info',
    5,
    true
  ),
  (
    'Normas del Gimnasio',
    'Por favor respeta las normas: limpia el equipo después de usarlo, devuelve las pesas a su lugar y respeta los espacios designados.',
    'warning',
    3,
    true
  )
ON CONFLICT DO NOTHING;


-- 6. Verification queries (optional - comment out in production)
-- ==========================================
-- SELECT * FROM gym_settings;
-- SELECT * FROM client_announcements ORDER BY priority DESC, created_at DESC;
