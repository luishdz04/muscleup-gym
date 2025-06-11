'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  Check as CheckIcon 
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice, formatDate } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';

interface LayawayDialogProps {
  open: boolean;
  onClose: () => void;
  cart: any[];
  customer?: any;
  coupon?: any;
  totals: any;
  onSuccess: () => void;
}

const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'debito', label: 'Tarjeta de Débito', icon: '💳' },
  { value: 'credito', label: 'Tarjeta de Crédito', icon: '💳' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' }
];

export default function LayawayDialog({ 
  open, 
  onClose, 
  cart, 
  customer, 
  coupon, 
  totals, 
  onSuccess 
}: LayawayDialogProps) {

  // ✅ ESTADOS BÁSICOS QUE FUNCIONAN
  const [activeStep, setActiveStep] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [layawayNumber, setLayawayNumber] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  // ✅ CÁLCULOS SIMPLES Y ESTABLES
  const calculations = useMemo(() => {
    const total = totals?.total || 0;
    const deposit = total * (depositPercentage / 100);
    const remaining = total - deposit;
    
    return {
      depositAmount: deposit,
      remainingAmount: remaining,
      total
    };
  }, [totals?.total, depositPercentage]);

  // ✅ GENERAR NÚMERO DE APARTADO SIMPLE
  const generateLayawayNumber = useCallback(async (): Promise<string> => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `AP${year}${month}${day}${timestamp}`;
  }, []);

  // ✅ PROCESAMIENTO REAL CON SUPABASE - SIMPLE Y DIRECTO
  const handleCreateLayaway = useCallback(async () => {
    if (!customer) {
      showNotification('Se requiere un cliente para apartados', 'error');
      return;
    }

    try {
      setProcessing(true);

      // ✅ 1. OBTENER USUARIO ACTUAL
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      if (!userId) {
        throw new Error('Usuario no autenticado');
      }

      // ✅ 2. GENERAR NÚMERO DE APARTADO
      const layawayNumber = await generateLayawayNumber();

      // ✅ 3. CALCULAR FECHA DE EXPIRACIÓN (30 días)
      const today = new Date();
      const expirationDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      const expirationDateTime = expirationDate.toISOString();

      // ✅ 4. CREAR VENTA TIPO LAYAWAY - DATOS SIMPLES
      const layawayData = {
        sale_number: layawayNumber,
        customer_id: customer.id,
        cashier_id: userId,
        sale_type: 'layaway' as const,
        subtotal: totals.subtotal || 0,
        tax_amount: totals.taxAmount || 0,
        discount_amount: totals.discountAmount || 0,
        coupon_discount: totals.couponDiscount || 0,
        coupon_code: coupon?.code || null,
        total_amount: calculations.total,
        required_deposit: calculations.depositAmount,
        paid_amount: calculations.depositAmount,
        pending_amount: calculations.remainingAmount,
        deposit_percentage: depositPercentage,
        layaway_expires_at: expirationDateTime,
        status: 'pending' as const,
        payment_status: 'partial' as const,
        is_mixed_payment: false,
        payment_received: calculations.depositAmount,
        change_amount: 0,
        commission_rate: 0, // ✅ SIN COMISIONES POR AHORA
        commission_amount: 0,
        notes: `Apartado - Vence: ${formatDate(expirationDateTime)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Creando apartado:', layawayData);

      // ✅ 5. INSERTAR EN SUPABASE
      const { data: layaway, error: layawayError } = await supabase
        .from('sales')
        .insert([layawayData])
        .select()
        .single();

      if (layawayError) {
        console.error('Error creando apartado:', layawayError);
        throw layawayError;
      }

      console.log('✅ Apartado creado:', layaway);

      // ✅ 6. CREAR ITEMS DEL APARTADO
      const layawayItems = cart.map(item => ({
        sale_id: layaway.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_amount: item.discount_amount || 0,
        tax_rate: item.product.tax_rate || 16,
        tax_amount: item.tax_amount || 0,
        created_at: new Date().toISOString()
      }));

      console.log('💾 Creando items:', layawayItems);

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(layawayItems);

      if (itemsError) {
        console.error('Error creando items:', itemsError);
        throw itemsError;
      }

      console.log('✅ Items creados');

      // ✅ 7. CREAR DETALLE DE PAGO SIMPLE
      const paymentData = {
        sale_id: layaway.id,
        payment_method: paymentMethod,
        amount: calculations.depositAmount,
        payment_reference: paymentReference || null,
        commission_rate: 0,
        commission_amount: 0,
        sequence_order: 1,
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        created_by: userId
      };

      console.log('💾 Creando pago:', paymentData);

      const { error: paymentError } = await supabase
        .from('sale_payment_details')
        .insert([paymentData]);

      if (paymentError) {
        console.error('Error creando pago:', paymentError);
        throw paymentError;
      }

      console.log('✅ Pago creado');

      // ✅ 8. ACTUALIZAR STOCK DE PRODUCTOS (RESERVAR)
      for (const item of cart) {
        console.log(`💾 Actualizando stock de ${item.product.name}`);
        
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            current_stock: item.product.current_stock - item.quantity,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', item.product.id);

        if (stockError) {
          console.error('Error actualizando stock:', stockError);
          throw stockError;
        }

        // ✅ REGISTRAR MOVIMIENTO DE INVENTARIO
        await supabase
          .from('inventory_movements')
          .insert([{
            product_id: item.product.id,
            movement_type: 'salida',
            quantity: -item.quantity,
            previous_stock: item.product.current_stock,
            new_stock: item.product.current_stock - item.quantity,
            unit_cost: item.product.cost_price || 0,
            total_cost: item.quantity * (item.product.cost_price || 0),
            reason: 'Apartado',
            reference_id: layaway.id,
            notes: `Apartado #${layaway.sale_number} - Reserva hasta ${formatDate(expirationDateTime)}`,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);
      }

      console.log('✅ Stock actualizado');

      // ✅ 9. ACTUALIZAR CUPÓN SI SE USÓ
      if (coupon) {
        console.log('💾 Actualizando cupón:', coupon.code);
        
        await supabase
          .from('coupons')
          .update({ 
            current_uses: (coupon.current_uses || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', coupon.id);

        console.log('✅ Cupón actualizado');
      }

      // ✅ 10. FINALIZAR
      setLayawayNumber(layaway.sale_number);
      setCompleted(true);
      showNotification('¡Apartado creado exitosamente!', 'success');

      console.log('🎉 APARTADO COMPLETADO:', layaway.sale_number);

    } catch (error) {
      console.error('❌ Error procesando apartado:', error);
      showNotification('Error al procesar apartado: ' + (error as Error).message, 'error');
    } finally {
      setProcessing(false);
    }
  }, [
    customer, 
    supabase, 
    generateLayawayNumber, 
    calculations, 
    depositPercentage, 
    totals, 
    coupon, 
    paymentMethod, 
    paymentReference, 
    cart
  ]);

  // ✅ RESET AL CERRAR
  const handleClose = useCallback(() => {
    if (completed) {
      onSuccess(); // Limpiar carrito solo si se completó
    }
    setCompleted(false);
    setProcessing(false);
    setActiveStep(0);
    setPaymentMethod('');
    setPaymentReference('');
    setLayawayNumber(null);
    onClose();
  }, [completed, onSuccess, onClose]);

  // ✅ VALIDACIÓN SIMPLE
  const canProceedToNextStep = useCallback(() => {
    switch (activeStep) {
      case 0: return calculations.depositAmount > 0;
      case 1: return paymentMethod !== '';
      case 2: return true;
      default: return false;
    }
  }, [activeStep, calculations.depositAmount, paymentMethod]);

  const steps = [
    { label: 'Configuración', description: 'Anticipo del apartado' },
    { label: 'Método de Pago', description: 'Forma de pago del anticipo' },
    { label: 'Confirmación', description: 'Revisar y procesar' }
  ];

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.98), rgba(77, 77, 77, 0.95))',
          color: '#FFFFFF'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.98), rgba(156, 39, 176, 0.85))',
        color: '#FFFFFF'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <BookmarkIcon />
          <Typography variant="h5" fontWeight="bold">
            📦 Apartado REAL (Con Supabase)
          </Typography>
        </Box>
        <Button onClick={handleClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!completed ? (
          <Box>
            {/* Cliente */}
            {customer ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6">
                  👤 Cliente: {customer.name}
                </Typography>
                <Typography variant="body2">
                  {customer.email || customer.whatsapp}
                </Typography>
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 3 }}>
                ⚠️ Debe seleccionar un cliente antes de crear un apartado
              </Alert>
            )}

            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Card sx={{ background: 'rgba(51, 51, 51, 0.8)', p: 2 }}>
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {steps.map((step, index) => (
                      <Step key={step.label}>
                        <StepLabel sx={{ '& .MuiStepLabel-label': { color: '#FFFFFF' } }}>
                          {step.label}
                        </StepLabel>
                        <StepContent>
                          <Typography sx={{ color: '#CCCCCC', mb: 2 }}>
                            {step.description}
                          </Typography>

                          {/* PASO 1: Configuración */}
                          {index === 0 && (
                            <Box>
                              <TextField
                                fullWidth
                                label="Porcentaje del anticipo (%)"
                                type="number"
                                value={depositPercentage}
                                onChange={(e) => setDepositPercentage(Number(e.target.value) || 50)}
                                inputProps={{ min: 10, max: 100 }}
                                sx={{ mb: 2 }}
                              />
                              <Typography variant="body1" sx={{ color: '#9c27b0', fontWeight: 600 }}>
                                Anticipo: {formatPrice(calculations.depositAmount)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                                Pendiente: {formatPrice(calculations.remainingAmount)}
                              </Typography>
                            </Box>
                          )}

                          {/* PASO 2: Método de Pago */}
                          {index === 1 && (
                            <Box>
                              <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ color: '#CCCCCC' }}>Método de Pago</InputLabel>
                                <Select
                                  value={paymentMethod}
                                  onChange={(e) => setPaymentMethod(e.target.value)}
                                  sx={{ color: '#FFFFFF' }}
                                >
                                  {paymentMethods.map((method) => (
                                    <MenuItem key={method.value} value={method.value}>
                                      {method.icon} {method.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                              
                              {paymentMethod && ['debito', 'credito', 'transferencia'].includes(paymentMethod) && (
                                <TextField
                                  fullWidth
                                  label="Referencia / Autorización"
                                  value={paymentReference}
                                  onChange={(e) => setPaymentReference(e.target.value)}
                                  placeholder="Número de autorización, SPEI, etc."
                                  sx={{ mb: 2 }}
                                />
                              )}
                              
                              {paymentMethod && (
                                <Typography variant="body2" sx={{ color: '#4caf50' }}>
                                  ✅ Método seleccionado: {paymentMethods.find(m => m.value === paymentMethod)?.label}
                                </Typography>
                              )}
                            </Box>
                          )}

                          {/* PASO 3: Confirmación */}
                          {index === 2 && (
                            <Box>
                              <Typography variant="h6" sx={{ color: '#FFCC00', mb: 2 }}>
                                ✅ Confirmar Apartado
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                Anticipo: {formatPrice(calculations.depositAmount)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                                Método: {paymentMethods.find(m => m.value === paymentMethod)?.label}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 3 }}>
                                Vence: 30 días desde hoy
                              </Typography>
                              
                              {/* BOTÓN DE CONFIRMACIÓN FINAL */}
                              <Box sx={{ 
                                mt: 3, 
                                p: 3, 
                                background: 'rgba(156, 39, 176, 0.2)', 
                                borderRadius: 2, 
                                textAlign: 'center' 
                              }}>
                                <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 2 }}>
                                  ¿Confirmar creación del apartado?
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 2 }}>
                                  Se reservarán los productos y se guardará en la base de datos
                                </Typography>
                                <Button
                                  variant="contained"
                                  onClick={handleCreateLayaway}
                                  disabled={processing || !customer}
                                  startIcon={processing ? <CircularProgress size={20} sx={{ color: '#FFFFFF' }} /> : <BookmarkIcon />}
                                  sx={{
                                    background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                                    color: '#FFFFFF',
                                    fontWeight: 'bold',
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.1rem'
                                  }}
                                >
                                  {processing ? 'Guardando en Supabase...' : '💾 CREAR APARTADO REAL'}
                                </Button>
                              </Box>
                            </Box>
                          )}

                          {/* Navegación */}
                          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button
                              disabled={activeStep === 0}
                              onClick={() => setActiveStep(prev => prev - 1)}
                              variant="outlined"
                              sx={{ color: '#CCCCCC' }}
                            >
                              ← Anterior
                            </Button>
                            
                            {activeStep < steps.length - 1 && (
                              <Button
                                variant="contained"
                                onClick={() => setActiveStep(prev => prev + 1)}
                                disabled={!canProceedToNextStep()}
                                sx={{ background: '#9c27b0' }}
                              >
                                Continuar →
                              </Button>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                      📋 Resumen del Apartado
                    </Typography>
                    
                    <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                      Productos: {cart?.length || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 2 }}>
                      Total: {formatPrice(calculations.total)}
                    </Typography>
                    
                    <Box sx={{ 
                      p: 2, 
                      background: 'rgba(156, 39, 176, 0.2)', 
                      borderRadius: 2, 
                      textAlign: 'center',
                      mb: 2
                    }}>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800 }}>
                        A COBRAR HOY
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 900 }}>
                        {formatPrice(calculations.depositAmount)}
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      p: 2, 
                      background: 'rgba(76, 175, 80, 0.2)', 
                      borderRadius: 2, 
                      textAlign: 'center' 
                    }}>
                      <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                        PENDIENTE
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>
                        {formatPrice(calculations.remainingAmount)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // Confirmación de éxito
          <Box textAlign="center" sx={{ py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography variant="h4" color="#4caf50" fontWeight="bold" gutterBottom>
              ¡Apartado Creado Exitosamente!
            </Typography>
            <Typography variant="h5" gutterBottom sx={{ color: '#9c27b0', fontWeight: 700 }}>
              #{layawayNumber}
            </Typography>
            <Typography variant="h6" color="#CCCCCC" sx={{ mb: 2 }}>
              Guardado en Supabase el {formatDate(new Date().toISOString())}
            </Typography>
            <Typography variant="body1" color="#CCCCCC">
              Cliente: {customer?.name}
            </Typography>
            <Typography variant="body2" color="#808080">
              Anticipo: {formatPrice(calculations.depositAmount)} • Pendiente: {formatPrice(calculations.remainingAmount)}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={processing} size="large">
          {completed ? 'Finalizar' : 'Cancelar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
