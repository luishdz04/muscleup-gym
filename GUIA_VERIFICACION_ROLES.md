# 🔐 Guía de Verificación y Solución del Sistema de Roles

## 📋 Resumen del Problema

El sistema usa `user_metadata.role` de Supabase Auth para determinar el rol del usuario en el middleware. Si este metadata no está sincronizado con la tabla `Users`, los usuarios no podrán acceder correctamente a sus dashboards.

---

## 🔍 PASO 1: Verificar Estado Actual

### 1.1 Abrir Supabase Dashboard
1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (ícono </> en el menú izquierdo)

### 1.2 Ejecutar Script de Verificación
1. Crea una nueva query
2. Copia y pega el contenido de: `scripts/verificar-trigger-roles.sql`
3. Haz clic en **Run** (▶️)

### 1.3 Interpretar Resultados

#### ✅ **TODO ESTÁ BIEN** si ves:
```sql
-- Sección 1: VERIFICAR SI EXISTE EL TRIGGER
nombre_trigger: sync_role_metadata_trigger
estado: O
estado_legible: ✅ ACTIVO

-- Sección 2: VERIFICAR SI EXISTE LA FUNCIÓN
nombre_funcion: sync_role_to_metadata
(Con la definición completa de la función)

-- Sección 3: USUARIOS CON METADATA
total_con_metadata: [número > 0]
total_sin_metadata: 0

-- Sección 4: COMPARACIÓN
(Todos los usuarios con estado: ✅ SINCRONIZADO)
```

#### ❌ **HAY PROBLEMAS** si ves:
```sql
-- Sección 1: Sin resultados
(No existe el trigger)

-- Sección 3:
total_sin_metadata: [número > 0]

-- Sección 4:
estado_sincronizacion: ❌ SIN METADATA o ⚠️ DESINCRONIZADO
```

---

## 🛠️ PASO 2: Solucionar Problemas

### Si el trigger NO existe o hay usuarios desincronizados:

1. En el mismo **SQL Editor** de Supabase
2. Crea una **nueva query**
3. Copia y pega el contenido de: `scripts/solucionar-roles-metadata.sql`
4. Haz clic en **Run** (▶️)
5. Espera a que termine la ejecución (debería tomar menos de 1 segundo)

### Verificar que funcionó:

Deberías ver mensajes como:
```
NOTICE: ==================================================
NOTICE: ✅ SINCRONIZACIÓN COMPLETADA
NOTICE: ==================================================
NOTICE: Total de usuarios sincronizados: 15
NOTICE: Administradores y empleados: 3
NOTICE:
NOTICE: ⚠️ IMPORTANTE:
NOTICE: Los usuarios deben CERRAR SESIÓN y VOLVER A ENTRAR
```

---

## 🔄 PASO 3: Actualizar Sesiones de Usuarios

### ⚠️ **MUY IMPORTANTE:**

Después de ejecutar la sincronización, **TODOS los usuarios** deben:

1. **Cerrar sesión** (logout) en la aplicación
2. **Volver a iniciar sesión** (login)

**¿Por qué?**
- El JWT token se genera al momento del login
- Contiene el `user_metadata` en ese momento
- Si el metadata se actualiza después, el token NO se actualiza automáticamente
- Necesitas generar un nuevo token (haciendo logout/login)

### Usuarios que deben hacer logout/login:
- ✅ **Todos los administradores**
- ✅ **Todos los empleados**
- ✅ **Todos los clientes** (opcional, pero recomendado)

---

## 🧪 PASO 4: Probar el Sistema

### 4.1 Probar Login de Admin

1. Abre la aplicación en modo incógnito/privado
2. Inicia sesión con una cuenta de administrador
3. Deberías ser redirigido a: `/dashboard/admin/usuarios`

### 4.2 Verificar en Consola del Navegador

Abre DevTools (F12) y verifica los logs del middleware:

```
🛡️ Middleware - Path: /dashboard
🛡️ Middleware - User: Autenticado (ID: xxx)
🔍 Middleware - Verificando acceso ADMIN...
🔍 Middleware - Rol desde metadata: admin  ← ✅ DEBE APARECER "admin"
✅ Middleware - Acceso permitido
```

### 4.3 Probar Login de Cliente

1. Abre otra ventana en modo incógnito
2. Inicia sesión con una cuenta de cliente
3. Deberías ser redirigido a: `/dashboard/cliente`

---

## 📊 PASO 5: Verificación Manual en Supabase

### Consulta rápida para ver el metadata:

```sql
-- Ver metadata de usuarios específicos
SELECT
  email,
  raw_user_meta_data->>'role' as rol_metadata,
  raw_user_meta_data->>'firstName' as nombre_metadata
FROM auth.users
WHERE email IN (
  'tu-email-admin@example.com',
  'otro-usuario@example.com'
);
```

Resultado esperado:
```
email                        | rol_metadata | nombre_metadata
----------------------------|--------------|----------------
admin@muscleupgym.com       | admin        | Luis
empleado@muscleupgym.com    | empleado     | Juan
cliente@muscleupgym.com     | cliente      | Pedro
```

---

## 🔧 Mantenimiento Futuro

### El trigger ahora se ejecuta automáticamente:

✅ **Al crear un nuevo usuario:**
```sql
INSERT INTO "Users" (email, rol, ...) VALUES (...);
-- → Metadata se sincroniza automáticamente
```

✅ **Al cambiar el rol de un usuario:**
```sql
UPDATE "Users" SET rol = 'empleado' WHERE email = 'user@example.com';
-- → Metadata se sincroniza automáticamente
```

⚠️ **PERO el usuario debe hacer logout/login** para que su JWT se actualice!

---

## 🚨 Problemas Comunes

### Problema 1: "Usuario redirigido a /dashboard/cliente pero es admin"

**Causa:** El metadata no está sincronizado
**Solución:**
1. Ejecutar `solucionar-roles-metadata.sql`
2. Usuario hace logout/login

### Problema 2: "Middleware dice 'Rol desde metadata: undefined'"

**Causa:** El trigger no existe o no se ejecutó la sincronización inicial
**Solución:**
1. Ejecutar `solucionar-roles-metadata.sql`
2. Todos los usuarios hacen logout/login

### Problema 3: "Usuario acaba de cambiar de rol pero sigue con el rol anterior"

**Causa:** El JWT token está cacheado
**Solución:**
1. Usuario debe hacer **logout/login**
2. Alternativamente, esperar a que el token expire (por defecto 1 hora)

---

## 📞 Comandos Útiles

### Ver todos los triggers en la tabla Users:
```sql
SELECT
  tgname as trigger_name,
  tgenabled as enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'Users';
```

### Probar el trigger manualmente:
```sql
-- Cambiar el rol de un usuario de prueba
UPDATE "Users" SET rol = 'empleado' WHERE email = 'test@example.com';

-- Verificar que el metadata se actualizó
SELECT
  email,
  raw_user_meta_data->>'role' as metadata_role
FROM auth.users
WHERE email = 'test@example.com';
```

### Forzar sincronización de un usuario específico:
```sql
UPDATE auth.users au
SET raw_user_meta_data = COALESCE(au.raw_user_meta_data, '{}'::jsonb) ||
  jsonb_build_object(
    'role', u.rol,
    'firstName', u."firstName",
    'lastName', u."lastName"
  )
FROM "Users" u
WHERE au.id = u.id
  AND au.email = 'usuario-especifico@example.com';
```

---

## ✅ Checklist de Verificación

- [ ] Script `verificar-trigger-roles.sql` ejecutado
- [ ] Trigger `sync_role_metadata_trigger` existe y está activo
- [ ] Función `sync_role_to_metadata` existe
- [ ] Todos los usuarios tienen `metadata.role` NO NULL
- [ ] Script `solucionar-roles-metadata.sql` ejecutado (si había problemas)
- [ ] Todos los usuarios han hecho logout/login
- [ ] Admin puede acceder a `/dashboard/admin/*`
- [ ] Cliente puede acceder a `/dashboard/cliente/*`
- [ ] Middleware muestra "Rol desde metadata: admin/empleado/cliente"

---

## 📚 Archivos Relacionados

- `scripts/verificar-trigger-roles.sql` - Verificación completa
- `scripts/solucionar-roles-metadata.sql` - Solución automática
- `scripts/create-role-sync-trigger.sql` - Trigger original (referencia)
- `src/middleware.ts` - Lógica de autenticación y redirección
- `src/app/(protected)/dashboard/page.tsx` - Redirección por rol

---

## 🎯 Resultado Final Esperado

Después de seguir esta guía:

1. ✅ El trigger está activo y funcionando
2. ✅ Todos los usuarios tienen metadata sincronizado
3. ✅ Los admins son redirigidos a `/dashboard/admin/usuarios`
4. ✅ Los clientes son redirigidos a `/dashboard/cliente`
5. ✅ El middleware valida roles correctamente
6. ✅ No hay queries adicionales a la BD (el middleware usa metadata)

**El sistema de roles está 100% funcional y optimizado.** 🚀
