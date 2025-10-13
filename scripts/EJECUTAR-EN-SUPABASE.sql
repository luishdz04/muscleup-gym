-- ============================================
-- ACTUALIZACIÓN DE TRIGGER EXISTENTE
-- ============================================
-- Tu trigger actual: on_user_update_sync_rol
-- Solo se activa en INSERT o UPDATE OF rol
-- Vamos a MEJORARLO para que también sincronice firstName y lastName
-- ============================================

-- 1. MEJORAR LA FUNCIÓN EXISTENTE
-- (Reemplaza o complementa tu función sincronizar_rol_a_auth)
CREATE OR REPLACE FUNCTION sincronizar_rol_a_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar metadata en auth.users
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', COALESCE(NEW.rol, 'cliente'),  -- Si rol es null, usa 'cliente'
      'firstName', NEW."firstName",
      'lastName', NEW."lastName"
    )
  WHERE id = NEW.id;
  
  -- Log opcional para debugging
  RAISE NOTICE 'Metadata sincronizada para: % (rol: %)', NEW.email, COALESCE(NEW.rol, 'cliente');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ACTUALIZAR EL TRIGGER EXISTENTE
-- Agregar firstName y lastName a los campos que disparan el trigger
DROP TRIGGER IF EXISTS on_user_update_sync_rol ON "Users";

CREATE TRIGGER on_user_update_sync_rol
AFTER INSERT OR UPDATE OF rol, "firstName", "lastName" ON "Users"
FOR EACH ROW
EXECUTE FUNCTION sincronizar_rol_a_auth();

-- ============================================
-- SINCRONIZAR TODOS LOS USUARIOS EXISTENTES
-- ============================================
-- IMPORTANTE: Ejecutar DESPUÉS de crear la función y trigger
-- Esto actualiza TODOS los usuarios que ya existen en la BD

UPDATE auth.users au
SET raw_user_meta_data = COALESCE(au.raw_user_meta_data, '{}'::jsonb) || 
  jsonb_build_object(
    'role', COALESCE(u.rol, 'cliente'),
    'firstName', u."firstName",
    'lastName', u."lastName"
  )
FROM "Users" u
WHERE au.id = u.id;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- 1. Verificar cuántos usuarios se sincronizaron
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN raw_user_meta_data->>'role' IS NOT NULL THEN 1 END) as con_metadata,
  COUNT(CASE WHEN raw_user_meta_data->>'role' IS NULL THEN 1 END) as sin_metadata
FROM auth.users;

-- 2. Verificar usuarios específicos (TUS ADMINS)
SELECT 
  u.email,
  u.rol as tabla_rol,
  au.raw_user_meta_data->>'role' as metadata_role,
  au.raw_user_meta_data->>'firstName' as metadata_firstName,
  CASE 
    WHEN COALESCE(u.rol, 'cliente') = au.raw_user_meta_data->>'role' THEN '✅ Sincronizado'
    ELSE '❌ Desincronizado'
  END as estado
FROM "Users" u
JOIN auth.users au ON u.id = au.id
WHERE u.email IN (
  'ing.luisdeluna@outlook.com',
  'administracion@muscleupgym.fitness',
  'luisdeluna04@hotmail.com'
)
ORDER BY u.email;

-- 3. Ver todos los usuarios con su estado de sincronización
SELECT 
  u.email,
  u."firstName",
  u."lastName",
  COALESCE(u.rol, 'cliente') as rol_tabla,
  au.raw_user_meta_data->>'role' as rol_metadata,
  CASE 
    WHEN COALESCE(u.rol, 'cliente') = au.raw_user_meta_data->>'role' THEN '✅'
    ELSE '❌'
  END as sync_status
FROM "Users" u
JOIN auth.users au ON u.id = au.id
ORDER BY u.email
LIMIT 20;

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON FUNCTION sincronizar_rol_a_auth IS 
  'Sincroniza automáticamente rol, firstName y lastName desde Users a auth.users.raw_user_meta_data';

COMMENT ON TRIGGER on_user_update_sync_rol ON "Users" IS 
  'Trigger mejorado que sincroniza metadata cuando cambian rol, firstName o lastName';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- ⚠️ DESPUÉS DE EJECUTAR ESTE SCRIPT:
-- 1. Todos los usuarios DEBEN cerrar sesión
-- 2. Volver a iniciar sesión
-- 3. Esto refresca el JWT con el nuevo metadata
-- 
-- El trigger ahora se activará automáticamente en:
-- ✅ INSERT (nuevo usuario)
-- ✅ UPDATE OF rol (cambio de rol)
-- ✅ UPDATE OF firstName (cambio de nombre)
-- ✅ UPDATE OF lastName (cambio de apellido)
-- ============================================
