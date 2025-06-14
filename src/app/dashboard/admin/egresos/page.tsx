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
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  InputAdornment,
  Fab,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  TrendingDown as TrendingDownIcon,
  DateRange as DateRangeIcon,
  AttachMoney as AttachMoneyIcon,
  Category as CategoryIcon,
  Description as DescriptionIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  MonetizationOn as MonetizationOnIcon,
  Sync as SyncIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// 🎨 DARK PRO TOKENS
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
  success: '#388E3C',
  error: '#D32F2F',
  warning: '#FFB300',
  info: '#1976D2',
  roleAdmin: '#E91E63'
};

// 📋 CATEGORÍAS DE EGRESOS
const EXPENSE_TYPES = {
  'nomina': { label: '👥 Nómina', color: darkProTokens.error },
  'suplementos': { label: '💊 Suplementos', color: darkProTokens.warning },
  'servicios': { label: '⚡ Servicios', color: darkProTokens.info },
  'mantenimiento': { label: '🔧 Mantenimiento', color: darkProTokens.primary },
  'limpieza': { label: '🧽 Limpieza', color: darkProTokens.success },
  'marketing': { label: '📢 Marketing', color: '#9C27B0' },
  'equipamiento': { label: '🏋️ Equipamiento', color: '#FF5722' },
  'otros': { label: '📝 Otros', color: darkProTokens.grayMuted }
};

// ✅ FECHAS MÉXICO (MISMA LÓGICA QUE dateHelpers)
function getMexicoDateLocal(): string {
  const now = new Date();
  const mexicoTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  const year = mexicoTime.getFullYear();
  const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMexicoTimestamp(date: Date): string {
  const mexicoTime = new Date(date.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const year = mexicoTime.getFullYear();
  const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoTime.getDate()).padStart(2, '0');
  const hours = String(mexicoTime.getHours()).padStart(2, '0');
  const minutes = String(mexicoTime.getMinutes()).padStart(2, '0');
  const seconds = String(mexicoTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-06:00`;
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
    return dateString;
  }
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return dateString;
  }
}

// ✅ INTERFACES
interface Expense {
  id: string;
  expense_date: string;
  expense_time: string;
  expense_type: string;
  description: string;
  amount: number;
  receipt_number?: string;
  notes?: string;
  status: string;
  created_at: string;
  created_by: string;
  user_name?: string;
}

interface ExpenseForm {
  expense_type: string;
  description: string;
  amount: string;
  receipt_number: string;
  notes: string;
}

interface RelatedCut {
  id: string;
  cut_number: string;
  expenses_amount: number;
  grand_total: number;
  status: string;
}

export default function EgresosPage() {
  // ✅ ESTADOS
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const mexicoDateString = getMexicoDateLocal();
    return new Date(mexicoDateString + 'T12:00:00');
  });
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [relatedCut, setRelatedCut] = useState<RelatedCut | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modal states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>({
    expense_type: '',
    description: '',
    amount: '',
    receipt_number: '',
    notes: ''
  });

  // ✅ EFECTOS
  useEffect(() => {
    loadExpenses(selectedDate);
    loadRelatedCut(selectedDate);
  }, [selectedDate]);

  // ✅ FUNCIONES DE CARGA
  const loadExpenses = async (date: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const dateString = date.toISOString().split('T')[0];
      console.log('🔍 Cargando egresos para fecha México:', dateString);
      
      const response = await fetch(`/api/expenses/daily?date=${dateString}`);
      const data = await response.json();
      
      if (data.success) {
        setExpenses(data.expenses || []);
        console.log('✅ Egresos cargados:', data.expenses?.length || 0);
      } else {
        setError(data.error || 'Error al cargar egresos');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar egresos');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedCut = async (date: Date) => {
    try {
      const dateString = date.toISOString().split('T')[0];
      console.log('🔍 Verificando corte relacionado para:', dateString);
      
      const response = await fetch(`/api/cuts/check-existing?date=${dateString}`);
      const data = await response.json();
      
      if (data.success && data.cut) {
        setRelatedCut(data.cut);
        console.log('✅ Corte relacionado encontrado:', data.cut.cut_number);
      } else {
        setRelatedCut(null);
        console.log('ℹ️ No hay corte para esta fecha');
      }
    } catch (error) {
      console.error('Error verificando corte:', error);
      setRelatedCut(null);
    }
  };

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
      setSuccess(null);
      setError(null);
    }
  };

  // ✅ FUNCIONES DE MODAL
  const openAddDialog = () => {
    setEditingExpense(null);
    setExpenseForm({
      expense_type: '',
      description: '',
      amount: '',
      receipt_number: '',
      notes: ''
    });
    setOpenDialog(true);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      expense_type: expense.expense_type,
      description: expense.description,
      amount: expense.amount.toString(),
      receipt_number: expense.receipt_number || '',
      notes: expense.notes || ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingExpense(null);
    setExpenseForm({
      expense_type: '',
      description: '',
      amount: '',
      receipt_number: '',
      notes: ''
    });
  };

  const handleFormChange = (field: keyof ExpenseForm, value: string) => {
    setExpenseForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!expenseForm.expense_type.trim()) {
      setError('Tipo de egreso es requerido');
      return false;
    }
    if (!expenseForm.description.trim()) {
      setError('Descripción es requerida');
      return false;
    }
    if (!expenseForm.amount.trim() || parseFloat(expenseForm.amount) <= 0) {
      setError('Cantidad debe ser mayor a 0');
      return false;
    }
    return true;
  };

  // ✅ GUARDAR EGRESO CON SINCRONIZACIÓN AUTOMÁTICA
  const handleSaveExpense = async () => {
    try {
      if (!validateForm()) return;
      
      setSaving(true);
      setError(null);
      
      const dateString = selectedDate.toISOString().split('T')[0];
      const now = new Date();
      const mexicoTimestamp = toMexicoTimestamp(now);
      
      const expenseData = {
        expense_date: dateString,
        expense_time: mexicoTimestamp, // ✅ Hora México con offset
        expense_type: expenseForm.expense_type,
        description: expenseForm.description.trim(),
        amount: parseFloat(expenseForm.amount),
        receipt_number: expenseForm.receipt_number.trim() || null,
        notes: expenseForm.notes.trim() || null
      };
      
      const url = editingExpense 
        ? `/api/expenses/update/${editingExpense.id}`
        : '/api/expenses/create';
      
      const method = editingExpense ? 'PUT' : 'POST';
      
      console.log(`${editingExpense ? '✏️ Actualizando' : '➕ Creando'} egreso con sincronización:`, expenseData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(editingExpense 
          ? `✅ Egreso actualizado y sincronizado con corte`
          : `✅ Egreso creado: ${formatPrice(expenseData.amount)}${result.sync_info ? ' • Sincronizado con corte' : ''}`
        );
        handleCloseDialog();
        await loadExpenses(selectedDate);
        await loadRelatedCut(selectedDate); // Actualizar info del corte
      } else {
        setError(result.error || 'Error al guardar el egreso');
      }
    } catch (error) {
      console.error('Error guardando egreso:', error);
      setError('Error al guardar el egreso');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!confirm(`¿Estás seguro de eliminar el egreso "${expense.description}"?\n\nEsto también actualizará automáticamente el corte relacionado.`)) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch(`/api/expenses/delete/${expense.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`✅ Egreso eliminado${result.sync_info ? ' y corte actualizado automáticamente' : ''}`);
        await loadExpenses(selectedDate);
        await loadRelatedCut(selectedDate); // Actualizar info del corte
      } else {
        setError(result.error || 'Error al eliminar el egreso');
      }
    } catch (error) {
      console.error('Error eliminando egreso:', error);
      setError('Error al eliminar el egreso');
    } finally {
      setSaving(false);
    }
  };

  // ✅ SINCRONIZACIÓN MANUAL (POR SI ALGO FALLA)
  const handleManualSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const response = await fetch(`/api/expenses/sync-with-cut`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: dateString }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(`✅ Sincronización manual completada: ${formatPrice(result.total_expenses)}`);
        await loadRelatedCut(selectedDate);
      } else {
        setError(result.error || 'Error en sincronización manual');
      }
    } catch (error) {
      console.error('Error en sincronización manual:', error);
      setError('Error en sincronización manual');
    } finally {
      setSyncing(false);
    }
  };

  // ✅ CÁLCULOS
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expensesByType = expenses.reduce((acc, expense) => {
    acc[expense.expense_type] = (acc[expense.expense_type] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ 
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        color: darkProTokens.textPrimary,
        p: 4
      }}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: darkProTokens.error, 
              width: 60, 
              height: 60 
            }}>
              <TrendingDownIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Box>
              <Typography variant="h3" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                💸 Gestión de Egresos
              </Typography>
              
              <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
                📅 {formatDateLocal(selectedDate.toISOString().split('T')[0])}
              </Typography>
              
              <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, mt: 0.5 }}>
                🇲🇽 Zona horaria: México • {expenses.length} egresos registrados
                {relatedCut && (
                  <Chip 
                    label={`🔗 Vinculado con ${relatedCut.cut_number}`} 
                    size="small" 
                    sx={{ 
                      ml: 1,
                      backgroundColor: `${darkProTokens.success}20`,
                      color: darkProTokens.success
                    }} 
                  />
                )}
              </Typography>
            </Box>
          </Box>
          
          {/* TOTAL DEL DÍA */}
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.error}40`,
            borderRadius: 3,
            textAlign: 'center'
          }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
              {formatPrice(totalExpenses)}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary }}>
              Total Egresos del Día
            </Typography>
            {relatedCut && (
              <Typography variant="caption" sx={{ 
                color: darkProTokens.success,
                display: 'block',
                mt: 1
              }}>
                ✅ Sincronizado con corte
              </Typography>
            )}
          </Paper>
        </Box>

        {/* MENSAJES */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
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
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ALERT DE CORTE RELACIONADO */}
        {relatedCut && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              backgroundColor: `${darkProTokens.info}15`,
              border: `1px solid ${darkProTokens.info}40`,
              color: darkProTokens.textPrimary
            }}
            action={
              <Button
                size="small"
                onClick={handleManualSync}
                disabled={syncing}
                startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
                sx={{ color: darkProTokens.info }}
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            }
          >
            💡 <strong>Corte relacionado:</strong> {relatedCut.cut_number} • 
            Egresos registrados: {formatPrice(relatedCut.expenses_amount)} • 
            Los cambios se sincronizan automáticamente
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* PANEL DE CONTROL */}
          <Grid size={12} md={4}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `2px solid ${darkProTokens.roleAdmin}40`,
              borderRadius: 4
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.roleAdmin, mb: 3 }}>
                  ⚙️ Panel de Control
                </Typography>
                
                {/* SELECTOR DE FECHA */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                    📅 Fecha de Egresos
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
                    }}
                  />
                </Box>

                <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                {/* RESUMEN POR CATEGORÍAS */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                    📊 Resumen por Categorías
                  </Typography>
                  
                  <Stack spacing={1}>
                    {Object.entries(expensesByType).map(([type, amount]) => (
                      <Box key={type} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        backgroundColor: darkProTokens.surfaceLevel4,
                        borderRadius: 2
                      }}>
                        <Chip
                          label={EXPENSE_TYPES[type as keyof typeof EXPENSE_TYPES]?.label || type}
                          size="small"
                          sx={{
                            backgroundColor: `${EXPENSE_TYPES[type as keyof typeof EXPENSE_TYPES]?.color || darkProTokens.grayMuted}20`,
                            color: EXPENSE_TYPES[type as keyof typeof EXPENSE_TYPES]?.color || darkProTokens.grayMuted,
                            fontWeight: 600
                          }}
                        />
                        <Typography variant="body2" sx={{ color: darkProTokens.error, fontWeight: 700 }}>
                          {formatPrice(amount)}
                        </Typography>
                      </Box>
                    ))}
                    
                    {Object.keys(expensesByType).length === 0 && (
                      <Typography variant="body2" sx={{ 
                        color: darkProTokens.textDisabled,
                        textAlign: 'center',
                        py: 2
                      }}>
                        No hay egresos registrados para esta fecha
                      </Typography>
                    )}
                  </Stack>
                </Box>

                <Divider sx={{ backgroundColor: darkProTokens.grayMedium, my: 3 }} />

                {/* BOTÓN AGREGAR */}
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={openAddDialog}
                  sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.error})`,
                    color: darkProTokens.textPrimary,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '1.1rem'
                  }}
                >
                  Agregar Egreso
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* LISTA DE EGRESOS */}
          <Grid size={12} md={8}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <CircularProgress size={60} sx={{ color: darkProTokens.roleAdmin }} />
              </Box>
            ) : (
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `2px solid ${darkProTokens.error}40`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                      📋 Egresos del Día
                    </Typography>
                    <Badge badgeContent={expenses.length} color="primary">
                      <ReceiptIcon sx={{ color: darkProTokens.error }} />
                    </Badge>
                  </Box>
                  
                  {expenses.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 8,
                      color: darkProTokens.textDisabled 
                    }}>
                      <MonetizationOnIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        No hay egresos registrados
                      </Typography>
                      <Typography variant="body2">
                        Para la fecha {formatDateLocal(selectedDate.toISOString().split('T')[0])}
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} sx={{ 
                      backgroundColor: darkProTokens.surfaceLevel4,
                      borderRadius: 2,
                      maxHeight: 600,
                      overflow: 'auto'
                    }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 'bold', 
                              backgroundColor: darkProTokens.grayDark 
                            }}>
                              Categoría
                            </TableCell>
                            <TableCell sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 'bold', 
                              backgroundColor: darkProTokens.grayDark 
                            }}>
                              Descripción
                            </TableCell>
                            <TableCell sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 'bold', 
                              backgroundColor: darkProTokens.grayDark 
                            }} align="right">
                              Monto
                            </TableCell>
                            <TableCell sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 'bold', 
                              backgroundColor: darkProTokens.grayDark 
                            }}>
                              Fecha/Hora
                            </TableCell>
                            <TableCell sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 'bold', 
                              backgroundColor: darkProTokens.grayDark 
                            }} align="center">
                              Acciones
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {expenses.map((expense) => (
                            <TableRow 
                              key={expense.id}
                              sx={{ 
                                '&:nth-of-type(odd)': { 
                                  backgroundColor: darkProTokens.surfaceLevel3 
                                },
                                '&:hover': {
                                  backgroundColor: `${darkProTokens.error}10`
                                }
                              }}
                            >
                              <TableCell>
                                <Chip
                                  label={EXPENSE_TYPES[expense.expense_type as keyof typeof EXPENSE_TYPES]?.label || expense.expense_type}
                                  size="small"
                                  sx={{
                                    backgroundColor: `${EXPENSE_TYPES[expense.expense_type as keyof typeof EXPENSE_TYPES]?.color || darkProTokens.grayMuted}20`,
                                    color: EXPENSE_TYPES[expense.expense_type as keyof typeof EXPENSE_TYPES]?.color || darkProTokens.grayMuted,
                                    fontWeight: 600
                                  }}
                                />
                              </TableCell>
                              
                              <TableCell sx={{ color: darkProTokens.textPrimary }}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {expense.description}
                                  </Typography>
                                  {expense.receipt_number && (
                                    <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                                      📄 Recibo: {expense.receipt_number}
                                    </Typography>
                                  )}
                                  {expense.notes && (
                                    <Typography variant="caption" sx={{ 
                                      color: darkProTokens.textDisabled,
                                      display: 'block'
                                    }}>
                                      💬 {expense.notes}
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              
                              <TableCell align="right" sx={{ color: darkProTokens.error, fontWeight: 'bold' }}>
                                {formatPrice(expense.amount)}
                              </TableCell>
                              
                              <TableCell sx={{ color: darkProTokens.textSecondary }}>
                                <Typography variant="body2">
                                  {formatDateTime(expense.expense_time)}
                                </Typography>
                              </TableCell>
                              
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Tooltip title="Editar">
                                    <IconButton
                                      size="small"
                                      onClick={() => openEditDialog(expense)}
                                      sx={{ 
                                        color: darkProTokens.warning,
                                        '&:hover': { backgroundColor: `${darkProTokens.warning}20` }
                                      }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>
                                  
                                  <Tooltip title="Eliminar">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteExpense(expense)}
                                      disabled={saving}
                                      sx={{ 
                                        color: darkProTokens.error,
                                        '&:hover': { backgroundColor: `${darkProTokens.error}20` }
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* DIALOG PARA AGREGAR/EDITAR EGRESO */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: darkProTokens.surfaceLevel2,
              border: `2px solid ${darkProTokens.roleAdmin}40`
            }
          }}
        >
          <DialogTitle sx={{ 
            color: darkProTokens.textPrimary,
            backgroundColor: darkProTokens.surfaceLevel3,
            borderBottom: `1px solid ${darkProTokens.grayMedium}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: darkProTokens.roleAdmin }}>
                {editingExpense ? <EditIcon /> : <AddIcon />}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {editingExpense ? 'Editar Egreso' : 'Agregar Nuevo Egreso'}
                </Typography>
                <Typography variant="caption" sx={{ color: darkProTokens.textDisabled }}>
                  Se sincronizará automáticamente con el corte del día
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: 4 }}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Tipo de Egreso"
                  value={expenseForm.expense_type}
                  onChange={(e) => handleFormChange('expense_type', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><CategoryIcon /></InputAdornment>
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: darkProTokens.surfaceLevel4,
                      color: darkProTokens.textPrimary,
                    },
                    '& .MuiInputLabel-root': {
                      color: darkProTokens.textSecondary,
                    },
                  }}
                >
                  {Object.entries(EXPENSE_TYPES).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid size={12} sm={6}>
                <TextField
                  fullWidth
                  label="Monto"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  required
                  inputProps={{ step: "0.01", min: "0" }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><AttachMoneyIcon /></InputAdornment>
                  }}
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
              
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  value={expenseForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  required
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><DescriptionIcon /></InputAdornment>
                  }}
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
              
              <Grid size={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número de Recibo (Opcional)"
                  value={expenseForm.receipt_number}
                  onChange={(e) => handleFormChange('receipt_number', e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><ReceiptIcon /></InputAdornment>
                  }}
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
              
              <Grid size={12} sm={6}>
                <TextField
                  fullWidth
                  label="Notas Adicionales (Opcional)"
                  value={expenseForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
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
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: 3, 
            backgroundColor: darkProTokens.surfaceLevel3,
            borderTop: `1px solid ${darkProTokens.grayMedium}`
          }}>
            <Button
              onClick={handleCloseDialog}
              variant="outlined"
              startIcon={<CancelIcon />}
              sx={{
                borderColor: darkProTokens.textSecondary,
                color: darkProTokens.textSecondary,
                '&:hover': {
                  borderColor: darkProTokens.textPrimary,
                  backgroundColor: `${darkProTokens.textSecondary}20`
                }
              }}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleSaveExpense}
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.error})`,
                color: darkProTokens.textPrimary,
                fontWeight: 700,
                '&:disabled': {
                  background: darkProTokens.grayMedium,
                  color: darkProTokens.textDisabled
                }
              }}
            >
              {saving ? 'Guardando...' : editingExpense ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* FAB PARA AGREGAR RÁPIDO */}
        <Fab
          color="primary"
          aria-label="add"
          onClick={openAddDialog}
          sx={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            background: `linear-gradient(135deg, ${darkProTokens.roleAdmin}, ${darkProTokens.error})`,
            '&:hover': {
              background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.roleAdmin})`,
            }
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </LocalizationProvider>
  );
}
