-- Script para insertar ejercicios de ejemplo desde la biblioteca MUPAI
-- NOTA: Ejecutar DESPUÉS del script create_exercises_tables.sql

-- Función auxiliar para obtener el ID del grupo muscular
CREATE OR REPLACE FUNCTION get_muscle_group_id(group_name VARCHAR)
RETURNS UUID AS $$
DECLARE
    group_id UUID;
BEGIN
    SELECT id INTO group_id FROM muscle_groups WHERE name = group_name;
    RETURN group_id;
END;
$$ LANGUAGE plpgsql;

-- EJERCICIOS DE CUÁDRICEPS
DO $$
DECLARE
    quadriceps_id UUID;
    exercise_id UUID;
BEGIN
    quadriceps_id := get_muscle_group_id('CUÁDRICEPS');

    -- 1. Sentadilla Goblet
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Sentadilla Goblet (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps (Recto Femoral, Vasto Medial, Vasto Lateral)'],
        ARRAY['Glúteo Mayor', 'Core'],
        'Mancuerna o Kettlebell',
        'Principiante / Intermedio',
        quadriceps_id,
        'De pie, pies al ancho de hombros con puntas 10–20° afuera. Sostén la mancuerna contra el pecho con ambas manos. Core firme y columna neutra.',
        'Inhala y baja flexionando rodillas y cadera. Rodillas se proyectan hacia adelante sobre el tobillo y pueden pasar la punta del pie (énfasis cuádriceps). Torso erguido.',
        'Pausa 1 s en paralelo o más abajo, rodillas alineadas con pies, core activo.',
        'Exhala y extiende rodillas y cadera empujando con planta completa, priorizando los talones. Ritmo controlado (1–2 s).',
        ARRAY['Rodillas colapsando', 'talones elevados', 'inclinar torso en exceso'],
        ARRAY['Gonartrosis avanzada', 'lesión de LCA/menisco', 'cirugía de rodilla reciente'],
        true
    ) RETURNING id INTO exercise_id;

    -- Variantes para Sentadilla Goblet
    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Sentadilla libre', 'Sin peso adicional o con barra'),
        (exercise_id, 'Por disponibilidad', 'Prensa de piernas', 'En máquina'),
        (exercise_id, 'Por seguridad', 'Extensión de piernas', 'Movimiento aislado'),
        (exercise_id, 'Por seguridad', 'Prensa parcial', 'Rango de movimiento reducido');

    -- 2. Desplante estático con apoyo
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Desplante estático con apoyo (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps (Recto Femoral, Vasto Medial)'],
        ARRAY['Glúteo Mayor', 'Core'],
        'Mancuernas o peso corporal',
        'Principiante / Intermedio',
        quadriceps_id,
        'Un pie adelante y otro atrás en zancada. Torso recto, core firme, mancuernas a los costados.',
        'Inhala y baja hasta ~90° en rodilla delantera. Rodilla sobrepasa la línea del tobillo, avanzando hacia la punta del pie (énfasis cuádriceps).',
        'Pausa breve abajo, torso erguido, rodilla alineada en dirección del pie.',
        'Exhala y empuja con talón delantero extendiendo rodilla y cadera en 1–2 s.',
        ARRAY['Base estrecha', 'inclinar torso', 'peso excesivo en pierna trasera'],
        ARRAY['Inestabilidad ligamentaria', 'gonartrosis severa', 'déficits de equilibrio'],
        true
    ) RETURNING id INTO exercise_id;

    -- Variantes para Desplante estático
    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Desplante con barra', 'Con barra sobre hombros'),
        (exercise_id, 'Por disponibilidad', 'Desplante en Smith', 'En máquina Smith'),
        (exercise_id, 'Por seguridad', 'Prensa unilateral', 'Una pierna a la vez'),
        (exercise_id, 'Por seguridad', 'Extensión de piernas', 'Movimiento aislado');

    -- 3. Sentadilla en máquina perfecta
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Sentadilla en máquina perfecta (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps (Recto Femoral, Vasto Medial, Vasto Lateral)'],
        ARRAY['Glúteo Mayor', 'Aductores', 'Core'],
        'Máquina Perfecta',
        'Principiante / Intermedio',
        quadriceps_id,
        'Espalda apoyada en respaldo, pies al ancho de hombros en plataforma, core firme.',
        'Inhala y baja flexionando rodillas lentamente hasta 90° o más. Rodillas avanzan hacia adelante (énfasis cuádriceps).',
        'Pausa breve abajo, espalda firme, rodillas alineadas.',
        'Exhala y extiende rodillas empujando con planta completa en 1–2 s.',
        ARRAY['Separar espalda del respaldo', 'empujar con puntas', 'recortar rango'],
        ARRAY['Gonartrosis avanzada', 'cirugía de rodilla reciente', 'hernia discal activa'],
        true
    );

    -- 4. Sentadilla Hack
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Sentadilla Hack (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps (Recto Femoral, Vasto Lateral)'],
        ARRAY['Glúteo Mayor', 'Core'],
        'Máquina Hack',
        'Intermedio / Avanzado',
        quadriceps_id,
        'Espalda y hombros apoyados en respaldo, pies firmes en plataforma, core activado.',
        'Inhala y baja lento hasta paralelo, rodillas avanzan hacia adelante (énfasis cuádriceps).',
        'Pausa 1 s en el fondo, rodillas alineadas, talones firmes.',
        'Exhala y empuja con talones extendiendo rodillas y cadera en 1–2 s.',
        ARRAY['Talones levantados', 'rodillas en valgo', 'recorte de recorrido'],
        ARRAY['Gonartrosis grave', 'dolor patelofemoral', 'lesión de LCA reciente'],
        true
    );
END $$;

-- EJERCICIOS DE GLÚTEOS
DO $$
DECLARE
    glutes_id UUID;
    exercise_id UUID;
BEGIN
    glutes_id := get_muscle_group_id('GLÚTEOS');

    -- 1. Sentadilla sumo con mancuerna
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Sentadilla sumo con mancuerna (extensión de cadera)',
        'Compuesto',
        ARRAY['Glúteo mayor', 'aductores'],
        ARRAY['Cuádriceps', 'core', 'erectores espinales'],
        'Mancuerna o kettlebell',
        'Principiante – Intermedio',
        glutes_id,
        'Pies más anchos que hombros, puntas hacia fuera 30-45°, mancuerna colgando entre piernas.',
        'Inhala, siéntate hacia atrás flexionando cadera y rodillas, manteniendo torso erguido.',
        'Pausa 1 s en paralelo con rodillas alineadas sobre pies.',
        'Exhala, empuja con talones extendiendo cadera y rodillas simultáneamente.',
        ARRAY['Rodillas colapsando hacia dentro', 'inclinarse demasiado hacia adelante', 'rango incompleto'],
        ARRAY['Dolor en aductores', 'pinzamiento femoroacetabular', 'lesiones de cadera no rehabilitadas'],
        true
    ) RETURNING id INTO exercise_id;

    -- Variantes para Sentadilla sumo
    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Sentadilla sumo con barra', 'Con barra sobre hombros'),
        (exercise_id, 'Por disponibilidad', 'en máquina Smith', 'En máquina Smith'),
        (exercise_id, 'Por seguridad', 'Sin peso adicional', 'Solo peso corporal'),
        (exercise_id, 'Por seguridad', 'con apoyo de TRX', 'Con sistema de suspensión');

    -- 2. Puente de glúteo básico
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Puente de glúteo básico',
        'Aislamiento',
        ARRAY['Glúteo mayor'],
        ARRAY['Isquiotibiales', 'core'],
        'Peso corporal',
        'Principiante – Todos',
        glutes_id,
        'Tumbado boca arriba, rodillas flexionadas, pies plantados al ancho de cadera, brazos relajados.',
        'Inhala, baja cadera controladamente sin tocar completamente el suelo.',
        'Mantén contracción máxima por 1–2 s.',
        'Exhala, aprieta glúteos y eleva cadera hasta formar línea recta.',
        ARRAY['Elevar demasiado alto (hiperextensión lumbar)', 'usar impulso', 'no contraer glúteos adecuadamente'],
        ARRAY['Dolor lumbar agudo', 'hernia discal sintomática'],
        true
    );
END $$;

-- EJERCICIOS DE PECTORALES (Ejemplo adicional)
DO $$
DECLARE
    chest_id UUID;
    exercise_id UUID;
BEGIN
    chest_id := get_muscle_group_id('PECTORALES');

    -- Press de banca con barra
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Press de banca con barra',
        'Compuesto',
        ARRAY['Pectoral mayor', 'Pectoral menor'],
        ARRAY['Tríceps', 'Deltoides anterior'],
        'Barra y banco',
        'Intermedio / Avanzado',
        chest_id,
        'Acostado en banco, pies firmes en el suelo, barra sobre el pecho con agarre ligeramente más ancho que hombros.',
        'Inhala y baja la barra controladamente hacia el pecho, codos a 45-75° del torso.',
        'Ligera pausa con la barra cerca del pecho sin rebotar.',
        'Exhala y empuja la barra hacia arriba hasta extensión completa de brazos.',
        ARRAY['Rebotar la barra en el pecho', 'arquear excesivamente la espalda', 'bajar muy rápido'],
        ARRAY['Lesión de hombro', 'desgarro pectoral previo', 'inestabilidad glenohumeral'],
        true
    );
END $$;

-- Eliminar función temporal
DROP FUNCTION IF EXISTS get_muscle_group_id(VARCHAR);

-- Verificar inserciones
SELECT mg.name as muscle_group, COUNT(e.id) as exercise_count
FROM muscle_groups mg
LEFT JOIN exercises e ON mg.id = e.muscle_group_id
GROUP BY mg.id, mg.name
ORDER BY mg.name;