-- ============================================
-- SOLUCIÓN COMPLETA PARA ROLES Y METADATA
-- ============================================
-- Ejecutar en: Supabase SQL Editor
-- Este script CREA el trigger Y SINCRONIZA todos los usuarios existentes
-- ============================================

-- ============================================
-- PASO 1: CREAR LA FUNCIÓN
-- ============================================
CREATE OR REPLACE FUNCTION sync_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar metadata en auth.users cuando cambie el rol o nombre en Users
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'role', NEW.rol,
      'firstName', NEW."firstName",
      'lastName', NEW."lastName"
    )
  WHERE id = NEW.id;

  -- Log para debugging
  RAISE NOTICE 'Metadata sincronizada para usuario: % (rol: %)', NEW.email, NEW.rol;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASO 2: ELIMINAR TRIGGERS ANTIGUOS
-- ============================================
DROP TRIGGER IF EXISTS sync_role_metadata_trigger ON "Users";
DROP TRIGGER IF EXISTS on_user_update_sync_rol ON "Users";

-- ============================================
-- PASO 3: CREAR EL TRIGGER NUEVO
-- ============================================
CREATE TRIGGER sync_role_metadata_trigger
AFTER INSERT OR UPDATE OF rol, "firstName", "lastName" ON "Users"
FOR EACH ROW
EXECUTE FUNCTION sync_role_to_metadata();

-- ============================================
-- PASO 4: SINCRONIZACIÓN INICIAL DE USUARIOS EXISTENTES
-- ============================================
-- Este UPDATE sincroniza TODOS los usuarios que ya existen
UPDATE auth.users au
SET raw_user_meta_data = COALESCE(au.raw_user_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'role', u.rol,
    'firstName', u."firstName",
    'lastName', u."lastName"
  )
FROM "Users" u
WHERE au.id = u.id
  AND u.rol IS NOT NULL;

-- ============================================
-- VERIFICACIÓN INMEDIATA
-- ============================================

-- 1. Ver cuántos usuarios se sincronizaron:
SELECT
  COUNT(*) as usuarios_sincronizados,
  '✅ Usuarios con metadata actualizado' as estado
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NOT NULL;

-- 2. Ver usuarios admin/empleado específicamente:
SELECT
  email,
  raw_user_meta_data->>'role' as metadata_role,
  raw_user_meta_data->>'firstName' as metadata_firstName,
  raw_user_meta_data->>'lastName' as metadata_lastName,
  '✅ LISTO PARA LOGIN' as estado
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('admin', 'empleado')
ORDER BY email;

-- 3. Ver TODOS los usuarios sincronizados:
SELECT
  email,
  raw_user_meta_data->>'role' as rol,
  CASE
    WHEN raw_user_meta_data->>'role' = 'admin' THEN '👑 Administrador'
    WHEN raw_user_meta_data->>'role' = 'empleado' THEN '👔 Empleado'
    WHEN raw_user_meta_data->>'role' = 'cliente' THEN '👤 Cliente'
    ELSE '⚠️ Sin rol definido'
  END as tipo_usuario
FROM auth.users
ORDER BY
  CASE raw_user_meta_data->>'role'
    WHEN 'admin' THEN 1
    WHEN 'empleado' THEN 2
    WHEN 'cliente' THEN 3
    ELSE 4
  END,
  email;

-- ============================================
-- MENSAJE FINAL
-- ============================================
DO $$
DECLARE
  total_sync INTEGER;
  total_admin INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_sync
  FROM auth.users
  WHERE raw_user_meta_data->>'role' IS NOT NULL;

  SELECT COUNT(*) INTO total_admin
  FROM auth.users
  WHERE raw_user_meta_data->>'role' IN ('admin', 'empleado');

  RAISE NOTICE '==================================================';
  RAISE NOTICE '✅ SINCRONIZACIÓN COMPLETADA';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Total de usuarios sincronizados: %', total_sync;
  RAISE NOTICE 'Administradores y empleados: %', total_admin;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANTE:';
  RAISE NOTICE 'Los usuarios deben CERRAR SESIÓN y VOLVER A ENTRAR';
  RAISE NOTICE 'para que su JWT se actualice con el nuevo metadata.';
  RAISE NOTICE '==================================================';
END $$;

-- ============================================
-- PRÓXIMOS PASOS PARA EL USUARIO:
-- ============================================
--
-- 1. ✅ El trigger ya está creado y funcionando
-- 2. ✅ Todos los usuarios existentes están sincronizados
-- 3. ⚠️ IMPORTANTE: Todos los usuarios deben:
--    - Cerrar sesión (logout)
--    - Volver a iniciar sesión (login)
--    - Esto actualiza su JWT token con el nuevo metadata
--
-- 4. ✅ A partir de ahora:
--    - Cualquier cambio de rol en la tabla Users
--    - Se sincronizará AUTOMÁTICAMENTE al metadata
--    - No necesitas hacer nada manual
--
-- ============================================
