-- ============================================
-- VERIFICACIÓN COMPLETA DEL SISTEMA DE ROLES
-- ============================================
-- Ejecutar en: Supabase SQL Editor
-- Este script verifica si el trigger de sincronización está funcionando
-- ============================================

-- ============================================
-- 1. VERIFICAR SI EXISTE EL TRIGGER
-- ============================================
SELECT
  tgname as nombre_trigger,
  tgenabled as estado,
  CASE
    WHEN tgenabled = 'O' THEN '✅ ACTIVO'
    WHEN tgenabled = 'D' THEN '❌ DESHABILITADO'
    ELSE '⚠️ OTRO ESTADO'
  END as estado_legible
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'Users'
  AND tgname = 'sync_role_metadata_trigger';

-- Si NO devuelve resultados: EL TRIGGER NO EXISTE ❌
-- Si devuelve 1 fila con estado 'O': EL TRIGGER ESTÁ ACTIVO ✅

-- ============================================
-- 2. VERIFICAR SI EXISTE LA FUNCIÓN
-- ============================================
SELECT
  proname as nombre_funcion,
  pg_get_functiondef(oid) as definicion
FROM pg_proc
WHERE proname = 'sync_role_to_metadata';

-- Si NO devuelve resultados: LA FUNCIÓN NO EXISTE ❌
-- Si devuelve la definición: LA FUNCIÓN EXISTE ✅

-- ============================================
-- 3. VERIFICAR USUARIOS CON/SIN METADATA
-- ============================================

-- Usuarios CON metadata.role:
SELECT
  COUNT(*) as total_con_metadata,
  '✅ Estos usuarios tienen metadata sincronizado' as estado
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NOT NULL;

-- Usuarios SIN metadata.role:
SELECT
  COUNT(*) as total_sin_metadata,
  '⚠️ Estos usuarios necesitan sincronización' as estado
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NULL;

-- ============================================
-- 4. COMPARACIÓN DETALLADA: Users vs auth.users
-- ============================================
SELECT
  u.email,
  u.rol as rol_en_tabla_users,
  au.raw_user_meta_data->>'role' as rol_en_metadata,
  u."firstName" as nombre_en_tabla,
  au.raw_user_meta_data->>'firstName' as nombre_en_metadata,
  CASE
    WHEN u.rol = au.raw_user_meta_data->>'role' THEN '✅ SINCRONIZADO'
    WHEN au.raw_user_meta_data->>'role' IS NULL THEN '❌ SIN METADATA'
    ELSE '⚠️ DESINCRONIZADO'
  END as estado_sincronizacion
FROM "Users" u
JOIN auth.users au ON u.id = au.id
ORDER BY u."createdAt" DESC
LIMIT 20;

-- ============================================
-- 5. USUARIOS ADMINISTRADORES Y EMPLEADOS
-- ============================================
SELECT
  u.email,
  u.rol as rol_actual,
  au.raw_user_meta_data->>'role' as metadata_role,
  CASE
    WHEN u.rol = au.raw_user_meta_data->>'role' THEN '✅ OK'
    ELSE '❌ NECESITA SYNC'
  END as estado
FROM "Users" u
JOIN auth.users au ON u.id = au.id
WHERE u.rol IN ('admin', 'empleado')
ORDER BY u."createdAt" DESC;

-- ============================================
-- 6. RESUMEN GENERAL
-- ============================================
SELECT
  'Total de usuarios en Users' as descripcion,
  COUNT(*) as cantidad
FROM "Users"

UNION ALL

SELECT
  'Total de usuarios en auth.users' as descripcion,
  COUNT(*) as cantidad
FROM auth.users

UNION ALL

SELECT
  'Usuarios con metadata.role' as descripcion,
  COUNT(*) as cantidad
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NOT NULL

UNION ALL

SELECT
  'Usuarios SIN metadata.role' as descripcion,
  COUNT(*) as cantidad
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NULL

UNION ALL

SELECT
  'Triggers activos en tabla Users' as descripcion,
  COUNT(*) as cantidad
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'Users'
  AND tgenabled = 'O';

-- ============================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================
--
-- ✅ TODO BIEN:
-- - Existe el trigger "sync_role_metadata_trigger"
-- - Existe la función "sync_role_to_metadata"
-- - Todos los usuarios tienen metadata.role
-- - rol_en_tabla_users = rol_en_metadata para todos
--
-- ❌ PROBLEMA:
-- - NO existe el trigger → Ejecutar create-role-sync-trigger.sql
-- - Usuarios SIN metadata → Ejecutar sincronización inicial (ver líneas 75-86 en create-role-sync-trigger.sql)
-- - Roles desincronizados → Ejecutar UPDATE manual o esperar a que se actualice
--
-- ============================================
