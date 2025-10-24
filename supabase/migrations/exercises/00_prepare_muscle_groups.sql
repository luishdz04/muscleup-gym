-- ==============================================================================
-- SCRIPT DE PREPARACIÓN: GRUPOS MUSCULARES Y ESTRUCTURA BASE
-- ==============================================================================
-- Descripción: Crea la estructura base de tablas para ejercicios y grupos musculares
-- Fecha: 2025-10-23
-- ==============================================================================

-- Tabla de grupos musculares
CREATE TABLE IF NOT EXISTS muscle_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de ejercicios
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'Compuesto' o 'Aislamiento'
    primary_muscles TEXT[] NOT NULL,
    secondary_muscles TEXT[],
    material VARCHAR(255),
    level VARCHAR(50), -- 'Principiante', 'Intermedio', 'Avanzado', 'Élite'
    muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE,
    initial_position TEXT,
    execution_eccentric TEXT,
    execution_isometric TEXT,
    execution_concentric TEXT,
    common_errors TEXT[],
    contraindications TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de variantes de ejercicios
CREATE TABLE IF NOT EXISTS exercise_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    type VARCHAR(50), -- 'disponibilidad' o 'seguridad'
    name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group_id);
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(type);
CREATE INDEX IF NOT EXISTS idx_exercises_level ON exercises(level);
CREATE INDEX IF NOT EXISTS idx_exercise_variants_exercise ON exercise_variants(exercise_id);

-- ==============================================================================
-- INSERTAR GRUPOS MUSCULARES
-- ==============================================================================

INSERT INTO muscle_groups (name, description) VALUES
('Cuádriceps', 'Grupo muscular anterior del muslo: Recto Femoral, Vasto Medial, Vasto Lateral, Vasto Intermedio'),
('Isquiotibiales', 'Grupo muscular posterior del muslo: Bíceps femoral, Semitendinoso, Semimembranoso'),
('Glúteos', 'Grupo muscular de la cadera: Glúteo mayor, Glúteo medio, Glúteo menor'),
('Deltoides Medial', 'Porción media del músculo deltoides (hombro)'),
('Core', 'Musculatura del tronco: Recto abdominal, Oblicuos, Transverso del abdomen, Erectores espinales'),
('Tríceps', 'Músculo posterior del brazo: Cabeza lateral, Cabeza medial, Cabeza larga')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- COMENTARIOS EN TABLAS
-- ==============================================================================

COMMENT ON TABLE muscle_groups IS 'Grupos musculares principales para categorización de ejercicios';
COMMENT ON TABLE exercises IS 'Biblioteca completa de ejercicios MUPAI con información detallada';
COMMENT ON TABLE exercise_variants IS 'Variantes de ejercicios por disponibilidad de material y seguridad';

COMMENT ON COLUMN exercises.type IS 'Tipo de ejercicio: Compuesto (multi-articular) o Aislamiento (mono-articular)';
COMMENT ON COLUMN exercises.level IS 'Nivel de dificultad: Principiante, Intermedio, Avanzado o Élite';
COMMENT ON COLUMN exercises.primary_muscles IS 'Músculos principales trabajados en el ejercicio';
COMMENT ON COLUMN exercises.secondary_muscles IS 'Músculos secundarios o sinergistas';

-- ==============================================================================
-- FIN DEL SCRIPT DE PREPARACIÓN
-- ==============================================================================
