// src/components/dialogs/EditSaleDialog.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Chip,
  Stack,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

interface EditSaleDialogProps {
  open: boolean;
  onClose: () => void;
  sale: any;
  onSuccess: () => void;
}

interface EditedSale {
  status: string;
  payment_status: string;
  notes: string;
  receipt_printed: boolean;
  email_sent: boolean;
  discount_amount: number;
  tax_amount: number;
  commission_amount: number;
}

interface EditedItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_price: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

export default function EditSaleDialog({ open, onClose, sale, onSuccess }: EditSaleDialogProps) {
  const [editedSale, setEditedSale] = useState<EditedSale>({
    status: '',
    payment_status: '',
    notes: '',
    receipt_printed: false,
    email_sent: false,
    discount_amount: 0,
    tax_amount: 0,
    commission_amount: 0
  });
  
  const [editedItems, setEditedItems] = useState<EditedItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmChanges, setConfirmChanges] = useState(false);

  const supabase = createBrowserSupabaseClient();

  // ✅ INICIALIZAR DATOS
  useEffect(() => {
    if (sale && open) {
      setEditedSale({
        status: sale.status,
        payment_status: sale.payment_status,
        notes: sale.notes || '',
        receipt_printed: sale.receipt_printed || false,
        email_sent: sale.email_sent || false,
        discount_amount: sale.discount_amount || 0,
        tax_amount: sale.tax_amount || 0,
        commission_amount: sale.commission_amount || 0
      });

      setEditedItems(
        sale.items?.map((item: any) => ({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount || 0,
          tax_amount: item.tax_amount || 0,
          total_price: item.total_price
        })) || []
      );

      setErrors({});
      setConfirmChanges(false);
      setShowAdvanced(false);
    }
  }, [sale, open]);

  // ✅ CALCULAR TOTALES
  const calculateTotals = useCallback(() => {
    const subtotal = editedItems.reduce((sum, item) => {
      if (item.isDeleted) return sum;
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const totalDiscount = editedItems.reduce((sum, item) => {
      if (item.isDeleted) return sum;
      return sum + item.discount_amount;
    }, 0) + editedSale.discount_amount;

    const totalTax = editedItems.reduce((sum, item) => {
      if (item.isDeleted) return sum;
      return sum + item.tax_amount;
    }, 0) + editedSale.tax_amount;

    const total = subtotal - totalDiscount + totalTax;

    return {
      subtotal,
      totalDiscount,
      totalTax,
      total,
      finalTotal: total + editedSale.commission_amount
    };
  }, [editedItems, editedSale]);

  // ✅ ACTUALIZAR ITEM
  const updateItem = (index: number, field: keyof EditedItem, value: any) => {
    setEditedItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value };
        
        // Recalcular total del item
        if (field === 'quantity' || field === 'unit_price' || field === 'discount_amount') {
          const subtotal = updated.quantity * updated.unit_price;
          updated.total_price = subtotal - updated.discount_amount + updated.tax_amount;
        }
        
        return updated;
      }
      return item;
    }));
  };

  // ✅ ELIMINAR ITEM
  const deleteItem = (index: number) => {
    setEditedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, isDeleted: true } : item
    ));
  };

  // ✅ RESTAURAR ITEM
  const restoreItem = (index: number) => {
    setEditedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, isDeleted: false } : item
    ));
  };

  // ✅ VALIDAR CAMBIOS
  const validateChanges = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar que hay al menos un item activo
    const activeItems = editedItems.filter(item => !item.isDeleted);
    if (activeItems.length === 0) {
      newErrors.items = 'Debe haber al menos un producto en la venta';
    }

    // Validar quantities
    activeItems.forEach((item, index) => {
      if (item.quantity <= 0) {
        newErrors[`quantity_${index}`] = 'La cantidad debe ser mayor a 0';
      }
      if (item.unit_price <= 0) {
        newErrors[`price_${index}`] = 'El precio debe ser mayor a 0';
      }
    });

    // Validar estados
    if (!editedSale.status) {
      newErrors.status = 'El estado es requerido';
    }

    if (!editedSale.payment_status) {
      newErrors.payment_status = 'El estado de pago es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ DETECTAR CAMBIOS
  const hasChanges = useCallback(() => {
    if (!sale) return false;

    // Verificar cambios en la venta
    const saleChanged = 
      editedSale.status !== sale.status ||
      editedSale.payment_status !== sale.payment_status ||
      editedSale.notes !== (sale.notes || '') ||
      editedSale.receipt_printed !== sale.receipt_printed ||
      editedSale.email_sent !== sale.email_sent ||
      editedSale.discount_amount !== (sale.discount_amount || 0) ||
      editedSale.tax_amount !== (sale.tax_amount || 0) ||
      editedSale.commission_amount !== (sale.commission_amount || 0);

    // Verificar cambios en items
    const itemsChanged = editedItems.some((item, index) => {
      const originalItem = sale.items?.[index];
      if (!originalItem && !item.isNew) return false;
      if (item.isDeleted || item.isNew) return true;
      
      return (
        item.quantity !== originalItem.quantity ||
        item.unit_price !== originalItem.unit_price ||
        item.discount_amount !== (originalItem.discount_amount || 0) ||
        item.tax_amount !== (originalItem.tax_amount || 0)
      );
    });

    return saleChanged || itemsChanged;
  }, [editedSale, editedItems, sale]);

  // ✅ GUARDAR CAMBIOS
  const handleSave = async () => {
    if (!validateChanges()) return;
    if (!hasChanges()) {
      showNotification('No hay cambios para guardar', 'info');
      return;
    }

    if (!confirmChanges) {
      setConfirmChanges(true);
      return;
    }

    setProcessing(true);
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      const totals = calculateTotals();

      // ✅ ACTUALIZAR VENTA PRINCIPAL
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          status: editedSale.status,
          payment_status: editedSale.payment_status,
          notes: editedSale.notes.trim() || null,
          receipt_printed: editedSale.receipt_printed,
          email_sent: editedSale.email_sent,
          subtotal: totals.subtotal,
          discount_amount: editedSale.discount_amount,
          tax_amount: editedSale.tax_amount,
          commission_amount: editedSale.commission_amount,
          total_amount: totals.total,
          paid_amount: totals.finalTotal,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', sale.id);

      if (saleError) throw saleError;

      // ✅ ACTUALIZAR ITEMS
      for (const [index, item] of editedItems.entries()) {
        if (item.isDeleted && !item.isNew) {
          // Eliminar item existente
          const { error } = await supabase
            .from('sale_items')
            .delete()
            .eq('id', item.id);
          
          if (error) throw error;
        } else if (item.isNew && !item.isDeleted) {
          // Crear nuevo item
          const { error } = await supabase
            .from('sale_items')
            .insert([{
              sale_id: sale.id,
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              discount_amount: item.discount_amount,
              tax_amount: item.tax_amount,
              created_at: new Date().toISOString()
            }]);
          
          if (error) throw error;
        } else if (!item.isDeleted && !item.isNew) {
          // Actualizar item existente
          const { error } = await supabase
            .from('sale_items')
            .update({
              product_name: item.product_name,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
              discount_amount: item.discount_amount,
              tax_amount: item.tax_amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          
          if (error) throw error;
        }
      }

      // ✅ REGISTRAR HISTORIAL DE CAMBIOS
      await supabase
        .from('sale_edit_history')
        .insert([{
          sale_id: sale.id,
          edited_by: userId,
          changes_summary: `Venta editada: ${hasChanges() ? 'Items y totales actualizados' : 'Solo metadatos'}`,
          previous_total: sale.total_amount,
          new_total: totals.total,
          edit_reason: 'Manual edit from admin panel',
          created_at: new Date().toISOString()
        }]);

      showNotification('Venta actualizada exitosamente', 'success');
      onSuccess();
    } catch (error) {
      console.error('Error updating sale:', error);
      showNotification('Error al actualizar la venta', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (!sale) return null;

  const totals = calculateTotals();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #ff9800, #f57c00)',
        color: '#FFFFFF'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EditIcon />
          <Typography variant="h6" fontWeight="bold">
            ✏️ Editar Venta #{sale.sale_number}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Alertas */}
        {hasChanges() && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              ⚠️ Hay cambios sin guardar. Los cambios afectarán los totales y el inventario.
            </Typography>
          </Alert>
        )}

        {confirmChanges && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="600">
              🔴 CONFIRMACIÓN REQUERIDA: ¿Está seguro de guardar estos cambios? Esta acción es irreversible.
            </Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Estados y metadatos */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontWeight: 700 }}>
                  📋 Estados y Información
                </Typography>

                <Grid container spacing={2}>
                <Grid size={6}> 
                    <FormControl fullWidth>
                      <InputLabel>Estado de Venta</InputLabel>
                      <Select
                        value={editedSale.status}
                        onChange={(e) => setEditedSale(prev => ({ ...prev, status: e.target.value }))}
                        error={!!errors.status}
                      >
                        <MenuItem value="pending">Pendiente</MenuItem>
                        <MenuItem value="completed">Completada</MenuItem>
                        <MenuItem value="cancelled">Cancelada</MenuItem>
                        <MenuItem value="refunded">Devuelta</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={6}> 
                    <FormControl fullWidth>
                      <InputLabel>Estado de Pago</InputLabel>
                      <Select
                        value={editedSale.payment_status}
                        onChange={(e) => setEditedSale(prev => ({ ...prev, payment_status: e.target.value }))}
                        error={!!errors.payment_status}
                      >
                        <MenuItem value="pending">Pendiente</MenuItem>
                        <MenuItem value="partial">Parcial</MenuItem>
                        <MenuItem value="paid">Pagado</MenuItem>
                        <MenuItem value="refunded">Devuelto</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={12}> 
                    <TextField
                      fullWidth
                      label="Notas"
                      multiline
                      rows={3}
                      value={editedSale.notes}
                      onChange={(e) => setEditedSale(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notas adicionales sobre la venta..."
                    />
                  </Grid>

                  <Grid size={6}> 
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editedSale.receipt_printed}
                          onChange={(e) => setEditedSale(prev => ({ ...prev, receipt_printed: e.target.checked }))}
                        />
                      }
                      label="Ticket Impreso"
                    />
                  </Grid>

                  <Grid size={6}> 
                    <FormControlLabel
                      control={
                        <Switch
                          checked={editedSale.email_sent}
                          onChange={(e) => setEditedSale(prev => ({ ...prev, email_sent: e.target.checked }))}
                        />
                      }
                      label="Email Enviado"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Opciones avanzadas */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 700 }}>
                    ⚙️ Opciones Avanzadas
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    variant="outlined"
                  >
                    {showAdvanced ? 'Ocultar' : 'Mostrar'}
                  </Button>
                </Box>

                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <Grid container spacing={2}>
                    <Grid size={12}> 
                        <TextField
                          fullWidth
                          label="Descuento Adicional"
                          type="number"
                          value={editedSale.discount_amount}
                          onChange={(e) => setEditedSale(prev => ({ 
                            ...prev, 
                            discount_amount: parseFloat(e.target.value) || 0 
                          }))}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>

                      <Grid size={12}> 
                        <TextField
                          fullWidth
                          label="Impuestos Adicionales"
                          type="number"
                          value={editedSale.tax_amount}
                          onChange={(e) => setEditedSale(prev => ({ 
                            ...prev, 
                            tax_amount: parseFloat(e.target.value) || 0 
                          }))}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>

                      <Grid size={12}> 
                        <TextField
                          fullWidth
                          label="Comisión Manual"
                          type="number"
                          value={editedSale.commission_amount}
                          onChange={(e) => setEditedSale(prev => ({ 
                            ...prev, 
                            commission_amount: parseFloat(e.target.value) || 0 
                          }))}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      </Grid>
                    </Grid>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Productos */}
          <Grid size={12}> 
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontWeight: 700 }}>
                  🛒 Productos de la Venta
                </Typography>

                {errors.items && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.items}
                  </Alert>
                )}

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell align="center">Cantidad</TableCell>
                        <TableCell align="right">Precio Unit.</TableCell>
                        <TableCell align="right">Descuento</TableCell>
                        <TableCell align="right">Impuestos</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editedItems.map((item, index) => (
                        <TableRow 
                          key={item.id || index}
                          sx={{ 
                            opacity: item.isDeleted ? 0.4 : 1,
                            backgroundColor: item.isNew ? 'rgba(76, 175, 80, 0.1)' : 
                              item.isDeleted ? 'rgba(244, 67, 54, 0.1)' : 'inherit'
                          }}
                        >
                          <TableCell>
                            <TextField
                              size="small"
                              value={item.product_name}
                              onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                              disabled={item.isDeleted}
                              sx={{ minWidth: 200 }}
                            />
                            {item.isNew && (
                              <Chip label="Nuevo" size="small" color="success" sx={{ ml: 1 }} />
                            )}
                            {item.isDeleted && (
                              <Chip label="Eliminado" size="small" color="error" sx={{ ml: 1 }} />
                            )}
                          </TableCell>

                          <TableCell align="center">
                            <TextField
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                              disabled={item.isDeleted}
                              error={!!errors[`quantity_${index}`]}
                              sx={{ width: 80 }}
                              inputProps={{ min: 1 }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              disabled={item.isDeleted}
                              error={!!errors[`price_${index}`]}
                              sx={{ width: 100 }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={item.discount_amount}
                              onChange={(e) => updateItem(index, 'discount_amount', parseFloat(e.target.value) || 0)}
                              disabled={item.isDeleted}
                              sx={{ width: 100 }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={item.tax_amount}
                              onChange={(e) => updateItem(index, 'tax_amount', parseFloat(e.target.value) || 0)}
                              disabled={item.isDeleted}
                              sx={{ width: 100 }}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="600">
                              {formatPrice(item.total_price)}
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            {item.isDeleted ? (
                              <IconButton
                                size="small"
                                onClick={() => restoreItem(index)}
                                color="success"
                              >
                                <AddIcon />
                              </IconButton>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={() => deleteItem(index)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Resumen de totales */}
          <Grid size={12}> 
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 152, 0, 0.05))',
              border: '2px solid rgba(255, 152, 0, 0.3)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#ff9800', fontWeight: 700 }}>
                  💰 Resumen de Totales
                </Typography>

                <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 2.4 }}>  
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">Subtotal</Typography>
                      <Typography variant="h6" fontWeight="600">
                        {formatPrice(totals.subtotal)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2.4 }}>  
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">Descuentos</Typography>
                      <Typography variant="h6" fontWeight="600" color="error.main">
                        -{formatPrice(totals.totalDiscount)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2.4 }}>  
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">Impuestos</Typography>
                      <Typography variant="h6" fontWeight="600" color="info.main">
                        {formatPrice(totals.totalTax)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2.4 }}>  
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">Comisiones</Typography>
                      <Typography variant="h6" fontWeight="600" color="warning.main">
                        {formatPrice(editedSale.commission_amount)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2.4 }}>  
                    <Box sx={{ 
                      textAlign: 'center',
                      p: 2,
                      background: 'rgba(255, 152, 0, 0.2)',
                      borderRadius: 2,
                      border: '1px solid rgba(255, 152, 0, 0.5)'
                    }}>
                      <Typography variant="body2" color="textSecondary">TOTAL FINAL</Typography>
                      <Typography variant="h4" fontWeight="800" color="#ff9800">
                        {formatPrice(totals.finalTotal)}
                      </Typography>
                      {totals.finalTotal !== sale.total_amount && (
                        <Typography variant="caption" color="warning.main">
                          (Original: {formatPrice(sale.total_amount)})
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={processing}
          variant="outlined"
          size="large"
        >
          <CancelIcon sx={{ mr: 1 }} />
          Cancelar
        </Button>

        <Button
          onClick={handleSave}
          disabled={processing || !hasChanges()}
          variant="contained"
          size="large"
          color={confirmChanges ? "error" : "warning"}
          startIcon={processing ? <SaveIcon /> : confirmChanges ? <WarningIcon /> : <SaveIcon />}
          sx={{
            background: confirmChanges ? 
              'linear-gradient(135deg, #f44336, #d32f2f)' :
              'linear-gradient(135deg, #ff9800, #f57c00)',
            fontWeight: 'bold',
            px: 4
          }}
        >
          {processing ? 'Guardando...' : 
           confirmChanges ? '🔴 CONFIRMAR CAMBIOS' : 
           'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}