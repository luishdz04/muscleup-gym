# 🔄 Sistema de Sincronización de Roles - Documentación Completa

## 📋 Resumen

Tu sistema tendrá **2 componentes** que trabajan juntos:

1. **Script de sincronización inicial** (`sync-roles-to-metadata.ts`)
   - Ejecutar **UNA SOLA VEZ** para sincronizar usuarios existentes
   - Sincroniza TODOS los usuarios (con o sin rol)
   - Los usuarios sin rol → se asigna 'cliente' por defecto

2. **Trigger automático** (`create-role-sync-trigger.sql`)
   - Se ejecuta **AUTOMÁTICAMENTE** en cada INSERT o UPDATE
   - Mantiene sincronizados Users.rol ↔ auth.users.metadata.role
   - Reemplaza/complementa tu trigger `on_user_update_sync_rol`

---

## 🎯 Flujo Completo

```mermaid
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: SINCRONIZACIÓN INICIAL (una sola vez)              │
│  ─────────────────────────────────────────────────────────  │
│  $ npx tsx scripts/sync-roles-to-metadata.ts               │
│                                                              │
│  ✅ Sincroniza TODOS los usuarios existentes                │
│  ✅ Usuarios con rol → mantiene su rol                      │
│  ✅ Usuarios sin rol → asigna 'cliente'                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: CREAR TRIGGER AUTOMÁTICO (una sola vez)            │
│  ─────────────────────────────────────────────────────────  │
│  Ejecutar SQL en Supabase:                                  │
│  scripts/create-role-sync-trigger.sql                       │
│                                                              │
│  ✅ Se activa automáticamente en INSERT (nuevo registro)    │
│  ✅ Se activa automáticamente en UPDATE (cambio de rol)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: DE AHORA EN ADELANTE (automático)                  │
│  ─────────────────────────────────────────────────────────  │
│  ✅ Nuevo usuario se registra → Trigger sincroniza          │
│  ✅ Se actualiza rol en Users → Trigger sincroniza          │
│  ✅ Se actualiza nombre → Trigger sincroniza                │
│  ✅ NO REQUIERE INTERVENCIÓN MANUAL                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Comparación: Trigger Anterior vs Nuevo

### Tu trigger actual: `on_user_update_sync_rol`

Copia aquí el SQL de tu trigger para analizarlo. Probablemente hace algo como:

```sql
-- Ejemplo de lo que PODRÍA ser tu trigger actual:
CREATE TRIGGER on_user_update_sync_rol
AFTER UPDATE ON "Users"
FOR EACH ROW
EXECUTE FUNCTION alguna_funcion_sync();
```

### Nuevo trigger: `sync_role_metadata_trigger`

```sql
-- Se activa en INSERT (registro) Y UPDATE (cambio)
CREATE TRIGGER sync_role_metadata_trigger
AFTER INSERT OR UPDATE OF rol, "firstName", "lastName" ON "Users"
FOR EACH ROW
EXECUTE FUNCTION sync_role_to_metadata();
```

**Ventajas del nuevo:**
- ✅ Se activa en **INSERT** (tu trigger actual probablemente solo en UPDATE)
- ✅ Se activa solo cuando cambian campos específicos (más eficiente)
- ✅ Sincroniza rol + nombre (más completo)
- ✅ Maneja metadata null con COALESCE

---

## 🚀 Instrucciones de Instalación

### Opción A: Reemplazar trigger anterior (RECOMENDADO)

Si tu trigger `on_user_update_sync_rol` hace lo mismo pero menos completo:

1. **Ejecutar script TypeScript** (sincroniza existentes):
   ```bash
   npx tsx scripts/sync-roles-to-metadata.ts
   ```

2. **Ejecutar SQL completo** (crea trigger nuevo y elimina el anterior):
   ```sql
   -- El script automáticamente hace:
   DROP TRIGGER IF EXISTS on_user_update_sync_rol ON "Users";
   -- Y crea el nuevo trigger
   ```

### Opción B: Mantener ambos (NO RECOMENDADO)

Si tu trigger hace algo adicional que necesitas:

1. **Revisar qué hace tu trigger actual** (necesito el SQL)
2. **Fusionar funcionalidades** en una sola función
3. **Evitar duplicar la sincronización**

---

## 📊 Casos de Uso Cubiertos

### ✅ Caso 1: Usuario NUEVO se registra

**Flujo:**
```
1. Usuario completa registro
2. Se inserta en tabla "Users" con rol (o null)
3. 🔄 TRIGGER se dispara automáticamente
4. ✅ Sincroniza a auth.users.metadata.role
5. Usuario inicia sesión → JWT ya tiene el rol
```

### ✅ Caso 2: Cambiar rol de usuario existente

**Flujo:**
```
1. Admin cambia rol en tabla Users (admin → empleado)
2. 🔄 TRIGGER se dispara automáticamente
3. ✅ Actualiza auth.users.metadata.role
4. Usuario debe cerrar/abrir sesión para refrescar JWT
```

### ✅ Caso 3: Usuario sin rol definido

**Flujo:**
```
1. Usuario tiene rol = NULL en tabla Users
2. Script de sincronización asigna rol = 'cliente'
3. 🔄 Metadata actualizado con 'cliente'
4. Middleware usa 'cliente' como default
```

### ✅ Caso 4: Usuarios existentes (históricos)

**Flujo:**
```
1. Ejecutar script: npx tsx scripts/sync-roles-to-metadata.ts
2. ✅ TODOS los usuarios se sincronizan en batch
3. Script muestra reporte: X exitosos, Y errores
4. Usuarios deben cerrar/abrir sesión
```

---

## 🔍 Verificación Post-Instalación

### 1. Verificar que el trigger existe:
```sql
SELECT 
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'Users'
  AND t.tgname = 'sync_role_metadata_trigger';
```

### 2. Verificar cuántos usuarios tienen metadata:
```sql
SELECT 
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' IS NOT NULL) as con_metadata,
  COUNT(*) FILTER (WHERE raw_user_meta_data->>'role' IS NULL) as sin_metadata,
  COUNT(*) as total
FROM auth.users;
```

### 3. Verificar usuarios específicos:
```sql
SELECT 
  u.email,
  u.rol as tabla_rol,
  au.raw_user_meta_data->>'role' as metadata_role,
  CASE 
    WHEN u.rol = au.raw_user_meta_data->>'role' THEN '✅ Sincronizado'
    ELSE '❌ Desincronizado'
  END as estado
FROM "Users" u
JOIN auth.users au ON u.id = au.id
WHERE u.email IN (
  'ing.luisdeluna@outlook.com',
  'administracion@muscleupgym.fitness',
  'luisdeluna04@hotmail.com'
);
```

### 4. Probar el trigger manualmente:
```sql
-- Cambiar un rol
UPDATE "Users" 
SET rol = 'empleado' 
WHERE email = 'ing.luisdeluna@outlook.com';

-- Verificar que se sincronizó
SELECT 
  email,
  raw_user_meta_data->>'role' as metadata_role
FROM auth.users
WHERE email = 'ing.luisdeluna@outlook.com';
-- Debería mostrar 'empleado'
```

---

## ⚠️ Importante: Sesiones de Usuarios

**Después de sincronizar roles, los usuarios DEBEN:**

1. **Cerrar sesión completamente**
2. **Volver a iniciar sesión**
3. **Esto refresca su JWT** con el nuevo metadata

Sin esto, seguirán usando el JWT antiguo (sin metadata).

### Alternativa: Forzar refresh desde código

```typescript
// En el cliente
const { data: { session } } = await supabase.auth.refreshSession();
```

---

## 🐛 Troubleshooting

### Problema: "SUPABASE_SERVICE_ROLE_KEY no definida"

**Solución:**
```bash
# .env.local debe tener:
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**Obtener el key:**
1. Ir a Supabase Dashboard
2. Settings → API
3. Copiar "service_role key" (NO el anon key)

### Problema: "Permission denied to update auth.users"

**Causa:** No estás usando el service_role key

**Solución:** Verificar que el script usa `SUPABASE_SERVICE_ROLE_KEY`, no `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Problema: "Trigger no se dispara"

**Verificar:**
```sql
-- Ver si el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'sync_role_metadata_trigger';

-- Ver si la función existe
SELECT * FROM pg_proc WHERE proname = 'sync_role_to_metadata';

-- Verificar logs (si pusiste RAISE NOTICE)
-- Los logs aparecen en Supabase Dashboard → Database → Logs
```

### Problema: "Usuarios siguen sin poder acceder a rutas admin"

**Causas posibles:**
1. No cerraron/abrieron sesión
2. Metadata no se sincronizó
3. Middleware no está leyendo metadata

**Solución:**
```sql
-- Verificar metadata
SELECT email, raw_user_meta_data->>'role' 
FROM auth.users 
WHERE email = 'usuario@problema.com';

-- Si está null, sincronizar manualmente:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin"}'::jsonb
WHERE email = 'usuario@problema.com';
```

---

## 📝 Checklist Final

### Instalación:
- [ ] Ejecutar `npx tsx scripts/sync-roles-to-metadata.ts`
- [ ] Ejecutar SQL `scripts/create-role-sync-trigger.sql`
- [ ] Verificar que trigger existe en Supabase
- [ ] Verificar usuarios específicos tienen metadata

### Post-Instalación:
- [ ] Usuarios admin cierran/abren sesión
- [ ] Probar acceso a rutas admin
- [ ] Probar crear usuario nuevo (verificar auto-sync)
- [ ] Probar cambiar rol (verificar auto-sync)

### Validación:
- [ ] Middleware lee `user.user_metadata?.role`
- [ ] No hay queries a tabla Users en middleware
- [ ] Logs muestran "Rol desde metadata"
- [ ] Performance mejorado (verificar tiempos)

---

## 🎯 Próximos Pasos

1. **Copia aquí el SQL de tu trigger `on_user_update_sync_rol`**
   - Para verificar si hay conflictos
   - Para fusionar funcionalidades si es necesario

2. **Ejecuta el script de sincronización**
   ```bash
   npx tsx scripts/sync-roles-to-metadata.ts
   ```

3. **Ejecuta el SQL del trigger**
   - En Supabase SQL Editor
   - Contenido de: `scripts/create-role-sync-trigger.sql`

4. **Prueba completa**
   - Login con usuario admin
   - Verificar acceso a rutas
   - Crear usuario nuevo
   - Cambiar rol de usuario

---

¿Tienes el SQL de tu trigger `on_user_update_sync_rol`? Cópialo aquí para analizarlo y asegurar compatibilidad. 🚀
