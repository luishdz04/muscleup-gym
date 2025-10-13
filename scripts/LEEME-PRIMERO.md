# 🚀 GUÍA RÁPIDA DE EJECUCIÓN

## 📋 Situación Actual

Tu trigger `on_user_update_sync_rol` ya existe y funciona, pero:
- ❌ El metadata muestra `rol: cliente` en lugar de `rol: admin`
- ❌ Solo sincroniza cuando cambias el rol, no sincronizó los usuarios existentes
- ❌ Solo sincroniza `rol`, no sincroniza `firstName`, `lastName`, `status`

## 🎯 Solución

Ejecutar **UN SOLO ARCHIVO SQL** en Supabase que:
1. ✅ Mejora tu función existente `sincronizar_rol_a_auth()`
2. ✅ Actualiza tu trigger `on_user_update_sync_rol` (agrega firstName, lastName)
3. ✅ Sincroniza TODOS los usuarios existentes en un solo UPDATE masivo
4. ✅ Verifica que todo quedó correcto

## 🚀 PASOS A SEGUIR

### Paso 1: Abrir Supabase SQL Editor
1. Ir a tu proyecto en Supabase Dashboard
2. Click en "SQL Editor" en el menú lateral
3. Click en "New query"

### Paso 2: Ejecutar el SQL
1. Abrir el archivo: `scripts/EJECUTAR-EN-SUPABASE.sql`
2. Copiar TODO el contenido
3. Pegar en Supabase SQL Editor
4. Click en "Run" (Ejecutar)

### Paso 3: Verificar resultados
El script mostrará 3 tablas de verificación automáticamente:

#### Tabla 1: Resumen general
```
total_usuarios | con_metadata | sin_metadata
---------------|--------------|-------------
      10       |      10      |      0
```

#### Tabla 2: Tus usuarios admin específicos
```
email                              | tabla_rol | metadata_role | estado
-----------------------------------|-----------|---------------|----------------
ing.luisdeluna@outlook.com         | admin     | admin         | ✅ Sincronizado
administracion@muscleupgym.fitness | admin     | admin         | ✅ Sincronizado
luisdeluna04@hotmail.com           | admin     | admin         | ✅ Sincronizado
```

#### Tabla 3: Primeros 20 usuarios con estado
```
email              | firstName | lastName | rol_tabla | rol_metadata | sync_status
-------------------|-----------|----------|-----------|--------------|-------------
admin@example.com  | Admin     | User     | admin     | admin        | ✅
user@example.com   | John      | Doe      | cliente   | cliente      | ✅
```

### Paso 4: IMPORTANTE - Cerrar/Abrir Sesión
⚠️ **TODOS LOS USUARIOS** (especialmente admins) deben:
1. Cerrar sesión completamente
2. Volver a iniciar sesión
3. Esto actualiza su JWT con el nuevo metadata

## 🔍 Qué hace el script (internamente)

### 1. Mejora la función `sincronizar_rol_a_auth()`
```sql
-- ANTES: Solo sincronizaba rol
-- DESPUÉS: Sincroniza rol + firstName + lastName + status
CREATE OR REPLACE FUNCTION sincronizar_rol_a_auth()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || 
    jsonb_build_object(
      'role', COALESCE(NEW.rol, 'cliente'),
      'firstName', NEW."firstName",
      'lastName', NEW."lastName",
      'status', NEW.status
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
```

### 2. Actualiza el trigger
```sql
-- ANTES: Solo se disparaba en INSERT o UPDATE OF rol
DROP TRIGGER IF EXISTS on_user_update_sync_rol ON "Users";

-- DESPUÉS: Se dispara también con firstName, lastName, status
CREATE TRIGGER on_user_update_sync_rol
AFTER INSERT OR UPDATE OF rol, "firstName", "lastName", status ON "Users"
FOR EACH ROW
EXECUTE FUNCTION sincronizar_rol_a_auth();
```

### 3. Sincroniza TODOS los usuarios existentes
```sql
-- Este UPDATE masivo sincroniza TODOS los usuarios de una sola vez
UPDATE auth.users au
SET raw_user_meta_data = raw_user_meta_data || 
  jsonb_build_object(
    'role', COALESCE(u.rol, 'cliente'),
    'firstName', u."firstName",
    'lastName', u."lastName",
    'status', u.status
  )
FROM "Users" u
WHERE au.id = u.id;
```

## 🧪 Probar que funciona

### Después de ejecutar el script:

#### 1. Cerrar/abrir sesión con usuario admin
```
1. Logout completo
2. Login nuevamente
3. Intentar acceder a /dashboard/admin/usuarios
4. Debería permitir el acceso ✅
```

#### 2. Verificar en consola del navegador
```
🛡️ Middleware - Verificando acceso ADMIN...
🔍 Middleware - Rol desde metadata: admin  ← DEBE DECIR "admin", NO "cliente"
✅ Middleware - Acceso permitido
```

#### 3. Crear un usuario nuevo
```
1. Registrar usuario nuevo
2. El trigger se dispara automáticamente
3. Metadata se sincroniza sin intervención manual
```

#### 4. Cambiar rol de un usuario
```sql
-- En Supabase SQL Editor:
UPDATE "Users" SET rol = 'empleado' WHERE email = 'test@example.com';

-- Verificar que se sincronizó:
SELECT 
  email, 
  raw_user_meta_data->>'role' as metadata_role
FROM auth.users 
WHERE email = 'test@example.com';
-- Debe mostrar: empleado
```

## ❌ Troubleshooting

### Problema: "permission denied for table auth.users"
**Solución:** Necesitas ejecutar como superadmin o con privilegios SECURITY DEFINER (ya está en la función)

### Problema: "function sincronizar_rol_a_auth already exists"
**Solución:** El script usa `CREATE OR REPLACE`, se sobreescribirá automáticamente

### Problema: Sigue mostrando "Rol desde metadata: cliente"
**Causa:** No cerraste/abriste sesión
**Solución:** 
1. Logout completo (borrar sesión)
2. Login nuevamente
3. El JWT se regenera con nuevo metadata

### Problema: "trigger does not exist"
**No es problema:** El script usa `DROP TRIGGER IF EXISTS`, es normal

## ✅ Checklist

Antes de ejecutar:
- [ ] Tengo acceso al Supabase SQL Editor
- [ ] Tengo permisos de admin en Supabase
- [ ] He avisado a los usuarios que deben cerrar/abrir sesión

Durante ejecución:
- [ ] Copié TODO el contenido de `EJECUTAR-EN-SUPABASE.sql`
- [ ] Pegué en SQL Editor
- [ ] Click en "Run"
- [ ] Sin errores ✅

Después de ejecutar:
- [ ] Verificación 1 muestra usuarios sincronizados
- [ ] Verificación 2 muestra tus 3 admins con rol correcto
- [ ] Cerré sesión y volví a entrar
- [ ] Middleware muestra "Rol desde metadata: admin"
- [ ] Puedo acceder a /dashboard/admin/*

## 🎉 Resultado Final

Después de ejecutar el script:

```diff
- 🔍 Middleware - Rol desde metadata: cliente
- 🚨 Middleware - ACCESO DENEGADO a ruta admin
+ 🔍 Middleware - Rol desde metadata: admin
+ ✅ Middleware - Acceso permitido
```

**Tu sistema ahora:**
- ✅ Lee el rol desde JWT (sin queries a DB)
- ✅ Sincroniza automáticamente en cada INSERT/UPDATE
- ✅ Maneja usuarios sin rol (asigna 'cliente' por defecto)
- ✅ Sincroniza también firstName, lastName, status
- ✅ Está optimizado y es más rápido

---

## 📁 Archivo a ejecutar

**Ubicación:** `scripts/EJECUTAR-EN-SUPABASE.sql`

**Contenido:** 
- Mejora función existente
- Actualiza trigger existente
- Sincroniza todos los usuarios
- Muestra verificaciones automáticas

**Tiempo de ejecución:** ~5 segundos (dependiendo del número de usuarios)

**Reversible:** Sí (el trigger anterior se guarda en el historial de Supabase)

---

¿Listo para ejecutar? Copia el contenido de `scripts/EJECUTAR-EN-SUPABASE.sql` en Supabase SQL Editor y dale "Run" 🚀
