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
  layaway: any;
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

  // ✅ CARGAR ITEMS DEL APARTADO
  const loadLayawayItems = useCallback(async () => {
    if (!layaway?.id) return;

    setLoadingItems(true);
    try {
      console.log('🔍 Cargando items del apartado:', layaway.sale_number);

      const { data: items, error } = await supabase
        .from('sale_items')
        .select('*')
        .eq('sale_id', layaway.id);

      if (error) {
        console.error('❌ Error cargando items:', error);
        throw error;
      }

      setLayawayItems(items || []);
      console.log('✅ Items cargados:', items?.length || 0);

    } catch (error) {
      console.error('💥 Error cargando items del apartado:', error);
      showNotification('Error al cargar los productos del apartado', 'error');
    } finally {
      setLoadingItems(false);
    }
  }, [layaway?.id, layaway?.sale_number, supabase]);

  // ✅ VERIFICAR STOCK DISPONIBLE
  const checkProductStock = useCallback(async () => {
    if (layawayItems.length === 0) return;

    setLoadingStock(true);
    try {
      console.log('🔍 Verificando stock para', layawayItems.length, 'productos...');

      const stockPromises = layawayItems.map(async (item) => {
        const { data: product, error } = await supabase
          .from('products')
          .select('id, name, current_stock')
          .eq('id', item.product_id)
          .single();

        if (error) {
          console.error('❌ Error verificando stock para producto:', item.product_id, error);
          return {
            id: item.product_id,
            name: item.product_name,
            current_stock: 0,
            required_quantity: item.quantity,
            available: false
          };
        }

        return {
          id: product.id,
          name: product.name,
          current_stock: product.current_stock || 0,
          required_quantity: item.quantity,
          available: (product.current_stock || 0) >= item.quantity
        };
      });

      const stockResults = await Promise.all(stockPromises);
      setStockCheck(stockResults);
      
      // ✅ VERIFICAR SI SE PUEDE CONVERTIR
      const allAvailable = stockResults.every(stock => stock.available);
      const isPaidInFull = (layaway.pending_amount || 0) <= 0;
      const isLayawayStatus = layaway.status === 'pending';
      
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
      showNotification('Error al verificar el inventario', 'error');
    } finally {
      setLoadingStock(false);
    }
  }, [layawayItems, layaway.pending_amount, layaway.status, supabase]);

  // ✅ EFECTOS
  useEffect(() => {
    if (open && layaway) {
      console.log('🔄 Inicializando conversión para apartado:', layaway.sale_number);
      loadLayawayItems();
      setSendEmail(!!layaway.customer_email);
    }
  }, [open, layaway, loadLayawayItems]);

  useEffect(() => {
    if (layawayItems.length > 0) {
      checkProductStock();
    }
  }, [layawayItems, checkProductStock]);

  // ✅ CONVERTIR APARTADO A VENTA CORREGIDO
  const handleConvertToSale = async () => {
    if (!canConvert || layawayItems.length === 0) return;

    setProcessing(true);
    try {
      console.log('🔄 Iniciando conversión a venta...', {
        apartado: layaway.sale_number,
        timestamp: '2025-06-11 07:05:12 UTC',
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

      // ✅ NOTA: NO actualizar stock aquí
      // El stock ya se actualizó cuando se creó el apartado
      // Al convertir a venta no hay movimiento adicional de inventario

      // ✅ REGISTRAR HISTORIAL DE CAMBIO
      await supabase
        .from('layaway_status_history')
        .insert([{
          layaway_id: layaway.id,
          previous_status: 'pending',
          new_status: 'completed',
          previous_paid_amount: layaway.paid_amount || 0,
          new_paid_amount: layaway.paid_amount || 0,
          reason: 'Apartado convertido manualmente a venta final - 2025-06-11 07:05:12 UTC por luishdz04',
          created_at: new Date().toISOString(),
          created_by: userId
        }]);

      console.log('✅ Historial de conversión registrado');

      // ✅ ACTUALIZAR PUNTOS DEL CLIENTE SI APLICA - CORREGIDO
      if (layaway.customer_id) {
        const { data: customer, error: customerError } = await supabase
          .from('Users') // ✅ CORREGIDO: Tabla Users con mayúscula
          .select('points_balance, total_purchases, membership_type')
          .eq('id', layaway.customer_id)
          .single();

        if (!customerError && customer && customer.membership_type) {
          const pointsEarned = Math.floor((layaway.total_amount || 0) / 100); // 1 punto por cada $100
          
          await supabase
            .from('Users') // ✅ CORREGIDO: Tabla Users con mayúscula
            .update({
              points_balance: (customer.points_balance || 0) + pointsEarned,
              total_purchases: (customer.total_purchases || 0) + (layaway.total_amount || 0),
              updated_at: new Date().toISOString()
            })
            .eq('id', layaway.customer_id);

          console.log('✅ Puntos de cliente actualizados:', pointsEarned);
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

  if (!layaway) return null;

  const hasInsufficientStock = stockCheck.some(stock => !stock.available);
  const hasPendingAmount = (layaway.pending_amount || 0) > 0;

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
          🔄 Conversión de apartado - 2025-06-11 07:05:12 UTC - Usuario: luishdz04
        </Alert>

        {/* Información del apartado */}
        <Card sx={{ 
          mb: 3,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))',
          border: '2px solid rgba(33, 150, 243, 0.3)'
        }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: '#2196f3', fontWeight: 700 }}>
              📋 Información del Apartado #{layaway.sale_number}
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Total</Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {formatPrice(layaway.total_amount || 0)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pagado</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {formatPrice(layaway.paid_amount || 0)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Pendiente</Typography>
                  <Typography variant="h6" fontWeight="bold" color={hasPendingAmount ? 'error.main' : 'success.main'}>
                    {formatPrice(layaway.pending_amount || 0)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">Estado</Typography>
                  <Chip 
                    label={layaway.status}
                    color={layaway.status === 'pending' ? 'warning' : 'success'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Grid>
            </Grid>

            {layaway.customer_name && (
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(33, 150, 243, 0.2)' }}>
                <Typography variant="body2" color="textSecondary">Cliente:</Typography>
                <Typography variant="body1" fontWeight="600">
                  {layaway.customer_name}
                  {layaway.customer_email && ` • ${layaway.customer_email}`}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Alertas de validación */}
        {hasPendingAmount && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" fontWeight="600">
              ❌ No se puede convertir: Hay un saldo pendiente de {formatPrice(layaway.pending_amount || 0)}
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
                        key={stock.id}
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
                        Se completará venta por {formatPrice(layaway.total_amount || 0)}
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

                {layaway.customer_id && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(76, 175, 80, 0.2)' }}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        💎 <strong>Puntos de Cliente:</strong> Se otorgarán {Math.floor((layaway.total_amount || 0) / 100)} puntos al cliente por esta venta.
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
                        disabled={!layaway.customer_email}
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
