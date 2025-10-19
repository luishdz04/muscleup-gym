-- ==========================================
-- TEST: Simular múltiples usuarios en el gimnasio
-- ==========================================

-- Este script inserta entradas de MÚLTIPLES usuarios para probar
-- el gauge de capacidad con diferentes porcentajes

-- PASO 1: Ver usuarios disponibles en tu base de datos
SELECT id, "firstName", "lastName", email, rol
FROM "Users"
WHERE rol = 'cliente'
LIMIT 10;

-- PASO 2: Insertar ENTRADAS para varios usuarios (ajusta los IDs según tu BD)
-- Reemplaza los UUIDs con IDs reales de tu tabla Users

DO $$
DECLARE
  user_ids UUID[] := ARRAY[
    'a7653520-7a44-4358-99be-ab6d936ab6b1'::UUID
    -- Agrega más UUIDs de usuarios aquí
    -- 'uuid-2'::UUID,
    -- 'uuid-3'::UUID,
    -- 'uuid-4'::UUID,
    -- 'uuid-5'::UUID
  ];
  user_id UUID;
BEGIN
  FOREACH user_id IN ARRAY user_ids
  LOOP
    INSERT INTO access_logs (
      user_id,
      device_id,
      access_type,
      access_method,
      device_verify_mode,
      success,
      denial_reason,
      membership_status,
      device_timestamp,
      created_at
    )
    VALUES (
      user_id,
      NULL,
      'entry',          -- ENTRADA
      'fingerprint',
      1,
      true,
      NULL,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT DO NOTHING;  -- Evitar duplicados si ya existe
  END LOOP;
END $$;

-- PASO 3: Verificar el estado actual
WITH today_logs AS (
  SELECT
    user_id,
    access_type,
    created_at,
    success
  FROM access_logs
  WHERE success = true
    AND created_at >= CURRENT_DATE
  ORDER BY created_at ASC
),
latest_status AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    access_type as last_action,
    created_at
  FROM today_logs
  ORDER BY user_id, created_at DESC
)
SELECT
  ls.user_id,
  u."firstName" || ' ' || u."lastName" as nombre,
  ls.last_action as estado,
  ls.created_at::time as ultima_accion
FROM latest_status ls
LEFT JOIN "Users" u ON u.id = ls.user_id
ORDER BY ls.created_at DESC;

-- PASO 4: Ver resumen de capacidad
WITH today_logs AS (
  SELECT
    user_id,
    access_type,
    created_at
  FROM access_logs
  WHERE success = true
    AND created_at >= CURRENT_DATE
  ORDER BY created_at ASC
),
latest_status AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    access_type as last_action
  FROM today_logs
  ORDER BY user_id, created_at DESC
)
SELECT
  COUNT(*) FILTER (WHERE last_action = 'entry') as "Personas Dentro 👥",
  COUNT(*) FILTER (WHERE last_action = 'exit') as "Personas Fuera 🚪",
  COUNT(*) as "Total Usuarios Únicos",
  ROUND(
    (COUNT(*) FILTER (WHERE last_action = 'entry')::DECIMAL / 100) * 100,
    2
  ) || '%' as "Porcentaje (max 100)"
FROM latest_status;
