// 📁 src/components/catalogo/ProductStockDialog.tsx - MULTI-ALMACÉN v8.2 CORREGIDO
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Warehouse as WarehouseIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE v8.2 CORREGIDOS
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { notify } from '@/utils/notifications';

// ✅ TIPOS ENTERPRISE v8.2 - MULTI-ALMACÉN
type MovementType = 
  | 'recepcion_compra' | 'devolucion' | 'ajuste_manual_mas' | 'inventario_inicial'
  | 'merma' | 'ajuste_manual_menos' | 'transferencia_entrada' | 'transferencia_salida';

interface ProductStock {
  id: string;
  name: string;
  sku?: string;
  current_stock: number;
  reserved_stock?: number;
  min_stock: number;
  max_stock?: number;
  cost_price?: number;
  sale_price?: number;
  category?: string;
  unit?: string;
  is_active?: boolean;
}

// ✅ INTERFACE WAREHOUSE v8.2
interface Warehouse {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  location?: string;
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
  warehouseId: string; // ✅ NUEVO v8.2
}

interface FormErrors {
  quantity?: string;
  reason?: string;
  warehouseId?: string; // ✅ NUEVO v8.2
}

// ✅ TIPOS DE MOVIMIENTO ENTERPRISE v8.2
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

// ✅ RAZONES PREDEFINIDAS v8.2 - MULTI-ALMACÉN EXPANDIDAS
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
  // ✅ 1. HOOKS DE ESTADO PRIMERO (orden v8.2)
  const [formData, setFormData] = useState<FormData>({
    movementType: 'ajuste_manual_mas',
    quantity: 0,
    reason: '',
    notes: '',
    warehouseId: '' // ✅ NUEVO v8.2
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]); // ✅ NUEVO v8.2

  // ✅ 2. HOOKS DE CONTEXT/CUSTOM (orden v8.2)
  const hydrated = useHydrated();
  const { adjustInventory, loading: inventoryLoading } = useInventoryManagement();

  // ✅ 3. HOOKS DE EFECTO (después de custom)
  useEffect(() => {
    if (product && open) {
      setFormData({
        movementType: 'ajuste_manual_mas',
        quantity: 0,
        reason: '',
        notes: '',
        warehouseId: warehouses.length > 0 ? warehouses[0].id : ''
      });
      loadWarehouses(); // ✅ CARGAR WAREHOUSES v8.2
    }
    setErrors({});
  }, [product, open]);

  // ✅ 4. HOOKS DE CALLBACK Y MEMO (al final)

  // ✅ CARGAR WAREHOUSES v8.2
  const loadWarehouses = useCallback(async () => {
    try {
      // Simular carga de warehouses - implementar con supabase cuando esté listo
      const mockWarehouses: Warehouse[] = [
        { id: '1', name: 'Tienda Principal', code: 'TIENDA_01', is_active: true, location: 'Planta Baja' },
        { id: '2', name: 'Almacén Central', code: 'CENTRAL', is_active: true, location: 'Bodega' }
      ];
      setWarehouses(mockWarehouses);
      
      // Establecer warehouse por defecto si no hay uno seleccionado
      if (!formData.warehouseId && mockWarehouses.length > 0) {
        setFormData(prev => ({ ...prev, warehouseId: mockWarehouses[0].id }));
      }
      
      console.log('✅ [v8.2] Warehouses cargados en dialog:', mockWarehouses.length);
    } catch (error: any) {
      console.error('Error cargando warehouses:', error);
      notify.error('Error cargando almacenes');
    }
  }, [formData.warehouseId]);

  // ✅ HELPERS MEMOIZADOS v8.2 - INCLUYE WAREHOUSE
  const { currentConfig, availableReasons, previewStock, previewColor, stockWarnings, selectedWarehouse } = useMemo(() => {
    if (!product) return {
      currentConfig: MOVEMENT_TYPES[0],
      availableReasons: [] as readonly string[],
      previewStock: 0,
      previewColor: colorTokens.textSecondary,
      stockWarnings: [] as string[],
      selectedWarehouse: null
    };

    const config = MOVEMENT_TYPES.find(t => t.value === formData.movementType) || MOVEMENT_TYPES[0];
    const reasons = MOVEMENT_REASONS[formData.movementType] || [];
    const warehouse = warehouses.find(w => w.id === formData.warehouseId) || null;
    
    // Calcular preview del stock
    let newStock = product.current_stock;
    if (config.isPositive) {
      newStock = product.current_stock + formData.quantity;
    } else {
      newStock = product.current_stock - formData.quantity;
    }
    newStock = Math.max(0, newStock);

    // Color del preview
    let color: string;
    if (newStock === 0) color = colorTokens.danger;
    else if (newStock <= product.min_stock) color = colorTokens.warning;
    else if (product.max_stock && newStock > product.max_stock) color = colorTokens.info;
    else color = colorTokens.success;

    // Warnings
    const warnings: string[] = [];
    if (newStock === 0) warnings.push('El producto quedará sin stock');
    if (newStock <= product.min_stock && newStock > 0) warnings.push(`Stock por debajo del mínimo (${product.min_stock})`);
    if (product.max_stock && newStock > product.max_stock) warnings.push(`Stock excede el máximo (${product.max_stock})`);

    return {
      currentConfig: config,
      availableReasons: reasons,
      previewStock: newStock,
      previewColor: color,
      stockWarnings: warnings,
      selectedWarehouse: warehouse
    };
  }, [product, formData.movementType, formData.quantity, formData.warehouseId, warehouses]);

  // ✅ VALIDACIONES ENTERPRISE v8.2 - INCLUYE WAREHOUSE
  const validateForm = useCallback((): boolean => {
    if (!product) return false;
    
    const newErrors: FormErrors = {};

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (!currentConfig.isPositive && formData.quantity > product.current_stock) {
      newErrors.quantity = `Stock insuficiente. Disponible: ${product.current_stock}`;
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'La razón del movimiento es obligatoria';
    }

    // ✅ VALIDACIÓN WAREHOUSE v8.2
    if (!formData.warehouseId) {
      newErrors.warehouseId = 'Debe seleccionar un almacén';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [product, formData, currentConfig]);

  // ✅ HANDLERS MEMOIZADOS v8.2
  const handleChange = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // ✅ MANEJO DE GUARDAR v8.2 - CON WAREHOUSE
  const handleSave = useCallback(async (): Promise<void> => {
    if (!validateForm() || !product) return;

    setLoading(true);
    try {
      const adjustmentQuantity = currentConfig.isPositive ? formData.quantity : -formData.quantity;
      
      // ✅ USAR adjustInventory CON WAREHOUSE v8.2
      await adjustInventory(
        product.id,
        adjustmentQuantity,
        formData.reason,
        `${formData.notes}${selectedWarehouse ? ` | Almacén: ${selectedWarehouse.name}` : ''}`,
        formData.warehouseId // ✅ NUEVO PARÁMETRO v8.2
      );

      notify.success(`Stock ajustado en ${selectedWarehouse?.name || 'almacén'}: ${formData.movementType.replace('_', ' ')}`);
      onSave();
      onClose();
    } catch (error: any) {
      notify.error(`Error al ajustar stock: ${error.message}`);
      console.error('Error al ajustar stock:', error);
    } finally {
      setLoading(false);
    }
  }, [validateForm, product, currentConfig, formData, adjustInventory, onSave, onClose, selectedWarehouse]);

  // ✅ SSR SAFETY SIMPLIFICADO v8.2
  if (!hydrated) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '200px',
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={40} sx={{ color: colorTokens.brand }} />
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
              Cargando ajuste multi-almacén...
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
            Stock actual: {product.current_stock} {product.unit || 'unidades'}
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
                        label={`Stock: ${product.current_stock} ${product.unit || 'u'}`}
                        sx={{
                          backgroundColor: `${colorTokens.info}20`,
                          color: colorTokens.info,
                          border: `1px solid ${colorTokens.info}30`
                        }}
                        size="small"
                      />
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
                      {(product.reserved_stock || 0) > 0 && (
                        <Chip 
                          label={`Reservado: ${product.reserved_stock}`}
                          sx={{
                            backgroundColor: `${colorTokens.warning}20`,
                            color: colorTokens.warning,
                            border: `1px solid ${colorTokens.warning}30`
                          }}
                          size="small"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* 📊 BARRA DE PROGRESO DEL STOCK */}
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                      Nivel de Stock Actual
                    </Typography>
                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                      {product.max_stock ? 
                        `${((product.current_stock / product.max_stock) * 100).toFixed(0)}%` : 
                        '-- %'
                      }
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={product.max_stock ? Math.min((product.current_stock / product.max_stock) * 100, 100) : 50}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colorTokens.neutral400,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: product.current_stock === 0 ? colorTokens.danger :
                                        product.current_stock <= product.min_stock ? colorTokens.warning :
                                        colorTokens.success
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ✅ NUEVO: SELECCIÓN DE ALMACÉN v8.2 */}
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
                    {warehouses.filter(w => w.is_active).map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <StoreIcon sx={{ color: colorTokens.brand, fontSize: 20 }} />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {warehouse.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                              {warehouse.code} {warehouse.location && `| ${warehouse.location}`}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.warehouseId && (
                    <Typography variant="caption" sx={{ color: colorTokens.danger, mt: 0.5 }}>
                      {errors.warehouseId}
                    </Typography>
                  )}
                </FormControl>

                {selectedWarehouse && (
                  <Alert severity="info" sx={{ mt: 2, backgroundColor: `${colorTokens.info}10` }}>
                    Movimiento será registrado en: <strong>{selectedWarehouse.name}</strong> ({selectedWarehouse.code})
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 🎯 TIPOS DE MOVIMIENTO v8.2 */}
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

          {/* 📝 FORMULARIO DE MOVIMIENTO v8.2 */}
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

          {/* 📊 PREVIEW DEL RESULTADO v8.2 */}
          {formData.quantity > 0 && selectedWarehouse && (
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
                      Preview - {selectedWarehouse.name}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Box textAlign="center" sx={{ p: 2 }}>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          Stock Actual
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                          {product.current_stock}
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
                          Stock Final
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
          onClick={handleSave}
          disabled={loading || !isFormValid}
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