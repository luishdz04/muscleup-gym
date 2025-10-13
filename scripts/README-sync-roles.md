# 🔄 Sincronización de Roles a Metadata

## 📋 Descripción

Este script migra los roles desde la tabla `Users` hacia los `user_metadata` de Supabase Auth, permitiendo que el middleware acceda al rol sin hacer consultas adicionales a la base de datos.

## 🎯 ¿Por qué hacer esto?

### Antes (con tabla Users):
```typescript
// ❌ Requiere query adicional en cada request
const { data: userData } = await supabase
  .from('Users')
  .select('rol')
  .eq('id', user.id)
  .single();

const userRole = userData?.rol;
```

### Después (con metadata):
```typescript
// ✅ Acceso directo desde el token JWT
const userRole = user.user_metadata?.role || 'cliente';
```

### Ventajas:
- ⚡ **Más rápido**: No requiere consulta a DB
- 🔒 **Más seguro**: El rol viaja en el JWT
- 📦 **Menos carga**: Reduce queries en middleware
- 🔄 **Estándar**: Patrón recomendado por Supabase

## 🚀 Ejecución

### 1. Instalar dependencias (si no están):
```bash
npm install tsx --save-dev
```

### 2. Configurar variables de entorno:

Asegúrate de tener en tu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

⚠️ **IMPORTANTE**: Necesitas el `SUPABASE_SERVICE_ROLE_KEY` (no el anon key) para poder actualizar metadata de usuarios.

### 3. Ejecutar el script:
```bash
npx tsx scripts/sync-roles-to-metadata.ts
```

## 📊 Salida esperada:

```
🔄 Iniciando sincronización de roles...

📋 Obteniendo usuarios de tabla Users...
✅ Encontrados 3 usuarios con rol

🔧 Actualizando: ing.luisdeluna@outlook.com
   Nombre: Luis Diego De Luna
   Rol: admin
   ✅ Metadata actualizada correctamente

🔧 Actualizando: administracion@muscleupgym.fitness
   Nombre: Erick Francisco De Luna
   Rol: admin
   ✅ Metadata actualizada correctamente

🔧 Actualizando: luisdeluna04@hotmail.com
   Nombre: [Nombre]
   Rol: admin
   ✅ Metadata actualizada correctamente

📊 RESUMEN DE SINCRONIZACIÓN:
   ✅ Exitosos: 3
   ❌ Errores: 0
   📝 Total: 3

🎯 VERIFICANDO USUARIOS ESPECÍFICOS:

   📧 ing.luisdeluna@outlook.com
      Rol: admin
      ID: 66cdda52-3472-4adc-90ff-b6977706729f
      Estado: ✅ Sincronizado

   📧 administracion@muscleupgym.fitness
      Rol: admin
      ID: 011cacb3-0a1e-46f7-8ce6-725fdd9a198a
      Estado: ✅ Sincronizado

   📧 luisdeluna04@hotmail.com
      Rol: admin
      ID: [id]
      Estado: ✅ Sincronizado

✅ Script completado
```

## 🔍 Verificación después de ejecutar

Para verificar que la metadata se actualizó correctamente, ejecuta en Supabase:

```sql
SELECT 
  email,
  raw_user_meta_data->>'role' as metadata_role,
  raw_user_meta_data->>'firstName' as metadata_firstName,
  raw_user_meta_data->>'lastName' as metadata_lastName
FROM auth.users
WHERE email IN (
  'ing.luisdeluna@outlook.com', 
  'administracion@muscleupgym.fitness',
  'luisdeluna04@hotmail.com'
);
```

Deberías ver algo como:
```
email                                | metadata_role | metadata_firstName | metadata_lastName
-------------------------------------|---------------|-------------------|------------------
ing.luisdeluna@outlook.com          | admin         | Luis Diego        | De Luna
administracion@muscleupgym.fitness  | admin         | Erick Francisco   | De Luna
luisdeluna04@hotmail.com            | admin         | [Nombre]          | [Apellido]
```

## ⚠️ Importante

1. **Los usuarios deben cerrar sesión y volver a iniciar** para que el nuevo metadata esté disponible en su token JWT
2. El script debe ejecutarse **cada vez que cambies un rol en la tabla Users**
3. Considera crear un **trigger en Supabase** para sincronizar automáticamente

## 🔄 Sincronización automática (opcional)

Para sincronizar automáticamente cuando cambies roles en la tabla Users, crea un trigger en Supabase:

```sql
-- Función para sincronizar rol
CREATE OR REPLACE FUNCTION sync_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar metadata cuando cambie el rol
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object(
      'role', NEW.rol,
      'firstName', NEW."firstName",
      'lastName', NEW."lastName"
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se activa al actualizar Users
CREATE TRIGGER sync_role_metadata_trigger
AFTER INSERT OR UPDATE OF rol, "firstName", "lastName" ON "Users"
FOR EACH ROW
EXECUTE FUNCTION sync_role_to_metadata();
```

## 📝 Cambios en el código

El middleware ahora usa:

```typescript
// ✅ Acceso directo desde metadata (sin query)
const userRole = user.user_metadata?.role || 'cliente';
```

En lugar de:

```typescript
// ❌ Query adicional a la tabla Users
const { data: userData } = await supabase
  .from('Users')
  .select('rol')
  .eq('id', user.id)
  .single();
```

## 🎯 Usuarios afectados

Este script sincronizará específicamente:
- ✅ `ing.luisdeluna@outlook.com` - Admin
- ✅ `administracion@muscleupgym.fitness` - Admin  
- ✅ `luisdeluna04@hotmail.com` - Admin

Y **todos los demás usuarios** que tengan un rol definido en la tabla `Users`.
