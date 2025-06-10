'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  CircularProgress, 
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import PaymentIcon from '@mui/icons-material/Payment';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import InventoryIcon from '@mui/icons-material/Inventory';
import { formatCurrency } from '@/utils/formHelpers';

// Datos de ejemplo para las gráficas
const dummyDataVentas = [
  { name: 'Ene', ventas: 4000, pagos: 2400 },
  { name: 'Feb', ventas: 3000, pagos: 1398 },
  { name: 'Mar', ventas: 2000, pagos: 9800 },
  { name: 'Abr', ventas: 2780, pagos: 3908 },
  { name: 'May', ventas: 1890, pagos: 4800 },
  { name: 'Jun', ventas: 2390, pagos: 3800 },
];

const dummyDataPlanes = [
  { name: 'Mensual', value: 40 },
  { name: 'Trimestral', value: 30 },
  { name: 'Semestral', value: 20 },
  { name: 'Anual', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AdminDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    nuevosMes: 0,
    totalPagos: 0,
    pagosMes: 0,
    ventasMes: 0,
    productosVendidos: 0,
    stockBajo: 0
  });
  const [ultimosPagos, setUltimosPagos] = useState<any[]>([]);
  const [ultimosUsuarios, setUltimosUsuarios] = useState<any[]>([]);
  
  // Obtener datos estadísticos
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createBrowserSupabaseClient();
      
      // En una implementación real, aquí harías múltiples consultas a la API
      // para obtener las estadísticas desde tu backend
      
      // Por ahora, usaremos datos de ejemplo
      setTimeout(() => {
        setStats({
          totalUsuarios: 156,
          usuariosActivos: 124,
          nuevosMes: 18,
          totalPagos: 87600,
          pagosMes: 14500,
          ventasMes: 8700,
          productosVendidos: 45,
          stockBajo: 5
        });
        
        // Datos de ejemplo para últimos pagos
        setUltimosPagos([
          { id: '1', usuario: 'Laura Martínez', monto: 1200, fecha: '2025-06-03 15:30:45', plan: 'Mensual' },
          { id: '2', usuario: 'Carlos Sánchez', monto: 3200, fecha: '2025-06-03 11:45:12', plan: 'Trimestral' },
          { id: '3', usuario: 'Ana Gómez', monto: 1200, fecha: '2025-06-02 09:20:33', plan: 'Mensual' },
          { id: '4', usuario: 'Roberto Díaz', monto: 1200, fecha: '2025-06-01 16:10:05', plan: 'Mensual' },
        ]);
        
        // Datos de ejemplo para últimos usuarios
        setUltimosUsuarios([
          { id: '1', nombre: 'Sofia López', email: 'sofia@example.com', fecha: '2025-06-03 14:22:45' },
          { id: '2', nombre: 'Miguel Torres', email: 'miguel@example.com', fecha: '2025-06-02 10:15:33' },
          { id: '3', nombre: 'Isabel Ramírez', email: 'isabel@example.com', fecha: '2025-06-01 08:45:20' },
        ]);
        
        setLoading(false);
      }, 1000);
      
    } catch (err: any) {
      console.error('Error al obtener datos del dashboard:', err);
      setError('Error al cargar datos: ' + (err.message || 'Error desconocido'));
      setLoading(false);
    }
  };
  
  // Función para renderizar un KPI
  const renderKPI = (title: string, value: string | number, icon: JSX.Element, changeValue: number, changeText: string, color: string) => {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          height: '100%',
          borderRadius: '12px',
          backgroundColor: 'rgba(25, 25, 25, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '-20px', 
          right: '-20px', 
          width: '100px', 
          height: '100px',
          borderRadius: '50%',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.7
        }}>
          {icon}
        </Box>
        
        <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {title}
        </Typography>
        
        <Typography variant="h4" sx={{ fontWeight: 600, my: 1, color: 'white' }}>
          {value}
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mt: 'auto'
        }}>
          {changeValue >= 0 ? (
            <TrendingUpIcon sx={{ color: '#4caf50', mr: 0.5, fontSize: '1rem' }} />
          ) : (
            <TrendingDownIcon sx={{ color: '#f44336', mr: 0.5, fontSize: '1rem' }} />
          )}
          <Typography 
            variant="caption" 
            sx={{ 
              color: changeValue >= 0 ? '#4caf50' : '#f44336',
              fontWeight: 500
            }}
          >
            {Math.abs(changeValue)}% {changeText}
          </Typography>
        </Box>
      </Paper>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 600 }}>
          Dashboard
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={loading}
          sx={{
            borderColor: 'rgba(255, 204, 0, 0.5)',
            color: '#ffcc00',
            '&:hover': {
              borderColor: '#ffcc00',
              backgroundColor: 'rgba(255, 204, 0, 0.1)',
            },
          }}
        >
          Actualizar
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 10 }}>
          <CircularProgress sx={{ color: '#ffcc00' }} />
        </Box>
      ) : (
        <>
          {/* KPIs principales */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {renderKPI(
                  'Usuarios Totales',
                  stats.totalUsuarios,
                  <PeopleIcon sx={{ fontSize: 40, color: '#2196f3' }} />,
                  12,
                  'vs mes anterior',
                  '#2196f3'
                )}
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {renderKPI(
                  'Ingresos del Mes',
                  formatCurrency(stats.pagosMes),
                  <PaymentIcon sx={{ fontSize: 40, color: '#4caf50' }} />,
                  8.5,
                  'vs mes anterior',
                  '#4caf50'
                )}
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {renderKPI(
                  'Ventas del Mes',
                  formatCurrency(stats.ventasMes),
                  <StorefrontIcon sx={{ fontSize: 40, color: '#ff9800' }} />,
                  -4.2,
                  'vs mes anterior',
                  '#ff9800'
                )}
              </motion.div>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {renderKPI(
                  'Nuevos Usuarios',
                  stats.nuevosMes,
                  <PeopleIcon sx={{ fontSize: 40, color: '#e91e63' }} />,
                  15.8,
                  'vs mes anterior',
                  '#e91e63'
                )}
              </motion.div>
            </Grid>
          </Grid>
          
          {/* Gráficas y tablas */}
          <Grid container spacing={3}>
            {/* Gráfica de ingresos */}
            <Grid item xs={12} lg={8}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card sx={{ 
                  borderRadius: '12px',
                  backgroundColor: 'rgba(25, 25, 25, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardHeader
                    title="Ingresos Mensuales"
                    titleTypographyProps={{ 
                      variant: 'h6', 
                      color: 'white',
                      fontWeight: 600
                    }}
                    action={
                      <IconButton aria-label="settings" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        <MoreVertIcon />
                      </IconButton>
                    }
                    sx={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      px: 3,
                      py: 2
                    }}
                  />
                  <CardContent sx={{ flex: 1, px: 2, py: 2 }}>
                    <Box sx={{ height: 300, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dummyDataVentas}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                          />
                          <YAxis 
                            tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(30, 30, 30, 0.95)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                            itemStyle={{ color: 'white' }}
                            formatter={(value) => [`$${value}`, '']}
                          />
                          <Legend 
                            wrapperStyle={{ color: 'white' }}
                          />
                          <Bar dataKey="ventas" name="Ventas de Productos" fill="#ff9800" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="pagos" name="Pagos de Membresías" fill="#4caf50" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            {/* Distribución de planes */}
            <Grid item xs={12} sm={6} lg={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card sx={{ 
                  borderRadius: '12px',
                  backgroundColor: 'rgba(25, 25, 25, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardHeader
                    title="Distribución de Planes"
                    titleTypographyProps={{ 
                      variant: 'h6', 
                      color: 'white',
                      fontWeight: 600
                    }}
                    action={
                      <IconButton aria-label="settings" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        <MoreVertIcon />
                      </IconButton>
                    }
                    sx={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      px: 3,
                      py: 2
                    }}
                  />
                  <CardContent sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box sx={{ height: 250, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dummyDataPlanes}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {dummyDataPlanes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(30, 30, 30, 0.95)',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '8px',
                              color: 'white'
                            }}
                            formatter={(value) => [`${value} usuarios`, '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            {/* Últimos pagos */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card sx={{ 
                  borderRadius: '12px',
                  backgroundColor: 'rgba(25, 25, 25, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardHeader
                    title="Últimos Pagos"
                    titleTypographyProps={{ 
                      variant: 'h6', 
                      color: 'white',
                      fontWeight: 600
                    }}
                    action={
                      <Button 
                        variant="text" 
                        size="small"
                        onClick={() => router.push('/dashboard/admin/pagos')}
                        sx={{ 
                          color: '#ffcc00',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 204, 0, 0.1)',
                          }
                        }}
                      >
                        Ver Todos
                      </Button>
                    }
                    sx={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      px: 3,
                      py: 2
                    }}
                  />
                  <CardContent sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
                    <List sx={{ p: 0 }}>
                      {ultimosPagos.map((pago, index) => (
                        <React.Fragment key={pago.id}>
                          <ListItem 
                            alignItems="flex-start"
                            sx={{ 
                              px: 3, 
                              py: 2,
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  bgcolor: 'rgba(76, 175, 80, 0.2)', 
                                  color: '#4caf50',
                                  width: 40,
                                  height: 40
                                }}
                              >
                                <PaymentIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                                  {pago.usuario}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                  >
                                    Plan: {pago.plan}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mt: 0.5 }}
                                  >
                                    {new Date(pago.fecha).toLocaleString()}
                                  </Typography>
                                </Box>
                              }
                              sx={{ my: 0 }}
                            />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#4caf50', 
                                fontWeight: 'bold',
                                ml: 2,
                                alignSelf: 'center'
                              }}
                            >
                              {formatCurrency(pago.monto)}
                            </Typography>
                          </ListItem>
                          {index < ultimosPagos.length - 1 && (
                            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            
            {/* Últimos usuarios */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card sx={{ 
                  borderRadius: '12px',
                  backgroundColor: 'rgba(25, 25, 25, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: 'none',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <CardHeader
                    title="Nuevos Usuarios"
                    titleTypographyProps={{ 
                      variant: 'h6', 
                      color: 'white',
                      fontWeight: 600
                    }}
                    action={
                      <Button 
                        variant="text" 
                        size="small"
                        onClick={() => router.push('/dashboard/admin/usuarios')}
                        sx={{ 
                          color: '#ffcc00',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 204, 0, 0.1)',
                          }
                        }}
                      >
                        Ver Todos
                      </Button>
                    }
                    sx={{ 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      px: 3,
                      py: 2
                    }}
                  />
                  <CardContent sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
                    <List sx={{ p: 0 }}>
                      {ultimosUsuarios.map((usuario, index) => (
                        <React.Fragment key={usuario.id}>
                          <ListItem 
                            alignItems="flex-start"
                            sx={{ 
                              px: 3, 
                              py: 2,
                              '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              }
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar 
                                sx={{ 
                                  bgcolor: 'rgba(33, 150, 243, 0.2)', 
                                  color: '#2196f3',
                                  width: 40,
                                  height: 40
                                }}
                              >
                                {usuario.nombre.charAt(0)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                                  {usuario.nombre}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                  >
                                    {usuario.email}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block', mt: 0.5 }}
                                  >
                                    {new Date(usuario.fecha).toLocaleString()}
                                  </Typography>
                                </Box>
                              }
                              sx={{ my: 0 }}
                            />
                          </ListItem>
                          {index < ultimosUsuarios.length - 1 && (
                            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.05)' }} />
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}