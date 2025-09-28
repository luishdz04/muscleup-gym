// 📁 src/types/warehouse.ts - INTERFACES CENTRALIZADAS v8.2 BD REAL
'use client';

// ✅ WAREHOUSE TYPE SEGÚN BD REAL v8.2 - CONSTRAINT EXACTO
export type WarehouseType = 'central' | 'store' | 'temporary';

// ✅ WAREHOUSE STATUS
export type WarehouseStatus = 'active' | 'inactive' | 'maintenance';

// ✅ INTERFACE WAREHOUSE PRINCIPAL - SINCRONIZADA CON BD REAL v8.2
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description?: string;                     // ✅ CORREGIDO: opcional (undefined) para TypeScript
  address?: any;                            // ✅ CORREGIDO: opcional (undefined) para TypeScript
  warehouse_type: WarehouseType;            // ✅ BD: constraint exacto
  is_active: boolean;                       // ✅ BD: boolean DEFAULT true
  is_default?: boolean;                     // ✅ CORREGIDO: opcional (undefined) para TypeScript
  manager_user_id?: string;                 // ✅ CORREGIDO: opcional (undefined) para TypeScript
  
  // Configuración operativa
  auto_restock_enabled?: boolean;           // ✅ CORREGIDO: opcional (undefined) para TypeScript
  min_stock_threshold?: number;             // ✅ CORREGIDO: opcional (undefined) para TypeScript
  max_capacity?: number;                    // ✅ CORREGIDO: opcional (undefined) para TypeScript
  current_capacity?: number;                // ✅ CORREGIDO: opcional (undefined) para TypeScript
  
  // Horarios y configuración
  operating_hours?: any;                    // ✅ CORREGIDO: opcional (undefined) para TypeScript
  time_zone?: string;                       // ✅ CORREGIDO: opcional (undefined) para TypeScript
  
  // Auditoría snake_case (REAL)
  created_at: string;                       // ✅ BD: timestamp NOT NULL
  created_by?: string;                      // ✅ CORREGIDO: opcional (undefined) para TypeScript
  updated_at?: string;                      // ✅ CORREGIDO: opcional (undefined) para TypeScript
  updated_by?: string;                      // ✅ CORREGIDO: opcional (undefined) para TypeScript
}

// ✅ INTERFACE WAREHOUSE SIMPLE PARA LISTAS/SELECTS
export interface WarehouseBasic {
  id: string;
  code: string;
  name: string;
  warehouse_type: WarehouseType;
  is_active: boolean;
  is_default?: boolean;
}

// ✅ INTERFACE WAREHOUSE CON RELACIONES
export interface WarehouseWithRelations extends Warehouse {
  manager?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
  };
  stock_records_count?: number;
  total_capacity_used?: number;
  last_movement_at?: string;
}

// ✅ INTERFACE STOCK POR ALMACÉN
export interface ProductWarehouseStock {
  id: string;
  product_id: string;
  warehouse_id: string;
  
  // Stock real
  current_stock: number;                    // ✅ BD: integer NOT NULL DEFAULT 0
  reserved_stock: number | null;            // ✅ BD: integer nullable
  available_stock: number;                  // ✅ BD: GENERATED (computed)
  
  // Configuración por ubicación
  min_stock: number | null;                 // ✅ BD: integer nullable
  max_stock: number | null;                 // ✅ BD: integer nullable
  reorder_point: number | null;             // ✅ BD: integer nullable
  reorder_quantity: number | null;          // ✅ BD: integer nullable
  
  // Costos
  avg_cost: number | null;                  // ✅ BD: numeric nullable
  last_cost: number | null;                 // ✅ BD: numeric nullable
  
  // Ubicación física
  location_code: string | null;             // ✅ BD: varchar nullable
  location_description: string | null;      // ✅ BD: text nullable
  
  // Timestamps automáticos
  last_movement_at: string | null;          // ✅ BD: timestamp nullable
  last_restock_at: string | null;           // ✅ BD: timestamp nullable
  created_at: string;                       // ✅ BD: timestamp NOT NULL
  updated_at: string | null;                // ✅ BD: timestamp nullable
  
  // Relaciones expandidas
  warehouse?: WarehouseBasic;
  product?: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
  };
}

// ✅ INTERFACE TRANSFER STATUS v8.2
export type TransferStatus = 'pending' | 'in_transit' | 'completed' | 'cancelled';
export type TransferType = 'manual' | 'automatic' | 'emergency';
export type TransferPriority = 'low' | 'normal' | 'high' | 'urgent';

// ✅ INTERFACE WAREHOUSE TRANSFER COMPLETA
export interface WarehouseTransfer {
  id: string;
  transfer_number: string;
  source_warehouse_id: string;
  target_warehouse_id: string;
  status: TransferStatus;
  transfer_type: TransferType;
  
  // Fechas del proceso
  requested_at: string;
  shipped_at: string | null;
  received_at: string | null;
  completed_at: string | null;
  
  // Totales
  total_items: number | null;
  total_quantity: number | null;
  total_value: number | null;
  shipping_cost: number | null;
  
  // Información adicional
  priority: TransferPriority;
  reason: string | null;
  notes: string | null;
  
  // Auditoría snake_case
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  
  // Relaciones
  source_warehouse?: WarehouseBasic;
  target_warehouse?: WarehouseBasic;
  Users?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
  };
  transfer_items?: TransferItem[];
}

// ✅ INTERFACE TRANSFER ITEM
export interface TransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  requested_quantity: number;
  shipped_quantity: number | null;
  received_quantity: number | null;
  unit_cost: number | null;
  total_cost: number | null;
  status: 'pending' | 'shipped' | 'received' | 'damaged';
  notes: string | null;
  created_at: string;
  
  // Relación con producto
  product?: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
    current_stock?: number;
  };
}

// ✅ CONSTANTES WAREHOUSE v8.2 - EXPORTAR COMO VALORES
export const WAREHOUSE_TYPES = [
  { 
    value: 'central', 
    label: 'Almacén Central', 
    description: 'Almacén principal de distribución' 
  },
  { 
    value: 'store', 
    label: 'Tienda', 
    description: 'Punto de venta directo al cliente' 
  },
  { 
    value: 'temporary', 
    label: 'Temporal', 
    description: 'Almacén temporal o estacional' 
  }
] as const;

export const TRANSFER_STATUSES = [
  { value: 'pending', label: 'Pendiente', color: '#FFA500' },
  { value: 'in_transit', label: 'En Tránsito', color: '#1E88E5' },
  { value: 'completed', label: 'Completado', color: '#4CAF50' },
  { value: 'cancelled', label: 'Cancelado', color: '#F44336' }
] as const;

export const TRANSFER_TYPES = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automático' },
  { value: 'emergency', label: 'Emergencia' }
] as const;

export const TRANSFER_PRIORITIES = [
  { value: 'low', label: 'Baja', color: '#9E9E9E' },
  { value: 'normal', label: 'Normal', color: '#2196F3' },
  { value: 'high', label: 'Alta', color: '#FF9800' },
  { value: 'urgent', label: 'Urgente', color: '#F44336' }
] as const;

// ✅ HELPER FUNCTIONS v8.2
export const getWarehouseTypeInfo = (type: WarehouseType) => {
  return WAREHOUSE_TYPES.find(wt => wt.value === type) || WAREHOUSE_TYPES[0];
};

export const getTransferStatusInfo = (status: TransferStatus) => {
  return TRANSFER_STATUSES.find(ts => ts.value === status) || TRANSFER_STATUSES[0];
};

export const getTransferPriorityInfo = (priority: TransferPriority) => {
  return TRANSFER_PRIORITIES.find(tp => tp.value === priority) || TRANSFER_PRIORITIES[1];
};

// ✅ TYPE GUARDS v8.2
export const isValidWarehouseType = (type: string): type is WarehouseType => {
  return ['central', 'store', 'temporary'].includes(type);
};

export const isValidTransferStatus = (status: string): status is TransferStatus => {
  return ['pending', 'in_transit', 'completed', 'cancelled'].includes(status);
};

export const isWarehouseActive = (warehouse: Warehouse): boolean => {
  return warehouse.is_active === true;
};

export const isWarehouseDefault = (warehouse: Warehouse): boolean => {
  return warehouse.is_default === true;
};

// ✅ UTILITY TYPES v8.2 - CORREGIDOS PARA CREACIÓN
export type WarehouseCreateData = {
  code: string;
  name: string;
  warehouse_type: WarehouseType;
  description?: string;
  address?: any;
  is_active?: boolean;
  is_default?: boolean;
  manager_user_id?: string;
  auto_restock_enabled?: boolean;
  min_stock_threshold?: number;
  max_capacity?: number;
  current_capacity?: number;
  operating_hours?: any;
  time_zone?: string;
};
export type WarehouseUpdateData = Partial<WarehouseCreateData>;

export type TransferCreateData = Omit<WarehouseTransfer, 'id' | 'transfer_number' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>;
export type TransferUpdateData = Partial<Pick<WarehouseTransfer, 'status' | 'shipped_at' | 'received_at' | 'completed_at' | 'notes' | 'priority'>>;

// ✅ WAREHOUSE FILTERS v8.2
export interface WarehouseFilters {
  warehouse_type?: WarehouseType;
  is_active?: boolean;
  is_default?: boolean;
  search?: string;
}

export interface TransferFilters {
  status?: TransferStatus;
  transfer_type?: TransferType;
  priority?: TransferPriority;
  source_warehouse_id?: string;
  target_warehouse_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}