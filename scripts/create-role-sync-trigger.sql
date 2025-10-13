-- ============================================
-- TRIGGER PARA SINCRONIZACIÓN AUTOMÁTICA DE ROLES
-- ============================================
-- Este trigger mantiene sincronizado el rol de la tabla Users
-- con el user_metadata.role en auth.users
--
-- IMPORTANTE: Si ya tienes el trigger "on_user_update_sync_rol",
-- este script lo COMPLEMENTA o REEMPLAZA según necesites.
--
-- Ejecutar en: Supabase SQL Editor
-- ============================================

-- 1. Crear/actualizar la función que sincroniza
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
  
  -- Log para debugging (opcional)
  RAISE NOTICE 'Metadata sincronizada para usuario: % (rol: %)', NEW.email, NEW.rol;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar triggers antiguos si existen (evitar duplicados)
DROP TRIGGER IF EXISTS sync_role_metadata_trigger ON "Users";
DROP TRIGGER IF EXISTS on_user_update_sync_rol ON "Users";

-- 3. Crear el trigger UNIFICADO en la tabla Users
-- Se activa en INSERT (registro nuevo) y UPDATE (cambio de rol/nombre)
CREATE TRIGGER sync_role_metadata_trigger
AFTER INSERT OR UPDATE OF rol, "firstName", "lastName" ON "Users"
FOR EACH ROW
EXECUTE FUNCTION sync_role_to_metadata();

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON FUNCTION sync_role_to_metadata IS 
  'Sincroniza automáticamente el rol y nombre desde Users a auth.users.raw_user_meta_data';

COMMENT ON TRIGGER sync_role_metadata_trigger ON "Users" IS 
  'Trigger que mantiene sincronizado el metadata cuando cambian rol, firstName o lastName';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Para verificar que el trigger funciona, ejecuta:
-- 
-- UPDATE "Users" 
-- SET rol = 'empleado' 
-- WHERE email = 'test@example.com';
--
-- Luego verifica:
-- SELECT email, raw_user_meta_data->>'role' as metadata_role
-- FROM auth.users 
-- WHERE email = 'test@example.com';
-- ============================================

-- ============================================
-- SINCRONIZACIÓN INICIAL (EJECUTAR UNA SOLA VEZ)
-- ============================================
-- Si ya tienes usuarios existentes sin metadata, 
-- DESCOMENTA Y EJECUTA este UPDATE:

/*
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
*/

-- ⚠️ IMPORTANTE: Después de ejecutar el UPDATE anterior,
-- todos los usuarios deberán CERRAR SESIÓN y VOLVER A ENTRAR
-- para que su JWT se actualice con el nuevo metadata.
-- ============================================

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Para verificar que TODO funciona:

-- 1. Ver cuántos usuarios TIENEN metadata.role:
SELECT 
  COUNT(*) as usuarios_con_metadata
FROM auth.users 
WHERE raw_user_meta_data->>'role' IS NOT NULL;

-- 2. Ver cuántos usuarios NO TIENEN metadata.role:
SELECT 
  COUNT(*) as usuarios_sin_metadata
FROM auth.users 
WHERE raw_user_meta_data->>'role' IS NULL;

-- 3. Ver usuarios específicos:
SELECT 
  email,
  raw_user_meta_data->>'role' as metadata_role,
  raw_user_meta_data->>'firstName' as metadata_firstName
FROM auth.users
WHERE email IN (
  'ing.luisdeluna@outlook.com',
  'administracion@muscleupgym.fitness',
  'luisdeluna04@hotmail.com'
);

-- 4. Probar el trigger con un UPDATE:
-- UPDATE "Users" SET rol = 'empleado' WHERE email = 'test@example.com';
-- Luego verificar:
-- SELECT email, raw_user_meta_data->>'role' FROM auth.users WHERE email = 'test@example.com';
-- ============================================
