-- Crear tabla de grupos musculares
CREATE TABLE IF NOT EXISTS muscle_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de ejercicios
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Compuesto, Aislamiento
    primary_muscles TEXT[], -- Array de músculos primarios
    secondary_muscles TEXT[], -- Array de músculos secundarios
    material VARCHAR(255), -- Material necesario
    level VARCHAR(50), -- Principiante, Intermedio, Avanzado
    muscle_group_id UUID REFERENCES muscle_groups(id) ON DELETE CASCADE,

    -- Detalles del ejercicio
    initial_position TEXT, -- Posición inicial
    execution_eccentric TEXT, -- Fase excéntrica
    execution_isometric TEXT, -- Fase isométrica
    execution_concentric TEXT, -- Fase concéntrica
    common_errors TEXT[], -- Errores comunes
    contraindications TEXT[], -- Contraindicaciones clínicas

    -- Metadata
    video_url TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de variantes de ejercicios
CREATE TABLE IF NOT EXISTS exercise_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    type VARCHAR(100), -- Por disponibilidad, Por seguridad
    name VARCHAR(255), -- Nombre de la variante
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejor performance
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group_id);
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_exercises_active ON exercises(is_active);
CREATE INDEX idx_exercise_variants_exercise ON exercise_variants(exercise_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_muscle_groups_updated_at
    BEFORE UPDATE ON muscle_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insertar grupos musculares iniciales
INSERT INTO muscle_groups (name, description) VALUES
    ('CUÁDRICEPS', 'Músculos de la parte frontal del muslo'),
    ('GLÚTEOS', 'Músculos de los glúteos'),
    ('ISQUIOTIBIALES', 'Músculos de la parte posterior del muslo'),
    ('PECTORALES', 'Músculos del pecho'),
    ('ESPALDA', 'Músculos de la espalda'),
    ('HOMBROS', 'Músculos deltoides'),
    ('BÍCEPS', 'Músculos del brazo frontal'),
    ('TRÍCEPS', 'Músculos del brazo posterior'),
    ('ABDOMINALES', 'Músculos del core'),
    ('PANTORRILLAS', 'Músculos de la pantorrilla')
ON CONFLICT (name) DO NOTHING;

-- Función para buscar ejercicios
CREATE OR REPLACE FUNCTION search_exercises(
    search_term TEXT DEFAULT NULL,
    muscle_group_filter UUID DEFAULT NULL,
    level_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type VARCHAR,
    primary_muscles TEXT[],
    secondary_muscles TEXT[],
    material VARCHAR,
    level VARCHAR,
    muscle_group_id UUID,
    muscle_group_name VARCHAR,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        e.type,
        e.primary_muscles,
        e.secondary_muscles,
        e.material,
        e.level,
        e.muscle_group_id,
        mg.name as muscle_group_name,
        e.is_active
    FROM exercises e
    LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
    WHERE
        e.is_active = true
        AND (search_term IS NULL OR e.name ILIKE '%' || search_term || '%')
        AND (muscle_group_filter IS NULL OR e.muscle_group_id = muscle_group_filter)
        AND (level_filter IS NULL OR e.level = level_filter)
    ORDER BY mg.name, e.name;
END;
$$ LANGUAGE plpgsql;

-- Políticas RLS (Row Level Security)
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_variants ENABLE ROW LEVEL SECURITY;

-- Política de lectura para todos los usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden ver grupos musculares"
    ON muscle_groups FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Usuarios autenticados pueden ver ejercicios activos"
    ON exercises FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY "Usuarios autenticados pueden ver variantes"
    ON exercise_variants FOR SELECT
    TO authenticated
    USING (true);

-- Políticas de escritura solo para admins (basadas en rol)
CREATE POLICY "Solo admins pueden insertar grupos musculares"
    ON muscle_groups FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'empleado'));

CREATE POLICY "Solo admins pueden actualizar grupos musculares"
    ON muscle_groups FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'empleado'));

CREATE POLICY "Solo admins pueden eliminar grupos musculares"
    ON muscle_groups FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'empleado'));

CREATE POLICY "Solo admins pueden insertar ejercicios"
    ON exercises FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'empleado'));

CREATE POLICY "Solo admins pueden actualizar ejercicios"
    ON exercises FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'empleado'));

CREATE POLICY "Solo admins pueden eliminar ejercicios"
    ON exercises FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'empleado'));

CREATE POLICY "Solo admins pueden gestionar variantes"
    ON exercise_variants FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' IN ('admin', 'empleado'))
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'empleado'));