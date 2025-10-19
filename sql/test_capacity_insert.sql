-- ==========================================
-- TEST: Insert Entry para probar capacidad en tiempo real
-- ==========================================

-- Este INSERT duplica un registro de acceso existente pero con la hora actual
-- para probar que el sistema de capacidad detecte personas dentro del gimnasio

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
  'a7653520-7a44-4358-99be-ab6d936ab6b1',  -- El user_id del registro que mostraste
  NULL,                                     -- device_id
  'entry',                                  -- IMPORTANTE: tipo de acceso = entrada
  'fingerprint',
  1,
  true,                                     -- Acceso exitoso
  NULL,
  'active',
  NOW(),                                    -- Timestamp del dispositivo = ahora
  NOW()                                     -- created_at = ahora
);

-- Verificar el registro insertado
SELECT
  id,
  user_id,
  access_type,
  access_method,
  success,
  created_at,
  created_at::date as fecha,
  created_at::time as hora
FROM access_logs
WHERE user_id = 'a7653520-7a44-4358-99be-ab6d936ab6b1'
  AND created_at::date = CURRENT_DATE
ORDER BY created_at DESC
LIMIT 5;

-- Ver cuántas personas están "dentro" ahora mismo
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
  COUNT(*) FILTER (WHERE last_action = 'entry') as people_inside,
  COUNT(*) FILTER (WHERE last_action = 'exit') as people_outside,
  COUNT(*) as total_unique_users
FROM latest_status;
