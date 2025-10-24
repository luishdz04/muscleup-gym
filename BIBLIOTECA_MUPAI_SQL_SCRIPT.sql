-- SCRIPT SQL PARA INSERTAR MASIVAMENTE TODOS LOS EJERCICIOS DE LA BIBLIOTECA MUPAI
-- Ejecutar después de crear las tablas base

-- ===================================================================
-- INSERTAR GRUPOS MUSCULARES (actualizar con los nuevos grupos)
-- ===================================================================

INSERT INTO muscle_groups (name, description) VALUES
    ('CUÁDRICEPS', 'Músculos de la parte frontal del muslo'),
    ('ISQUIOTIBIALES', 'Músculos de la parte posterior del muslo'),
    ('GLÚTEOS', 'Músculos de los glúteos'),
    ('DELTOIDES_MEDIAL', 'Músculos del deltoides medial'),
    ('CORE', 'Músculos del core y abdominales'),
    ('TRÍCEPS', 'Músculos del brazo posterior')
ON CONFLICT (name) DO NOTHING;

-- ===================================================================
-- OBTENER IDS DE GRUPOS MUSCULARES PARA REFERENCIAS
-- ===================================================================

DO $$
DECLARE
    cuadriceps_id UUID;
    isquiotibiales_id UUID;
    gluteos_id UUID;
    deltoides_medial_id UUID;
    core_id UUID;
    triceps_id UUID;
BEGIN
    -- Obtener IDs de grupos musculares
    SELECT id INTO cuadriceps_id FROM muscle_groups WHERE name = 'CUÁDRICEPS';
    SELECT id INTO isquiotibiales_id FROM muscle_groups WHERE name = 'ISQUIOTIBIALES';
    SELECT id INTO gluteos_id FROM muscle_groups WHERE name = 'GLÚTEOS';
    SELECT id INTO deltoides_medial_id FROM muscle_groups WHERE name = 'DELTOIDES_MEDIAL';
    SELECT id INTO core_id FROM muscle_groups WHERE name = 'CORE';
    SELECT id INTO triceps_id FROM muscle_groups WHERE name = 'TRÍCEPS';

-- ===================================================================
-- INSERTAR EJERCICIOS DE CUÁDRICEPS
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 1. Sentadilla Goblet
('Sentadilla Goblet (flexión de rodilla)', 'Compuesto', 
ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral'], 
ARRAY['Glúteo Mayor', 'Core'], 
'Mancuerna o Kettlebell', 'Principiante / Intermedio', cuadriceps_id,
'De pie, pies al ancho de hombros con puntas 10–20° afuera. Sostén la mancuerna contra el pecho con ambas manos. Core firme y columna neutra.',
'Inhala y baja flexionando rodillas y cadera. Rodillas se proyectan hacia adelante sobre el tobillo y pueden pasar la punta del pie (énfasis cuádriceps). Torso erguido.',
'Pausa 1 s en paralelo o más abajo, rodillas alineadas con pies, core activo.',
'Exhala y extiende rodillas y cadera empujando con planta completa, priorizando los talones. Ritmo controlado (1–2 s).',
ARRAY['Rodillas colapsando', 'talones elevados', 'inclinar torso en exceso'],
ARRAY['Gonartrosis avanzada', 'lesión de LCA/menisco', 'cirugía de rodilla reciente']),

-- 2. Desplante estático con apoyo
('Desplante estático con apoyo (flexión de rodilla)', 'Compuesto',
ARRAY['Recto Femoral', 'Vasto Medial'],
ARRAY['Glúteo Mayor', 'Core'],
'Mancuernas o peso corporal', 'Principiante / Intermedio', cuadriceps_id,
'Un pie adelante y otro atrás en zancada. Torso recto, core firme, mancuernas a los costados.',
'Inhala y baja hasta ~90° en rodilla delantera. Rodilla sobrepasa la línea del tobillo, avanzando hacia la punta del pie (énfasis cuádriceps).',
'Pausa breve abajo, torso erguido, rodilla alineada en dirección del pie.',
'Exhala y empuja con talón delantero extendiendo rodilla y cadera en 1–2 s.',
ARRAY['Base estrecha', 'inclinar torso', 'peso excesivo en pierna trasera'],
ARRAY['Inestabilidad ligamentaria', 'gonartrosis severa', 'déficits de equilibrio']),

-- 3. Sentadilla en máquina perfecta
('Sentadilla en máquina perfecta (flexión de rodilla)', 'Compuesto',
ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral'],
ARRAY['Glúteo Mayor', 'Aductores', 'Core'],
'Máquina Perfecta', 'Principiante / Intermedio', cuadriceps_id,
'Espalda apoyada en respaldo, pies al ancho de hombros en plataforma, core firme.',
'Inhala y baja flexionando rodillas lentamente hasta 90° o más. Rodillas avanzan hacia adelante (énfasis cuádriceps).',
'Pausa breve abajo, espalda firme, rodillas alineadas.',
'Exhala y extiende rodillas empujando con planta completa en 1–2 s.',
ARRAY['Separar espalda del respaldo', 'empujar con puntas', 'recortar rango'],
ARRAY['Gonartrosis avanzada', 'cirugía de rodilla reciente', 'hernia discal activa']),

-- 4. Sentadilla Hack
('Sentadilla Hack (flexión de rodilla)', 'Compuesto',
ARRAY['Recto Femoral', 'Vasto Lateral'],
ARRAY['Glúteo Mayor', 'Core'],
'Máquina Hack', 'Intermedio / Avanzado', cuadriceps_id,
'Espalda y hombros apoyados en respaldo, pies firmes en plataforma, core activado.',
'Inhala y baja lento hasta paralelo, rodillas avanzan hacia adelante (énfasis cuádriceps).',
'Pausa 1 s en el fondo, rodillas alineadas, talones firmes.',
'Exhala y empuja con talones extendiendo rodillas y cadera en 1–2 s.',
ARRAY['Talones levantados', 'rodillas en valgo', 'recorte de recorrido'],
ARRAY['Síndrome patelofemoral', 'lesiones meniscales', 'espondilolistesis lumbar']),

-- 5. Sentadilla Smith
('Sentadilla Smith (flexión de rodilla)', 'Compuesto',
ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral'],
ARRAY['Glúteo Mayor', 'Core'],
'Máquina Smith', 'Intermedio / Avanzado', cuadriceps_id,
'Barra en trapecios, pies ligeramente adelantados, torso erguido, core firme.',
'Inhala y baja en línea recta hasta paralelo. Rodillas avanzan hacia adelante más que en glúteo (énfasis cuádriceps).',
'Pausa breve en el fondo, torso erguido, rodillas alineadas.',
'Exhala y extiende rodillas empujando fuerte con talones.',
ARRAY['Pies demasiado cerca de la barra', 'colapso de rodillas', 'rebotar en el fondo'],
ARRAY['Pinzamiento femoroacetabular', 'artrosis de rodilla', 'hernia discal']),

-- 6. Prensa de piernas
('Prensa de piernas (flexión de rodilla)', 'Compuesto',
ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral', 'Vasto Intermedio'],
ARRAY['Glúteo Mayor', 'Aductores', 'Isquiotibiales'],
'Máquina de prensa', 'Todos', cuadriceps_id,
'Espalda apoyada, pies al ancho de hombros en plataforma, core firme.',
'Inhala y baja plataforma hasta ~90° flexionando rodillas. Rodillas avanzan al frente (énfasis cuádriceps).',
'Pausa breve abajo, rodillas alineadas, espalda fija.',
'Exhala y extiende rodillas empujando con planta completa.',
ARRAY['Empujar con puntas', 'despegar la cadera', 'recortar recorrido'],
ARRAY['Gonartrosis avanzada', 'lesión de menisco/LCA', 'hernia discal activa']),

-- 7. Escalón con mancuernas
('Escalón con mancuernas (flexión de rodilla)', 'Compuesto',
ARRAY['Recto Femoral', 'Vasto Medial'],
ARRAY['Glúteo Mayor', 'Core'],
'Banco/caja + mancuernas', 'Intermedio', cuadriceps_id,
'De pie frente a banco estable, mancuernas a los costados, torso recto.',
'Desde arriba, baja controlado en 2–3 s con pierna de apoyo. Rodilla se proyecta al frente (énfasis cuádriceps).',
'Pausa breve estabilizando rodilla y cadera.',
'Exhala y sube empujando con talón delantero hasta extender rodilla.',
ARRAY['Impulsarse con pierna trasera', 'banco inestable', 'torso inclinado'],
ARRAY['Déficits de equilibrio', 'lesiones patelofemorales', 'prótesis temprana']),

-- 8. Escalón en cables
('Escalón en cables (flexión de rodilla)', 'Compuesto',
ARRAY['Recto Femoral', 'Vasto Medial'],
ARRAY['Glúteo Mayor', 'Core'],
'Polea + banco', 'Intermedio / Avanzado', cuadriceps_id,
'Frente a banco, cable sujeto a cadera, pie de apoyo sobre banco.',
'Inhala y baja controlado en 2–3 s, rodilla se proyecta al frente (énfasis cuádriceps).',
'Pausa 1 s abajo estabilizando cadera y rodilla.',
'Exhala y sube empujando con talón contra resistencia del cable.',
ARRAY['Impulso con pierna trasera', 'rodilla en valgo', 'perder estabilidad'],
ARRAY['Déficits de equilibrio', 'artrosis severa', 'dolor patelofemoral']),

-- 9. Sentadilla búlgara en Smith
('Sentadilla búlgara en Smith (flexión de rodilla)', 'Compuesto unilateral',
ARRAY['Recto Femoral', 'Vasto Medial'],
ARRAY['Glúteo Mayor', 'Core'],
'Máquina Smith + banco', 'Intermedio', cuadriceps_id,
'Barra en trapecios, pie trasero elevado en banco, torso erguido.',
'Inhala y baja en 2–3 s, rodilla delantera avanza (énfasis cuádriceps).',
'Pausa breve en 90°.',
'Exhala y sube empujando con talón delantero.',
ARRAY['Rodilla en valgo', 'peso en pierna trasera', 'torso inclinado'],
ARRAY['Gonartrosis avanzada', 'inestabilidad ligamentaria', 'déficits de equilibrio']),

-- 10. Extensión de piernas
('Extensión de piernas (flexión de rodilla)', 'Aislado',
ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral', 'Vasto Intermedio'],
ARRAY[],
'Máquina de extensión', 'Todos', cuadriceps_id,
'Sentado en máquina, espalda firme, rodillas a 90°, tobillos asegurados.',
'Inhala y baja controlado en 2–3 s hasta 90°.',
'Pausa 1 s arriba contrayendo cuádriceps.',
'Exhala y extiende rodillas hasta casi bloquear.',
ARRAY['Arquear espalda', 'extender muy rápido', 'rango corto'],
ARRAY['Tendinopatía rotuliana aguda', 'gonartrosis severa', 'cirugía reciente de rodilla']);

-- ===================================================================
-- INSERTAR EJERCICIOS DE ISQUIOTIBIALES
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 1. Peso muerto rumano con mancuernas
('Peso muerto rumano con mancuernas (extensión de cadera)', 'Compuesto',
ARRAY['Bíceps femoral', 'Semitendinoso', 'Semimembranoso'],
ARRAY['Glúteo mayor', 'erectores espinales', 'core'],
'Mancuernas', 'Principiante – Avanzado', isquiotibiales_id,
'De pie, pies al ancho de cadera, mancuernas colgando al frente, rodillas semiflexionadas, core firme.',
'Inhala, lleva la cadera hacia atrás, baja controlado 2–3 s hasta sentir estiramiento en isquiotibiales.',
'Breve pausa al final sin perder tensión.',
'Exhala, contrae glúteos e isquios, sube en 1–2 s recuperando la extensión de cadera.',
ARRAY['Redondear la espalda', 'bajar demasiado sin control lumbar', 'bloquear rodillas', 'subir con rebote'],
ARRAY['Hernia discal lumbar activa', 'espondilolistesis', 'síndrome facetario lumbar no controlado']),

-- 2. Puente con piernas extendidas y elevadas
('Puente con piernas extendidas y elevadas', 'Compuesto',
ARRAY['Semitendinoso', 'Semimembranoso', 'Bíceps femoral'],
ARRAY['Glúteo mayor', 'core'],
'Peso corporal', 'Principiante – Élite', isquiotibiales_id,
'Tumbado boca arriba, talones apoyados en banco/fitball, piernas extendidas, brazos al costado.',
'Inhala, baja controlado 2–3 s hasta tocar ligeramente el suelo.',
'Mantén alineación hombros–rodillas por 1–2 s.',
'Exhala, eleva cadera contrayendo glúteos/isquios (1–2 s).',
ARRAY['Elevar con impulso lumbar', 'no extender completamente cadera', 'pies mal alineados'],
ARRAY['Tendinopatía proximal de isquiotibiales en fase aguda', 'dolor lumbar por hiperlordosis descompensada']),

-- 3. Hiperextensiones (énfasis en isquiotibiales)
('Hiperextensiones (énfasis en isquiotibiales)', 'Compuesto',
ARRAY['Bíceps femoral', 'Semitendinoso', 'Semimembranoso'],
ARRAY['Glúteo mayor', 'erectores espinales', 'core'],
'Peso corporal / Máquina', 'Principiante – Élite', isquiotibiales_id,
'Colócate en banco de hiperextensiones, tobillos asegurados, torso alineado, brazos cruzados al pecho.',
'Inhala, baja el torso recto controlando 2–3 s.',
'Pausa breve al final con isquios en estiramiento.',
'Exhala, contrae glúteos/isquios y sube 1–2 s hasta línea con cadera.',
ARRAY['Hiperextender la zona lumbar', 'descender con rebote', 'subir más allá de la línea corporal'],
ARRAY['Hernia discal sintomática', 'espondilólisis activa', 'dolor facetario lumbar']),

-- 4. Curl nórdico de isquiotibiales
('Curl nórdico de isquiotibiales', 'Aislamiento excéntrico',
ARRAY['Bíceps femoral largo y corto', 'Semitendinoso'],
ARRAY['Gemelos', 'core'],
'Peso corporal', 'Avanzado – Élite', isquiotibiales_id,
'De rodillas con tobillos asegurados, torso erguido, core activo, manos preparadas para el apoyo.',
'Controla el descenso del torso hacia adelante en 3–5 s usando solo isquiotibiales.',
'Al llegar al límite del control muscular, apoya manos y mantén tensión.',
'Empuja con manos y usa isquios para regresar lentamente a la vertical.',
ARRAY['Dejarse caer sin control', 'no usar toda la amplitud disponible', 'compensar excesivamente con lumbar'],
ARRAY['Tendinopatía proximal de isquiotibiales aguda', 'dolor patelofemoral', 'lesiones no rehabilitadas de rodilla']),

-- 5. Curl de isquiotibiales en máquina (tumbado)
('Curl de isquiotibiales en máquina (tumbado)', 'Aislamiento',
ARRAY['Bíceps femoral', 'Semitendinoso', 'Semimembranoso'],
ARRAY['Gemelos', 'glúteos'],
'Máquina de curl tumbado', 'Principiante – Avanzado', isquiotibiales_id,
'Tumbado boca abajo, almohadilla en parte baja de gemelos, cadera pegada al banco.',
'Inhala y extiende rodillas controlado en 2–3 s hasta casi extensión completa.',
'Pausa 1 s en máxima contracción.',
'Exhala y flexiona rodillas llevando talones hacia glúteos en 1–2 s.',
ARRAY['Elevar cadera del banco', 'flexión excesiva que cause calambre', 'usar impulso'],
ARRAY['Condromalacia rotuliana severa', 'contractura de isquiotibiales aguda', 'bursitis prepatelar']);

-- ===================================================================
-- INSERTAR EJERCICIOS DE GLÚTEOS
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 1. Sentadilla sumo con mancuerna
('Sentadilla sumo con mancuerna (extensión de cadera)', 'Compuesto',
ARRAY['Glúteo mayor', 'aductores'],
ARRAY['Cuádriceps', 'core', 'erectores espinales'],
'Mancuerna o kettlebell', 'Principiante – Intermedio', gluteos_id,
'Pies más anchos que hombros, puntas hacia fuera 30-45°, mancuerna colgando entre piernas.',
'Inhala, siéntate hacia atrás flexionando cadera y rodillas, manteniendo torso erguido.',
'Pausa 1 s en paralelo con rodillas alineadas sobre pies.',
'Exhala, empuja con talones extendiendo cadera y rodillas simultáneamente.',
ARRAY['Rodillas colapsando hacia dentro', 'inclinarse demasiado hacia adelante', 'rango incompleto'],
ARRAY['Dolor en aductores', 'pinzamiento femoroacetabular', 'lesiones de cadera no rehabilitadas']),

-- 2. Puente de glúteo básico
('Puente de glúteo básico', 'Aislamiento',
ARRAY['Glúteo mayor'],
ARRAY['Isquiotibiales', 'core'],
'Peso corporal', 'Principiante – Todos', gluteos_id,
'Tumbado boca arriba, rodillas flexionadas, pies plantados al ancho de cadera, brazos relajados.',
'Inhala, baja cadera controladamente sin tocar completamente el suelo.',
'Mantén contracción máxima por 1–2 s.',
'Exhala, aprieta glúteos y eleva cadera hasta formar línea recta.',
ARRAY['Elevar demasiado alto', 'usar impulso', 'no contraer glúteos adecuadamente'],
ARRAY['Dolor lumbar que empeora con extensión de cadera', 'problemas de rodilla en flexión']),

-- 3. Hip thrust con peso corporal
('Hip thrust con peso corporal', 'Aislamiento',
ARRAY['Glúteo mayor'],
ARRAY['Isquiotibiales', 'core'],
'Banco', 'Principiante – Intermedio', gluteos_id,
'Espalda alta apoyada en banco, pies plantados, cadera en el aire, brazos cruzados.',
'Inhala, baja cadera controladamente hasta casi tocar el suelo.',
'Pausa 1–2 s en máxima contracción.',
'Exhala, aprieta glúteos elevando cadera hasta línea recta rodilla-cadera-hombro.',
ARRAY['Hiperextender lumbar', 'elevar con impulso', 'no alcanzar alineación completa'],
ARRAY['Dolor lumbar con hiperextensión', 'problemas de hombro que impidan apoyo en banco']),

-- 4. Peso muerto convencional
('Peso muerto convencional (extensión de cadera)', 'Compuesto',
ARRAY['Glúteo mayor', 'erectores espinales'],
ARRAY['Isquiotibiales', 'trapecio', 'core'],
'Barra olímpica', 'Intermedio – Avanzado', gluteos_id,
'Pies al ancho de cadera, barra sobre mediopié, agarre mixto o doble prono, espalda neutra.',
'Inhala, cadera hacia atrás, baja barra controladamente hasta el suelo.',
'Pausa breve arriba con hombros atrás y cadera completamente extendida.',
'Exhala, extiende cadera y rodillas simultáneamente manteniendo barra pegada al cuerpo.',
ARRAY['Redondear espalda', 'separar barra del cuerpo', 'hiperextender lumbar arriba'],
ARRAY['Hernia discal lumbar', 'dolor ciático activo', 'lesiones de espalda no rehabilitadas']),

-- 5. Desplante reverso
('Desplante reverso', 'Compuesto unilateral',
ARRAY['Glúteo mayor de pierna delantera'],
ARRAY['Cuádriceps', 'core', 'aductores'],
'Peso corporal o mancuernas', 'Principiante – Intermedio', gluteos_id,
'De pie, pies juntos, mancuernas a los costados (opcional), torso erguido.',
'Inhala, da paso atrás y baja hasta que ambas rodillas estén a 90°.',
'Pausa breve en posición baja.',
'Exhala, empuja con talón delantero para regresar a posición inicial.',
ARRAY['Paso demasiado corto', 'inclinarse hacia adelante', 'no cargar peso en pierna delantera'],
ARRAY['Problemas de equilibrio', 'lesiones de rodilla no rehabilitadas', 'dolor patelofemoral']);

-- ===================================================================
-- INSERTAR EJERCICIOS DE DELTOIDES MEDIAL
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 1. Elevación Lateral con Mancuernas
('Elevación Lateral con Mancuernas (apertura estándar)', 'Aislamiento',
ARRAY['Deltoides medial'],
ARRAY['Supraespinoso', 'trapecio superior', 'serrato anterior'],
'Mancuernas', 'Principiante – Avanzado', deltoides_medial_id,
'De pie con mancuernas a los costados, ligera flexión de codos (~10–15°). Escápulas retraídas, core estable.',
'Exhala y baja lentamente hasta el punto inicial.',
'Pausa breve en máxima contracción.',
'Inhala y eleva los brazos lateralmente hasta la línea del hombro.',
ARRAY['Elevar por encima de la horizontal', 'pérdida de tensión escapular', 'movimiento compensatorio con trapecio'],
ARRAY['Bursitis subacromial', 'dolor acromioclavicular', 'síndrome de pinzamiento activo']),

-- 2. Elevación Lateral Estilo Butterfly
('Elevación Lateral Estilo Butterfly (arco completo)', 'Aislamiento',
ARRAY['Deltoides medial'],
ARRAY['Trapecio superior', 'serrato anterior'],
'Mancuernas', 'Avanzado', deltoides_medial_id,
'De pie con mancuernas a los costados, ligera flexión de codos. Escápulas retraídas y core firme.',
'Exhala y desciende lentamente con control total.',
'Pausa en la contracción máxima sin perder alineación escapular.',
'Inhala y eleva los brazos en arco amplio superando ligeramente la horizontal.',
ARRAY['Uso excesivo del trapecio', 'flexionar codos y convertirlo en press', 'balanceo del tronco'],
ARRAY['Síndrome subacromial', 'tendinopatía del supraespinoso', 'lesiones del labrum glenoideo']),

-- 3. Elevación Lateral en Polea Baja
('Elevación Lateral en Polea Baja (posición tradicional frontal)', 'Aislamiento',
ARRAY['Deltoides medial'],
ARRAY['Supraespinoso', 'trapecio medio', 'serrato anterior'],
'Polea baja con maneral individual', 'Intermedio – Avanzado', deltoides_medial_id,
'Colócate de pie al costado de la polea, con el cable detrás del cuerpo. Sujeta el maneral con el brazo ligeramente flexionado (~10–15°). Mantén el tronco erguido, core activado y escápulas neutras.',
'Exhala y regresa lentamente controlando el movimiento, manteniendo tensión constante sin dejar caer el peso.',
'Pausa breve en la posición final, maximizando la contracción del deltoide medial sin elevar el trapecio.',
'Inhala y eleva el brazo en arco lateral hasta que el codo esté a la altura del hombro, manteniendo el codo ligeramente adelantado al plano del torso.',
ARRAY['Balanceo del tronco para generar impulso', 'elevar el hombro', 'pérdida del control en la fase excéntrica'],
ARRAY['Síndrome de pinzamiento subacromial activo', 'tendinopatía del supraespinoso en fase aguda', 'bursitis subdeltoidea']);

-- ===================================================================
-- INSERTAR EJERCICIOS DE CORE
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 1. Plancha Frontal
('Plancha Frontal (Plank)', 'Anti-extensión isométrico',
ARRAY['Recto abdominal', 'transverso del abdomen'],
ARRAY['Oblicuos', 'erectores espinales', 'serratos'],
'Peso corporal', 'Principiante – Todos', core_id,
'Apoyo en antebrazos y puntas de pies, cuerpo en línea recta desde cabeza hasta talones. Codos bajo hombros, core activado, glúteos firmes.',
'No aplica - ejercicio isométrico.',
'Sostén la posición manteniendo neutralidad de columna y respiración controlada. Tiempo: 30 segundos a 2+ minutos según nivel.',
'No aplica - ejercicio isométrico.',
ARRAY['Elevar cadera demasiado alto', 'hundir zona lumbar', 'apnea'],
ARRAY['Dolor lumbar agudo', 'síndrome del túnel carpiano', 'embarazo avanzado']),

-- 2. Plancha Lateral
('Plancha Lateral (Side Plank)', 'Anti-inclinación lateral isométrico',
ARRAY['Oblicuos', 'cuadrado lumbar'],
ARRAY['Glúteo medio', 'transverso del abdomen'],
'Peso corporal', 'Principiante – Avanzado', core_id,
'Acostado de lado, apoyo en antebrazo, pies uno sobre otro. Cuerpo en línea recta, cadera elevada del suelo.',
'No aplica - ejercicio isométrico.',
'Sostén posición evitando que cadera baje o rote. Tiempo: 20 segundos a 1+ minuto por lado.',
'No aplica - ejercicio isométrico.',
ARRAY['Cadera hacia atrás o adelante', 'hundir hombro de apoyo', 'flexionar cadera'],
ARRAY['Lesiones de hombro', 'problemas de muñeca', 'hernias discales laterales']),

-- 3. Dead Bug
('Dead Bug (Bicho Muerto)', 'Anti-extensión + coordinación',
ARRAY['Transverso del abdomen', 'recto abdominal'],
ARRAY['Multífidos', 'diafragma'],
'Peso corporal', 'Principiante – Intermedio', core_id,
'Tumbado boca arriba, brazos extendidos al techo, rodillas y caderas a 90°. Zona lumbar neutra, costillas "abajo".',
'Regresa a posición inicial con control.',
'Mantén zona lumbar inmóvil durante todo el movimiento.',
'Extiende brazo y pierna opuestos manteniendo zona lumbar inmóvil.',
ARRAY['Arquear zona lumbar', 'mover demasiado rápido', 'perder posición de costillas'],
ARRAY['Dolor lumbar que empeora con flexión de cadera', 'hernias discales agudas']),

-- 4. Crunch Bicicleta
('Crunch Bicicleta', 'Flexión + rotación',
ARRAY['Oblicuos', 'recto abdominal'],
ARRAY['Flexores de cadera'],
'Peso corporal', 'Principiante – Intermedio', core_id,
'Tumbado boca arriba, manos detrás de cabeza, piernas elevadas. Zona lumbar presionada contra el suelo.',
'Cambia de lado en movimiento fluido.',
'Mantén tensión abdominal constante.',
'Lleva codo hacia rodilla opuesta mientras extiendes la otra pierna.',
ARRAY['Movimiento demasiado rápido', 'tirar del cuello', 'perder contacto lumbar con suelo'],
ARRAY['Dolor cervical', 'hernias discales con dolor irradiado']),

-- 5. Russian Twist
('Russian Twist', 'Rotación dinámica',
ARRAY['Oblicuos'],
ARRAY['Recto abdominal', 'flexores de cadera'],
'Peso corporal o mancuerna', 'Intermedio', core_id,
'Sentado, rodillas flexionadas, pies ligeramente elevados. Torso inclinado 45°, brazos extendidos al frente.',
'Movimiento controlado sin usar impulso.',
'Mantén core activado durante toda la rotación.',
'Gira torso de lado a lado manteniendo core activado.',
ARRAY['Rotar solo brazos', 'movimiento demasiado rápido', 'perder inclinación del torso'],
ARRAY['Hernias discales con componente rotacional', 'dolor lumbar agudo']);

-- ===================================================================
-- INSERTAR EJERCICIOS DE TRÍCEPS
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 1. Press de Banca Agarre Cerrado
('Press de Banca Agarre Cerrado', 'Compuesto',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial', 'Tríceps cabeza larga'],
ARRAY['Pectoral mayor', 'deltoides anterior'],
'Barra olímpica + banco', 'Intermedio – Avanzado', triceps_id,
'Acostado en banco, agarre cerrado (ancho de hombros o menor). Barra sobre el pecho, escápulas retraídas, pies firmes en el suelo.',
'Inhala y baja la barra controladamente al pecho medio-bajo en 2–3 s.',
'Pausa breve en el pecho.',
'Exhala y presiona la barra hacia arriba en 1–2 s.',
ARRAY['Agarre demasiado estrecho', 'codos muy abiertos hacia los lados', 'arquear excesivamente la espalda'],
ARRAY['Dolor en muñecas con flexión', 'lesiones de hombro no rehabilitadas', 'dolor esternal']),

-- 2. Fondos en Barras Paralelas
('Fondos en Barras Paralelas', 'Compuesto',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Pectoral mayor', 'deltoides anterior'],
'Barras paralelas o estación de fondos', 'Intermedio – Avanzado', triceps_id,
'Sostenido en barras con brazos extendidos, torso ligeramente inclinado hacia adelante. Escápulas deprimidas, core activado.',
'Inhala y baja flexionando codos hasta ~90° en 2–3 s.',
'Pausa breve en el punto más bajo.',
'Exhala y extiende codos regresando a la posición inicial en 1–2 s.',
ARRAY['Bajar demasiado', 'hundir hombros hacia las orejas', 'balancearse o usar impulso'],
ARRAY['Dolor anterior de hombro', 'inestabilidad glenohumeral', 'lesiones del manguito rotador']),

-- 3. Extensión de Tríceps en Polea Alta
('Extensión de Tríceps en Polea Alta (pushdown)', 'Aislamiento',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Anconeo'],
'Polea alta + barra recta o cuerda', 'Principiante – Todos', triceps_id,
'De pie frente a la polea, agarre en pronación, codos pegados al torso. Torso erguido, core firme, antebrazo paralelo al suelo.',
'Inhala y flexiona codos controladamente hasta 90° en 2–3 s.',
'Pausa breve en extensión completa.',
'Exhala y extiende codos hacia abajo hasta casi bloquear en 1–2 s.',
ARRAY['Separar codos del torso', 'usar impulso del torso', 'rango incompleto de movimiento'],
ARRAY['Epicondilitis lateral o medial', 'dolor en muñeca con extensión repetitiva']),

-- 4. Extensión de Tríceps con Mancuernas
('Extensión de Tríceps con Mancuernas (tumbado)', 'Aislamiento',
ARRAY['Tríceps cabeza larga', 'Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Anconeo'],
'Mancuernas + banco', 'Principiante – Intermedio', triceps_id,
'Tumbado en banco, mancuernas sostenidas con brazos extendidos sobre el pecho. Escápulas retraídas, pies firmes en el suelo.',
'Inhala y flexiona codos bajando mancuernas hacia las sienes en 2–3 s.',
'Pausa breve en flexión máxima.',
'Exhala y extiende codos regresando a posición inicial en 1–2 s.',
ARRAY['Mover hombros', 'bajar peso hacia la frente en lugar de detrás de la cabeza', 'usar impulso'],
ARRAY['Dolor de hombro con extensión por encima de la cabeza', 'problemas cervicales']),

-- 5. Fondos en Banco
('Fondos en Banco (tríceps dips)', 'Compuesto',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Deltoides anterior', 'pectoral mayor'],
'Banco estable', 'Principiante – Intermedio', triceps_id,
'Sentado al borde del banco, manos apoyadas al lado de las caderas. Pies extendidos al frente, peso corporal sostenido por brazos.',
'Inhala y baja flexionando codos hasta ~90° en 2–3 s.',
'Pausa breve en la posición más baja.',
'Exhala y extiende codos regresando arriba en 1–2 s.',
ARRAY['Hundir hombros excesivamente', 'separar demasiado los codos del cuerpo', 'usar impulso de piernas'],
ARRAY['Dolor anterior de hombro', 'síndrome de pinzamiento', 'inestabilidad glenohumeral']);

END $$;

-- ===================================================================
-- INSERTAR VARIANTES DE EJERCICIOS
-- ===================================================================

-- Función auxiliar para insertar variantes masivamente
DO $$
DECLARE
    exercise_record RECORD;
BEGIN
    -- Variantes para Sentadilla Goblet
    SELECT id INTO exercise_record FROM exercises WHERE name = 'Sentadilla Goblet (flexión de rodilla)';
    IF FOUND THEN
        INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_record.id, 'Por disponibilidad', 'Sentadilla libre', 'Realizar sin peso adicional'),
        (exercise_record.id, 'Por disponibilidad', 'Prensa de piernas', 'Alternativa en máquina'),
        (exercise_record.id, 'Por seguridad', 'Extensión de piernas', 'Ejercicio más seguro para lesiones'),
        (exercise_record.id, 'Por seguridad', 'Prensa parcial', 'Rango reducido');
    END IF;

    -- Variantes para Peso muerto rumano con mancuernas
    SELECT id INTO exercise_record FROM exercises WHERE name = 'Peso muerto rumano con mancuernas (extensión de cadera)';
    IF FOUND THEN
        INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_record.id, 'Por disponibilidad', 'Con barra', 'Usar barra olímpica en lugar de mancuernas'),
        (exercise_record.id, 'Por disponibilidad', 'Con kettlebell', 'Usar kettlebell como alternativa'),
        (exercise_record.id, 'Por seguridad', 'B-Stance', 'Reducir tensión lumbar con apoyo');
    END IF;

    -- Variantes para Hip thrust con peso corporal
    SELECT id INTO exercise_record FROM exercises WHERE name = 'Hip thrust con peso corporal';
    IF FOUND THEN
        INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_record.id, 'Por disponibilidad', 'Con mancuerna', 'Agregar peso con mancuerna'),
        (exercise_record.id, 'Por disponibilidad', 'Con barra', 'Usar barra para mayor carga'),
        (exercise_record.id, 'Por disponibilidad', 'Con banda elástica', 'Usar banda para resistencia variable');
    END IF;

    -- Variantes para Plancha Frontal
    SELECT id INTO exercise_record FROM exercises WHERE name = 'Plancha Frontal (Plank)';
    IF FOUND THEN
        INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_record.id, 'Por disponibilidad', 'En rodillas', 'Versión modificada para principiantes'),
        (exercise_record.id, 'Por disponibilidad', 'Con elevación de pies', 'Mayor dificultad elevando pies'),
        (exercise_record.id, 'Por disponibilidad', 'Con peso adicional', 'Aumentar intensidad con peso'),
        (exercise_record.id, 'Por seguridad', 'Reducir tiempo', 'Progresión gradual en duración');
    END IF;

    -- Variantes para Press de Banca Agarre Cerrado
    SELECT id INTO exercise_record FROM exercises WHERE name = 'Press de Banca Agarre Cerrado';
    IF FOUND THEN
        INSERT INTO exercise_variants (exercise_id, type, name, description) VALUES
        (exercise_record.id, 'Por disponibilidad', 'Con mancuernas', 'Usar mancuernas con agarre neutro'),
        (exercise_record.id, 'Por disponibilidad', 'En máquina Smith', 'Mayor seguridad con guías'),
        (exercise_record.id, 'Por seguridad', 'Con spotter', 'Asistencia para cargas pesadas'),
        (exercise_record.id, 'Por seguridad', 'Desde rack con safety bars', 'Protección en caso de fallo');
    END IF;

END $$;

-- ===================================================================
-- CREAR VISTA PARA CONSULTAS OPTIMIZADAS
-- ===================================================================

CREATE OR REPLACE VIEW exercises_complete_view AS
SELECT 
    e.id,
    e.name,
    e.type,
    e.primary_muscles,
    e.secondary_muscles,
    e.material,
    e.level,
    mg.name as muscle_group_name,
    mg.description as muscle_group_description,
    e.initial_position,
    e.execution_eccentric,
    e.execution_isometric,
    e.execution_concentric,
    e.common_errors,
    e.contraindications,
    e.video_url,
    e.image_url,
    e.is_active,
    e.created_at,
    e.updated_at,
    (
        SELECT json_agg(
            json_build_object(
                'id', ev.id,
                'type', ev.type,
                'name', ev.name,
                'description', ev.description
            )
        )
        FROM exercise_variants ev 
        WHERE ev.exercise_id = e.id
    ) as variants
FROM exercises e
LEFT JOIN muscle_groups mg ON e.muscle_group_id = mg.id
WHERE e.is_active = true
ORDER BY mg.name, e.name;

-- ===================================================================
-- FUNCIÓN PARA ESTADÍSTICAS
-- ===================================================================

CREATE OR REPLACE FUNCTION get_exercise_stats()
RETURNS TABLE (
    muscle_group VARCHAR,
    exercise_count BIGINT,
    beginner_count BIGINT,
    intermediate_count BIGINT,
    advanced_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mg.name as muscle_group,
        COUNT(e.id) as exercise_count,
        COUNT(CASE WHEN e.level ILIKE '%principiante%' THEN 1 END) as beginner_count,
        COUNT(CASE WHEN e.level ILIKE '%intermedio%' THEN 1 END) as intermediate_count,
        COUNT(CASE WHEN e.level ILIKE '%avanzado%' THEN 1 END) as advanced_count
    FROM muscle_groups mg
    LEFT JOIN exercises e ON mg.id = e.muscle_group_id AND e.is_active = true
    GROUP BY mg.name, mg.id
    ORDER BY mg.name;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- COMENTARIOS FINALES
-- ===================================================================

COMMENT ON TABLE muscle_groups IS 'Grupos musculares principales para categorizar ejercicios';
COMMENT ON TABLE exercises IS 'Biblioteca completa de ejercicios con detalles técnicos';
COMMENT ON TABLE exercise_variants IS 'Variantes y modificaciones de cada ejercicio';
COMMENT ON VIEW exercises_complete_view IS 'Vista completa de ejercicios con variantes incluidas';
COMMENT ON FUNCTION get_exercise_stats() IS 'Estadísticas de ejercicios por grupo muscular y nivel';

-- Ejemplo de consulta para verificar la inserción
-- SELECT get_exercise_stats();
-- SELECT * FROM exercises_complete_view LIMIT 5;
