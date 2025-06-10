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
  Chip,
  IconButton,
  Card,
  CardContent,
  Grid as Grid,
  Divider,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapHoriz as SwapHorizIcon,
  Build as BuildIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number;
  total_cost: number;
  reason: string;
  notes?: string;
  created_at: string;
  products: {
    name: string;
    sku: string;
    unit: string;
    category: string;
    location?: string;
  };
  Users?: {
    name: string;
    email: string;
  };
}

interface InventoryMovementDialogProps {
  open: boolean;
  onClose: () => void;
  movement?: InventoryMovement | null;
}

const MOVEMENT_TYPES = [
  { 
    value: 'entrada', 
    label: '📦 Entrada', 
    icon: <TrendingUpIcon />, 
    color: 'success',
    description: 'Incremento de stock por compra, devolución o transferencia entrante'
  },
  { 
    value: 'salida', 
    label: '📤 Salida', 
    icon: <TrendingDownIcon />, 
    color: 'error',
    description: 'Reducción de stock por venta, merma o transferencia saliente'
  },
  { 
    value: 'ajuste', 
    label: '🔧 Ajuste', 
    icon: <BuildIcon />, 
    color: 'warning',
    description: 'Corrección de inventario por conteo físico o error de sistema'
  },
  { 
    value: 'transferencia', 
    label: '🔄 Transferencia', 
    icon: <SwapHorizIcon />, 
    color: 'info',
    description: 'Movimiento entre ubicaciones o sucursales'
  }
];

// Función para formatear precio
const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

// Función para formatear fecha completa
const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Función para formatear fecha corta
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Función para formatear hora
const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export default function InventoryMovementDialog({ open, onClose, movement }: InventoryMovementDialogProps) {
  if (!movement) return null;

  const typeConfig = MOVEMENT_TYPES.find(t => t.value === movement.movement_type) || MOVEMENT_TYPES[0];
  
  // Calcular diferencia de stock
  const stockDifference = movement.new_stock - movement.previous_stock;
  const isPositiveMovement = stockDifference > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: `linear-gradient(135deg, ${typeConfig.color === 'success' ? '#4caf50' : 
                                                   typeConfig.color === 'error' ? '#f44336' :
                                                   typeConfig.color === 'warning' ? '#ff9800' : '#2196f3'} 0%, 
                                                   ${typeConfig.color === 'success' ? '#388e3c' : 
                                                     typeConfig.color === 'error' ? '#d32f2f' :
                                                     typeConfig.color === 'warning' ? '#f57c00' : '#1976d2'} 100%)`,
        color: 'white',
        pb: 2
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          {typeConfig.icon}
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {typeConfig.label}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Movimiento #{movement.id.slice(-8).toUpperCase()}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* 🛍️ Información del Producto */}
            <Grid size={12}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: 2
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon color="primary" />
                    Información del Producto
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ 
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          width: 56,
                          height: 56,
                          fontSize: '1.5rem',
                          fontWeight: 'bold'
                        }}>
                          {movement.products.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {movement.products.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            SKU: {movement.products.sku}
                          </Typography>
                          <Chip 
                            label={movement.products.category} 
                            size="small" 
                            color="primary" 
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, md: 4 }}>
                      {movement.products.location && (
                        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {movement.products.location}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Unidad: {movement.products.unit}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 📊 Detalles del Movimiento */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${typeConfig.color === 'success' ? 'rgba(76, 175, 80, 0.1)' : 
                                                       typeConfig.color === 'error' ? 'rgba(244, 67, 54, 0.1)' :
                                                       typeConfig.color === 'warning' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(33, 150, 243, 0.1)'} 0%, 
                                                       ${typeConfig.color === 'success' ? 'rgba(56, 142, 60, 0.1)' : 
                                                         typeConfig.color === 'error' ? 'rgba(211, 47, 47, 0.1)' :
                                                         typeConfig.color === 'warning' ? 'rgba(245, 124, 0, 0.1)' : 'rgba(25, 118, 210, 0.1)'} 100%)`,
                border: `1px solid ${typeConfig.color === 'success' ? 'rgba(76, 175, 80, 0.2)' : 
                                     typeConfig.color === 'error' ? 'rgba(244, 67, 54, 0.2)' :
                                     typeConfig.color === 'warning' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(33, 150, 243, 0.2)'}`,
                borderRadius: 2,
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {typeConfig.icon}
                    Detalles del Movimiento
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      icon={typeConfig.icon}
                      label={typeConfig.label}
                      color={typeConfig.color as any}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {typeConfig.description}
                    </Typography>
                  </Box>

                  <TableContainer component={Paper} sx={{ boxShadow: 'none', backgroundColor: 'transparent' }}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                            Cantidad:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Typography 
                              variant="h6" 
                              fontWeight="bold" 
                              color={isPositiveMovement ? 'success.main' : 'error.main'}
                            >
                              {isPositiveMovement ? '+' : ''}{movement.quantity} {movement.products.unit}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                            Stock Anterior:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Typography variant="body1">
                              {movement.previous_stock} {movement.products.unit}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                            Stock Nuevo:
                          </TableCell>
                          <TableCell sx={{ borderBottom: 'none' }}>
                            <Typography variant="body1" fontWeight="bold">
                              {movement.new_stock} {movement.products.unit}
                            </Typography>
                          </TableCell>
                        </TableRow>
                        
                        {movement.unit_cost > 0 && (
                          <>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                                Costo Unitario:
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Typography variant="body1">
                                  {formatPrice(movement.unit_cost)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                            
                            <TableRow>
                              <TableCell sx={{ fontWeight: 'bold', borderBottom: 'none' }}>
                                Costo Total:
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Typography variant="h6" fontWeight="bold" color="primary">
                                  {formatPrice(movement.total_cost)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* 📅 Información Temporal y Usuario */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(168, 237, 234, 0.1) 0%, rgba(254, 214, 227, 0.1) 100%)',
                border: '1px solid rgba(168, 237, 234, 0.2)',
                borderRadius: 2,
                height: '100%'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon color="primary" />
                    Información del Registro
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      📅 Fecha y Hora:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formatDateTime(movement.created_at)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      👤 Registrado por:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {movement.Users?.name || 'Sistema'}
                        </Typography>
                        {movement.Users?.email && (
                          <Typography variant="body2" color="text.secondary">
                            {movement.Users.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    background: 'rgba(102, 126, 234, 0.1)',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      🔍 ID del Movimiento:
                    </Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {movement.id}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* 📝 Razón y Notas */}
            <Grid size={12}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(255, 236, 210, 0.1) 0%, rgba(252, 182, 159, 0.1) 100%)',
                border: '1px solid rgba(255, 236, 210, 0.2)',
                borderRadius: 2
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIcon color="primary" />
                    Razón y Observaciones
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Razón del Movimiento:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" sx={{ mb: 2 }}>
                        {movement.reason}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Notas Adicionales:
                      </Typography>
                      <Typography variant="body1">
                        {movement.notes || 'Sin notas adicionales'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 📊 Resumen Visual */}
            <Grid size={12}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
                border: '1px solid rgba(255, 193, 7, 0.2)',
                borderRadius: 2
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MoneyIcon color="primary" />
                    Resumen del Impacto
                  </Typography>

                  <Grid container spacing={3} textAlign="center">
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {Math.abs(stockDifference)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Unidades {isPositiveMovement ? 'agregadas' : 'retiradas'}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box sx={{ p: 2 }}>
                        <Typography 
                          variant="h4" 
                          fontWeight="bold" 
                          color={isPositiveMovement ? 'success.main' : 'error.main'}
                        >
                          {isPositiveMovement ? '+' : ''}{((stockDifference / movement.previous_stock) * 100).toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Variación porcentual
                        </Typography>
                      </Box>
                    </Grid>

                    {movement.total_cost > 0 && (
                      <Grid size={{ xs: 12, md: 3 }}>
                        <Box sx={{ p: 2 }}>
                          <Typography variant="h4" fontWeight="bold" color="success.main">
                            {formatPrice(movement.total_cost)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Valor total del movimiento
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    <Grid size={{ xs: 12, md: movement.total_cost > 0 ? 3 : 6 }}>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="h4" fontWeight="bold" color="info.main">
                          {movement.new_stock}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Stock resultante
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="contained" fullWidth>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}