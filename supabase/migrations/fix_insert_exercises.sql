-- =====================================================
-- SCRIPT CORREGIDO PARA INSERCIÓN DE EJERCICIOS
-- =====================================================
-- Soluciona el error: "cannot determine type of empty array"
-- Usa ARRAY[]::TEXT[] para arrays vacíos

-- Función auxiliar para obtener el ID del grupo muscular
CREATE OR REPLACE FUNCTION get_muscle_group_id(group_name VARCHAR)
RETURNS UUID AS $$
DECLARE
    group_id UUID;
BEGIN
    SELECT id INTO group_id FROM muscle_groups WHERE name = group_name;
    IF group_id IS NULL THEN
        INSERT INTO muscle_groups (name) VALUES (group_name) RETURNING id INTO group_id;
    END IF;
    RETURN group_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INSERCIÓN DE EJERCICIOS DE CUÁDRICEPS
-- =====================================================
DO $$
DECLARE
    cuadriceps_id UUID;
    exercise_id UUID;
BEGIN
    -- Obtener o crear el grupo muscular
    cuadriceps_id := get_muscle_group_id('CUÁDRICEPS');

    -- 1. Sentadilla Goblet
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Sentadilla Goblet (flexión de rodilla)',
        'Compuesto',
        ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral']::TEXT[],
        ARRAY['Glúteo Mayor', 'Core']::TEXT[],
        'Mancuerna o Kettlebell',
        'Principiante / Intermedio',
        cuadriceps_id,
        'De pie, pies al ancho de hombros con puntas 10–20° afuera. Sostén la mancuerna contra el pecho con ambas manos. Core firme y columna neutra.',
        'Inhala y baja flexionando rodillas y cadera. Rodillas se proyectan hacia adelante sobre el tobillo y pueden pasar la punta del pie (énfasis cuádriceps). Torso erguido.',
        'Pausa 1 s en paralelo o más abajo, rodillas alineadas con pies, core activo.',
        'Exhala y extiende rodillas y cadera empujando con planta completa, priorizando los talones. Ritmo controlado (1–2 s).',
        ARRAY['Rodillas colapsando', 'talones elevados', 'inclinar torso en exceso']::TEXT[],
        ARRAY['Gonartrosis avanzada', 'lesión de LCA/menisco', 'cirugía de rodilla reciente']::TEXT[]
    ) RETURNING id INTO exercise_id;

    -- Insertar variantes
    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Sentadilla libre', 'Sin peso adicional o con barra'),
        (exercise_id, 'Por disponibilidad', 'Prensa de piernas', 'En máquina de prensa'),
        (exercise_id, 'Por seguridad', 'Extensión de piernas', 'Movimiento aislado más seguro'),
        (exercise_id, 'Por seguridad', 'Prensa parcial', 'Rango de movimiento reducido');

    -- 2. Desplante estático con apoyo
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Desplante estático con apoyo (flexión de rodilla)',
        'Compuesto',
        ARRAY['Recto Femoral', 'Vasto Medial']::TEXT[],
        ARRAY['Glúteo Mayor', 'Core']::TEXT[],
        'Mancuernas o peso corporal',
        'Principiante / Intermedio',
        cuadriceps_id,
        'Un pie adelante y otro atrás en zancada. Torso recto, core firme, mancuernas a los costados.',
        'Inhala y baja hasta ~90° en rodilla delantera. Rodilla sobrepasa la línea del tobillo, avanzando hacia la punta del pie (énfasis cuádriceps).',
        'Pausa breve abajo, torso erguido, rodilla alineada en dirección del pie.',
        'Exhala y empuja con talón delantero extendiendo rodilla y cadera en 1–2 s.',
        ARRAY['Base estrecha', 'inclinar torso', 'peso excesivo en pierna trasera']::TEXT[],
        ARRAY['Inestabilidad ligamentaria', 'gonartrosis severa', 'déficits de equilibrio']::TEXT[]
    ) RETURNING id INTO exercise_id;

    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Desplante con barra', 'Con barra sobre hombros'),
        (exercise_id, 'Por disponibilidad', 'Desplante en Smith', 'En máquina Smith'),
        (exercise_id, 'Por seguridad', 'Prensa unilateral', 'Una pierna a la vez'),
        (exercise_id, 'Por seguridad', 'Extensión de piernas', 'Movimiento aislado');

    -- 3. Sentadilla en máquina perfecta
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Sentadilla en máquina perfecta (flexión de rodilla)',
        'Compuesto',
        ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral']::TEXT[],
        ARRAY['Glúteo Mayor', 'Aductores', 'Core']::TEXT[],
        'Máquina Perfecta',
        'Principiante / Intermedio',
        cuadriceps_id,
        'Espalda apoyada en respaldo, pies al ancho de hombros en plataforma, core firme.',
        'Inhala y baja flexionando rodillas lentamente hasta 90° o más. Rodillas avanzan hacia adelante (énfasis cuádriceps).',
        'Pausa breve abajo, espalda firme, rodillas alineadas.',
        'Exhala y extiende rodillas empujando con planta completa en 1–2 s.',
        ARRAY['Separar espalda del respaldo', 'empujar con puntas', 'recortar rango']::TEXT[],
        ARRAY['Gonartrosis avanzada', 'cirugía de rodilla reciente', 'hernia discal activa']::TEXT[]
    );

    -- 4. Sentadilla Hack
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Sentadilla Hack (flexión de rodilla)',
        'Compuesto',
        ARRAY['Recto Femoral', 'Vasto Lateral']::TEXT[],
        ARRAY['Glúteo Mayor', 'Core']::TEXT[],
        'Máquina Hack',
        'Intermedio / Avanzado',
        cuadriceps_id,
        'Espalda y hombros apoyados en respaldo, pies firmes en plataforma, core activado.',
        'Inhala y baja lento hasta paralelo, rodillas avanzan hacia adelante (énfasis cuádriceps).',
        'Pausa 1 s en el fondo, rodillas alineadas, talones firmes.',
        'Exhala y empuja con talones extendiendo rodillas y cadera en 1–2 s.',
        ARRAY['Talones levantados', 'rodillas en valgo', 'recorte de recorrido']::TEXT[],
        ARRAY['Síndrome patelofemoral', 'lesiones meniscales', 'espondilolistesis lumbar']::TEXT[]
    );

    -- 5. Sentadilla Smith
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Sentadilla Smith (flexión de rodilla)',
        'Compuesto',
        ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral']::TEXT[],
        ARRAY['Glúteo Mayor', 'Core']::TEXT[],
        'Máquina Smith',
        'Intermedio / Avanzado',
        cuadriceps_id,
        'Barra en trapecios, pies ligeramente adelantados, torso erguido, core firme.',
        'Inhala y baja en línea recta hasta paralelo. Rodillas avanzan hacia adelante más que en glúteo (énfasis cuádriceps).',
        'Pausa breve en el fondo, torso erguido, rodillas alineadas.',
        'Exhala y extiende rodillas empujando fuerte con talones.',
        ARRAY['Pies demasiado cerca de la barra', 'colapso de rodillas', 'rebotar en el fondo']::TEXT[],
        ARRAY['Pinzamiento femoroacetabular', 'artrosis de rodilla', 'hernia discal']::TEXT[]
    );

    -- 6. Prensa de piernas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Prensa de piernas (flexión de rodilla)',
        'Compuesto',
        ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral', 'Vasto Intermedio']::TEXT[],
        ARRAY['Glúteo Mayor', 'Aductores', 'Isquiotibiales']::TEXT[],
        'Máquina de prensa',
        'Todos',
        cuadriceps_id,
        'Espalda apoyada, pies al ancho de hombros en plataforma, core firme.',
        'Inhala y baja plataforma hasta ~90° flexionando rodillas. Rodillas avanzan al frente (énfasis cuádriceps).',
        'Pausa breve abajo, rodillas alineadas, espalda fija.',
        'Exhala y extiende rodillas empujando con planta completa.',
        ARRAY['Empujar con puntas', 'despegar la cadera', 'recortar recorrido']::TEXT[],
        ARRAY['Gonartrosis avanzada', 'lesión de menisco/LCA', 'hernia discal activa']::TEXT[]
    );

    -- 7. Escalón con mancuernas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Escalón con mancuernas (flexión de rodilla)',
        'Compuesto',
        ARRAY['Recto Femoral', 'Vasto Medial']::TEXT[],
        ARRAY['Glúteo Mayor', 'Core']::TEXT[],
        'Banco/caja + mancuernas',
        'Intermedio',
        cuadriceps_id,
        'De pie frente a banco estable, mancuernas a los costados, torso recto.',
        'Desde arriba, baja controlado en 2–3 s con pierna de apoyo. Rodilla se proyecta al frente (énfasis cuádriceps).',
        'Pausa breve estabilizando rodilla y cadera.',
        'Exhala y sube empujando con talón delantero hasta extender rodilla.',
        ARRAY['Impulsarse con pierna trasera', 'banco inestable', 'torso inclinado']::TEXT[],
        ARRAY['Déficits de equilibrio', 'lesiones patelofemorales', 'prótesis temprana']::TEXT[]
    );

    -- 8. Escalón en cables
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Escalón en cables (flexión de rodilla)',
        'Compuesto',
        ARRAY['Recto Femoral', 'Vasto Medial']::TEXT[],
        ARRAY['Glúteo Mayor', 'Core']::TEXT[],
        'Polea + banco',
        'Intermedio / Avanzado',
        cuadriceps_id,
        'Frente a banco, cable sujeto a cadera, pie de apoyo sobre banco.',
        'Inhala y baja controlado en 2–3 s, rodilla se proyecta al frente (énfasis cuádriceps).',
        'Pausa 1 s abajo estabilizando cadera y rodilla.',
        'Exhala y sube empujando con talón contra resistencia del cable.',
        ARRAY['Impulso con pierna trasera', 'rodilla en valgo', 'perder estabilidad']::TEXT[],
        ARRAY['Déficits de equilibrio', 'artrosis severa', 'dolor patelofemoral']::TEXT[]
    );

    -- 9. Sentadilla búlgara en Smith
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Sentadilla búlgara en Smith (flexión de rodilla)',
        'Compuesto unilateral',
        ARRAY['Recto Femoral', 'Vasto Medial']::TEXT[],
        ARRAY['Glúteo Mayor', 'Core']::TEXT[],
        'Máquina Smith + banco',
        'Intermedio',
        cuadriceps_id,
        'Barra en trapecios, pie trasero elevado en banco, torso erguido.',
        'Inhala y baja en 2–3 s, rodilla delantera avanza (énfasis cuádriceps).',
        'Pausa breve en 90°.',
        'Exhala y sube empujando con talón delantero.',
        ARRAY['Rodilla en valgo', 'peso en pierna trasera', 'torso inclinado']::TEXT[],
        ARRAY['Gonartrosis avanzada', 'inestabilidad ligamentaria', 'déficits de equilibrio']::TEXT[]
    );

    -- 10. Extensión de piernas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
        initial_position, execution_eccentric, execution_isometric, execution_concentric,
        common_errors, contraindications
    ) VALUES (
        'Extensión de piernas (flexión de rodilla)',
        'Aislado',
        ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral', 'Vasto Intermedio']::TEXT[],
        ARRAY[]::TEXT[], -- Array vacío con tipo explícito
        'Máquina de extensión',
        'Todos',
        cuadriceps_id,
        'Sentado en máquina, espalda firme, rodillas a 90°, tobillos asegurados.',
        'Inhala y baja controlado en 2–3 s hasta 90°.',
        'Pausa 1 s arriba contrayendo cuádriceps.',
        'Exhala y extiende rodillas hasta casi bloquear.',
        ARRAY['Arquear espalda', 'extender muy rápido', 'rango corto']::TEXT[],
        ARRAY['Tendinopatía rotuliana aguda', 'gonartrosis severa', 'cirugía reciente de rodilla']::TEXT[]
    );

    -- Mensaje de confirmación
    RAISE NOTICE 'Ejercicios de cuádriceps insertados correctamente';

END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
SELECT
    mg.name as grupo_muscular,
    COUNT(e.id) as total_ejercicios
FROM muscle_groups mg
LEFT JOIN exercises e ON mg.id = e.muscle_group_id
WHERE mg.name = 'CUÁDRICEPS'
GROUP BY mg.id, mg.name;

-- Eliminar función temporal si existe
DROP FUNCTION IF EXISTS get_muscle_group_id(VARCHAR);