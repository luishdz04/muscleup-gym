-- ============================================
-- VER DEFINICIÓN DEL TRIGGER ACTUAL
-- ============================================

-- 1. Ver todos los triggers en la tabla Users
SELECT
  t.tgname as nombre_trigger,
  p.proname as nombre_funcion,
  CASE t.tgenabled
    WHEN 'O' THEN '✅ ACTIVO'
    WHEN 'D' THEN '❌ DESHABILITADO'
    ELSE '⚠️ OTRO'
  END as estado,
  pg_get_triggerdef(t.oid) as definicion_completa
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'Users'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================
-- 2. Ver la FUNCIÓN que usa el trigger
-- ============================================
SELECT
  p.proname as nombre_funcion,
  pg_get_functiondef(p.oid) as codigo_completo
FROM pg_proc p
WHERE p.proname IN (
  SELECT p2.proname
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_proc p2 ON t.tgfoid = p2.oid
  WHERE c.relname = 'Users'
    AND NOT t.tgisinternal
);

-- ============================================
-- 3. Buscar específicamente on_user_update_sync_rol
-- ============================================
SELECT
  tgname as nombre_trigger,
  tgenabled as estado_codigo,
  CASE tgenabled
    WHEN 'O' THEN '✅ ACTIVO'
    WHEN 'D' THEN '❌ DESHABILITADO'
    ELSE '⚠️ OTRO'
  END as estado,
  pg_get_triggerdef(oid) as definicion
FROM pg_trigger
WHERE tgname = 'on_user_update_sync_rol';

-- ============================================
-- 4. Ver la función asociada (probablemente sync_user_role_to_auth)
-- ============================================
SELECT
  proname as nombre_funcion,
  pg_get_functiondef(oid) as codigo
FROM pg_proc
WHERE proname LIKE '%sync%rol%'
   OR proname LIKE '%sync%user%'
   OR proname LIKE '%metadata%'
ORDER BY proname;
