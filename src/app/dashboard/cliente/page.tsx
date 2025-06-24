"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCalendar, 
  FaIdCard,
  FaDumbbell,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaHeartbeat,
  FaAward
} from 'react-icons/fa';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatMexicoDateTime, toMexicoDate } from '@/utils/dateHelpers';

// 🎨 DARK PRO SYSTEM - TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  grayDark: '#333333',
  grayMedium: '#444444',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  success: '#388E3C',
  error: '#D32F2F',
  warning: '#FFB300',
  info: '#1976D2'
};

interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  isMinor: boolean;
  created_at: string;
  profilePictureUrl?: string;
  rol?: string;
}

interface UserAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  medicalCondition: string;
  bloodType: string;
}

interface MembershipInfo {
  referredBy: string;
  mainMotivation: string;
  receivePlans: boolean;
  trainingLevel: string;
}

interface ActiveMembership {
  id: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string | null;
  daysRemaining: number;
  isActive: boolean;
  totalFrozenDays: number;
}

export default function ClienteDashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [address, setAddress] = useState<UserAddress | null>(null);
  const [emergency, setEmergency] = useState<EmergencyContact | null>(null);
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  // ✅ FUNCIÓN PARA CALCULAR EDAD CON VALIDACIÓN
  const calculateAge = useCallback((birthDate: string): number => {
    try {
      if (!birthDate) return 0;
      
      const today = new Date();
      const birth = new Date(birthDate);
      
      // Verificar que la fecha sea válida
      if (isNaN(birth.getTime())) return 0;
      
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return Math.max(0, age); // No devolver edades negativas
    } catch (error) {
      console.error('Error calculando edad:', error);
      return 0;
    }
  }, []);

  // ✅ FUNCIÓN PARA CALCULAR DÍAS COMO MIEMBRO CON VALIDACIÓN
  const calculateDaysAsMember = useCallback((registrationDate: string): number => {
    try {
      if (!registrationDate) return 0;
      
      const today = new Date();
      const registration = new Date(registrationDate);
      
      // Verificar que la fecha sea válida
      if (isNaN(registration.getTime())) return 0;
      
      const diffTime = today.getTime() - registration.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays); // No devolver días negativos
    } catch (error) {
      console.error('Error calculando días como miembro:', error);
      return 0;
    }
  }, []);

  // ✅ FUNCIÓN PARA CALCULAR DÍAS RESTANTES CON VALIDACIÓN
  const calculateDaysRemaining = useCallback((endDate: string | null): number => {
    try {
      if (!endDate) return 0;
      
      const today = new Date();
      const end = new Date(endDate);
      
      // Verificar que la fecha sea válida
      if (isNaN(end.getTime())) return 0;
      
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays; // Puede ser negativo si ya venció
    } catch (error) {
      console.error('Error calculando días restantes:', error);
      return 0;
    }
  }, []);

  // ✅ FUNCIÓN PARA FORMATEAR FECHAS CON FALLBACK
  const formatDate = useCallback((dateString: string): string => {
    try {
      if (!dateString) return 'Fecha no disponible';
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return formatMexicoDateTime(dateString, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha no disponible';
    }
  }, []);

  // ✅ CARGAR DATOS CON MEJOR MANEJO DE ERRORES
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        throw new Error(`Error de autenticación: ${authError.message}`);
      }
      
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }

      console.log('Usuario autenticado:', user.id);

      // Cargar información básica del usuario
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error cargando datos de usuario:', userError);
        throw new Error(`Error al cargar datos del usuario: ${userError.message}`);
      }
      
      if (!userData) {
        throw new Error('No se encontraron datos del usuario');
      }

      console.log('Datos del usuario cargados:', userData);
      setUserInfo(userData);

      // Solo cargar datos adicionales si es un cliente
      if (userData?.rol === 'cliente') {
        console.log('Cargando datos adicionales para cliente...');
        
        // Cargar dirección (sin lanzar error si no existe)
        try {
          const { data: addressData, error: addressError } = await supabase
            .from('addresses')
            .select('*')
            .eq('userId', user.id)
            .maybeSingle(); // maybeSingle permite que no exista

          if (addressError && addressError.code !== 'PGRST116') {
            console.error('Error cargando dirección:', addressError);
          } else if (addressData) {
            console.log('Dirección cargada:', addressData);
            setAddress(addressData);
          }
        } catch (err) {
          console.error('Error en carga de dirección:', err);
        }

        // Cargar contacto de emergencia
        try {
          const { data: emergencyData, error: emergencyError } = await supabase
            .from('emergency_contacts')
            .select('*')
            .eq('userId', user.id)
            .maybeSingle();

          if (emergencyError && emergencyError.code !== 'PGRST116') {
            console.error('Error cargando contacto de emergencia:', emergencyError);
          } else if (emergencyData) {
            console.log('Contacto de emergencia cargado:', emergencyData);
            setEmergency(emergencyData);
          }
        } catch (err) {
          console.error('Error en carga de contacto de emergencia:', err);
        }

        // Cargar información de membresía
        try {
          const { data: membershipData, error: membershipError } = await supabase
            .from('membership_info')
            .select('*')
            .eq('userId', user.id)
            .maybeSingle();

          if (membershipError && membershipError.code !== 'PGRST116') {
            console.error('Error cargando info de membresía:', membershipError);
          } else if (membershipData) {
            console.log('Info de membresía cargada:', membershipData);
            setMembershipInfo(membershipData);
          }
        } catch (err) {
          console.error('Error en carga de info de membresía:', err);
        }

        // Cargar membresía activa
        try {
          const { data: activeMembershipData, error: activeMembershipError } = await supabase
            .from('user_memberships')
            .select(`
              *,
              membership_plans!planid (name)
            `)
            .eq('userid', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);

          if (activeMembershipError) {
            console.error('Error cargando membresía activa:', activeMembershipError);
          } else if (activeMembershipData && activeMembershipData.length > 0) {
            const membership = activeMembershipData[0];
            const daysRemaining = calculateDaysRemaining(membership.end_date);
            
            console.log('Membresía activa cargada:', membership);
            
            setActiveMembership({
              id: membership.id,
              planName: membership.membership_plans?.name || 'Plan No Disponible',
              status: membership.status,
              startDate: membership.start_date,
              endDate: membership.end_date,
              daysRemaining,
              isActive: daysRemaining > 0,
              totalFrozenDays: membership.total_frozen_days || 0
            });
          }
        } catch (err) {
          console.error('Error en carga de membresía activa:', err);
        }
      }

    } catch (err: any) {
      console.error('Error general cargando datos:', err);
      setError(err.message || 'Error desconocido al cargar información');
    } finally {
      setLoading(false);
    }
  }, [supabase, calculateDaysRemaining]);

  // ✅ CARGAR DATOS AL MONTAR COMPONENTE
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // ✅ ANIMACIONES
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  // ✅ ESTADO DE LOADING
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} sx={{ color: darkProTokens.primary }} />
        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
          Cargando tu información...
        </Typography>
      </Box>
    );
  }

  // ✅ ESTADO DE ERROR
  if (error || !userInfo) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{
          backgroundColor: `${darkProTokens.error}10`,
          color: darkProTokens.textPrimary,
          border: `1px solid ${darkProTokens.error}30`
        }}>
          {error || 'No se pudo cargar la información del usuario'}
        </Alert>
      </Box>
    );
  }

  // Calcular valores con validación
  const userAge = calculateAge(userInfo.birthDate);
  const daysAsMember = calculateDaysAsMember(userInfo.created_at);
  const formattedBirthDate = formatDate(userInfo.birthDate);
  const formattedRegistrationDate = formatDate(userInfo.created_at);

  return (
    <Box sx={{ 
      maxWidth: '1400px', 
      mx: 'auto',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      minHeight: '100vh',
      p: 3
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem' }}
      >
        <Typography variant="h3" sx={{ 
          fontWeight: 800, 
          color: darkProTokens.textPrimary,
          mb: 1
        }}>
          Mi <span style={{ color: darkProTokens.primary }}>Información</span>
        </Typography>
        <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
          Vista general de tu perfil y membresía
        </Typography>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {/* Tarjeta de Perfil Principal */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <motion.div variants={itemVariants}>
              <Card sx={{
                background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                border: `1px solid ${darkProTokens.grayDark}`,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                    <Avatar
                      src={userInfo.profilePictureUrl}
                      sx={{
                        width: 80,
                        height: 80,
                        border: `3px solid ${darkProTokens.primary}`,
                        fontSize: '2rem',
                        fontWeight: 800,
                        background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                        color: darkProTokens.background
                      }}
                    >
                      {userInfo.firstName && userInfo.lastName ? 
                        `${userInfo.firstName[0]}${userInfo.lastName[0]}` : 
                        '??'
                      }
                    </Avatar>
                    
                    <Box>
                      <Typography variant="h4" sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 700,
                        mb: 1
                      }}>
                        {userInfo.firstName} {userInfo.lastName}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {userAge > 0 && (
                          <Chip 
                            label={`${userAge} años`}
                            sx={{
                              backgroundColor: darkProTokens.info,
                              color: darkProTokens.textPrimary,
                              fontWeight: 600
                            }}
                            size="small"
                          />
                        )}
                        
                        {userInfo.gender && (
                          <Chip 
                            label={userInfo.gender}
                            sx={{
                              backgroundColor: darkProTokens.success,
                              color: darkProTokens.textPrimary,
                              fontWeight: 600
                            }}
                            size="small"
                          />
                        )}
                        
                        {userInfo.isMinor && (
                          <Chip 
                            label="MENOR DE EDAD"
                            sx={{
                              backgroundColor: darkProTokens.warning,
                              color: darkProTokens.background,
                              fontWeight: 700
                            }}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="h6" sx={{ 
                    color: darkProTokens.primary, 
                    fontWeight: 700,
                    mb: 3
                  }}>
                    Datos Personales
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Email */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <FaEnvelope style={{ color: darkProTokens.primary }} />
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Email
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {userInfo.email || 'No disponible'}
                      </Typography>
                    </Grid>

                    {/* WhatsApp */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <FaPhone style={{ color: darkProTokens.primary }} />
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          WhatsApp
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {userInfo.whatsapp || 'No disponible'}
                      </Typography>
                    </Grid>

                    {/* Fecha de Nacimiento */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <FaCalendar style={{ color: darkProTokens.primary }} />
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Fecha de Nacimiento
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formattedBirthDate}
                      </Typography>
                    </Grid>

                    {/* Estado Civil */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <FaUser style={{ color: darkProTokens.primary }} />
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          Estado Civil
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {userInfo.maritalStatus || 'No especificado'}
                      </Typography>
                    </Grid>

                    {/* ID de Usuario */}
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <FaIdCard style={{ color: darkProTokens.primary }} />
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          ID de Cliente
                        </Typography>
                      </Box>
                      <Typography variant="body1" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 600,
                        fontFamily: 'monospace'
                      }}>
                        {userInfo.id}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Tarjeta de Membresía */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <motion.div variants={itemVariants}>
              <Card sx={{
                background: activeMembership?.isActive ? 
                  `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})` :
                  `linear-gradient(135deg, ${darkProTokens.error}, #B71C1C)`,
                color: darkProTokens.background,
                borderRadius: 4
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      Mi Membresía
                    </Typography>
                    <FaDumbbell style={{ fontSize: '2rem' }} />
                  </Box>

                  {activeMembership ? (
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                          Plan Actual
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {activeMembership.planName}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FaCheckCircle />
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {activeMembership.isActive ? 'ACTIVA' : 'VENCIDA'}
                        </Typography>
                      </Box>

                      {activeMembership.endDate && (
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                            {activeMembership.isActive ? 'Vence el' : 'Venció el'}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            {formatDate(activeMembership.endDate)}
                          </Typography>
                        </Box>
                      )}

                      {activeMembership.totalFrozenDays > 0 && (
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                            Días Congelados
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            🧊 {activeMembership.totalFrozenDays} días
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        Sin Membresía Activa
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Contacta al gimnasio para activar tu membresía
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Estadísticas Rápidas */}
          <Grid size={{ xs: 12 }}>
            <motion.div variants={itemVariants}>
              <Grid container spacing={3}>
                {/* Días como miembro */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `1px solid ${darkProTokens.grayDark}`,
                    borderRadius: 3,
                    textAlign: 'center'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <FaClock style={{ 
                        fontSize: '3rem', 
                        color: darkProTokens.primary, 
                        marginBottom: '1rem' 
                      }} />
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                        Miembro desde hace
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 800 
                      }}>
                        {daysAsMember} días
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Días restantes */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `1px solid ${darkProTokens.grayDark}`,
                    borderRadius: 3,
                    textAlign: 'center'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <FaCalendar style={{ 
                        fontSize: '3rem', 
                        color: darkProTokens.primary, 
                        marginBottom: '1rem' 
                      }} />
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                        {activeMembership?.isActive ? 'Días restantes' : 'Estado de membresía'}
                      </Typography>
                      <Typography variant="h4" sx={{ 
                        color: activeMembership?.isActive ? darkProTokens.success : darkProTokens.error, 
                        fontWeight: 800 
                      }}>
                        {activeMembership?.isActive ? 
                          `${activeMembership.daysRemaining}` : 
                          'Vencida'
                        }
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Fecha de registro */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                    border: `1px solid ${darkProTokens.grayDark}`,
                    borderRadius: 3,
                    textAlign: 'center'
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <FaAward style={{ 
                        fontSize: '3rem', 
                        color: darkProTokens.primary, 
                        marginBottom: '1rem' 
                      }} />
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                        Miembro desde
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: darkProTokens.textPrimary, 
                        fontWeight: 700 
                      }}>
                        {formattedRegistrationDate}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          </Grid>

          {/* Información Adicional (solo si es cliente) */}
          {userInfo.rol === 'cliente' && (address || emergency || membershipInfo) && (
            <Grid size={{ xs: 12 }}>
              <motion.div variants={itemVariants}>
                <Card sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
                  border: `1px solid ${darkProTokens.grayDark}`,
                  borderRadius: 4
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ 
                      color: darkProTokens.primary, 
                      fontWeight: 700,
                      mb: 3
                    }}>
                      Información Adicional
                    </Typography>

                    <Grid container spacing={4}>
                      {/* Dirección */}
                      {address && (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <FaMapMarkerAlt style={{ color: darkProTokens.primary }} />
                              <Typography variant="subtitle1" sx={{ 
                                color: darkProTokens.textPrimary, 
                                fontWeight: 600 
                              }}>
                                Dirección
                              </Typography>
                            </Box>
                            <Stack spacing={1}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                📍 {address.street} #{address.number}
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                🏘️ {address.neighborhood}
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                🌆 {address.city}, {address.state}
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                📮 CP: {address.postalCode}
                              </Typography>
                            </Stack>
                          </Box>
                        </Grid>
                      )}

                      {/* Contacto de Emergencia */}
                      {emergency && (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <FaHeartbeat style={{ color: darkProTokens.error }} />
                              <Typography variant="subtitle1" sx={{ 
                                color: darkProTokens.textPrimary, 
                                fontWeight: 600 
                              }}>
                                Contacto de Emergencia
                              </Typography>
                            </Box>
                            <Stack spacing={1}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                👤 {emergency.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                📞 {emergency.phone}
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                🩸 Tipo: {emergency.bloodType}
                              </Typography>
                            </Stack>
                          </Box>
                        </Grid>
                      )}

                      {/* Info de Membresía */}
                      {membershipInfo && (
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <FaDumbbell style={{ color: darkProTokens.info }} />
                              <Typography variant="subtitle1" sx={{ 
                                color: darkProTokens.textPrimary, 
                                fontWeight: 600 
                              }}>
                                Perfil de Entrenamiento
                              </Typography>
                            </Box>
                            <Stack spacing={1}>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                🏋️‍♂️ Nivel: {membershipInfo.trainingLevel}
                              </Typography>
                              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                🎯 Motivación: {membershipInfo.mainMotivation}
                              </Typography>
                              {membershipInfo.referredBy && (
                                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                                  👥 Referido por: {membershipInfo.referredBy}
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          )}
        </Grid>
      </motion.div>
    </Box>
  );
}
