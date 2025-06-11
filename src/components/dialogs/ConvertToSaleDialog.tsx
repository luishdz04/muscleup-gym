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
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  ShoppingCart as ConvertIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Receipt as ReceiptIcon,
  Email as EmailIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

interface ConvertToSaleDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any; // ✅ Puede ser null/undefined
  onSuccess: () => void;
}

interface ProductStock {
  id: string;
  name: string;
  current_stock: number;
  required_quantity: number;
  available: boolean;
}

interface LayawayItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function ConvertToSaleDialog({ 
  open, 
  onClose, 
  layaway, 
  onSuccess 
}: ConvertToSaleDialogProps) {
  const [processing, setProcessing] = useState(false);
  const [stockCheck, setStockCheck] = useState<ProductStock[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [layawayItems, setLayawayItems] = useState<LayawayItem[]>([]);
  const [canConvert, setCanConvert] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);

  const supabase = createBrowserSupabaseClient();

  // ✅ CARGAR ITEMS DEL APARTADO CON VALIDACIÓN SEGURA
  const loadLayawayItems = useCallback(async () => {
    // ✅ VALIDACIÓN SEGURA ANTES DE PROCEDER
    if (!layaway?.id || !open) {
      setLayawayItems([]);
      return;
    }

    setLoadingItems(true);
    try {
      console.log('🔍 Cargando items del apartado:', layaway.sale_number, '- 2025-06-11 07:14:51 UTC - luishdz04');

      const { data: items, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', layaway.id);

      if (error) {
        console.error('❌ Error cargando items:', error);
        throw error;
      }

      const safeItems = (items || []).map(item => ({
        ...item,
        // ✅ ASEGURAR VALORES NUMÉRICOS SEGUROS
        quantity: item.quantity || 0,
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0
      }));

      setLayawayItems(safeItems);
      console.log('✅ Items cargados:', safeItems.length);

    } catch (error) {
      console.error('💥 Error cargando items del apartado:', error);
      if (open) { // ✅ Solo mostrar notificación si el dialog está abierto
        showNotification('Error al cargar los productos del apartado', 'error');
      }
      setLayawayItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [layaway?.id, layaway?.sale_number, open, supabase]);

  // ✅ VERIFICAR STOCK DISPONIBLE CON VALIDACIÓN SEGURA
  const checkProductStock = useCallback(async () => {
    if (layawayItems.length === 0 || !open) {
      setStockCheck([]);
      setCanConvert(false);
      return;
    }

    setLoadingStock(true);
    try {
      console.log('🔍 Verificando stock para', layawayItems.length, 'productos... - luishdz04');

      const stockPromises = layawayItems.map(async (item) => {
        const { data: product, error } = await supabase
          .from('products')
          .select('id, name, current_stock')
          .eq('id', item.product_id)
          .single();

        if (error) {
          console.error('❌ Error verificando stock para producto:', item.product_id, error);
          return {
            id: item.product_id || '',
            name: item.product_name || 'Producto desconocido',
            current_stock: 0,
            required_quantity: item.quantity || 0,
            available: false
          };
        }

        return {
          id: product.id || '',
          name: product.name || 'Producto sin nombre',
          current_stock: product.current_stock || 0,
          required_quantity: item.quantity || 0,
          available: (product.current_stock || 0) >= (item.quantity || 0)
        };
      });

      const stockResults = await Promise.all(stockPromises);
      setStockCheck(stockResults);
      
      // ✅ VERIFICAR SI SE PUEDE CONVERTIR CON VALIDACIÓN SEGURA
      const allAvailable = stockResults.every(stock => stock.available);
      const isPaidInFull = (layaway?.pending_amount || 0) <= 0;
      const isLayawayStatus = layaway?.status === 'pending';
      
      const canConvertNow = allAvailable && isPaidInFull && isLayawayStatus;
      setCanConvert(canConvertNow);

      console.log('📊 Verificación de conversión:', {
        stockDisponible: allAvailable,
        pagadoCompleto: isPaidInFull,
        estadoPendiente: isLayawayStatus,
        puedeConvertir: canConvertNow
      });

    } catch (error) {
      console.error('💥 Error verificando stock:', error);
      if (open) {
        showNotification('Error al verificar el inventario', 'error');
      }
      setStockCheck([]);
      setCanConvert(false);
    } finally {
      setLoadingStock(false);
    }
  }, [layawayItems, layaway?.pending_amount, layaway?.status, open, supabase]);

  // ✅ EFECTOS CON VALIDACIÓN SEGURA
  useEffect(() => {
    if (open && layaway?.id) {
      console.log('🔄 Inicializando conversión para apartado:', layaway.sale_number);
      loadLayawayItems();
      setSendEmail(!!(layaway?.customer_email));
    } else {
      // ✅ LIMPIAR ESTADO CUANDO SE CIERRA O NO HAY LAYAWAY
      setLayawayItems([]);
      setStockCheck([]);
      setCanConvert(false);
      setProcessing(false);
    }
  }, [open, layaway?.id, layaway?.sale_number, layaway?.customer_email, loadLayawayItems]);

  useEffect(() => {
    if (layawayItems.length > 0 && open) {
      checkProductStock();
    }
  }, [layawayItems, open, checkProductStock]);

  // ✅ CONVERTIR APARTADO A VENTA CORREGIDO
  const handleConvertToSale = async () => {
    // ✅ VALIDACIONES SEGURAS ANTES DE PROCEDER
    if (!canConvert || layawayItems.length === 0 || !layaway?.id) {
      console.log('❌ No se puede convertir:', { canConvert, itemsLength: layawayItems.length, layawayId: layaway?.id });
      return;
    }

    setProcessing(true);
    try {
      console.log('🔄 Iniciando conversión a venta...', {
        apartado: layaway.sale_number,
        timestamp: '2025-06-11 07:14:51 UTC',
        usuario: 'luishdz04'
      });

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user?.id) {
        throw new Error('Usuario no autenticado');
      }
      const userId = userData.user.id;

      // ✅ ACTUALIZAR APARTADO A VENTA
      const { error: updateError } = await supabase
        .from('sales')
        .update({
          sale_type: 'sale', // ✅ Cambiar de layaway a sale
          status: 'completed',
          payment_status: 'paid',
          completed_at: new Date().toISOString(),
          receipt_printed: printReceipt,
          email_sent: sendEmail,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', layaway.id);

      if (updateError) {
        console.error('❌ Error actualizando apartado:', updateError);
        throw updateError;
      }

      console.log('✅ Apartado actualizado a venta');

      // ✅ REGISTRAR HISTORIAL DE CAMBIO
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: layaway.id,
          previous_status: 'pending',
          new_status: 'completed',
          previous_paid_amount: layaway.paid_amount || 0,
          new_paid_amount: layaway.paid_amount || 0,
          reason: 'Apartado convertido manualmente a venta final - 2025-06-11 07:14:51 UTC por luishdz04',
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      console.log('✅ Historial de conversión registrado');

      // ✅ ACTUALIZAR PUNTOS DEL CLIENTE SI APLICA
      if (layaway.customer_id) {
        try {
          const { data: customer, error: customerError } = await supabase
            .from('Users')
            .select('points_balance, total_purchases, membership_type')
            .eq('id', layaway.customer_id)
            .single();

          if (!customerError && customer?.membership_type) {
            const pointsEarned = Math.floor((layaway.total_amount || 0) / 100);
            
            await supabase
              .from('Users')
              .update({
                points_balance: (customer.points_balance || 0) + pointsEarned,
                total_purchases: (customer.total_purchases || 0) + (layaway.total_amount || 0),
                updated_at: new Date().toISOString()
              })
              .eq('id', layaway.customer_id);

            console.log('✅ Puntos de cliente actualizados:', pointsEarned);
          }
        } catch (customerUpdateError) {
          console.log('⚠️ Error actualizando puntos de cliente (no crítico):', customerUpdateError);
        }
      }

      showNotification('🎉 ¡Apartado convertido a venta exitosamente!', 'success');
      onSuccess();
    } catch (error) {
      console.error('💥 Error convirtiendo apartado:', error);
      showNotification('Error al convertir el apartado: ' + (error as Error).message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ✅ VALIDACIÓN TEMPRANA - EVITA ERRORES DE SSR
  if (!layaway) {
    return null;
  }

  // ✅ VALORES SEGUROS PARA EVITAR ERRORES DE NULL
  const safeLayaway = {
    id: layaway.id || '',
    sale_number: layaway.sale_number || 'Sin número',
    total_amount: layaway.total_amount || 0,
    paid_amount: layaway.paid_amount || 0,
    pending_amount: layaway.pending_amount || 0,
    status: layaway.status || 'pending',
    customer_name: layaway.customer_name || '',
    customer_email: layaway.customer_email || '',
    customer_id: layaway.customer_id || ''
  };

  const hasInsufficientStock = stockCheck.some(stock => !stock.available);
  const hasPendingAmount = safeLayaway.pending_amount > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #2196f3, #1976d2)',
        color: '#FFFFFF'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ConvertIcon />
          <Typography variant="h6" fontWeight="bold">
            🔄 Convertir Apartado a Venta
          </Typography>
          {(loadingItems || loadingStock) && <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />}
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ✅ INDICADOR DE ACTUALIZACIÓN */}
        <Alert severity="info" sx={{ mb: 3 }}>
          🔄 Conversión de apartado - 2025-06-11 07:14:51 UTC - Usuario: luishdz04 - Error SSR corregido
        </Alert>

        {/* Información del apartado CON VALIDACIÓN SEGURA */}
        <Card sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))',
          border: '2px solid rgba(33, 150, 243, 0.3)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: '#2196f3', fontWeight: 700 }}>
              📋 Información del Apartado #{safeLayaway.sale_number}
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Total</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatPrice(safeLayaway.total_amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pagado</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatPrice(safeLayaway.paid_amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pendiente</Typography>
                  <Typography variant="h6" fontWeight="bold" color={hasPendingAmount ? 'error.main' : 'success.main'}>
                    {formatPrice(safeLayaway.pending_amount)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Estado</Typography>
                  <Chip 
                    label={safeLayaway.status}
                    color={safeLayaway.status === 'pending' ? 'warning' : 'success'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Grid>
            </Grid>

            {safeLayaway.customer_name && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(33, 150, 243, 0.2)' }}>
                <Typography variant="body2" color="textSecondary">Cliente:</Typography>
                <Typography variant="body1" fontWeight="600">
                  {safeLayaway.customer_name}
                  {safeLayaway.customer_email && ` • ${safeLayaway.customer_email}`}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Alertas de validación */}
        {hasPendingAmount && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="600">
              ❌ No se puede convertir: Hay un saldo pendiente de {formatPrice(safeLayaway.pending_amount)}
            </Typography>
            <Typography variant="body2">
              El apartado debe estar completamente pagado para poder convertirse a venta.
            </Typography>
          </Alert>
        )}

        {hasInsufficientStock && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="600">
              ⚠️ Stock insuficiente para algunos productos
            </Typography>
            <Typography variant="body2">
              Verifique el inventario antes de proceder con la conversión.
            </Typography>
          </Alert>
        )}

        {canConvert && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="600">
              ✅ Apartado listo para conversión
            </Typography>
            <Typography variant="body2">
              Todos los requisitos se cumplen. El apartado se puede convertir a venta final.
            </Typography>
          </Alert>
        )}

        {/* Verificación de stock */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: '#2196f3', fontWeight: 700 }}>
              📦 Verificación de Inventario ({layawayItems.length} productos)
            </Typography>

            {loadingItems ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  Cargando productos del apartado...
                </Typography>
              </Box>
            ) : loadingStock ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                  Verificando stock disponible...
                </Typography>
              </Box>
            ) : layawayItems.length === 0 ? (
              <Alert severity="warning">
                No se encontraron productos en este apartado
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Requerido</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Disponible</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockCheck.map((stock, index) => (
                      <TableRow 
                        key={stock.id || index}
                        sx={{ 
                          backgroundColor: stock.available ? 'rgba(76, 175, 80, 0.05)' : 'rgba(244, 67, 54, 0.05)'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="500">
                            {stock.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={stock.required_quantity}
                            size="small"
                            color="info"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography 
                            variant="body2" 
                            fontWeight="600"
                            color={stock.current_stock >= stock.required_quantity ? 'success.main' : 'error.main'}
                          >
                            {stock.current_stock}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {stock.available ? (
                            <Chip 
                              icon={<CheckIcon />}
                              label="Disponible" 
                              size="small" 
                              color="success"
                            />
                          ) : (
                            <Chip 
                              icon={<WarningIcon />}
                              label="Insuficiente" 
                              size="small" 
                              color="error"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Impacto de la conversión */}
        {canConvert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
              border: '2px solid rgba(76, 175, 80, 0.3)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  🎯 Impacto de la Conversión
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <InventoryIcon sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        Sin Cambio de Stock
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        El inventario ya se actualizó al crear el apartado
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <MoneyIcon sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        Venta Registrada
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Se completará venta por {formatPrice(safeLayaway.total_amount)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <CheckIcon sx={{ fontSize: 40, color: '#ff9800', mb: 1 }} />
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        Estado Actualizado
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        El apartado cambiará a "Completado"
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {safeLayaway.customer_id && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(76, 175, 80, 0.2)' }}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        💎 <strong>Puntos de Cliente:</strong> Se otorgarán {Math.floor(safeLayaway.total_amount / 100)} puntos al cliente por esta venta.
                      </Typography>
                    </Alert>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Opciones de conversión */}
        {canConvert && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, color: '#2196f3', fontWeight: 700 }}>
                ⚙️ Opciones de Conversión
              </Typography>

              <Grid container spacing={2}>
                <Grid size={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={printReceipt}
                        onChange={(e) => setPrintReceipt(e.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptIcon />
                        Imprimir ticket de venta
                      </Box>
                    }
                  />
                </Grid>

                <Grid size={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        disabled={!safeLayaway.customer_email}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon />
                        Enviar comprobante por email
                      </Box>
                    }
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={onClose} 
          disabled={processing}
          variant="outlined"
          size="large"
        >
          Cancelar
        </Button>

        <Button
          onClick={handleConvertToSale}
          disabled={!canConvert || processing || loadingItems || loadingStock}
          variant="contained"
          size="large"
          startIcon={processing ? <CircularProgress size={20} /> : <ConvertIcon />}
          sx={{
            background: canConvert ? 
              'linear-gradient(135deg, #2196f3, #1976d2)' : 
              'linear-gradient(135deg, #ccc, #999)',
            fontWeight: 'bold',
            px: 4
          }}
        >
          {processing ? 'Convirtiendo...' : loadingItems ? 'Cargando...' : '🔄 Convertir a Venta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
