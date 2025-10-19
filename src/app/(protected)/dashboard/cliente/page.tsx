'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Container,
  LinearProgress,
  IconButton,
  Divider
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Badge as BadgeIcon,
  FitnessCenter as FitnessIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  EmojiEvents as AwardIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  Cake as CakeIcon,
  AccountCircle as AccountCircleIcon,
  Home as HomeIcon,
  LocalHospital as HospitalIcon,
  School as SchoolIcon,
  Description as DescriptionIcon,
  Draw as SignatureIcon,
  CameraAlt as CameraIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { formatMexicoTime, formatDateForDisplay, formatTimestampDateOnly } from '@/utils/dateUtils';
import { alpha } from '@mui/material/styles';
import GymCapacityGauge from '@/components/dashboard/GymCapacityGauge';
import AnnouncementsSection from '@/components/dashboard/AnnouncementsSection';

// CSS Keyframes for animations
const keyframesStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes zoomIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes subtleGlow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(255, 204, 0, 0.1);
    }
    50% {
      box-shadow: 0 0 30px rgba(255, 204, 0, 0.15);
    }
  }
  @keyframes iconPulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
`;

// Interfaces
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
  paid_amount: number;
  total_amount: number;
  payment_type: string;
  remaining_visits?: number;
  total_visits?: number;
}

export default function ClienteDashboard() {
  const hydrated = useHydrated();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [address, setAddress] = useState<UserAddress | null>(null);
  const [emergency, setEmergency] = useState<EmergencyContact | null>(null);
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [activeMembership, setActiveMembership] = useState<ActiveMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  // Inject keyframes on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleSheet = document.createElement('style');
      styleSheet.textContent = keyframesStyles;
      document.head.appendChild(styleSheet);
      return () => {
        document.head.removeChild(styleSheet);
      };
    }
  }, []);

  const calculateAge = useCallback((birthDate: string): number => {
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
  }, []);

  const calculateDaysAsMember = useCallback((registrationDate: string): number => {
    if (!registrationDate) return 0;
    const today = new Date();
    const registration = new Date(registrationDate);
    if (isNaN(registration.getTime())) return 0;
    const diffTime = today.getTime() - registration.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  const calculateDaysRemaining = useCallback((endDate: string | null): number => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return 0;
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  const downloadFileFromStorage = async (fileName: string, userId: string): Promise<string | null> => {
    if (!fileName || !userId) return null;
    try {
      const filePath = `${userId}/${fileName}`;
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-files')
        .download(filePath);
      if (downloadError || !fileData) return null;
      return URL.createObjectURL(fileData);
    } catch (error) {
      console.error(`Error descargando ${fileName}:`, error);
      return null;
    }
  };

  const loadUserData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
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

      console.log('📦 [CLIENTE] Datos completos del usuario recibidos:', {
        firstName: completeUserData.firstName,
        lastName: completeUserData.lastName,
        createdAt: completeUserData.createdAt,
        hasAddress: !!completeUserData.address,
        hasEmergency: !!completeUserData.emergency,
        hasMembership: !!completeUserData.membership
      });

      setUserInfo(completeUserData);

      if (completeUserData.address) setAddress(completeUserData.address);
      if (completeUserData.emergency) setEmergency(completeUserData.emergency);
      if (completeUserData.membership) setMembershipInfo(completeUserData.membership);

      const { data: files } = await supabase.storage
        .from('user-files')
        .list(user.id, { limit: 100, sortBy: { column: 'updated_at', order: 'desc' } });

      if (files && files.length > 0) {
        const latestProfile = files.find(file => file.name.startsWith('profile-'));
        if (latestProfile) {
          const url = await downloadFileFromStorage(latestProfile.name, user.id);
          if (url) setUserInfo(prev => prev ? { ...prev, profilePictureUrl: url } : null);
        }

        const latestSignature = files.find(file => file.name.startsWith('signature-'));
        if (latestSignature) {
          const url = await downloadFileFromStorage(latestSignature.name, user.id);
          if (url) setUserInfo(prev => prev ? { ...prev, signatureUrl: url } : null);
        }

        const latestContract = files.find(file => file.name.startsWith('contrato-'));
        if (latestContract) {
          const url = await downloadFileFromStorage(latestContract.name, user.id);
          if (url) setUserInfo(prev => prev ? { ...prev, contractPdfUrl: url } : null);
        }
      }

      console.log('🔍 [CLIENTE] Buscando membresía para usuario:', user.id);

      const { data: activeMembershipData, error: membershipError } = await supabase
        .from('user_memberships')
        .select(`*, membership_plans!plan_id (name)`)
        .eq('userid', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('📊 [CLIENTE] Resultado query membresía:', {
        data: activeMembershipData,
        error: membershipError,
        length: activeMembershipData?.length
      });

      if (activeMembershipData && activeMembershipData.length > 0) {
        const membership = activeMembershipData[0];
        const daysRemaining = calculateDaysRemaining(membership.end_date);

        console.log('✅ [CLIENTE] Membresía encontrada:', {
          id: membership.id,
          planName: membership.membership_plans?.name,
          status: membership.status,
          start_date: membership.start_date,
          end_date: membership.end_date,
          daysRemaining,
          isActive: daysRemaining > 0,
          // Verificar qué campos de monto existen
          total_amount: membership.total_amount,
          paid_amount: membership.paid_amount,
          pending_amount: membership.pending_amount,
          inscription_amount: membership.inscription_amount
        });

        setActiveMembership({
          id: membership.id,
          planName: membership.membership_plans?.name || 'Plan No Disponible',
          status: membership.status,
          start_date: membership.start_date,
          end_date: membership.end_date,
          daysRemaining,
          isActive: daysRemaining > 0,
          total_frozen_days: membership.total_frozen_days || 0,
          paid_amount: membership.paid_amount || 0,
          total_amount: membership.total_amount || 0,
          payment_type: membership.payment_type || '',
          remaining_visits: membership.remaining_visits,
          total_visits: membership.total_visits
        });
      } else {
        console.log('❌ [CLIENTE] No se encontró membresía activa');
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido al cargar información');
    } finally {
      setLoading(false);
    }
  }, [supabase, calculateDaysRemaining]);

  useEffect(() => {
    if (hydrated) {
      loadUserData();
    }
  }, [hydrated, loadUserData]);

  // Glassmorphism card styling with subtle enhancements
  const glassCardSx = {
    position: 'relative',
    background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 3,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    // Dot pattern background
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `radial-gradient(${alpha(colorTokens.brand, 0.03)} 1px, transparent 1px)`,
      backgroundSize: '20px 20px',
      pointerEvents: 'none',
      zIndex: 0
    },
    // Gradient border
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 3,
      padding: '1px',
      background: `linear-gradient(135deg, ${alpha(colorTokens.brand, 0.2)}, ${alpha(colorTokens.brand, 0.05)}, ${alpha(colorTokens.brand, 0.15)})`,
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
      zIndex: 1
    },
    '& > *': {
      position: 'relative',
      zIndex: 2
    },
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 40px ${alpha(colorTokens.black, 0.4)}, 0 0 30px ${alpha(colorTokens.brand, 0.1)}`,
      '&::after': {
        background: `linear-gradient(135deg, ${alpha(colorTokens.brand, 0.3)}, ${alpha(colorTokens.brand, 0.1)}, ${alpha(colorTokens.brand, 0.2)})`
      }
    }
  };

  const InfoItem = ({ icon, label, value, color = colorTokens.brand }: any) => (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Box sx={{
          color,
          display: 'flex',
          alignItems: 'center',
          p: 0.5,
          borderRadius: '8px',
          background: alpha(color, 0.1),
          border: `1px solid ${alpha(color, 0.2)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1) rotate(5deg)',
            background: alpha(color, 0.15),
            border: `1px solid ${alpha(color, 0.3)}`,
            boxShadow: `0 0 12px ${alpha(color, 0.3)}`
          }
        }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{
          color: colorTokens.textSecondary,
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body1" sx={{
        color: colorTokens.textPrimary,
        fontWeight: 500,
        fontSize: '1rem',
        ml: 5
      }}>
        {value || 'No disponible'}
      </Typography>
    </Box>
  );

  const StatCard = ({ icon, label, value, color, subtitle }: any) => (
    <Card
      sx={{
        ...glassCardSx,
        textAlign: 'center'
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Box sx={{
          fontSize: { xs: '2.5rem', sm: '3rem' },
          color,
          mb: 1.5,
          filter: `drop-shadow(0 0 12px ${alpha(color, 0.3)})`,
          transition: 'all 0.3s ease',
          animation: 'iconPulse 2s ease-in-out infinite',
          '&:hover': {
            transform: 'scale(1.1)',
            filter: `drop-shadow(0 0 18px ${alpha(color, 0.5)})`
          }
        }}>
          {icon}
        </Box>
        <Typography variant="body2" sx={{
          color: colorTokens.textSecondary,
          mb: 1,
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          fontWeight: 600
        }}>
          {label}
        </Typography>
        <Typography variant="h4" sx={{
          color: colorTokens.textPrimary,
          fontWeight: 700,
          fontSize: { xs: '1.5rem', sm: '2rem' }
        }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{
            color: colorTokens.textSecondary,
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            mt: 0.5,
            display: 'block'
          }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (!hydrated || loading) {
    return (
      <Box sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Card sx={{
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          background: colorTokens.surfaceLevel2,
          borderRadius: 3,
          minWidth: { xs: 280, sm: 320 }
        }}>
          <CircularProgress
            size={60}
            sx={{
              color: colorTokens.brand,
              mb: 2
            }}
          />
          <Typography variant="h6" sx={{
            color: colorTokens.textSecondary,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}>
            Cargando tu información...
          </Typography>
          <LinearProgress sx={{
            mt: 2,
            borderRadius: 2,
            height: 4,
            backgroundColor: alpha(colorTokens.brand, 0.1),
            '& .MuiLinearProgress-bar': {
              backgroundColor: colorTokens.brand,
              borderRadius: 2
            }
          }} />
        </Card>
      </Box>
    );
  }

  if (error || !userInfo) {
    return (
      <Box sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}>
        <Card sx={{
          p: { xs: 3, sm: 4 },
          textAlign: 'center',
          background: colorTokens.surfaceLevel2,
          borderRadius: 3,
          maxWidth: 500
        }}>
          <Alert
            severity="error"
            sx={{
              backgroundColor: alpha(colorTokens.danger, 0.1),
              color: colorTokens.textPrimary,
              border: `1px solid ${alpha(colorTokens.danger, 0.3)}`,
              borderRadius: 2,
              mb: 3
            }}
          >
            {error || 'No se pudo cargar la información del usuario'}
          </Alert>
          <Button
            onClick={loadUserData}
            variant="contained"
            startIcon={<RefreshIcon />}
            sx={{
              background: colorTokens.brand,
              color: colorTokens.black,
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderRadius: 2,
              '&:hover': {
                background: colorTokens.brandHover,
                transform: 'scale(1.05)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Reintentar
          </Button>
        </Card>
      </Box>
    );
  }

  const userAge = calculateAge(userInfo.birthDate);
  const daysAsMember = calculateDaysAsMember(userInfo.createdAt);
  const formattedBirthDate = formatDateForDisplay(userInfo.birthDate);
  // ✅ Usar formatTimestampDateOnly para timestamps con timezone de PostgreSQL
  const formattedRegistrationDate = formatTimestampDateOnly(userInfo.createdAt);

  console.log('📊 [CLIENTE] Calculando estadísticas:', {
    createdAt: userInfo.createdAt,
    daysAsMember,
    formattedRegistrationDate,
    userAge,
    formattedBirthDate
  });

  return (
    <Box sx={{ pb: { xs: 2, sm: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, sm: 4 }, textAlign: 'center' }}>
        <Typography variant="h3" sx={{
          fontWeight: 800,
          color: colorTokens.textPrimary,
          mb: 1,
          fontSize: { xs: '1.75rem', sm: '2.5rem' }
        }}>
          Mi Dashboard
        </Typography>
        <Typography variant="body1" sx={{
          color: colorTokens.textSecondary,
          fontWeight: 500,
          maxWidth: 600,
          mx: 'auto',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 60,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${colorTokens.brand}, transparent)`,
            animation: 'subtleGlow 2s ease-in-out infinite'
          }
        }}>
          Vista completa de tu perfil, membresía y documentos
        </Typography>
      </Box>

      <Grid
        container
        spacing={{ xs: 2, sm: 3 }}
      >
        {/* Gym Capacity Gauge */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <GymCapacityGauge />
        </Grid>

        {/* Announcements */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <AnnouncementsSection />
        </Grid>

        {/* User Profile Card */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={glassCardSx}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' },
                gap: { xs: 2, sm: 3 },
                mb: 4,
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Avatar
                  src={userInfo.profilePictureUrl}
                  onClick={() => userInfo.profilePictureUrl && setImagePreview(userInfo.profilePictureUrl)}
                  sx={{
                    width: { xs: 100, sm: 120 },
                    height: { xs: 100, sm: 120 },
                    border: `4px solid ${colorTokens.brand}`,
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                    color: colorTokens.black,
                    cursor: userInfo.profilePictureUrl ? 'pointer' : 'default',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': userInfo.profilePictureUrl ? {
                      transform: 'scale(1.03)',
                      boxShadow: `0 8px 24px ${alpha(colorTokens.brand, 0.4)}`
                    } : {}
                  }}
                >
                  {userInfo.firstName && userInfo.lastName ? `${userInfo.firstName[0]}${userInfo.lastName[0]}` : '??'}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 800,
                    mb: 2,
                    fontSize: { xs: '1.5rem', sm: '2rem' }
                  }}>
                    {userInfo.firstName} {userInfo.lastName}
                  </Typography>
                  <Box sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                  }}>
                    {userAge > 0 && (
                      <Chip
                        icon={<CakeIcon />}
                        label={`${userAge} años`}
                        sx={{
                          background: alpha(colorTokens.info, 0.15),
                          color: colorTokens.info,
                          border: `1px solid ${alpha(colorTokens.info, 0.3)}`,
                          fontWeight: 600
                        }}
                        size="small"
                      />
                    )}
                    {userInfo.gender && (
                      <Chip
                        icon={<AccountCircleIcon />}
                        label={userInfo.gender}
                        sx={{
                          background: alpha(colorTokens.success, 0.15),
                          color: colorTokens.success,
                          border: `1px solid ${alpha(colorTokens.success, 0.3)}`,
                          fontWeight: 600
                        }}
                        size="small"
                      />
                    )}
                    {userInfo.isMinor && (
                      <Chip
                        label="MENOR DE EDAD"
                        sx={{
                          background: alpha(colorTokens.warning, 0.15),
                          color: colorTokens.warning,
                          border: `1px solid ${alpha(colorTokens.warning, 0.3)}`,
                          fontWeight: 700
                        }}
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 3, borderColor: alpha(colorTokens.brand, 0.1) }} />

              <Typography variant="h6" sx={{
                color: colorTokens.brand,
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}>
                Datos Personales
              </Typography>

              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <InfoItem
                    icon={<EmailIcon />}
                    label="Email"
                    value={userInfo.email}
                    color={colorTokens.info}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <InfoItem
                    icon={<PhoneIcon />}
                    label="WhatsApp"
                    value={userInfo.whatsapp}
                    color={colorTokens.success}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <InfoItem
                    icon={<CalendarIcon />}
                    label="Fecha de Nacimiento"
                    value={formattedBirthDate}
                    color={colorTokens.warning}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <InfoItem
                    icon={<PersonIcon />}
                    label="Estado Civil"
                    value={userInfo.maritalStatus}
                    color={colorTokens.danger}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <InfoItem
                    icon={<BadgeIcon />}
                    label="ID de Cliente"
                    value={userInfo.id}
                    color={colorTokens.brand}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Membership Card */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            sx={{
              background: activeMembership?.isActive
                ? `linear-gradient(135deg, ${alpha(colorTokens.success, 0.9)}, ${alpha(colorTokens.success, 0.7)})`
                : `linear-gradient(135deg, ${alpha(colorTokens.danger, 0.9)}, ${alpha(colorTokens.danger, 0.7)})`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(activeMembership?.isActive ? colorTokens.success : colorTokens.danger, 0.3)}`,
              color: colorTokens.white,
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              height: '100%',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${alpha(colorTokens.black, 0.4)}`,
                border: `1px solid ${alpha(activeMembership?.isActive ? colorTokens.success : colorTokens.danger, 0.5)}`
              }
            }}
          >
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              background: `radial-gradient(circle at 100% 0%, ${alpha(colorTokens.white, 0.1)} 0%, transparent 50%)`,
              pointerEvents: 'none'
            }} />
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, position: 'relative' }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3
              }}>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Mi Membresía
                </Typography>
                <FitnessIcon sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }} />
              </Box>
              {activeMembership ? (
                <Stack spacing={{ xs: 2, sm: 2.5 }}>
                  {/* Circular Progress para días restantes */}
                  {activeMembership.isActive && activeMembership.start_date && activeMembership.end_date && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress
                          variant="determinate"
                          value={(() => {
                            const start = new Date(activeMembership.start_date);
                            const end = new Date(activeMembership.end_date);
                            const today = new Date();
                            const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                            const daysElapsed = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                            const percentage = Math.max(0, Math.min(100, ((totalDays - daysElapsed) / totalDays) * 100));
                            return percentage;
                          })()}
                          size={100}
                          thickness={4}
                          sx={{
                            color: colorTokens.white,
                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
                          }}
                        />
                        <Box
                          sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                          }}
                        >
                          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>
                            {activeMembership.daysRemaining}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem', fontWeight: 600 }}>
                            días
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontWeight: 600 }}>
                      Plan Actual
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      {activeMembership.planName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <CheckCircleIcon sx={{
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.2) rotate(360deg)',
                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                      }
                    }} />
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {activeMembership.isActive ? 'ACTIVA' : 'VENCIDA'}
                    </Typography>
                  </Box>
                  {activeMembership.end_date && (
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontWeight: 600 }}>
                        {activeMembership.isActive ? 'Vence el' : 'Venció el'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {formatDateForDisplay(activeMembership.end_date)}
                      </Typography>
                    </Box>
                  )}
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 0.5, fontWeight: 600 }}>
                      Monto Pagado
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      ${activeMembership.paid_amount.toLocaleString('es-MX')}
                    </Typography>
                  </Box>
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                    Sin Membresía Activa
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Contacta al gimnasio para activar tu membresía
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Cards */}
        <Grid size={{ xs: 12 }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatCard
                icon={<CalendarIcon />}
                label="Miembro desde"
                value={formattedRegistrationDate}
                color={colorTokens.info}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StatCard
                icon={<ScheduleIcon />}
                label="Antigüedad"
                value={`${daysAsMember}`}
                subtitle="días en el gym"
                color={colorTokens.brand}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Additional Info */}
        <Grid size={{ xs: 12 }}>
          <Card sx={glassCardSx}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Typography variant="h6" sx={{
                color: colorTokens.brand,
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}>
                Información Adicional
              </Typography>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {/* Address */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    background: alpha(colorTokens.brand, 0.05),
                    border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                    height: '100%'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <HomeIcon sx={{ color: colorTokens.brand }} />
                      <Typography variant="subtitle1" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                        Dirección
                      </Typography>
                    </Box>
                    {address ? (
                      <Stack spacing={0.8}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                          📍 {address.street} #{address.number}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                          🏘️ {address.neighborhood}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                          🌆 {address.city}, {address.state}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                          📮 CP: {address.postalCode}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: colorTokens.textDisabled, fontStyle: 'italic' }}>
                        No hay dirección registrada
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Emergency Contact */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    background: alpha(colorTokens.danger, 0.05),
                    border: `1px solid ${alpha(colorTokens.danger, 0.1)}`,
                    height: '100%'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <HospitalIcon sx={{ color: colorTokens.danger }} />
                      <Typography variant="subtitle1" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                        Emergencia
                      </Typography>
                    </Box>
                    {emergency ? (
                      <Stack spacing={0.8}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                          👤 {emergency.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                          📞 {emergency.phone}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                          🩸 {emergency.bloodType}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: colorTokens.textDisabled, fontStyle: 'italic' }}>
                        No hay contacto registrado
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Training Info */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    background: alpha(colorTokens.info, 0.05),
                    border: `1px solid ${alpha(colorTokens.info, 0.1)}`,
                    height: '100%'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <SchoolIcon sx={{ color: colorTokens.info }} />
                      <Typography variant="subtitle1" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                        Entrenamiento
                      </Typography>
                    </Box>
                    {membershipInfo ? (
                      <Stack spacing={0.8}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                          🏋️‍♂️ {membershipInfo.trainingLevel}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                          🎯 {membershipInfo.mainMotivation}
                        </Typography>
                        {membershipInfo.referredBy && (
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                            👥 {membershipInfo.referredBy}
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ color: colorTokens.textDisabled, fontStyle: 'italic' }}>
                        No hay información registrada
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Documents */}
        {(userInfo.profilePictureUrl || userInfo.signatureUrl || userInfo.contractPdfUrl) && (
          <Grid size={{ xs: 12 }}>
            <Card sx={glassCardSx}>
              <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Typography variant="h6" sx={{
                  color: colorTokens.brand,
                  fontWeight: 700,
                  mb: 3,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}>
                  Mis Documentos
                </Typography>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {userInfo.profilePictureUrl && (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          p: { xs: 2, sm: 3 },
                          borderRadius: 2,
                          background: alpha(colorTokens.success, 0.05),
                          border: `1px solid ${alpha(colorTokens.success, 0.2)}`,
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 20px ${alpha(colorTokens.success, 0.2)}`
                          }
                        }}
                        onClick={() => setImagePreview(userInfo.profilePictureUrl!)}
                      >
                        <Typography variant="subtitle2" sx={{
                          color: colorTokens.success,
                          mb: 2,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <CameraIcon /> Foto de Perfil
                        </Typography>
                        <Box
                          component="img"
                          src={userInfo.profilePictureUrl}
                          alt="Foto de perfil"
                          sx={{
                            width: '100%',
                            maxWidth: 200,
                            height: 'auto',
                            borderRadius: 2,
                            border: `2px solid ${colorTokens.success}`,
                            display: 'block',
                            margin: '0 auto'
                          }}
                        />
                      </Box>
                    </Grid>
                  )}

                  {userInfo.signatureUrl && (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          p: { xs: 2, sm: 3 },
                          borderRadius: 2,
                          background: alpha(colorTokens.info, 0.05),
                          border: `1px solid ${alpha(colorTokens.info, 0.2)}`,
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 20px ${alpha(colorTokens.info, 0.2)}`
                          }
                        }}
                        onClick={() => setImagePreview(userInfo.signatureUrl!)}
                      >
                        <Typography variant="subtitle2" sx={{
                          color: colorTokens.info,
                          mb: 2,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <SignatureIcon /> Mi Firma
                        </Typography>
                        <Box
                          component="img"
                          src={userInfo.signatureUrl}
                          alt="Firma"
                          sx={{
                            width: '100%',
                            maxWidth: 200,
                            height: 'auto',
                            bgcolor: colorTokens.white,
                            borderRadius: 2,
                            border: `2px solid ${colorTokens.info}`,
                            p: 1,
                            display: 'block',
                            margin: '0 auto'
                          }}
                        />
                      </Box>
                    </Grid>
                  )}

                  {userInfo.contractPdfUrl && (
                    <Grid size={{ xs: 12, sm: 12, md: 4 }}>
                      <Box sx={{
                        textAlign: 'center',
                        p: { xs: 2, sm: 3 },
                        borderRadius: 2,
                        background: alpha(colorTokens.danger, 0.05),
                        border: `1px solid ${alpha(colorTokens.danger, 0.2)}`
                      }}>
                        <Typography variant="subtitle2" sx={{
                          color: colorTokens.danger,
                          mb: 2,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1
                        }}>
                          <DescriptionIcon /> Contrato
                        </Typography>
                        <Box sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2
                        }}>
                          <DescriptionIcon sx={{
                            fontSize: { xs: '3rem', sm: '4rem' },
                            color: colorTokens.danger
                          }} />
                          <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1,
                            width: '100%'
                          }}>
                            <Button
                              variant="contained"
                              startIcon={<VisibilityIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(userInfo.contractPdfUrl!, '_blank');
                              }}
                              sx={{
                                background: colorTokens.danger,
                                color: colorTokens.white,
                                fontWeight: 700,
                                flex: 1,
                                '&:hover': {
                                  background: alpha(colorTokens.danger, 0.8)
                                }
                              }}
                            >
                              Ver
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = userInfo.contractPdfUrl!;
                                link.download = `contrato-${userInfo.firstName}-${userInfo.lastName}.pdf`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              sx={{
                                borderColor: colorTokens.danger,
                                color: colorTokens.danger,
                                fontWeight: 600,
                                flex: { xs: 1, sm: 'auto' },
                                '&:hover': {
                                  backgroundColor: alpha(colorTokens.danger, 0.1),
                                  borderColor: colorTokens.danger
                                }
                              }}
                            >
                              Descargar
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Image Preview Modal */}
      {imagePreview && (
        <Box
          onClick={() => setImagePreview(null)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(colorTokens.black, 0.95),
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            p: { xs: 2, sm: 4 },
            cursor: 'pointer',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <Box
            component="img"
            src={imagePreview}
            alt="Vista previa"
            sx={{
              maxWidth: '90%',
              maxHeight: '90%',
              borderRadius: 2,
              cursor: 'default',
              boxShadow: `0 24px 80px ${alpha(colorTokens.black, 0.8)}`,
              border: `2px solid ${alpha(colorTokens.brand, 0.3)}`,
              animation: 'zoomIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={(e: any) => e.stopPropagation()}
          />
          <IconButton
            onClick={() => setImagePreview(null)}
            sx={{
              position: 'absolute',
              top: { xs: 16, sm: 32 },
              right: { xs: 16, sm: 32 },
              color: colorTokens.white,
              backgroundColor: alpha(colorTokens.black, 0.7),
              '&:hover': {
                backgroundColor: alpha(colorTokens.black, 0.9)
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
}
