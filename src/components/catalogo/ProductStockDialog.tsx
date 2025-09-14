// 📁 src/app/dashboard/admin/catalogo/inventario/components/ProductStockDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
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

// 🎯 IMPORTACIONES CON TIPADO FUERTE
import { useInventory } from '@/hooks/useCatalog';
import { Product } from '@/services/catalogService'; // ✅ TIPADO FUERTE APLICADO

// 🎨 DARK PRO SYSTEM - TOKENS CENTRALIZADOS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
} as const;

// 🎯 TIPOS MEJORADOS CON TIPADO FUERTE
type MovementType = 'entrada' | 'salida' | 'ajuste' | 'transferencia';
type MovementColor = 'success' | 'error' | 'warning' | 'info';

interface MovementTypeConfig {
  value: MovementType;
  label: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface FormData {
  movementType: MovementType;
  quantity: number;
  reason: string;
  notes: string;
  unitCost: number;
}

interface FormErrors {
  quantity?: string;
  reason?: string;
  unitCost?: string;
}

// 🎯 TIPOS DE MOVIMIENTO CON CONFIGURACIÓN TIPADA
const MOVEMENT_TYPES: MovementTypeConfig[] = [
  {
    value: 'entrada',
    label: 'Entrada de Stock',
    description: 'Aumentar inventario (compras, devoluciones)',
    icon: <EntradaIcon />,
    color: darkProTokens.success,
    bgColor: `${darkProTokens.success}10`,
    borderColor: `${darkProTokens.success}30`
  },
  {
    value: 'salida',
    label: 'Salida de Stock',
    description: 'Reducir inventario (ventas, mermas, daños)',
    icon: <SalidaIcon />,
    color: darkProTokens.error,
    bgColor: `${darkProTokens.error}10`,
    borderColor: `${darkProTokens.error}30`
  },
  {
    value: 'ajuste',
    label: 'Ajuste de Inventario',
    description: 'Corregir diferencias por conteo físico',
    icon: <AjusteIcon />,
    color: darkProTokens.warning,
    bgColor: `${darkProTokens.warning}10`,
    borderColor: `${darkProTokens.warning}30`
  },
  {
    value: 'transferencia',
    label: 'Transferencia',
    description: 'Mover stock entre ubicaciones',
    icon: <TransferenciaIcon />,
    color: darkProTokens.info,
    bgColor: `${darkProTokens.info}10`,
    borderColor: `${darkProTokens.info}30`
  }
] as const;

// 🎯 RAZONES PREDEFINIDAS CON TIPADO FUERTE
const MOVEMENT_REASONS: Record<MovementType, string[]> = {
  entrada: [
    'Compra a proveedor',
    'Devolución de cliente',
    'Producción interna',
    'Transferencia recibida',
    'Ajuste por conteo',
    'Corrección de error',
    'Otro'
  ],
  salida: [
    'Venta',
    'Merma',
    'Producto dañado',
    'Muestra gratis',
    'Uso interno',
    'Transferencia enviada',
    'Vencimiento',
    'Otro'
  ],
  ajuste: [
    'Conteo físico',
    'Diferencia en sistema',
    'Corrección de error',
    'Auditoría',
    'Otro'
  ],
  transferencia: [
    'Cambio de ubicación',
    'Reorganización',
    'Distribución',
    'Otro'
  ]
} as const;

// ✅ INTERFACE MEJORADA CON TIPADO FUERTE
interface ProductStockDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null; // ✅ TIPADO FUERTE APLICADO
  onSave: () => void;
}

export default function ProductStockDialog({
  open,
  onClose,
  product,
  onSave
}: ProductStockDialogProps) {
  
  // 🎯 HOOK PARA AJUSTAR STOCK (USA FUNCIÓN SQL ATÓMICA)
  const { adjustStock } = useInventory();

  // 🎯 ESTADO DEL FORMULARIO CON TIPADO FUERTE
  const [formData, setFormData] = useState<FormData>({
    movementType: 'entrada',
    quantity: 0,
    reason: '',
    notes: '',
    unitCost: 0
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [previewStock, setPreviewStock] = useState<number>(0);

  // 🎯 EFECTOS CON TIPADO MEJORADO
  useEffect(() => {
    if (product && open) {
      setFormData({
        movementType: 'entrada',
        quantity: 0,
        reason: '',
        notes: '',
        unitCost: product.cost_price || 0
      });
      setPreviewStock(product.current_stock);
    }
    setErrors({});
  }, [product, open]);

  // 🎯 CALCULAR PREVIEW DEL STOCK RESULTANTE CON VALIDACIÓN DE TIPOS
  useEffect(() => {
    if (!product) return;

    let newStock = product.current_stock;
    
    switch (formData.movementType) {
      case 'entrada':
        newStock = product.current_stock + formData.quantity;
        break;
      case 'salida':
        newStock = product.current_stock - formData.quantity;
        break;
      case 'ajuste':
        newStock = formData.quantity; // En ajuste, quantity es el stock final
        break;
      case 'transferencia':
        newStock = product.current_stock - formData.quantity;
        break;
    }

    setPreviewStock(Math.max(0, newStock));
  }, [formData.movementType, formData.quantity, product?.current_stock]);

  // 🎯 VALIDACIONES CON TIPADO FUERTE
  const validateForm = (): boolean => {
    if (!product) return false;
    
    const newErrors: FormErrors = {};

    if (formData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (formData.movementType === 'ajuste' && formData.quantity < 0) {
      newErrors.quantity = 'El stock final no puede ser negativo';
    }

    if ((formData.movementType === 'salida' || formData.movementType === 'transferencia') && 
        formData.quantity > product.current_stock) {
      newErrors.quantity = `No hay suficiente stock. Stock actual: ${product.current_stock}`;
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'La razón del movimiento es obligatoria';
    }

    if (formData.unitCost < 0) {
      newErrors.unitCost = 'El costo unitario no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🎯 MANEJAR CAMBIOS EN EL FORMULARIO CON TIPADO
  const handleChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // 🎯 MANEJAR GUARDAR CON VALIDACIÓN DE TIPOS
  const handleSave = async (): Promise<void> => {
    if (!validateForm() || !product) return;

    setLoading(true);
    try {
      const result = await adjustStock({
        productId: product.id,
        movementType: formData.movementType,
        quantity: formData.quantity,
        reason: formData.reason,
        notes: formData.notes,
        unitCost: formData.unitCost
      });

      if (result.success) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error al ajustar stock:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 HELPERS CON TIPADO FUERTE
  const getMovementConfig = (type: MovementType): MovementTypeConfig => {
    return MOVEMENT_TYPES.find(t => t.value === type) || MOVEMENT_TYPES[0];
  };

  const getAvailableReasons = (): readonly string[] => {
    return MOVEMENT_REASONS[formData.movementType] || [];
  };

  const getPreviewColor = (): string => {
    if (!product) return darkProTokens.textSecondary;
    if (previewStock === 0) return darkProTokens.error;
    if (previewStock <= product.min_stock) return darkProTokens.warning;
    if (product.max_stock && previewStock > product.max_stock) return darkProTokens.info;
    return darkProTokens.success;
  };

  // ✅ EARLY RETURN CON VALIDACIÓN DE TIPO
  if (!product) return null;

  const currentConfig = getMovementConfig(formData.movementType);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.primary}30`,
          borderRadius: 4,
          color: darkProTokens.textPrimary
        }
      }}
    >
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
        borderBottom: `1px solid ${darkProTokens.primary}30`,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <StockIcon sx={{ color: darkProTokens.primary }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Ajustar Stock - {product.name}
          </Typography>
          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
            Stock actual: {product.current_stock} {product.unit}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* 📊 INFORMACIÓN DEL PRODUCTO */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `${darkProTokens.surfaceLevel1}`, 
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ 
                    backgroundColor: `${darkProTokens.primary}20`,
                    color: darkProTokens.primary,
                    width: 56,
                    height: 56,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    {product.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      SKU: {product.sku || 'Sin SKU'} | Categoría: {product.category}
                    </Typography>
                    <Box display="flex" gap={2} mt={1}>
                      <Chip 
                        label={`Stock: ${product.current_stock} ${product.unit}`}
                        sx={{
                          backgroundColor: `${darkProTokens.info}20`,
                          color: darkProTokens.info,
                          border: `1px solid ${darkProTokens.info}30`
                        }}
                        size="small"
                      />
                      <Chip 
                        label={`Min: ${product.min_stock}`}
                        sx={{
                          backgroundColor: `${darkProTokens.warning}20`,
                          color: darkProTokens.warning,
                          border: `1px solid ${darkProTokens.warning}30`
                        }}
                        size="small"
                      />
                      <Chip 
                        label={`Max: ${product.max_stock || 'N/A'}`}
                        sx={{
                          backgroundColor: `${darkProTokens.success}20`,
                          color: darkProTokens.success,
                          border: `1px solid ${darkProTokens.success}30`
                        }}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>

                {/* 📊 BARRA DE PROGRESO DEL STOCK */}
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                      Nivel de Stock
                    </Typography>
                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
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
                      backgroundColor: `${darkProTokens.grayDark}`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: product.current_stock === 0 ? darkProTokens.error :
                                        product.current_stock <= product.min_stock ? darkProTokens.warning :
                                        darkProTokens.success
                      }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 🎯 TIPOS DE MOVIMIENTO */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
              Tipo de Movimiento
            </Typography>
            <Grid container spacing={2}>
              {MOVEMENT_TYPES.map((movement) => (
                <Grid key={movement.value} size={{ xs: 12, sm: 6 }}>
                  <Card
                    sx={{
                      background: formData.movementType === movement.value ? 
                        movement.bgColor : 
                        `${darkProTokens.surfaceLevel1}`,
                      border: formData.movementType === movement.value ? 
                        `2px solid ${movement.color}` : 
                        `1px solid ${darkProTokens.grayDark}`,
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
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                            {movement.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
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
              border: `2px solid ${currentConfig.borderColor}`,
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
                      label={formData.movementType === 'ajuste' ? 'Stock Final' : 'Cantidad'}
                      value={formData.quantity}
                      onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
                      error={!!errors.quantity}
                      helperText={errors.quantity || (
                        formData.movementType === 'ajuste' ? 
                        'Ingresa el stock final deseado' : 
                        `Cantidad a ${formData.movementType === 'entrada' ? 'agregar' : 'reducir'}`
                      )}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Costo Unitario"
                      value={formData.unitCost}
                      onChange={(e) => handleChange('unitCost', parseFloat(e.target.value) || 0)}
                      error={!!errors.unitCost}
                      helperText={errors.unitCost || 'Para calcular el costo total del movimiento'}
                      InputProps={{
                        startAdornment: <Box sx={{ color: darkProTokens.textSecondary, mr: 1 }}>$</Box>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth error={!!errors.reason}>
                      <InputLabel sx={{ 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }}>
                        Razón del Movimiento *
                      </InputLabel>
                      <Select
                        value={formData.reason}
                        label="Razón del Movimiento *"
                        onChange={(e) => handleChange('reason', e.target.value)}
                        sx={{
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: `${darkProTokens.primary}30`
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              background: darkProTokens.surfaceLevel2,
                              border: `1px solid ${darkProTokens.primary}30`,
                              color: darkProTokens.textPrimary
                            }
                          }
                        }}
                      >
                        {getAvailableReasons().map((reason) => (
                          <MenuItem key={reason} value={reason}>
                            {reason}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {errors.reason && (
                      <Typography variant="caption" sx={{ color: darkProTokens.error, mt: 0.5 }}>
                        {errors.reason}
                      </Typography>
                    )}
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
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 📊 PREVIEW DEL RESULTADO */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `${getPreviewColor()}10`, 
              border: `2px solid ${getPreviewColor()}30`,
              borderRadius: 3
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <InfoIcon sx={{ color: getPreviewColor() }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: getPreviewColor() }}>
                    Preview del Resultado
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box textAlign="center" sx={{ p: 2 }}>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        Stock Actual
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                        {product.current_stock}
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        {product.unit}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box textAlign="center" sx={{ p: 2 }}>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        Cambio
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: currentConfig.color }}>
                        {formData.movementType === 'ajuste' ? 
                          (formData.quantity - product.current_stock > 0 ? '+' : '') + (formData.quantity - product.current_stock) :
                          formData.movementType === 'entrada' ? '+' + formData.quantity :
                          '-' + formData.quantity
                        }
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        {product.unit}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Box textAlign="center" sx={{ p: 2 }}>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        Stock Final
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: getPreviewColor() }}>
                        {previewStock}
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        {product.unit}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ backgroundColor: `${getPreviewColor()}30`, my: 1 }} />
                    <Box display="flex" justifyContent="center">
                      <Typography variant="body2" fontWeight="bold" sx={{ color: getPreviewColor() }}>
                        Costo Total del Movimiento: ${(formData.unitCost * formData.quantity).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* 🚨 ALERTAS */}
                {previewStock === 0 && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    ⚠️ El producto quedará sin stock después de este movimiento
                  </Alert>
                )}
                
                {previewStock <= product.min_stock && previewStock > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    ⚠️ El stock quedará por debajo del mínimo establecido ({product.min_stock} {product.unit})
                  </Alert>
                )}

                {product.max_stock && previewStock > product.max_stock && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    ℹ️ El stock excederá el máximo establecido ({product.max_stock} {product.unit})
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
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
        borderTop: `1px solid ${darkProTokens.grayDark}`,
        gap: 2
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          startIcon={<CloseIcon />}
          sx={{ 
            color: darkProTokens.textSecondary,
            borderColor: `${darkProTokens.textSecondary}60`,
            px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || Object.keys(errors).length > 0}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${currentConfig.color}, ${currentConfig.color}CC)`,
            color: darkProTokens.background,
            fontWeight: 700,
            px: 4, py: 1.5, borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${currentConfig.color}CC, ${currentConfig.color}AA)`,
            },
            '&:disabled': {
              background: darkProTokens.primaryDisabled,
              color: darkProTokens.textDisabled
            }
          }}
        >
          {loading ? 'Procesando...' : 'Aplicar Movimiento'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}