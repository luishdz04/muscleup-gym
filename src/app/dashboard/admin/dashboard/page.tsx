'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
  Stack,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as SalesIcon,
  Bookmark as LayawayIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  PersonAdd as PersonAddIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  CreditCard as PaymentIcon,
  Speed as SpeedIcon,
  Insights as InsightsIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  CompareArrows as CompareIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// 🎨 DARK PRO SYSTEM - TOKENS ENTERPRISE (IGUAL QUE CORTES)
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
  roleAdmin: '#E91E63',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleModerator: '#9C27B0'
};

// ✅ FUNCIONES LOCALES (COPIADAS DE TU PÁGINA DE CORTES QUE FUNCIONA)

// 💰 Función para formatear precios
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount || 0);
}

// 📅 Función para obtener fecha actual de México
function getMexicoDateLocal(): string {
  const now = new Date();
  
  // Obtener fecha en zona horaria de México
  const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
  
  // Formatear como YYYY-MM-DD
  const year = mexicoDate.getFullYear();
  const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// ⏰ Función para formatear hora actual de México
function formatMexicoTimeLocal(date: Date): string {
  return date.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

// 📅 Función para formatear fechas largas
function formatDateLocal(dateString: string): string {
  try {
    // Crear fecha y formatear en español México
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
    
    // Fallback manual
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

// 📅 Función para formatear fecha y hora completa
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

// ✅ INTERFACES CORREGIDAS
interface DashboardStats {
  totalUsers: number;
  clientUsers: number;
  newUsersToday: number;
  newUsersMonth: number;
  usersByGender: { male: number; female: number; other: number };
  activeMemberships: number;
  expiringMemberships: number;
  expiredMemberships: number;
  frozenMemberships: number;
  membershipRevenue: number;
  todayMembershipRevenue: number; // ✅ SOLO DEL DÍA
  todaySales: number;
  todayTransactions: number;
  todayAvgTicket: number;
  monthSales: number;
  monthTransactions: number;
  activeLayaways: number;
  expiringLayaways: number;
  layawaysPendingAmount: number;
  layawaysCollectedAmount: number;
  todayLayawayPayments: number; // ✅ SOLO DEL DÍA
  todayExpenses: number;
  todayBalance: number; // ✅ BALANCE EXACTO
  cashFlow: {
    efectivo: number;
    transferencia: number;
    debito: number;
    credito: number;
  };
  weeklyTrend: {
    sales: number[];
    dates: string[];
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    clientUsers: 0,
    newUsersToday: 0,
    newUsersMonth: 0,
    usersByGender: { male: 0, female: 0, other: 0 },
    activeMemberships: 0,
    expiringMemberships: 0,
    expiredMemberships: 0,
    frozenMemberships: 0,
    membershipRevenue: 0,
    todayMembershipRevenue: 0,
    todaySales: 0,
    todayTransactions: 0,
    todayAvgTicket: 0,
    monthSales: 0,
    monthTransactions: 0,
    activeLayaways: 0,
    expiringLayaways: 0,
    layawaysPendingAmount: 0,
    layawaysCollectedAmount: 0,
    todayLayawayPayments: 0,
    todayExpenses: 0,
    todayBalance: 0,
    cashFlow: { efectivo: 0, transferencia: 0, debito: 0, credito: 0 },
    weeklyTrend: { sales: [], dates: [] }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentMexicoTime, setCurrentMexicoTime] = useState<string>('');
  
  const supabase = createBrowserSupabaseClient();

  // ✅ FECHA ACTUAL EN MÉXICO (IGUAL QUE CORTES)
  const [selectedDate] = useState(() => {
    const mexicoDate = getMexicoDateLocal();
    console.log('🇲🇽 Fecha actual México (función local):', mexicoDate);
    console.log('🌍 Fecha actual UTC:', new Date().toISOString().split('T')[0]);
    console.log('⏰ Hora actual UTC:', new Date().toISOString());
    return mexicoDate; // Formato: YYYY-MM-DD
  });

  // ✅ ACTUALIZAR HORA EN TIEMPO REAL CADA SEGUNDO
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const mexicoTime = formatMexicoTimeLocal(now);
      setCurrentMexicoTime(mexicoTime);
    };

    // Actualizar inmediatamente
    updateTime();

    // Actualizar cada segundo
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  // ✅ FUNCIÓN PRINCIPAL CORREGIDA CON LOGS DETALLADOS
  const loadDashboardStats = useCallback(async () => {
    try {
      setError(null);
      console.log('📊 ===== INICIANDO CARGA DE DASHBOARD ENTERPRISE =====');
      console.log('🇲🇽 Fecha seleccionada México:', selectedDate);
      console.log('⏰ Hora actual México:', currentMexicoTime);

      const mexicoToday = selectedDate; // Ya está en formato YYYY-MM-DD
      const mexicoTodayStart = mexicoToday + 'T00:00:00';
      const mexicoTodayEnd = mexicoToday + 'T23:59:59';

      // Calcular fechas para comparaciones y filtros
      const today = new Date();
      const firstDayOfMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-01`;
      const in7Days = new Date(today);
      in7Days.setDate(today.getDate() + 7);
      const in7DaysString = `${in7Days.getFullYear()}-${(in7Days.getMonth() + 1).toString().padStart(2, '0')}-${in7Days.getDate().toString().padStart(2, '0')}`;

      console.log(`📅 Fechas calculadas:
        📅 Hoy México: ${mexicoToday}
        📅 Rango hoy: ${mexicoTodayStart} - ${mexicoTodayEnd}
        📅 Primer día del mes: ${firstDayOfMonth}
        📅 En 7 días: ${in7DaysString}`);

      // 👥 CARGAR USUARIOS CON LOGS DETALLADOS
      console.log('👥 ===== CARGANDO USUARIOS =====');
      const { data: allUsers, error: usersError } = await supabase
        .from('Users')
        .select('id, rol, gender, createdAt');

      if (usersError) {
        console.error('❌ Error cargando usuarios:', usersError);
        throw usersError;
      }

      console.log('✅ Usuarios cargados:', allUsers?.length || 0);
      console.log('📊 Muestra de usuarios:', allUsers?.slice(0, 3));

      const clientUsers = allUsers?.filter(u => u.rol === 'cliente') || [];
      console.log('👥 Clientes filtrados:', clientUsers.length);

      const newUsersToday = allUsers?.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = u.createdAt.split('T')[0]; // YYYY-MM-DD
        const isToday = createdDate === mexicoToday;
        if (isToday) {
          console.log('🆕 Usuario nuevo hoy:', u.id, createdDate);
        }
        return isToday;
      }) || [];

      const newUsersMonth = allUsers?.filter(u => {
        if (!u.createdAt) return false;
        const createdDate = u.createdAt.split('T')[0];
        return createdDate >= firstDayOfMonth;
      }) || [];

      const genderStats = clientUsers.reduce((acc, user) => {
        const gender = user.gender?.toLowerCase() || 'other';
        if (gender === 'masculino' || gender === 'male' || gender === 'hombre') acc.male++;
        else if (gender === 'femenino' || gender === 'female' || gender === 'mujer') acc.female++;
        else acc.other++;
        return acc;
      }, { male: 0, female: 0, other: 0 });

      console.log('👥 Estadísticas de usuarios:', {
        total: allUsers?.length || 0,
        clientes: clientUsers.length,
        nuevosHoy: newUsersToday.length,
        nuevosMes: newUsersMonth.length,
        genero: genderStats
      });

      // 🏋️ CARGAR MEMBRESÍAS CON LOGS DETALLADOS
      console.log('🏋️ ===== CARGANDO MEMBRESÍAS =====');
      const { data: memberships, error: membershipsError } = await supabase
        .from('user_memberships')
        .select('*');

      if (membershipsError) {
        console.error('❌ Error cargando membresías:', membershipsError);
        throw membershipsError;
      }

      console.log('✅ Membresías cargadas:', memberships?.length || 0);
      console.log('📊 Muestra de membresías:', memberships?.slice(0, 3));

      const active = memberships?.filter(m => m.status === 'active') || [];
      const expiring = memberships?.filter(m => {
        if (!m.end_date || m.status !== 'active') return false;
        const endDate = m.end_date.split('T')[0];
        return endDate <= in7DaysString && endDate >= mexicoToday;
      }) || [];

      const expired = memberships?.filter(m => {
        if (!m.end_date) return false;
        const endDate = m.end_date.split('T')[0];
        return endDate < mexicoToday;
      }) || [];

      const frozen = memberships?.filter(m => m.status === 'frozen') || [];

      // ✅ INGRESOS EXACTOS SOLO DEL DÍA DE HOY
      const todayMemberships = memberships?.filter(m => {
        if (!m.created_at) return false;
        const createdDate = m.created_at.split('T')[0];
        const isToday = createdDate === mexicoToday;
        if (isToday) {
          console.log('🆕 Membresía nueva hoy:', m.id, createdDate, formatPrice(m.amount_paid || 0));
        }
        return isToday;
      }) || [];

      const todayMembershipRevenue = todayMemberships.reduce((sum, m) => sum + (m.amount_paid || 0), 0);
      const totalRevenue = memberships?.reduce((sum, m) => sum + (m.amount_paid || 0), 0) || 0;

      console.log('🏋️ Estadísticas de membresías:', {
        activas: active.length,
        porVencer: expiring.length,
        vencidas: expired.length,
        congeladas: frozen.length,
        ingresoTotal: formatPrice(totalRevenue),
        ingresoHoy: formatPrice(todayMembershipRevenue),
        membresiasHoy: todayMemberships.length
      });

      // 💰 CARGAR VENTAS DEL DÍA CON LOGS DETALLADOS
      console.log('💰 ===== CARGANDO VENTAS =====');
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'sale')
        .eq('status', 'completed');

      if (salesError) {
        console.error('❌ Error cargando ventas:', salesError);
        throw salesError;
      }

      console.log('✅ Ventas cargadas:', sales?.length || 0);
      console.log('📊 Muestra de ventas:', sales?.slice(0, 3));

      const todaySales = sales?.filter(s => {
        if (!s.created_at) return false;
        const saleDate = s.created_at.split('T')[0];
        const isToday = saleDate === mexicoToday;
        if (isToday) {
          console.log('🆕 Venta del día:', s.id, saleDate, formatPrice(s.total_amount || 0));
        }
        return isToday;
      }) || [];

      const monthSales = sales?.filter(s => {
        if (!s.created_at) return false;
        const saleDate = s.created_at.split('T')[0];
        return saleDate >= firstDayOfMonth;
      }) || [];

      const todayAmount = todaySales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const monthAmount = monthSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

      console.log('💰 Estadísticas de ventas:', {
        ventasHoy: todaySales.length,
        montoHoy: formatPrice(todayAmount),
        ventasMes: monthSales.length,
        montoMes: formatPrice(monthAmount),
        promedioTicket: todaySales.length > 0 ? formatPrice(todayAmount / todaySales.length) : formatPrice(0)
      });

      // 💳 CARGAR MÉTODOS DE PAGO DEL DÍA CON LOGS DETALLADOS
      console.log('💳 ===== CARGANDO MÉTODOS DE PAGO =====');
      const todaySaleIds = todaySales.map(s => s.id);
      console.log('💳 IDs de ventas del día:', todaySaleIds);

      const { data: payments, error: paymentsError } = await supabase
        .from('sale_payment_details')
        .select('*')
        .in('sale_id', todaySaleIds);

      if (paymentsError) {
        console.error('❌ Error cargando métodos de pago:', paymentsError);
        // No lanzar error, continuar con cashFlow vacío
      }

      console.log('✅ Métodos de pago cargados:', payments?.length || 0);
      console.log('📊 Muestra de pagos:', payments?.slice(0, 3));

      const cashFlow = payments?.reduce((acc, payment) => {
        const method = payment.payment_method?.toLowerCase() || 'other';
        const amount = payment.amount || 0;
        
        console.log('💳 Procesando pago:', method, formatPrice(amount));
        
        if (method === 'efectivo') acc.efectivo += amount;
        else if (method === 'transferencia') acc.transferencia += amount;
        else if (method === 'debito') acc.debito += amount;
        else if (method === 'credito') acc.credito += amount;
        else console.log('⚠️ Método de pago desconocido:', method);
        
        return acc;
      }, { efectivo: 0, transferencia: 0, debito: 0, credito: 0 }) || 
      { efectivo: 0, transferencia: 0, debito: 0, credito: 0 };

      console.log('💳 Flujo de efectivo del día:', {
        efectivo: formatPrice(cashFlow.efectivo),
        transferencia: formatPrice(cashFlow.transferencia),
        debito: formatPrice(cashFlow.debito),
        credito: formatPrice(cashFlow.credito),
        total: formatPrice(cashFlow.efectivo + cashFlow.transferencia + cashFlow.debito + cashFlow.credito)
      });

      // 📦 CARGAR APARTADOS CON LOGS DETALLADOS
      console.log('📦 ===== CARGANDO APARTADOS =====');
      const { data: layaways, error: layawaysError } = await supabase
        .from('sales')
        .select('*')
        .eq('sale_type', 'layaway');

      if (layawaysError) {
        console.error('❌ Error cargando apartados:', layawaysError);
        throw layawaysError;
      }

      console.log('✅ Apartados cargados:', layaways?.length || 0);

      const activeLayaways = layaways?.filter(l => 
        l.status === 'pending' && 
        l.layaway_expires_at && 
        new Date(l.layaway_expires_at) >= new Date()
      ) || [];

      const expiringLayaways = layaways?.filter(l => 
        l.status === 'pending' && 
        l.layaway_expires_at &&
        new Date(l.layaway_expires_at) >= new Date() &&
        new Date(l.layaway_expires_at) <= new Date(in7DaysString + 'T23:59:59')
      ) || [];

      const pendingAmount = layaways?.reduce((sum, l) => sum + (l.pending_amount || 0), 0) || 0;
      const collectedAmount = layaways?.reduce((sum, l) => sum + (l.paid_amount || 0), 0) || 0;

      // ✅ ABONOS DEL DÍA DE HOY
      const layawayIds = layaways?.map(l => l.id) || [];
      const { data: todayLayawayPayments, error: layawayPaymentsError } = await supabase
        .from('sale_payment_details')
        .select('*')
        .in('sale_id', layawayIds)
        .gte('payment_date', mexicoTodayStart)
        .lte('payment_date', mexicoTodayEnd);

      if (layawayPaymentsError) {
        console.error('❌ Error cargando abonos del día:', layawayPaymentsError);
        // No lanzar error, continuar con 0
      }

      const todayLayawayAmount = todayLayawayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      console.log('📦 Estadísticas de apartados:', {
        activos: activeLayaways.length,
        porVencer: expiringLayaways.length,
        montoPendiente: formatPrice(pendingAmount),
        montoRecaudado: formatPrice(collectedAmount),
        abonosHoy: formatPrice(todayLayawayAmount)
      });

      // ✅ CONSTRUIR ESTADÍSTICAS FINALES CON BALANCE EXACTO
      const finalStats: DashboardStats = {
        totalUsers: allUsers?.length || 0,
        clientUsers: clientUsers.length,
        newUsersToday: newUsersToday.length,
        newUsersMonth: newUsersMonth.length,
        usersByGender: genderStats,
        activeMemberships: active.length,
        expiringMemberships: expiring.length,
        expiredMemberships: expired.length,
        frozenMemberships: frozen.length,
        membershipRevenue: totalRevenue,
        todayMembershipRevenue, // ✅ SOLO DEL DÍA
        todaySales: todayAmount,
        todayTransactions: todaySales.length,
        todayAvgTicket: todaySales.length > 0 ? todayAmount / todaySales.length : 0,
        monthSales: monthAmount,
        monthTransactions: monthSales.length,
        activeLayaways: activeLayaways.length,
        expiringLayaways: expiringLayaways.length,
        layawaysPendingAmount: pendingAmount,
        layawaysCollectedAmount: collectedAmount,
        todayLayawayPayments: todayLayawayAmount, // ✅ SOLO DEL DÍA
        todayExpenses: 0, // TODO: Implementar gastos
        cashFlow,
        weeklyTrend: { sales: [], dates: [] },
        // ✅ BALANCE EXACTO DEL DÍA (SOLO MOVIMIENTOS DE HOY)
        todayBalance: (todayAmount + todayMembershipRevenue + todayLayawayAmount) - 0 // Sin gastos por ahora
      };

      setStats(finalStats);
      setLastUpdate(formatDateTime(new Date().toISOString()));
      
      console.log('✅ ===== DASHBOARD ENTERPRISE CARGADO EXITOSAMENTE =====');
      console.log('📊 Estadísticas finales:', {
        totalUsuarios: finalStats.totalUsers,
        clientesActivos: finalStats.clientUsers,
        membresiasActivas: finalStats.activeMemberships,
        ventasDelDia: formatPrice(finalStats.todaySales),
        membresiasDelDia: formatPrice(finalStats.todayMembershipRevenue),
        abonosDelDia: formatPrice(finalStats.todayLayawayPayments),
        balanceExactoDelDia: formatPrice(finalStats.todayBalance),
        flujoCaja: {
          efectivo: formatPrice(finalStats.cashFlow.efectivo),
          transferencia: formatPrice(finalStats.cashFlow.transferencia),
          debito: formatPrice(finalStats.cashFlow.debito),
          credito: formatPrice(finalStats.cashFlow.credito)
        }
      });

    } catch (err: any) {
      console.error('💥 ===== ERROR CARGANDO DASHBOARD =====', err);
      setError(`Error cargando estadísticas: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, currentMexicoTime, supabase]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardStats();
  }, [loadDashboardStats]);

  useEffect(() => {
    console.log('🚀 ===== COMPONENTE DASHBOARD MONTADO =====');
    console.log('📅 Fecha seleccionada:', selectedDate);
    loadDashboardStats();
  }, [loadDashboardStats]);

  // ✅ COMPONENTE DE MÉTRICA ENTERPRISE SIMPLIFICADO
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    color, 
    onClick
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        background: `linear-gradient(135deg, ${color}, ${color}DD)`,
        color: darkProTokens.textPrimary,
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${color}40`,
        boxShadow: `0 8px 32px ${color}20`,
        '&:hover': { 
          boxShadow: `0 16px 48px ${color}40`,
          border: `1px solid ${color}60`
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${darkProTokens.primary}, ${color})`
        }
      }}
      onClick={onClick}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Avatar sx={{ 
              bgcolor: `${darkProTokens.textPrimary}15`, 
              width: 64, 
              height: 64,
              border: `2px solid ${darkProTokens.textPrimary}20`
            }}>
              {React.cloneElement(icon as React.ReactElement, { 
                sx: { fontSize: 32, color: darkProTokens.textPrimary }
              })}
            </Avatar>
          </Box>
          
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            mb: 1,
            background: `linear-gradient(45deg, ${darkProTokens.textPrimary}, ${darkProTokens.primary})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {value}
          </Typography>
          
          <Typography variant="h6" sx={{ 
            opacity: 0.9, 
            fontWeight: 600,
            textShadow: `0 2px 4px ${color}40`
          }}>
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" sx={{ 
              opacity: 0.7, 
              mt: 1,
              fontSize: '0.85rem'
            }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <Box sx={{ 
        p: 3,
        background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Avatar sx={{ 
              bgcolor: darkProTokens.primary, 
              width: 100, 
              height: 100,
              mx: 'auto',
              mb: 3,
              boxShadow: `0 0 40px ${darkProTokens.primary}60`
            }}>
              <AssessmentIcon sx={{ fontSize: 50 }} />
            </Avatar>
          </motion.div>
          
          <Typography variant="h4" sx={{ 
            color: darkProTokens.primary, 
            fontWeight: 800,
            mb: 2,
            textShadow: `0 0 20px ${darkProTokens.primary}40`
          }}>
            Enterprise Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
            Cargando análisis avanzado del gimnasio...
          </Typography>
          <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
            📅 Consultando datos para: {formatDateLocal(selectedDate)}
          </Typography>
          
          <LinearProgress sx={{
            width: '300px',
            height: 6,
            borderRadius: 3,
            bgcolor: darkProTokens.grayDark,
            mt: 3,
            mx: 'auto',
            '& .MuiLinearProgress-bar': {
              bgcolor: darkProTokens.primary,
              borderRadius: 3,
              boxShadow: `0 0 10px ${darkProTokens.primary}40`
            }
          }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3,
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      color: darkProTokens.textPrimary
    }}>
      {/* SNACKBAR DE ERROR */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={8000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          variant="filled"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
            color: darkProTokens.textPrimary,
            fontWeight: 600,
            borderRadius: 3
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* HEADER ENTERPRISE */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{
          p: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${darkProTokens.primary}, ${darkProTokens.success}, ${darkProTokens.info})`
          }
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    `0 0 20px ${darkProTokens.primary}40`,
                    `0 0 40px ${darkProTokens.primary}60`,
                    `0 0 20px ${darkProTokens.primary}40`
                  ]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Avatar sx={{ 
                  bgcolor: darkProTokens.primary, 
                  width: 90, 
                  height: 90,
                  border: `3px solid ${darkProTokens.primary}40`
                }}>
                  <AssessmentIcon sx={{ fontSize: 45 }} />
                </Avatar>
              </motion.div>
              
              <Box>
                <Typography variant="h3" sx={{ 
                  color: darkProTokens.primary, 
                  fontWeight: 800,
                  textShadow: `0 0 20px ${darkProTokens.primary}40`,
                  mb: 1,
                  background: `linear-gradient(45deg, ${darkProTokens.primary}, ${darkProTokens.success})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Enterprise Dashboard
                </Typography>
                <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                  🚀 MuscleUp Gym - Business Intelligence
                </Typography>
                <Typography variant="body1" sx={{ color: darkProTokens.info, fontWeight: 600 }}>
                  📅 {formatDateLocal(selectedDate)} • ⏰ {currentMexicoTime}
                </Typography>
                {lastUpdate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <ScheduleIcon sx={{ fontSize: 16, color: darkProTokens.success }} />
                    <Typography variant="caption" sx={{ 
                      color: darkProTokens.success,
                      fontWeight: 600
                    }}>
                      Actualizado: {lastUpdate}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip
                icon={<SpeedIcon />}
                label="Real Time"
                size="medium"
                sx={{
                  bgcolor: `${darkProTokens.success}20`,
                  color: darkProTokens.success,
                  border: `1px solid ${darkProTokens.success}40`,
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              />
              
              <Button
                size="large"
                startIcon={refreshing ? <CircularProgress size={24} sx={{ color: darkProTokens.background }} /> : <RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                variant="contained"
                sx={{ 
                  background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${darkProTokens.info}30`,
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 12px 48px ${darkProTokens.info}50`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {refreshing ? 'Actualizando...' : 'Actualizar Datos'}
              </Button>
            </Box>
          </Box>

          {/* RESUMEN EJECUTIVO ENTERPRISE */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 4,
            background: `linear-gradient(135deg, ${darkProTokens.success}15, ${darkProTokens.primary}10)`,
            borderRadius: 3,
            border: `1px solid ${darkProTokens.success}30`,
            backdropFilter: 'blur(10px)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${darkProTokens.success}, ${darkProTokens.primary})`
            }
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.success, 
                fontWeight: 800,
                textShadow: `0 0 10px ${darkProTokens.success}40`
              }}>
                {stats.clientUsers}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600
              }}>
                👥 Clientes Activos
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${darkProTokens.primary}40`,
              borderWidth: '1px'
            }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.primary, 
                fontWeight: 800,
                textShadow: `0 0 10px ${darkProTokens.primary}40`
              }}>
                {stats.activeMemberships}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600
              }}>
                🏋️ Membresías Activas
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${darkProTokens.primary}40`,
              borderWidth: '1px'
            }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: darkProTokens.info, 
                fontWeight: 800,
                textShadow: `0 0 10px ${darkProTokens.info}40`
              }}>
                {formatPrice(stats.todaySales + stats.todayMembershipRevenue + stats.todayLayawayPayments)}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600
              }}>
                💰 Ingresos del Día
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ 
              borderColor: `${darkProTokens.primary}40`,
              borderWidth: '1px'
            }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: stats.todayBalance >= 0 ? darkProTokens.success : darkProTokens.error, 
                fontWeight: 800,
                textShadow: stats.todayBalance >= 0 ? 
                  `0 0 10px ${darkProTokens.success}40` : 
                  `0 0 10px ${darkProTokens.error}40`
              }}>
                {formatPrice(stats.todayBalance)}
              </Typography>
              <Typography variant="body1" sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 600
              }}>
                📈 Balance Exacto del Día
              </Typography>
              <Typography variant="caption" sx={{ 
                color: darkProTokens.warning,
                fontWeight: 500,
                fontStyle: 'italic'
              }}>
                ✅ Solo movimientos de HOY
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* MÉTRICAS PRINCIPALES ENTERPRISE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Usuarios Totales"
              value={stats.totalUsers}
              subtitle={`+${stats.newUsersToday} hoy, +${stats.newUsersMonth} este mes`}
              icon={<PeopleIcon />}
              color={darkProTokens.roleStaff}
              onClick={() => router.push('/dashboard/admin/usuarios')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Membresías Activas"
              value={stats.activeMemberships}
              subtitle={`${stats.expiringMemberships} por vencer en 7 días`}
              icon={<FitnessCenterIcon />}
              color={darkProTokens.success}
              onClick={() => router.push('/dashboard/admin/membresias')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Ventas del Día"
              value={formatPrice(stats.todaySales)}
              subtitle={`${stats.todayTransactions} transacciones, ${formatPrice(stats.todayAvgTicket)} promedio`}
              icon={<SalesIcon />}
              color={darkProTokens.primary}
              onClick={() => router.push('/dashboard/admin/sales/history')}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Apartados Activos"
              value={stats.activeLayaways}
              subtitle={`${formatPrice(stats.layawaysPendingAmount)} pendiente`}
              icon={<LayawayIcon />}
              color={darkProTokens.roleModerator}
              onClick={() => router.push('/dashboard/admin/layaways/management')}
            />
          </Grid>
        </Grid>
      </motion.div>

      {/* MÉTODOS DE PAGO DEL DÍA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <PaymentIcon />
              💰 Flujo de Efectivo del Día
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                    color: darkProTokens.textPrimary,
                    borderRadius: 3,
                    border: `1px solid ${darkProTokens.success}40`,
                    boxShadow: `0 8px 32px ${darkProTokens.success}20`
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                      {formatPrice(stats.cashFlow.efectivo)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      💵 Efectivo
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
                    color: darkProTokens.textPrimary,
                    borderRadius: 3,
                    border: `1px solid ${darkProTokens.info}40`,
                    boxShadow: `0 8px 32px ${darkProTokens.info}20`
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                      {formatPrice(stats.cashFlow.transferencia)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      🏦 Transferencia
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.roleTrainer}, #00695c)`,
                    color: darkProTokens.textPrimary,
                    borderRadius: 3,
                    border: `1px solid ${darkProTokens.roleTrainer}40`,
                    boxShadow: `0 8px 32px ${darkProTokens.roleTrainer}20`
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                      {formatPrice(stats.cashFlow.debito)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      💳 Débito
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Paper sx={{
                    p: 3,
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})`,
                    color: darkProTokens.background,
                    borderRadius: 3,
                    border: `1px solid ${darkProTokens.warning}40`,
                    boxShadow: `0 8px 32px ${darkProTokens.warning}20`
                  }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                      {formatPrice(stats.cashFlow.credito)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 600 }}>
                      💳 Crédito
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* DESGLOSE DE INGRESOS DEL DÍA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.success, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <BarChartIcon />
              📊 Desglose de Ingresos del Día
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.info}40`,
                  borderRadius: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: darkProTokens.info, 
                    width: 56, 
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <SalesIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: darkProTokens.info, fontWeight: 800, mb: 1 }}>
                    {formatPrice(stats.todaySales)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                    Ventas POS
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                    {stats.todayTransactions} transacciones
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.success}40`,
                  borderRadius: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: darkProTokens.success, 
                    width: 56, 
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <FitnessCenterIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 800, mb: 1 }}>
                    {formatPrice(stats.todayMembershipRevenue)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                    Membresías
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                    Solo ventas de hoy
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{
                  p: 3,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                  border: `2px solid ${darkProTokens.warning}40`,
                  borderRadius: 3
                }}>
                  <Avatar sx={{ 
                    bgcolor: darkProTokens.warning, 
                    width: 56, 
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <LayawayIcon />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: darkProTokens.warning, fontWeight: 800, mb: 1 }}>
                    {formatPrice(stats.todayLayawayPayments)}
                  </Typography>
                  <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                    Abonos
                  </Typography>
                  <Typography variant="body2" sx={{ color: darkProTokens.textDisabled }}>
                    Apartados pagados hoy
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3, borderColor: darkProTokens.grayMedium }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ 
                color: stats.todayBalance >= 0 ? darkProTokens.success : darkProTokens.error, 
                fontWeight: 800,
                mb: 1
              }}>
                {formatPrice(stats.todayBalance)}
              </Typography>
              <Typography variant="h5" sx={{ color: darkProTokens.textSecondary, fontWeight: 600 }}>
                💎 Total de Ingresos del Día
              </Typography>
              <Typography variant="body2" sx={{ 
                color: darkProTokens.warning,
                fontWeight: 500,
                mt: 1
              }}>
                ⚡ Cálculo exacto: Solo movimientos de {formatDateLocal(selectedDate)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* ACCESOS RÁPIDOS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.primary, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <InsightsIcon />
              ⚡ Centro de Comando Enterprise
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    startIcon={<PersonAddIcon />}
                    onClick={() => router.push('/dashboard/admin/membresias/registrar')}
                    sx={{
                      background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})`,
                      justifyContent: 'flex-start',
                      py: 2,
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 700,
                      boxShadow: `0 8px 32px ${darkProTokens.success}30`,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 48px ${darkProTokens.success}40`
                      }
                    }}
                  >
                    💰 Nueva Venta
                  </Button>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<ReceiptIcon />}
                    onClick={() => router.push('/dashboard/admin/cortes')}
                    sx={{
                                            color: darkProTokens.info,
                      borderColor: `${darkProTokens.info}60`,
                      justifyContent: 'flex-start',
                      py: 2,
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                      borderWidth: '2px',
                      '&:hover': {
                        borderColor: darkProTokens.info,
                        bgcolor: `${darkProTokens.info}10`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    💼 Corte de Caja
                  </Button>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<AnalyticsIcon />}
                    onClick={() => router.push('/dashboard/admin/reportes')}
                    sx={{
                      color: darkProTokens.warning,
                      borderColor: `${darkProTokens.warning}60`,
                      justifyContent: 'flex-start',
                      py: 2,
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                      borderWidth: '2px',
                      '&:hover': {
                        borderColor: darkProTokens.warning,
                        bgcolor: `${darkProTokens.warning}10`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    📊 Reportes
                  </Button>
                </motion.div>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    startIcon={<FitnessCenterIcon />}
                    onClick={() => router.push('/dashboard/admin/planes')}
                    sx={{
                      color: darkProTokens.roleModerator,
                      borderColor: `${darkProTokens.roleModerator}60`,
                      justifyContent: 'flex-start',
                      py: 2,
                      px: 3,
                      borderRadius: 3,
                      fontWeight: 600,
                      borderWidth: '2px',
                      '&:hover': {
                        borderColor: darkProTokens.roleModerator,
                        bgcolor: `${darkProTokens.roleModerator}10`,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                    🏋️ Gestionar Planes
                  </Button>
                </motion.div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* COMPARATIVAS Y INFORMACIÓN ADICIONAL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* INFORMACIÓN DE USUARIOS */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.roleStaff, 
                  mb: 3, 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <PeopleIcon />
                  👥 Información de Usuarios
                </Typography>
                
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Total de Usuarios:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                      {stats.totalUsers}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Clientes Activos:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                      {stats.clientUsers}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Nuevos Hoy:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 700 }}>
                      +{stats.newUsersToday}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Nuevos Este Mes:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                      +{stats.newUsersMonth}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ borderColor: darkProTokens.grayMedium }} />
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 2 }}>
                      Distribución por Género:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        icon={<MaleIcon />}
                        label={`${stats.usersByGender.male} Hombres`}
                        size="small"
                        sx={{ 
                          bgcolor: `${darkProTokens.info}20`, 
                          color: darkProTokens.info,
                          fontWeight: 600
                        }}
                      />
                      <Chip 
                        icon={<FemaleIcon />}
                        label={`${stats.usersByGender.female} Mujeres`}
                        size="small"
                        sx={{ 
                          bgcolor: `${darkProTokens.roleModerator}20`, 
                          color: darkProTokens.roleModerator,
                          fontWeight: 600
                        }}
                      />
                      <Chip 
                        label={`${stats.usersByGender.other} Otros`}
                        size="small"
                        sx={{ 
                          bgcolor: `${darkProTokens.textSecondary}20`, 
                          color: darkProTokens.textSecondary,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* INFORMACIÓN DE MEMBRESÍAS */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 4,
              height: '100%'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ 
                  color: darkProTokens.success, 
                  mb: 3, 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <FitnessCenterIcon />
                  🏋️ Estado de Membresías
                </Typography>
                
                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Activas:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                      {stats.activeMemberships}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Por Vencer (7 días):
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                      {stats.expiringMemberships}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Vencidas:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.error, fontWeight: 700 }}>
                      {stats.expiredMemberships}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      Congeladas:
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.info, fontWeight: 700 }}>
                      {stats.frozenMemberships}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ borderColor: darkProTokens.grayMedium }} />
                  
                  <Box>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                      Ingresos por Membresías:
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                        Total Histórico:
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                        {formatPrice(stats.membershipRevenue)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: darkProTokens.textPrimary }}>
                        Solo Hoy:
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                        {formatPrice(stats.todayMembershipRevenue)}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* PLACEHOLDER PARA GRÁFICOS RECHARTS */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <Card sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `1px solid ${darkProTokens.grayDark}`,
          borderRadius: 4
        }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.success, 
              mb: 3, 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <BarChartIcon />
              📈 Gráficos Avanzados (Recharts)
            </Typography>
            
            <Box sx={{ 
              height: 250, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              bgcolor: `${darkProTokens.primary}10`,
              borderRadius: 3,
              border: `2px dashed ${darkProTokens.primary}40`
            }}>
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <BarChartIcon sx={{ fontSize: 80, color: darkProTokens.primary }} />
              </motion.div>
              <Typography variant="h5" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                Gráficos Enterprise Listos
              </Typography>
              <Typography variant="body1" sx={{ color: darkProTokens.textSecondary, textAlign: 'center' }}>
                Los gráficos profesionales con Recharts aparecerán aquí.<br />
                📊 Tendencias • 📈 Comparativas • 🥧 Distribuciones
              </Typography>
              <Chip
                label="Recharts Instalado ✅"
                sx={{
                  bgcolor: `${darkProTokens.success}20`,
                  color: darkProTokens.success,
                  fontWeight: 600
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* ESTILOS CSS ENTERPRISE */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 10px ${darkProTokens.primary}40;
          }
          50% {
            box-shadow: 0 0 30px ${darkProTokens.primary}60, 0 0 40px ${darkProTokens.primary}40;
          }
        }
        
        ::-webkit-scrollbar {
          width: 12px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 6px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 6px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
      `}</style>
    </Box>
  );
}
