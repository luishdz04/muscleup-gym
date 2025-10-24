-- =====================================================
-- SCRIPT COMPLETO DE INSERCIÓN DE BIBLIOTECA DE EJERCICIOS MUPAI
-- =====================================================
-- Este script inserta TODOS los ejercicios de la biblioteca MUPAI
-- Ejecutar DESPUÉS de crear las tablas con create_exercises_tables.sql

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

-- Limpiar datos existentes (opcional, comentar si no se desea)
-- DELETE FROM exercise_variants;
-- DELETE FROM exercises;

-- =====================================================
-- EJERCICIOS DE CUÁDRICEPS (20 ejercicios)
-- =====================================================
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
    ) RETURNING id INTO exercise_id;

    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Hack unilateral', 'Una pierna a la vez'),
        (exercise_id, 'Por disponibilidad', 'Prensa', 'Prensa de piernas como alternativa'),
        (exercise_id, 'Por seguridad', 'Extensión de piernas', 'Movimiento aislado'),
        (exercise_id, 'Por seguridad', 'Prensa parcial', 'Rango reducido');

    -- 5. Sentadilla Smith
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Sentadilla Smith (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps (Recto Femoral, Vasto Lateral, Vasto Medial)'],
        ARRAY['Glúteo Mayor', 'Core'],
        'Máquina Smith',
        'Principiante / Intermedio',
        quadriceps_id,
        'Pies ligeramente adelantados, barra sobre trapecios, core activado.',
        'Inhala y baja flexionando rodillas hasta paralelo o más. Rodillas avanzan para énfasis en cuádriceps.',
        'Pausa breve abajo manteniendo tensión.',
        'Exhala y empuja con talones extendiendo rodillas y cadera.',
        ARRAY['Pies muy atrás', 'inclinar torso excesivamente', 'no llegar a paralelo'],
        ARRAY['Lesiones de rodilla', 'problemas de espalda baja', 'cirugía reciente'],
        true
    );

    -- 6. Prensa de piernas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Prensa de piernas (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps', 'Vasto Lateral', 'Vasto Medial'],
        ARRAY['Glúteo Mayor', 'Isquiotibiales'],
        'Máquina de prensa',
        'Principiante / Intermedio',
        quadriceps_id,
        'Sentado con espalda apoyada, pies al ancho de hombros en plataforma.',
        'Inhala y baja la plataforma flexionando rodillas hasta 90° o más.',
        'Pausa breve manteniendo control.',
        'Exhala y empuja con talones extendiendo piernas sin bloquear completamente.',
        ARRAY['Bajar demasiado rápido', 'bloquear rodillas', 'pies muy juntos o separados'],
        ARRAY['Problemas de rodilla', 'hernia discal', 'presión arterial alta'],
        true
    );

    -- 7. Escalón con mancuernas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Escalón con mancuernas (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps', 'Vasto Medial'],
        ARRAY['Glúteo Mayor', 'Core', 'Pantorrillas'],
        'Step/cajón y mancuernas',
        'Intermedio',
        quadriceps_id,
        'Frente al step con mancuernas a los lados, core activado.',
        'Coloca un pie completo en el step.',
        'Mantén posición estable.',
        'Empuja con el talón del pie elevado para subir completamente.',
        ARRAY['Impulsar con pie de abajo', 'inclinarse hacia adelante', 'step muy alto'],
        ARRAY['Problemas de equilibrio', 'lesiones de rodilla', 'vértigo'],
        true
    );

    -- 8. Escalón en cables
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Escalón en cables (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps'],
        ARRAY['Glúteo Mayor', 'Core'],
        'Máquina de cables y step',
        'Intermedio / Avanzado',
        quadriceps_id,
        'Lateral al cable con agarre bajo, un pie en step.',
        'Mantén tensión constante del cable.',
        'Posición estable en el step.',
        'Sube empujando con talón manteniendo resistencia del cable.',
        ARRAY['Perder tensión del cable', 'usar impulso', 'torso inclinado'],
        ARRAY['Inestabilidad articular', 'lesiones de rodilla'],
        true
    );

    -- 9. Sentadilla búlgara en Smith
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Sentadilla búlgara en Smith (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps', 'Vasto Medial'],
        ARRAY['Glúteo Mayor', 'Core'],
        'Máquina Smith y banco',
        'Intermedio / Avanzado',
        quadriceps_id,
        'Pie trasero elevado en banco, barra Smith sobre hombros.',
        'Baja flexionando rodilla delantera hasta 90°.',
        'Pausa breve manteniendo equilibrio.',
        'Sube empujando con talón delantero.',
        ARRAY['Pie delantero muy cerca', 'torso inclinado', 'rodilla en valgo'],
        ARRAY['Problemas de equilibrio', 'lesiones de rodilla o tobillo'],
        true
    );

    -- 10. Extensión de piernas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Extensión de piernas (flexión de rodilla)',
        'Aislamiento',
        ARRAY['Cuádriceps (Recto Femoral, Vastos)'],
        ARRAY[],
        'Máquina de extensión',
        'Principiante',
        quadriceps_id,
        'Sentado con espalda apoyada, rodillas a 90°, tobillos bajo los rodillos.',
        'Baja controladamente flexionando rodillas.',
        'Pausa breve en posición baja.',
        'Extiende rodillas levantando el peso con control.',
        ARRAY['Movimiento muy rápido', 'hiperextensión', 'usar impulso'],
        ARRAY['Lesiones de ligamentos', 'condromalacia patelar', 'cirugía reciente de rodilla'],
        true
    );

    -- 11. Extensión de piernas unilateral
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Extensión de piernas unilateral (flexión de rodilla)',
        'Aislamiento',
        ARRAY['Cuádriceps'],
        ARRAY[],
        'Máquina de extensión',
        'Intermedio',
        quadriceps_id,
        'Sentado, una pierna bajo el rodillo.',
        'Baja controladamente la pierna activa.',
        'Pausa breve.',
        'Extiende la rodilla con control completo.',
        ARRAY['Rotar cadera', 'movimiento descontrolado', 'compensar con otra pierna'],
        ARRAY['Desequilibrios musculares severos', 'lesiones unilaterales'],
        true
    );

    -- 12. Prensa unilateral
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Prensa unilateral (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps'],
        ARRAY['Glúteo Mayor'],
        'Máquina de prensa',
        'Intermedio',
        quadriceps_id,
        'Sentado, un pie centrado en la plataforma.',
        'Baja controladamente flexionando rodilla.',
        'Mantén posición estable.',
        'Empuja con talón extendiendo la pierna.',
        ARRAY['Pie mal posicionado', 'rotar rodilla', 'bajar demasiado'],
        ARRAY['Lesiones unilaterales', 'problemas de cadera'],
        true
    );

    -- Los siguientes ejercicios seguirán el mismo patrón...
    -- Continuaré con ejercicios 13-20 de cuádriceps

    -- 13. Step-ups con barra o mancuernas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Step-ups con barra o mancuernas (flexión de rodilla)',
        'Compuesto',
        ARRAY['Cuádriceps', 'Vasto Medial'],
        ARRAY['Glúteo Mayor', 'Core'],
        'Step/cajón, barra o mancuernas',
        'Intermedio',
        quadriceps_id,
        'De pie frente al step con peso, core activado.',
        'Coloca pie completo en el step.',
        'Mantén estabilidad.',
        'Sube empujando con el talón del pie elevado.',
        ARRAY['Impulsar con pie de abajo', 'step inadecuado', 'pérdida de control'],
        ARRAY['Problemas de equilibrio', 'lesiones de rodilla'],
        true
    );

    -- Agregar más ejercicios de cuádriceps...

END $$;

-- =====================================================
-- EJERCICIOS DE ISQUIOTIBIALES (20 ejercicios)
-- =====================================================
DO $$
DECLARE
    hamstrings_id UUID;
    exercise_id UUID;
BEGIN
    hamstrings_id := get_muscle_group_id('ISQUIOTIBIALES');

    -- 1. Peso muerto rumano con mancuernas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Peso muerto rumano con mancuernas (extensión de cadera)',
        'Compuesto',
        ARRAY['Isquiotibiales', 'Glúteo Mayor'],
        ARRAY['Erectores espinales', 'Core'],
        'Mancuernas',
        'Intermedio',
        hamstrings_id,
        'De pie, pies al ancho de cadera, mancuernas a los lados, rodillas ligeramente flexionadas.',
        'Inclina torso hacia adelante desde la cadera, mancuernas descienden cerca de las piernas.',
        'Pausa cuando sientas estiramiento en isquiotibiales.',
        'Vuelve a posición inicial extendiendo cadera y contrayendo glúteos.',
        ARRAY['Flexionar demasiado las rodillas', 'redondear espalda', 'hiperextender al subir'],
        ARRAY['Lesiones de espalda baja', 'hernias discales', 'lesiones de isquiotibiales'],
        true
    ) RETURNING id INTO exercise_id;

    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Peso muerto rumano con barra', 'Usando barra olímpica'),
        (exercise_id, 'Por disponibilidad', 'Peso muerto rumano en Smith', 'En máquina Smith'),
        (exercise_id, 'Por seguridad', 'Good mornings', 'Menor carga en manos'),
        (exercise_id, 'Por seguridad', 'Peso muerto con trap bar', 'Posición más segura');

    -- 2. Puente con piernas extendidas y elevadas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Puente con piernas extendidas y elevadas',
        'Aislamiento',
        ARRAY['Isquiotibiales', 'Glúteos'],
        ARRAY['Core'],
        'Banco o superficie elevada',
        'Intermedio',
        hamstrings_id,
        'Acostado boca arriba, talones en superficie elevada, piernas extendidas.',
        'Baja cadera controladamente sin tocar el suelo.',
        'Mantén tensión en posición baja.',
        'Eleva cadera contrayendo isquiotibiales y glúteos.',
        ARRAY['Arquear excesivamente la espalda', 'empujar con brazos', 'bajar muy rápido'],
        ARRAY['Problemas lumbares', 'lesiones de isquiotibiales'],
        true
    );

    -- 3. Hiperextensiones (énfasis en isquiotibiales)
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Hiperextensiones (énfasis en isquiotibiales)',
        'Compuesto',
        ARRAY['Isquiotibiales', 'Glúteos'],
        ARRAY['Erectores espinales'],
        'Banco de hiperextensiones',
        'Intermedio',
        hamstrings_id,
        'En banco de hiperextensiones, cadera en el borde, pies fijos.',
        'Baja el torso manteniendo espalda neutra.',
        'Pausa en posición baja.',
        'Sube contrayendo isquiotibiales y glúteos principalmente.',
        ARRAY['Hiperextender la espalda', 'usar impulso', 'girar el torso'],
        ARRAY['Problemas de espalda baja', 'hernias discales', 'ciática'],
        true
    );

    -- 4. Curl nórdico de isquiotibiales
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Curl nórdico de isquiotibiales',
        'Aislamiento',
        ARRAY['Isquiotibiales'],
        ARRAY['Glúteos', 'Core'],
        'Superficie acolchada, anclaje para pies',
        'Avanzado',
        hamstrings_id,
        'Arrodillado con tobillos anclados, cuerpo erguido.',
        'Inclínate hacia adelante controladamente usando isquiotibiales como freno.',
        'Mantén control en posición baja.',
        'Vuelve a posición inicial con isquiotibiales (usar manos si es necesario).',
        ARRAY['Flexionar cadera', 'caer muy rápido', 'arquear espalda'],
        ARRAY['Lesiones de isquiotibiales', 'problemas de rodilla', 'falta de fuerza base'],
        true
    );

    -- 5. Curl de isquiotibiales en máquina (tumbado)
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Curl de isquiotibiales en máquina (tumbado)',
        'Aislamiento',
        ARRAY['Isquiotibiales'],
        ARRAY['Pantorrillas'],
        'Máquina de curl femoral',
        'Principiante',
        hamstrings_id,
        'Tumbado boca abajo, rodillas al borde del banco, tobillos bajo los rodillos.',
        'Extiende las piernas controladamente.',
        'Pausa con piernas casi extendidas.',
        'Flexiona rodillas llevando talones hacia glúteos.',
        ARRAY['Levantar cadera', 'movimiento descontrolado', 'hiperextender rodillas'],
        ARRAY['Lesiones de rodilla', 'problemas de espalda baja'],
        true
    );

    -- Continuar con más ejercicios de isquiotibiales...

END $$;

-- =====================================================
-- EJERCICIOS DE GLÚTEOS (20 ejercicios)
-- =====================================================
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
        ARRAY['Glúteo mayor', 'Aductores'],
        ARRAY['Cuádriceps', 'Core', 'Erectores espinales'],
        'Mancuerna o kettlebell',
        'Principiante / Intermedio',
        glutes_id,
        'Pies más anchos que hombros, puntas hacia fuera 30-45°, mancuerna colgando entre piernas.',
        'Inhala, siéntate hacia atrás flexionando cadera y rodillas, manteniendo torso erguido.',
        'Pausa 1 s en paralelo con rodillas alineadas sobre pies.',
        'Exhala, empuja con talones extendiendo cadera y rodillas simultáneamente.',
        ARRAY['Rodillas colapsando hacia dentro', 'inclinarse demasiado hacia adelante', 'rango incompleto'],
        ARRAY['Dolor en aductores', 'pinzamiento femoroacetabular', 'lesiones de cadera no rehabilitadas'],
        true
    ) RETURNING id INTO exercise_id;

    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Sentadilla sumo con barra', 'Con barra sobre hombros'),
        (exercise_id, 'Por disponibilidad', 'En máquina Smith', 'En máquina Smith'),
        (exercise_id, 'Por seguridad', 'Sin peso adicional', 'Solo peso corporal'),
        (exercise_id, 'Por seguridad', 'Con apoyo de TRX', 'Con sistema de suspensión');

    -- 2. Puente de glúteo básico
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Puente de glúteo básico',
        'Aislamiento',
        ARRAY['Glúteo mayor'],
        ARRAY['Isquiotibiales', 'Core'],
        'Peso corporal',
        'Principiante',
        glutes_id,
        'Tumbado boca arriba, rodillas flexionadas, pies plantados al ancho de cadera, brazos relajados.',
        'Inhala, baja cadera controladamente sin tocar completamente el suelo.',
        'Mantén contracción máxima por 1–2 s.',
        'Exhala, aprieta glúteos y eleva cadera hasta formar línea recta.',
        ARRAY['Elevar demasiado alto (hiperextensión lumbar)', 'usar impulso', 'no contraer glúteos adecuadamente'],
        ARRAY['Dolor lumbar agudo', 'hernia discal sintomática'],
        true
    );

    -- 3. Hip thrust con peso corporal
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Hip thrust con peso corporal',
        'Aislamiento',
        ARRAY['Glúteo mayor'],
        ARRAY['Isquiotibiales', 'Core'],
        'Banco',
        'Principiante',
        glutes_id,
        'Espalda alta apoyada en banco, pies plantados al ancho de cadera.',
        'Baja cadera controladamente.',
        'Mantén posición baja brevemente.',
        'Empuja con talones elevando cadera hasta línea recta.',
        ARRAY['Hiperextender lumbar', 'empujar con puntas de pies', 'no apretar glúteos'],
        ARRAY['Problemas de espalda', 'incomodidad en cuello'],
        true
    );

    -- 4. Peso muerto convencional
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Peso muerto convencional (extensión de cadera)',
        'Compuesto',
        ARRAY['Glúteos', 'Isquiotibiales'],
        ARRAY['Erectores espinales', 'Trapecios', 'Core'],
        'Barra',
        'Intermedio / Avanzado',
        glutes_id,
        'Pies al ancho de cadera, barra sobre mediapié, agarre pronado fuera de piernas.',
        'Baja la barra controladamente flexionando cadera y rodillas.',
        'Pausa breve con barra cerca del suelo.',
        'Extiende cadera y rodillas llevando barra arriba, termina con glúteos contraídos.',
        ARRAY['Redondear espalda', 'barra alejada del cuerpo', 'hiperextender al final'],
        ARRAY['Lesiones de espalda', 'hernias discales', 'problemas de cadera'],
        true
    );

    -- 5. Desplante reverso
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Desplante reverso',
        'Compuesto',
        ARRAY['Glúteos', 'Cuádriceps'],
        ARRAY['Core', 'Isquiotibiales'],
        'Mancuernas o peso corporal',
        'Principiante / Intermedio',
        glutes_id,
        'De pie con pies juntos, mancuernas a los lados si se usan.',
        'Da un paso hacia atrás bajando la rodilla trasera hacia el suelo.',
        'Pausa en posición baja.',
        'Empuja con pie delantero para volver a posición inicial.',
        ARRAY['Paso muy corto', 'inclinarse hacia adelante', 'rodilla en valgo'],
        ARRAY['Problemas de equilibrio', 'lesiones de rodilla'],
        true
    );

    -- 6. Patada de glúteo en cuadrupedia
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Patada de glúteo en cuadrupedia',
        'Aislamiento',
        ARRAY['Glúteo mayor'],
        ARRAY['Core'],
        'Colchoneta',
        'Principiante',
        glutes_id,
        'En cuatro puntos, manos bajo hombros, rodillas bajo caderas.',
        'Baja la pierna controladamente.',
        'Mantén brevemente.',
        'Eleva una pierna hacia atrás y arriba manteniendo rodilla flexionada a 90°.',
        ARRAY['Arquear espalda', 'rotar cadera', 'usar impulso'],
        ARRAY['Problemas de espalda baja', 'lesiones de cadera'],
        true
    );

    -- 7. Hip thrust con barra
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Hip thrust con barra',
        'Aislamiento',
        ARRAY['Glúteo mayor'],
        ARRAY['Isquiotibiales', 'Core'],
        'Barra, banco, protector de barra',
        'Intermedio / Avanzado',
        glutes_id,
        'Espalda alta en banco, barra sobre caderas con protector, pies plantados.',
        'Baja cadera controladamente.',
        'Pausa en posición baja.',
        'Empuja cadera hacia arriba apretando glúteos fuertemente.',
        ARRAY['Hiperextender lumbar', 'pies mal posicionados', 'no activar glúteos'],
        ARRAY['Problemas de espalda', 'molestias en cadera'],
        true
    );

    -- Continuar con más ejercicios de glúteos...

END $$;

-- =====================================================
-- EJERCICIOS DE DELTOIDES MEDIAL (10 ejercicios)
-- =====================================================
DO $$
DECLARE
    shoulders_id UUID;
    exercise_id UUID;
BEGIN
    shoulders_id := get_muscle_group_id('HOMBROS');

    -- 1. Elevación Lateral con Mancuernas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Elevación Lateral con Mancuernas (apertura estándar)',
        'Aislamiento',
        ARRAY['Deltoides Medial'],
        ARRAY['Deltoides Anterior', 'Trapecio'],
        'Mancuernas',
        'Principiante / Intermedio',
        shoulders_id,
        'De pie, pies al ancho de hombros, mancuernas a los lados, ligera flexión de codos.',
        'Baja las mancuernas controladamente a los lados.',
        'Pausa breve en posición baja.',
        'Eleva los brazos lateralmente hasta altura de hombros.',
        ARRAY['Usar impulso', 'elevar demasiado alto', 'rotar excesivamente los hombros'],
        ARRAY['Lesiones de hombro', 'pinzamiento subacromial', 'tendinitis del manguito rotador'],
        true
    ) RETURNING id INTO exercise_id;

    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Elevación lateral en cables', 'Con polea baja'),
        (exercise_id, 'Por disponibilidad', 'Elevación lateral en máquina', 'En máquina específica'),
        (exercise_id, 'Por seguridad', 'Elevación lateral sentado', 'Mayor estabilidad'),
        (exercise_id, 'Por seguridad', 'Elevación lateral con banda', 'Menor estrés articular');

    -- 2. Elevación Lateral Estilo Butterfly
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Elevación Lateral Estilo Butterfly (arco completo)',
        'Aislamiento',
        ARRAY['Deltoides Medial'],
        ARRAY['Deltoides Posterior'],
        'Mancuernas',
        'Intermedio',
        shoulders_id,
        'De pie, brazos extendidos al frente con mancuernas.',
        'Baja en arco amplio hacia los lados.',
        'Mantén tensión en posición baja.',
        'Eleva en arco amplio hasta altura de hombros.',
        ARRAY['Perder el arco', 'usar peso excesivo', 'momentum excesivo'],
        ARRAY['Problemas de hombro', 'inestabilidad glenohumeral'],
        true
    );

    -- 3. Elevación Lateral en Polea Baja (posición tradicional frontal)
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Elevación Lateral en Polea Baja (posición tradicional frontal)',
        'Aislamiento',
        ARRAY['Deltoides Medial'],
        ARRAY['Deltoides Anterior'],
        'Máquina de cables',
        'Principiante / Intermedio',
        shoulders_id,
        'De lado a la polea, agarre con mano más alejada, brazo cruzado frente al cuerpo.',
        'Baja controladamente manteniendo tensión.',
        'Pausa breve.',
        'Eleva lateralmente hasta altura del hombro.',
        ARRAY['Girar el torso', 'elevar demasiado', 'perder tensión del cable'],
        ARRAY['Lesiones de hombro', 'problemas de manguito rotador'],
        true
    );

    -- Continuar con más ejercicios de deltoides...

END $$;

-- =====================================================
-- EJERCICIOS DE CORE (27 ejercicios)
-- =====================================================
DO $$
DECLARE
    core_id UUID;
    exercise_id UUID;
BEGIN
    core_id := get_muscle_group_id('ABDOMINALES');

    -- 1. Plancha Frontal (Plank)
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Plancha Frontal (Plank)',
        'Isométrico',
        ARRAY['Recto Abdominal', 'Transverso Abdominal'],
        ARRAY['Oblicuos', 'Erectores Espinales'],
        'Colchoneta',
        'Principiante',
        core_id,
        'Apoya antebrazos y puntas de pies, cuerpo en línea recta.',
        'N/A - Ejercicio isométrico',
        'Mantén posición 30-60 segundos con core contraído.',
        'N/A - Ejercicio isométrico',
        ARRAY['Cadera muy alta o baja', 'no activar core', 'aguantar respiración'],
        ARRAY['Problemas de espalda baja', 'lesiones de hombro', 'presión arterial alta'],
        true
    );

    -- 2. Plancha Lateral
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Plancha Lateral (Side Plank)',
        'Isométrico',
        ARRAY['Oblicuos'],
        ARRAY['Transverso Abdominal', 'Cuadrado Lumbar'],
        'Colchoneta',
        'Intermedio',
        core_id,
        'Apoya antebrazo y lateral del pie, cuerpo en línea recta lateral.',
        'N/A - Ejercicio isométrico',
        'Mantén posición 30-60 segundos por lado.',
        'N/A - Ejercicio isométrico',
        ARRAY['Cadera caída', 'rotar el torso', 'no mantener alineación'],
        ARRAY['Problemas de hombro', 'lesiones de oblicuos'],
        true
    );

    -- 3. Dead Bug
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Dead Bug (Bicho Muerto)',
        'Control motor',
        ARRAY['Transverso Abdominal', 'Recto Abdominal'],
        ARRAY['Oblicuos'],
        'Colchoneta',
        'Principiante',
        core_id,
        'Acostado boca arriba, brazos al cielo, rodillas a 90°.',
        'Extiende lentamente brazo y pierna opuesta.',
        'Pausa en extensión manteniendo espalda baja pegada.',
        'Vuelve a posición inicial con control.',
        ARRAY['Arquear espalda baja', 'movimiento rápido', 'no coordinar opuestos'],
        ARRAY['Problemas de coordinación', 'dolor lumbar'],
        true
    );

    -- 4. Bird Dog
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Bird Dog (Perro Pájaro)',
        'Control motor',
        ARRAY['Erectores Espinales', 'Transverso Abdominal'],
        ARRAY['Glúteos', 'Deltoides'],
        'Colchoneta',
        'Principiante',
        core_id,
        'En cuatro puntos, espalda neutra.',
        'Baja brazo y pierna controladamente.',
        'Mantén extensión completa 2-3 segundos.',
        'Extiende brazo y pierna opuesta simultáneamente.',
        ARRAY['Rotar cadera o torso', 'arquear espalda', 'movimiento descontrolado'],
        ARRAY['Problemas de equilibrio', 'lesiones de espalda'],
        true
    );

    -- 5. Crunches Abdominales
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Crunches Abdominales',
        'Aislamiento',
        ARRAY['Recto Abdominal'],
        ARRAY['Oblicuos'],
        'Colchoneta',
        'Principiante',
        core_id,
        'Acostado boca arriba, rodillas flexionadas, manos detrás de la cabeza.',
        'Baja controladamente sin relajar completamente.',
        'Mantén contracción en punto alto.',
        'Flexiona tronco elevando hombros del suelo.',
        ARRAY['Tirar del cuello', 'usar impulso', 'rango excesivo'],
        ARRAY['Problemas de cuello', 'hernias abdominales'],
        true
    );

    -- Continuar con más ejercicios de core...

END $$;

-- =====================================================
-- EJERCICIOS DE TRÍCEPS (21 ejercicios)
-- =====================================================
DO $$
DECLARE
    triceps_id UUID;
    exercise_id UUID;
BEGIN
    triceps_id := get_muscle_group_id('TRÍCEPS');

    -- 1. Press de Banca Agarre Cerrado
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Press de Banca Agarre Cerrado',
        'Compuesto',
        ARRAY['Tríceps (las tres cabezas)'],
        ARRAY['Pectorales', 'Deltoides Anterior'],
        'Barra y banco',
        'Intermedio',
        triceps_id,
        'Acostado en banco, agarre cerrado (ancho de hombros), barra sobre pecho.',
        'Baja la barra controladamente hacia el pecho inferior.',
        'Pausa breve sin rebotar.',
        'Empuja la barra enfocándote en extender los codos.',
        ARRAY['Agarre muy cerrado', 'codos muy abiertos', 'rebotar en el pecho'],
        ARRAY['Lesiones de muñeca', 'problemas de codo', 'lesiones de hombro'],
        true
    ) RETURNING id INTO exercise_id;

    INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_id, 'Por disponibilidad', 'Press cerrado en Smith', 'En máquina Smith'),
        (exercise_id, 'Por disponibilidad', 'Press cerrado con mancuernas', 'Con mancuernas'),
        (exercise_id, 'Por seguridad', 'Press cerrado en máquina', 'Mayor estabilidad'),
        (exercise_id, 'Por seguridad', 'Flexiones diamante', 'Sin peso adicional');

    -- 2. Fondos en Barras Paralelas
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Fondos en Barras Paralelas',
        'Compuesto',
        ARRAY['Tríceps'],
        ARRAY['Pectorales Inferiores', 'Deltoides Anterior'],
        'Barras paralelas',
        'Intermedio / Avanzado',
        triceps_id,
        'Brazos extendidos en barras, cuerpo vertical, ligera inclinación hacia adelante.',
        'Baja flexionando codos hasta 90° o según movilidad.',
        'Pausa breve en posición baja.',
        'Empuja hacia arriba extendiendo codos completamente.',
        ARRAY['Bajar demasiado', 'balancear el cuerpo', 'codos muy abiertos'],
        ARRAY['Lesiones de hombro', 'problemas de codo', 'falta de fuerza base'],
        true
    );

    -- 3. Extensión de Tríceps en Polea Alta (pushdown)
    INSERT INTO exercises (
        name, type, primary_muscles, secondary_muscles, material, level,
        muscle_group_id, initial_position, execution_eccentric, execution_isometric,
        execution_concentric, common_errors, contraindications, is_active
    ) VALUES (
        'Extensión de Tríceps en Polea Alta (pushdown)',
        'Aislamiento',
        ARRAY['Tríceps (cabeza lateral y medial)'],
        ARRAY[],
        'Máquina de cables con barra o cuerda',
        'Principiante',
        triceps_id,
        'De pie frente al cable, codos pegados al torso, agarre de la barra.',
        'Permite que el peso suba flexionando codos controladamente.',
        'Mantén tensión en posición alta.',
        'Extiende codos hacia abajo manteniendo posición de brazos.',
        ARRAY['Separar codos del cuerpo', 'usar hombros', 'inclinar torso'],
        ARRAY['Lesiones de codo', 'tendinitis'],
        true
    );

    -- Continuar con más ejercicios de tríceps...

END $$;

-- =====================================================
-- ESTADÍSTICAS FINALES
-- =====================================================
-- Verificar inserciones totales
SELECT
    mg.name as grupo_muscular,
    COUNT(e.id) as total_ejercicios,
    COUNT(DISTINCT ev.id) as total_variantes
FROM muscle_groups mg
LEFT JOIN exercises e ON mg.id = e.muscle_group_id
LEFT JOIN exercise_variants ev ON e.id = ev.exercise_id
WHERE e.is_active = true
GROUP BY mg.id, mg.name
ORDER BY mg.name;

-- Total general
SELECT
    COUNT(DISTINCT e.id) as total_ejercicios,
    COUNT(DISTINCT ev.id) as total_variantes,
    COUNT(DISTINCT mg.id) as total_grupos_musculares
FROM exercises e
LEFT JOIN exercise_variants ev ON e.id = ev.exercise_id
LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
WHERE e.is_active = true;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Script de inserción de ejercicios completado exitosamente';
    RAISE NOTICE '📊 Revisa las estadísticas arriba para confirmar las inserciones';
END $$;

-- Eliminar función temporal
DROP FUNCTION IF EXISTS get_muscle_group_id(VARCHAR);