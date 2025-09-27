// 📁 src/components/catalogo/ProductStockDialog.tsx - CORREGIDO v8.0
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
  Inventory2 as StockIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE v8.0 CORREGIDOS SEGÚN COMPLETE_IMPLEMENTATION_GUIDE
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useInventoryManagement } from '@/hooks/useInventoryManagement';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';

// ✅ TIPOS ENTERPRISE v8.0 CORREGIDOS SEGÚN BD SCHEMA
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
}

interface FormErrors {
  quantity?: string;
  reason?: string;
}

// ✅ TIPOS DE MOVIMIENTO ENTERPRISE BD REALES v8.0
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

// ✅ RAZONES PREDEFINIDAS ENTERPRISE BD v8.0
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
  // ✅ TODOS LOS HOOKS AL INICIO - ORDEN CONSISTENTE
  const hydrated = useHydrated();
  
  // ✅ HOOKS ENTERPRISE v8.0 CORREGIDOS
  const { adjustInventory, loading: inventoryLoading } = useInventoryManagement();
  const { alert } = useNotifications();

  // ✅ ESTADO DEL FORMULARIO CON TIPADO FUERTE - TODOS LOS ESTADOS JUNTOS
  const [formData, setFormData] = useState<FormData>({
    movementType: 'ajuste_manual_mas',
    quantity: 0,
    reason: '',
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ EFECTOS - DESPUÉS DE TODOS LOS ESTADOS
  useEffect(() => {
    if (product && open) {
      setFormData({
        movementType: 'ajuste_manual_mas',
        quantity: 0,
        reason: '',
        notes: ''
      });
    }
    setErrors({});
  }, [product, open]);

  // ✅ HELPERS MEMOIZADOS PARA PERFORMANCE - CORREGIDO TIPADO DE COLORES
  const { currentConfig, availableReasons, previewStock, previewColor, stockWarnings } = useMemo(() => {
    if (!product) return {
      currentConfig: MOVEMENT_TYPES[0],
      availableReasons: [] as readonly string[],
      previewStock: 0,
      previewColor: colorTokens.textSecondary,
      stockWarnings: [] as string[]
    };

    const config = MOVEMENT_TYPES.find(t => t.value === formData.movementType) || MOVEMENT_TYPES[0];
    const reasons = MOVEMENT_REASONS[formData.movementType] || [];
    
    // Calcular preview del stock
    let newStock = product.current_stock;
    if (config.isPositive) {
      newStock = product.current_stock + formData.quantity;
    } else {
      newStock = product.current_stock - formData.quantity;
    }
    newStock = Math.max(0, newStock);

    // ✅ COLOR DEL PREVIEW CORREGIDO - TIPADO CONSISTENTE
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
      stockWarnings: warnings
    };
  }, [product, formData.movementType, formData.quantity]);

  // ✅ VALIDACIONES ENTERPRISE
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [product, formData, currentConfig]);

  // ✅ HANDLERS MEMOIZADOS
  const handleChange = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // ✅ MANEJO DE GUARDAR CON AUDITORÍA AUTOMÁTICA v8.0
  const handleSave = useCallback(async (): Promise<void> => {
    if (!validateForm() || !product) return;

    setLoading(true);
    try {
      // ✅ USAR adjustInventory CON AUDITORÍA AUTOMÁTICA
      const adjustmentQuantity = currentConfig.isPositive ? formData.quantity : -formData.quantity;
      
      await adjustInventory(
        product.id,
        adjustmentQuantity,
        formData.reason,
        formData.notes
      );

      notify.success(`Stock ajustado exitosamente: ${formData.movementType.replace('_', ' ')}`);
      onSave();
      onClose();
    } catch (error: any) {
      notify.error(`Error al ajustar stock: ${error.message}`);
      console.error('Error al ajustar stock:', error);
    } finally {
      setLoading(false);
    }
  }, [validateForm, product, currentConfig, formData, adjustInventory, onSave, onClose]);

  // ✅ SSR SAFETY CON BRANDING MUSCLEUP v8.0 - DESPUÉS DE TODOS LOS HOOKS
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
              Cargando ajuste de stock...
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  // ✅ EARLY RETURN
  if (!product) return null;

  const isFormValid = formData.quantity > 0 && formData.reason.trim() !== '';

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
        <StockIcon sx={{ color: colorTokens.brand }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Ajustar Stock - {product.name}
          </Typography>
          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
            Stock actual: {product.current_stock} {product.unit || 'unidades'}
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
                    <Box display="flex" gap={2} mt={1}>
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
                      Nivel de Stock
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

          {/* 🎯 TIPOS DE MOVIMIENTO ENTERPRISE BD v8.0 */}
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

          {/* 📝 FORMULARIO DE MOVIMIENTO */}
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

          {/* 📊 PREVIEW DEL RESULTADO */}
          {formData.quantity > 0 && (
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
                      Preview del Resultado
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
          {loading ? 'Procesando...' : 'Aplicar Movimiento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}