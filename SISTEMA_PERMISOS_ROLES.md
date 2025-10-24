# 🔐 Sistema de Permisos por Roles

## 📋 Resumen

Se ha implementado un sistema completo de permisos basado en roles que controla qué funcionalidades pueden ver y usar los usuarios según su rol (**admin** o **empleado**).

---

## 🎯 Diferencias entre Admin y Empleado

### ✅ **ADMIN** (Acceso Completo)

El administrador tiene **TODOS** los permisos del sistema:

- ✅ Gestión de Usuarios (crear, editar, eliminar, exportar)
- ✅ **Gestión de Empleados** (crear, editar, eliminar)
- ✅ **Control de Acceso** (configurar dispositivos biométricos)
- ✅ **Planes** (crear, editar, eliminar planes de membresía)
- ✅ Membresías (registrar, editar, cancelar)
- ✅ Ventas y POS
- ✅ **Catálogo** (editar productos, proveedores, almacenes)
- ✅ **Inventario** (gestionar movimientos)
- ✅ **Finanzas** (cortes de caja, eliminar gastos)
- ✅ Reportes y Analytics
- ✅ **Herramientas del Sistema** (configuración, respaldos, encuestas)
- ✅ Biblioteca de Ejercicios y Rutinas (crear, editar, eliminar)

### ⚠️ **EMPLEADO** (Acceso MUY Limitado)

El empleado tiene acceso **MUY RESTRINGIDO**. **SOLO puede ver:**

### ✅ **El Empleado SÍ puede:**

- ✅ **Usuarios**: Ver y gestionar usuarios (crear, editar, exportar - NO eliminar)
- ✅ **Membresías y Pagos**: SOLO ver las opciones:
  - ✅ Registrar Membresía
  - ✅ Historial de Pagos
  - ❌ NO puede ver Dashboard de Membresías
  - ❌ NO puede ver Cupones y Descuentos
- ✅ **POS MUP**: SOLO ver las opciones:
  - ✅ Punto de Venta
  - ✅ Gestión de Apartados
  - ❌ NO puede ver Historial de Ventas
- ✅ **Historial de Asistencias**: Ver registro de accesos

### ❌ **El Empleado NO puede ver:**

- ❌ **Dashboard** (menú completo oculto)
- ❌ **Empleados** (menú completo oculto)
- ❌ **Planes** (menú completo oculto)
- ❌ **Catálogo** (menú completo oculto - productos, proveedores, inventario, almacenes)
- ❌ **Egresos** (menú completo oculto)
- ❌ **Cortes** (menú completo oculto)
- ❌ **Reportes** (menú completo oculto)
- ❌ **Biblioteca de Ejercicios** (menú completo oculto)
- ❌ **Rutinas** (menú completo oculto)
- ❌ **Herramientas del Sistema** (menú completo oculto - configuración, respaldos, encuestas)

---

## 🛠️ Archivos del Sistema de Permisos

### 1. **`src/hooks/useUserRole.ts`**
Hook que obtiene el rol del usuario actual desde `user_metadata.role`.

```typescript
const { role, isAdmin, isEmpleado, loading } = useUserRole();

// role: 'admin' | 'empleado' | 'cliente' | null
// isAdmin: true si es admin
// isEmpleado: true si es empleado
// loading: true mientras carga el rol
```

### 2. **`src/config/permissions.ts`**
Define todos los permisos del sistema y qué rol tiene qué permisos.

**Funciones exportadas:**
```typescript
// Verificar si tiene un permiso específico
hasPermission(role, 'users.delete') // true o false

// Verificar si tiene TODOS los permisos
hasAllPermissions(role, ['users.create', 'users.edit'])

// Verificar si tiene AL MENOS UNO
hasAnyPermission(role, ['users.view', 'employees.view'])

// Verificar si puede acceder a una ruta
canAccessRoute(role, '/dashboard/admin/empleados')
```

### 3. **`src/app/(protected)/dashboard/admin/AdminLayoutClient.tsx`** (Modificado)
El layout admin ahora:
- Usa `useUserRole()` para obtener el rol
- Filtra los items del menú según permisos
- Solo muestra opciones que el usuario puede ver

---

## 🔒 Sistema de Permisos

### Tipos de Permisos

Cada funcionalidad tiene un permiso asociado:

```typescript
// Ejemplos de permisos:
'users.view'           // Ver usuarios
'users.create'         // Crear usuarios
'users.delete'         // Eliminar usuarios
'employees.view'       // Ver empleados (SOLO ADMIN)
'plans.create'         // Crear planes (SOLO ADMIN)
'tools.backups'        // Respaldos (SOLO ADMIN)
'finance.cuts'         // Cortes de caja (SOLO ADMIN)
```

### Cómo Agregar Permisos a un Componente

#### Opción 1: Usar el Hook

```typescript
import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission } from '@/config/permissions';

function MiComponente() {
  const { role } = useUserRole();

  return (
    <div>
      {hasPermission(role, 'users.delete') && (
        <Button onClick={handleDelete}>Eliminar</Button>
      )}
    </div>
  );
}
```

#### Opción 2: Directamente con Role

```typescript
import { useUserRole } from '@/hooks/useUserRole';

function MiComponente() {
  const { isAdmin } = useUserRole();

  return (
    <div>
      {isAdmin && (
        <Button>Solo Admin puede ver esto</Button>
      )}
    </div>
  );
}
```

---

## 🧪 Cómo Probar el Sistema

### 1. Crear un Usuario Empleado

Tienes 2 opciones:

#### Opción A: Desde la Interfaz (si tienes acceso admin)

1. Login como admin
2. Ve a **Empleados → Registrar Empleado**
3. Llena el formulario
4. El sistema automáticamente asigna `rol = 'empleado'`

#### Opción B: Desde Supabase SQL Editor

```sql
-- Cambiar el rol de un usuario existente a empleado
UPDATE "Users"
SET rol = 'empleado'
WHERE email = 'correo-del-empleado@example.com';

-- El trigger sincronizar_rol_a_auth() actualizará automáticamente
-- el user_metadata.role en auth.users
```

### 2. Verificar Sincronización

```sql
-- Verificar que el metadata se actualizó
SELECT
  email,
  raw_user_meta_data->>'role' as metadata_role
FROM auth.users
WHERE email = 'correo-del-empleado@example.com';

-- Debería mostrar: metadata_role = 'empleado'
```

### 3. Hacer Logout/Login

**IMPORTANTE:** El usuario debe:
1. Cerrar sesión
2. Volver a iniciar sesión

Esto actualiza el JWT token con el nuevo metadata.

### 4. Probar Diferencias

**Login como ADMIN:**
- Ve a `/dashboard/admin`
- Verifica que ves: **Empleados**, **Herramientas**, **Todas las opciones**

**Login como EMPLEADO:**
- Ve a `/dashboard/admin`
- Verifica que **SOLO ves** estos 4 items en el menú:
  - ✅ Usuarios
  - ✅ Membresías & Pagos (solo 2 subopciones)
  - ✅ POS MUP (solo 2 subopciones)
  - ✅ Historial de Asistencias
- Verifica que **TODO lo demás está OCULTO**:
  - ❌ Dashboard
  - ❌ Empleados
  - ❌ Planes
  - ❌ Catálogo
  - ❌ Egresos
  - ❌ Cortes
  - ❌ Reportes
  - ❌ Biblioteca
  - ❌ Rutinas
  - ❌ Herramientas

---

## 📝 Ejemplo de Uso en Páginas

### Proteger Botón de Eliminar

```typescript
// En /dashboard/admin/usuarios/page.tsx

import { useUserRole } from '@/hooks/useUserRole';
import { hasPermission } from '@/config/permissions';

export default function UsuariosPage() {
  const { role } = useUserRole();

  return (
    <div>
      {/* Empleados pueden ver la tabla */}
      <UserTable users={users} />

      {/* Solo admin puede eliminar */}
      {hasPermission(role, 'users.delete') && (
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
        >
          Eliminar Usuario
        </Button>
      )}
    </div>
  );
}
```

### Proteger Sección Completa

```typescript
import { useUserRole } from '@/hooks/useUserRole';

export default function ConfiguracionPage() {
  const { isAdmin } = useUserRole();

  if (!isAdmin) {
    return (
      <Alert severity="warning">
        No tienes permisos para acceder a esta página.
      </Alert>
    );
  }

  return <ConfiguracionGeneral />;
}
```

---

## 🎨 Menú Dinámico

El menú lateral ahora se adapta automáticamente:

### Admin ve:
```
├── Dashboard
├── Usuarios
├── Empleados ✅
│   ├── Registrar Empleado
│   └── Lista de Empleados
├── Planes
├── Membresías & Pagos
├── POS MUP
├── Catálogo
├── Egresos
├── Reportes
├── Control de Acceso
├── Biblioteca
├── Rutinas
└── Herramientas ✅
    ├── Configuración General
    ├── Avisos para Clientes
    ├── Encuestas
    └── Respaldo de Datos
```

### Empleado ve:
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

**TODO lo demás está OCULTO** para empleados.

---

## 🔧 Configuración de Permisos

Para **agregar nuevos permisos** o **modificar los existentes**, edita:

**`src/config/permissions.ts`**

```typescript
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    // Lista completa de permisos para admin
    'users.view',
    'users.create',
    // ...
  ],

  empleado: [
    // Lista reducida de permisos para empleado
    'users.view',
    'users.create',
    // NO incluir: 'users.delete'
  ]
};
```

---

## ✅ Checklist de Implementación

- [x] Hook `useUserRole` creado
- [x] Archivo de permisos `permissions.ts` creado
- [x] AdminLayout actualizado con filtros
- [x] Menú se oculta según rol
- [ ] **Pendiente**: Proteger botones de eliminar en páginas individuales
- [ ] **Pendiente**: Proteger formularios de edición según permisos
- [ ] **Pendiente**: Agregar guards a nivel de página

---

## 🚀 Próximos Pasos Recomendados

1. **Crear usuario empleado de prueba**
2. **Probar login con ambos roles**
3. **Verificar que el menú se oculta correctamente**
4. **Agregar permisos a botones específicos** en páginas como:
   - `/dashboard/admin/usuarios` (botón eliminar)
   - `/dashboard/admin/planes` (botones crear/editar/eliminar)
   - `/dashboard/admin/herramientas/*` (redirigir si no es admin)

5. **Crear middleware guards** para proteger rutas a nivel de servidor

---

## 💡 Debugging

### Ver rol del usuario en consola

```typescript
const { role, isAdmin, isEmpleado } = useUserRole();

console.log('🔐 Rol actual:', role);
console.log('👑 Es admin?:', isAdmin);
console.log('👔 Es empleado?:', isEmpleado);
```

### Verificar permisos en consola

```typescript
import { hasPermission } from '@/config/permissions';

const canDelete = hasPermission(role, 'users.delete');
console.log('¿Puede eliminar usuarios?:', canDelete);
```

---

¡El sistema de permisos está listo! 🎉

Ahora puedes controlar exactamente qué puede ver y hacer cada rol en tu aplicación.
