// 📁 src/components/catalogo/InventoryMovementDialog.tsx - CORREGIDO VISTA v8.1
'use client';

import React, { useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  History as HistoryIcon,
  TrendingUp as EntradaIcon,
  TrendingDown as SalidaIcon,
  Build as AjusteIcon,
  SwapHoriz as TransferenciaIcon,
  Person as PersonIcon,
  Schedule as TimeIcon,
  Receipt as ReceiptIcon,
  Inventory as ProductIcon,
  AttachMoney as MoneyIcon,
  Description as NotesIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  LocalShipping as ShippingIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE v8.1 CORREGIDOS
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { 
  formatTimestampForDisplay,
  formatMovementDate 
} from '@/utils/dateUtils';

// ✅ TIPOS ENTERPRISE v8.1 CON CORRECCIONES
type MovementType = 
  | 'venta_directa' | 'venta_apartado' | 'reserva_apartado' | 'cancelar_reserva'
  | 'devolucion' | 'recepcion_compra' | 'ajuste_manual_mas' | 'ajuste_manual_menos'
  | 'transferencia_entrada' | 'transferencia_salida' | 'merma' | 'inventario_inicial';

type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

// ✅ INTERFACE CORREGIDA CON USUARIO EXPANDIDO
interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number;
  total_cost: number;
  reason?: string;
  reference_id?: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  // ✅ RELACIÓN CON PRODUCTS CORREGIDA
  products?: {
    id: string;
    name: string;
    sku?: string;
    category?: string;
    current_stock: number;
    reserved_stock?: number; // ✅ AGREGADO RESERVED_STOCK
    min_stock: number;
    max_stock?: number;
    unit?: string;
    location?: string;
  };
  // ✅ RELACIÓN CON USERS AGREGADA
  Users?: {
    id: string;
    firstName: string;
    lastName?: string;
    email?: string;
  };
}

interface MovementConfig {
  label: string;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  group: 'sale' | 'inventory' | 'transfer' | 'adjustment';
}

interface StockStatus {
  status: AlertSeverity;
  message: string;
  icon: React.ReactElement;
}

// ✅ CONFIGURACIÓN DE TIPOS DE MOVIMIENTO (sin cambios)
const MOVEMENT_CONFIG: Record<MovementType, MovementConfig> = {
  // GRUPO: VENTAS Y APARTADOS
  venta_directa: {
    label: 'Venta Directa',
    icon: <RemoveIcon />,
    color: colorTokens.danger,
    bgColor: `${colorTokens.danger}10`,
    borderColor: `${colorTokens.danger}30`,
    description: 'Salida por venta en punto de venta',
    group: 'sale'
  },
  venta_apartado: {
    label: 'Venta Apartado',
    icon: <RemoveIcon />,
    color: colorTokens.danger,
    bgColor: `${colorTokens.danger}10`,
    borderColor: `${colorTokens.danger}30`,
    description: 'Salida final al completar apartado',
    group: 'sale'
  },
  reserva_apartado: {
    label: 'Reserva Apartado',
    icon: <HistoryIcon />,
    color: colorTokens.warning,
    bgColor: `${colorTokens.warning}10`,
    borderColor: `${colorTokens.warning}30`,
    description: 'Reserva stock para apartado',
    group: 'sale'
  },
  cancelar_reserva: {
    label: 'Cancelar Reserva',
    icon: <HistoryIcon />,
    color: colorTokens.info,
    bgColor: `${colorTokens.info}10`,
    borderColor: `${colorTokens.info}30`,
    description: 'Cancelar reserva de apartado',
    group: 'sale'
  },
  // GRUPO: INVENTARIO
  devolucion: {
    label: 'Devolución Cliente',
    icon: <AddIcon />,
    color: colorTokens.success,
    bgColor: `${colorTokens.success}10`,
    borderColor: `${colorTokens.success}30`,
    description: 'Entrada por devolución de cliente',
    group: 'inventory'
  },
  recepcion_compra: {
    label: 'Recepción Compra',
    icon: <ShippingIcon />,
    color: colorTokens.success,
    bgColor: `${colorTokens.success}10`,
    borderColor: `${colorTokens.success}30`,
    description: 'Entrada por orden de compra',
    group: 'inventory'
  },
  merma: {
    label: 'Merma/Producto Dañado',
    icon: <WarningIcon />,
    color: colorTokens.danger,
    bgColor: `${colorTokens.danger}10`,
    borderColor: `${colorTokens.danger}30`,
    description: 'Salida por producto dañado/vencido',
    group: 'inventory'
  },
  inventario_inicial: {
    label: 'Inventario Inicial',
    icon: <ProductIcon />,
    color: colorTokens.info,
    bgColor: `${colorTokens.info}10`,
    borderColor: `${colorTokens.info}30`,
    description: 'Carga inicial de inventario',
    group: 'inventory'
  },
  // GRUPO: AJUSTES
  ajuste_manual_mas: {
    label: 'Ajuste Manual (+)',
    icon: <AjusteIcon />,
    color: colorTokens.success,
    bgColor: `${colorTokens.success}10`,
    borderColor: `${colorTokens.success}30`,
    description: 'Incremento manual por inventario físico',
    group: 'adjustment'
  },
  ajuste_manual_menos: {
    label: 'Ajuste Manual (-)',
    icon: <AjusteIcon />,
    color: colorTokens.danger,
    bgColor: `${colorTokens.danger}10`,
    borderColor: `${colorTokens.danger}30`,
    description: 'Reducción manual por inventario físico',
    group: 'adjustment'
  },
  // GRUPO: TRANSFERENCIAS
  transferencia_entrada: {
    label: 'Transferencia Entrada',
    icon: <TransferenciaIcon />,
    color: colorTokens.success,
    bgColor: `${colorTokens.success}10`,
    borderColor: `${colorTokens.success}30`,
    description: 'Entrada por transferencia',
    group: 'transfer'
  },
  transferencia_salida: {
    label: 'Transferencia Salida',
    icon: <TransferenciaIcon />,
    color: colorTokens.warning,
    bgColor: `${colorTokens.warning}10`,
    borderColor: `${colorTokens.warning}30`,
    description: 'Salida por transferencia',
    group: 'transfer'
  }
} as const;

interface InventoryMovementDialogProps {
  open: boolean;
  onClose: () => void;
  movement?: InventoryMovement | null;
}

export default function InventoryMovementDialog({
  open,
  onClose,
  movement
}: InventoryMovementDialogProps) {
  // ✅ HOOKS AL INICIO
  const hydrated = useHydrated();

  // ✅ CÁLCULOS MEMOIZADOS CORREGIDOS
  const { config, stockStatus, formattedValues, stockInfo, userInfo } = useMemo(() => {
    if (!movement) return {
      config: MOVEMENT_CONFIG.inventario_inicial,
      stockStatus: null,
      formattedValues: {
        date: 'Sin fecha',
        dateShort: 'Sin fecha',
        totalCost: '$0.00',
        unitCost: '$0.00'
      },
      stockInfo: {
        currentStock: 0,
        reservedStock: 0,
        availableStock: 0
      },
      userInfo: {
        displayName: 'Sistema automático',
        email: null
      }
    };

    const movementConfig = MOVEMENT_CONFIG[movement.movement_type] || MOVEMENT_CONFIG.inventario_inicial;
    
    // ✅ CÁLCULO CORRECTO DE STOCK DISPONIBLE
    const currentStock = movement.products?.current_stock || 0;
    const reservedStock = movement.products?.reserved_stock || 0;
    const availableStock = Math.max(0, currentStock - reservedStock);
    
    const stockInfo = {
      currentStock,
      reservedStock,
      availableStock
    };

    // ✅ INFORMACIÓN DEL USUARIO CORREGIDA
    const userInfo = {
      displayName: movement.Users?.firstName 
        ? `${movement.Users.firstName}${movement.Users.lastName ? ` ${movement.Users.lastName}` : ''}`
        : movement.created_by 
        ? `Usuario ID: ${movement.created_by.substring(0, 8)}...`
        : 'Sistema automático',
      email: movement.Users?.email || null
    };
    
    // ✅ CÁLCULO DE ESTADO DEL STOCK USANDO AVAILABLE_STOCK
    let status: StockStatus | null = null;
    if (movement.products) {
      const newStock = movement.new_stock;
      
      if (availableStock === 0) {
        status = { 
          status: 'error', 
          message: 'Stock agotado - sin disponibles', 
          icon: <WarningIcon /> 
        };
      } else if (availableStock <= movement.products.min_stock) {
        status = { 
          status: 'warning', 
          message: 'Stock disponible por debajo del mínimo', 
          icon: <WarningIcon /> 
        };
      } else if (movement.products.max_stock && currentStock > movement.products.max_stock) {
        status = { 
          status: 'info', 
          message: 'Stock total por encima del máximo', 
          icon: <InfoIcon /> 
        };
      } else {
        status = { 
          status: 'success', 
          message: 'Stock disponible en nivel normal', 
          icon: <SuccessIcon /> 
        };
      }
    }

    // Formateo de valores
    const formatted = {
      date: formatTimestampForDisplay(movement.created_at),
      dateShort: formatMovementDate(movement.created_at),
      totalCost: new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(movement.total_cost || 0),
      unitCost: new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(movement.unit_cost || 0)
    };

    return {
      config: movementConfig,
      stockStatus: status,
      formattedValues: formatted,
      stockInfo,
      userInfo
    };
  }, [movement]);

  // ✅ HELPERS PARA CÁLCULOS (sin cambios)
  const getStockDifference = useCallback((): number => {
    if (!movement) return 0;
    return movement.new_stock - movement.previous_stock;
  }, [movement]);

  const getDifferenceColor = useCallback((): string => {
    const diff = getStockDifference();
    if (diff > 0) return colorTokens.success;
    if (diff < 0) return colorTokens.danger;
    return colorTokens.textSecondary;
  }, [getStockDifference]);

  const getQuantityDisplay = useCallback((): string => {
    if (!movement) return '0';
    
    const diff = getStockDifference();
    
    if (['ajuste_manual_mas', 'ajuste_manual_menos'].includes(movement.movement_type)) {
      return `${diff > 0 ? '+' : ''}${diff}`;
    }
    
    if (['venta_directa', 'venta_apartado', 'merma', 'transferencia_salida'].includes(movement.movement_type)) {
      return `-${Math.abs(movement.quantity)}`;
    }
    
    return `+${Math.abs(movement.quantity)}`;
  }, [movement, getStockDifference]);

  // ✅ SSR SAFETY
  if (!hydrated) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: '300px',
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={50} sx={{ color: colorTokens.brand }} />
            <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
              Cargando Movimiento...
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
              Inicializando auditoría de inventario
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!movement) return null;

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
        background: `linear-gradient(135deg, ${config.bgColor}, ${config.borderColor})`,
        borderBottom: `1px solid ${colorTokens.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Avatar sx={{
          backgroundColor: config.bgColor,
          color: config.color,
          width: 48,
          height: 48
        }}>
          {config.icon}
        </Avatar>
        <Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: config.color }}>
            {config.label}
          </Typography>
          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
            Movimiento #{movement.id.substring(0, 8)}... • {formattedValues.dateShort}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* 📦 INFORMACIÓN DEL PRODUCTO - CORREGIDA */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: colorTokens.surfaceLevel1, 
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.textPrimary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <ProductIcon sx={{ color: colorTokens.brand }} />
                  Información del Producto
                </Typography>
                
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar sx={{ 
                    backgroundColor: `${colorTokens.brand}20`,
                    color: colorTokens.brand,
                    width: 64,
                    height: 64,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    {movement.products?.name?.charAt(0) || 'P'}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                      {movement.products?.name || 'Producto no encontrado'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      SKU: {movement.products?.sku || 'Sin SKU'} | 
                      Categoría: {movement.products?.category || 'Sin categoría'}
                    </Typography>
                    <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                      {/* ✅ CHIPS CORREGIDOS CON STOCK REAL */}
                      <Chip 
                        label={`${stockInfo.availableStock} ${movement.products?.unit || 'u'} disponibles`}
                        size="small"
                        sx={{
                          backgroundColor: stockInfo.availableStock > 0 
                            ? `${colorTokens.success}20` 
                            : `${colorTokens.danger}20`,
                          color: stockInfo.availableStock > 0 
                            ? colorTokens.success 
                            : colorTokens.danger,
                          border: `1px solid ${stockInfo.availableStock > 0 
                            ? colorTokens.success 
                            : colorTokens.danger}30`,
                          fontWeight: 'bold'
                        }}
                      />
                      
                      <Chip 
                        label={`${stockInfo.currentStock} total en stock`}
                        size="small"
                        sx={{
                          backgroundColor: `${colorTokens.info}20`,
                          color: colorTokens.info,
                          border: `1px solid ${colorTokens.info}30`
                        }}
                      />
                      
                      {stockInfo.reservedStock > 0 && (
                        <Chip 
                          label={`${stockInfo.reservedStock} reservados`}
                          size="small"
                          sx={{
                            backgroundColor: `${colorTokens.warning}20`,
                            color: colorTokens.warning,
                            border: `1px solid ${colorTokens.warning}30`
                          }}
                        />
                      )}
                      
                      {movement.products?.location && (
                        <Chip 
                          label={`Ubicación: ${movement.products.location}`}
                          size="small"
                          sx={{
                            backgroundColor: `${colorTokens.textSecondary}20`,
                            color: colorTokens.textSecondary,
                            border: `1px solid ${colorTokens.textSecondary}30`
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 📊 DETALLES DEL MOVIMIENTO - MANTENER IGUAL */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ 
              background: config.bgColor, 
              border: `2px solid ${config.borderColor}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: config.color, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <ReceiptIcon />
                  Detalles del Movimiento
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                        Cantidad
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: config.color }}>
                        {getQuantityDisplay()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                        {movement.products?.unit || 'unidades'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                        Costo Unitario
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                        {formattedValues.unitCost}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                        por {movement.products?.unit || 'unidad'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ backgroundColor: `${config.color}30`, my: 1 }} />
                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 1 }}>
                      <MoneyIcon sx={{ color: config.color, mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: config.color }}>
                        Costo Total: {formattedValues.totalCost}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ 
                      p: 2, 
                      background: `${colorTokens.textSecondary}10`,
                      borderRadius: 2,
                      border: `1px solid ${colorTokens.textSecondary}30`
                    }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mb: 1 }}>
                        Razón del Movimiento:
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        {movement.reason || 'Sin razón especificada'}
                      </Typography>
                    </Box>
                  </Grid>

                  {movement.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ 
                        p: 2, 
                        background: `${colorTokens.info}10`,
                        borderRadius: 2,
                        border: `1px solid ${colorTokens.info}30`
                      }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                          color: colorTokens.info, 
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <NotesIcon />
                          Notas Adicionales:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          {movement.notes}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 📈 CAMBIO DE STOCK - MANTENER IGUAL */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ 
              background: colorTokens.surfaceLevel1, 
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.textPrimary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <HistoryIcon sx={{ color: colorTokens.brand }} />
                  Cambio de Stock
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box textAlign="center" sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                      Stock Anterior
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                      {movement.previous_stock}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                      {movement.products?.unit || 'unidades'}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="center" alignItems="center">
                    <Box sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: getDifferenceColor(),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {getStockDifference() > 0 ? <EntradaIcon sx={{ color: colorTokens.textOnBrand }} /> : 
                       getStockDifference() < 0 ? <SalidaIcon sx={{ color: colorTokens.textOnBrand }} /> : 
                       <AjusteIcon sx={{ color: colorTokens.textOnBrand }} />}
                    </Box>
                  </Box>

                  <Box textAlign="center" sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                      Stock Nuevo
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: getDifferenceColor() }}>
                      {movement.new_stock}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                      {movement.products?.unit || 'unidades'}
                    </Typography>
                  </Box>

                  <Divider sx={{ backgroundColor: `${colorTokens.border}` }} />

                  <Box textAlign="center" sx={{ p: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: getDifferenceColor() }}>
                      Diferencia: {getStockDifference() > 0 ? '+' : ''}{getStockDifference()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ⚠️ ALERTA DE ESTADO DEL STOCK - CORREGIDA */}
          {stockStatus && (
            <Grid size={{ xs: 12 }}>
              <Alert 
                severity={stockStatus.status}
                icon={stockStatus.icon}
                sx={{
                  background: stockStatus.status === 'error' ? `${colorTokens.danger}20` :
                             stockStatus.status === 'warning' ? `${colorTokens.warning}20` :
                             stockStatus.status === 'info' ? `${colorTokens.info}20` :
                             `${colorTokens.success}20`,
                  border: `1px solid ${
                    stockStatus.status === 'error' ? colorTokens.danger :
                    stockStatus.status === 'warning' ? colorTokens.warning :
                    stockStatus.status === 'info' ? colorTokens.info :
                    colorTokens.success
                  }30`,
                  color: colorTokens.textPrimary,
                  '& .MuiAlert-icon': {
                    color: stockStatus.status === 'error' ? colorTokens.danger :
                           stockStatus.status === 'warning' ? colorTokens.warning :
                           stockStatus.status === 'info' ? colorTokens.info :
                           colorTokens.success
                  }
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  {stockStatus.message}
                </Typography>
                <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                  Stock total: {stockInfo.currentStock} | 
                  Disponible: {stockInfo.availableStock} | 
                  Reservado: {stockInfo.reservedStock} |
                  Mínimo: {movement.products?.min_stock || 0}
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* 👤 INFORMACIÓN DE AUDITORÍA - CORREGIDA */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: colorTokens.surfaceLevel1, 
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.textPrimary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <PersonIcon sx={{ color: colorTokens.brand }} />
                  Información de Auditoría
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: colorTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                          ID del Movimiento:
                        </TableCell>
                        <TableCell sx={{ color: colorTokens.textPrimary, border: 'none' }}>
                          #{movement.id.substring(0, 8)}...
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: colorTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                          Usuario:
                        </TableCell>
                        <TableCell sx={{ color: colorTokens.textPrimary, border: 'none' }}>
                          {/* ✅ DISPLAY CORREGIDO DEL USUARIO */}
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {userInfo.displayName}
                            </Typography>
                            {userInfo.email && (
                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                {userInfo.email}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: colorTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                          Fecha y Hora:
                        </TableCell>
                        <TableCell sx={{ color: colorTokens.textPrimary, border: 'none' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TimeIcon sx={{ color: colorTokens.info, fontSize: 16 }} />
                            {formattedValues.date}
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: colorTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                          Tipo de Operación:
                        </TableCell>
                        <TableCell sx={{ color: colorTokens.textPrimary, border: 'none' }}>
                          <Chip
                            icon={config.icon}
                            label={config.label}
                            size="small"
                            sx={{
                              backgroundColor: config.bgColor,
                              color: config.color,
                              border: `1px solid ${config.borderColor}`,
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: colorTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                          Grupo:
                        </TableCell>
                        <TableCell sx={{ color: colorTokens.textPrimary, border: 'none' }}>
                          <Chip
                            label={config.group === 'sale' ? 'Ventas' :
                                  config.group === 'inventory' ? 'Inventario' :
                                  config.group === 'transfer' ? 'Transferencias' :
                                  'Ajustes'}
                            size="small"
                            sx={{
                              backgroundColor: `${colorTokens.textSecondary}20`,
                              color: colorTokens.textSecondary,
                              border: `1px solid ${colorTokens.textSecondary}30`
                            }}
                          />
                        </TableCell>
                      </TableRow>
                      {movement.reference_id && (
                        <TableRow>
                          <TableCell sx={{ color: colorTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                            Referencia:
                          </TableCell>
                          <TableCell sx={{ color: colorTokens.textPrimary, border: 'none' }}>
                            {movement.reference_id}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${colorTokens.border}`,
        justifyContent: 'center'
      }}>
        <Button
          onClick={onClose}
          startIcon={<CloseIcon />}
          variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 4, py: 1.5, borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brandActive})`,
            }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}