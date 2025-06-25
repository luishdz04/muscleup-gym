"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
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
  Fade,
  IconButton,
  Skeleton,
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
  FaMapMarkerAlt,
  FaHeartbeat,
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

// 🎨 SISTEMA DE TOKENS AVANZADO
const darkProTokens = {
  // Backgrounds
  background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #121212 100%)',
  surfaceLevel1: 'rgba(18, 18, 18, 0.95)',
  surfaceLevel2: 'rgba(30, 30, 30, 0.9)',
  surfaceLevel3: 'rgba(37, 37, 37, 0.85)',
  surfaceLevel4: 'rgba(46, 46, 46, 0.8)',
  
  // Glass Effects
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHover: 'rgba(255, 255, 255, 0.08)',
  
  // Colors
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryGlow: 'rgba(255, 204, 0, 0.3)',
  success: '#00E676',
  successGlow: 'rgba(0, 230, 118, 0.2)',
  error: '#FF1744',
  errorGlow: 'rgba(255, 23, 68, 0.2)',
  warning: '#FFD600',
  warningGlow: 'rgba(255, 214, 0, 0.2)',
  info: '#00B4FF',
  infoGlow: 'rgba(0, 180, 255, 0.2)',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textDisabled: 'rgba(255, 255, 255, 0.4)',
  
  // Shadows
  shadowLight: '0 4px 20px rgba(0, 0, 0, 0.1)',
  shadowMedium: '0 8px 32px rgba(0, 0, 0, 0.2)',
  shadowHeavy: '0 16px 64px rgba(0, 0, 0, 0.3)',
  shadowGlow: '0 0 40px rgba(255, 204, 0, 0.15)',
  
  // Borders
  borderRadius: '20px',
  borderRadiusSmall: '12px',
  borderRadiusLarge: '24px'
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
  createdAt: string;
  profilePictureUrl?: string;
  signatureUrl?: string;
  contractPdfUrl?: string;
  rol: string;
  fingerprint?: boolean;
  points_balance?: number;
  total_purchases?: number;
  membership_type?: string;
}

interface UserAddress {
  id: string;
  userId: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  medicalCondition: string;
  bloodType: string;
}

interface MembershipInfo {
  id: string;
  userId: string;
  referredBy: string;
  mainMotivation: string;
  receivePlans: boolean;
  trainingLevel: string;
}

interface ActiveMembership {
  id: string;
  planName: string;
  status: string;
  start_date: string;
  end_date: string | null;
  daysRemaining: number;
  isActive: boolean;
  total_frozen_days: number;
  amount_paid: number;
  payment_type: string;
  remaining_visits?: number;
  total_visits?: number;
}

export default function ClienteDashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isLarge = useMediaQuery(theme.breakpoints.up('lg'));
  
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [address, setAddress] = useState<UserAddress | null>(null);
  const [emergency, setEmergency] = useState<EmergencyContact | null>(null);
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 300], [0, -100]);
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  // 🎯 FUNCIONES AUXILIARES
  const calculateAge = useCallback((birthDate: string): number => {
    try {
      if (!birthDate) return 0;
      
      const today = new Date();
      const birth = new Date(birthDate);
      
      if (isNaN(birth.getTime())) return 0;
      
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      return Math.max(0, age);
    } catch (error) {
      console.error('Error calculando edad:', error);
      return 0;
    }
  }, []);

  const calculateDaysAsMember = useCallback((registrationDate: string): number => {
    try {
      if (!registrationDate) return 0;
      
      const today = new Date();
      const registration = new Date(registrationDate);
      
      if (isNaN(registration.getTime())) return 0;
      
      const diffTime = today.getTime() - registration.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return Math.max(0, diffDays);
    } catch (error) {
      console.error('Error calculando días como miembro:', error);
      return 0;
    }
  }, []);

  const calculateDaysRemaining = useCallback((endDate: string | null): number => {
    try {
      if (!endDate) return 0;
      
      const today = new Date();
      const end = new Date(endDate);
      
      if (isNaN(end.getTime())) return 0;
      
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      console.error('Error calculando días restantes:', error);
      return 0;
    }
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    try {
      if (!dateString) return 'Fecha no disponible';
      
      const dateParts = dateString.split('T')[0];
      const [year, month, day] = dateParts.split('-').map(Number);
      
      const date = new Date(year, month - 1, day);
      
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha no disponible';
    }
  }, []);

  const downloadFileFromStorage = async (fileName: string, userId: string): Promise<string | null> => {
    if (!fileName || !userId) return null;
    
    try {
      const filePath = `${userId}/${fileName}`;
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-files')
        .download(filePath);
      
      if (downloadError || !fileData) return null;
      
      const objectUrl = URL.createObjectURL(fileData);
      return objectUrl;
      
    } catch (error) {
      console.error(`Error descargando ${fileName}:`, error);
      return null;
    }
  };

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Error de autenticación');
      }

      const response = await fetch(`/api/admin/users/${user.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error('Error al obtener usuario: ' + (errorData.message || 'Usuario no encontrado'));
      }
      
      const completeUserData = await response.json();
      setUserInfo(completeUserData);

      // Extraer datos relacionados del API
      if (completeUserData.address) {
        setAddress(completeUserData.address);
      }

      if (completeUserData.emergency) {
        setEmergency(completeUserData.emergency);
      }

      if (completeUserData.membership) {
        setMembershipInfo(completeUserData.membership);
      }

      // Cargar archivos del Storage
      try {
        const { data: files } = await supabase.storage
          .from('user-files')
          .list(user.id, { 
            limit: 100, 
            sortBy: { column: 'updated_at', order: 'desc' }
          });
        
        if (files && files.length > 0) {
          const latestProfile = files.find(file => file.name.startsWith('profile-'));
          const latestSignature = files.find(file => file.name.startsWith('signature-'));
          const latestContract = files.find(file => file.name.startsWith('contrato-'));
          
          if (latestProfile) {
            const profileImageUrl = await downloadFileFromStorage(latestProfile.name, user.id);
            if (profileImageUrl) {
              setUserInfo(prev => prev ? { ...prev, profilePictureUrl: profileImageUrl } : null);
            }
          }
          
          if (latestSignature) {
            const signatureUrl = await downloadFileFromStorage(latestSignature.name, user.id);
            if (signatureUrl) {
              setUserInfo(prev => prev ? { ...prev, signatureUrl } : null);
            }
          }
          
          if (latestContract) {
            const contractPdfUrl = await downloadFileFromStorage(latestContract.name, user.id);
            if (contractPdfUrl) {
              setUserInfo(prev => prev ? { ...prev, contractPdfUrl } : null);
            }
          }
        }
      } catch (err) {
        console.error('Error cargando archivos:', err);
      }

      // Cargar membresía activa
      try {
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
            start_date: membership.start_date,
            end_date: membership.end_date,
            daysRemaining,
            isActive: daysRemaining > 0,
            total_frozen_days: membership.total_frozen_days || 0,
            amount_paid: membership.amount_paid || 0,
            payment_type: membership.payment_type || '',
            remaining_visits: membership.remaining_visits,
            total_visits: membership.total_visits
          });
        }
      } catch (err) {
        console.error('Error cargando membresía activa:', err);
      }

    } catch (err: any) {
      console.error('Error general cargando datos:', err);
      setError(err.message || 'Error desconocido al cargar información');
    } finally {
      setLoading(false);
    }
  }, [supabase, calculateDaysRemaining]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // 🎨 ANIMACIONES AVANZADAS
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { 
      y: 50, 
      opacity: 0,
      scale: 0.9
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const floatingVariants = {
    floating: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // 🎯 COMPONENTES AUXILIARES
  const GlassCard = ({ children, gradient = false, hover = true, ...props }: any) => (
    <motion.div
      variants={cardVariants}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <Card
        sx={{
          background: gradient ? 
            `linear-gradient(135deg, ${darkProTokens.glass}, ${darkProTokens.surfaceLevel2})` :
            darkProTokens.surfaceLevel2,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${darkProTokens.glassBorder}`,
          borderRadius: darkProTokens.borderRadius,
          boxShadow: darkProTokens.shadowMedium,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${darkProTokens.glassBorder}, transparent)`
          },
          '&:hover': hover ? {
            background: gradient ? 
              `linear-gradient(135deg, ${darkProTokens.glassHover}, ${darkProTokens.surfaceLevel3})` :
              darkProTokens.surfaceLevel3,
            boxShadow: darkProTokens.shadowHeavy,
            transform: 'translateY(-2px)'
          } : {},
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );

  const InfoItem = ({ icon, label, value, color = darkProTokens.primary }: any) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        mb: 1,
        opacity: 0.8
      }}>
        <Box sx={{ 
          color, 
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          p: 1,
          borderRadius: '50%',
          background: `${color}15`,
          border: `1px solid ${color}30`
        }}>
          {icon}
        </Box>
        <Typography 
          variant="body2" 
          sx={{ 
            color: darkProTokens.textSecondary,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 1
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography 
        variant="body1" 
        sx={{ 
          color: darkProTokens.textPrimary, 
          fontWeight: 600,
          fontSize: isMobile ? '0.9rem' : '1rem',
          ml: isMobile ? 0 : 6
        }}
      >
        {value || 'No disponible'}
      </Typography>
    </Box>
  );

  const StatCard = ({ icon, label, value, color, subtitle }: any) => (
    <GlassCard>
      <CardContent sx={{ 
        p: isMobile ? 2 : 3, 
        textAlign: 'center',
        minHeight: isMobile ? 140 : 160
      }}>
        <motion.div
          variants={floatingVariants}
          animate="floating"
          style={{ 
            fontSize: isMobile ? '2.5rem' : '3rem', 
            color, 
            marginBottom: '1rem',
            filter: `drop-shadow(0 0 20px ${color}40)`
          }}
        >
          {icon}
        </motion.div>
        <Typography 
          variant="body2" 
          sx={{ 
            color: darkProTokens.textSecondary, 
            mb: 1,
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: 600
          }}
        >
          {label}
        </Typography>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          sx={{ 
            color: darkProTokens.textPrimary, 
            fontWeight: 800,
            background: `linear-gradient(135deg, ${color}, ${darkProTokens.textPrimary})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: darkProTokens.textSecondary,
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              mt: 0.5,
              display: 'block'
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </GlassCard>
  );

  // 🎯 ESTADOS DE CARGA
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
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard hover={false}>
            <CardContent sx={{ 
              p: isMobile ? 3 : 4, 
              textAlign: 'center',
              minWidth: isMobile ? 280 : 320
            }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <CircularProgress 
                  size={isMobile ? 50 : 60} 
                  sx={{ 
                    color: darkProTokens.primary,
                    filter: `drop-shadow(0 0 20px ${darkProTokens.primaryGlow})`
                  }} 
                />
              </motion.div>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: darkProTokens.textSecondary,
                  mt: 2,
                  fontSize: isMobile ? '1rem' : '1.25rem'
                }}
              >
                Cargando tu información...
              </Typography>
              <LinearProgress 
                sx={{ 
                  mt: 2,
                  borderRadius: 2,
                  height: 4,
                  backgroundColor: darkProTokens.glass,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: darkProTokens.primary,
                    borderRadius: 2
                  }
                }} 
              />
            </CardContent>
          </GlassCard>
        </motion.div>
      </Box>
    );
  }

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
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard hover={false}>
            <CardContent sx={{ p: isMobile ? 3 : 4, textAlign: 'center' }}>
              <Alert 
                severity="error" 
                sx={{
                  backgroundColor: `${darkProTokens.error}15`,
                  color: darkProTokens.textPrimary,
                  border: `1px solid ${darkProTokens.error}30`,
                  borderRadius: darkProTokens.borderRadiusSmall,
                  mb: 3,
                  '& .MuiAlert-icon': {
                    color: darkProTokens.error
                  }
                }}
              >
                {error || 'No se pudo cargar la información del usuario'}
              </Alert>
              
              <Button 
                onClick={loadUserData}
                variant="contained"
                startIcon={<FaUser />}
                sx={{
                  background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                  color: '#000',
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  borderRadius: darkProTokens.borderRadiusSmall,
                  boxShadow: darkProTokens.shadowGlow,
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: `0 8px 32px ${darkProTokens.primaryGlow}`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                🔄 Reintentar
              </Button>
            </CardContent>
          </GlassCard>
        </motion.div>
      </Box>
    );
  }

  // 🎯 CÁLCULOS
  const userAge = calculateAge(userInfo.birthDate);
  const daysAsMember = calculateDaysAsMember(userInfo.createdAt);
  const formattedBirthDate = formatDate(userInfo.birthDate);
  const formattedRegistrationDate = formatDate(userInfo.createdAt);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: darkProTokens.background,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 🌟 EFECTOS DE FONDO */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, ${darkProTokens.primaryGlow} 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, ${darkProTokens.infoGlow} 0%, transparent 50%),
          radial-gradient(circle at 40% 60%, ${darkProTokens.successGlow} 0%, transparent 50%)
        `,
        opacity: 0.3,
        zIndex: -1
      }} />

      <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4, position: 'relative', zIndex: 1 }}>
        {/* 🎯 HEADER ANIMADO */}
        <motion.div
          style={{ y: headerY, opacity: headerOpacity }}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Box sx={{ mb: isMobile ? 3 : 5, textAlign: 'center' }}>
            <Typography 
              variant={isMobile ? "h4" : "h2"} 
              sx={{ 
                fontWeight: 900, 
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.warning})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                textShadow: `0 0 40px ${darkProTokens.primaryGlow}`,
                letterSpacing: isMobile ? 1 : 2
              }}
            >
              Mi Dashboard
            </Typography>
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              sx={{ 
                color: darkProTokens.textSecondary,
                fontWeight: 500,
                maxWidth: 600,
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Vista completa de tu perfil, membresía y documentos
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={isMobile ? 2 : 3}>
            {/* 🎯 PERFIL PRINCIPAL */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <GlassCard gradient>
                <CardContent sx={{ p: isMobile ? 2 : 4 }}>
                  {/* Avatar y Info Principal */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'center' : 'flex-start',
                    gap: isMobile ? 2 : 3, 
                    mb: 4,
                    textAlign: isMobile ? 'center' : 'left'
                  }}>
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Avatar
                        src={userInfo.profilePictureUrl}
                        sx={{
                          width: isMobile ? 100 : 120,
                          height: isMobile ? 100 : 120,
                          border: `4px solid ${darkProTokens.primary}`,
                          fontSize: isMobile ? '2rem' : '2.5rem',
                          fontWeight: 900,
                          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                          color: '#000',
                          boxShadow: darkProTokens.shadowGlow,
                          cursor: userInfo.profilePictureUrl ? 'pointer' : 'default'
                        }}
                        onClick={() => userInfo.profilePictureUrl && setImagePreview(userInfo.profilePictureUrl)}
                      >
                        {userInfo.firstName && userInfo.lastName ? 
                          `${userInfo.firstName[0]}${userInfo.lastName[0]}` : 
                          '??'
                        }
                      </Avatar>
                    </motion.div>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h3"} 
                        sx={{ 
                          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.textPrimary})`,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          fontWeight: 800,
                          mb: 2,
                          lineHeight: 1.2
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
                              fontWeight: 700,
                              border: `1px solid ${darkProTokens.info}40`,
                              '& .MuiChip-icon': { color: darkProTokens.textPrimary }
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
                              fontWeight: 700,
                              border: `1px solid ${darkProTokens.success}40`,
                              '& .MuiChip-icon': { color: '#000' }
                            }}
                            size={isMobile ? "small" : "medium"}
                          />
                        )}
                        
                        {userInfo.isMinor && (
                          <Chip 
                            label="MENOR DE EDAD"
                            sx={{
                              background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningGlow})`,
                              color: '#000',
                              fontWeight: 900,
                              animation: 'pulse 2s infinite'
                            }}
                            size={isMobile ? "small" : "medium"}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  {/* Información Personal */}
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: darkProTokens.primary, 
                      fontWeight: 800,
                      mb: 3,
                      fontSize: isMobile ? '1.1rem' : '1.25rem'
                    }}
                  >
                    📋 Datos Personales
                  </Typography>

                  <Grid container spacing={isMobile ? 2 : 3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <InfoItem 
                        icon={<FaEnvelope />}
                        label="Email"
                        value={userInfo.email}
                        color={darkProTokens.info}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <InfoItem 
                        icon={<FaPhone />}
                        label="WhatsApp"
                        value={userInfo.whatsapp}
                        color={darkProTokens.success}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <InfoItem 
                        icon={<FaCalendar />}
                        label="Fecha de Nacimiento"
                        value={formattedBirthDate}
                        color={darkProTokens.warning}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <InfoItem 
                        icon={<FaUser />}
                        label="Estado Civil"
                        value={userInfo.maritalStatus}
                        color={darkProTokens.error}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <InfoItem 
                        icon={<FaIdCard />}
                        label="ID de Cliente"
                        value={userInfo.id}
                        color={darkProTokens.primary}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </GlassCard>
            </Grid>

            {/* 🎯 MEMBRESÍA */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <motion.div variants={cardVariants}>
                <Card sx={{
                  background: activeMembership?.isActive ? 
                    `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.primary})` :
                    `linear-gradient(135deg, ${darkProTokens.error}, #B71C1C)`,
                  color: '#000',
                  borderRadius: darkProTokens.borderRadius,
                  boxShadow: activeMembership?.isActive ? 
                    `0 20px 60px ${darkProTokens.successGlow}` :
                    `0 20px 60px ${darkProTokens.errorGlow}`,
                  border: `1px solid ${activeMembership?.isActive ? darkProTokens.success : darkProTokens.error}40`,
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: `radial-gradient(circle at 100% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
                    pointerEvents: 'none'
                  }} />
                  
                  <CardContent sx={{ p: isMobile ? 2 : 4, position: 'relative' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      mb: 3 
                    }}>
                      <Typography 
                        variant={isMobile ? "h6" : "h5"} 
                        sx={{ fontWeight: 900 }}
                      >
                        💪 Mi Membresía
                      </Typography>
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <FaDumbbell style={{ fontSize: isMobile ? '1.5rem' : '2rem' }} />
                      </motion.div>
                    </Box>

                    {activeMembership ? (
                      <Stack spacing={isMobile ? 2 : 3}>
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              opacity: 0.8, 
                              mb: 1,
                              fontWeight: 600,
                              fontSize: isMobile ? '0.75rem' : '0.875rem'
                            }}
                          >
                            Plan Actual
                          </Typography>
                          <Typography 
                            variant={isMobile ? "h6" : "h5"} 
                            sx={{ fontWeight: 900 }}
                          >
                            {activeMembership.planName}
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <FaCheckCircle />
                          </motion.div>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 800,
                              fontSize: isMobile ? '0.9rem' : '1rem'
                            }}
                          >
                            {activeMembership.isActive ? 'ACTIVA' : 'VENCIDA'}
                          </Typography>
                        </Box>

                        {activeMembership.end_date && (
                          <Box>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                opacity: 0.8, 
                                mb: 1,
                                fontWeight: 600,
                                fontSize: isMobile ? '0.75rem' : '0.875rem'
                              }}
                            >
                              {activeMembership.isActive ? 'Vence el' : 'Venció el'}
                            </Typography>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: 800,
                                fontSize: isMobile ? '0.9rem' : '1rem'
                              }}
                            >
                              {formatDate(activeMembership.end_date)}
                            </Typography>
                          </Box>
                        )}

                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              opacity: 0.8, 
                              mb: 1,
                              fontWeight: 600,
                              fontSize: isMobile ? '0.75rem' : '0.875rem'
                            }}
                          >
                            Monto Pagado
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 800,
                              fontSize: isMobile ? '0.9rem' : '1rem'
                            }}
                          >
                            ${activeMembership.amount_paid}
                          </Typography>
                        </Box>
                      </Stack>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: isMobile ? 2 : 3 }}>
                        <Typography 
                          variant={isMobile ? "h6" : "h5"} 
                          sx={{ fontWeight: 900, mb: 1 }}
                        >
                          Sin Membresía Activa
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            opacity: 0.8,
                            fontSize: isMobile ? '0.8rem' : '0.875rem'
                          }}
                        >
                          Contacta al gimnasio para activar tu membresía
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* 🎯 ESTADÍSTICAS */}
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={isMobile ? 2 : 3}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <StatCard
                    icon={<FaClock />}
                    label="Miembro desde hace"
                    value={`${daysAsMember}`}
                    subtitle="días"
                    color={darkProTokens.primary}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <StatCard
                    icon={<FaCalendar />}
                    label={activeMembership?.isActive ? 'Días restantes' : 'Estado'}
                    value={activeMembership?.isActive ? `${activeMembership.daysRemaining}` : 'Vencida'}
                    subtitle={activeMembership?.isActive ? "días" : ""}
                    color={activeMembership?.isActive ? darkProTokens.success : darkProTokens.error}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                  <StatCard
                    icon={<FaAward />}
                    label="Miembro desde"
                    value={formattedRegistrationDate}
                    color={darkProTokens.info}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* 🎯 INFORMACIÓN ADICIONAL */}
            <Grid size={{ xs: 12 }}>
              <GlassCard gradient>
                <CardContent sx={{ p: isMobile ? 2 : 4 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: darkProTokens.primary, 
                      fontWeight: 800,
                      mb: 3,
                      fontSize: isMobile ? '1.1rem' : '1.25rem'
                    }}
                  >
                    📊 Información Adicional
                  </Typography>

                  <Grid container spacing={isMobile ? 3 : 4}>
                    {/* Dirección */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{
                        p: isMobile ? 2 : 3,
                        borderRadius: darkProTokens.borderRadiusSmall,
                        background: darkProTokens.glass,
                        border: `1px solid ${darkProTokens.glassBorder}`,
                        height: '100%'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <FaHome style={{ color: darkProTokens.primary, fontSize: '1.2rem' }} />
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 700
                            }}
                          >
                            Dirección
                          </Typography>
                        </Box>
                        {address ? (
                          <Stack spacing={1}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              📍 {address.street} #{address.number}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              🏘️ {address.neighborhood}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              🌆 {address.city}, {address.state}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              📮 CP: {address.postalCode}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: darkProTokens.textDisabled, 
                              fontStyle: 'italic',
                              fontSize: isMobile ? '0.8rem' : '0.875rem'
                            }}
                          >
                            No hay dirección registrada
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* Contacto de Emergencia */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{
                        p: isMobile ? 2 : 3,
                        borderRadius: darkProTokens.borderRadiusSmall,
                        background: darkProTokens.glass,
                        border: `1px solid ${darkProTokens.glassBorder}`,
                        height: '100%'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <FaMedkit style={{ color: darkProTokens.error, fontSize: '1.2rem' }} />
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 700
                            }}
                          >
                            Emergencia
                          </Typography>
                        </Box>
                        {emergency ? (
                          <Stack spacing={1}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              👤 {emergency.name}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              📞 {emergency.phone}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              🩸 {emergency.bloodType}
                            </Typography>
                          </Stack>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: darkProTokens.textDisabled, 
                              fontStyle: 'italic',
                              fontSize: isMobile ? '0.8rem' : '0.875rem'
                            }}
                          >
                            No hay contacto registrado
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    {/* Info de Membresía */}
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{
                        p: isMobile ? 2 : 3,
                        borderRadius: darkProTokens.borderRadiusSmall,
                        background: darkProTokens.glass,
                        border: `1px solid ${darkProTokens.glassBorder}`,
                        height: '100%'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <FaGraduationCap style={{ color: darkProTokens.info, fontSize: '1.2rem' }} />
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              color: darkProTokens.textPrimary, 
                              fontWeight: 700
                            }}
                          >
                            Entrenamiento
                          </Typography>
                        </Box>
                        {membershipInfo ? (
                          <Stack spacing={1}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              🏋️‍♂️ {membershipInfo.trainingLevel}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: darkProTokens.textSecondary,
                                fontSize: isMobile ? '0.8rem' : '0.875rem'
                              }}
                            >
                              🎯 {membershipInfo.mainMotivation}
                            </Typography>
                            {membershipInfo.referredBy && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: darkProTokens.textSecondary,
                                  fontSize: isMobile ? '0.8rem' : '0.875rem'
                                }}
                              >
                                👥 {membershipInfo.referredBy}
                              </Typography>
                            )}
                          </Stack>
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: darkProTokens.textDisabled, 
                              fontStyle: 'italic',
                              fontSize: isMobile ? '0.8rem' : '0.875rem'
                            }}
                          >
                            No hay información registrada
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </GlassCard>
            </Grid>

            {/* 🎯 DOCUMENTOS */}
            {(userInfo.profilePictureUrl || userInfo.signatureUrl || userInfo.contractPdfUrl) && (
              <Grid size={{ xs: 12 }}>
                <GlassCard gradient>
                  <CardContent sx={{ p: isMobile ? 2 : 4 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: darkProTokens.primary, 
                        fontWeight: 800,
                        mb: 3,
                        fontSize: isMobile ? '1.1rem' : '1.25rem'
                      }}
                    >
                      📄 Mis Documentos
                    </Typography>

                    <Grid container spacing={isMobile ? 2 : 3}>
                      {userInfo.profilePictureUrl && (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Box sx={{
                              textAlign: 'center',
                              p: isMobile ? 2 : 3,
                              borderRadius: darkProTokens.borderRadiusSmall,
                              background: darkProTokens.glass,
                              border: `1px solid ${darkProTokens.success}40`,
                              cursor: 'pointer'
                            }}
                            onClick={() => setImagePreview(userInfo.profilePictureUrl!)}
                            >
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  color: darkProTokens.success, 
                                  mb: 2,
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 1
                                }}
                              >
                                <FaCamera /> Foto de Perfil
                              </Typography>
                              <Box
                                component="img"
                                src={userInfo.profilePictureUrl}
                                alt="Foto de perfil"
                                sx={{
                                  width: '100%',
                                  maxWidth: isMobile ? 150 : 200,
                                  height: 'auto',
                                  borderRadius: darkProTokens.borderRadiusSmall,
                                  border: `2px solid ${darkProTokens.success}`,
                                  boxShadow: `0 8px 32px ${darkProTokens.successGlow}`
                                }}
                              />
                            </Box>
                          </motion.div>
                        </Grid>
                      )}

                      {userInfo.signatureUrl && (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Box sx={{
                              textAlign: 'center',
                              p: isMobile ? 2 : 3,
                              borderRadius: darkProTokens.borderRadiusSmall,
                              background: darkProTokens.glass,
                              border: `1px solid ${darkProTokens.info}40`,
                              cursor: 'pointer'
                            }}
                            onClick={() => setImagePreview(userInfo.signatureUrl!)}
                            >
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  color: darkProTokens.info, 
                                  mb: 2,
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 1
                                }}
                              >
                                <FaSignature /> Mi Firma
                              </Typography>
                              <Box
                                component="img"
                                src={userInfo.signatureUrl}
                                alt="Firma"
                                sx={{
                                  width: '100%',
                                  maxWidth: isMobile ? 150 : 200,
                                  height: 'auto',
                                  bgcolor: 'white',
                                  borderRadius: darkProTokens.borderRadiusSmall,
                                  border: `2px solid ${darkProTokens.info}`,
                                  boxShadow: `0 8px 32px ${darkProTokens.infoGlow}`,
                                  p: 1
                                }}
                              />
                            </Box>
                          </motion.div>
                        </Grid>
                      )}

{userInfo.contractPdfUrl && (
  <Grid size={{ xs: 12, sm: 12, md: 4 }}>
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Box sx={{
        textAlign: 'center',
        p: isMobile ? 2 : 3,
        borderRadius: darkProTokens.borderRadiusSmall,
        background: darkProTokens.glass,
        border: `1px solid ${darkProTokens.error}40`
      }}>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: darkProTokens.error, 
            mb: 2,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <FaFileContract /> Contrato
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 2 
        }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ 
              fontSize: isMobile ? '3rem' : '4rem', 
              color: darkProTokens.error,
              filter: `drop-shadow(0 0 20px ${darkProTokens.errorGlow})`
            }}
          >
            📄
          </motion.div>
          <Button
            // ✅ CORREGIDO: Función que funciona en mobile
            onClick={() => {
              if (isMobile) {
                // Para mobile: crear link temporal y hacer click
                const link = document.createElement('a');
                link.href = userInfo.contractPdfUrl!;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                // Para desktop: usar window.open normal
                window.open(userInfo.contractPdfUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            variant="contained"
            startIcon={<FaDownload />}
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.error}, #B71C1C)`,
              color: 'white',
              fontWeight: 700,
              px: 3,
              py: 1,
              borderRadius: darkProTokens.borderRadiusSmall,
              boxShadow: `0 8px 32px ${darkProTokens.errorGlow}`,
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `0 12px 40px ${darkProTokens.errorGlow}`
              },
              transition: 'all 0.3s ease'
            }}
          >
            Ver Contrato
          </Button>
        </Box>
      </Box>
    </motion.div>
  </Grid>
)}
                    </Grid>
                  </CardContent>
                </GlassCard>
              </Grid>
            )}
          </Grid>
        </motion.div>
      </Container>

      {/* 🎯 MODAL DE VISTA PREVIA DE IMÁGENES */}
      {imagePreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setImagePreview(null)}
          style={{
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
            padding: isMobile ? 16 : 32
          }}
        >
          <motion.img
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            src={imagePreview}
            alt="Vista previa"
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: darkProTokens.borderRadiusSmall,
              boxShadow: darkProTokens.shadowHeavy
            }}
            onClick={(e) => e.stopPropagation()}
          />
         <IconButton
  onClick={() => setImagePreview(null)}
  sx={{
    position: 'absolute',
    top: isMobile ? 16 : 32,
    right: isMobile ? 16 : 32,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0.7)'
    }
  }}
>
  <FaEye />
</IconButton>
        </motion.div>
      )}

      {/* 🎨 ESTILOS CSS PERSONALIZADOS */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px ${darkProTokens.primaryGlow};
          }
          50% {
            box-shadow: 0 0 40px ${darkProTokens.primaryGlow}, 0 0 60px ${darkProTokens.primary}40;
          }
        }
        
        @keyframes slideInUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeInScale {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        /* Scrollbar personalizado */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 4px;
          border: 1px solid ${darkProTokens.surfaceLevel2};
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primary});
          box-shadow: 0 0 10px ${darkProTokens.primaryGlow};
        }
        
        /* Efectos de glassmorphism mejorados */
        .glass-effect {
          backdrop-filter: blur(20px) saturate(180%);
          background-color: ${darkProTokens.glass};
          border: 1px solid ${darkProTokens.glassBorder};
        }
        
        /* Hover effects mejorados */
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: ${darkProTokens.shadowHeavy};
        }
        
        /* Responsive utilities */
        @media (max-width: 600px) {
          .mobile-stack {
            flex-direction: column !important;
          }
          
          .mobile-center {
            text-align: center !important;
          }
          
          .mobile-full-width {
            width: 100% !important;
          }
          
          .mobile-padding {
            padding: 1rem !important;
          }
          
          .mobile-margin {
            margin: 0.5rem 0 !important;
          }
        }
        
        @media (max-width: 900px) {
          .tablet-stack {
            flex-direction: column !important;
          }
          
          .tablet-center {
            text-align: center !important;
          }
        }
        
        /* Animaciones específicas para elementos */
        .card-entrance {
          animation: fadeInScale 0.6s ease-out forwards;
        }
        
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }
        
        .glow-animation {
          animation: glow 3s ease-in-out infinite;
        }
        
        /* Modo de alto contraste */
        @media (prefers-contrast: high) {
          .high-contrast {
            border-width: 2px !important;
            font-weight: 700 !important;
          }
        }
        
        /* Reducir movimiento */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
        
        /* Estilos para impresión */
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-friendly {
            background: white !important;
            color: black !important;
            box-shadow: none !important;
          }
        }
        
        /* Efectos de partículas */
        .particles-bg::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 25% 25%, ${darkProTokens.primaryGlow} 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, ${darkProTokens.successGlow} 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, ${darkProTokens.infoGlow} 1px, transparent 1px);
          background-size: 100px 100px, 150px 150px, 200px 200px;
          opacity: 0.1;
          pointer-events: none;
          z-index: -1;
          animation: float 20s linear infinite;
        }
        
        /* Mejoras de accesibilidad */
        .focus-visible:focus-visible {
          outline: 3px solid ${darkProTokens.primary};
          outline-offset: 2px;
          border-radius: 4px;
        }
        
        .skip-link {
          position: absolute;
          top: -40px;
          left: 6px;
          background: ${darkProTokens.primary};
          color: black;
          padding: 8px;
          text-decoration: none;
          border-radius: 4px;
          z-index: 10000;
        }
        
        .skip-link:focus {
          top: 6px;
        }
        
        /* Indicadores de estado mejorados */
        .status-indicator {
          position: relative;
        }
        
        .status-indicator::after {
          content: '';
          position: absolute;
          top: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid ${darkProTokens.background};
        }
        
        .status-active::after {
          background-color: ${darkProTokens.success};
          animation: pulse 2s infinite;
        }
        
        .status-inactive::after {
          background-color: ${darkProTokens.error};
        }
        
        .status-pending::after {
          background-color: ${darkProTokens.warning};
          animation: pulse 1.5s infinite;
        }
        
        /* Efectos de carga mejorados */
        .skeleton {
          background: linear-gradient(
            90deg,
            ${darkProTokens.surfaceLevel2} 25%,
            ${darkProTokens.surfaceLevel3} 50%,
            ${darkProTokens.surfaceLevel2} 75%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        /* Transiciones suaves globales */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Optimizaciones de rendimiento */
        .will-change-transform {
          will-change: transform;
        }
        
        .will-change-opacity {
          will-change: opacity;
        }
        
        .gpu-accelerated {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `}</style>
    </Box>
  );
}
