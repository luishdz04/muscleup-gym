# 🔒 Actualización de Permisos para Empleados

## 📅 Fecha: 24 de Octubre, 2025

---

## 🎯 Resumen de Cambios

Se ha actualizado el sistema de permisos para **restringir drásticamente** el acceso de empleados al panel administrativo, siguiendo los requerimientos específicos del usuario.

---

## ⚠️ IMPORTANTE: Acceso Muy Limitado para Empleados

### El empleado **SOLO** puede ver 4 secciones:

1. **Usuarios** (acceso completo)
2. **Membresías & Pagos** → Solo 2 subopciones:
   - ✅ Registrar Membresía
   - ✅ Historial de Pagos
3. **POS MUP** → Solo 2 subopciones:
   - ✅ Punto de Venta
   - ✅ Gestión de Apartados
4. **Historial de Asistencias**

### TODO lo demás está OCULTO ❌

---

## 📝 Archivos Modificados

### 1. `src/config/permissions.ts`

**Cambios:**
- Reducción drástica de permisos para rol `empleado`
- Agregados nuevos permisos granulares:
  - `dashboard.view` - Para controlar acceso al dashboard principal
  - `memberships.dashboard` - Para controlar acceso al dashboard de membresías
  - `memberships.coupons` - Para controlar acceso a cupones
  - `sales.history` - Para controlar acceso al historial de ventas

**Permisos actuales de empleado:**
```typescript
empleado: [
  // Usuarios (acceso completo)
  'users.view',
  'users.create',
  'users.edit',
  'users.export',

  // Membresías - SOLO Registrar
  'memberships.create',
  'memberships.view', // Para ver historial de pagos

  // POS - SOLO Punto de Venta
  'pos.access',

  // Apartados - SOLO Gestión
  'layaways.view',
  'layaways.create',
  'layaways.manage',

  // Historial de Asistencias
  'access.view',
]
```

### 2. `src/app/(protected)/dashboard/admin/AdminLayoutClient.tsx`

**Cambios:**
- Agregado campo `permission` a los siguientes items del menú:

#### Items con permiso (SOLO admin puede ver):
- **Dashboard** → `permission: 'dashboard.view'`
- **Planes** → `permission: 'plans.view'`
- **Catálogo** (completo) → `permission: 'catalog.view'`
- **Egresos** (completo) → `permission: 'finance.expenses.view'`
- **Cortes** (completo) → `permission: 'finance.cuts'`
- **Reportes** → `permission: 'reports.view'`
- **Biblioteca de Ejercicios** → `permission: 'exercises.view'`
- **Rutinas** → `permission: 'routines.view'`
- **Empleados** (completo) → `permission: 'employees.view'` ✅ Ya existía
- **Herramientas** (completo) → `permission: 'tools.settings'` ✅ Ya existía

#### Subitems con permiso:
- **Membresías & Pagos:**
  - Dashboard → `permission: 'memberships.dashboard'`
  - Cupones → `permission: 'memberships.coupons'`
  - Registrar Membresía → ✅ SIN permiso (empleado puede ver)
  - Historial de Pagos → ✅ SIN permiso (empleado puede ver)

- **POS MUP:**
  - Historial de Ventas → `permission: 'sales.history'`
  - Punto de Venta → ✅ SIN permiso (empleado puede ver)
  - Gestión de Apartados → ✅ SIN permiso (empleado puede ver)

#### Items SIN permiso (todos pueden ver):
- **Usuarios** → SIN permiso
- **Historial de Asistencias** → SIN permiso

### 3. `SISTEMA_PERMISOS_ROLES.md`

**Cambios:**
- Actualizada la sección de permisos de empleado
- Actualizada la visualización del menú para empleados
- Actualizada la sección de pruebas con los nuevos requerimientos

---

## 🧪 Cómo Probar los Cambios

### 1. Crear o Modificar Usuario Empleado

**Opción A: Desde Supabase SQL Editor**
```sql
UPDATE "Users"
SET rol = 'empleado'
WHERE email = 'correo-del-empleado@example.com';
```

**Opción B: Desde la interfaz admin**
1. Login como admin
2. Ve a **Empleados → Registrar Empleado**
3. Crea un nuevo empleado

### 2. Cerrar Sesión y Volver a Iniciar

⚠️ **MUY IMPORTANTE:** El usuario debe:
1. Cerrar sesión completamente
2. Volver a iniciar sesión

Esto actualiza el JWT token con el nuevo metadata de rol.

### 3. Verificar Menú de Empleado

Después de login como empleado, deberías ver **SOLO** estos 4 items:

```
├── Usuarios
├── Membresías & Pagos
│   ├── Registrar Membresía ✅
│   └── Historial de Pagos ✅
├── POS MUP
│   ├── Punto de Venta ✅
│   └── Gestión de Apartados ✅
└── Historial de Asistencias
```

### 4. Verificar Que TODO lo Demás Está Oculto

El empleado **NO debería ver**:
- ❌ Dashboard
- ❌ Empleados
- ❌ Planes
- ❌ Dashboard de Membresías
- ❌ Cupones
- ❌ Historial de Ventas (en POS)
- ❌ Catálogo (completo)
- ❌ Egresos (completo)
- ❌ Cortes (completo)
- ❌ Reportes
- ❌ Biblioteca de Ejercicios
- ❌ Rutinas
- ❌ Herramientas

---

## 🔍 Debugging

### Ver rol del usuario en consola del navegador

1. Abre DevTools (F12)
2. Ve a Console
3. Deberías ver logs como:
```
🔐 [useUserRole] Rol detectado: empleado
```

### Verificar permisos en base de datos

```sql
-- Ver metadata de usuarios
SELECT
  email,
  raw_user_meta_data->>'role' as metadata_role
FROM auth.users
WHERE email = 'correo-del-empleado@example.com';
```

### Verificar que el trigger está activo

```sql
-- Ver estado del trigger
SELECT
  tgname,
  tgtype,
  tgenabled
FROM pg_trigger
WHERE tgname = 'on_user_update_sync_rol';
```

---

## ✅ Checklist de Implementación

- [x] Actualizado `src/config/permissions.ts` con permisos restrictivos
- [x] Agregados nuevos tipos de permisos granulares
- [x] Actualizado `AdminLayoutClient.tsx` con campos `permission`
- [x] Actualizada documentación `SISTEMA_PERMISOS_ROLES.md`
- [x] Creado documento de resumen de cambios
- [ ] **Pendiente:** Probar con usuario empleado real
- [ ] **Pendiente:** Verificar que las páginas individuales también validen permisos

---

## 📋 Comparación: Antes vs Después

### ANTES (Demasiado permisivo):
```typescript
empleado: [
  'users.view', 'users.create', 'users.edit', 'users.export',
  'plans.view',
  'memberships.view', 'memberships.create', 'memberships.edit',
  'sales.view', 'sales.create', 'sales.edit', 'pos.access',
  'layaways.view', 'layaways.create', 'layaways.manage',
  'catalog.view',
  'inventory.view',
  'finance.view', 'finance.expenses.view', 'finance.expenses.create',
  'reports.view', 'reports.export', 'analytics.view',
  'exercises.view', 'exercises.create', 'exercises.edit',
  'routines.view', 'routines.create', 'routines.edit', 'routines.assign'
]
```

### DESPUÉS (Muy restrictivo):
```typescript
empleado: [
  // Solo acceso básico
  'users.view', 'users.create', 'users.edit', 'users.export',
  'memberships.create', 'memberships.view',
  'pos.access',
  'layaways.view', 'layaways.create', 'layaways.manage',
  'access.view',
  // NADA MÁS
]
```

---

## 🚀 Próximos Pasos Recomendados

1. **Probar login con empleado** y verificar menú
2. **Validar permisos a nivel de página** individual
3. **Crear guards en API routes** para proteger endpoints
4. **Agregar mensajes de error** cuando empleado intente acceder a rutas prohibidas
5. **Considerar ocultar estadísticas** en las páginas que el empleado SÍ puede ver (POS, etc.)

---

## 💡 Notas Importantes

### Sincronización de Roles
- El trigger `on_user_update_sync_rol` sincroniza automáticamente el rol de la tabla `Users` a `auth.users.raw_user_meta_data`
- Cualquier cambio en `Users.rol` se refleja inmediatamente en el metadata
- **Sin embargo**, el usuario debe cerrar sesión y volver a iniciar para que su JWT se actualice

### Middleware
- El middleware lee el rol desde `session.user.user_metadata.role`
- Ya está configurado para redirigir según rol
- No necesita modificaciones adicionales

### Hook useUserRole
- Lee el rol desde el session metadata
- Se suscribe a cambios de autenticación
- Actualiza automáticamente cuando la sesión cambia

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si un empleado intenta acceder directamente a una URL prohibida?**
R: El menú no mostrará la opción, pero deberías agregar validación a nivel de página para mayor seguridad.

**P: ¿Los permisos se aplican solo al menú o también a las páginas?**
R: Actualmente solo al menú. Se recomienda agregar validación en las páginas individuales usando `hasPermission(role, permission)`.

**P: ¿Cómo ocultar estadísticas en páginas que el empleado SÍ puede ver?**
R: Usa el hook `useUserRole()` en la página y renderiza condicionalmente:
```typescript
const { isAdmin } = useUserRole();
{isAdmin && <StatsSection />}
```

**P: ¿Puedo modificar los permisos de empleado más adelante?**
R: Sí, solo edita el array `empleado` en `src/config/permissions.ts`.

---

¡Sistema de permisos restrictivos implementado exitosamente! 🎉
