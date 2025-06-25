"use client";

import React, { useState, useEffect, useCallback } from 'react';
// ✅ QUITAR framer-motion problemático
// import { motion, useScroll, useTransform } from 'framer-motion';
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
  Button,
  Container,
  useTheme,
  useMediaQuery,
  IconButton,
  LinearProgress
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
  FaAward,
  FaEye,
  FaDownload,
  FaBirthdayCake,
  FaUserCircle,
  FaHome,
  FaMedkit,
  FaGraduationCap,
  FaFileContract,
  FaSignature,
  FaCamera
} from 'react-icons/fa';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

// 🎨 TOKENS SIMPLIFICADOS
const darkProTokens = {
  background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #121212 100%)',
  surfaceLevel2: 'rgba(30, 30, 30, 0.9)',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryGlow: 'rgba(255, 204, 0, 0.3)',
  success: '#00E676',
  successGlow: 'rgba(0, 230, 118, 0.2)',
  error: '#FF1744',
  errorGlow: 'rgba(255, 23, 68, 0.2)',
  warning: '#FFD600',
  info: '#00B4FF',
  infoGlow: 'rgba(0, 180, 255, 0.2)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textDisabled: 'rgba(255, 255, 255, 0.4)',
  shadowMedium: '0 8px 32px rgba(0, 0, 0, 0.2)',
  borderRadius: '20px',
  borderRadiusSmall: '12px'
};

// ✅ INTERFACES SIMPLIFICADAS
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
  createdAt: string;
  profilePictureUrl?: string;
  signatureUrl?: string;
  contractPdfUrl?: string;
}

interface UserAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}

interface EmergencyContact {
  name: string;
  phone: string;
  bloodType: string;
}

interface MembershipInfo {
  trainingLevel: string;
  mainMotivation: string;
  referredBy: string;
}

interface ActiveMembership {
  planName: string;
  status: string;
  start_date: string;
  end_date: string | null;
  daysRemaining: number;
  isActive: boolean;
  amount_paid: number;
}

export default function ClienteDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [address, setAddress] = useState<UserAddress | null>(null);
  const [emergency, setEmergency] = useState<EmergencyContact | null>(null);
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  // ✅ COMPONENTE SIMPLE SIN MOTION
  const SimpleCard = ({ children, gradient = false, ...props }: any) => (
    <Card
      sx={{
        background: gradient ? 
          `linear-gradient(135deg, ${darkProTokens.glass}, ${darkProTokens.surfaceLevel2})` :
          darkProTokens.surfaceLevel2,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${darkProTokens.glassBorder}`,
        borderRadius: darkProTokens.borderRadius,
        boxShadow: darkProTokens.shadowMedium,
        // ✅ IMPORTANTE: Sin pointer-events problems
        '&:hover': {
          transform: 'translateY(-2px)',
          transition: 'transform 0.3s ease'
        }
      }}
      {...props}
    >
      {children}
    </Card>
  );

  // 🎯 FUNCIONES AUXILIARES SIMPLIFICADAS
  const calculateAge = useCallback((birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }, []);

  const calculateDaysAsMember = useCallback((registrationDate: string): number => {
    if (!registrationDate) return 0;
    const today = new Date();
    const registration = new Date(registrationDate);
    const diffTime = today.getTime() - registration.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha no disponible';
    }
  }, []);

  // 🎯 CARGAR DATOS
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const response = await fetch(`/api/admin/users/${user.id}`);
      if (!response.ok) throw new Error('Error al obtener datos');
      
      const userData = await response.json();
      setUserInfo(userData);
      setAddress(userData.address);
      setEmergency(userData.emergency);
      setMembershipInfo(userData.membership);

      // Cargar membresía activa
      const { data: membershipData } = await supabase
        .from('user_memberships')
        .select('*, membership_plans!planid (name)')
        .eq('userid', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (membershipData?.[0]) {
        const membership = membershipData[0];
        const today = new Date();
        const endDate = membership.end_date ? new Date(membership.end_date) : null;
        const daysRemaining = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        setActiveMembership({
          planName: membership.membership_plans?.name || 'Plan No Disponible',
          status: membership.status,
          start_date: membership.start_date,
          end_date: membership.end_date,
          daysRemaining,
          isActive: daysRemaining > 0,
          amount_paid: membership.amount_paid || 0
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // ✅ HANDLERS SIMPLES
  const handleViewContract = () => {
    if (userInfo?.contractPdfUrl) {
      // ✅ Método simple que SIEMPRE funciona
      window.open(userInfo.contractPdfUrl, '_blank');
    }
  };

  const handleDownloadContract = () => {
    if (userInfo?.contractPdfUrl) {
      const link = document.createElement('a');
      link.href = userInfo.contractPdfUrl;
      link.download = `contrato-${userInfo.firstName}-${userInfo.lastName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // 🎯 CÁLCULOS
  const userAge = userInfo ? calculateAge(userInfo.birthDate) : 0;
  const daysAsMember = userInfo ? calculateDaysAsMember(userInfo.createdAt) : 0;
  const formattedBirthDate = userInfo ? formatDate(userInfo.birthDate) : '';
  const formattedRegistrationDate = userInfo ? formatDate(userInfo.createdAt) : '';

  // 🎯 LOADING STATE
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: darkProTokens.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <SimpleCard>
          <CardContent sx={{ p: 4, textAlign: 'center', minWidth: 280 }}>
            <CircularProgress size={60} sx={{ color: darkProTokens.primary, mb: 2 }} />
            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
              Cargando tu información...
            </Typography>
          </CardContent>
        </SimpleCard>
      </Box>
    );
  }

  // 🎯 ERROR STATE
  if (error || !userInfo) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: darkProTokens.background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <SimpleCard>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 3, backgroundColor: `${darkProTokens.error}15` }}>
              {error || 'No se pudo cargar la información'}
            </Alert>
            <Button 
              onClick={loadUserData}
              variant="contained"
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                color: '#000',
                fontWeight: 700
              }}
            >
              🔄 Reintentar
            </Button>
          </CardContent>
        </SimpleCard>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: darkProTokens.background,
      // ✅ SIN POSITION FIXED O OVERLAYS PROBLEMÁTICOS
    }}>
      <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4 }}>
        {/* 🎯 HEADER SIMPLE */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography 
            variant={isMobile ? "h4" : "h2"} 
            sx={{ 
              fontWeight: 900, 
              background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.warning})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Mi Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }}>
            Vista completa de tu perfil y membresía
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* 🎯 PERFIL PRINCIPAL */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <SimpleCard gradient>
              <CardContent sx={{ p: isMobile ? 2 : 4 }}>
                {/* Avatar y Info Principal */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'center' : 'flex-start',
                  gap: 3, 
                  mb: 4,
                  textAlign: isMobile ? 'center' : 'left'
                }}>
                  <Avatar
                    src={userInfo.profilePictureUrl}
                    onClick={() => userInfo.profilePictureUrl && setImagePreview(userInfo.profilePictureUrl)}
                    sx={{
                      width: isMobile ? 100 : 120,
                      height: isMobile ? 100 : 120,
                      border: `4px solid ${darkProTokens.primary}`,
                      fontSize: '2rem',
                      fontWeight: 900,
                      background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                      color: '#000',
                      cursor: userInfo.profilePictureUrl ? 'pointer' : 'default',
                      '&:hover': userInfo.profilePictureUrl ? {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.3s ease'
                      } : {}
                    }}
                  >
                    {userInfo.firstName?.[0]}{userInfo.lastName?.[0]}
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant={isMobile ? "h5" : "h3"} 
                      sx={{ 
                        background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.textPrimary})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 800,
                        mb: 2
                      }}
                    >
                      {userInfo.firstName} {userInfo.lastName}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      flexWrap: 'wrap',
                      justifyContent: isMobile ? 'center' : 'flex-start'
                    }}>
                      {userAge > 0 && (
                        <Chip 
                          icon={<FaBirthdayCake />}
                          label={`${userAge} años`}
                          sx={{
                            background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoGlow})`,
                            color: darkProTokens.textPrimary,
                            fontWeight: 700
                          }}
                          size={isMobile ? "small" : "medium"}
                        />
                      )}
                      
                      {userInfo.gender && (
                        <Chip 
                          icon={<FaUserCircle />}
                          label={userInfo.gender}
                          sx={{
                            background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successGlow})`,
                            color: '#000',
                            fontWeight: 700
                          }}
                          size={isMobile ? "small" : "medium"}
                        />
                      )}
                      
                      {userInfo.isMinor && (
                        <Chip 
                          label="MENOR DE EDAD"
                          sx={{
                            background: `linear-gradient(135deg, ${darkProTokens.warning}, rgba(255, 214, 0, 0.2))`,
                            color: '#000',
                            fontWeight: 900
                          }}
                          size={isMobile ? "small" : "medium"}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* Información Personal */}
                <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 800, mb: 3 }}>
                  📋 Datos Personales
                </Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, textTransform: 'uppercase' }}>
                        📧 Email
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {userInfo.email}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, textTransform: 'uppercase' }}>
                        📱 WhatsApp
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {userInfo.whatsapp}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, textTransform: 'uppercase' }}>
                        🎂 Fecha de Nacimiento
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {formattedBirthDate}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, textTransform: 'uppercase' }}>
                        👤 Estado Civil
                      </Typography>
                      <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                        {userInfo.maritalStatus}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </SimpleCard>
          </Grid>

          {/* 🎯 MEMBRESÍA */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{
              background: activeMembership?.isActive ? 
                `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.primary})` :
                `linear-gradient(135deg, ${darkProTokens.error}, #B71C1C)`,
              color: '#000',
              borderRadius: darkProTokens.borderRadius
            }}>
              <CardContent sx={{ p: isMobile ? 2 : 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 900 }}>
                    💪 Mi Membresía
                  </Typography>
                  <FaDumbbell style={{ fontSize: isMobile ? '1.5rem' : '2rem' }} />
                </Box>

                {activeMembership ? (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontWeight: 600 }}>
                        Plan Actual
                      </Typography>
                      <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 900 }}>
                        {activeMembership.planName}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FaCheckCircle />
                      <Typography variant="body1" sx={{ fontWeight: 800 }}>
                        {activeMembership.isActive ? 'ACTIVA' : 'VENCIDA'}
                      </Typography>
                    </Box>

                    {activeMembership.end_date && (
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontWeight: 600 }}>
                          {activeMembership.isActive ? 'Vence el' : 'Venció el'}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800 }}>
                          {formatDate(activeMembership.end_date)}
                        </Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontWeight: 600 }}>
                        Monto Pagado
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800 }}>
                        ${activeMembership.amount_paid}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>
                      Sin Membresía Activa
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Contacta al gimnasio para activar tu membresía
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* 🎯 ESTADÍSTICAS */}
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <SimpleCard>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <FaClock style={{ fontSize: '3rem', color: darkProTokens.primary, marginBottom: '1rem' }} />
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                      Miembro desde hace
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.textPrimary, fontWeight: 800 }}>
                      {daysAsMember}
                    </Typography>
                    <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                      días
                    </Typography>
                  </CardContent>
                </SimpleCard>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <SimpleCard>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <FaCalendar style={{ 
                      fontSize: '3rem', 
                      color: activeMembership?.isActive ? darkProTokens.success : darkProTokens.error, 
                      marginBottom: '1rem' 
                    }} />
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                      {activeMembership?.isActive ? 'Días restantes' : 'Estado'}
                    </Typography>
                    <Typography variant="h4" sx={{ color: darkProTokens.textPrimary, fontWeight: 800 }}>
                      {activeMembership?.isActive ? activeMembership.daysRemaining : 'Vencida'}
                    </Typography>
                    {activeMembership?.isActive && (
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        días
                      </Typography>
                    )}
                  </CardContent>
                </SimpleCard>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <SimpleCard>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <FaAward style={{ fontSize: '3rem', color: darkProTokens.info, marginBottom: '1rem' }} />
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                      Miembro desde
                    </Typography>
                    <Typography variant="h6" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                      {formattedRegistrationDate}
                    </Typography>
                  </CardContent>
                </SimpleCard>
              </Grid>
            </Grid>
          </Grid>

          {/* 🎯 DOCUMENTOS - SIMPLIFICADO */}
          {userInfo.contractPdfUrl && (
            <Grid size={{ xs: 12 }}>
              <SimpleCard gradient>
                <CardContent sx={{ p: isMobile ? 2 : 4 }}>
                  <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 800, mb: 3 }}>
                    📄 Mi Contrato
                  </Typography>

                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ fontSize: '4rem', mb: 2 }}>📄</Box>
                    
                    <Stack direction={isMobile ? 'column' : 'row'} spacing={2} justifyContent="center">
                      {/* ✅ BOTÓN SIMPLE QUE FUNCIONA */}
                      <Button
                        onClick={handleViewContract}
                        variant="contained"
                        startIcon={<FaEye />}
                        sx={{
                          background: `linear-gradient(135deg, ${darkProTokens.error}, #B71C1C)`,
                          color: 'white',
                          fontWeight: 700,
                          px: 3,
                          py: 1.5,
                          minHeight: '48px', // Área táctil
                          '&:hover': {
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        Ver Contrato
                      </Button>

                      <Button
                        onClick={handleDownloadContract}
                        variant="outlined"
                        startIcon={<FaDownload />}
                        sx={{
                          borderColor: darkProTokens.error,
                          color: darkProTokens.error,
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          minHeight: '48px', // Área táctil
                          '&:hover': {
                            backgroundColor: `${darkProTokens.error}10`,
                            transform: 'scale(1.05)'
                          }
                        }}
                      >
                        Descargar PDF
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </SimpleCard>
            </Grid>
          )}
        </Grid>
      </Container>

      {/* 🎯 MODAL SIMPLE */}
      {imagePreview && (
        <Box
          onClick={() => setImagePreview(null)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            p: 2
          }}
        >
          <Box
            component="img"
            src={imagePreview}
            alt="Vista previa"
            sx={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: darkProTokens.borderRadiusSmall
            }}
            onClick={(e) => e.stopPropagation()}
          />
          
          <IconButton
            onClick={() => setImagePreview(null)}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.7)',
              minHeight: '48px',
              minWidth: '48px'
            }}
          >
            ✕
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
