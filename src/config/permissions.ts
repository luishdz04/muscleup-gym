/**
 * Sistema de Permisos por Rol
 * Define qué funcionalidades puede acceder cada rol
 */

export type Permission =
  // Dashboard Principal
  | 'dashboard.view'

  // Gestión de Usuarios
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.export'

  // Gestión de Empleados
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'

  // Control de Acceso
  | 'access.view'
  | 'access.configure'
  | 'access.devices'

  // Planes y Membresías
  | 'plans.view'
  | 'plans.create'
  | 'plans.edit'
  | 'plans.delete'
  | 'memberships.view'
  | 'memberships.create'
  | 'memberships.edit'
  | 'memberships.cancel'
  | 'memberships.dashboard'
  | 'memberships.coupons'

  // Ventas y POS
  | 'sales.view'
  | 'sales.create'
  | 'sales.edit'
  | 'sales.delete'
  | 'sales.history'
  | 'pos.access'

  // Apartados
  | 'layaways.view'
  | 'layaways.create'
  | 'layaways.manage'

  // Inventario y Catálogo
  | 'catalog.view'
  | 'catalog.products.edit'
  | 'catalog.warehouses.edit'
  | 'catalog.suppliers.edit'
  | 'inventory.view'
  | 'inventory.manage'

  // Finanzas
  | 'finance.view'
  | 'finance.cuts'
  | 'finance.expenses.view'
  | 'finance.expenses.create'
  | 'finance.expenses.delete'

  // Reportes y Analytics
  | 'reports.view'
  | 'reports.export'
  | 'analytics.view'

  // Herramientas del Sistema
  | 'tools.settings'
  | 'tools.backups'
  | 'tools.announcements'

  // Biblioteca de Ejercicios y Rutinas
  | 'exercises.view'
  | 'exercises.create'
  | 'exercises.edit'
  | 'exercises.delete'
  | 'routines.view'
  | 'routines.create'
  | 'routines.edit'
  | 'routines.delete'
  | 'routines.assign';

/**
 * Mapa de permisos por rol
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    // Administrador tiene TODOS los permisos
    'dashboard.view',
    'users.view',
    'users.create',
    'users.edit',
    'users.delete',
    'users.export',
    'employees.view',
    'employees.create',
    'employees.edit',
    'employees.delete',
    'access.view',
    'access.configure',
    'access.devices',
    'plans.view',
    'plans.create',
    'plans.edit',
    'plans.delete',
    'memberships.view',
    'memberships.create',
    'memberships.edit',
    'memberships.cancel',
    'memberships.dashboard',
    'memberships.coupons',
    'sales.view',
    'sales.create',
    'sales.edit',
    'sales.delete',
    'sales.history',
    'pos.access',
    'layaways.view',
    'layaways.create',
    'layaways.manage',
    'catalog.view',
    'catalog.products.edit',
    'catalog.warehouses.edit',
    'catalog.suppliers.edit',
    'inventory.view',
    'inventory.manage',
    'finance.view',
    'finance.cuts',
    'finance.expenses.view',
    'finance.expenses.create',
    'finance.expenses.delete',
    'reports.view',
    'reports.export',
    'analytics.view',
    'tools.settings',
    'tools.backups',
    'tools.announcements',
    'exercises.view',
    'exercises.create',
    'exercises.edit',
    'exercises.delete',
    'routines.view',
    'routines.create',
    'routines.edit',
    'routines.delete',
    'routines.assign'
  ],

  empleado: [
    // ⚠️ EMPLEADO TIENE ACCESO MUY LIMITADO
    // Solo puede ver: Usuarios, Registrar Membresía, Historial de Pagos, Punto de Venta, Apartados, Historial de Asistencias

    // ✅ Usuarios (acceso completo)
    'users.view',
    'users.create',
    'users.edit',
    'users.export',

    // ✅ Membresías - SOLO Registrar
    'memberships.create',

    // ✅ Pagos - SOLO ver historial
    'memberships.view', // Para ver historial de pagos

    // ✅ POS - SOLO Punto de Venta
    'pos.access',

    // ✅ Apartados - SOLO Gestión
    'layaways.view',
    'layaways.create',
    'layaways.manage',

    // ✅ Historial de Asistencias
    'access.view',

    // ❌ NO puede ver/acceder a:
    // - Dashboard
    // - Empleados
    // - Planes
    // - Dashboard de Membresías
    // - Cupones
    // - Historial de Ventas
    // - Catálogo (productos, inventario, proveedores, almacenes)
    // - Egresos
    // - Reportes
    // - Control de Acceso (configuración)
    // - Biblioteca de Ejercicios
    // - Rutinas
    // - Herramientas del Sistema
  ],

  cliente: [
    // Cliente solo tiene acceso a su dashboard personal (no admin)
  ]
};

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Verifica si un rol tiene TODOS los permisos especificados
 */
export function hasAllPermissions(role: string | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.every(permission => rolePermissions.includes(permission));
}

/**
 * Verifica si un rol tiene AL MENOS UNO de los permisos especificados
 */
export function hasAnyPermission(role: string | null | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some(permission => rolePermissions.includes(permission));
}

/**
 * Configuración de rutas visibles por rol
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard/admin/usuarios': 'users.view',
  '/dashboard/admin/empleados': 'employees.view',
  '/dashboard/admin/acceso': 'access.view',
  '/dashboard/admin/planes': 'plans.view',
  '/dashboard/admin/membresias': 'memberships.view',
  '/dashboard/admin/sales': 'sales.view',
  '/dashboard/admin/pos': 'pos.access',
  '/dashboard/admin/layaways': 'layaways.view',
  '/dashboard/admin/catalogo': 'catalog.view',
  '/dashboard/admin/finanzas': 'finance.view',
  '/dashboard/admin/reportes': 'reports.view',
  '/dashboard/admin/herramientas': 'tools.settings',
  '/dashboard/admin/biblioteca': 'exercises.view',
  '/dashboard/admin/rutinas': 'routines.view'
};

/**
 * Verifica si un rol puede acceder a una ruta
 */
export function canAccessRoute(role: string | null | undefined, route: string): boolean {
  const permission = ROUTE_PERMISSIONS[route];
  if (!permission) return true; // Si no requiere permiso específico, permitir
  return hasPermission(role, permission);
}
