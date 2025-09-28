// 📁 src/components/catalogo/ProductStockDialog.tsx - v8.4 CAMPOS BD CORREGIDOS
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  TrendingUp as EntradaIcon,
  TrendingDown as SalidaIcon,
  Build as AjusteIcon,
  SwapHoriz as TransferenciaIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Inventory2 as StockIcon,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
  BusinessCenter as BusinessIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE v8.4 CORREGIDOS
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { useUserTracking } from '@/hooks/useUserTracking';
import { notify } from '@/utils/notifications';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ IMPORTAR INTERFACES CENTRALIZADAS v8.4
import { 
  Warehouse, 
  WarehouseBasic,
  WarehouseType,
  WAREHOUSE_TYPES,
  getWarehouseTypeInfo 
} from '@/types/warehouse';

// ✅ TIPOS ENTERPRISE v8.4 - MULTI-ALMACÉN CORREGIDO
type MovementType = 
  | 'recepcion_compra' | 'devolucion' | 'ajuste_manual_mas' | 'inventario_inicial'
  | 'merma' | 'ajuste_manual_menos' | 'transferencia_entrada' | 'transferencia_salida';

interface ProductStock {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  current_stock: number;
  reserved_stock?: number;
  min_stock: number;
  max_stock?: number;
  cost_price?: number;
  sale_price?: number;
  unit?: string;
  is_active?: boolean;
}

// ✅ CORREGIDO: Interface para stock por almacén v8.4 - CAMPOS REALES DE BD
interface WarehouseStockData {
  warehouse_id: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock?: number;        // ✅ CORREGIDO: sin _threshold
  max_stock?: number;        // ✅ CORREGIDO: sin _threshold
  reorder_point?: number;
  reorder_quantity?: number;
}

interface MovementTypeConfig {
  value: MovementType;
  label: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
  isPositive: boolean;
}

interface FormData {
  movementType: MovementType;
  quantity: number;
  reason: string;
  notes: string;
  warehouseId: string;
}

interface FormErrors {
  quantity?: string;
  reason?: string;
  warehouseId?: string;
}

// ✅ TIPOS DE MOVIMIENTO ENTERPRISE v8.4
const MOVEMENT_TYPES: readonly MovementTypeConfig[] = [
  {
    value: 'recepcion_compra',
    label: 'Recepción de Compra',
    description: 'Entrada por orden de compra recibida',
    icon: <EntradaIcon />,
    color: colorTokens.success,
    bgColor: `${colorTokens.success}10`,
    isPositive: true
  },
  {
    value: 'devolucion',
    label: 'Devolución Cliente',
    description: 'Entrada por devolución de cliente',
    icon: <EntradaIcon />,
    color: colorTokens.success,
    bgColor: `${colorTokens.success}10`,
    isPositive: true
  },
  {
    value: 'ajuste_manual_mas',
    label: 'Ajuste Manual (+)',
    description: 'Incremento manual por inventario físico',
    icon: <AjusteIcon />,
    color: colorTokens.success,
    bgColor: `${colorTokens.success}10`,
    isPositive: true
  },
  {
    value: 'inventario_inicial',
    label: 'Inventario Inicial',
    description: 'Carga inicial de inventario',
    icon: <StockIcon />,
    color: colorTokens.info,
    bgColor: `${colorTokens.info}10`,
    isPositive: true
  },
  {
    value: 'ajuste_manual_menos',
    label: 'Ajuste Manual (-)',
    description: 'Reducción manual por inventario físico',
    icon: <AjusteIcon />,
    color: colorTokens.danger,
    bgColor: `${colorTokens.danger}10`,
    isPositive: false
  },
  {
    value: 'merma',
    label: 'Merma/Producto Dañado',
    description: 'Salida por producto dañado o vencido',
    icon: <SalidaIcon />,
    color: colorTokens.danger,
    bgColor: `${colorTokens.danger}10`,
    isPositive: false
  },
  {
    value: 'transferencia_entrada',
    label: 'Transferencia Entrada',
    description: 'Entrada por transferencia de otra ubicación',
    icon: <TransferenciaIcon />,
    color: colorTokens.info,
    bgColor: `${colorTokens.info}10`,
    isPositive: true
  },
  {
    value: 'transferencia_salida',
    label: 'Transferencia Salida',
    description: 'Salida por transferencia a otra ubicación',
    icon: <TransferenciaIcon />,
    color: colorTokens.warning,
    bgColor: `${colorTokens.warning}10`,
    isPositive: false
  }
] as const;

// ✅ RAZONES PREDEFINIDAS v8.4
const MOVEMENT_REASONS: Record<MovementType, readonly string[]> = {
  recepcion_compra: [
    'Compra a proveedor',
    'Orden de compra recibida',
    'Mercancía de proveedor',
    'Reabastecimiento programado'
  ],
  devolucion: [
    'Devolución de cliente',
    'Producto defectuoso devuelto',
    'Cambio de producto',
    'Cliente insatisfecho'
  ],
  ajuste_manual_mas: [
    'Inventario físico - productos encontrados',
    'Corrección de error de sistema',
    'Diferencia positiva en conteo',
    'Productos no registrados encontrados'
  ],
  inventario_inicial: [
    'Carga inicial de inventario',
    'Apertura de sucursal',
    'Migración de sistema',
    'Inventario de apertura'
  ],
  ajuste_manual_menos: [
    'Inventario físico - faltante',
    'Corrección de error de sistema',
    'Diferencia negativa en conteo',
    'Productos no localizados'
  ],
  merma: [
    'Producto vencido',
    'Producto dañado',
    'Deterioro por almacenamiento',
    'Pérdida por manejo'
  ],
  transferencia_entrada: [
    'Recibido de otra sucursal',
    'Transferencia de bodega central',
    'Redistribución interna',
    'Cambio de ubicación'
  ],
  transferencia_salida: [
    'Enviado a otra sucursal',
    'Transferencia a bodega central',
    'Redistribución interna',
    'Cambio de ubicación'
  ]
} as const;

// ✅ CONSTANTES ICONOS POR TIPO v8.4
const WAREHOUSE_TYPE_ICONS = {
  central: <BusinessIcon />,
  store: <StoreIcon />,
  temporary: <WarehouseIcon />
} as const;

interface ProductStockDialogProps {
  open: boolean;
  onClose: () => void;
  product?: ProductStock | null;
  onSave: () => void;
}

export default function ProductStockDialog({
  open,
  onClose,
  product,
  onSave
}: ProductStockDialogProps) {
  // ✅ 1. HOOKS DE ESTADO PRIMERO (orden v8.4)
  const [formData, setFormData] = useState<FormData>({
    movementType: 'ajuste_manual_mas',
    quantity: 0,
    reason: '',
    notes: '',
    warehouseId: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  
  // ✅ ESTADOS PARA STOCK POR ALMACÉN v8.4
  const [warehouseStocks, setWarehouseStocks] = useState<Record<string, WarehouseStockData>>({});
  const [loadingStocks, setLoadingStocks] = useState<boolean>(false);

  // ✅ 2. HOOKS DE CONTEXT/CUSTOM (orden v8.4)
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  // ✅ CARGAR WAREHOUSES REAL BD v8.4 - TIPOS CENTRALIZADOS
  const { 
    data: warehouses,
    loading: warehousesLoading
  } = useEntityCRUD<Warehouse>({
    tableName: 'warehouses',
    selectQuery: `
      id, code, name, description, address, warehouse_type, 
      is_active, is_default, manager_user_id, auto_restock_enabled,
      min_stock_threshold, max_capacity, current_capacity,
      operating_hours, time_zone, created_at, updated_at
    `
  });

  // ✅ FUNCIÓN PARA CARGAR STOCKS POR ALMACÉN v8.4 - CAMPOS CORREGIDOS
  const loadWarehouseStocks = useCallback(async () => {
    if (!product?.id) return;
    
    setLoadingStocks(true);
    try {
      // ✅ CONSULTA CORREGIDA - USANDO CAMPOS REALES DE LA TABLA
      const { data, error } = await supabase
        .from('product_warehouse_stock')
        .select(`
          warehouse_id, 
          current_stock, 
          reserved_stock, 
          available_stock,
          min_stock,
          max_stock,
          reorder_point,
          reorder_quantity
        `)
        .eq('product_id', product.id);
      
      if (error) {
        console.error('❌ Error consultando product_warehouse_stock:', error);
        throw error;
      }
      
      console.log('✅ Datos recibidos de product_warehouse_stock:', data);
      
      // ✅ CONVERTIR A OBJETO PARA FÁCIL ACCESO
      const stocksByWarehouse: Record<string, WarehouseStockData> = {};
      (data || []).forEach(item => {
        stocksByWarehouse[item.warehouse_id] = {
          warehouse_id: item.warehouse_id,
          current_stock: item.current_stock || 0,
          reserved_stock: item.reserved_stock || 0,
          available_stock: item.available_stock || item.current_stock || 0,
          min_stock: item.min_stock,        // ✅ CORREGIDO: sin _threshold
          max_stock: item.max_stock,        // ✅ CORREGIDO: sin _threshold
          reorder_point: item.reorder_point,
          reorder_quantity: item.reorder_quantity
        };
      });
      
      setWarehouseStocks(stocksByWarehouse);
      console.log('✅ Stocks procesados por almacén:', stocksByWarehouse);
    } catch (error: any) {
      console.error('❌ Error cargando stocks por almacén:', error);
      notify.error('Error cargando stock por almacén: ' + error.message);
    } finally {
      setLoadingStocks(false);
    }
  }, [product?.id, supabase]);

  // ✅ 3. HOOKS DE EFECTO (después de custom) - CORREGIDO
  useEffect(() => {
    if (product && open && warehouses.length > 0) {
      // ✅ CARGAR STOCKS POR ALMACÉN PRIMERO
      loadWarehouseStocks();
      
      // ✅ BUSCAR WAREHOUSE POR DEFECTO O USAR EL PRIMERO - NULL SAFE
      const defaultWarehouse = warehouses.find(w => w.is_default === true && w.is_active) || 
                              warehouses.find(w => w.is_active) || 
                              warehouses[0];
      
      setFormData({
        movementType: 'ajuste_manual_mas',
        quantity: 0,
        reason: '',
        notes: '',
        warehouseId: defaultWarehouse?.id || ''
      });
      setErrors({});
    }
  }, [product, open, warehouses, loadWarehouseStocks]);

  // ✅ 4. HOOKS DE CALLBACK Y MEMO (al final) - CORREGIDO PARA STOCK POR ALMACÉN

  // ✅ HELPERS MEMOIZADOS v8.4 - CON STOCK POR ALMACÉN REAL Y CAMPOS CORREGIDOS
  const { 
    currentConfig, 
    availableReasons, 
    previewStock, 
    previewColor, 
    stockWarnings, 
    selectedWarehouse, 
    currentWarehouseStock 
  } = useMemo(() => {
    if (!product) return {
      currentConfig: MOVEMENT_TYPES[0],
      availableReasons: [] as readonly string[],
      previewStock: 0,
      previewColor: colorTokens.textSecondary,
      stockWarnings: [] as string[],
      selectedWarehouse: null as Warehouse | null,
      currentWarehouseStock: 0
    };

    const config = MOVEMENT_TYPES.find(t => t.value === formData.movementType) || MOVEMENT_TYPES[0];
    const reasons = MOVEMENT_REASONS[formData.movementType] || [];
    
    // ✅ NULL SAFE WAREHOUSE SEARCH
    const warehouse = warehouses.find(w => w.id === formData.warehouseId) || null;
    
    // ✅ OBTENER STOCK DEL ALMACÉN ESPECÍFICO (CRÍTICO)
    const warehouseStockData = warehouseStocks[formData.warehouseId];
    const warehouseStock = warehouseStockData?.current_stock || 0;
    
    // ✅ CALCULAR PREVIEW CON STOCK DEL ALMACÉN ESPECÍFICO
    let newStock = warehouseStock;
    if (config.isPositive) {
      newStock = warehouseStock + formData.quantity;
    } else {
      newStock = warehouseStock - formData.quantity;
    }
    newStock = Math.max(0, newStock);

    // Color del preview basado en el almacén
    let color: string;
    if (newStock === 0) color = colorTokens.danger;
    else if (newStock <= product.min_stock) color = colorTokens.warning;
    else if (product.max_stock && newStock > product.max_stock) color = colorTokens.info;
    else color = colorTokens.success;

    // ✅ WARNINGS CON STOCK DEL ALMACÉN ESPECÍFICO Y CAMPOS CORREGIDOS
    const warnings: string[] = [];
    if (newStock === 0) warnings.push('El almacén quedará sin stock');
    if (newStock <= product.min_stock && newStock > 0) {
      warnings.push(`Stock por debajo del mínimo (${product.min_stock})`);
    }
    if (product.max_stock && newStock > product.max_stock) {
      warnings.push(`Stock excede el máximo (${product.max_stock})`);
    }
    // ✅ CORREGIDO: Usar campos reales de la BD
    if (warehouseStockData?.min_stock && newStock <= warehouseStockData.min_stock) {
      warnings.push(`Por debajo del mínimo del almacén (${warehouseStockData.min_stock})`);
    }

    return {
      currentConfig: config,
      availableReasons: reasons,
      previewStock: newStock,
      previewColor: color,
      stockWarnings: warnings,
      selectedWarehouse: warehouse,
      currentWarehouseStock: warehouseStock
    };
  }, [product, formData.movementType, formData.quantity, formData.warehouseId, warehouses, warehouseStocks]);

  // ✅ VALIDACIONES ENTERPRISE v8.4 - CON STOCK DEL ALMACÉN
  const validateForm = useCallback((): boolean => {
    if (!product) return false;
    
    const newErrors: FormErrors = {};

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    // ✅ VALIDAR CON STOCK DEL ALMACÉN ESPECÍFICO (CRÍTICO)
    if (!currentConfig.isPositive && formData.quantity > currentWarehouseStock) {
      newErrors.quantity = `Stock insuficiente en este almacén. Disponible: ${currentWarehouseStock}`;
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'La razón del movimiento es obligatoria';
    }

    if (!formData.warehouseId) {
      newErrors.warehouseId = 'Debe seleccionar un almacén';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [product, formData, currentConfig, currentWarehouseStock]);

  // ✅ HANDLERS MEMOIZADOS v8.4
  const handleChange = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // ✅ CREAR MOVIMIENTO DIRECTO BD v8.4 - CORREGIDO PARA STOCK POR ALMACÉN
  const createInventoryMovement = useCallback(async () => {
    if (!validateForm() || !product || !selectedWarehouse) return;

    setLoading(true);
    try {
      // ✅ CALCULAR VALORES CON STOCK DEL ALMACÉN ESPECÍFICO
      const adjustmentQuantity = currentConfig.isPositive ? formData.quantity : -formData.quantity;
      const previousStock = currentWarehouseStock;
      const newStock = Math.max(0, previousStock + adjustmentQuantity);
      
      // ✅ CREAR MOVIMIENTO CON AUDITORÍA AUTOMÁTICA v8.4
      const movementData = await addAuditFieldsFor('inventory_movements', {
        product_id: product.id,
        target_warehouse_id: formData.warehouseId,
        movement_type: formData.movementType,
        quantity: adjustmentQuantity,
        previous_stock: previousStock,
        new_stock: newStock,
        unit_cost: product.cost_price || 0,
        total_cost: (product.cost_price || 0) * Math.abs(adjustmentQuantity),
        reason: formData.reason,
        notes: `${formData.notes}${selectedWarehouse ? ` | Almacén: ${selectedWarehouse.name} (${selectedWarehouse.code})` : ''}`.trim(),
        created_at: getCurrentTimestamp()
      }, false);

      // ✅ INSERTAR EN BD - EL TRIGGER SE ENCARGA DEL RESTO
      const { error } = await supabase
        .from('inventory_movements')
        .insert([movementData]);

      if (error) throw error;

      notify.success(`Stock ajustado en ${selectedWarehouse.name}: ${currentConfig.label}`);
      
      // ✅ RECARGAR STOCKS DESPUÉS DEL CAMBIO
      await loadWarehouseStocks();
      
      onSave();
      onClose();
    } catch (error: any) {
      notify.error(`Error al ajustar stock: ${error.message}`);
      console.error('Error al ajustar stock:', error);
    } finally {
      setLoading(false);
    }
  }, [validateForm, product, selectedWarehouse, currentConfig, formData, currentWarehouseStock, addAuditFieldsFor, supabase, loadWarehouseStocks, onSave, onClose]);

  // ✅ SSR SAFETY SIMPLIFICADO v8.4
  if (!hydrated) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '200px',
            background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
            <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
              Cargando MuscleUp Gym...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!product) return null;

  const isFormValid = formData.quantity > 0 && formData.reason.trim() !== '' && formData.warehouseId !== '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}30`,
          borderRadius: 4,
          color: colorTokens.textPrimary
        }
      }}
    >
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral400})`,
        borderBottom: `1px solid ${colorTokens.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <WarehouseIcon sx={{ color: colorTokens.brand }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Ajustar Stock Multi-Almacén - {product.name}
          </Typography>
          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
            Stock en almacén: {loadingStocks ? 'Cargando...' : currentWarehouseStock} {product.unit || 'unidades'}
            {selectedWarehouse && ` | ${selectedWarehouse.name}`}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* 📊 INFORMACIÓN DEL PRODUCTO */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: colorTokens.surfaceLevel1, 
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ 
                    backgroundColor: `${colorTokens.brand}20`,
                    color: colorTokens.brand,
                    width: 56,
                    height: 56,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    {product.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      SKU: {product.sku || 'Sin SKU'} | Categoría: {product.category || 'Sin categoría'}
                    </Typography>
                    <Box display="flex" gap={2} mt={1} flexWrap="wrap">
                      <Chip 
                        label={`Stock Global: ${product.current_stock} ${product.unit || 'u'}`}
                        sx={{
                          backgroundColor: `${colorTokens.info}20`,
                          color: colorTokens.info,
                          border: `1px solid ${colorTokens.info}30`
                        }}
                        size="small"
                      />
                      {selectedWarehouse && !loadingStocks && (
                        <Chip 
                          label={`En ${selectedWarehouse.code}: ${currentWarehouseStock} ${product.unit || 'u'}`}
                          sx={{
                            backgroundColor: `${colorTokens.brand}20`,
                            color: colorTokens.brand,
                            border: `1px solid ${colorTokens.brand}30`,
                            fontWeight: 'bold'
                          }}
                          size="small"
                        />
                      )}
                      <Chip 
                        label={`Min: ${product.min_stock}`}
                        sx={{
                          backgroundColor: `${colorTokens.warning}20`,
                          color: colorTokens.warning,
                          border: `1px solid ${colorTokens.warning}30`
                        }}
                        size="small"
                      />
                      {product.max_stock && (
                        <Chip 
                          label={`Max: ${product.max_stock}`}
                          sx={{
                            backgroundColor: `${colorTokens.success}20`,
                            color: colorTokens.success,
                            border: `1px solid ${colorTokens.success}30`
                          }}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* 📊 BARRA DE PROGRESO DEL STOCK DEL ALMACÉN */}
                {selectedWarehouse && !loadingStocks && (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                        Nivel de Stock en {selectedWarehouse.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                        {product.max_stock ? 
                          `${((currentWarehouseStock / product.max_stock) * 100).toFixed(0)}%` : 
                          '-- %'
                        }
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={product.max_stock ? Math.min((currentWarehouseStock / product.max_stock) * 100, 100) : 50}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colorTokens.neutral400,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: currentWarehouseStock === 0 ? colorTokens.danger :
                                          currentWarehouseStock <= product.min_stock ? colorTokens.warning :
                                          colorTokens.success
                        }
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ SELECCIÓN DE ALMACÉN BD REAL v8.4 - TIPOS CENTRALIZADOS CON NULL CHECKS */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `${colorTokens.brand}10`, 
              border: `2px solid ${colorTokens.brand}30`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.brand, 
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <StoreIcon />
                  Seleccionar Almacén de Destino
                </Typography>
                
                {warehousesLoading ? (
                  <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={32} sx={{ color: colorTokens.brand }} />
                  </Box>
                ) : warehouses.length === 0 ? (
                  <Alert severity="warning">
                    No hay almacenes configurados. Contacte al administrador.
                  </Alert>
                ) : (
                  <FormControl fullWidth error={!!errors.warehouseId}>
                    <InputLabel sx={{ 
                      color: colorTokens.textSecondary,
                      '&.Mui-focused': { color: colorTokens.brand }
                    }}>
                      Almacén *
                    </InputLabel>
                    <Select
                      value={formData.warehouseId}
                      label="Almacén *"
                      onChange={(e) => handleChange('warehouseId', e.target.value)}
                      sx={{
                        color: colorTokens.textPrimary,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${colorTokens.brand}30`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colorTokens.brand
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colorTokens.brand
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            background: colorTokens.surfaceLevel2,
                            border: `1px solid ${colorTokens.brand}30`,
                            color: colorTokens.textPrimary
                          }
                        }
                      }}
                    >
                      {warehouses.filter(w => w.is_active).map((warehouse) => {
                        const typeInfo = getWarehouseTypeInfo(warehouse.warehouse_type);
                        const warehouseIcon = WAREHOUSE_TYPE_ICONS[warehouse.warehouse_type] || <WarehouseIcon />;
                        const warehouseStockData = warehouseStocks[warehouse.id];
                        
                        return (
                          <MenuItem key={warehouse.id} value={warehouse.id}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar sx={{
                                backgroundColor: warehouse.is_default === true ? `${colorTokens.brand}20` : `${colorTokens.info}20`,
                                color: warehouse.is_default === true ? colorTokens.brand : colorTokens.info,
                                width: 32,
                                height: 32,
                                fontSize: '0.75rem'
                              }}>
                                {warehouseIcon}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {warehouse.name}
                                  {warehouse.is_default === true && (
                                    <Chip 
                                      label="DEFAULT" 
                                      size="small" 
                                      sx={{ 
                                        ml: 1, 
                                        backgroundColor: `${colorTokens.brand}20`,
                                        color: colorTokens.brand,
                                        fontSize: '0.65rem',
                                        height: 16
                                      }} 
                                    />
                                  )}
                                </Typography>
                                <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                  {warehouse.code} | {typeInfo.label}
                                  {warehouseStockData && !loadingStocks && (
                                    ` | Stock: ${warehouseStockData.current_stock} ${product.unit || 'u'}`
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {errors.warehouseId && (
                      <Typography variant="caption" sx={{ color: colorTokens.danger, mt: 0.5 }}>
                        {errors.warehouseId}
                      </Typography>
                    )}
                  </FormControl>
                )}

                {/* ✅ INFORMACIÓN DEL ALMACÉN SELECCIONADO - NULL SAFE */}
                {selectedWarehouse && (
                  <Alert severity="info" sx={{ mt: 2, backgroundColor: `${colorTokens.info}10` }}>
                    Movimiento será registrado en: <strong>{selectedWarehouse.name}</strong> ({selectedWarehouse.code})
                    {selectedWarehouse.is_default === true && ' - Almacén por defecto'}
                    <br />
                    Stock actual: <strong>{loadingStocks ? 'Cargando...' : currentWarehouseStock} {product.unit || 'u'}</strong>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 🎯 TIPOS DE MOVIMIENTO v8.4 */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 2 }}>
              Tipo de Movimiento
            </Typography>
            <Grid container spacing={2}>
              {MOVEMENT_TYPES.map((movement) => (
                <Grid key={movement.value} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      background: formData.movementType === movement.value ? 
                        movement.bgColor : 
                        colorTokens.surfaceLevel1,
                      border: formData.movementType === movement.value ? 
                        `2px solid ${movement.color}` : 
                        `1px solid ${colorTokens.border}`,
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: movement.color,
                        backgroundColor: movement.bgColor
                      }
                    }}
                    onClick={() => handleChange('movementType', movement.value)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{
                          backgroundColor: movement.bgColor,
                          color: movement.color,
                          width: 40,
                          height: 40
                        }}>
                          {movement.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                            {movement.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                            {movement.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* 📝 FORMULARIO DE MOVIMIENTO v8.4 */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: currentConfig.bgColor, 
              border: `2px solid ${currentConfig.color}30`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: currentConfig.color, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  {currentConfig.icon}
                  {currentConfig.label}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad"
                      value={formData.quantity}
                      onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                      error={!!errors.quantity}
                      helperText={errors.quantity || `Cantidad a ${currentConfig.isPositive ? 'agregar' : 'reducir'}`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth error={!!errors.reason}>
                      <InputLabel sx={{ 
                        color: colorTokens.textSecondary,
                        '&.Mui-focused': { color: colorTokens.brand }
                      }}>
                        Razón del Movimiento *
                      </InputLabel>
                      <Select
                        value={formData.reason}
                        label="Razón del Movimiento *"
                        onChange={(e) => handleChange('reason', e.target.value)}
                        sx={{
                          color: colorTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${colorTokens.brand}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: colorTokens.brand
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              background: colorTokens.surfaceLevel2,
                              border: `1px solid ${colorTokens.brand}30`,
                              color: colorTokens.textPrimary
                            }
                          }
                        }}
                      >
                        {availableReasons.map((reason) => (
                          <MenuItem key={reason} value={reason}>
                            {reason}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.reason && (
                        <Typography variant="caption" sx={{ color: colorTokens.danger, mt: 0.5 }}>
                          {errors.reason}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Notas Adicionales"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      multiline
                      rows={3}
                      placeholder="Detalles adicionales sobre este movimiento..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 📊 PREVIEW DEL RESULTADO v8.4 - CORREGIDO PARA ALMACÉN ESPECÍFICO */}
          {formData.quantity > 0 && selectedWarehouse && !loadingStocks && (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ 
                background: `${previewColor}10`, 
                border: `2px solid ${previewColor}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <InfoIcon sx={{ color: previewColor }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: previewColor }}>
                      Preview - {selectedWarehouse.name} ({selectedWarehouse.code})
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Box textAlign="center" sx={{ p: 2 }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Stock Actual en {selectedWarehouse.code}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                          {currentWarehouseStock}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          {product.unit || 'u'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      <Box textAlign="center" sx={{ p: 2 }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Cambio
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: currentConfig.color }}>
                          {currentConfig.isPositive ? '+' : '-'}{formData.quantity}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          {product.unit || 'u'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      <Box textAlign="center" sx={{ p: 2 }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Stock Final en {selectedWarehouse.code}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: previewColor }}>
                          {previewStock}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          {product.unit || 'u'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* 🚨 ALERTAS DE STOCK */}
                  {stockWarnings.map((warning, index) => (
                    <Alert key={index} severity="warning" sx={{ mt: 2 }}>
                      {warning}
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* 🚨 ERRORES GENERALES */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 3 }}>
            Por favor, corrige los errores antes de continuar.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${colorTokens.border}`,
        gap: 2
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          startIcon={<CloseIcon />}
          sx={{ 
            color: colorTokens.textSecondary,
            borderColor: `${colorTokens.textSecondary}60`,
            px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={createInventoryMovement}
          disabled={loading || !isFormValid || loadingStocks}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${currentConfig.color}, ${currentConfig.color}CC)`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 4, py: 1.5, borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${currentConfig.color}CC, ${currentConfig.color}AA)`,
            },
            '&:disabled': {
              background: colorTokens.neutral600,
              color: colorTokens.textDisabled
            }
          }}
        >
          {loading ? 'Procesando...' : `Aplicar en ${selectedWarehouse?.code || 'Almacén'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}