// 📁 src/components/catalogo/ProductStockDialog.tsx - v10.1 ENHANCED + ARIA FIXED
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid as Grid,
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
  BusinessCenter as BusinessIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE v10.1
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { useUserTracking } from '@/hooks/useUserTracking';
import { notify } from '@/utils/notifications';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// ✅ INTERFACES CENTRALIZADAS v10.1
import { 
  Warehouse, 
  WarehouseBasic,
  WarehouseType,
  WAREHOUSE_TYPES,
  getWarehouseTypeInfo 
} from '@/types/warehouse';

// ✅ TIPOS ENTERPRISE v10.1
type MovementType = 
  | 'recepcion_compra' | 'devolucion' | 'ajuste_manual_mas' | 'inventario_inicial'
  | 'merma' | 'ajuste_manual_menos' | 'transferencia_entrada' | 'transferencia_salida';

interface ProductStock {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  current_stock: number;
  total_system_stock?: number; // ✅ NUEVO - Campo del sistema multi-almacén v10.1
  reserved_stock?: number;
  min_stock: number;
  max_stock?: number;
  cost_price?: number;
  sale_price?: number;
  unit?: string;
  is_active?: boolean;
}

interface WarehouseStockData {
  warehouse_id: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  min_stock?: number;
  max_stock?: number;
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

// ✅ TIPOS DE MOVIMIENTO v10.1
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

// ✅ RAZONES PREDEFINIDAS v10.1
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
  // ✅ REF PARA FOCUS MANAGEMENT (ARIA FIX)
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  // ✅ HOOKS DE ESTADO
  const [formData, setFormData] = useState<FormData>({
    movementType: 'ajuste_manual_mas',
    quantity: 0,
    reason: '',
    notes: '',
    warehouseId: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [warehouseStocks, setWarehouseStocks] = useState<Record<string, WarehouseStockData>>({});
  const [loadingStocks, setLoadingStocks] = useState<boolean>(false);

  // ✅ HOOKS CUSTOM
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const supabase = createBrowserSupabaseClient();
  
  // ✅ CARGAR WAREHOUSES
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

  // ✅ CARGAR STOCKS POR ALMACÉN
  const loadWarehouseStocks = useCallback(async () => {
    if (!product?.id) return;
    
    setLoadingStocks(true);
    try {
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
      
      if (error) throw error;
      
      const stocksByWarehouse: Record<string, WarehouseStockData> = {};
      (data || []).forEach(item => {
        stocksByWarehouse[item.warehouse_id] = {
          warehouse_id: item.warehouse_id,
          current_stock: item.current_stock || 0,
          reserved_stock: item.reserved_stock || 0,
          available_stock: item.available_stock || item.current_stock || 0,
          min_stock: item.min_stock,
          max_stock: item.max_stock,
          reorder_point: item.reorder_point,
          reorder_quantity: item.reorder_quantity
        };
      });
      
      setWarehouseStocks(stocksByWarehouse);
    } catch (error: any) {
      console.error('❌ Error cargando stocks:', error);
      notify.error('Error cargando stock por almacén: ' + error.message);
    } finally {
      setLoadingStocks(false);
    }
  }, [product?.id, supabase]);

  // ✅ EFECTO DE INICIALIZACIÓN
  useEffect(() => {
    if (product && open && warehouses.length > 0) {
      loadWarehouseStocks();
      
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

  // ✅ EFFECT PARA MANEJAR FOCUS AL ABRIR (ARIA FIX)
  useEffect(() => {
    if (open && dialogContentRef.current && !loading && !loadingStocks) {
      const timer = setTimeout(() => {
        const firstFocusableElement = dialogContentRef.current?.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        
        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [open, loading, loadingStocks]);

  // ✅ HELPERS MEMOIZADOS
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
    const warehouse = warehouses.find(w => w.id === formData.warehouseId) || null;
    const warehouseStockData = warehouseStocks[formData.warehouseId];
    const warehouseStock = warehouseStockData?.current_stock || 0;
    
    let newStock = warehouseStock;
    if (config.isPositive) {
      newStock = warehouseStock + formData.quantity;
    } else {
      newStock = warehouseStock - formData.quantity;
    }
    newStock = Math.max(0, newStock);

    let color: string;
    if (newStock === 0) color = colorTokens.danger;
    else if (newStock <= product.min_stock) color = colorTokens.warning;
    else if (product.max_stock && newStock > product.max_stock) color = colorTokens.info;
    else color = colorTokens.success;

    const warnings: string[] = [];
    if (newStock === 0) warnings.push('El almacén quedará sin stock');
    if (newStock <= product.min_stock && newStock > 0) {
      warnings.push(`Stock por debajo del mínimo (${product.min_stock})`);
    }
    if (product.max_stock && newStock > product.max_stock) {
      warnings.push(`Stock excede el máximo (${product.max_stock})`);
    }
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

  // ✅ VALIDACIÓN
  const validateForm = useCallback((): boolean => {
    if (!product) return false;
    
    const newErrors: FormErrors = {};

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

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

  // ✅ HANDLERS
  const handleChange = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // ✅ CREAR MOVIMIENTO - ARQUITECTURA v10.1
  const createInventoryMovement = useCallback(async () => {
    if (!validateForm() || !product || !selectedWarehouse) return;

    setLoading(true);
    try {
      const baseMovementData = {
        product_id: product.id,
        movement_type: formData.movementType,
        quantity: currentConfig.isPositive ? formData.quantity : -formData.quantity,
        target_warehouse_id: currentConfig.isPositive ? formData.warehouseId : null,
        source_warehouse_id: !currentConfig.isPositive ? formData.warehouseId : null,
        unit_cost: product.cost_price || 0,
        total_cost: (product.cost_price || 0) * formData.quantity,
        reason: formData.reason,
        notes: `${formData.notes}${formData.notes ? ' | ' : ''}Almacén: ${selectedWarehouse.name} (${selectedWarehouse.code})`.trim(),
        reference_id: null,
        auto_generated: false
      };

      const movementDataWithAudit = await addAuditFieldsFor('inventory_movements', baseMovementData, false);

      const { data, error } = await supabase
        .from('inventory_movements')
        .insert(movementDataWithAudit)
        .select()
        .single();

      if (error) throw error;

      notify.success(
        `${currentConfig.label} registrado en ${selectedWarehouse.name}. Stock actualizado correctamente.`
      );
      
      setTimeout(() => {
        loadWarehouseStocks();
      }, 300);
      
      onSave();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Error al registrar movimiento:', error);
      notify.error(`Error al registrar movimiento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [
    validateForm, 
    product, 
    selectedWarehouse, 
    currentConfig, 
    formData, 
    supabase, 
    addAuditFieldsFor,
    loadWarehouseStocks, 
    onSave, 
    onClose
  ]);

  // ✅ SSR SAFETY
  if (!hydrated) {
    return (
      <Dialog 
        open={open} 
        maxWidth="md" 
        fullWidth
        disableRestoreFocus={false}
        disableAutoFocus={false}
        disableEnforceFocus={false}
        aria-labelledby="loading-dialog-title"
      >
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
            <Typography 
              id="loading-dialog-title"
              variant="h6" 
              sx={{ color: colorTokens.textSecondary }}
            >
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
      disableRestoreFocus={false}
      disableAutoFocus={false}
      disableEnforceFocus={false}
      aria-labelledby="stock-dialog-title"
      aria-describedby="stock-dialog-description"
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}30`,
          borderRadius: 4,
          color: colorTokens.textPrimary,
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px ${colorTokens.brand}20`
        }
      }}
    >
      <DialogTitle 
        id="stock-dialog-title"
        sx={{ 
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral400})`,
          borderBottom: `1px solid ${colorTokens.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 2
        }}
      >
        <Avatar sx={{ 
          backgroundColor: `${colorTokens.brand}20`,
          color: colorTokens.brand,
          width: 48,
          height: 48
        }}>
          <WarehouseIcon fontSize="large" />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            Ajustar Stock
          </Typography>
          <Typography 
            id="stock-dialog-description"
            variant="body2" 
            sx={{ color: colorTokens.textSecondary, mt: 0.5 }}
          >
            {product.name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent 
        ref={dialogContentRef}
        sx={{ p: 4 }}
      >
        <Grid container spacing={3}>
          {/* INFORMACIÓN DEL PRODUCTO - MEJORADA */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${colorTokens.surfaceLevel1}, ${colorTokens.surfaceLevel2})`,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3,
              boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
              transition: 'all 0.3s ease'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="flex-start" gap={3}>
                  <Avatar sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})`,
                    color: colorTokens.textOnBrand,
                    width: 64,
                    height: 64,
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    boxShadow: `0 4px 12px ${colorTokens.brand}40`
                  }}>
                    {product.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 0.5 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                      SKU: <strong>{product.sku || 'Sin SKU'}</strong> • Categoría: <strong>{product.category || 'Sin categoría'}</strong>
                    </Typography>
                    
                    <Box display="flex" gap={1.5} flexWrap="wrap">
                      <Chip 
                        icon={<StockIcon sx={{ fontSize: 16 }} />}
                    label={`Stock Global: ${product.total_system_stock} ${product.unit || 'u'}`} // ✅ CORREGIDO
                        sx={{
                          background: `linear-gradient(135deg, ${colorTokens.info}20, ${colorTokens.info}10)`,
                          color: colorTokens.info,
                          border: `1px solid ${colorTokens.info}40`,
                          fontWeight: 600,
                          boxShadow: `0 2px 4px ${colorTokens.info}20`
                        }}
                        size="small"
                      />
                      {selectedWarehouse && !loadingStocks && (
                        <Chip 
                          icon={<WarehouseIcon sx={{ fontSize: 16 }} />}
                          label={`${selectedWarehouse.code}: ${currentWarehouseStock} ${product.unit || 'u'}`}
                          sx={{
                            background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
                            color: colorTokens.brand,
                            border: `1px solid ${colorTokens.brand}40`,
                            fontWeight: 700,
                            boxShadow: `0 2px 4px ${colorTokens.brand}20`
                          }}
                          size="small"
                        />
                      )}
                      <Chip 
                        icon={<WarningIcon sx={{ fontSize: 16 }} />}
                        label={`Min: ${product.min_stock}`}
                        sx={{
                          background: `linear-gradient(135deg, ${colorTokens.warning}20, ${colorTokens.warning}10)`,
                          color: colorTokens.warning,
                          border: `1px solid ${colorTokens.warning}40`,
                          fontWeight: 600
                        }}
                        size="small"
                      />
                      {product.max_stock && (
                        <Chip 
                          icon={<CheckIcon sx={{ fontSize: 16 }} />}
                          label={`Max: ${product.max_stock}`}
                          sx={{
                            background: `linear-gradient(135deg, ${colorTokens.success}20, ${colorTokens.success}10)`,
                            color: colorTokens.success,
                            border: `1px solid ${colorTokens.success}40`,
                            fontWeight: 600
                          }}
                          size="small"
                        />
                      )}
                    </Box>

                    {selectedWarehouse && !loadingStocks && (
                      <Box sx={{ mt: 2.5 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="caption" fontWeight={600} sx={{ color: colorTokens.textSecondary }}>
                            Nivel en {selectedWarehouse.name}
                          </Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ 
                            color: currentWarehouseStock === 0 ? colorTokens.danger :
                                   currentWarehouseStock <= product.min_stock ? colorTokens.warning :
                                   colorTokens.success
                          }}>
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
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: `${colorTokens.neutral400}60`,
                            boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.2)`,
                            '& .MuiLinearProgress-bar': {
                              background: currentWarehouseStock === 0 ? 
                                `linear-gradient(90deg, ${colorTokens.danger}, ${colorTokens.danger}CC)` :
                                currentWarehouseStock <= product.min_stock ? 
                                `linear-gradient(90deg, ${colorTokens.warning}, ${colorTokens.warning}CC)` :
                                `linear-gradient(90deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
                              borderRadius: 5,
                              boxShadow: currentWarehouseStock > 0 ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none'
                            }
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* SELECCIÓN DE ALMACÉN - MEJORADA */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}08)`,
              border: `2px solid ${colorTokens.brand}40`,
              borderRadius: 3,
              boxShadow: `0 4px 12px ${colorTokens.brand}20`
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.brand, 
                  mb: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  <StoreIcon sx={{ fontSize: 28 }} />
                  Seleccionar Almacén
                </Typography>
                
                {warehousesLoading ? (
                  <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress size={40} sx={{ color: colorTokens.brand }} />
                  </Box>
                ) : warehouses.length === 0 ? (
                  <Alert severity="warning" sx={{ 
                    backgroundColor: `${colorTokens.warning}15`,
                    border: `1px solid ${colorTokens.warning}30`
                  }}>
                    No hay almacenes configurados. Contacte al administrador.
                  </Alert>
                ) : (
                  <FormControl fullWidth error={!!errors.warehouseId}>
                    <InputLabel sx={{ 
                      color: colorTokens.textSecondary,
                      '&.Mui-focused': { color: colorTokens.brand }
                    }}>
                      Almacén de Destino *
                    </InputLabel>
                    <Select
                      value={formData.warehouseId}
                      label="Almacén de Destino *"
                      onChange={(e) => handleChange('warehouseId', e.target.value)}
                      sx={{
                        color: colorTokens.textPrimary,
                        backgroundColor: colorTokens.surfaceLevel1,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: `${colorTokens.brand}40`
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colorTokens.brand
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colorTokens.brand,
                          borderWidth: 2
                        }
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            background: colorTokens.surfaceLevel2,
                            border: `1px solid ${colorTokens.brand}30`,
                            color: colorTokens.textPrimary,
                            boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3)`
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
                            <Box display="flex" alignItems="center" gap={2} sx={{ width: '100%' }}>
                              <Avatar sx={{
                                background: warehouse.is_default === true ? 
                                  `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})` : 
                                  `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.info}CC)`,
                                color: colorTokens.textOnBrand,
                                width: 36,
                                height: 36,
                                fontSize: '0.875rem',
                                flexShrink: 0
                              }}>
                                {warehouseIcon}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                                  <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                                    {warehouse.name}
                                  </Typography>
                                  {warehouse.is_default === true && (
                                    <Chip 
                                      label="DEFAULT" 
                                      size="small" 
                                      sx={{ 
                                        backgroundColor: `${colorTokens.brand}30`,
                                        color: colorTokens.brand,
                                        fontSize: '0.65rem',
                                        height: 18,
                                        fontWeight: 700,
                                        '& .MuiChip-label': { px: 0.75 }
                                      }} 
                                    />
                                  )}
                                </Box>
                                <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                  {warehouse.code} • {typeInfo.label}
                                  {warehouseStockData && !loadingStocks && (
                                    <strong> • Stock: {warehouseStockData.current_stock} {product.unit || 'u'}</strong>
                                  )}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        );
                      })}
                    </Select>
                    {errors.warehouseId && (
                      <Typography variant="caption" sx={{ color: colorTokens.danger, mt: 1, fontWeight: 500 }}>
                        {errors.warehouseId}
                      </Typography>
                    )}
                  </FormControl>
                )}

                {selectedWarehouse && (
                  <Alert 
                    severity="info" 
                    icon={<InfoIcon />}
                    sx={{ 
                      mt: 2.5,
                      backgroundColor: `${colorTokens.info}15`,
                      border: `1px solid ${colorTokens.info}30`,
                      '& .MuiAlert-icon': { color: colorTokens.info }
                    }}
                  >
                    <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                      Movimiento en: <strong>{selectedWarehouse.name}</strong> ({selectedWarehouse.code})
                      {selectedWarehouse.is_default === true && ' - Almacén predeterminado'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textPrimary, mt: 0.5 }}>
                      Stock actual: <strong>{loadingStocks ? 'Cargando...' : `${currentWarehouseStock} ${product.unit || 'u'}`}</strong>
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* TIPOS DE MOVIMIENTO - MEJORADOS */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 2.5 }}>
              Tipo de Movimiento
            </Typography>
            <Grid container spacing={2}>
              {MOVEMENT_TYPES.map((movement) => (
                <Grid key={movement.value} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      background: formData.movementType === movement.value ? 
                        `linear-gradient(135deg, ${movement.color}25, ${movement.color}15)` : 
                        `linear-gradient(135deg, ${colorTokens.surfaceLevel1}, ${colorTokens.surfaceLevel2})`,
                      border: formData.movementType === movement.value ? 
                        `2px solid ${movement.color}` : 
                        `1px solid ${colorTokens.border}`,
                      borderRadius: 3,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: formData.movementType === movement.value ?
                        `0 4px 12px ${movement.color}40` :
                        '0 2px 4px rgba(0, 0, 0, 0.1)',
                      transform: formData.movementType === movement.value ? 'scale(1.02)' : 'scale(1)',
                      '&:hover': {
                        borderColor: movement.color,
                        background: `linear-gradient(135deg, ${movement.color}20, ${movement.color}10)`,
                        transform: 'scale(1.02)',
                        boxShadow: `0 6px 16px ${movement.color}30`
                      }
                    }}
                    onClick={() => handleChange('movementType', movement.value)}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{
                          background: formData.movementType === movement.value ?
                            `linear-gradient(135deg, ${movement.color}, ${movement.color}CC)` :
                            movement.bgColor,
                          color: formData.movementType === movement.value ?
                            colorTokens.textOnBrand :
                            movement.color,
                          width: 44,
                          height: 44,
                          boxShadow: formData.movementType === movement.value ?
                            `0 4px 8px ${movement.color}40` : 'none'
                        }}>
                          {movement.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                            {movement.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary, lineHeight: 1.3 }}>
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

          {/* FORMULARIO - MEJORADO */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `linear-gradient(135deg, ${currentConfig.color}15, ${currentConfig.color}08)`,
              border: `2px solid ${currentConfig.color}40`,
              borderRadius: 3,
              boxShadow: `0 4px 12px ${currentConfig.color}20`
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: currentConfig.color, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}>
                  {currentConfig.icon}
                  {currentConfig.label}
                </Typography>
                
                <Grid container spacing={2.5}>
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
                          backgroundColor: colorTokens.surfaceLevel1,
                          '& fieldset': { borderColor: `${currentConfig.color}40` },
                          '&:hover fieldset': { borderColor: currentConfig.color },
                          '&.Mui-focused fieldset': { 
                            borderColor: currentConfig.color,
                            borderWidth: 2
                          }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: currentConfig.color }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth error={!!errors.reason}>
                      <InputLabel sx={{ 
                        color: colorTokens.textSecondary,
                        '&.Mui-focused': { color: currentConfig.color }
                      }}>
                        Razón del Movimiento *
                      </InputLabel>
                      <Select
                        value={formData.reason}
                        label="Razón del Movimiento *"
                        onChange={(e) => handleChange('reason', e.target.value)}
                        sx={{
                          color: colorTokens.textPrimary,
                          backgroundColor: colorTokens.surfaceLevel1,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${currentConfig.color}40`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: currentConfig.color
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: currentConfig.color,
                            borderWidth: 2
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              background: colorTokens.surfaceLevel2,
                              border: `1px solid ${currentConfig.color}30`,
                              color: colorTokens.textPrimary,
                              boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3)`
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
                        <Typography variant="caption" sx={{ color: colorTokens.danger, mt: 1, fontWeight: 500 }}>
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
                          backgroundColor: colorTokens.surfaceLevel1,
                          '& fieldset': { borderColor: `${currentConfig.color}40` },
                          '&:hover fieldset': { borderColor: currentConfig.color },
                          '&.Mui-focused fieldset': { 
                            borderColor: currentConfig.color,
                            borderWidth: 2
                          }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: currentConfig.color }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* PREVIEW - MEJORADO */}
          {formData.quantity > 0 && selectedWarehouse && !loadingStocks && (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${previewColor}15, ${previewColor}08)`,
                border: `2px solid ${previewColor}40`,
                borderRadius: 3,
                boxShadow: `0 4px 12px ${previewColor}20`
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar sx={{ 
                      backgroundColor: `${previewColor}20`,
                      color: previewColor,
                      width: 40,
                      height: 40
                    }}>
                      <InfoIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: previewColor }}>
                        Vista Previa del Resultado
                      </Typography>
                      <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                        {selectedWarehouse.name} ({selectedWarehouse.code})
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Box 
                        textAlign="center" 
                        sx={{ 
                          p: 2.5,
                          background: `${colorTokens.neutral400}20`,
                          borderRadius: 2,
                          border: `1px solid ${colorTokens.neutral400}40`
                        }}
                      >
                        <Typography variant="caption" fontWeight={600} sx={{ color: colorTokens.textSecondary, mb: 1, display: 'block' }}>
                          Stock Actual
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                          {currentWarehouseStock}
                        </Typography>
                        <Typography variant="caption" fontWeight={600} sx={{ color: colorTokens.textSecondary }}>
                          {product.unit || 'unidades'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      <Box 
                        textAlign="center" 
                        sx={{ 
                          p: 2.5,
                          background: `${currentConfig.color}20`,
                          borderRadius: 2,
                          border: `1px solid ${currentConfig.color}40`,
                          boxShadow: `0 2px 8px ${currentConfig.color}20`
                        }}
                      >
                        <Typography variant="caption" fontWeight={600} sx={{ color: currentConfig.color, mb: 1, display: 'block' }}>
                          Cambio
                        </Typography>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                          {currentConfig.isPositive ? (
                            <ArrowUpIcon sx={{ color: currentConfig.color, fontSize: 32 }} />
                          ) : (
                            <ArrowDownIcon sx={{ color: currentConfig.color, fontSize: 32 }} />
                          )}
                          <Typography variant="h3" fontWeight="bold" sx={{ color: currentConfig.color }}>
                            {formData.quantity}
                          </Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={600} sx={{ color: currentConfig.color }}>
                          {product.unit || 'unidades'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 4 }}>
                      <Box 
                        textAlign="center" 
                        sx={{ 
                          p: 2.5,
                          background: `${previewColor}20`,
                          borderRadius: 2,
                          border: `2px solid ${previewColor}`,
                          boxShadow: `0 4px 12px ${previewColor}30`
                        }}
                      >
                        <Typography variant="caption" fontWeight={600} sx={{ color: previewColor, mb: 1, display: 'block' }}>
                          Stock Final
                        </Typography>
                        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                          {previewStock === 0 ? (
                            <ErrorIcon sx={{ color: previewColor, fontSize: 32 }} />
                          ) : previewStock <= product.min_stock ? (
                            <WarningIcon sx={{ color: previewColor, fontSize: 32 }} />
                          ) : (
                            <CheckIcon sx={{ color: previewColor, fontSize: 32 }} />
                          )}
                          <Typography variant="h3" fontWeight="bold" sx={{ color: previewColor }}>
                            {previewStock}
                          </Typography>
                        </Box>
                        <Typography variant="caption" fontWeight={600} sx={{ color: previewColor }}>
                          {product.unit || 'unidades'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {stockWarnings.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      {stockWarnings.map((warning, index) => (
                        <Alert 
                          key={index} 
                          severity="warning" 
                          icon={<WarningIcon />}
                          sx={{ 
                            mt: index > 0 ? 1.5 : 0,
                            backgroundColor: `${colorTokens.warning}15`,
                            border: `1px solid ${colorTokens.warning}40`,
                            '& .MuiAlert-icon': { color: colorTokens.warning }
                          }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {warning}
                          </Typography>
                        </Alert>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {Object.keys(errors).length > 0 && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 3,
              backgroundColor: `${colorTokens.danger}15`,
              border: `1px solid ${colorTokens.danger}40`,
              '& .MuiAlert-icon': { color: colorTokens.danger }
            }}
          >
            Por favor, corrige los errores antes de continuar.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${colorTokens.border}`,
        gap: 2,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel1}, ${colorTokens.surfaceLevel2})`
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          startIcon={<CloseIcon />}
          sx={{ 
            color: colorTokens.textSecondary,
            borderColor: `${colorTokens.textSecondary}40`,
            border: '1px solid',
            px: 3, py: 1.5, borderRadius: 3, fontWeight: 600,
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: colorTokens.textSecondary,
              backgroundColor: `${colorTokens.textSecondary}10`
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={createInventoryMovement}
          disabled={loading || !isFormValid || loadingStocks}
          startIcon={loading ? <CircularProgress size={20} sx={{ color: colorTokens.textOnBrand }} /> : <SaveIcon />}
          variant="contained"
          autoFocus={!loading && !loadingStocks}
          sx={{
            background: `linear-gradient(135deg, ${currentConfig.color}, ${currentConfig.color}CC)`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 4, py: 1.5, borderRadius: 3,
            boxShadow: `0 4px 12px ${currentConfig.color}40`,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${currentConfig.color}CC, ${currentConfig.color}AA)`,
              boxShadow: `0 6px 16px ${currentConfig.color}50`,
              transform: 'translateY(-2px)'
            },
            '&:disabled': {
              background: colorTokens.neutral600,
              color: colorTokens.textDisabled,
              boxShadow: 'none'
            }
          }}
        >
          {loading ? 'Procesando...' : `Registrar en ${selectedWarehouse?.code || 'Almacén'}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}