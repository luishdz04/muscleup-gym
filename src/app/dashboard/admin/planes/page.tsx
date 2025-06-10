'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Iconos siguiendo tu estructura
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import GroupIcon from '@mui/icons-material/Group';
import DashboardIcon from '@mui/icons-material/Dashboard';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  inscription_price: number;
  visit_price: number;
  weekly_price: number;
  monthly_price: number;
  quarterly_price: number;
  annual_price: number;
  features: string[];
  gym_access: boolean;
  classes_included: boolean;
  guest_passes: number;
  has_time_restrictions: boolean;
  allowed_days: number[];
  time_slots: { start: string; end: string }[];
  created_at: string;
}

export default function PlanesPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Cargar planes
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createBrowserSupabaseClient();
      
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .order('monthly_price', { ascending: true });

      if (error) throw error;
      
      setPlans(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle activo/inactivo
  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      const { error } = await supabase
        .from('membership_plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;
      
      // Actualizar estado local
      setPlans(prevPlans =>
        prevPlans.map(plan =>
          plan.id === planId ? { ...plan, is_active: !currentStatus } : plan
        )
      );
      
      setSuccessMessage(`Plan ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // Formatear días
  const formatDays = (days: number[]) => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days.map(day => dayNames[day]).join(', ');
  };

  // Ver detalles del plan
  const viewPlanDetails = (plan: MembershipPlan) => {
    setSelectedPlan(plan);
    setViewDialogOpen(true);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        sx={{
          background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
          color: 'white'
        }}
      >
        <CircularProgress sx={{ color: '#4caf50' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 3, 
      background: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)',
      minHeight: '100vh',
      color: 'white'
    }}>
      {/* Header siguiendo tu estilo */}
      <Paper sx={{
        p: 3,
        mb: 3,
        background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(45, 45, 45, 0.9))',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" sx={{ 
              color: '#4caf50', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <FitnessCenterIcon sx={{ fontSize: 40 }} />
              Gestión de Planes
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Administra el catálogo de membresías disponibles
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadPlans}
              sx={{ 
                color: '#ffcc00',
                borderColor: 'rgba(255, 204, 0, 0.5)',
                '&:hover': {
                  borderColor: '#ffcc00',
                  backgroundColor: 'rgba(255, 204, 0, 0.1)',
                }
              }}
              variant="outlined"
            >
              Actualizar
            </Button>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/dashboard/admin/planes/crear')}
              sx={{
                background: 'linear-gradient(135deg, #4caf50, #45a049)',
                fontWeight: 600,
                px: 3,
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(135deg, #45a049, #388e3c)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Crear Nuevo Plan
            </Button>
          </Box>
        </Box>

        {/* Información de resultados */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          bgcolor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: 2,
          border: '1px solid rgba(76, 175, 80, 0.3)'
        }}>
          <Typography sx={{ color: 'white', fontWeight: 600 }}>
            📊 Total de planes: {plans.length}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`${plans.filter(p => p.is_active).length} activos`}
              size="small"
              sx={{
                bgcolor: 'rgba(76, 175, 80, 0.2)',
                color: '#4caf50',
                border: '1px solid rgba(76, 175, 80, 0.3)'
              }}
            />
            <Chip
              icon={<CancelIcon />}
              label={`${plans.filter(p => !p.is_active).length} inactivos`}
              size="small"
              sx={{
                bgcolor: 'rgba(244, 67, 54, 0.2)',
                color: '#f44336',
                border: '1px solid rgba(244, 67, 54, 0.3)'
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Error y Success Messages */}
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
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Estadísticas rápidas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{
            p: 3,
            background: 'linear-gradient(135deg, #4caf50, #45a049)',
            color: 'white',
            borderRadius: 3,
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {plans.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Total Planes
                </Typography>
              </Box>
              <FitnessCenterIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{
            p: 3,
            background: 'linear-gradient(135deg, #2196f3, #1976d2)',
            color: 'white',
            borderRadius: 3,
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {plans.filter(p => p.is_active).length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Planes Activos
                </Typography>
              </Box>
              <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{
            p: 3,
            background: 'linear-gradient(135deg, #ff9800, #f57c00)',
            color: 'white',
            borderRadius: 3,
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {plans.filter(p => p.has_time_restrictions).length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Con Restricciones
                </Typography>
              </Box>
              <AccessTimeIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{
            p: 3,
            background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
            color: 'white',
            borderRadius: 3,
            transition: 'transform 0.3s ease',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {plans.filter(p => p.classes_included).length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Con Clases
                </Typography>
              </Box>
              <GroupIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de planes */}
      <TableContainer 
        component={Paper} 
        sx={{
          background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(45, 45, 45, 0.95))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          '& .MuiTableCell-root': {
            bgcolor: 'transparent !important',
            color: 'white !important',
            borderColor: 'rgba(255, 255, 255, 0.1) !important'
          }
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Plan
              </TableCell>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Precios
              </TableCell>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Características
              </TableCell>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Restricciones
              </TableCell>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Estado
              </TableCell>
              <TableCell sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.2) !important', 
                color: 'white !important', 
                fontWeight: 700,
                borderBottom: '2px solid rgba(76, 175, 80, 0.5)'
              }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan) => (
              <TableRow 
                key={plan.id}
                component={motion.tr}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: 'rgba(76, 175, 80, 0.05)' 
                  }
                }}
              >
                <TableCell>
                  <Box>
                    <Typography variant="subtitle1" sx={{ 
                      color: 'white', 
                      fontWeight: 'bold' 
                    }}>
                      {plan.name}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: 'rgba(255,255,255,0.7)' 
                    }}>
                      {plan.description}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'white' }}>
                      <strong>Mensual:</strong> {formatPrice(plan.monthly_price)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Inscripción: {formatPrice(plan.inscription_price)}
                    </Typography>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {plan.gym_access && (
                      <Chip 
                        size="small" 
                        label="Gimnasio" 
                        sx={{ bgcolor: 'rgba(76,175,80,0.2)', color: '#4caf50' }}
                      />
                    )}
                    {plan.classes_included && (
                      <Chip 
                        size="small" 
                        label="Clases" 
                        sx={{ bgcolor: 'rgba(156,39,176,0.2)', color: '#9c27b0' }}
                      />
                    )}
                    {plan.guest_passes > 0 && (
                      <Chip 
                        size="small" 
                        label={`${plan.guest_passes} Invitados`}
                        icon={<GroupIcon />}
                        sx={{ bgcolor: 'rgba(255,152,0,0.2)', color: '#ff9800' }}
                      />
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  {plan.has_time_restrictions ? (
                    <Chip 
                      size="small" 
                      label="Con Horarios"
                      icon={<AccessTimeIcon />}
                      sx={{ bgcolor: 'rgba(255,193,7,0.2)', color: '#ffc107' }}
                    />
                  ) : (
                    <Chip 
                      size="small" 
                      label="24/7"
                      sx={{ bgcolor: 'rgba(76,175,80,0.2)', color: '#4caf50' }}
                    />
                  )}
                </TableCell>
                
                <TableCell>
                  <Switch
                    checked={plan.is_active}
                    onChange={() => togglePlanStatus(plan.id, plan.is_active)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#4caf50',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#4caf50',
                      },
                    }}
                  />
                </TableCell>
                
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Ver detalles">
                      <IconButton 
                        size="small"
                        onClick={() => viewPlanDetails(plan)}
                        sx={{ color: '#2196f3' }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Editar">
                      <IconButton 
                        size="small"
                        onClick={() => router.push(`/dashboard/admin/planes/${plan.id}/editar`)}
                        sx={{ color: '#ffcc00' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Eliminar">
                      <IconButton 
                        size="small"
                        sx={{ color: '#f44336' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de detalles */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(45, 45, 45, 0.9))',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: '#4caf50', fontWeight: 'bold' }}>
          {selectedPlan?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
                {selectedPlan.description}
              </Typography>
              
              <Divider sx={{ borderColor: 'rgba(76, 175, 80, 0.3)', my: 2 }} />
              
              <Typography variant="h6" sx={{ color: '#4caf50', mb: 1 }}>
                Precios
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {selectedPlan.visit_price > 0 && (
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="body2">
                      <strong>Visita:</strong> {formatPrice(selectedPlan.visit_price)}
                    </Typography>
                  </Grid>
                )}
                {selectedPlan.weekly_price > 0 && (
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="body2">
                      <strong>Semanal:</strong> {formatPrice(selectedPlan.weekly_price)}
                    </Typography>
                  </Grid>
                )}
                {selectedPlan.monthly_price > 0 && (
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="body2">
                      <strong>Mensual:</strong> {formatPrice(selectedPlan.monthly_price)}
                    </Typography>
                  </Grid>
                )}
                {selectedPlan.quarterly_price > 0 && (
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="body2">
                      <strong>Trimestral:</strong> {formatPrice(selectedPlan.quarterly_price)}
                    </Typography>
                  </Grid>
                )}
                {selectedPlan.annual_price > 0 && (
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <Typography variant="body2">
                      <strong>Anual:</strong> {formatPrice(selectedPlan.annual_price)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              
              {selectedPlan.features && selectedPlan.features.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ color: '#4caf50', mb: 1 }}>
                    Características
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {selectedPlan.features.map((feature, index) => (
                      <Chip 
                        key={index}
                        label={feature}
                        size="small"
                        sx={{ 
                          mr: 1, 
                          mb: 1,
                          bgcolor: 'rgba(76, 175, 80, 0.2)',
                          color: '#4caf50'
                        }}
                      />
                    ))}
                  </Box>
                </>
              )}
              
              {selectedPlan.has_time_restrictions && (
                <>
                  <Typography variant="h6" sx={{ color: '#4caf50', mb: 1 }}>
                    Restricciones de Horario
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Días permitidos:</strong> {formatDays(selectedPlan.allowed_days)}
                  </Typography>
                  {selectedPlan.time_slots.map((slot, index) => (
                    <Typography key={index} variant="body2">
                      <strong>Horario:</strong> {slot.start} - {slot.end}
                    </Typography>
                  ))}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setViewDialogOpen(false)}
            sx={{ color: '#4caf50' }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}