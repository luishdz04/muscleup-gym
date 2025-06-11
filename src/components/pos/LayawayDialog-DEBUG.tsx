'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

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

  const [test, setTest] = useState('test');

  console.log('LayawayDialog render:', { open, cart: cart?.length, totals: totals?.total });

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        🔧 DEBUG - LayawayDialog
        <Button onClick={onClose} style={{ float: 'right' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Estado Debug:
          </Typography>
          
          <Typography variant="body2">
            • Open: {String(open)}
          </Typography>
          
          <Typography variant="body2">
            • Cart Items: {cart?.length || 0}
          </Typography>
          
          <Typography variant="body2">
            • Customer: {customer?.name || 'Sin cliente'}
          </Typography>
          
          <Typography variant="body2">
            • Total: ${totals?.total || 0}
          </Typography>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Si ves este dialog sin errores, el problema está en la complejidad del componente original.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cerrar Debug
        </Button>
        <Button 
          variant="contained" 
          onClick={() => {
            console.log('Test success callback');
            onSuccess();
            onClose();
          }}
        >
          Test Success
        </Button>
      </DialogActions>
    </Dialog>
  );
}
