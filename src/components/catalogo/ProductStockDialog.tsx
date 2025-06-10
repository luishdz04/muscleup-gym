'use client';

import React, { useState, useEffect } from 'react';
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
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapHoriz as SwapHorizIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Build as BuildIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Product {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  cost_price: number;
  sale_price: number;
  location?: string;
}

interface InventoryMovement {
  id: string;
  movement_type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  unit_cost: number;
  total_cost: number;
  reason: string;
  notes?: string;
  created_at: string;
  created_by?: string;
  Users?: {
    name: string;
    email: string;
  };
}

interface ProductStockDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: () => void;
}

const MOVEMENT_TYPES = [
  { value: 'entrada', label: '📦 Entrada', icon: <TrendingUpIcon />, color: 'success' },
  { value: 'salida', label: '📤 Salida', icon: <TrendingDownIcon />, color: 'error' },
  { value: 'ajuste', label: '🔧 Ajuste', icon: <BuildIcon />, color: 'warning' },
  { value: 'transferencia', label: '🔄 Transferencia', icon: <SwapHorizIcon />, color: 'info' }
];

const ENTRY_REASONS = [
  'Compra a proveedor',
  'Devolución de cliente',
  'Transferencia de sucursal',
  'Ajuste por inventario',
  'Producto promocional',
  'Otro'
];

const EXIT_REASONS = [
  'Venta',
  'Producto dañado',
  'Producto vencido',
  'Transferencia a sucursal',
  'Muestra gratuita',
  'Merma',
  'Otro'
];

const ADJUSTMENT_REASONS = [
  'Corrección de inventario',
  'Conteo físico',
  'Error de captura',
  'Diferencia de sistema',
  'Otro'
];

// Función para formatear precio
const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

// Función para formatear fecha
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Función para mostrar notificaciones
const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
  console.log(`${type.toUpperCase()}: ${message}`);
  if (type === 'error') {
    alert(`❌ ${message}`);
  } else if (type === 'success') {
    alert(`✅ ${message}`);
  } else {
    alert(`ℹ️ ${message}`);
  }
};

export default function ProductStockDialog({ open, onClose, product, onSave }: ProductStockDialogProps) {
  const [movementData, setMovementData] = useState({
    movement_type: 'entrada',
    quantity: 0,
    unit_cost: 0,
    reason: '',
    notes: ''
  });

  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newStock, setNewStock] = useState(0);

  const supabase = createClientComponentClient();

  // Cargar historial de movimientos
  const loadMovementHistory = async () => {
    if (!product?.id) return;

    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          Users (
            name,
            email
          )
        `)
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error loading movement history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Calcular nuevo stock
  const calculateNewStock = (currentStock: number, movementType: string, quantity: number): number => {
    switch (movementType) {
      case 'entrada':
        return currentStock + quantity;
      case 'salida':
        return Math.max(0, currentStock - quantity);
      case 'ajuste':
        return quantity; // En ajuste, la cantidad es el stock final
      case 'transferencia':
        return Math.max(0, currentStock - quantity);
      default:
        return currentStock;
    }
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: any) => {
    const newData = { ...movementData, [field]: value };
    setMovementData(newData);

    // Calcular nuevo stock
    if (field === 'movement_type' || field === 'quantity') {
      const calculatedStock = calculateNewStock(
        product?.current_stock || 0,
        field === 'movement_type' ? value : newData.movement_type,
        field === 'quantity' ? value : newData.quantity
      );
      setNewStock(calculatedStock);
    }

    // Limpiar razón si cambia tipo de movimiento
    if (field === 'movement_type') {
      setMovementData(prev => ({ ...prev, reason: '' }));
    }

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (movementData.quantity <= 0) {
      newErrors.quantity = 'La cantidad debe ser mayor a 0';
    }

    if (movementData.movement_type === 'salida' && movementData.quantity > (product?.current_stock || 0)) {
      newErrors.quantity = 'No hay suficiente stock disponible';
    }

    if (movementData.movement_type === 'ajuste' && movementData.quantity < 0) {
      newErrors.quantity = 'El stock final no puede ser negativo';
    }

    if (!movementData.reason.trim()) {
      newErrors.reason = 'La razón es requerida';
    }

    if ((movementData.movement_type === 'entrada' || movementData.movement_type === 'ajuste') && movementData.unit_cost < 0) {
      newErrors.unit_cost = 'El costo unitario no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Guardar movimiento
  const handleSave = async () => {
    if (!product || !validateForm()) {
      showNotification('Por favor corrige los errores en el formulario', 'error');
      return;
    }

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      // Preparar datos del movimiento
      const movementRecord = {
        product_id: product.id,
        movement_type: movementData.movement_type,
        quantity: movementData.movement_type === 'ajuste' 
          ? movementData.quantity - product.current_stock 
          : movementData.quantity,
        previous_stock: product.current_stock,
        new_stock: newStock,
        unit_cost: movementData.unit_cost || 0,
        total_cost: (movementData.unit_cost || 0) * movementData.quantity,
        reason: movementData.reason,
        notes: movementData.notes,
        created_by: userId
      };

      // Insertar movimiento en base de datos
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([movementRecord]);

      if (movementError) throw movementError;

      // Actualizar stock del producto
      const { error: productError } = await supabase
        .from('products')
        .update({ 
          current_stock: newStock,
          updated_by: userId
        })
        .eq('id', product.id);

      if (productError) throw productError;

      showNotification('Movimiento de inventario registrado correctamente', 'success');
      
      // Resetear formulario
      setMovementData({
        movement_type: 'entrada',
        quantity: 0,
        unit_cost: 0,
        reason: '',
        notes: ''
      });
      setNewStock(0);
      setErrors({});
      
      onSave();
      loadMovementHistory();
    } catch (error) {
      console.error('Error saving movement:', error);
      showNotification('Error al registrar el movimiento', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Inicializar cuando se abre el diálogo
  useEffect(() => {
    if (open && product) {
      setMovementData({
        movement_type: 'entrada',
        quantity: 0,
        unit_cost: product.cost_price || 0,
        reason: '',
        notes: ''
      });
      setNewStock(product.current_stock);
      setErrors({});
      loadMovementHistory();
    }
  }, [open, product]);

  if (!product) return null;

  const availableReasons = () => {
    switch (movementData.movement_type) {
      case 'entrada':
        return ENTRY_REASONS;
      case 'salida':
        return EXIT_REASONS;
      case 'ajuste':
        return ADJUSTMENT_REASONS;
      case 'transferencia':
        return EXIT_REASONS;
      default:
        return [];
    }
  };

  const getMovementTypeConfig = (type: string) => {
    return MOVEMENT_TYPES.find(t => t.value === type) || MOVEMENT_TYPES[0];
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        pb: 2
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <InventoryIcon />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              📦 Gestión de Stock
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {product.name} - SKU: {product.sku}
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
            {/* 📊 Estado Actual del Producto */}
            <Grid size={12}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: 2
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon color="primary" />
                    Estado Actual del Inventario
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box textAlign="center" sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Stock Actual
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {product.current_stock}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.unit}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box textAlign="center" sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Stock Mínimo
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="warning.main">
                          {product.min_stock}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.unit}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box textAlign="center" sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Stock Máximo
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="info.main">
                          {product.max_stock}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.unit}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box textAlign="center" sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Valor Total
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="success.main">
                          {formatPrice(product.current_stock * product.cost_price)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Costo: {formatPrice(product.cost_price)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Alerta de stock bajo */}
                  {product.current_stock <= product.min_stock && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      ⚠️ Este producto tiene stock bajo. Se recomienda reabastecer pronto.
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* 📝 Nuevo Movimiento */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%)',
                border: '1px solid rgba(240, 147, 251, 0.2)',
                borderRadius: 2,
                height: 'fit-content'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon color="primary" />
                    Registrar Movimiento
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid size={12}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo de Movimiento</InputLabel>
                        <Select
                          value={movementData.movement_type}
                          label="Tipo de Movimiento"
                          onChange={(e) => handleInputChange('movement_type', e.target.value)}
                        >
                          {MOVEMENT_TYPES.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              <Box display="flex" alignItems="center" gap={1}>
                                {type.icon}
                                {type.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={movementData.movement_type === 'ajuste' ? 'Stock Final' : 'Cantidad'}
                        type="number"
                        value={movementData.quantity}
                        onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                        error={!!errors.quantity}
                        helperText={errors.quantity}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">{product.unit}</InputAdornment>,
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Costo Unitario"
                        type="number"
                        value={movementData.unit_cost}
                        onChange={(e) => handleInputChange('unit_cost', parseFloat(e.target.value) || 0)}
                        error={!!errors.unit_cost}
                        helperText={errors.unit_cost}
                        disabled={movementData.movement_type === 'salida'}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>

                    <Grid size={12}>
                      <FormControl fullWidth error={!!errors.reason}>
                        <InputLabel>Razón del Movimiento</InputLabel>
                        <Select
                          value={movementData.reason}
                          label="Razón del Movimiento"
                          onChange={(e) => handleInputChange('reason', e.target.value)}
                        >
                          {availableReasons().map((reason) => (
                            <MenuItem key={reason} value={reason}>
                              {reason}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.reason && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                            {errors.reason}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    <Grid size={12}>
                      <TextField
                        fullWidth
                        label="Notas Adicionales"
                        value={movementData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        multiline
                        rows={2}
                        placeholder="Información adicional sobre este movimiento..."
                      />
                    </Grid>

                    {/* Vista previa del cambio */}
                    <Grid size={12}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        background: 'rgba(102, 126, 234, 0.1)',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                      }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Vista Previa del Cambio:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={`${product.current_stock} ${product.unit}`} 
                            size="small" 
                            color="default"
                          />
                          <Box sx={{ mx: 1 }}>→</Box>
                          <Chip 
                            label={`${newStock} ${product.unit}`} 
                            size="small" 
                            color={newStock > product.current_stock ? 'success' : newStock < product.current_stock ? 'error' : 'default'}
                          />
                        </Box>
                        {movementData.unit_cost > 0 && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Costo Total: {formatPrice(movementData.unit_cost * movementData.quantity)}
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    <Grid size={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={loading || movementData.quantity <= 0}
                        sx={{
                          background: 'linear-gradient(45deg, #FFCC00 30%, #FFD700 90%)',
                          color: '#000',
                          fontWeight: 'bold',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #FFD700 30%, #FFCC00 90%)',
                          },
                          '&:disabled': {
                            background: 'grey.300',
                          }
                        }}
                      >
                        {loading ? 'Registrando...' : 'Registrar Movimiento'}
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* 📜 Historial de Movimientos */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, rgba(168, 237, 234, 0.1) 0%, rgba(254, 214, 227, 0.1) 100%)',
                border: '1px solid rgba(168, 237, 234, 0.2)',
                borderRadius: 2
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon color="primary" />
                    Historial Reciente
                  </Typography>

                  {loadingHistory ? (
                    <Typography>Cargando historial...</Typography>
                  ) : movements.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                      No hay movimientos registrados
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Tipo</TableCell>
                            <TableCell align="right">Cantidad</TableCell>
                            <TableCell align="right">Stock</TableCell>
                            <TableCell>Fecha</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {movements.map((movement) => {
                            const typeConfig = getMovementTypeConfig(movement.movement_type);
                            return (
                              <TableRow key={movement.id}>
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    {typeConfig.icon}
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold">
                                        {typeConfig.label}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {movement.reason}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography 
                                    variant="body2" 
                                    color={movement.quantity > 0 ? 'success.main' : 'error.main'}
                                    fontWeight="bold"
                                  >
                                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2">
                                    {movement.previous_stock} → {movement.new_stock}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption">
                                    {formatDate(movement.created_at)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}