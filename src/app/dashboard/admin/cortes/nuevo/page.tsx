'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// 🎨 DARK PRO SYSTEM - TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  roleAdmin: '#E91E63'
};

// 💰 Función para formatear precios
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}

// 📅 Función para formatear fechas
function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

// 🕒 Función para formatear fecha y hora
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-MX', {
    timeZone: 'America/Monterrey',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

interface DailyData {
  date: string;
  pos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    mixto: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  abonos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    mixto: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  memberships: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    mixto: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  totals: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    mixto: number;
    total: number;
    transactions: number;
    commissions: number;
    net_amount: number;
  };
}

interface CutFormData {
  cut_date: string;
  pos_efectivo: number;
  pos_transferencia: number;
  pos_debito: number;
  pos_credito: number;
  pos_mixto: number;
  pos_total: number;
  pos_transactions: number;
  pos_commissions: number;
  membership_efectivo: number;
  membership_transferencia: number;
  membership_debito: number;
  membership_credito: number;
  membership_mixto: number;
  membership_total: number;
  membership_transactions: number;
  membership_commissions: number;
  abonos_efectivo: number;
  abonos_transferencia: number;
  abonos_debito: number;
  abonos_credito: number;
  abonos_mixto: number;
  abonos_total: number;
  abonos_transactions: number;
  abonos_commissions: number;
  expenses_amount: number;
  notes: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function NuevoCorte() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [originalData, setOriginalData] = useState<DailyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [existingCut, setExistingCut] = useState<any>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // 📅 Fecha actual en Monterrey
  const [selectedDate] = useState(() => {
    const now = new Date();
    const monterreyTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    return monterreyTime.toISOString().split('T')[0];
  });

  const [formData, setFormData] = useState<CutFormData>({
    cut_date: selectedDate,
    pos_efectivo: 0,
    pos_transferencia: 0,
    pos_debito: 0,
    pos_credito: 0,
    pos_mixto: 0,
    pos_total: 0,
    pos_transactions: 0,
    pos_commissions: 0,
    membership_efectivo: 0,
    membership_transferencia: 0,
    membership_debito: 0,
    membership_credito: 0,
    membership_mixto: 0,
    membership_total: 0,
    membership_transactions: 0,
    membership_commissions: 0,
    abonos_efectivo: 0,
    abonos_transferencia: 0,
    abonos_debito: 0,
    abonos_credito: 0,
    abonos_mixto: 0,
    abonos_total: 0,
    abonos_transactions: 0,
    abonos_commissions: 0,
    expenses_amount: 0,
    notes: ''
  });

  // ✅ VALIDACIONES COMPLETAS
  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Validar que no haya valores negativos en montos críticos
    const criticalFields = [
      'pos_efectivo', 'pos_transferencia', 'pos_debito', 'pos_credito', 'pos_mixto',
      'membership_efectivo', 'membership_transferencia', 'membership_debito', 'membership_credito', 'membership_mixto',
      'abonos_efectivo', 'abonos_transferencia', 'abonos_debito', 'abonos_credito', 'abonos_mixto',
      'expenses_amount'
    ];

    criticalFields.forEach(field => {
      if (formData[field as keyof CutFormData] < 0) {
        errors.push({
          field,
          message: `${field.replace(/_/g, ' ')} no puede ser negativo`
        });
      }
    });

    // Validar transacciones
    if (formData.pos_transactions < 0 || formData.membership_transactions < 0 || formData.abonos_transactions < 0) {
      errors.push({
        field: 'transactions',
        message: 'El número de transacciones debe ser mayor o igual a 0'
      });
    }

    // Validar notas (opcional pero si existe, mínimo 5 caracteres)
    if (formData.notes && formData.notes.length > 0 && formData.notes.length < 5) {
      errors.push({
        field: 'notes',
        message: 'Las notas deben tener al menos 5 caracteres'
      });
    }

    return errors;
  };

  // 🔍 VERIFICAR SI YA EXISTE UN CORTE PARA ESTA FECHA
  const checkExistingCut = async (date: string) => {
    try {
      const response = await fetch(`/api/cuts/check-existing?date=${date}`);
      const result = await response.json();
      
      if (result.exists) {
        setExistingCut(result.cut);
        setSnackbarMessage(`Ya existe un corte para ${formatDate(date)}`);
        setShowSnackbar(true);
      } else {
        setExistingCut(null);
      }
    } catch (error) {
      console.error('Error verificando corte existente:', error);
    }
  };

  // ✅ CARGAR DATOS DEL DÍA
  const loadDailyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/cuts/daily-data?date=${selectedDate}`);
      const data = await response.json();
      
      if (data.success) {
        setDailyData(data);
        setOriginalData(data);
        
        // Pre-llenar formulario con datos del día
        setFormData(prev => ({
          ...prev,
          pos_efectivo: data.pos.efectivo,
          pos_transferencia: data.pos.transferencia,
          pos_debito: data.pos.debito,
          pos_credito: data.pos.credito,
          pos_mixto: data.pos.mixto,
          pos_total: data.pos.total,
          pos_transactions: data.pos.transactions,
          pos_commissions: data.pos.commissions,
          membership_efectivo: data.memberships.efectivo,
          membership_transferencia: data.memberships.transferencia,
          membership_debito: data.memberships.debito,
          membership_credito: data.memberships.credito,
          membership_mixto: data.memberships.mixto,
          membership_total: data.memberships.total,
          membership_transactions: data.memberships.transactions,
          membership_commissions: data.memberships.commissions,
          abonos_efectivo: data.abonos.efectivo,
          abonos_transferencia: data.abonos.transferencia,
          abonos_debito: data.abonos.debito,
          abonos_credito: data.abonos.credito,
          abonos_mixto: data.abonos.mixto,
          abonos_total: data.abonos.total,
          abonos_transactions: data.abonos.transactions,
          abonos_commissions: data.abonos.commissions
        }));
        
        setHasChanges(false);
      } else {
        setError('Error al cargar datos del día');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar datos del día');
    } finally {
      setLoading(false);
    }
  };

  // 🔄 RESTABLECER DATOS ORIGINALES
  const resetToOriginal = () => {
    if (originalData) {
      setFormData(prev => ({
        ...prev,
        pos_efectivo: originalData.pos.efectivo,
        pos_transferencia: originalData.pos.transferencia,
        pos_debito: originalData.pos.debito,
        pos_credito: originalData.pos.credito,
        pos_mixto: originalData.pos.mixto,
        pos_total: originalData.pos.total,
        pos_transactions: originalData.pos.transactions,
        pos_commissions: originalData.pos.commissions,
        membership_efectivo: originalData.memberships.efectivo,
        membership_transferencia: originalData.memberships.transferencia,
        membership_debito: originalData.memberships.debito,
        membership_credito: originalData.memberships.credito,
        membership_mixto: originalData.memberships.mixto,
        membership_total: originalData.memberships.total,
        membership_transactions: originalData.memberships.transactions,
        membership_commissions: originalData.memberships.commissions,
        abonos_efectivo: originalData.abonos.efectivo,
        abonos_transferencia: originalData.abonos.transferencia,
        abonos_debito: originalData.abonos.debito,
        abonos_credito: originalData.abonos.credito,
        abonos_mixto: originalData.abonos.mixto,
        abonos_total: originalData.abonos.total,
        abonos_transactions: originalData.abonos.transactions,
        abonos_commissions: originalData.abonos.commissions,
        expenses_amount: 0,
        notes: ''
      }));
      setHasChanges(false);
      setValidationErrors([]);
      setSnackbarMessage('Datos restablecidos a los valores originales');
      setShowSnackbar(true);
    }
  };

  // 📝 MANEJAR CAMBIOS EN CAMPOS
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Limpiar errores de validación del campo específico
    setValidationErrors(prev => prev.filter(error => error.field !== field));
  };

  // 💾 GUARDAR CORTE CON VALIDACIONES
  const handleSave = async () => {
    try {
      // Validar formulario
      const errors = validateForm();
      setValidationErrors(errors);
      
      if (errors.length > 0) {
        setError('Por favor corrige los errores antes de guardar');
        return;
      }

      // Si ya existe un corte, mostrar advertencia
      if (existingCut) {
        setShowConfirmDialog(true);
        return;
      }

      await saveCut();
    } catch (error) {
      console.error('Error en validación:', error);
      setError('Error en la validación del formulario');
    }
  };

  // 💾 GUARDAR CORTE (FUNCIÓN INTERNA)
  const saveCut = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/cuts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // ID temporal
          created_by_name: 'luishdz04'
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setSnackbarMessage('¡Corte guardado exitosamente!');
        setShowSnackbar(true);
        
        setTimeout(() => {
          router.push('/dashboard/admin/cortes');
        }, 2000);
      } else {
        setError(result.error || 'Error al guardar el corte');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al guardar el corte');
    } finally {
      setSaving(false);
      setShowConfirmDialog(false);
    }
  };

  // 🧮 CALCULAR TOTALES DINÁMICOS
  const calculateTotals = () => {
    const totalEfectivo = formData.pos_efectivo + formData.membership_efectivo + formData.abonos_efectivo;
    const totalTransferencia = formData.pos_transferencia + formData.membership_transferencia + formData.abonos_transferencia;
    const totalDebito = formData.pos_debito + formData.membership_debito + formData.abonos_debito;
    const totalCredito = formData.pos_credito + formData.membership_credito + formData.abonos_credito;
    const totalMixto = formData.pos_mixto + formData.membership_mixto + formData.abonos_mixto;
    const grandTotal = totalEfectivo + totalTransferencia + totalDebito + totalCredito + totalMixto;
    const totalTransactions = formData.pos_transactions + formData.membership_transactions + formData.abonos_transactions;
    const totalCommissions = formData.pos_commissions + formData.membership_commissions + formData.abonos_commissions;
    const netAmount = grandTotal - totalCommissions;
    const finalBalance = netAmount - formData.expenses_amount;

    return {
      totalEfectivo,
      totalTransferencia,
      totalDebito,
      totalCredito,
      totalMixto,
      grandTotal,
      totalTransactions,
      totalCommissions,
      netAmount,
      finalBalance
    };
  };

  const totals = calculateTotals();

  // ⚡ EFECTOS
  useEffect(() => {
    loadDailyData();
    checkExistingCut(selectedDate);
  }, [selectedDate]);

  // 🎨 COMPONENTE DE CAMPO EDITABLE
  const EditableField = ({ 
    label, 
    value, 
    field, 
    type = 'number',
    disabled = false,
    startAdornment = null 
  }: {
    label: string;
    value: any;
    field: string;
    type?: string;
    disabled?: boolean;
    startAdornment?: any;
  }) => {
    const hasError = validationErrors.some(error => error.field === field);
    const errorMessage = validationErrors.find(error => error.field === field)?.message;

    return (
      <TextField
        fullWidth
        label={label}
        type={type}
        value={value}
        disabled={disabled || (!editMode && type === 'number')}
        error={hasError}
        helperText={hasError ? errorMessage : ''}
        onChange={(e) => handleFieldChange(field, type === 'number' ? Number(e.target.value) || 0 : e.target.value)}
        InputProps={{
          startAdornment: startAdornment,
          readOnly: !editMode && type === 'number'
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: hasError ? darkProTokens.error : darkProTokens.grayMedium,
            },
            '&:hover fieldset': {
              borderColor: hasError ? darkProTokens.errorHover : (editMode ? darkProTokens.primary : darkProTokens.grayMedium),
            },
            '&.Mui-focused fieldset': {
              borderColor: hasError ? darkProTokens.error : darkProTokens.primary,
            },
            '&.Mui-disabled fieldset': {
              borderColor: darkProTokens.grayDark,
            },
          },
          '& .MuiInputLabel-root': {
            color: hasError ? darkProTokens.error : darkProTokens.textSecondary,
          },
          '& .MuiInputBase-input': {
            color: disabled ? darkProTokens.textDisabled : darkProTokens.textPrimary,
          },
          '& .MuiFormHelperText-root': {
            color: darkProTokens.error,
          },
        }}
      />
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
      p: 4
    }}>
      {/* 🏷️ HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            bgcolor: darkProTokens.roleAdmin, 
            width: 50, 
            height: 50 
          }}>
            <ReceiptIcon sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
              Crear Nuevo Corte
            </Typography>
            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
              📅 {formatDate(selectedDate)} • Corte de caja del día
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Recargar datos del día">
            <IconButton
              onClick={loadDailyData}
              disabled={loading}
              sx={{ color: darkProTokens.info }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={editMode ? "Bloquear edición" : "Permitir edición manual"}>
            <IconButton
              onClick={() => setEditMode(!editMode)}
              sx={{ color: editMode ? darkProTokens.warning : darkProTokens.grayMuted }}
            >
              {editMode ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
          
          {hasChanges && (
            <Button
              variant="outlined"
              onClick={resetToOriginal}
              sx={{
                borderColor: darkProTokens.warning,
                color: darkProTokens.warning,
                '&:hover': {
                  borderColor: darkProTokens.warningHover,
                  backgroundColor: `${darkProTokens.warning}20`
                }
              }}
            >
              Restablecer
            </Button>
          )}
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard/admin/cortes')}
            sx={{
              borderColor: darkProTokens.grayMedium,
              color: darkProTokens.textSecondary,
              '&:hover': {
                borderColor: darkProTokens.grayLight,
                backgroundColor: `${darkProTokens.grayMedium}20`
              }
            }}
          >
            Volver
          </Button>
          
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 700,
              px: 3
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Corte'}
          </Button>
        </Box>
      </Box>

      {/* 🚨 ALERTAS Y ESTADOS */}
      <AnimatePresence>
        {existingCut && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>
                  ⚠️ Ya existe un corte para esta fecha (#{existingCut.cut_number}) creado el {formatDateTime(existingCut.created_at)}
                </Typography>
                <Button
                  size="small"
                  onClick={() => router.push(`/dashboard/admin/cortes/${existingCut.id}`)}
                  sx={{ color: darkProTokens.warning }}
                >
                  Ver Corte
                </Button>
              </Box>
            </Alert>
          </motion.div>
        )}

        {validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Errores de validación:</Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error.message}</li>
                ))}
              </ul>
            </Alert>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ Corte guardado exitosamente. Redirigiendo...
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔄 LOADING STATE */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={40} sx={{ color: darkProTokens.roleAdmin }} />
        </Box>
      )}

      {/* 📊 CONTENIDO PRINCIPAL */}
      {!loading && dailyData && (
        <Grid container spacing={4}>
          {/* 📈 RESUMEN CONSOLIDADO */}
          <Grid xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.roleAdmin}30`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin }}>
                      💰 Resumen Consolidado
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Chip
                        label={`${totals.totalTransactions} transacciones`}
                        sx={{
                          backgroundColor: `${darkProTokens.info}20`,
                          color: darkProTokens.info,
                          fontWeight: 600
                        }}
                      />
                      {editMode && (
                        <Chip
                          icon={<EditIcon />}
                          label="Modo de edición activo"
                          sx={{
                            backgroundColor: `${darkProTokens.warning}20`,
                            color: darkProTokens.warning,
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Grid container spacing={3}>
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          {formatPrice(totals.grandTotal)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Ingresos Totales
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                          {formatPrice(totals.totalCommissions)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Comisiones
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                          {formatPrice(formData.expenses_amount)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Gastos
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                          {formatPrice(totals.netAmount)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Monto Neto
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid xs={12} md={2.4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" fontWeight="bold" sx={{ 
                          color: totals.finalBalance >= 0 ? darkProTokens.success : darkProTokens.error 
                        }}>
                          {formatPrice(totals.finalBalance)}
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textSecondary }}>
                          Balance Final
                        </Typography>
                        {totals.finalBalance < 0 && (
                          <Tooltip title="El balance final es negativo">
                            <WarningIcon sx={{ color: darkProTokens.error, fontSize: 16, ml: 1 }} />
                          </Tooltip>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 💸 GASTOS Y NOTAS */}
          <Grid xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.error}30`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.error, mb: 3 }}>
                    💸 Gastos del Día
                  </Typography>
                  
                  <EditableField
                    label="Monto de Gastos"
                    value={formData.expenses_amount}
                    field="expenses_amount"
                    startAdornment={<InputAdornment position="start">$</InputAdornment>}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <EditableField
                      label="Notas y Observaciones"
                      value={formData.notes}
                      field="notes"
                      type="text"
                    />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* ℹ️ INFORMACIÓN DEL CORTE */}
          <Grid xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.info}30`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.info, mb: 3 }}>
                    ℹ️ Información del Corte
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Fecha del corte:
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formatDate(selectedDate)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Total de transacciones:
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {totals.totalTransactions}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Usuario:
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        luishdz04
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Hora de creación:
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {new Date().toLocaleTimeString('es-MX', { 
                          timeZone: 'America/Monterrey',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Estado:
                      </Typography>
                      <Chip
                        label={hasChanges ? "Modificado" : "Sin cambios"}
                        size="small"
                        sx={{
                          backgroundColor: hasChanges ? `${darkProTokens.warning}20` : `${darkProTokens.success}20`,
                          color: hasChanges ? darkProTokens.warning : darkProTokens.success,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    
                    <Divider sx={{ backgroundColor: darkProTokens.grayMedium }} />
                    
                    <Alert 
                      severity="info" 
                      sx={{ 
                        backgroundColor: `${darkProTokens.info}20`,
                        border: `1px solid ${darkProTokens.info}30`,
                        '& .MuiAlert-message': {
                          color: darkProTokens.textPrimary
                        }
                      }}
                    >
                      {editMode 
                        ? "🔓 Modo de edición activo. Puedes modificar cualquier valor antes de guardar."
                        : "🔒 Los datos están bloqueados. Activa el modo de edición para modificar valores."
                      }
                    </Alert>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}

      {/* 🔔 DIALOG DE CONFIRMACIÓN */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: darkProTokens.surfaceLevel2,
            color: darkProTokens.textPrimary
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          color: darkProTokens.warning
        }}>
          <WarningIcon />
          Confirmar Creación de Corte
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Ya existe un corte para la fecha {formatDate(selectedDate)}:
          </Typography>
          <Box sx={{ 
            p: 2, 
            backgroundColor: darkProTokens.surfaceLevel3, 
            borderRadius: 2,
            mb: 2
          }}>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              Corte #{existingCut?.cut_number}
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              Creado: {existingCut && formatDateTime(existingCut.created_at)}
            </Typography>
          </Box>
          <Typography>
            ¿Estás seguro de que quieres crear un nuevo corte para esta fecha?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowConfirmDialog(false)}
            sx={{ color: darkProTokens.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={saveCut}
            variant="contained"
            sx={{
              backgroundColor: darkProTokens.warning,
              color: darkProTokens.textPrimary
            }}
          >
            Crear Corte
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🍞 SNACKBAR */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        message={snackbarMessage}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: darkProTokens.surfaceLevel3,
            color: darkProTokens.textPrimary
          }
        }}
      />
    </Box>
  );
}
