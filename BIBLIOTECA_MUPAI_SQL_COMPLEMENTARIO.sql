-- SCRIPT SQL COMPLEMENTARIO - AGREGAR TODOS LOS EJERCICIOS FALTANTES
-- ESTE SCRIPT COMPLETA EL ANTERIOR - EJECUTAR DESPUÉS DEL SCRIPT BASE

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
-- COMPLETAR EJERCICIOS DE CUÁDRICEPS (FALTANTES 11-22)
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 11. Extensión de piernas unilateral
('Extensión de piernas unilateral (flexión de rodilla)', 'Aislado unilateral',
ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral'],
ARRAY[],
'Máquina de extensión', 'Intermedio', cuadriceps_id,
'Sentado, una pierna trabajando, otra relajada, espalda firme.',
'Inhala y baja controlado en 2–3 s.',
'Pausa 1 s arriba.',
'Exhala y extiende rodilla en 1–2 s hasta casi bloquear.',
ARRAY['Compensar con cadera', 'arquear espalda', 'perder control'],
ARRAY['Asimetrías funcionales severas', 'dolor patelofemoral unilateral', 'cirugía reciente']),

-- 12. Prensa unilateral
('Prensa unilateral (flexión de rodilla)', 'Compuesto unilateral',
ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral'],
ARRAY['Glúteo Mayor', 'Core'],
'Máquina de prensa', 'Intermedio', cuadriceps_id,
'Espalda apoyada, un pie en plataforma centrado, core activado.',
'Inhala y baja controlado en 2–3 s hasta 90°. Rodilla avanza al frente (énfasis cuádriceps).',
'Pausa breve abajo, rodilla alineada.',
'Exhala, extiende rodilla empujando con planta completa.',
ARRAY['Rodilla en valgo', 'empujar con puntas', 'despegar cadera'],
ARRAY['Lesiones de rodilla sin rehabilitar', 'artrosis severa', 'hernia discal']),

-- 13. Step-ups con barra o mancuernas
('Step-ups con barra o mancuernas (flexión de rodilla)', 'Compuesto unilateral',
ARRAY['Recto Femoral', 'Vasto Medial'],
ARRAY['Glúteo Mayor', 'Core'],
'Banco/caja + barra o mancuernas', 'Intermedio', cuadriceps_id,
'Frente a banco estable, pie de apoyo en banco, torso erguido.',
'Desde arriba, baja controlado en 2–3 s con pierna de apoyo, rodilla avanza al frente (énfasis cuádriceps).',
'Pausa breve estabilizando.',
'Exhala y sube empujando con talón delantero hasta quedar de pie.',
ARRAY['Impulsarse con pierna trasera', 'banco inestable', 'torso inclinado'],
ARRAY['Déficits de equilibrio', 'artrosis avanzada', 'prótesis temprana de rodilla']),

-- 14. Sentadilla en máquina unilateral
('Sentadilla en máquina unilateral (flexión de rodilla)', 'Compuesto unilateral',
ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral'],
ARRAY['Glúteo Mayor', 'Aductores'],
'Máquina Perfecta o similar', 'Intermedio', cuadriceps_id,
'Espalda firme en respaldo, un pie en plataforma, core activado.',
'Inhala y baja en 2–3 s, rodilla avanza sobre pie (énfasis cuádriceps).',
'Pausa breve en 90°.',
'Exhala y empuja extendiendo rodilla en 1–2 s.',
ARRAY['Rotar cadera', 'rodilla en valgo', 'acortar recorrido'],
ARRAY['Gonartrosis severa', 'inestabilidad ligamentaria', 'dolor patelofemoral']),

-- 15. Sentadilla Hack unilateral
('Sentadilla Hack unilateral (flexión de rodilla)', 'Compuesto unilateral',
ARRAY['Recto Femoral', 'Vasto Lateral'],
ARRAY['Glúteo Mayor', 'Core'],
'Máquina Hack', 'Intermedio / Avanzado', cuadriceps_id,
'Espalda firme en respaldo, un pie en plataforma, core activado.',
'Inhala y baja lento en 2–3 s, rodilla avanza (énfasis cuádriceps).',
'Pausa breve abajo.',
'Exhala y empuja con talón extendiendo rodilla/cadera.',
ARRAY['Rodilla demasiado adelantada', 'perder apoyo del talón', 'rango corto'],
ARRAY['Síndrome patelofemoral', 'lesiones meniscales', 'artrosis avanzada']),

-- 16. Extensión de cuádriceps en máquina
('Extensión de cuádriceps en máquina (flexión de rodilla)', 'Aislado',
ARRAY['Todos los vastos', 'Recto Femoral'],
ARRAY[],
'Máquina específica de extensión', 'Todos', cuadriceps_id,
'Sentado, respaldo ajustado, almohadilla en parte baja de tibia.',
'Inhala y baja controlado en 2–3 s hasta 90°.',
'Pausa 1 s arriba con contracción máxima.',
'Exhala y extiende rodillas hasta casi bloquear manteniendo cadera fija.',
ARRAY['Arquear lumbar', 'usar impulso', 'rango reducido'],
ARRAY['Condromalacia rotuliana', 'tendinopatía rotuliana', 'cirugía reciente']),

-- 17. Nórdico inverso
('Nórdico inverso (flexión de rodilla)', 'Aislado',
ARRAY['Recto Femoral', 'Vasto Medial'],
ARRAY[],
'Peso corporal', 'Avanzado', cuadriceps_id,
'De rodillas, tobillos fijados, torso erguido, brazos al pecho.',
'Inhala y baja torso hacia atrás en 2–3 s manteniendo cadera extendida (énfasis cuádriceps).',
'Pausa en rango máximo tolerado.',
'Exhala y contrae cuádriceps para regresar torso a vertical.',
ARRAY['Hiperextender zona lumbar', 'bajar rápido', 'perder alineación'],
ARRAY['Lesión de LCA', 'dolor patelofemoral avanzado', 'problemas de rótula']),

-- 18. Sentadilla Sissy
('Sentadilla Sissy (flexión de rodilla)', 'Aislado',
ARRAY['Recto Femoral', 'Vasto Medial'],
ARRAY[],
'Barra, soporte o máquina Sissy', 'Intermedio / Avanzado', cuadriceps_id,
'De pie, pies juntos, sujetándote de soporte. Core firme, torso recto.',
'Inhala, inclina torso hacia atrás en 2–3 s mientras flexionas rodillas. Rodillas avanzan claramente al frente (énfasis cuádriceps).',
'Pausa breve en rango bajo.',
'Exhala y regresa torso a vertical extendiendo rodillas.',
ARRAY['Rodillas en valgo', 'perder alineación de tobillos', 'compensar con cadera'],
ARRAY['Lesión femoropatelar', 'tendinitis rotuliana', 'gonartrosis avanzada']),

-- 19. Sentadilla española
('Sentadilla española (flexión de rodilla)', 'Aislado / cuasi-isométrico',
ARRAY['Recto Femoral', 'Vasto Medial', 'Vasto Lateral'],
ARRAY['Core'],
'Banco, pared o soporte', 'Intermedio', cuadriceps_id,
'De rodillas sobre colchoneta, pies fijados bajo soporte. Torso erguido, core firme, brazos cruzados al pecho.',
'Inhala y deja que el torso se incline hacia atrás lentamente (2–3 s), manteniendo cadera extendida.',
'Pausa breve en rango bajo, tensión máxima en cuádriceps.',
'Exhala y activa cuádriceps regresando torso a vertical en 1–2 s.',
ARRAY['Hiperextender zona lumbar', 'bajar sin control', 'perder alineación de rodillas'],
ARRAY['Lesiones de rodilla no rehabilitadas', 'tendinopatía rotuliana', 'gonartrosis avanzada']),

-- 20. Sentadilla Goblet con talones elevados
('Sentadilla Goblet con talones elevados (flexión de rodilla)', 'Compuesto',
ARRAY['Énfasis en Vasto Medial'],
ARRAY['Glúteo Mayor', 'Core'],
'Mancuerna o kettlebell + cuñas/discos', 'Intermedio', cuadriceps_id,
'De pie, pies al ancho de hombros con talones elevados en discos/cuña. Sostén mancuerna contra el pecho. Torso recto, core firme.',
'Inhala y baja flexionando rodillas hacia adelante en 2–3 s. Torso lo más erguido posible (énfasis cuádriceps).',
'Pausa 1 s en paralelo con rodillas alineadas.',
'Exhala y extiende rodillas empujando con planta completa.',
ARRAY['Inclinar torso excesivamente', 'rodillas en valgo', 'perder estabilidad'],
ARRAY['Problemas de tobillo', 'inestabilidad ligamentaria', 'tendinopatía de Aquiles']),

-- 21. Sentadilla con salto (jump squat)
('Sentadilla con salto (jump squat)', 'Pliométrico',
ARRAY['Cuádriceps completo'],
ARRAY['Glúteos', 'gemelos', 'core'],
'Peso corporal', 'Intermedio - Avanzado', cuadriceps_id,
'De pie, pies al ancho de hombros, brazos preparados para impulso.',
'Baja rápidamente a posición de sentadilla en 1 s.',
'Transición explosiva sin pausa.',
'Explota hacia arriba saltando lo más alto posible, aterrizando suavemente.',
ARRAY['Aterrizaje rígido', 'rodillas en valgo al aterrizar', 'no amortiguar'],
ARRAY['Lesiones de rodilla activas', 'problemas de tobillo', 'superficies duras']),

-- 22. Wall sit (sentadilla isométrica en pared)
('Wall sit (sentadilla isométrica en pared)', 'Isométrico',
ARRAY['Cuádriceps completo'],
ARRAY['Glúteos', 'core'],
'Peso corporal + pared', 'Principiante - Intermedio', cuadriceps_id,
'Espalda contra la pared, pies separados del muro, rodillas a 90°.',
'Mantener posición sin movimiento.',
'Sostener 30 segundos a 2+ minutos según nivel.',
'Mantener posición sin movimiento.',
ARRAY['Deslizarse hacia abajo', 'rodillas más adelante de tobillos', 'perder contacto con pared'],
ARRAY['Dolor agudo de rodilla', 'problemas de espalda baja', 'hipertensión severa']);

-- ===================================================================
-- COMPLETAR EJERCICIOS DE ISQUIOTIBIALES (FALTANTES 6-20)
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 6. Curl de isquiotibiales en máquina (sentado)
('Curl de isquiotibiales en máquina (sentado)', 'Aislamiento',
ARRAY['Semitendinoso', 'Semimembranoso'],
ARRAY['Gastrocnemio'],
'Máquina de curl sentado', 'Principiante – Avanzado', isquiotibiales_id,
'Sentado, espalda firme contra respaldo, almohadilla sobre parte baja de gemelos, muslos asegurados.',
'Inhala y extiende rodillas lentamente en 2–3 s.',
'Mantén contracción máxima por 1 s.',
'Exhala y flexiona rodillas tirando talones hacia el asiento en 1–2 s.',
ARRAY['Arquear espalda', 'usar impulso de torso', 'rango de movimiento reducido'],
ARRAY['Síndrome del compartimento posterior agudo', 'trombosis venosa en piernas']),

-- 7. Curl de isquiotibiales con fitball
('Curl de isquiotibiales con fitball', 'Aislamiento + estabilización',
ARRAY['Bíceps femoral', 'Semitendinoso', 'Semimembranoso'],
ARRAY['Core', 'glúteos'],
'Fitball', 'Intermedio – Avanzado', isquiotibiales_id,
'Tumbado boca arriba, talones sobre fitball, brazos extendidos al costado, cadera elevada.',
'Extiende rodillas controladamente en 2–3 s manteniendo cadera arriba.',
'Pausa breve con rodillas flexionadas y cadera alta.',
'Mantén cadera elevada y flexiona rodillas rodando la pelota hacia ti en 1–2 s.',
ARRAY['Bajar cadera durante el movimiento', 'perder control del fitball', 'usar impulso'],
ARRAY['Dolor lumbar que empeora con puente', 'inestabilidad de cadera']),

-- 8. Peso muerto rumano con barra
('Peso muerto rumano con barra', 'Compuesto',
ARRAY['Bíceps femoral', 'Semitendinoso', 'Semimembranoso'],
ARRAY['Glúteo mayor', 'erectores espinales', 'trapecio', 'core'],
'Barra olímpica', 'Intermedio – Avanzado', isquiotibiales_id,
'De pie, barra en manos con agarre prono, pies al ancho de cadera, rodillas semiflexionadas.',
'Inhala, cadera hacia atrás, baja barra pegada a piernas en 2–3 s.',
'Pausa breve al máximo estiramiento de isquios sin redondear lumbar.',
'Exhala, empuja cadera adelante y extiende en 1–2 s.',
ARRAY['Flexionar rodillas excesivamente', 'redondear zona lumbar', 'separar barra del cuerpo'],
ARRAY['Hernia discal lumbar sintomática', 'espondilolistesis', 'dolor ciático activo']),

-- 9. Peso muerto rumano unilateral con mancuerna
('Peso muerto rumano unilateral con mancuerna', 'Compuesto unilateral',
ARRAY['Isquiotibiales de la pierna de apoyo'],
ARRAY['Glúteo mayor', 'core', 'erectores espinales'],
'Mancuerna', 'Intermedio – Avanzado', isquiotibiales_id,
'Pie de apoyo plantado, mancuerna en mano contraria, pierna libre ligeramente elevada atrás.',
'Inhala, pivota en cadera llevando mancuerna hacia abajo mientras la pierna libre se eleva atrás.',
'Pausa breve con torso casi paralelo al suelo.',
'Exhala, extiende cadera regresando a vertical en 1–2 s.',
ARRAY['Rotación de cadera', 'pérdida del equilibrio', 'flexionar rodilla de apoyo excesivamente'],
ARRAY['Déficits severos de equilibrio', 'lesiones de tobillo no rehabilitadas']),

-- 10. Curl de isquiotibiales con banda elástica
('Curl de isquiotibiales con banda elástica', 'Aislamiento',
ARRAY['Bíceps femoral', 'Semitendinoso', 'Semimembranoso'],
ARRAY['Gemelos', 'core'],
'Banda elástica', 'Principiante – Intermedio', isquiotibiales_id,
'Tumbado boca abajo, banda fijada al tobillo y anclada enfrente, pierna extendida.',
'Inhala y extiende rodilla controladamente en 2–3 s.',
'Pausa 1 s en máxima contracción contra la resistencia.',
'Exhala y flexiona rodilla llevando talón hacia glúteo en 1–2 s.',
ARRAY['Elevar cadera', 'movimiento demasiado rápido', 'tensión inadecuada de banda'],
ARRAY['Calambres frecuentes en isquiotibiales', 'tendinopatía distal aguda']),

-- 11. Good mornings con barra
('Good mornings con barra', 'Compuesto',
ARRAY['Isquiotibiales', 'erectores espinales'],
ARRAY['Glúteo mayor', 'core', 'trapecio'],
'Barra olímpica', 'Intermedio – Avanzado', isquiotibiales_id,
'Barra en trapecios (posición de sentadilla), pies al ancho de hombros, core firme.',
'Inhala, pivota en cadera bajando torso hasta 45-60° manteniendo espalda neutra.',
'Pausa breve sintiendo estiramiento en isquios.',
'Exhala, extiende cadera regresando a posición erguida en 1–2 s.',
ARRAY['Redondear espalda', 'bajar demasiado', 'usar peso excesivo', 'flexionar rodillas'],
ARRAY['Hernia discal conocida', 'dolor lumbar mecánico']),

-- 12. Curl de isquiotibiales de pie con cable
('Curl de isquiotibiales de pie con cable', 'Aislamiento unilateral',
ARRAY['Isquiotibiales de la pierna activa'],
ARRAY['Core', 'gemelos'],
'Polea baja con correa de tobillo', 'Principiante – Intermedio', isquiotibiales_id,
'De pie frente a la polea, correa en tobillo, pierna de apoyo firme, manos en apoyo para equilibrio.',
'Inhala y extiende rodilla controlado en 2–3 s.',
'Pausa 1 s en máxima contracción.',
'Exhala y flexiona rodilla llevando talón hacia glúteo en 1–2 s.',
ARRAY['Balanceo del torso', 'compensación con cadera', 'movimiento demasiado rápido'],
ARRAY['Inestabilidad severa de tobillo', 'dolor patelofemoral que empeora con flexión cargada']),

-- 13. Puente de glúteo con flexión de isquiotibiales
('Puente de glúteo con flexión de isquiotibiales (curl bridge)', 'Compuesto',
ARRAY['Isquiotibiales', 'glúteo mayor'],
ARRAY['Core', 'erectores espinales'],
'Peso corporal o mancuerna', 'Intermedio', isquiotibiales_id,
'Tumbado boca arriba, talones apoyados cerca de glúteos, mancuerna opcional sobre cadera.',
'Inhala, baja cadera controladamente manteniendo talones fijos.',
'Mantén puente con máxima contracción de glúteos e isquios por 1–2 s.',
'Exhala, eleva cadera y flexiona ligeramente rodillas "arrastrando" talones.',
ARRAY['Elevar con impulso lumbar', 'no mantener tensión en isquios', 'rango incompleto'],
ARRAY['Dolor lumbar que empeora con hiperextensión', 'problemas de rodilla con flexión cargada']),

-- 14. Curl de isquiotibiales en suspensión (TRX)
('Curl de isquiotibiales en suspensión (TRX)', 'Aislamiento + estabilización',
ARRAY['Isquiotibiales'],
ARRAY['Core', 'glúteos'],
'TRX o sistema de suspensión', 'Intermedio – Avanzado', isquiotibiales_id,
'Tumbado boca arriba, talones en estribos de TRX, cadera elevada, brazos extendidos.',
'Extiende rodillas controladamente manteniendo cadera elevada.',
'Pausa breve en máxima contracción.',
'Mantén cadera alta y flexiona rodillas acercando talones a glúteos.',
ARRAY['Bajar cadera durante el movimiento', 'pérdida de control del TRX', 'movimiento asimétrico'],
ARRAY['Lesiones de hombro que impidan apoyo', 'inestabilidad lumbar severa']),

-- 15. Stiff leg deadlift con mancuernas
('Stiff leg deadlift con mancuernas (piernas rígidas)', 'Compuesto',
ARRAY['Isquiotibiales', 'glúteo mayor'],
ARRAY['Erectores espinales', 'core'],
'Mancuernas', 'Intermedio', isquiotibiales_id,
'De pie, mancuernas al frente, piernas prácticamente extendidas (mínima flexión de rodilla).',
'Inhala, pivota en cadera bajando mancuernas en línea recta.',
'Pausa al máximo estiramiento de isquios sin redondear espalda.',
'Exhala, extiende cadera regresando a posición inicial.',
ARRAY['Flexionar rodillas excesivamente', 'redondear zona lumbar', 'separar mancuernas del cuerpo'],
ARRAY['Rigidez severa de isquiotibiales', 'dolor lumbar mecánico', 'hernias discales']),

-- 16. Curl de isquiotibiales con pelota medicinal
('Curl de isquiotibiales con pelota medicinal (squeeze y curl)', 'Aislamiento + compresión',
ARRAY['Isquiotibiales'],
ARRAY['Aductores', 'core'],
'Pelota medicinal blanda', 'Principiante – Intermedio', isquiotibiales_id,
'Tumbado boca arriba, pelota medicinal entre gemelos y parte posterior de muslos.',
'Inhala, extiende rodillas manteniendo compresión de pelota.',
'Mantén compresión y contracción por 1–2 s.',
'Exhala, aprieta pelota mientras flexionas rodillas y elevas cadera.',
ARRAY['Perder compresión de pelota', 'elevar cadera con impulso lumbar'],
ARRAY['Problemas de rodilla que empeoren con compresión', 'calambres frecuentes en gemelos']),

-- 17. Kettlebell swing (énfasis isquiotibiales)
('Kettlebell swing (énfasis isquiotibiales)', 'Balístico/dinámico',
ARRAY['Isquiotibiales', 'glúteo mayor'],
ARRAY['Core', 'deltoides', 'trapecio'],
'Kettlebell', 'Intermedio – Avanzado', isquiotibiales_id,
'De pie, kettlebell entre piernas, agarre con ambas manos, pies al ancho de hombros.',
'Inhala, cadera hacia atrás, kettlebell baja entre piernas.',
'Permite que kettlebell caiga naturalmente para repetir el patrón.',
'Exhala explosivamente, extiende cadera proyectando kettlebell al frente.',
ARRAY['Usar brazos para elevar', 'sentadilla en lugar de bisagra de cadera', 'hiperextender lumbar arriba'],
ARRAY['Dolor lumbar que empeora con movimientos balísticos', 'problemas de muñeca o hombro']),

-- 18. Hiperextensión inversa
('Hiperextensión inversa', 'Compuesto',
ARRAY['Isquiotibiales', 'glúteo mayor'],
ARRAY['Erectores espinales', 'core'],
'Banco de hiperextensión inversa', 'Intermedio', isquiotibiales_id,
'Boca abajo en banco, torso fijo, caderas en el borde, piernas colgando.',
'Inhala, baja piernas controladamente.',
'Pausa 1 s en máxima contracción.',
'Exhala, eleva piernas extendidas hasta línea del torso.',
ARRAY['Elevar piernas más allá de la línea corporal', 'usar impulso', 'flexionar rodillas excesivamente'],
ARRAY['Dolor lumbar que empeora con extensión', 'problemas cervicales con flexión sostenida']),

-- 19. Curl de isquiotibiales en cable acostado
('Curl de isquiotibiales en cable acostado', 'Aislamiento',
ARRAY['Isquiotibiales'],
ARRAY['Gemelos', 'core'],
'Polea baja, correa de tobillo, banco', 'Principiante – Intermedio', isquiotibiales_id,
'Acostado boca abajo en banco, correa en tobillo conectada a polea baja.',
'Inhala, extiende rodilla controladamente contra resistencia.',
'Pausa 1 s en máxima contracción.',
'Exhala, flexiona rodilla llevando talón hacia glúteo.',
ARRAY['Elevar cadera del banco', 'movimiento demasiado rápido', 'compensación con torso'],
ARRAY['Problemas de rodilla que empeoren con flexión resistida', 'molestias en posición prona']),

-- 20. Single leg deadlift con apoyo
('Single leg deadlift con apoyo', 'Compuesto unilateral',
ARRAY['Isquiotibiales de pierna de apoyo'],
ARRAY['Glúteo mayor', 'core', 'erectores espinales'],
'Mancuerna ligera, apoyo opcional', 'Principiante – Intermedio', isquiotibiales_id,
'Pie de apoyo plantado, mancuerna en mano contraria, mano libre puede usar apoyo ligero.',
'Inhala, pivota en cadera, baja mancuerna mientras pierna libre se eleva.',
'Pausa breve con torso inclinado y pierna libre elevada.',
'Exhala, regresa a posición erguida extendiendo cadera.',
ARRAY['Dependencia excesiva del apoyo', 'rotación de cadera', 'pérdida del equilibrio'],
ARRAY['Déficits severos de equilibrio', 'lesiones de tobillo recientes', 'dolor lumbar unilateral']);

-- ===================================================================
-- COMPLETAR EJERCICIOS DE GLÚTEOS (FALTANTES 6-20)
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 6. Patada de glúteo en cuadrupedia
('Patada de glúteo en cuadrupedia', 'Aislamiento',
ARRAY['Glúteo mayor'],
ARRAY['Core', 'isquiotibiales'],
'Peso corporal', 'Principiante', gluteos_id,
'En cuadrupedia, manos bajo hombros, rodillas bajo caderas, core activado.',
'Inhala, baja pierna controladamente sin tocar el suelo.',
'Pausa 1 s en máxima contracción de glúteo.',
'Exhala, eleva una pierna hacia atrás manteniendo rodilla a 90°.',
ARRAY['Arquear zona lumbar', 'elevar pierna demasiado alto', 'compensar con rotación de cadera'],
ARRAY['Dolor lumbar que empeora en cuadrupedia', 'problemas de muñeca o rodilla']),

-- 7. Hip thrust con barra
('Hip thrust con barra', 'Aislamiento con carga',
ARRAY['Glúteo mayor'],
ARRAY['Isquiotibiales', 'core'],
'Barra olímpica, banco, almohadilla', 'Intermedio – Avanzado', gluteos_id,
'Espalda alta en banco, barra sobre cadera con almohadilla, pies plantados firmemente.',
'Inhala, baja cadera controladamente manteniendo tensión.',
'Mantén contracción máxima por 1 s.',
'Exhala, aprieta glúteos elevando cadera hasta formar línea recta.',
ARRAY['Hiperextender lumbar', 'usar impulso', 'no lograr extensión completa de cadera'],
ARRAY['Dolor lumbar severo', 'lesiones de cadera', 'problemas en flexores de cadera']),

-- 8. Caminata lateral con banda
('Caminata lateral con banda', 'Aislamiento + activación',
ARRAY['Glúteo medio', 'glúteo menor'],
ARRAY['Tensor de fascia lata', 'core'],
'Banda elástica', 'Principiante – Todos', gluteos_id,
'De pie, banda alrededor de tobillos o por encima de rodillas, ligera flexión de cadera y rodillas.',
'Controla el regreso del pie sin perder tensión de banda.',
'Mantén posición por 1 s sin que rodillas colapsen.',
'Exhala, da paso lateral manteniendo tensión en banda.',
ARRAY['Rodillas colapsando hacia dentro', 'torso inclinado', 'pasos demasiado pequeños'],
ARRAY['Dolor en cintilla iliotibial', 'bursitis trocantérea aguda', 'lesiones de cadera']),

-- 9. Peso muerto con piernas rígidas (stiff leg)
('Peso muerto con piernas rígidas (stiff leg)', 'Compuesto',
ARRAY['Glúteo mayor', 'isquiotibiales'],
ARRAY['Erectores espinales', 'core'],
'Barra o mancuernas', 'Intermedio', gluteos_id,
'De pie, barra en manos, piernas prácticamente extendidas con mínima flexión de rodilla.',
'Inhala, pivota en cadera bajando barra en línea recta hacia el suelo.',
'Pausa al máximo estiramiento sin redondear espalda.',
'Exhala, extiende cadera regresando a posición erguida.',
ARRAY['Flexionar rodillas excesivamente', 'redondear zona lumbar', 'separar barra del cuerpo'],
ARRAY['Rigidez severa de isquiotibiales', 'hernia discal lumbar', 'dolor ciático']),

-- 10. Elevación lateral de pierna acostado
('Elevación lateral de pierna acostado', 'Aislamiento',
ARRAY['Glúteo medio'],
ARRAY['Tensor de fascia lata', 'core'],
'Peso corporal', 'Principiante', gluteos_id,
'Acostado de lado, pierna inferior flexionada para estabilidad, pierna superior extendida.',
'Inhala, baja pierna controladamente sin tocar la inferior.',
'Pausa 1 s en máxima contracción.',
'Exhala, eleva pierna superior lateralmente hasta 45°.',
ARRAY['Rotar cadera hacia atrás', 'elevar pierna demasiado alto', 'compensar con torso'],
ARRAY['Bursitis trocantérea', 'síndrome de cintilla iliotibial', 'dolor en abductores']),

-- 11. Sentadilla goblet con pausa
('Sentadilla goblet con pausa', 'Compuesto con énfasis isométrico',
ARRAY['Glúteo mayor', 'cuádriceps'],
ARRAY['Core', 'aductores'],
'Mancuerna o kettlebell', 'Principiante – Intermedio', gluteos_id,
'De pie, mancuerna contra el pecho, pies al ancho de hombros, puntas ligeramente hacia fuera.',
'Inhala, baja controladamente hasta paralelo o más abajo.',
'Mantén posición por 2–3 s con glúteos activos.',
'Exhala, empuja con talones extendiendo cadera y rodillas.',
ARRAY['Perder tensión durante la pausa', 'inclinar torso excesivamente', 'rodillas colapsando'],
ARRAY['Dolor de rodilla que empeora con isométricos', 'problemas de equilibrio']),

-- 12. Peso muerto sumo
('Peso muerto sumo', 'Compuesto',
ARRAY['Glúteo mayor', 'aductores'],
ARRAY['Cuádriceps', 'erectores espinales', 'trapecio'],
'Barra olímpica', 'Intermedio – Avanzado', gluteos_id,
'Stance amplio, puntas hacia fuera, agarre estrecho dentro de piernas, espalda neutra.',
'Inhala, baja controladamente siguiendo mismo patrón.',
'Pausa breve arriba con extensión completa.',
'Exhala, extiende cadera y rodillas manteniendo torso más erguido que peso muerto convencional.',
ARRAY['Rodillas colapsando hacia dentro', 'barra alejándose del cuerpo', 'torso demasiado inclinado'],
ARRAY['Dolor en aductores', 'pinzamiento femoroacetabular', 'lesiones de espalda baja']),

-- 13. Hip thrust unilateral
('Hip thrust unilateral', 'Aislamiento unilateral',
ARRAY['Glúteo mayor de pierna activa'],
ARRAY['Core', 'isquiotibiales'],
'Banco', 'Intermedio', gluteos_id,
'Espalda alta en banco, un pie plantado, pierna opuesta extendida o flexionada al pecho.',
'Inhala, baja cadera controladamente.',
'Pausa 1–2 s en máxima contracción.',
'Exhala, eleva cadera con pierna activa hasta línea recta.',
ARRAY['Rotación de cadera', 'compensación con pierna inactiva', 'rango incompleto'],
ARRAY['Asimetrías severas de cadera', 'dolor lumbar unilateral', 'problemas de equilibrio']),

-- 14. Sentadilla búlgara (split squat trasero elevado)
('Sentadilla búlgara (split squat trasero elevado)', 'Compuesto unilateral',
ARRAY['Glúteo mayor de pierna delantera'],
ARRAY['Cuádriceps', 'core'],
'Banco, mancuernas opcional', 'Intermedio', gluteos_id,
'Pie trasero elevado en banco, pie delantero plantado, torso erguido, mancuernas a los costados.',
'Inhala, baja hasta que rodilla delantera esté a 90°.',
'Pausa breve manteniendo peso en pierna delantera.',
'Exhala, empuja con talón delantero para subir.',
ARRAY['Demasiado peso en pierna trasera', 'torso inclinado hacia adelante', 'paso muy corto'],
ARRAY['Problemas de equilibrio', 'lesiones de rodilla', 'dolor en flexores de cadera']),

-- 15. Puente de glúteo con una pierna
('Puente de glúteo con una pierna', 'Aislamiento unilateral',
ARRAY['Glúteo mayor de pierna activa'],
ARRAY['Core', 'isquiotibiales'],
'Peso corporal', 'Intermedio', gluteos_id,
'Tumbado boca arriba, un pie plantado, pierna opuesta extendida o flexionada al pecho.',
'Inhala, baja cadera controladamente.',
'Mantén contracción por 1–2 s.',
'Exhala, eleva cadera con pierna activa hasta línea recta.',
ARRAY['Rotación de pelvis', 'compensación con pierna inactiva', 'hiperextensión lumbar'],
ARRAY['Asimetrías severas de cadera', 'dolor lumbar unilateral']),

-- 16. Peso muerto rumano con una pierna
('Peso muerto rumano con una pierna', 'Compuesto unilateral',
ARRAY['Glúteo mayor de pierna de apoyo'],
ARRAY['Isquiotibiales', 'core', 'erectores espinales'],
'Mancuernas', 'Intermedio – Avanzado', gluteos_id,
'Pie de apoyo plantado, mancuernas en manos, pierna libre ligeramente elevada atrás.',
'Inhala, pivota en cadera bajando mancuernas mientras pierna libre se eleva.',
'Pausa en máxima flexión de cadera.',
'Exhala, extiende cadera regresando a vertical.',
ARRAY['Rotación de cadera', 'pérdida del equilibrio', 'flexionar rodilla de apoyo excesivamente'],
ARRAY['Déficits severos de equilibrio', 'lesiones de tobillo', 'dolor lumbar unilateral']),

-- 17. Clamshell (almeja) con banda
('Clamshell (almeja) con banda', 'Aislamiento',
ARRAY['Glúteo medio', 'rotadores externos de cadera'],
ARRAY['Glúteo menor'],
'Banda elástica', 'Principiante', gluteos_id,
'Acostado de lado, rodillas flexionadas a 90°, banda alrededor de muslos, cabeza apoyada.',
'Inhala, cierra controladamente manteniendo tensión.',
'Pausa 1 s en máxima apertura.',
'Exhala, abre rodilla superior contra resistencia de banda.',
ARRAY['Rotar pelvis hacia atrás', 'abrir demasiado rápido', 'perder alineación de pies'],
ARRAY['Bursitis trocantérea', 'dolor en rotadores externos', 'síndrome piriforme']),

-- 18. Step-up lateral
('Step-up lateral', 'Compuesto unilateral',
ARRAY['Glúteo mayor y medio'],
ARRAY['Cuádriceps', 'core'],
'Banco lateral, mancuernas opcional', 'Intermedio', gluteos_id,
'De pie al lado del banco, pie más cercano sobre la superficie, torso erguido.',
'Inhala, baja controladamente con la pierna que subió primero.',
'Pausa breve arriba con ambos pies en banco.',
'Exhala, empuja con pierna sobre banco para subir lateralmente.',
ARRAY['Impulsarse con pierna de suelo', 'inclinarse hacia el banco', 'banco inestable'],
ARRAY['Problemas de equilibrio', 'lesiones de tobillo', 'dolor en abductores']),

-- 19. Reverse lunge con déficit
('Reverse lunge con déficit', 'Compuesto unilateral',
ARRAY['Glúteo mayor de pierna delantera'],
ARRAY['Cuádriceps', 'isquiotibiales', 'core'],
'Plataforma elevada, mancuernas', 'Intermedio – Avanzado', gluteos_id,
'De pie sobre plataforma elevada, mancuernas a los costados, torso erguido.',
'Inhala, da paso atrás bajando del platform hasta que ambas rodillas estén a 90°.',
'Pausa breve en posición baja.',
'Exhala, empuja con pierna delantera para regresar a plataforma.',
ARRAY['Paso demasiado corto', 'perder equilibrio al bajar', 'no usar rango completo'],
ARRAY['Problemas de equilibrio severos', 'lesiones de tobillo', 'vértigo']),

-- 20. Hip abduction en máquina
('Hip abduction en máquina', 'Aislamiento',
ARRAY['Glúteo medio', 'glúteo menor'],
ARRAY['Tensor de fascia lata'],
'Máquina de abducción', 'Principiante – Todos', gluteos_id,
'Sentado en máquina, espalda firme contra respaldo, muslos contra almohadillas.',
'Inhala, regresa controladamente sin que pesas toquen.',
'Pausa 1 s en máxima apertura.',
'Exhala, separa muslos contra resistencia hasta rango completo.',
ARRAY['Inclinarse hacia adelante', 'usar impulso', 'rango incompleto'],
ARRAY['Dolor en aductores', 'pinzamiento femoroacetabular', 'bursitis trocantérea aguda']);

-- ===================================================================
-- COMPLETAR EJERCICIOS DE DELTOIDES MEDIAL (FALTANTES 4-10)
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 4. Elevación Lateral en Polea Baja (cruzado por delante)
('Elevación Lateral en Polea Baja (cruzado por delante)', 'Aislamiento',
ARRAY['Deltoides medial'],
ARRAY['Deltoides posterior', 'trapecio medio'],
'Polea baja con maneral individual', 'Intermedio – Avanzado', deltoides_medial_id,
'De pie frente a la polea, sosteniendo el maneral con el brazo contrario al lado de la polea. Cable cruza por delante del cuerpo, brazo ligeramente flexionado. Core firme, postura erguida.',
'Exhala y regresa controladamente por la misma trayectoria.',
'Pausa 1 s en máxima contracción.',
'Inhala y lleva el brazo en arco lateral-posterior hasta la línea del hombro, sintiendo estiramiento inicial del deltoides medial.',
ARRAY['Compensar con rotación del tronco', 'elevar por encima de la línea del hombro', 'perder tensión en la porción media del recorrido'],
ARRAY['Dolor acromioclavicular', 'inestabilidad glenohumeral posterior', 'síndrome de salida torácica']),

-- 5. Elevación Lateral en Polea Alta (trayectoria descendente)
('Elevación Lateral en Polea Alta (trayectoria descendente)', 'Aislamiento',
ARRAY['Deltoides medial'],
ARRAY['Deltoides posterior', 'trapecio medio'],
'Polea alta con maneral individual', 'Intermedio – Avanzado', deltoides_medial_id,
'De pie al costado de la polea alta, sosteniendo el maneral con el brazo más alejado. Brazo ligeramente flexionado, inicialmente elevado cerca de la línea del hombro. Core activo, postura estable.',
'Exhala y baja controladamente, manteniendo tensión constante.',
'Pausa breve en la contracción máxima.',
'Desde posición baja, inhala y eleva el brazo lateralmente hasta la línea del hombro contra la resistencia descendente.',
ARRAY['Iniciar el movimiento con flexión del codo', 'compensar con inclinación lateral del tronco', 'perder control en la fase excéntrica'],
ARRAY['Síndrome subacromial con dolor en elevación sostenida', 'tendinopatía del manguito rotador', 'dolor glenohumeral en posición elevada']),

-- 6. Press Militar tras Nuca (énfasis en deltoides medial)
('Press Militar tras Nuca (énfasis en deltoides medial)', 'Compuesto',
ARRAY['Deltoides medial', 'deltoides anterior'],
ARRAY['Tríceps', 'trapecio superior', 'serrato anterior'],
'Barra olímpica', 'Avanzado', deltoides_medial_id,
'Sentado o de pie, barra colocada en los trapecios (posición de sentadilla). Agarre amplio, aproximadamente 1.5 veces el ancho de hombros. Escápulas retraídas, core firme.',
'Inhala y baja controladamente hasta la base del cuello.',
'Pausa breve arriba sin bloquear completamente los codos.',
'Exhala y presiona la barra verticalmente desde la base del cuello hasta extensión completa.',
ARRAY['Bajar la barra demasiado', 'arqueo excesivo de la zona lumbar', 'agarre demasiado estrecho'],
ARRAY['Limitación severa de rotación externa de hombro', 'síndrome de pinzamiento posterior', 'dolor cervical con carga axial', 'inestabilidad glenohumeral anterior']),

-- 7. Elevación Lateral con Mancuernas en Banco Inclinado
('Elevación Lateral con Mancuernas en Banco Inclinado', 'Aislamiento',
ARRAY['Deltoides medial'],
ARRAY['Deltoides posterior', 'trapecio medio'],
'Mancuernas, banco inclinado', 'Intermedio', deltoides_medial_id,
'Acostado de lado en banco inclinado a 30-45°. Mancuerna en la mano del brazo superior, brazo ligeramente flexionado. Core activado para mantener estabilidad en el banco.',
'Exhala y baja lentamente manteniendo control total.',
'Pausa 1 s en máxima contracción del deltoides medial.',
'Inhala y eleva el brazo lateralmente hasta la línea del hombro.',
ARRAY['Rotar el tronco durante el movimiento', 'elevar demasiado alto', 'perder estabilidad en el banco'],
ARRAY['Dolor lumbar que empeora en posición inclinada', 'lesiones de hombro que impidan el apoyo lateral', 'problemas de equilibrio severos']),

-- 8. Elevación Lateral con Pausa Isométrica
('Elevación Lateral con Pausa Isométrica', 'Aislamiento con énfasis isométrico',
ARRAY['Deltoides medial'],
ARRAY['Supraespinoso', 'trapecio medio'],
'Mancuernas', 'Intermedio – Avanzado', deltoides_medial_id,
'De pie, mancuernas a los costados, ligera flexión de codos. Postura erguida, escápulas en posición neutra.',
'Exhala y baja muy lentamente (3–4 s) hasta posición inicial.',
'Mantén la posición por 2–5 s con contracción máxima del deltoides medial.',
'Inhala y eleva los brazos lateralmente hasta la línea del hombro.',
ARRAY['Perder tensión durante la pausa isométrica', 'compensar con trapecio durante el mantenimiento', 'reducir el tiempo isométrico por fatiga'],
ARRAY['Tendinopatía del supraespinoso aguda', 'síndrome de fatiga del manguito rotador', 'dolor subacromial con contracción sostenida']),

-- 9. Elevación Lateral en Máquina (sentado)
('Elevación Lateral en Máquina (sentado)', 'Aislamiento guiado',
ARRAY['Deltoides medial'],
ARRAY['Supraespinoso', 'trapecio superior'],
'Máquina de elevación lateral', 'Principiante – Avanzado', deltoides_medial_id,
'Sentado en la máquina, espalda firmemente apoyada en el respaldo. Brazos posicionados contra las almohadillas, codos ligeramente flexionados. Ajustar altura del asiento para alineación correcta.',
'Inhala y baja controladamente sin que las pesas toquen.',
'Pausa breve en máxima contracción.',
'Exhala y eleva los brazos lateralmente hasta la línea del hombro.',
ARRAY['Ajuste incorrecto de la máquina', 'usar impulso para iniciar el movimiento', 'no completar el rango de movimiento'],
ARRAY['Dolor agudo en deltoides o manguito rotador', 'limitaciones severas de movilidad de hombro', 'bursitis subacromial en fase aguda']),

-- 10. Elevación Lateral con Bandas Elásticas
('Elevación Lateral con Bandas Elásticas', 'Aislamiento con resistencia variable',
ARRAY['Deltoides medial'],
ARRAY['Supraespinoso', 'estabilizadores escapulares'],
'Banda elástica', 'Principiante – Intermedio', deltoides_medial_id,
'De pie sobre la banda elástica, sosteniendo los extremos con ambas manos. Brazos a los costados, ligera flexión de codos. Core activo, postura erguida.',
'Exhala y baja controladamente luchando contra la tracción de la banda.',
'Pausa breve en la línea del hombro.',
'Inhala y eleva los brazos lateralmente contra la resistencia creciente de la banda.',
ARRAY['Perder tensión en la banda al descender', 'compensar con movimiento del tronco', 'banda demasiado tensa o demasiado floja'],
ARRAY['Dolor en muñeca con agarre sostenido', 'tendinopatía de supraespinoso reactiva', 'síndrome de pinzamiento en elevación repetitiva']);

-- ===================================================================
-- COMPLETAR EJERCICIOS DE CORE (FALTANTES 6-30)
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 6. Elevaciones de Piernas
('Elevaciones de Piernas', 'Flexión de cadera',
ARRAY['Recto abdominal inferior', 'flexores de cadera'],
ARRAY['Oblicuos'],
'Peso corporal', 'Intermedio', core_id,
'Tumbado boca arriba, brazos a los costados, piernas extendidas. Zona lumbar neutra.',
'Baja controladamente sin tocar el suelo.',
'Pausa breve arriba.',
'Eleva piernas hasta 90° de cadera manteniendo zona lumbar neutra.',
ARRAY['Arquear zona lumbar', 'usar impulso', 'bajar piernas demasiado'],
ARRAY['Hernias discales', 'dolor lumbar con flexión de cadera repetida']),

-- 7. Plancha con Elevación de Piernas
('Plancha con Elevación de Piernas', 'Anti-extensión + desafío unilateral',
ARRAY['Transverso del abdomen', 'recto abdominal'],
ARRAY['Glúteos', 'oblicuos'],
'Peso corporal', 'Intermedio – Avanzado', core_id,
'Plancha frontal estándar, apoyo en antebrazos. Core activado, cuerpo en línea recta.',
'Cambia de pierna sin perder posición de plancha.',
'Sostén 3–5 segundos.',
'Eleva una pierna manteniendo alineación corporal.',
ARRAY['Rotar cadera al elevar pierna', 'hundir zona lumbar', 'perder alineación general'],
ARRAY['Dolor lumbar agudo', 'lesiones de cadera']),

-- 8. Mountain Climbers
('Mountain Climbers', 'Dinámico + cardiovascular',
ARRAY['Transverso del abdomen', 'recto abdominal'],
ARRAY['Flexores de cadera', 'hombros'],
'Peso corporal', 'Intermedio – Avanzado', core_id,
'Posición de plancha alta, brazos extendidos. Core activado, cuerpo en línea recta.',
'Mantén posición de plancha en brazos.',
'Mantén posición de plancha en brazos.',
'Alterna llevando rodillas hacia el pecho rápidamente.',
ARRAY['Elevar cadera', 'hundir zona lumbar', 'movimiento demasiado rápido perdiendo forma'],
ARRAY['Problemas cardiovasculares', 'lesiones de muñeca', 'dolor lumbar agudo']),

-- 9. V-Ups
('V-Ups', 'Flexión combinada',
ARRAY['Recto abdominal'],
ARRAY['Flexores de cadera', 'oblicuos'],
'Peso corporal', 'Intermedio – Avanzado', core_id,
'Tumbado boca arriba, brazos extendidos sobre cabeza, piernas extendidas. Zona lumbar en contacto con suelo.',
'Baja controladamente sin tocar completamente el suelo.',
'Toca puntas de pies en la parte superior.',
'Eleva simultáneamente torso y piernas formando una "V".',
ARRAY['Usar impulso excesivo', 'no mantener piernas extendidas', 'arquear zona lumbar'],
ARRAY['Hernias discales', 'dolor lumbar severo', 'problemas cervicales']),

-- 10. Plancha Frontal con Movimiento de Brazos
('Plancha Frontal con Movimiento de Brazos', 'Anti-extensión + desafío de estabilidad',
ARRAY['Transverso del abdomen', 'recto abdominal'],
ARRAY['Deltoides', 'serratos'],
'Peso corporal', 'Intermedio – Avanzado', core_id,
'Plancha frontal estándar. Core muy activado para compensar movimiento de brazos.',
'Cambia de brazo sin perder posición.',
'Sostén 2–3 segundos.',
'Extiende un brazo al frente manteniendo alineación corporal.',
ARRAY['Rotar torso al mover brazo', 'hundir cadera', 'perder activación del core'],
ARRAY['Lesiones de hombro', 'dolor lumbar agudo']),

-- 11. Hollow Body Hold
('Hollow Body Hold', 'Anti-extensión avanzado',
ARRAY['Recto abdominal', 'transverso del abdomen'],
ARRAY['Flexores de cadera'],
'Peso corporal', 'Intermedio – Avanzado', core_id,
'Tumbado boca arriba, zona lumbar presionada contra el suelo. Brazos extendidos sobre cabeza, piernas extendidas.',
'No aplica - ejercicio isométrico.',
'Sostén posición "de banana" con zona lumbar fija. Tiempo: 15–60 segundos según nivel.',
'Eleva hombros y piernas del suelo simultáneamente.',
ARRAY['Arquear zona lumbar', 'elevar demasiado alto', 'tensión excesiva en cuello'],
ARRAY['Hernias discales', 'dolor lumbar agudo', 'problemas cervicales']),

-- 12. Sit-ups Completos
('Sit-ups Completos', 'Flexión completa de tronco',
ARRAY['Recto abdominal', 'flexores de cadera'],
ARRAY['Oblicuos'],
'Peso corporal', 'Principiante – Intermedio', core_id,
'Tumbado boca arriba, rodillas flexionadas, pies fijos o libres. Manos detrás de cabeza o brazos cruzados.',
'Baja controladamente vértebra por vértebra.',
'Pausa breve en posición superior.',
'Flexiona columna hasta sentarte completamente.',
ARRAY['Tirar del cuello', 'usar demasiado impulso', 'bajar sin control'],
ARRAY['Hernias discales', 'problemas de flexores de cadera', 'dolor cervical']),

-- 13. Plancha Lateral con Rotación
('Plancha Lateral con Rotación', 'Anti-inclinación + rotación',
ARRAY['Oblicuos', 'cuadrado lumbar'],
ARRAY['Deltoides', 'transverso del abdomen'],
'Peso corporal', 'Avanzado', core_id,
'Plancha lateral estándar. Brazo superior extendido hacia el techo.',
'Regresa a posición inicial manteniendo plancha lateral.',
'Movimiento lento y controlado.',
'Lleva brazo superior bajo el torso en movimiento de "rosca".',
ARRAY['Perder alineación de plancha lateral', 'hundir cadera durante rotación', 'movimiento demasiado rápido'],
ARRAY['Lesiones de hombro', 'dolor lumbar con rotación']),

-- 14. Bear Crawl
('Bear Crawl', 'Dinámico + anti-extensión',
ARRAY['Transverso del abdomen', 'recto abdominal'],
ARRAY['Deltoides', 'cuádriceps', 'glúteos'],
'Peso corporal', 'Intermedio – Avanzado', core_id,
'Cuadrupedia con rodillas ligeramente elevadas (hover). Core muy activado, espalda neutra.',
'Movimiento lento y controlado.',
'Mantén rodillas cerca del suelo sin tocar.',
'Avanza moviendo mano y pie opuestos simultáneamente.',
ARRAY['Elevar cadera demasiado', 'perder sincronización', 'movimiento demasiado rápido'],
ARRAY['Problemas de muñeca', 'dolor lumbar agudo', 'lesiones de rodilla']),

-- 15. Leg Raises Colgado
('Leg Raises Colgado', 'Flexión de cadera en suspensión',
ARRAY['Recto abdominal', 'flexores de cadera'],
ARRAY['Dorsales', 'oblicuos'],
'Barra de dominadas', 'Avanzado', core_id,
'Colgado de barra con agarre prono. Core activado, piernas extendidas.',
'Baja controladamente sin balancearse.',
'Pausa breve en posición superior.',
'Eleva piernas hasta 90° de cadera o más.',
ARRAY['Usar impulso/balanceo', 'no elevar lo suficiente', 'perder agarre'],
ARRAY['Problemas de agarre', 'lesiones de hombro', 'hernias discales']),

-- 16. Pallof Press
('Pallof Press', 'Anti-rotación',
ARRAY['Oblicuos', 'transverso del abdomen'],
ARRAY['Deltoides', 'serrato anterior'],
'Cable/banda elástica', 'Principiante – Avanzado', core_id,
'De pie al lado de polea media, cable con ambas manos al pecho. Stance estable, core activado.',
'Regresa al pecho manteniendo anti-rotación.',
'Sostén 2–5 segundos.',
'Extiende brazos al frente resistiendo rotación del cable.',
ARRAY['Permitir rotación del torso', 'usar impulso', 'perder postura erguida'],
ARRAY['Dolor lumbar agudo con anti-rotación', 'lesiones de hombro']),

-- 17. Turkish Get-Up (parcial)
('Turkish Get-Up (parcial)', 'Transición compleja',
ARRAY['Core completo', 'estabilizadores de hombro'],
ARRAY['Glúteos', 'piernas'],
'Kettlebell o mancuerna', 'Intermedio – Avanzado', core_id,
'Tumbado con kettlebell en mano extendida al techo. Rodilla del mismo lado flexionada.',
'Cada fase lenta y controlada.',
'Cada fase lenta y controlada.',
'Incorporarse a sentado manteniendo kettlebell arriba.',
ARRAY['Perder verticalidad del peso', 'movimiento demasiado rápido', 'compensaciones múltiples'],
ARRAY['Lesiones de hombro', 'problemas de movilidad múltiple']),

-- 18. Plank Up-Downs
('Plank Up-Downs', 'Dinámico + anti-extensión',
ARRAY['Transverso del abdomen', 'recto abdominal'],
ARRAY['Deltoides', 'tríceps'],
'Peso corporal', 'Intermedio – Avanzado', core_id,
'Plancha frontal en antebrazos. Core muy activado.',
'Una mano a la vez, manteniendo alineación.',
'Alterna cuál mano sube primero.',
'Cambia de antebrazos a manos (plank alto) y regresa.',
ARRAY['Rotar cadera durante transición', 'hundir zona lumbar', 'movimiento demasiado rápido'],
ARRAY['Problemas de muñeca', 'dolor lumbar agudo', 'lesiones de hombro']),

-- 19. Hanging Knee Raises
('Hanging Knee Raises', 'Flexión de cadera en suspensión',
ARRAY['Recto abdominal inferior', 'flexores de cadera'],
ARRAY['Oblicuos', 'dorsales'],
'Barra de dominadas', 'Intermedio – Avanzado', core_id,
'Colgado activo de barra con agarre prono, ancho de hombros. Piernas extendidas, leve hollow body, escápulas deprimidas.',
'Baja controladamente en 2–3 s, evitando el balanceo.',
'Pausa breve arriba con abdominales contraídos.',
'Flexiona caderas y rodillas llevando rodillas hacia el pecho, añadiendo posteriorización pélvica (PPT) al final del movimiento.',
ARRAY['Kipping/balanceo', 'perder la activación escapular', 'tirar solo de psoas sin PPT'],
ARRAY['Epicondilalgia/lesiones de hombro que impidan colgar', 'lumbalgia con flexión de cadera repetida']),

-- 20. Hanging Leg Raise a los Lados
('Hanging Leg Raise a los Lados (colgado en barra, piernas extendidas)', 'Flexión de cadera + inclinación lateral',
ARRAY['Oblicuos'],
ARRAY['Recto abdominal', 'flexores de cadera', 'dorsales/agarre'],
'Barra de dominadas; straps opcionales', 'Avanzado', core_id,
'Colgado con hollow suave; piernas extendidas juntas en ligera dorsiflexión, pelvis neutra.',
'2–3 s al centro y abajo, sin perder tensión escapular.',
'0.5–1 s arriba.',
'Eleva piernas en bloque y desplázalas hacia un lado completando con PPT al final.',
ARRAY['Romper rodillas al subir', 'balanceo', 'arquear lumbar al inicio'],
ARRAY['Dolor anterior de cadera/pinzamiento', 'inestabilidad de hombro', 'lumbalgia con palancas largas']),

-- 21. Hanging Windshield Wipers
('Hanging Windshield Wipers (limpiaparabrisas colgado)', 'Anti-rotación + rotación controlada en suspensión',
ARRAY['Oblicuos control excéntrico bilateral'],
ARRAY['Transverso', 'erectores', 'dorsales/agarre'],
'Barra de dominadas', 'Avanzado – Élite', core_id,
'Colgado activo; piernas extendidas juntas (o 90° de cadera/rodilla si versión intermedia), pelvis neutra.',
'2–4 s al centro y repite al otro lado. Mantén ROM moderado al inicio.',
'0.3–0.5 s en el extremo (sin "colgar" lumbar).',
'Desde el centro, lleva los pies hacia un lado manteniendo costillas abajo y caderas lo más estables posible.',
ARRAY['Rotación excesiva con pérdida de neutra', 'kipping', 'cuello en extensión'],
ARRAY['Lumbalgia con rotación bajo carga', 'inestabilidad glenohumeral', 'epicondilalgia con agarre sostenido']),

-- 22. Landmine Rotations de Pie
('Landmine Rotations de Pie ("180s")', 'Rotación dinámica',
ARRAY['Oblicuo externo/Interno ambos lados'],
ARRAY['Recto abdominal', 'glúteos/rotadores de cadera'],
'Barra en landmine', 'Intermedio – Avanzado', core_id,
'De pie, pies algo más anchos que hombros, rodillas semiflexionadas. Sujeta la manga de la barra con ambas manos frente al pecho, brazos semiextensos. Costillas "abajo", pelvis neutra, mirada al frente.',
'Regresa en 2–3 s controlando el giro; evita "latiguear".',
'Micro-pausa 0.5 s en cada extremo sin perder centro.',
'Lleva la barra en arco desde la cadera derecha hacia la izquierda (y viceversa) guiando con cadera/torso en bloque.',
ARRAY['Girar solo brazos sin cadera', 'hiperextender lumbar', 'soltar la barra al final del arco'],
ARRAY['Lumbalgia con rotaciones rápidas', 'dolor costovertebral']),

-- 23. Landmine Chop Alto→Bajo
('Landmine Chop Alto→Bajo (Wood Chop LM)', 'Rotación + chop diagonal',
ARRAY['Oblicuo externo hemicintura contraria al lado alto', 'interno lado de tracción'],
ARRAY['Recto abdominal', 'dorsal ancho', 'glúteos'],
'Barra en landmine', 'Intermedio', core_id,
'De pie en split-stance (pie adelantado contrario al anclaje). Barra tomada con ambas manos por delante del hombro cercano al anclaje (posición alta).',
'Regresa en 2–3 s por la misma diagonal, mantén costillas controladas.',
'0.5–1 s al final (barra cerca de cadera), hombros abajo.',
'"Corta" en diagonal hacia la cadera contraria, rotando tronco y cargando el peso en la pierna delantera.',
ARRAY['Tirar solo de brazos', 'elevar trapecios', 'desalinear rodilla delantera'],
ARRAY['Dolor AC/subacromial con diagonales largas', 'lumbalgia con rotación cargada']),

-- 24. Landmine Arc Press
('Landmine Arc Press ("Rainbow Press")', 'Anti-rotación + anti-inclinación',
ARRAY['Oblicuo interno/externo resistencia al giro', 'QL anti-inclinación'],
ARRAY['Recto abdominal bracing', 'deltoide anterior/serrato'],
'Barra en landmine', 'Intermedio', core_id,
'De pie, pies al ancho de cadera, barra frente al esternón, codos suaves. Core activo, glúteos firmes, pelvis neutra.',
'Regresa el arco en 2–3 s manteniendo presión abdominal.',
'0.5 s en cada extremo sin inclinar costillas.',
'Empuja la barra y "dibuja" un arco controlado de hombro a hombro manteniendo tronco quieto.',
ARRAY['Compensar con inclinación lateral', 'bloquear codos duro', 'perder presión intraabdominal'],
ARRAY['Dolor glenohumeral con elevación sostenida', 'dolor lumbar con anti-inclinación cargada']),

-- 25. Landmine Anti-Rotation Press
('Landmine Anti-Rotation Press (Split-Stance)', 'Anti-rotación press unilateral',
ARRAY['Oblicuos resistir giro', 'transverso/recto bracing'],
ARRAY['Glúteos y aductores', 'deltoide/serrato'],
'Barra en landmine', 'Principiante – Intermedio', core_id,
'Split-stance (pierna contraria adelantada), barra a la altura del esternón con una mano. Costillas abajo, mirada al frente, escápula activa.',
'Vuelve en 2–3 s al pecho manteniendo alineación.',
'1 s con brazo extendido, pelvis nivelada.',
'Empuja la barra al frente sin permitir que el tronco rote hacia la barra.',
ARRAY['Rotar caderas/hombros hacia la barra', 'perder neutro lumbar', 'elevar hombro del lado que empuja'],
ARRAY['Dolor AC/esternoclavicular al presionar', 'lumbalgia que empeora con anti-rotación']),

-- 26-30. Ejercicios adicionales de Core (Continúo con los faltantes)
('Bicycle Crunches Avanzados', 'Flexión + rotación avanzada',
ARRAY['Oblicuos', 'recto abdominal'],
ARRAY['Flexores de cadera'],
'Peso corporal', 'Intermedio – Avanzado', core_id,
'Tumbado boca arriba, manos detrás de cabeza, piernas elevadas en posición de mesa.',
'Controla la extensión sin tocar el suelo.',
'Mantén tensión en punto de máxima contracción.',
'Alterna codo hacia rodilla opuesta con extensión completa de pierna contraria.',
ARRAY['Velocidad excesiva', 'tirar del cuello', 'perder control de la pierna extendida'],
ARRAY['Dolor cervical severo', 'hernias discales con irradiación']),

('Plank Jacks', 'Dinámico + anti-extensión',
ARRAY['Transverso del abdomen', 'recto abdominal'],
ARRAY['Aductores', 'abductores', 'hombros'],
'Peso corporal', 'Intermedio – Avanzado', core_id,
'Posición de plancha alta, brazos extendidos, pies juntos.',
'Regresa pies a posición inicial manteniendo plancha.',
'Mantén core activado durante todo el movimiento.',
'Salta separando y juntando pies como jumping jacks horizontales.',
ARRAY['Hundir cadera', 'perder posición de plancha', 'aterrizaje duro'],
ARRAY['Lesiones de tobillo', 'dolor lumbar agudo', 'problemas cardiovasculares']),

('Superman Hold', 'Extensión isométrica',
ARRAY['Erectores espinales', 'glúteos'],
ARRAY['Deltoides posterior', 'romboides'],
'Peso corporal', 'Principiante – Intermedio', core_id,
'Tumbado boca abajo, brazos extendidos al frente, piernas extendidas.',
'No aplica - ejercicio isométrico.',
'Mantén posición elevada 15-60 segundos.',
'Eleva simultáneamente pecho, brazos y piernas del suelo.',
ARRAY['Hiperextender cuello', 'elevar demasiado alto', 'tensión en zona lumbar'],
ARRAY['Dolor lumbar que empeora con extensión', 'problemas cervicales']),

('Reverse Plank', 'Anti-flexión',
ARRAY['Erectores espinales', 'glúteos'],
ARRAY['Isquiotibiales', 'deltoides posterior'],
'Peso corporal', 'Intermedio', core_id,
'Sentado con piernas extendidas, manos apoyadas detrás del cuerpo.',
'No aplica - ejercicio isométrico.',
'Mantén línea recta desde talones hasta cabeza 20-60 segundos.',
'Eleva cadera formando línea recta, apoyo en talones y manos.',
ARRAY['Hundir cadera', 'hiperextender cuello', 'doblar rodillas'],
ARRAY['Problemas de muñeca', 'lesiones de hombro', 'dolor lumbar']),

('Dragon Flag', 'Anti-extensión extremo',
ARRAY['Recto abdominal', 'transverso del abdomen'],
ARRAY['Dorsales', 'serratos'],
'Banco o barra', 'Élite', core_id,
'Tumbado en banco, agarrando banco detrás de la cabeza con ambas manos.',
'Baja lentamente manteniendo cuerpo rígido hasta casi horizontal.',
'Mantén cuerpo completamente rígido.',
'Eleva piernas y torso hasta vertical manteniendo cuerpo como tabla.',
ARRAY['Doblar en la cadera', 'perder rigidez corporal', 'usar impulso'],
ARRAY['Lesiones de hombro', 'dolor lumbar severo', 'hernias discales']);

-- ===================================================================
-- COMPLETAR EJERCICIOS DE TRÍCEPS (FALTANTES 6-21)
-- ===================================================================

INSERT INTO exercises (
    name, type, primary_muscles, secondary_muscles, material, level, muscle_group_id,
    initial_position, execution_eccentric, execution_isometric, execution_concentric,
    common_errors, contraindications
) VALUES

-- 6. Press Militar con Agarre Cerrado
('Press Militar con Agarre Cerrado', 'Compuesto',
ARRAY['Deltoides anterior', 'tríceps'],
ARRAY['Deltoides medial', 'trapecio superior', 'core'],
'Barra olímpica', 'Intermedio – Avanzado', triceps_id,
'De pie, barra a la altura de los hombros, agarre cerrado (ancho de hombros). Core activado, escápulas retraídas, pies al ancho de cadera.',
'Inhala y baja controladamente hasta los hombros en 2–3 s.',
'Pausa breve arriba sin bloquear duro.',
'Exhala y presiona la barra verticalmente hasta extensión completa en 1–2 s.',
ARRAY['Arquear excesivamente la zona lumbar', 'presionar hacia adelante en lugar de verticalmente', 'agarre demasiado estrecho'],
ARRAY['Dolor lumbar con carga axial', 'lesiones de hombro no rehabilitadas']),

-- 7. Extensión de Tríceps por Encima de la Cabeza
('Extensión de Tríceps por Encima de la Cabeza (overhead)', 'Aislamiento',
ARRAY['Tríceps énfasis en cabeza larga'],
ARRAY['Anconeo', 'deltoides posterior'],
'Mancuerna o kettlebell', 'Intermedio', triceps_id,
'De pie o sentado, sosteniendo una mancuerna con ambas manos por encima de la cabeza. Brazos extendidos, codos apuntando hacia adelante, core activado.',
'Inhala y flexiona codos bajando el peso detrás de la cabeza en 2–3 s.',
'Pausa breve en estiramiento máximo.',
'Exhala y extiende codos regresando arriba en 1–2 s.',
ARRAY['Separar codos hacia los lados', 'arquear zona lumbar en exceso', 'rango incompleto por miedo'],
ARRAY['Limitaciones de movilidad de hombro', 'dolor cervical con cargas por encima de la cabeza']),

-- 8. Extensión de Tríceps en Polea con Cuerda
('Extensión de Tríceps en Polea con Cuerda', 'Aislamiento',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Anconeo'],
'Polea alta + cuerda', 'Principiante – Todos', triceps_id,
'De pie frente a la polea, sosteniendo extremos de la cuerda con agarre neutro. Codos pegados al torso, torso erguido.',
'Inhala y flexiona codos controladamente hasta 90°.',
'Pausa 1 s en extensión completa con separación máxima.',
'Exhala y extiende codos separando la cuerda al final del movimiento.',
ARRAY['No separar la cuerda al final', 'elevar codos durante el movimiento', 'usar impulso del torso'],
ARRAY['Dolor en muñeca con agarre de cuerda', 'epicondilitis']),

-- 9. Press de Piso con Agarre Cerrado
('Press de Piso con Agarre Cerrado', 'Compuesto rango parcial',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Pectoral mayor', 'deltoides anterior'],
'Barra olímpica', 'Intermedio', triceps_id,
'Tumbado en el suelo, agarre cerrado en la barra, escápulas retraídas. Brazos extendidos sobre el pecho, pies firmes.',
'Inhala y baja hasta que codos toquen el suelo en 2–3 s.',
'Mantén 1 s con codos en el suelo.',
'Exhala y presiona hacia arriba en 1–2 s.',
ARRAY['Rebotar en el suelo', 'agarre demasiado estrecho', 'no hacer pausa completa'],
ARRAY['Dolor de hombro en posición horizontal', 'molestias en zona lumbar acostado']),

-- 10. Extensión de Tríceps Unilateral en Polea
('Extensión de Tríceps Unilateral en Polea', 'Aislamiento unilateral',
ARRAY['Tríceps del brazo activo'],
ARRAY['Core', 'anconeo'],
'Polea alta + maneral individual', 'Intermedio', triceps_id,
'De pie al lado de la polea, sosteniendo maneral con una mano. Codo del brazo activo pegado al torso, torso estable.',
'Inhala y flexiona codo controladamente hasta 90°.',
'Pausa breve en extensión completa.',
'Exhala y extiende codo hacia abajo hasta bloqueo en 1–2 s.',
ARRAY['Compensar con movimiento del torso', 'separar codo del costado', 'rango incompleto'],
ARRAY['Asimetrías severas de fuerza', 'dolor unilateral en codo']),

-- 11. Patadas de Tríceps con Mancuernas
('Patadas de Tríceps con Mancuernas', 'Aislamiento',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Deltoides posterior', 'erectores espinales'],
'Mancuernas + banco', 'Principiante – Intermedio', triceps_id,
'Inclinado sobre banco, una rodilla y mano apoyadas, mancuerna en mano libre. Brazo superior paralelo al suelo, codo flexionado a 90°.',
'Inhala y flexiona codo regresando a 90° en 2–3 s.',
'Pausa 1 s en extensión completa.',
'Exhala y extiende codo hasta alineación con el brazo en 1–2 s.',
ARRAY['Mover el brazo superior', 'no alcanzar extensión completa', 'usar impulso'],
ARRAY['Dolor lumbar en posición inclinada', 'problemas de equilibrio']),

-- 12. Flexiones con Manos Juntas (Diamond Push-ups)
('Flexiones con Manos Juntas (Diamond Push-ups)', 'Compuesto',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Pectoral mayor', 'deltoides anterior', 'core'],
'Peso corporal', 'Intermedio – Avanzado', triceps_id,
'Posición de flexión con manos formando un diamante bajo el pecho. Cuerpo en línea recta, core activado.',
'Inhala y baja hasta que pecho toque manos en 2–3 s.',
'Pausa breve en la posición baja.',
'Exhala y empuja hacia arriba en 1–2 s.',
ARRAY['Hundir cadera o elevarla demasiado', 'no descender completamente', 'perder alineación corporal'],
ARRAY['Dolor en muñecas con soporte', 'lesiones de hombro']),

-- 13. Extensión de Tríceps en Banco Inclinado
('Extensión de Tríceps en Banco Inclinado', 'Aislamiento',
ARRAY['Tríceps cabeza larga', 'Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Anconeo', 'deltoides posterior'],
'Mancuernas + banco inclinado', 'Intermedio', triceps_id,
'Sentado en banco inclinado (45-60°), mancuernas sostenidas con brazos extendidos. Escápulas retraídas, core firme.',
'Inhala y flexiona codos bajando pesos hacia las sienes en 2–3 s.',
'Pausa breve en flexión máxima.',
'Exhala y extiende codos regresando arriba en 1–2 s.',
ARRAY['Mover hombros durante el ejercicio', 'inclinar demasiado el banco', 'perder control en la bajada'],
ARRAY['Dolor de hombro con posición inclinada', 'problemas cervicales']),

-- 14. Press JM (Board Press) para Tríceps
('Press JM (Board Press) para Tríceps', 'Compuesto rango parcial',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Pectoral mayor', 'deltoides anterior'],
'Barra + tabla/board + banco', 'Avanzado', triceps_id,
'Acostado en banco con tabla sobre el pecho, barra con agarre cerrado. Escápulas retraídas, setup igual que press de banca.',
'Baja barra hasta que toque la tabla en 2–3 s.',
'Mantén contacto con tabla por 1 s.',
'Presiona explosivamente hacia arriba en 1 s.',
ARRAY['Rebotar en la tabla', 'agarre demasiado estrecho', 'no hacer pausa completa'],
ARRAY['Lesiones de hombro no rehabilitadas', 'dolor esternal']),

-- 15. Extensión de Tríceps en Polea Baja (overhead cable)
('Extensión de Tríceps en Polea Baja (overhead cable)', 'Aislamiento',
ARRAY['Tríceps énfasis en cabeza larga'],
ARRAY['Deltoides posterior', 'anconeo'],
'Polea baja + cuerda o barra', 'Intermedio', triceps_id,
'De pie de espaldas a la polea baja, sosteniendo cuerda por encima de la cabeza. Brazos extendidos arriba, codos apuntando hacia adelante.',
'Inhala y flexiona codos bajando manos detrás de la cabeza en 2–3 s.',
'Pausa en estiramiento máximo del tríceps.',
'Exhala y extiende codos regresando arriba en 1–2 s.',
ARRAY['Separar codos hacia los lados', 'inclinarse hacia adelante', 'rango incompleto por tensión del cable'],
ARRAY['Limitaciones de movilidad de hombro', 'dolor cervical con cargas elevadas']),

-- 16. Fondos en Máquina Asistida
('Fondos en Máquina Asistida', 'Compuesto asistido',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Pectoral esternal', 'deltoides anterior'],
'Máquina de fondos asistidos', 'Principiante – Intermedio', triceps_id,
'En máquina con rodillas sobre plataforma de asistencia. Manos en empuñaduras, torso erguido, escápulas deprimidas.',
'Inhala y baja hasta 90° de flexión en codos en 2–3 s.',
'Pausa breve en posición baja.',
'Exhala y extiende codos regresando arriba en 1–2 s.',
ARRAY['Demasiada asistencia', 'hundir hombros excesivamente', 'rango incompleto'],
ARRAY['Dolor anterior de hombro', 'inestabilidad glenohumeral']),

-- 17. Extensión de Tríceps con Banda Elástica
('Extensión de Tríceps con Banda Elástica', 'Aislamiento',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Anconeo'],
'Banda elástica', 'Principiante – Todos', triceps_id,
'De pie sobre banda o con banda anclada arriba. Codos pegados al torso, manos sosteniendo banda.',
'Inhala y flexiona codos controladamente contra tracción en 2–3 s.',
'Pausa breve en extensión máxima.',
'Exhala y extiende codos contra resistencia creciente en 1–2 s.',
ARRAY['Perder tensión en la banda', 'separar codos del cuerpo', 'movimiento demasiado rápido'],
ARRAY['Dolor en muñeca con agarre sostenido', 'problemas de agarre']),

-- 18. Press Francés (French Press)
('Press Francés (French Press)', 'Aislamiento',
ARRAY['Tríceps cabeza larga', 'Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Anconeo'],
'Barra EZ o recta + banco', 'Intermedio – Avanzado', triceps_id,
'Tumbado en banco, barra sostenida con brazos extendidos sobre el pecho. Agarre cerrado, escápulas retraídas.',
'Inhala y flexiona codos bajando barra hacia frente en 2–3 s.',
'Pausa breve en flexión máxima.',
'Exhala y extiende codos regresando arriba en 1–2 s.',
ARRAY['Mover hombros durante el ejercicio', 'bajar demasiado rápido', 'agarre inadecuado'],
ARRAY['Dolor de codo con flexión cargada', 'problemas de muñeca']),

-- 19. Cable Crossover para Tríceps
('Cable Crossover para Tríceps (cruces invertidos)', 'Aislamiento',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Pectoral', 'deltoides anterior'],
'Polea alta bilateral', 'Intermedio – Avanzado', triceps_id,
'Entre dos poleas altas, sosteniendo cables con brazos extendidos al frente. Torso inclinado hacia adelante, core activado.',
'Inhala y flexiona codos regresando controladamente.',
'Pausa breve en extensión completa.',
'Exhala y extiende codos llevando manos hacia abajo y atrás.',
ARRAY['Usar demasiado pectoral', 'perder inclinación del torso', 'rango incompleto'],
ARRAY['Dolor de hombro con abducción', 'inestabilidad glenohumeral']),

-- 20. Fondos en Máquina de Tríceps
('Fondos en Máquina de Tríceps (Dip Machine, plate-loaded/selectorizada)', 'Compuesto guiado',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Pectoral esternal', 'deltoide anterior', 'core'],
'Máquina de fondos carga con placas o selectorizada', 'Principiante – Avanzado', triceps_id,
'Ajusta asiento y apoyos para que empuñaduras queden a nivel de costillas bajas. Pecho alto, hombros "largos" deprimidos, escápulas activas. Codos alineados con empuñaduras, apuntan atrás no hacia fuera.',
'2–3 s de descenso controlado hasta ~90° de flexión de codo/hombro, sin hundir hombros ni perder la retracción.',
'0.5–1 s abajo brazos extendidos sin "bloqueo duro".',
'Empuja las empuñaduras extendiendo codos hasta casi bloquear, manteniendo torso levemente inclinado 10–20° y codos cercanos al cuerpo.',
ARRAY['"Colgarse" abajo hombros hacia las orejas', 'abrir codos lateralmente o adelantar hombros', 'rebotar en el fondo o bloquear en exceso arriba'],
ARRAY['Dolor subacromial/AC con compresión en profundidad limitar ROM', 'inestabilidad glenohumeral anterior', 'irritación del olécranon/tendinopatía distal evitar bloqueos duros']),

-- 21. Extensión de Tríceps en Cable Cruzado
('Extensión de Tríceps en Cable Cruzado (cable crossover invertido para tríceps)', 'Aislamiento bilateral',
ARRAY['Tríceps cabeza lateral', 'Tríceps cabeza medial'],
ARRAY['Deltoides posterior', 'core'],
'Torres de cable dobles en polea alta', 'Intermedio – Avanzado', triceps_id,
'De pie entre las torres, sosteniendo un cable en cada mano. Brazos en cruz a la altura de los hombros, codos semiflexionados. Torso levemente inclinado hacia adelante, core firme.',
'2–3 s regresando hasta ~90–110° de flexión manteniendo tensión y los codos fijos al costado.',
'0.5–1 s abajo "apretando" tríceps con hombros relajados.',
'Exhala y extiende ambos codos simultáneamente hacia abajo y levemente hacia el centro, manteniendo hombros fijos.',
ARRAY['Codos que se abren o se van al frente', 'encoger trapecios o arquear la zona lumbar', 'flexo–extensión excesiva de muñeca o perder la cruz cruz demasiado cerrada'],
ARRAY['Bursitis olecraniana o tendinopatía distal del tríceps reactiva evita bloqueos y altos volúmenes', 'dolor AC/subacromial con depresión forzada del hombro reduce carga, trabaja unilateral']);

END $$;
