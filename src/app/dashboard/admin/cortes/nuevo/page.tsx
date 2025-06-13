'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Divider,
  Avatar,
  Stack,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  InputAdornment
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as AttachMoneyIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  MonetizationOn as MonetizationOnIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  AutoMode as AutoModeIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
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

interface DailyData {
  date: string;
  timezone_info?: {
    mexico_date: string;
    utc_range: {
      start: string;
      end: string;
    };
    note: string;
  };
  pos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  abonos: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  memberships: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
  };
  totals: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
    total: number;
    transactions: number;
    commissions: number;
    net_amount: number;
  };
}

// 📊 INTERFACE PARA DATOS EDITABLES
interface EditableData {
  // POS
  pos_efectivo: number;
  pos_transferencia: number;
  pos_debito: number;
  pos_credito: number;
  pos_transactions: number;
  pos_commissions: number;
  
  // MEMBERSHIPS
  membership_efectivo: number;
  membership_transferencia: number;
  membership_debito: number;
  membership_credito: number;
  membership_transactions: number;
  membership_commissions: number;
  
  // GASTOS
  expenses_amount: number;
}

export default function NuevoCorteePage() {
  const router = useRouter();
  
  // 📅 FECHA ACTUAL EN MÉXICO COMO DEFAULT
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    const mexicoDateString = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Monterrey'
    }).format(now);
    return new Date(mexicoDateString + 'T12:00:00');
  });
  
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [editableData, setEditableData] = useState<EditableData>({
    pos_efectivo: 0,
    pos_transferencia: 0,
    pos_debito: 0,
    pos_credito: 0,
    pos_transactions: 0,
    pos_commissions: 0,
    membership_efectivo: 0,
    membership_transferencia: 0,
    membership_debito: 0,
    membership_credito: 0,
    membership_transactions: 0,
    membership_commissions: 0,
    expenses_amount: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [observations, setObservations] = useState('');
  const [cutExists, setCutExists] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [dataHasContent, setDataHasContent] = useState(false);

  // 🧮 CALCULAR TOTALES DINÁMICAMENTE
  const calculateTotals = () => {
    const pos_total = editableData.pos_efectivo + editableData.pos_transferencia + editableData.pos_debito + editableData.pos_credito;
    const membership_total = editableData.membership_efectivo + editableData.membership_transferencia + editableData.membership_debito + editableData.membership_credito;
    
    const total_efectivo = editableData.pos_efectivo + editableData.membership_efectivo;
    const total_transferencia = editableData.pos_transferencia + editableData.membership_transferencia;
    const total_debito = editableData.pos_debito + editableData.membership_debito;
    const total_credito = editableData.pos_credito + editableData.membership_credito;
    
    const grand_total = pos_total + membership_total;
    const total_transactions = editableData.pos_transactions + editableData.membership_transactions;
    const total_commissions = editableData.pos_commissions + editableData.membership_commissions;
    const net_amount = grand_total - total_commissions;
    const final_balance = net_amount - editableData.expenses_amount;
    
    return {
      pos_total,
      membership_total,
      total_efectivo,
      total_transferencia,
      total_debito,
      total_credito,
      grand_total,
      total_transactions,
      total_commissions,
      net_amount,
      final_balance
    };
  };

  // 🔍 CARGAR DATOS DEL DÍA SELECCIONADO
  const loadDailyData = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const dateString = date.toISOString().split('T')[0];
      console.log('🔍 Cargando datos para fecha:', dateString);
      
      const response = await fetch(`/api/cuts/daily-data?date=${dateString}`);
      const data = await response.json();
      
      if (data.success) {
        setDailyData(data);
        
        // 🔍 VERIFICAR SI HAY DATOS
        const hasData = data.totals.total > 0 || data.totals.transactions > 0;
        setDataHasContent(hasData);
        
        if (hasData) {
          // ✅ HAY DATOS - LLENAR CAMPOS EDITABLES
          setEditableData({
            pos_efectivo: data.pos.efectivo || 0,
            pos_transferencia: data.pos.transferencia || 0,
            pos_debito: data.pos.debito || 0,
            pos_credito: data.pos.credito || 0,
            pos_transactions: data.pos.transactions || 0,
            pos_commissions: data.pos.commissions || 0,
            membership_efectivo: data.memberships.efectivo || 0,
            membership_transferencia: data.memberships.transferencia || 0,
            membership_debito: data.memberships.debito || 0,
            membership_credito: data.memberships.credito || 0,
            membership_transactions: data.memberships.transactions || 0,
            membership_commissions: data.memberships.commissions || 0,
            expenses_amount: 0
          });
          setIsManualMode(false);
        } else {
          // ❌ NO HAY DATOS - ACTIVAR MODO MANUAL
          setIsManualMode(true);
          setEditableData({
            pos_efectivo: 0,
            pos_transferencia: 0,
            pos_debito: 0,
            pos_credito: 0,
            pos_transactions: 0,
            pos_commissions: 0,
            membership_efectivo: 0,
            membership_transferencia: 0,
            membership_debito: 0,
            membership_credito: 0,
            membership_transactions: 0,
            membership_commissions: 0,
            expenses_amount: 0
          });
        }
        
        // 🔍 VERIFICAR SI YA EXISTE CORTE PARA ESTA FECHA
        await checkExistingCut(dateString);
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

  // 🔍 VERIFICAR SI YA EXISTE CORTE
  const checkExistingCut = async (dateString: string) => {
    try {
      const response = await fetch(`/api/cuts/check-existing?date=${dateString}`);
      const data = await response.json();
      setCutExists(data.exists);
    } catch (error) {
      console.error('Error verificando corte existente:', error);
    }
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
        created_by: 'luishdz04',
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
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`✅ Corte creado exitosamente: ${result.cut_number}`);
        setTimeout(() => {
          router.push(`/dashboard/admin/cortes`);
        }, 2000);
      } else {
        setError(result.error || 'Error al crear el corte');
      }
    } catch (error) {
      console.error('Error creando corte:', error);
      setError('Error al crear el corte');
    } finally {
      setCreating(false);
    }
  };

  // 🔧 MANEJAR CAMBIOS EN CAMPOS EDITABLES
  const handleEditableChange = (field: keyof EditableData, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setEditableData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  // ⚡ EFECTOS
  useEffect(() => {
    loadDailyData(selectedDate);
  }, [selectedDate]);

  // 🔄 MANEJAR CAMBIO DE FECHA
  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
      setSuccess(null);
      setError(null);
    }
  };

  // 🧮 OBTENER TOTALES CALCULADOS
  const totals = calculateTotals();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        p: 4
      }}>
        {/* 🏷️ HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => router.push('/dashboard/admin/cortes')}
              sx={{ 
                color: darkProTokens.textSecondary,
                '&:hover': { color: darkProTokens.primary }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Avatar sx={{ 
              bgcolor: darkProTokens.roleAdmin, 
              width: 60, 
              height: 60 
            }}>
              <ReceiptIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                Crear Nuevo Corte
              </Typography>
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                📅 Gestión de cortes de caja • {isManualMode ? '🔧 Modo Manual' : '🤖 Modo Automático'}
              </Typography>
            </Box>
          </Box>
          
          {/* TOGGLE MODO */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isManualMode}
                  onChange={(e) => setIsManualMode(e.target.checked)}
                  disabled={!dataHasContent}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: darkProTokens.warning,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: darkProTokens.warning,
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {isManualMode ? <BuildIcon /> : <AutoModeIcon />}
                  <Typography variant="body2">
                    {isManualMode ? 'Modo Manual' : 'Modo Automático'}
                  </Typography>
                </Box>
              }
              sx={{ color: darkProTokens.textSecondary }}
            />
          </Box>
        </Box>

        {/* 🚨 MENSAJES DE ESTADO */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            </motion.div>
          )}
          
          {cutExists && !success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="warning" sx={{ mb: 3 }}>
                ⚠️ Ya existe un corte para la fecha seleccionada. Puedes crear uno nuevo si es necesario.
              </Alert>
            </motion.div>
          )}
          
          {!dataHasContent && !isManualMode && !loading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="info" sx={{ mb: 3 }}>
                ℹ️ No hay datos automáticos para esta fecha. Se ha activado el modo manual para ingresar datos manualmente.
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={4}>
          {/* 📅 CONFIGURACIÓN DEL CORTE */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `2px solid ${darkProTokens.roleAdmin}40`,
                borderRadius: 4,
                height: 'fit-content'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin, mb: 3 }}>
                    ⚙️ Configuración del Corte
                  </Typography>
                  
                  {/* SELECTOR DE FECHA */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📅 Fecha del Corte
                    </Typography>
                    <DatePicker
                      value={selectedDate}
                      onChange={handleDateChange}
                      maxDate={new Date()}
                      format="dd/MM/yyyy"
                      label="Seleccionar fecha"
                      sx={{
                        width: '100%',
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkProTokens.surfaceLevel4,
                          color: darkProTokens.textPrimary,
                          '& fieldset': {
                            borderColor: darkProTokens.grayMedium,
                          },
                          '&:hover fieldset': {
                            borderColor: darkProTokens.primary,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: darkProTokens.primary,
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: darkProTokens.textSecondary,
                        },
                        '& .MuiSvgIcon-root': {
                          color: darkProTokens.primary,
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: darkProTokens.textDisabled, mt: 1, display: 'block' }}>
                      💡 Puedes seleccionar cualquier fecha pasada sin límite
                    </Typography>
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* INFORMACIÓN DEL CORTE */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📋 Información del Corte
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Nombre del corte:
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          Corte {formatDate(selectedDate.toISOString().split('T')[0])}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Responsable:
                        </Typography>
                        <Chip
                          label="luishdz04"
                          sx={{
                            backgroundColor: `${darkProTokens.info}20`,
                            color: darkProTokens.info,
                            fontWeight: 600,
                            mt: 0.5
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Tipo de corte:
                        </Typography>
                        <Chip
                          icon={isManualMode ? <BuildIcon /> : <AutoModeIcon />}
                          label={isManualMode ? 'Manual' : 'Automático'}
                          sx={{
                            backgroundColor: isManualMode ? `${darkProTokens.warning}20` : `${darkProTokens.success}20`,
                            color: isManualMode ? darkProTokens.warning : darkProTokens.success,
                            fontWeight: 600,
                            mt: 0.5
                          }}
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Fecha de creación:
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                          {new Date().toLocaleString('es-MX', {
                            timeZone: 'America/Monterrey',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* GASTOS */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      💸 Gastos del Día
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={editableData.expenses_amount}
                      onChange={(e) => handleEditableChange('expenses_amount', e.target.value)}
                      placeholder="0.00"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkProTokens.surfaceLevel4,
                          color: darkProTokens.textPrimary,
                          '& fieldset': {
                            borderColor: darkProTokens.grayMedium,
                          },
                          '&:hover fieldset': {
                            borderColor: darkProTokens.error,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: darkProTokens.error,
                          },
                        },
                      }}
                    />
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* OBSERVACIONES */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📝 Observaciones (Opcional)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Agregar comentarios o notas sobre este corte..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: darkProTokens.surfaceLevel4,
                          color: darkProTokens.textPrimary,
                          '& fieldset': {
                            borderColor: darkProTokens.grayMedium,
                          },
                          '&:hover fieldset': {
                            borderColor: darkProTokens.primary,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: darkProTokens.primary,
                          },
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: darkProTokens.textDisabled,
                        },
                      }}
                    />
                  </Box>

                  {/* TOTALES CALCULADOS */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      🧮 Resumen Calculado
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Total Bruto:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.primary, fontWeight: 600 }}>
                          {formatPrice(totals.grand_total)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Comisiones:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.warning, fontWeight: 600 }}>
                          -{formatPrice(totals.total_commissions)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Gastos:
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.error, fontWeight: 600 }}>
                          -{formatPrice(editableData.expenses_amount)}
                        </Typography>
                      </Box>
                      <Divider sx={{ backgroundColor: darkProTokens.grayMedium }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>
                          Balance Final:
                        </Typography>
                        <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                          {formatPrice(totals.final_balance)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* BOTONES DE ACCIÓN */}
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => router.push('/dashboard/admin/cortes')}
                      sx={{
                        borderColor: darkProTokens.textSecondary,
                        color: darkProTokens.textSecondary,
                        py: 1.5,
                        '&:hover': {
                          borderColor: darkProTokens.textPrimary,
                          backgroundColor: `${darkProTokens.textSecondary}20`
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleCreateCut}
                      disabled={creating || loading}
                      startIcon={creating ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{
                        background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.primaryHover})`,
                        color: darkProTokens.textPrimary,
                        py: 1.5,
                        fontWeight: 700,
                        '&:disabled': {
                          background: darkProTokens.grayMedium,
                          color: darkProTokens.textDisabled
                        }
                      }}
                    >
                      {creating ? 'Creando...' : 'Crear Corte'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* 📊 DATOS EDITABLES */}
          <Grid item xs={12} md={8}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress size={60} sx={{ color: darkProTokens.roleAdmin }} />
              </Box>
            )}

            {!loading && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Stack spacing={3}>
                  {/* SECCIÓN POS */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `2px solid ${darkProTokens.info}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: darkProTokens.info }}>
                          <ReceiptIcon />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                          💼 Punto de Venta
                        </Typography>
                        <Chip
                          label={formatPrice(totals.pos_total)}
                          sx={{
                            backgroundColor: `${darkProTokens.info}20`,
                            color: darkProTokens.info,
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        />
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Efectivo"
                            type="number"
                            value={editableData.pos_efectivo}
                            onChange={(e) => handleEditableChange('pos_efectivo', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.primary,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Transferencia"
                            type="number"
                            value={editableData.pos_transferencia}
                            onChange={(e) => handleEditableChange('pos_transferencia', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.info,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Tarjeta Débito"
                            type="number"
                            value={editableData.pos_debito}
                            onChange={(e) => handleEditableChange('pos_debito', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.success,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Tarjeta Crédito"
                            type="number"
                            value={editableData.pos_credito}
                            onChange={(e) => handleEditableChange('pos_credito', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.error,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Transacciones"
                            type="number"
                            value={editableData.pos_transactions}
                            onChange={(e) => handleEditableChange('pos_transactions', e.target.value)}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.textSecondary,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Comisiones"
                            type="number"
                            value={editableData.pos_commissions}
                            onChange={(e) => handleEditableChange('pos_commissions', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.warning,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* SECCIÓN MEMBRESÍAS */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `2px solid ${darkProTokens.success}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar sx={{ bgcolor: darkProTokens.success }}>
                          <AssessmentIcon />
                        </Avatar>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                          🎫 Membresías
                        </Typography>
                        <Chip
                          label={formatPrice(totals.membership_total)}
                          sx={{
                            backgroundColor: `${darkProTokens.success}20`,
                            color: darkProTokens.success,
                            fontWeight: 700,
                            fontSize: '1rem'
                          }}
                        />
                      </Box>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Efectivo"
                            type="number"
                            value={editableData.membership_efectivo}
                            onChange={(e) => handleEditableChange('membership_efectivo', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.primary,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Transferencia"
                            type="number"
                            value={editableData.membership_transferencia}
                            onChange={(e) => handleEditableChange('membership_transferencia', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.info,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Tarjeta Débito"
                            type="number"
                            value={editableData.membership_debito}
                            onChange={(e) => handleEditableChange('membership_debito', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.success,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={3}>
                          <TextField
                            fullWidth
                            label="Tarjeta Crédito"
                            type="number"
                            value={editableData.membership_credito}
                            onChange={(e) => handleEditableChange('membership_credito', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.error,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Transacciones"
                            type="number"
                            value={editableData.membership_transactions}
                            onChange={(e) => handleEditableChange('membership_transactions', e.target.value)}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.textSecondary,
                              },
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Comisiones"
                            type="number"
                            value={editableData.membership_commissions}
                            onChange={(e) => handleEditableChange('membership_commissions', e.target.value)}
                            InputProps={{
                              startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: darkProTokens.surfaceLevel4,
                                color: darkProTokens.textPrimary,
                              },
                              '& .MuiInputLabel-root': {
                                color: darkProTokens.warning,
                              },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* RESUMEN FINAL */}
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `2px solid ${darkProTokens.primary}40`,
                    borderRadius: 4
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.primary, mb: 3 }}>
                        💳 Resumen por Métodos de Pago
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.primary}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.primary, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <AttachMoneyIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                              {formatPrice(totals.total_efectivo)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Efectivo
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.info}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.info, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <AccountBalanceIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                              {formatPrice(totals.total_transferencia)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Transferencia
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.success}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.success, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <CreditCardIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                              {formatPrice(totals.total_debito)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Tarjeta Débito
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Paper sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                            border: `2px solid ${darkProTokens.error}40`,
                            borderRadius: 3
                          }}>
                            <Avatar sx={{ 
                              bgcolor: darkProTokens.error, 
                              width: 48, 
                              height: 48,
                              mx: 'auto',
                              mb: 2 
                            }}>
                              <CreditCardIcon />
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                              {formatPrice(totals.total_credito)}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
                              Tarjeta Crédito
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              </motion.div>
            )}
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}
