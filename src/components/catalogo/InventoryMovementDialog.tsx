// 📁 src/app/dashboard/admin/catalogo/inventario/components/InventoryMovementDialog.tsx
'use client';

import React from 'react';
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
  Paper
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
  Warning as WarningIcon
} from '@mui/icons-material';

// 🎯 IMPORTACIONES CON TIPADO FUERTE CORREGIDO
import { InventoryMovement } from '@/services/catalogService';

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
type AlertSeverity = 'error' | 'warning' | 'info' | 'success';

interface MovementConfig {
  label: string;
  icon: React.ReactElement;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

interface StockStatus {
  status: AlertSeverity;
  message: string;
  icon: React.ReactElement;
}

// 🎯 CONFIGURACIÓN DE TIPOS DE MOVIMIENTO CON TIPADO FUERTE
const MOVEMENT_CONFIG: Record<MovementType, MovementConfig> = {
  entrada: {
    label: 'Entrada de Stock',
    icon: <EntradaIcon />,
    color: darkProTokens.success,
    bgColor: `${darkProTokens.success}10`,
    borderColor: `${darkProTokens.success}30`,
    description: 'Incremento de inventario'
  },
  salida: {
    label: 'Salida de Stock',
    icon: <SalidaIcon />,
    color: darkProTokens.error,
    bgColor: `${darkProTokens.error}10`,
    borderColor: `${darkProTokens.error}30`,
    description: 'Reducción de inventario'
  },
  ajuste: {
    label: 'Ajuste de Inventario',
    icon: <AjusteIcon />,
    color: darkProTokens.warning,
    bgColor: `${darkProTokens.warning}10`,
    borderColor: `${darkProTokens.warning}30`,
    description: 'Corrección de stock'
  },
  transferencia: {
    label: 'Transferencia',
    icon: <TransferenciaIcon />,
    color: darkProTokens.info,
    bgColor: `${darkProTokens.info}10`,
    borderColor: `${darkProTokens.info}30`,
    description: 'Movimiento entre ubicaciones'
  }
} as const;

// ✅ INTERFACE MEJORADA CON TIPADO FUERTE
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

  // ✅ EARLY RETURN CON VALIDACIÓN DE TIPO
  if (!movement) return null;

  // 🎯 OBTENER CONFIGURACIÓN DEL MOVIMIENTO CON TIPADO SEGURO
  const config: MovementConfig = MOVEMENT_CONFIG[movement.movement_type] || MOVEMENT_CONFIG.entrada;

  // 🎯 FUNCIONES UTILITARIAS CON VALIDACIONES DE UNDEFINED
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // ✅ FUNCIÓN CON VALIDACIÓN DE UNDEFINED
  const getStockDifference = (): number => {
    // Validar que ambos valores existan y sean números
    const newStock = movement.new_stock ?? 0;
    const previousStock = movement.previous_stock ?? 0;
    return newStock - previousStock;
  };

  const getDifferenceColor = (): string => {
    const diff = getStockDifference();
    if (diff > 0) return darkProTokens.success;
    if (diff < 0) return darkProTokens.error;
    return darkProTokens.textSecondary;
  };

  const getTotalCost = (): number => {
    return Math.abs(movement.quantity) * (movement.unit_cost || 0);
  };

  // ✅ FUNCIÓN CON VALIDACIONES COMPLETAS
  const getStockStatus = (): StockStatus | null => {
    const product = movement.products;
    if (!product) return null;

    const newStock = movement.new_stock ?? 0;

    if (newStock === 0) {
      return { 
        status: 'error', 
        message: 'Stock agotado', 
        icon: <WarningIcon /> 
      };
    }
    
    if (newStock <= product.min_stock) {
      return { 
        status: 'warning', 
        message: 'Stock por debajo del mínimo', 
        icon: <WarningIcon /> 
      };
    }
    
    if (product.max_stock && newStock > product.max_stock) {
      return { 
        status: 'info', 
        message: 'Stock por encima del máximo', 
        icon: <InfoIcon /> 
      };
    }
    
    return { 
      status: 'success', 
      message: 'Stock en nivel normal', 
      icon: <SuccessIcon /> 
    };
  };

  // ✅ VALORES SEGUROS CON DEFAULTS
  const safeValues = {
    newStock: movement.new_stock ?? 0,
    previousStock: movement.previous_stock ?? 0,
    createdAt: movement.created_at || new Date().toISOString(),
    createdBy: movement.created_by || 'Sistema',
    referenceId: movement.reference_id || null
  };

  const stockStatus = getStockStatus();

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
        background: `linear-gradient(135deg, ${config.bgColor}, ${config.borderColor})`,
        borderBottom: `1px solid ${config.borderColor}`,
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
          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
            Movimiento #{movement.id} • {formatDate(safeValues.createdAt)}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* 📦 INFORMACIÓN DEL PRODUCTO */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `${darkProTokens.surfaceLevel1}`, 
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: darkProTokens.textPrimary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <ProductIcon sx={{ color: darkProTokens.primary }} />
                  Información del Producto
                </Typography>
                
                <Box display="flex" alignItems="center" gap={3}>
                  <Avatar sx={{ 
                    backgroundColor: `${darkProTokens.primary}20`,
                    color: darkProTokens.primary,
                    width: 64,
                    height: 64,
                    fontSize: '1.5rem',
                    fontWeight: 'bold'
                  }}>
                    {movement.products?.name?.charAt(0) || 'P'}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                      {movement.products?.name || 'Producto no encontrado'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      SKU: {movement.products?.sku || 'Sin SKU'} | 
                      Categoría: {movement.products?.category || 'Sin categoría'}
                    </Typography>
                    <Box display="flex" gap={1} mt={1}>
                      <Chip 
                        label={`${movement.products?.current_stock || 0} ${movement.products?.unit || 'piezas'} disponibles`}
                        size="small"
                        sx={{
                          backgroundColor: `${darkProTokens.info}20`,
                          color: darkProTokens.info,
                          border: `1px solid ${darkProTokens.info}30`
                        }}
                      />
                      {movement.products?.location && (
                        <Chip 
                          label={`Ubicación: ${movement.products.location}`}
                          size="small"
                          sx={{
                            backgroundColor: `${darkProTokens.textSecondary}20`,
                            color: darkProTokens.textSecondary,
                            border: `1px solid ${darkProTokens.textSecondary}30`
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 📊 DETALLES DEL MOVIMIENTO */}
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
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        Cantidad
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: config.color }}>
                        {movement.movement_type === 'ajuste' ? 
                          `${getStockDifference() > 0 ? '+' : ''}${getStockDifference()}` :
                          `${movement.movement_type === 'entrada' ? '+' : '-'}${Math.abs(movement.quantity)}`
                        }
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        {movement.products?.unit || 'unidades'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        Costo Unitario
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                        {formatPrice(movement.unit_cost || 0)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        por {movement.products?.unit || 'unidad'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ backgroundColor: `${config.color}30`, my: 1 }} />
                    <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 1 }}>
                      <MoneyIcon sx={{ color: config.color, mr: 1 }} />
                      <Typography variant="h6" fontWeight="bold" sx={{ color: config.color }}>
                        Costo Total: {formatPrice(getTotalCost())}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ 
                      p: 2, 
                      background: `${darkProTokens.textSecondary}10`,
                      borderRadius: 2,
                      border: `1px solid ${darkProTokens.textSecondary}30`
                    }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 1 }}>
                        Razón del Movimiento:
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        {movement.reason || 'Sin razón especificada'}
                      </Typography>
                    </Box>
                  </Grid>

                  {movement.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ 
                        p: 2, 
                        background: `${darkProTokens.info}10`,
                        borderRadius: 2,
                        border: `1px solid ${darkProTokens.info}30`
                      }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ 
                          color: darkProTokens.info, 
                          mb: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <NotesIcon />
                          Notas Adicionales:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          {movement.notes}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 📈 CAMBIO DE STOCK CON VALIDACIONES */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ 
              background: `${darkProTokens.surfaceLevel1}`, 
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: darkProTokens.textPrimary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <HistoryIcon sx={{ color: darkProTokens.primary }} />
                  Cambio de Stock
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box textAlign="center" sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                      Stock Anterior
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                      {safeValues.previousStock}
                    </Typography>
                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
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
                      {getStockDifference() > 0 ? <EntradaIcon /> : 
                       getStockDifference() < 0 ? <SalidaIcon /> : 
                       <AjusteIcon />}
                    </Box>
                  </Box>

                  <Box textAlign="center" sx={{ p: 2 }}>
                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                      Stock Nuevo
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: getDifferenceColor() }}>
                      {safeValues.newStock}
                    </Typography>
                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                      {movement.products?.unit || 'unidades'}
                    </Typography>
                  </Box>

                  <Divider sx={{ backgroundColor: `${darkProTokens.grayDark}60` }} />

                  <Box textAlign="center" sx={{ p: 1 }}>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: getDifferenceColor() }}>
                      Diferencia: {getStockDifference() > 0 ? '+' : ''}{getStockDifference()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* ⚠️ ALERTA DE ESTADO DEL STOCK */}
          {stockStatus && (
            <Grid size={{ xs: 12 }}>
              <Alert 
                severity={stockStatus.status}
                icon={stockStatus.icon}
                sx={{
                  background: stockStatus.status === 'error' ? `${darkProTokens.error}20` :
                             stockStatus.status === 'warning' ? `${darkProTokens.warning}20` :
                             stockStatus.status === 'info' ? `${darkProTokens.info}20` :
                             `${darkProTokens.success}20`,
                  border: `1px solid ${
                    stockStatus.status === 'error' ? darkProTokens.error :
                    stockStatus.status === 'warning' ? darkProTokens.warning :
                    stockStatus.status === 'info' ? darkProTokens.info :
                    darkProTokens.success
                  }30`,
                  color: darkProTokens.textPrimary,
                  '& .MuiAlert-icon': {
                    color: stockStatus.status === 'error' ? darkProTokens.error :
                           stockStatus.status === 'warning' ? darkProTokens.warning :
                           stockStatus.status === 'info' ? darkProTokens.info :
                           darkProTokens.success
                  }
                }}
              >
                <Typography variant="body2" fontWeight="bold">
                  Estado del Stock: {stockStatus.message}
                </Typography>
                {movement.products && (
                  <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                    Stock mínimo: {movement.products.min_stock} | 
                    Stock máximo: {movement.products.max_stock || 'No definido'}
                  </Typography>
                )}
              </Alert>
            </Grid>
          )}

          {/* 👤 INFORMACIÓN DE AUDITORÍA CON VALIDACIONES */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `${darkProTokens.surfaceLevel1}`, 
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: darkProTokens.textPrimary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <PersonIcon sx={{ color: darkProTokens.primary }} />
                  Información de Auditoría
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                          ID del Movimiento:
                        </TableCell>
                        <TableCell sx={{ color: darkProTokens.textPrimary, border: 'none' }}>
                          #{movement.id}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                          Usuario:
                        </TableCell>
                        <TableCell sx={{ color: darkProTokens.textPrimary, border: 'none' }}>
                          {safeValues.createdBy}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                          Fecha y Hora:
                        </TableCell>
                        <TableCell sx={{ color: darkProTokens.textPrimary, border: 'none' }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <TimeIcon sx={{ color: darkProTokens.info, fontSize: 16 }} />
                            {formatDate(safeValues.createdAt)}
                          </Box>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                          Tipo de Operación:
                        </TableCell>
                        <TableCell sx={{ color: darkProTokens.textPrimary, border: 'none' }}>
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
                      {/* ✅ CAMPO REFERENCE_ID CON VALIDACIÓN */}
                      {safeValues.referenceId && (
                        <TableRow>
                          <TableCell sx={{ color: darkProTokens.textSecondary, fontWeight: 'bold', border: 'none' }}>
                            Referencia:
                          </TableCell>
                          <TableCell sx={{ color: darkProTokens.textPrimary, border: 'none' }}>
                            {safeValues.referenceId}
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
        borderTop: `1px solid ${darkProTokens.grayDark}`,
        justifyContent: 'center'
      }}>
        <Button
          onClick={onClose}
          startIcon={<CloseIcon />}
          variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
            color: darkProTokens.background,
            fontWeight: 700,
            px: 4, py: 1.5, borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
            }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}