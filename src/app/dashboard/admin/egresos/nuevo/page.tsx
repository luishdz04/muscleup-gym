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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Collapse,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  MoneyOff as MoneyOffIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  Edit as EditIcon,
  AutoMode as AutoModeIcon,
  Build as BuildIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  DateRange as DateRangeIcon,
  Person as PersonIcon,
  LocalOffer as LocalOfferIcon,
  Home as HomeIcon,
  Restaurant as RestaurantIcon,
  DirectionsCar as DirectionsCarIcon,
  LocalGasStation as LocalGasStationIcon,
  ShoppingCart as ShoppingCartIcon,
  CleaningServices as CleaningServicesIcon,
  Campaign as CampaignIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// 🎨 DARK PRO SYSTEM - TOKENS (IGUAL QUE CORTES)
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

// ✅ FUNCIONES LOCALES PARA FECHAS MÉXICO (IGUAL QUE CORTES)
function getMexicoDateLocal(): string {
  const now = new Date();
  const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMexicoTimeLocal(date: Date): string {
  return date.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function formatDateLocal(dateString: string): string {
  try {
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Mexico_City'
    });
  } catch (error) {
    console.error('❌ Error formateando fecha:', dateString, error);
    const date = new Date(dateString + 'T12:00:00');
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const weekdays = [
      'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
    ];
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${weekday}, ${day} de ${month} de ${year}`;
  }
}

// 🔍 DETECTOR DE RANGO (IGUAL QUE CORTES)
function getMexicoDateRangeDisplay(dateString: string): string {
  try {
    const date = new Date(dateString + 'T12:00:00');
    const day = date.getDate();
    const month = date.toLocaleDateString('es-MX', { 
      month: 'long',
      timeZone: 'America/Mexico_City' 
    });
    const year = date.getFullYear();
    
    return `${day} de ${month} de ${year}, 00:00 - ${day} de ${month} de ${year}, 23:59`;
  } catch (error) {
    return `${dateString} 00:00 - ${dateString} 23:59`;
  }
}

// ✅ FUNCIÓN PARA TIMESTAMP DB (IGUAL QUE CORTES)
function createTimestampForDB(): string {
  const now = new Date();
  const mexicoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  
  const year = mexicoTime.getFullYear();
  const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoTime.getDate()).padStart(2, '0');
  const hours = String(mexicoTime.getHours()).padStart(2, '0');
  const minutes = String(mexicoTime.getMinutes()).padStart(2, '0');
  const seconds = String(mexicoTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-06:00`;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}

// ✅ TIPOS DE EGRESO SEGÚN CONSTRAINT DE TABLA
const EXPENSE_TYPES = [
  { value: 'nomina', label: 'Nómina', icon: <GroupsIcon />, color: darkProTokens.error },
  { value: 'suplementos', label: 'Suplementos', icon: <LocalOfferIcon />, color: darkProTokens.warning },
  { value: 'servicios', label: 'Servicios', icon: <HomeIcon />, color: darkProTokens.success },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: <BuildIcon />, color: darkProTokens.info },
  { value: 'limpieza', label: 'Limpieza', icon: <CleaningServicesIcon />, color: darkProTokens.primary },
  { value: 'marketing', label: 'Marketing', icon: <CampaignIcon />, color: darkProTokens.roleAdmin },
  { value: 'equipamiento', label: 'Equipamiento', icon: <AssessmentIcon />, color: darkProTokens.warning },
  { value: 'otros', label: 'Otros', icon: <MoneyOffIcon />, color: darkProTokens.textSecondary }
];

// ✅ INTERFACE PARA USUARIO (IGUAL QUE CORTES)
interface CurrentUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  rol?: string;
  username?: string;
}

// ✅ INTERFACE PARA DATOS DEL EGRESO
interface ExpenseData {
  expense_date: string;
  expense_type: string;
  description: string;
  amount: number;
  receipt_number: string;
  notes: string;
}

interface RelatedCutData {
  exists: boolean;
  cut?: {
    id: string;
    cut_number: string;
    expenses_amount: number;
    final_balance: number;
  };
}

export default function NuevoEgresoPage() {
  const router = useRouter();
  
  // ✅ ESTADOS (IGUAL QUE CORTES)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const mexicoDateString = getMexicoDateLocal();
    const mexicoDate = new Date(mexicoDateString + 'T12:00:00');
    
    console.log('🇲🇽 Fecha actual México (crear egreso):', mexicoDateString);
    console.log('🌍 Fecha actual UTC:', new Date().toISOString().split('T')[0]);
    
    return mexicoDate;
  });
  
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // ✅ ESTADO PARA USUARIO AUTENTICADO (IGUAL QUE CORTES)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  // ✅ ESTADOS ESPECÍFICOS PARA EGRESO
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    expense_date: '',
    expense_type: '',
    description: '',
    amount: 0,
    receipt_number: '',
    notes: ''
  });
  
  const [relatedCutData, setRelatedCutData] = useState<RelatedCutData | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // ✅ FUNCIÓN: Cargar usuario autenticado (IGUAL QUE CORTES)
  const loadCurrentUser = async () => {
    try {
      setLoadingUser(true);
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success && data.user) {
        setCurrentUser(data.user);
        console.log('👤 Usuario autenticado cargado:', data.user);
      } else {
        console.warn('⚠️ No se pudo cargar usuario autenticado');
        setCurrentUser({
          id: 'unknown',
          firstName: 'luishdz04',
          email: 'luis@muscleup.com',
          username: 'luishdz04'
        });
      }
    } catch (error) {
      console.error('Error cargando usuario:', error);
      setCurrentUser({
        id: 'unknown',
        firstName: 'luishdz04',
        email: 'luis@muscleup.com',
        username: 'luishdz04'
      });
    } finally {
      setLoadingUser(false);
    }
  };

  // ✅ FUNCIÓN: Obtener nombre del usuario (IGUAL QUE CORTES)
  const getCurrentUserDisplayName = () => {
    if (loadingUser) return 'Cargando...';
    if (!currentUser) return 'Usuario';
    
    if (currentUser.firstName && currentUser.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    } else if (currentUser.firstName) {
      return currentUser.firstName;
    } else if (currentUser.username) {
      return currentUser.username;
    } else if (currentUser.email) {
      return currentUser.email.split('@')[0];
    } else {
      return 'Usuario';
    }
  };

  // ✅ EFECTOS (IGUAL QUE CORTES)
  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTimeLocal(now);
      setCurrentTime(mexicoTime);
    };
    
    updateClock();
    const interval = setInterval(updateClock, 1000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const dateString = selectedDate.toISOString().split('T')[0];
    setExpenseData(prev => ({ ...prev, expense_date: dateString }));
    loadRelatedCut(dateString);
  }, [selectedDate]);

  // ✅ CARGAR INFORMACIÓN DEL CORTE RELACIONADO
  const loadRelatedCut = async (dateString: string) => {
    try {
      console.log('🔍 Verificando corte relacionado para fecha:', dateString);
      
      const response = await fetch(`/api/cuts/check-existing?date=${dateString}&purpose=expenses`);
      const data = await response.json();
      
      if (response.ok) {
        setRelatedCutData(data);
        console.log('📊 Corte relacionado:', data);
      } else {
        console.log('ℹ️ No hay corte para esta fecha');
        setRelatedCutData({ exists: false });
      }
    } catch (error) {
      console.error('Error cargando corte relacionado:', error);
      setRelatedCutData({ exists: false });
    }
  };

  // ✅ FUNCIÓN: Crear egreso
  const handleCreateExpense = async () => {
    try {
      setCreating(true);
      setError(null);
      
      // Validaciones
      if (!expenseData.expense_type || !expenseData.description || !expenseData.amount) {
        setError('Por favor complete todos los campos requeridos');
        return;
      }
      
      if (expenseData.amount <= 0) {
        setError('El monto debe ser mayor a 0');
        return;
      }
      
      const requestData = {
        ...expenseData,
        created_at_mexico: createTimestampForDB()
      };
      
      console.log('📊 Creando egreso con datos:', requestData);
      
      const response = await fetch('/api/expenses/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`✅ Egreso creado exitosamente: ${result.message}`);
        setTimeout(() => {
          router.push(`/dashboard/admin/egresos`);
        }, 2000);
      } else {
        setError(result.error || 'Error al crear el egreso');
      }
    } catch (error) {
      console.error('Error creando egreso:', error);
      setError('Error al crear el egreso');
    } finally {
      setCreating(false);
    }
  };

  const handleExpenseDataChange = (field: keyof ExpenseData, value: string | number) => {
    setExpenseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
      setSuccess(null);
      setError(null);
    }
  };

  const getExpenseTypeInfo = (type: string) => {
    return EXPENSE_TYPES.find(t => t.value === type) || EXPENSE_TYPES[EXPENSE_TYPES.length - 1];
  };

  const isFormValid = () => {
    return expenseData.expense_type && 
           expenseData.description.trim() && 
           expenseData.amount > 0;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        p: 4,
        // ✅ CSS GLOBAL PARA DATEPICKER (IGUAL QUE CORTES)
        '& .MuiPickersLayout-root': {
          backgroundColor: darkProTokens.surfaceLevel2,
        },
        '& .MuiDayCalendar-weekContainer': {
          '& .MuiPickersDay-root': {
            color: darkProTokens.textPrimary,
            '&:hover': {
              backgroundColor: `${darkProTokens.primary}30`,
            },
            '&.Mui-selected': {
              backgroundColor: darkProTokens.primary,
              color: darkProTokens.background,
            },
          },
        },
        '& .MuiPickersCalendarHeader-root': {
          '& .MuiPickersCalendarHeader-label': {
            color: darkProTokens.textPrimary,
          },
          '& .MuiIconButton-root': {
            color: darkProTokens.textPrimary,
          },
        },
        '& .MuiPickersDay-today': {
          borderColor: darkProTokens.primary,
        },
        '& .MuiTypography-caption': {
          color: darkProTokens.textSecondary,
        },
        '& .MuiPickersLayout-contentWrapper': {
          backgroundColor: darkProTokens.surfaceLevel2,
        }
      }}>
        {/* HEADER CON DETECTOR DE RANGO (IGUAL QUE CORTES) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => router.push('/dashboard/admin/egresos')}
              sx={{ 
                color: darkProTokens.textSecondary,
                '&:hover': { color: darkProTokens.primary }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <Avatar sx={{ 
              bgcolor: darkProTokens.error, 
              width: 60, 
              height: 60 
            }}>
              <MoneyOffIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                Crear Nuevo Egreso
              </Typography>
              
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                📅 {formatDateLocal(selectedDate.toISOString().split('T')[0])} • ⏰ {currentTime}
              </Typography>
              
              {/* 🔍 DETECTOR DE RANGO INTELIGENTE */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mt: 1,
                p: 1.5,
                backgroundColor: `${darkProTokens.info}15`,
                borderRadius: 2,
                border: `1px solid ${darkProTokens.info}30`
              }}>
                <DateRangeIcon sx={{ color: darkProTokens.info, fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                  📊 Rango de datos: {getMexicoDateRangeDisplay(selectedDate.toISOString().split('T')[0])}
                </Typography>
              </Box>
              
              <Typography variant="caption" sx={{ color: darkProTokens.textDisabled, mt: 0.5, display: 'block' }}>
                🇲🇽 Zona horaria: México • 💸 Registro de gastos operativos
              </Typography>
            </Box>
          </Box>
          
          {/* VISTA PREVIA */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: darkProTokens.info,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: darkProTokens.info,
                    },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VisibilityIcon />
                  <Typography variant="body2">
                    Vista Previa
                  </Typography>
                </Box>
              }
              sx={{ color: darkProTokens.textSecondary }}
            />
          </Box>
        </Box>

        {/* MENSAJES DE ESTADO (IGUAL QUE CORTES) */}
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
          
          {relatedCutData?.exists && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="info" sx={{ mb: 3 }}>
                ℹ️ Existe un corte para esta fecha. El egreso se sincronizará automáticamente.
                <br />
                💰 Gastos actuales en corte: {formatPrice(relatedCutData.cut?.expenses_amount || 0)}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <Grid container spacing={4}>
          {/* CONFIGURACIÓN DEL EGRESO */}
          <Grid size={12} md={showPreview ? 6 : 8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `2px solid ${darkProTokens.error}40`,
                borderRadius: 4,
                height: 'fit-content'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.error, mb: 3 }}>
                    ⚙️ Información del Egreso
                  </Typography>
                  
                  {/* SELECTOR DE FECHA */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📅 Fecha del Egreso
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
                          '&.Mui-focused': {
                            color: darkProTokens.primary,
                          },
                        },
                        '& .MuiSvgIcon-root': {
                          color: darkProTokens.primary,
                        },
                        '& .MuiInputBase-input': {
                          color: darkProTokens.textPrimary,
                        },
                      }}
                    />
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* TIPO DE EGRESO */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📂 Tipo de Egreso *
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: darkProTokens.textSecondary }}>
                        Seleccionar tipo
                      </InputLabel>
                      <Select
                        value={expenseData.expense_type}
                        onChange={(e) => handleExpenseDataChange('expense_type', e.target.value)}
                        label="Seleccionar tipo"
                        sx={{
                          backgroundColor: darkProTokens.surfaceLevel4,
                          color: darkProTokens.textPrimary,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.grayMedium,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary,
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: darkProTokens.primary,
                          },
                          '& .MuiSvgIcon-root': {
                            color: darkProTokens.textSecondary,
                          },
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              backgroundColor: darkProTokens.surfaceLevel3,
                              color: darkProTokens.textPrimary,
                            },
                          },
                        }}
                      >
                        {EXPENSE_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: `${type.color}20`, color: type.color, width: 32, height: 32 }}>
                                {type.icon}
                              </Avatar>
                              <Typography>{type.label}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* DESCRIPCIÓN */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📝 Descripción *
                    </Typography>
                    <TextField
                      fullWidth
                      value={expenseData.description}
                      onChange={(e) => handleExpenseDataChange('description', e.target.value)}
                      placeholder="Describe el gasto (ej: Pago de electricidad mensual)"
                      multiline
                      rows={3}
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
                      }}
                    />
                  </Box>

                  {/* MONTO */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      💰 Monto *
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={expenseData.amount || ''}
                      onChange={(e) => handleExpenseDataChange('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      inputProps={{ step: "0.01", min: "0" }}
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

                  {/* NÚMERO DE RECIBO */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      🧾 Número de Recibo (Opcional)
                    </Typography>
                    <TextField
                      fullWidth
                      value={expenseData.receipt_number}
                      onChange={(e) => handleExpenseDataChange('receipt_number', e.target.value)}
                      placeholder="Ej: CFE-2025-001, REC-123456"
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
                      }}
                    />
                  </Box>

                  {/* NOTAS */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📄 Notas Adicionales (Opcional)
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={expenseData.notes}
                      onChange={(e) => handleExpenseDataChange('notes', e.target.value)}
                      placeholder="Información adicional, observaciones, etc..."
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
                      }}
                    />
                  </Box>

                  <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                  {/* INFORMACIÓN DEL EGRESO */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      📋 Información del Registro
                    </Typography>
                    
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          Registrado por:
                        </Typography>
                        <Chip
                          label={getCurrentUserDisplayName()}
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
                          Fecha y hora:
                        </Typography>
                        <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {formatDateLocal(selectedDate.toISOString().split('T')[0])} • {currentTime}
                        </Typography>
                      </Box>
                      
                      {expenseData.expense_type && (
                        <Box>
                          <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                            Categoría:
                          </Typography>
                          <Chip
                            icon={getExpenseTypeInfo(expenseData.expense_type).icon}
                            label={getExpenseTypeInfo(expenseData.expense_type).label}
                            sx={{
                              backgroundColor: `${getExpenseTypeInfo(expenseData.expense_type).color}20`,
                              color: getExpenseTypeInfo(expenseData.expense_type).color,
                              fontWeight: 600,
                              mt: 0.5
                            }}
                          />
                        </Box>
                      )}
                    </Stack>
                  </Box>

                  {/* BOTONES DE ACCIÓN */}
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => router.push('/dashboard/admin/egresos')}
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
                      onClick={handleCreateExpense}
                      disabled={creating || !isFormValid()}
                      startIcon={creating ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{
                        background: isFormValid() 
                          ? `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`
                          : darkProTokens.grayMedium,
                        color: darkProTokens.textPrimary,
                        py: 1.5,
                        fontWeight: 700,
                        '&:disabled': {
                          background: darkProTokens.grayMedium,
                          color: darkProTokens.textDisabled
                        }
                      }}
                    >
                      {creating ? 'Creando...' : 'Crear Egreso'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* VISTA PREVIA (cuando está habilitada) */}
          {showPreview && (
            <Grid size={12} md={6}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                  border: `1px solid ${darkProTokens.grayMedium}`,
                  borderRadius: 4,
                  height: 'fit-content'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.textPrimary, mb: 3 }}>
                      👁️ Vista Previa del Egreso
                    </Typography>
                    
                    {isFormValid() ? (
                      <Paper sx={{
                        p: 3,
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                        border: `2px solid ${getExpenseTypeInfo(expenseData.expense_type).color}40`,
                        borderRadius: 3
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: getExpenseTypeInfo(expenseData.expense_type).color,
                              width: 48,
                              height: 48
                            }}>
                              {getExpenseTypeInfo(expenseData.expense_type).icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                                {expenseData.description || 'Descripción del egreso'}
                              </Typography>
                              <Chip
                                label={getExpenseTypeInfo(expenseData.expense_type).label}
                                size="small"
                                sx={{
                                  backgroundColor: `${getExpenseTypeInfo(expenseData.expense_type).color}20`,
                                  color: getExpenseTypeInfo(expenseData.expense_type).color,
                                  fontWeight: 600
                                }}
                              />
                            </Box>
                          </Box>
                          
                          <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                            -{formatPrice(expenseData.amount)}
                          </Typography>
                        </Box>
                        
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                              Fecha:
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                              {formatDateLocal(selectedDate.toISOString().split('T')[0])}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                              Hora:
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                              {currentTime}
                            </Typography>
                          </Box>
                          
                          {expenseData.receipt_number && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                                Recibo:
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                                #{expenseData.receipt_number}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                              Registrado por:
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                              {getCurrentUserDisplayName()}
                            </Typography>
                          </Box>
                        </Stack>
                        
                        {expenseData.notes && (
                          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${darkProTokens.grayMedium}` }}>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontStyle: 'italic' }}>
                              📝 {expenseData.notes}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    ) : (
                      <Box sx={{ 
                        textAlign: 'center', 
                        py: 6,
                        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel1}, ${darkProTokens.surfaceLevel2})`,
                        borderRadius: 3,
                        border: `1px dashed ${darkProTokens.grayMedium}`
                      }}>
                        <MoneyOffIcon sx={{ fontSize: 60, color: darkProTokens.textDisabled, mb: 2 }} />
                        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                          Complete los campos requeridos
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                          La vista previa aparecerá cuando complete el tipo, descripción y monto
                        </Typography>
                      </Box>
                    )}
                    
                    {/* INFORMACIÓN DEL CORTE RELACIONADO */}
                    {relatedCutData && (
                      <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${darkProTokens.grayMedium}` }}>
                        <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                          🔄 Sincronización con Corte
                        </Typography>
                        
                        {relatedCutData.exists ? (
                          <Box sx={{ 
                            p: 2,
                            backgroundColor: `${darkProTokens.success}15`,
                            borderRadius: 2,
                            border: `1px solid ${darkProTokens.success}30`
                          }}>
                            <Typography variant="body2" sx={{ color: darkProTokens.success, fontWeight: 600, mb: 1 }}>
                              ✅ Se sincronizará automáticamente
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              Corte: {relatedCutData.cut?.cut_number}<br />
                              Gastos actuales: {formatPrice(relatedCutData.cut?.expenses_amount || 0)}
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            p: 2,
                            backgroundColor: `${darkProTokens.info}15`,
                            borderRadius: 2,
                            border: `1px solid ${darkProTokens.info}30`
                          }}>
                            <Typography variant="body2" sx={{ color: darkProTokens.info, fontWeight: 600, mb: 1 }}>
                              ℹ️ Sin corte para esta fecha
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                              El egreso se registrará normalmente. Se podrá sincronizar cuando se cree un corte.
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}
        </Grid>
      </Box>
    </LocalizationProvider>
  );
}
