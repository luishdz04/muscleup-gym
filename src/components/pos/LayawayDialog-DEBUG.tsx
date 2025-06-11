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
  MenuItem
} from '@mui/material';
import { 
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  Check as CheckIcon 
} from '@mui/icons-material';
import { formatPrice } from '@/utils/formatUtils';

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

  const [activeStep, setActiveStep] = useState(0);
  const [depositPercentage, setDepositPercentage] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

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

  const handleCreateLayaway = useCallback(() => {
    setProcessing(true);
    
    setTimeout(() => {
      setProcessing(false);
      setCompleted(true);
      
      setTimeout(() => {
        onSuccess();
        onClose();
        setCompleted(false);
        setActiveStep(0);
        setPaymentMethod('');
      }, 2000);
    }, 1500);
  }, [onSuccess, onClose]);

  const handleClose = useCallback(() => {
    setCompleted(false);
    setProcessing(false);
    setActiveStep(0);
    setPaymentMethod('');
    onClose();
  }, [onClose]);

  const canProceedToNextStep = useCallback(() => {
    switch (activeStep) {
      case 0: return calculations.depositAmount > 0;
      case 1: return paymentMethod !== '';
      case 2: return true; // ✅ Paso final siempre válido
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
            📦 Apartado FUNCIONAL (Corregido)
          </Typography>
        </Box>
        <Button onClick={handleClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!completed ? (
          <Box>
            {customer && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6">
                  👤 Cliente: {customer.name}
                </Typography>
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
                              <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 3 }}>
                                Anticipo: {formatPrice(calculations.depositAmount)} 
                                ({paymentMethods.find(m => m.value === paymentMethod)?.label})
                              </Typography>
                              
                              {/* ✅ BOTÓN DE CONFIRMACIÓN FINAL */}
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
                                <Button
                                  variant="contained"
                                  onClick={handleCreateLayaway}
                                  disabled={processing}
                                  startIcon={processing ? null : <BookmarkIcon />}
                                  sx={{
                                    background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                                    color: '#FFFFFF',
                                    fontWeight: 'bold',
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.1rem'
                                  }}
                                >
                                  {processing ? 'Procesando...' : '✅ CREAR APARTADO'}
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
                      textAlign: 'center' 
                    }}>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 800 }}>
                        A COBRAR HOY
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#9c27b0', fontWeight: 900 }}>
                        {formatPrice(calculations.depositAmount)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box textAlign="center" sx={{ py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography variant="h4" color="#4caf50" fontWeight="bold">
              ¡Apartado Creado Exitosamente!
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {!completed && (
          <Button onClick={handleClose} disabled={processing}>
            Cancelar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
