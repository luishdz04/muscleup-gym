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

  // ✅ FUNCIÓN PARA CALCULAR EDAD
  const calculateAge = useCallback((birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }, []);

  // ✅ FUNCIÓN PARA CALCULAR DÍAS COMO MIEMBRO
  const calculateDaysAsMember = useCallback((registrationDate: string): number => {
    const today = new Date();
    const registration = new Date(registrationDate);
    const diffTime = today.getTime() - registration.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // ✅ FUNCIÓN PARA CALCULAR DÍAS RESTANTES DE MEMBRESÍA
  const calculateDaysRemaining = useCallback((endDate: string | null): number => {
    if (!endDate) return 0;
    
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // ✅ FUNCIÓN PARA FORMATEAR FECHAS
  const formatDate = useCallback((dateString: string): string => {
    try {
      return formatMexicoDateTime(dateString, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  }, []);

  // ✅ CARGAR DATOS DEL USUARIO AUTENTICADO
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('No se pudo obtener el usuario autenticado');
      }

      // Cargar información básica del usuario
      const { data: userData, error: userError } = await supabase
        .from('Users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      
      if (userData) {
        setUserInfo(userData);
      }

      // Solo cargar datos adicionales si es un cliente
      if (userData?.rol === 'cliente') {
        // Cargar dirección
        const { data: addressData } = await supabase
          .from('addresses')
          .select('*')
          .eq('userId', user.id)
          .single();

        if (addressData) setAddress(addressData);

        // Cargar contacto de emergencia
        const { data: emergencyData } = await supabase
          .from('emergency_contacts')
          .select('*')
          .eq('userId', user.id)
          .single();

        if (emergencyData) setEmergency(emergencyData);

        // Cargar información de membresía
        const { data: membershipData } = await supabase
          .from('membership_info')
          .select('*')
          .eq('userId', user.id)
          .single();

        if (membershipData) setMembershipInfo(membershipData);

        // Cargar membresía activa
        const { data: activeMembershipData } = await supabase
          .from('user_memberships')
          .select(`
            *,
            membership_plans!planid (name)
          `)
          .eq('userid', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (activeMembershipData && activeMembershipData.length > 0) {
          const membership = activeMembershipData[0];
          const daysRemaining = calculateDaysRemaining(membership.end_date);
          
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
      }

    } catch (err: any) {
      console.error('Error cargando datos del usuario:', err);
      setError(`Error al cargar información: ${err.message}`);
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
                      {`${userInfo.firstName[0]}${userInfo.lastName[0]}`}
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
                        <Chip 
                          label={`${calculateAge(userInfo.birthDate)} años`}
                          sx={{
                            backgroundColor: darkProTokens.info,
                            color: darkProTokens.textPrimary,
                            fontWeight: 600
                          }}
                          size="small"
                        />
                        
                        <Chip 
                          label={userInfo.gender}
                          sx={{
                            backgroundColor: darkProTokens.success,
                            color: darkProTokens.textPrimary,
                            fontWeight: 600
                          }}
                          size="small"
                        />
                        
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
                        {userInfo.email}
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
                        {userInfo.whatsapp}
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
                        {formatDate(userInfo.birthDate)}
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
                        {userInfo.maritalStatus}
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
                        {calculateDaysAsMember(userInfo.created_at)} días
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
                        {formatDate(userInfo.created_at)}
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
