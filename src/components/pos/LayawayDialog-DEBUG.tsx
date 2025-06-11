'use client';

import React, { useState, useCallback } from 'react';
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
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Bookmark as BookmarkIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { formatPrice, formatDate } from '@/utils/formatUtils';

interface LayawayDialogProps {
  open: boolean;
  onClose: () => void;
  cart: any[];
  customer?: any;
  coupon?: any;
  totals: any;
  onSuccess: () => void;
}

export default function LayawayDialog({ 
  open, 
  onClose, 
  cart, 
  customer, 
  coupon, 
  totals, 
  onSuccess 
}: LayawayDialogProps) {

  // ✅ ESTADOS MÍNIMOS - NO COMPLEJOS
  const [depositPercentage, setDepositPercentage] = useState(50);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  // ✅ CÁLCULOS DIRECTOS - SIN useMemo PROBLEMÁTICOS
  const depositAmount = (totals?.total || 0) * (depositPercentage / 100);
  const remainingAmount = (totals?.total || 0) - depositAmount;

  // ✅ FUNCIÓN SIMPLE DE PROCESAMIENTO
  const handleCreateLayaway = useCallback(() => {
    setProcessing(true);
    
    // Simular procesamiento
    setTimeout(() => {
      setProcessing(false);
      setCompleted(true);
      
      setTimeout(() => {
        onSuccess();
        onClose();
        setCompleted(false);
      }, 2000);
    }, 1500);
  }, [onSuccess, onClose]);

  // ✅ RESET AL CERRAR
  const handleClose = useCallback(() => {
    setCompleted(false);
    setProcessing(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
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
            📦 Apartado Simplificado
          </Typography>
        </Box>
        <Button onClick={handleClose} sx={{ color: 'inherit' }} disabled={processing}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {!completed ? (
          <Box>
            {/* Información del cliente */}
            {customer && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="h6">
                  👤 Cliente: {customer.name}
                </Typography>
                <Typography variant="body2">
                  {customer.email || customer.whatsapp}
                </Typography>
              </Alert>
            )}

            {!customer && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                ⚠️ Debe seleccionar un cliente antes de crear un apartado
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Configuración del apartado */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ background: 'rgba(156, 39, 176, 0.1)', border: '1px solid rgba(156, 39, 176, 0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#9c27b0', mb: 2 }}>
                      💰 Configuración del Anticipo
                    </Typography>
                    
                    <TextField
                      fullWidth
                      label="Porcentaje del anticipo (%)"
                      type="number"
                      value={depositPercentage}
                      onChange={(e) => setDepositPercentage(Number(e.target.value) || 50)}
                      inputProps={{ min: 10, max: 100 }}
                      sx={{ mb: 2 }}
                    />

                    <Typography variant="body1" sx={{ color: '#FFFFFF' }}>
                      Anticipo: <strong>{formatPrice(depositAmount)}</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#CCCCCC' }}>
                      Pendiente: {formatPrice(remainingAmount)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Resumen */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#4caf50', mb: 2 }}>
                      📋 Resumen
                    </Typography>
                    
                    <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                      Productos: {cart?.length || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#CCCCCC', mb: 1 }}>
                      Total: {formatPrice(totals?.total || 0)}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                      A cobrar hoy: {formatPrice(depositAmount)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        ) : (
          // Confirmación
          <Box textAlign="center" sx={{ py: 4 }}>
            <CheckIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
            <Typography variant="h4" color="#4caf50" fontWeight="bold" gutterBottom>
              ¡Apartado Creado!
            </Typography>
            <Typography variant="h6" color="#CCCCCC">
              El apartado se procesó correctamente
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        {!completed && (
          <>
            <Button onClick={handleClose} disabled={processing}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateLayaway}
              disabled={processing || !customer}
              startIcon={processing ? null : <BookmarkIcon />}
              sx={{
                background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
                color: '#FFFFFF',
                '&:disabled': {
                  opacity: 0.6
                }
              }}
            >
              {processing ? 'Procesando...' : 'Crear Apartado'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
