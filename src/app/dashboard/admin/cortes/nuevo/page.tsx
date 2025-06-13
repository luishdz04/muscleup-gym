'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
} from '@mui/material';
import {
  CalendarMonth,
  Save,
  AutoMode,
  Edit,
  Receipt,
  MonetizationOn,
  Assessment,
  Warning,
  Info,
  CheckCircle,
  Savings
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { useTheme } from '@mui/material/styles';

// 💡 TIPOS
interface CutData {
  pos_efectivo: number;
  pos_transferencia: number;
  pos_debito: number;
  pos_credito: number;
  pos_total: number;
  pos_transactions: number;
  pos_commissions: number;
  
  abonos_efectivo: number;
  abonos_transferencia: number;
  abonos_debito: number;
  abonos_credito: number;
  abonos_total: number;
  abonos_transactions: number;
  abonos_commissions: number;
  
  membership_efectivo: number;
  membership_transferencia: number;
  membership_debito: number;
  membership_credito: number;
  membership_total: number;
  membership_transactions: number;
  membership_commissions: number;
  
  total_efectivo: number;
  total_transferencia: number;
  total_debito: number;
  total_credito: number;
  total_mixto: number;
  grand_total: number;
  total_transactions: number;
  total_commissions: number;
  net_amount: number;
  expenses_amount: number;
  final_balance: number;
}

interface Totals {
  pos_total: number;
  abonos_total: number;
  membership_total: number;
  total_efectivo: number;
  total_transferencia: number;
  total_debito: number;
  total_credito: number;
  grand_total: number;
  total_transactions: number;
  total_commissions: number;
  net_amount: number;
  final_balance: number;
}

export default function NuevoCorteePage() {
  const theme = useTheme();
  
  // ✅ CREAR TOKENS LOCALES BASADOS EN EL TEMA DE MUI
  const darkProTokens = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    textDisabled: theme.palette.text.disabled,
    surfaceLevel1: theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
    surfaceLevel2: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
    surfaceLevel3: theme.palette.mode === 'dark' ? '#2d2d2d' : '#eeeeee',
    surfaceLevel4: theme.palette.mode === 'dark' ? '#3d3d3d' : '#e0e0e0',
    grayDark: theme.palette.grey[800],
    grayMedium: theme.palette.grey[600],
    grayLight: theme.palette.grey[400],
    roleAdmin: theme.palette.primary.main,
    backgroundDefault: theme.palette.background.default,
    backgroundPaper: theme.palette.background.paper
  };

  // 🇲🇽 FUNCIONES PARA MANEJAR TIEMPO DE MÉXICO
  const createTimestampForDB = useCallback((): string => {
    const now = new Date();
    // ✅ CONVERTIR A MÉXICO ANTES DE GUARDAR (UTC-6)
    const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    return mexicoTime.toISOString();
  }, []);

  const getMexicoDateString = useCallback((): string => {
    const now = new Date();
    const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    return mexicoTime.toISOString().split('T')[0];
  }, []);

  const getMexicoDisplayTime = useCallback((): string => {
    const now = new Date();
    const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    return mexicoTime.toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, []);

  // 📅 FECHA ACTUAL EN MÉXICO COMO DEFAULT
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    const mexicoTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    const mexicoDateString = mexicoTime.toISOString().split('T')[0];
    return new Date(mexicoDateString + 'T12:00:00');
  });

  // 🔄 ESTADOS
  const [isManualMode, setIsManualMode] = useState(false);
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingCut, setExistingCut] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>('');

  // 💾 DATOS EDITABLES
  const [editableData, setEditableData] = useState<CutData>({
    // POS
    pos_efectivo: 0,
    pos_transferencia: 0,
    pos_debito: 0,
    pos_credito: 0,
    pos_total: 0,
    pos_transactions: 0,
    pos_commissions: 0,
    
    // ABONOS
    abonos_efectivo: 0,
    abonos_transferencia: 0,
    abonos_debito: 0,
    abonos_credito: 0,
    abonos_total: 0,
    abonos_transactions: 0,
    abonos_commissions: 0,
    
    // MEMBERSHIPS
    membership_efectivo: 0,
    membership_transferencia: 0,
    membership_debito: 0,
    membership_credito: 0,
    membership_total: 0,
    membership_transactions: 0,
    membership_commissions: 0,
    
    // TOTALES
    total_efectivo: 0,
    total_transferencia: 0,
    total_debito: 0,
    total_credito: 0,
    total_mixto: 0,
    grand_total: 0,
    total_transactions: 0,
    total_commissions: 0,
    net_amount: 0,
    expenses_amount: 0,
    final_balance: 0
  });

  // ⏰ ACTUALIZAR RELOJ CADA SEGUNDO
  useEffect(() => {
    const updateClock = () => {
      setCurrentTime(getMexicoDisplayTime());
    };
    
    updateClock(); // Llamada inicial
    const interval = setInterval(updateClock, 1000);
    
    return () => clearInterval(interval);
  }, [getMexicoDisplayTime]);

  // 🔍 VERIFICAR CORTE EXISTENTE AL CAMBIAR FECHA
  useEffect(() => {
    const checkExistingCut = async () => {
      if (!selectedDate) return;
      
      const dateString = selectedDate.toISOString().split('T')[0];
      
      try {
        const response = await fetch(`/api/cuts/check-existing?date=${dateString}`);
        const data = await response.json();
        
        if (data.success && data.exists) {
          setExistingCut(data.existing_cut);
        } else {
          setExistingCut(null);
        }
      } catch (error) {
        console.error('Error verificando corte existente:', error);
      }
    };

    checkExistingCut();
  }, [selectedDate]);

  // 🧮 CALCULAR TOTALES
  const calculateTotals = useCallback((): Totals => {
    // Totales por sección
    const pos_total = editableData.pos_efectivo + editableData.pos_transferencia + 
                     editableData.pos_debito + editableData.pos_credito;
    
    const abonos_total = editableData.abonos_efectivo + editableData.abonos_transferencia + 
                        editableData.abonos_debito + editableData.abonos_credito;
    
    const membership_total = editableData.membership_efectivo + editableData.membership_transferencia + 
                            editableData.membership_debito + editableData.membership_credito;
    
    // Totales por método de pago
    const total_efectivo = editableData.pos_efectivo + editableData.abonos_efectivo + editableData.membership_efectivo;
    const total_transferencia = editableData.pos_transferencia + editableData.abonos_transferencia + editableData.membership_transferencia;
    const total_debito = editableData.pos_debito + editableData.abonos_debito + editableData.membership_debito;
    const total_credito = editableData.pos_credito + editableData.abonos_credito + editableData.membership_credito;
    
    // Gran total
    const grand_total = pos_total + abonos_total + membership_total;
    
    // Total transacciones
    const total_transactions = editableData.pos_transactions + editableData.abonos_transactions + editableData.membership_transactions;
    
    // Balance final (total - gastos)
    const final_balance = grand_total - editableData.expenses_amount;
    
    return {
      pos_total,
      abonos_total,
      membership_total,
      total_efectivo,
      total_transferencia,
      total_debito,
      total_credito,
      grand_total,
      total_transactions,
      total_commissions: 0,
      net_amount: grand_total,
      final_balance
    };
  }, [editableData]);

  const totals = calculateTotals();

  // 💰 FORMATEAR PRECIO
  const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // 📝 MANEJAR CAMBIOS EN INPUTS
  const handleInputChange = (field: keyof CutData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setEditableData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  // 💾 CREAR CORTE
  const handleCreateCut = async () => {
    try {
      setCreating(true);
      setError(null);
      
      const dateString = selectedDate.toISOString().split('T')[0];
      const totals = calculateTotals();
      
      const cutData = {
        cut_date: dateString,
        created_at_mexico: createTimestampForDB(), // ✅ HORA MÉXICO
        notes: observations.trim(),
        is_manual: isManualMode,
        
        // POS
        pos_efectivo: editableData.pos_efectivo,
        pos_transferencia: editableData.pos_transferencia,
        pos_debito: editableData.pos_debito,
        pos_credito: editableData.pos_credito,
        pos_total: totals.pos_total,
        pos_transactions: editableData.pos_transactions,
        pos_commissions: editableData.pos_commissions,
        
        // ABONOS
        abonos_efectivo: editableData.abonos_efectivo,
        abonos_transferencia: editableData.abonos_transferencia,
        abonos_debito: editableData.abonos_debito,
        abonos_credito: editableData.abonos_credito,
        abonos_total: totals.abonos_total,
        abonos_transactions: editableData.abonos_transactions,
        abonos_commissions: editableData.abonos_commissions,
        
        // MEMBERSHIPS
        membership_efectivo: editableData.membership_efectivo,
        membership_transferencia: editableData.membership_transferencia,
        membership_debito: editableData.membership_debito,
        membership_credito: editableData.membership_credito,
        membership_total: totals.membership_total,
        membership_transactions: editableData.membership_transactions,
        membership_commissions: editableData.membership_commissions,
        
        // TOTALES
        total_efectivo: totals.total_efectivo,
        total_transferencia: totals.total_transferencia,
        total_debito: totals.total_debito,
        total_credito: totals.total_credito,
        grand_total: totals.grand_total,
        total_transactions: totals.total_transactions,
        total_commissions: totals.total_commissions,
        net_amount: totals.net_amount,
        expenses_amount: editableData.expenses_amount,
        final_balance: totals.final_balance
      };
      
      console.log('📊 Creando corte con datos:', cutData);
      
      const response = await fetch('/api/cuts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cutData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el corte');
      }
      
      if (data.success) {
        setSuccess(`✅ ${data.message}`);
        // Resetear datos después de crear exitosamente
        // setEditableData({ /* valores iniciales */ });
        // setObservations('');
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
      
    } catch (error: any) {
      console.error('💥 Error creando corte:', error);
      setError(error.message || 'Error al crear el corte');
    } finally {
      setCreating(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel1}, ${darkProTokens.surfaceLevel2})`,
        p: 3
      }}>
        <Stack spacing={4} sx={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          {/* 🎯 HEADER */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.roleAdmin}CC)`,
            color: 'white'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Receipt sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h3" fontWeight="bold">
                    💼 Nuevo Corte de Caja
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Gestión de cortes diarios del sistema
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* ⏰ INFORMACIÓN ACTUAL */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayMedium}`
          }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                      Fecha y hora actual (México):
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 'bold' }}>
                      {currentTime}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                      Tipo de corte:
                    </Typography>
                    <Chip 
                      label={isManualMode ? "Manual" : "Automático"}
                      color={isManualMode ? "warning" : "success"}
                      icon={isManualMode ? <Edit /> : <AutoMode />}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                      Estado:
                    </Typography>
                    <Typography variant="body1" sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                      ✅ Listo para crear
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ⚠️ ALERTA CORTE EXISTENTE */}
          {existingCut && (
            <Alert 
              severity="warning" 
              icon={<Warning />}
              sx={{ 
                backgroundColor: `${darkProTokens.warning}20`,
                border: `1px solid ${darkProTokens.warning}`,
                '& .MuiAlert-icon': { color: darkProTokens.warning }
              }}
            >
              <Typography variant="body1" fontWeight="bold">
                ⚠️ Ya existe un corte para esta fecha: {existingCut.cut_number}
              </Typography>
              <Typography variant="body2">
                Tipo: {existingCut.is_manual ? 'Manual' : 'Automático'} | 
                Estado: {existingCut.status} | 
                Creado: {new Date(existingCut.created_at).toLocaleString('es-MX')}
              </Typography>
            </Alert>
          )}

          {/* 📊 CONFIGURACIÓN DEL CORTE */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayMedium}`
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 3 }}>
                📅 Configuración del Corte
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Fecha del corte"
                    value={selectedDate}
                    onChange={(newValue) => setSelectedDate(newValue!)}
                    format="dd/MM/yyyy"
                    sx={{
                      width: '100%',
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isManualMode}
                        onChange={(e) => setIsManualMode(e.target.checked)}
                        color="warning"
                      />
                    }
                    label={
                      <Typography sx={{ color: darkProTokens.textPrimary }}>
                        {isManualMode ? "🔧 Modo Manual" : "🤖 Modo Automático"}
                      </Typography>
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Observaciones (opcional)"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Agregar notas, comentarios o detalles del corte..."
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 💰 SECCIÓN POS */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.info}40`
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.info, mb: 3 }}>
                💼 Punto de Venta (POS)
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💵 Efectivo"
                    value={editableData.pos_efectivo}
                    onChange={(e) => handleInputChange('pos_efectivo', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="🏦 Transferencia"
                    value={editableData.pos_transferencia}
                    onChange={(e) => handleInputChange('pos_transferencia', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💳 Débito"
                    value={editableData.pos_debito}
                    onChange={(e) => handleInputChange('pos_debito', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💳 Crédito"
                    value={editableData.pos_credito}
                    onChange={(e) => handleInputChange('pos_credito', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="📊 Número de Transacciones"
                    value={editableData.pos_transactions}
                    onChange={(e) => handleInputChange('pos_transactions', e.target.value)}
                    inputProps={{ min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: `${darkProTokens.info}20`, 
                    borderRadius: 2,
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Total POS
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.info, fontWeight: 'bold' }}>
                      {formatPrice(totals.pos_total)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 💰 SECCIÓN ABONOS */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.warning}40`
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.warning, mb: 3 }}>
                💰 Abonos / Apartados
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💵 Efectivo"
                    value={editableData.abonos_efectivo}
                    onChange={(e) => handleInputChange('abonos_efectivo', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="🏦 Transferencia"
                    value={editableData.abonos_transferencia}
                    onChange={(e) => handleInputChange('abonos_transferencia', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💳 Débito"
                    value={editableData.abonos_debito}
                    onChange={(e) => handleInputChange('abonos_debito', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💳 Crédito"
                    value={editableData.abonos_credito}
                    onChange={(e) => handleInputChange('abonos_credito', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="📊 Número de Transacciones"
                    value={editableData.abonos_transactions}
                    onChange={(e) => handleInputChange('abonos_transactions', e.target.value)}
                    inputProps={{ min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: `${darkProTokens.warning}20`, 
                    borderRadius: 2,
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Total Abonos
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.warning, fontWeight: 'bold' }}>
                      {formatPrice(totals.abonos_total)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 🎫 SECCIÓN MEMBRESÍAS */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.success}40`
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success, mb: 3 }}>
                🎫 Membresías
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💵 Efectivo"
                    value={editableData.membership_efectivo}
                    onChange={(e) => handleInputChange('membership_efectivo', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="🏦 Transferencia"
                    value={editableData.membership_transferencia}
                    onChange={(e) => handleInputChange('membership_transferencia', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💳 Débito"
                    value={editableData.membership_debito}
                    onChange={(e) => handleInputChange('membership_debito', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💳 Crédito"
                    value={editableData.membership_credito}
                    onChange={(e) => handleInputChange('membership_credito', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="📊 Número de Transacciones"
                    value={editableData.membership_transactions}
                    onChange={(e) => handleInputChange('membership_transactions', e.target.value)}
                    inputProps={{ min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: `${darkProTokens.success}20`, 
                    borderRadius: 2,
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Total Membresías
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                      {formatPrice(totals.membership_total)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 💸 GASTOS */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.error}40`
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.error, mb: 3 }}>
                💸 Gastos del Día
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="💸 Gastos Totales"
                    value={editableData.expenses_amount}
                    onChange={(e) => handleInputChange('expenses_amount', e.target.value)}
                    inputProps={{ step: "0.01", min: "0" }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: darkProTokens.surfaceLevel4,
                        color: darkProTokens.textPrimary
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: `${darkProTokens.error}20`, 
                    borderRadius: 2,
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Total Gastos
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.error, fontWeight: 'bold' }}>
                      -{formatPrice(editableData.expenses_amount)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 💰 RESUMEN POR MÉTODOS DE PAGO */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.primary}40`
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.primary, mb: 3 }}>
                💰 Resumen por Métodos de Pago
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ 
                    p: 3, 
                    backgroundColor: `${darkProTokens.primary}20`, 
                    textAlign: 'center',
                    border: `1px solid ${darkProTokens.primary}40`
                  }}>
                    <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 'bold' }}>
                      💵 Efectivo
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                      {formatPrice(totals.total_efectivo)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ 
                    p: 3, 
                    backgroundColor: `${darkProTokens.info}20`, 
                    textAlign: 'center',
                    border: `1px solid ${darkProTokens.info}40`
                  }}>
                    <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 'bold' }}>
                      🏦 Transferencia
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                      {formatPrice(totals.total_transferencia)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ 
                    p: 3, 
                    backgroundColor: `${darkProTokens.success}20`, 
                    textAlign: 'center',
                    border: `1px solid ${darkProTokens.success}40`
                  }}>
                    <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                      💳 Débito
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                      {formatPrice(totals.total_debito)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ 
                    p: 3, 
                    backgroundColor: `${darkProTokens.error}20`, 
                    textAlign: 'center',
                    border: `1px solid ${darkProTokens.error}40`
                  }}>
                    <Typography variant="h6" sx={{ color: darkProTokens.error, fontWeight: 'bold' }}>
                      💳 Crédito
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.textPrimary, fontWeight: 'bold' }}>
                      {formatPrice(totals.total_credito)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3, backgroundColor: darkProTokens.grayMedium }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                      Total Bruto
                    </Typography>
                    <Typography variant="h3" sx={{ color: darkProTokens.primary, fontWeight: 'bold' }}>
                      {formatPrice(totals.grand_total)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                      Gastos
                    </Typography>
                    <Typography variant="h3" sx={{ color: darkProTokens.error, fontWeight: 'bold' }}>
                      -{formatPrice(editableData.expenses_amount)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                      Balance Final
                    </Typography>
                    <Typography variant="h3" sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                      {formatPrice(totals.final_balance)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 📊 TABLA DE DESGLOSE DETALLADO */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.roleAdmin}40`,
            borderRadius: 4
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin, mb: 3 }}>
                📊 Desglose Detallado del Día
              </Typography>
              
              {/* TABLA RESPONSIVE */}
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  backgroundColor: darkProTokens.surfaceLevel4,
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  {/* HEADER */}
                  <thead>
                    <tr style={{ backgroundColor: darkProTokens.grayDark }}>
                      <th style={{ 
                        color: darkProTokens.textPrimary, 
                        padding: '16px 12px', 
                        textAlign: 'left',
                        fontWeight: 'bold',
                        borderBottom: `2px solid ${darkProTokens.grayMedium}`
                      }}>
                        Concepto
                      </th>
                      <th style={{ 
                        color: darkProTokens.primary, 
                        padding: '16px 12px', 
                        textAlign: 'right',
                        fontWeight: 'bold',
                        borderBottom: `2px solid ${darkProTokens.grayMedium}`
                      }}>
                        💵 Efectivo
                      </th>
                      <th style={{ 
                        color: darkProTokens.info, 
                        padding: '16px 12px', 
                        textAlign: 'right',
                        fontWeight: 'bold',
                        borderBottom: `2px solid ${darkProTokens.grayMedium}`
                      }}>
                        🏦 Transferencia
                      </th>
                      <th style={{ 
                        color: darkProTokens.success, 
                        padding: '16px 12px', 
                        textAlign: 'right',
                        fontWeight: 'bold',
                        borderBottom: `2px solid ${darkProTokens.grayMedium}`
                      }}>
                        💳 Débito
                      </th>
                      <th style={{ 
                        color: darkProTokens.error, 
                        padding: '16px 12px', 
                        textAlign: 'right',
                        fontWeight: 'bold',
                        borderBottom: `2px solid ${darkProTokens.grayMedium}`
                      }}>
                        💳 Crédito
                      </th>
                      <th style={{ 
                        color: darkProTokens.textSecondary, 
                        padding: '16px 12px', 
                        textAlign: 'center',
                        fontWeight: 'bold',
                        borderBottom: `2px solid ${darkProTokens.grayMedium}`
                      }}>
                        📊 Transacciones
                      </th>
                      <th style={{ 
                        color: darkProTokens.textPrimary, 
                        padding: '16px 12px', 
                        textAlign: 'right',
                        fontWeight: 'bold',
                        borderBottom: `2px solid ${darkProTokens.grayMedium}`
                      }}>
                        💰 Total
                      </th>
                    </tr>
                  </thead>
                  
                  {/* BODY */}
                  <tbody>
                    {/* FILA POS */}
                    <tr style={{ borderBottom: `1px solid ${darkProTokens.grayMedium}` }}>
                      <td style={{ 
                        color: darkProTokens.info, 
                        padding: '12px', 
                        fontWeight: '600'
                      }}>
                        💼 Punto de Venta
                      </td>
                      <td style={{ color: darkProTokens.primary, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.pos_efectivo)}
                      </td>
                      <td style={{ color: darkProTokens.info, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.pos_transferencia)}
                      </td>
                      <td style={{ color: darkProTokens.success, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.pos_debito)}
                      </td>
                      <td style={{ color: darkProTokens.error, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.pos_credito)}
                      </td>
                      <td style={{ color: darkProTokens.textSecondary, padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                        {editableData.pos_transactions}
                      </td>
                      <td style={{ color: darkProTokens.textPrimary, padding: '12px', textAlign: 'right', fontWeight: '700' }}>
                        {formatPrice(totals.pos_total)}
                      </td>
                    </tr>
                    
                    {/* FILA ABONOS */}
                    <tr style={{ borderBottom: `1px solid ${darkProTokens.grayMedium}` }}>
                      <td style={{ 
                        color: darkProTokens.warning, 
                        padding: '12px', 
                        fontWeight: '600'
                      }}>
                        💰 Abonos / Apartados
                      </td>
                      <td style={{ color: darkProTokens.primary, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.abonos_efectivo)}
                      </td>
                      <td style={{ color: darkProTokens.info, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.abonos_transferencia)}
                      </td>
                      <td style={{ color: darkProTokens.success, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.abonos_debito)}
                      </td>
                      <td style={{ color: darkProTokens.error, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.abonos_credito)}
                      </td>
                      <td style={{ color: darkProTokens.textSecondary, padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                        {editableData.abonos_transactions}
                      </td>
                      <td style={{ color: darkProTokens.textPrimary, padding: '12px', textAlign: 'right', fontWeight: '700' }}>
                        {formatPrice(totals.abonos_total)}
                      </td>
                    </tr>
                    
                    {/* FILA MEMBRESÍAS */}
                    <tr style={{ borderBottom: `1px solid ${darkProTokens.grayMedium}` }}>
                      <td style={{ 
                        color: darkProTokens.success, 
                        padding: '12px', 
                        fontWeight: '600'
                      }}>
                        🎫 Membresías
                      </td>
                      <td style={{ color: darkProTokens.primary, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.membership_efectivo)}
                      </td>
                      <td style={{ color: darkProTokens.info, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.membership_transferencia)}
                      </td>
                      <td style={{ color: darkProTokens.success, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.membership_debito)}
                      </td>
                      <td style={{ color: darkProTokens.error, padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                        {formatPrice(editableData.membership_credito)}
                      </td>
                      <td style={{ color: darkProTokens.textSecondary, padding: '12px', textAlign: 'center', fontWeight: '600' }}>
                        {editableData.membership_transactions}
                      </td>
                      <td style={{ color: darkProTokens.textPrimary, padding: '12px', textAlign: 'right', fontWeight: '700' }}>
                        {formatPrice(totals.membership_total)}
                      </td>
                    </tr>
                    
                    {/* FILA SEPARADORA */}
                    <tr>
                      <td colSpan={7} style={{ 
                        height: '8px', 
                        backgroundColor: darkProTokens.grayDark,
                        border: 'none'
                      }}></td>
                    </tr>
                    
                    {/* FILA TOTALES */}
                    <tr style={{ 
                      backgroundColor: darkProTokens.grayDark,
                      borderTop: `2px solid ${darkProTokens.primary}`
                    }}>
                      <td style={{ 
                        color: darkProTokens.textPrimary, 
                        padding: '16px 12px', 
                        fontWeight: '700',
                        fontSize: '1.1rem'
                      }}>
                        💰 TOTALES GENERALES
                      </td>
                      <td style={{ 
                        color: darkProTokens.primary, 
                        padding: '16px 12px', 
                        textAlign: 'right', 
                        fontWeight: '700',
                        fontSize: '1.1rem'
                      }}>
                        {formatPrice(totals.total_efectivo)}
                      </td>
                      <td style={{ 
                        color: darkProTokens.info, 
                        padding: '16px 12px', 
                        textAlign: 'right', 
                        fontWeight: '700',
                        fontSize: '1.1rem'
                      }}>
                        {formatPrice(totals.total_transferencia)}
                      </td>
                      <td style={{ 
                        color: darkProTokens.success, 
                        padding: '16px 12px', 
                        textAlign: 'right', 
                        fontWeight: '700',
                        fontSize: '1.1rem'
                      }}>
                        {formatPrice(totals.total_debito)}
                      </td>
                      <td style={{ 
                        color: darkProTokens.error, 
                        padding: '16px 12px', 
                        textAlign: 'right', 
                        fontWeight: '700',
                        fontSize: '1.1rem'
                      }}>
                        {formatPrice(totals.total_credito)}
                      </td>
                      <td style={{ 
                        color: darkProTokens.textSecondary, 
                        padding: '16px 12px', 
                        textAlign: 'center', 
                        fontWeight: '700',
                        fontSize: '1.1rem'
                      }}>
                        {totals.total_transactions}
                      </td>
                      <td style={{ 
                        color: darkProTokens.primary, 
                        padding: '16px 12px', 
                        textAlign: 'right', 
                        fontWeight: '700',
                        fontSize: '1.2rem',
                        backgroundColor: `${darkProTokens.primary}20`,
                        borderRadius: '4px'
                      }}>
                        {formatPrice(totals.grand_total)}
                      </td>
                    </tr>
                    
                    {/* FILA GASTOS */}
                    {editableData.expenses_amount > 0 && (
                      <tr style={{ borderBottom: `1px solid ${darkProTokens.grayMedium}` }}>
                        <td style={{ 
                          color: darkProTokens.error, 
                          padding: '12px', 
                          fontWeight: '600'
                        }}>
                          💸 Gastos del Día
                        </td>
                        <td colSpan={5} style={{ 
                          color: darkProTokens.textDisabled, 
                          padding: '12px', 
                          textAlign: 'center',
                          fontStyle: 'italic'
                        }}>
                          — Gastos operativos —
                        </td>
                        <td style={{ 
                          color: darkProTokens.error, 
                          padding: '12px', 
                          textAlign: 'right', 
                          fontWeight: '700'
                        }}>
                          -{formatPrice(editableData.expenses_amount)}
                        </td>
                      </tr>
                    )}
                    
                    {/* FILA BALANCE FINAL */}
                    <tr style={{ 
                      backgroundColor: `${darkProTokens.success}20`,
                      borderTop: `2px solid ${darkProTokens.success}`
                    }}>
                      <td style={{ 
                        color: darkProTokens.success, 
                        padding: '16px 12px', 
                        fontWeight: '700',
                        fontSize: '1.2rem'
                      }}>
                        💚 BALANCE FINAL
                      </td>
                      <td colSpan={5} style={{ 
                        color: darkProTokens.textSecondary, 
                        padding: '16px 12px', 
                        textAlign: 'center',
                        fontWeight: '600'
                      }}>
                        Total Bruto - Gastos = Balance Neto
                      </td>
                      <td style={{ 
                        color: darkProTokens.success, 
                        padding: '16px 12px', 
                        textAlign: 'right', 
                        fontWeight: '700',
                        fontSize: '1.3rem',
                        backgroundColor: `${darkProTokens.success}30`,
                        borderRadius: '4px'
                      }}>
                        {formatPrice(totals.final_balance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>
              
              {/* ESTADÍSTICAS ADICIONALES */}
              <Box sx={{ mt: 3, p: 3, backgroundColor: darkProTokens.surfaceLevel3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                  📈 Estadísticas del Día
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: darkProTokens.primary, fontWeight: 'bold' }}>
                        {totals.total_transactions}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Total Transacciones
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: darkProTokens.info, fontWeight: 'bold' }}>
                        {totals.total_transactions > 0 ? formatPrice(totals.grand_total / totals.total_transactions) : '$0.00'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Promedio por Transacción
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 'bold' }}>
                        {totals.grand_total > 0 ? ((totals.total_efectivo / totals.grand_total) * 100).toFixed(1) : '0.0'}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Porcentaje Efectivo
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>

          {/* 🚀 BOTÓN CREAR CORTE */}
          <Card sx={{
            background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primary}CC)`,
            color: 'white'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" fontWeight="bold">
                    💾 Crear Corte de Caja
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Guardar corte con fecha: {selectedDate.toLocaleDateString('es-MX')} | 
                    Total: {formatPrice(totals.final_balance)} | 
                    Transacciones: {totals.total_transactions}
                  </Typography>
                                  </Grid>
                <Grid item xs={12} md={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleCreateCut}
                    disabled={creating || totals.grand_total <= 0}
                    startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    sx={{
                      backgroundColor: 'white',
                      color: darkProTokens.primary,
                      fontWeight: 'bold',
                      py: 2,
                      '&:hover': {
                        backgroundColor: darkProTokens.surfaceLevel1,
                      },
                      '&:disabled': {
                        backgroundColor: darkProTokens.grayMedium,
                        color: darkProTokens.textDisabled
                      }
                    }}
                  >
                    {creating ? 'Creando Corte...' : 'Crear Corte'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 🚨 ALERTAS DE ERROR/ÉXITO */}
          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Snackbar>

          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </Snackbar>

        </Stack>
      </Box>
    </LocalizationProvider>
  );
}
