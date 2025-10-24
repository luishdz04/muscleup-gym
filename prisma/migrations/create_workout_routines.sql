-- =============================================
-- SISTEMA DE RUTINAS DE EJERCICIOS
-- =============================================
-- Fecha: 2025-10-24
-- Descripción: Sistema completo de rutinas con ejercicios ordenables
-- =============================================

-- Tabla principal de rutinas
CREATE TABLE IF NOT EXISTS workout_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(50), -- Principiante, Intermedio, Avanzado
    estimated_duration INTEGER, -- Duración estimada en minutos
    muscle_group_focus VARCHAR(255), -- Grupos musculares principales
    created_by UUID REFERENCES "Users"(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false, -- Si es visible para todos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ejercicios dentro de cada rutina (con orden y detalles)
CREATE TABLE IF NOT EXISTS routine_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    routine_id UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL, -- Orden del ejercicio en la rutina
    sets INTEGER NOT NULL DEFAULT 3, -- Número de series
    reps VARCHAR(50), -- Repeticiones: "10-12", "15", "Al fallo", etc.
    rest_seconds INTEGER, -- Descanso en segundos entre series
    notes TEXT, -- Notas específicas del ejercicio en esta rutina
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(routine_id, order_index) -- Un solo ejercicio por posición
);

-- Tabla de asignación de rutinas a usuarios (clientes)
CREATE TABLE IF NOT EXISTS user_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
    routine_id UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES "Users"(id) ON DELETE SET NULL, -- Quién asignó la rutina
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date DATE, -- Fecha de inicio de la rutina
    end_date DATE, -- Fecha de finalización (opcional)
    status VARCHAR(50) DEFAULT 'active', -- active, completed, paused
    notes TEXT, -- Notas del entrenador para el cliente
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, routine_id, assigned_date)
);

-- Tabla de progreso de rutinas (registro de entrenamientos)
CREATE TABLE IF NOT EXISTS routine_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_routine_id UUID NOT NULL REFERENCES user_routines(id) ON DELETE CASCADE,
    routine_exercise_id UUID NOT NULL REFERENCES routine_exercises(id) ON DELETE CASCADE,
    workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_sets INTEGER, -- Sets completados
    weight_used DECIMAL(10,2), -- Peso utilizado (kg)
    actual_reps VARCHAR(50), -- Reps realizadas por set: "12,10,8"
    notes TEXT, -- Notas del cliente sobre el ejercicio
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_workout_routines_created_by ON workout_routines(created_by);
CREATE INDEX IF NOT EXISTS idx_workout_routines_is_active ON workout_routines(is_active);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_exercise_id ON routine_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_order ON routine_exercises(routine_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_routines_user_id ON user_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_routines_routine_id ON user_routines(routine_id);
CREATE INDEX IF NOT EXISTS idx_user_routines_status ON user_routines(user_id, status);
CREATE INDEX IF NOT EXISTS idx_routine_progress_user_routine ON routine_progress(user_routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_progress_workout_date ON routine_progress(workout_date);

-- Comentarios de documentación
COMMENT ON TABLE workout_routines IS 'Rutinas de ejercicios creadas por entrenadores';
COMMENT ON TABLE routine_exercises IS 'Ejercicios individuales dentro de cada rutina con orden y parámetros';
COMMENT ON TABLE user_routines IS 'Asignación de rutinas a usuarios específicos';
COMMENT ON TABLE routine_progress IS 'Registro de progreso y completitud de ejercicios';

COMMENT ON COLUMN workout_routines.estimated_duration IS 'Duración estimada en minutos';
COMMENT ON COLUMN routine_exercises.order_index IS 'Orden del ejercicio (0-indexed)';
COMMENT ON COLUMN routine_exercises.reps IS 'Puede ser número fijo, rango (10-12) o texto (Al fallo)';
COMMENT ON COLUMN routine_exercises.rest_seconds IS 'Tiempo de descanso entre series en segundos';
COMMENT ON COLUMN user_routines.status IS 'Estado: active, completed, paused';
COMMENT ON COLUMN routine_progress.actual_reps IS 'Reps por set separadas por comas: 12,10,8';

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_routine_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workout_routines_updated_at
    BEFORE UPDATE ON workout_routines
    FOR EACH ROW
    EXECUTE FUNCTION update_routine_updated_at();

CREATE TRIGGER update_routine_exercises_updated_at
    BEFORE UPDATE ON routine_exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_routine_updated_at();

CREATE TRIGGER update_user_routines_updated_at
    BEFORE UPDATE ON user_routines
    FOR EACH ROW
    EXECUTE FUNCTION update_routine_updated_at();
