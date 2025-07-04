'use client';

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

// 🎨 SISTEMA DE TOKENS AVANZADO
const darkProTokens = {
  background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #121212 100%)',
  surfaceLevel1: 'rgba(18, 18, 18, 0.95)',
  surfaceLevel2: 'rgba(30, 30, 30, 0.9)',
  surfaceLevel3: 'rgba(37, 37, 37, 0.85)',
  surfaceLevel4: 'rgba(46, 46, 46, 0.8)',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassHover: 'rgba(255, 255, 255, 0.08)',
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
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textDisabled: 'rgba(255, 255, 255, 0.4)',
  shadowLight: '0 4px 20px rgba(0, 0, 0, 0.1)',
  shadowMedium: '0 8px 32px rgba(0, 0, 0, 0.2)',
  shadowHeavy: '0 16px 64px rgba(0, 0, 0, 0.3)',
  shadowGlow: '0 0 40px rgba(255, 204, 0, 0.15)',
  borderRadius: '20px',
  borderRadiusSmall: '12px',
  borderRadiusLarge: '24px'
};

// Interfaces
interface UserInfo { id: string; firstName: string; lastName: string; email: string; whatsapp: string; birthDate: string; gender: string; maritalStatus: string; isMinor: boolean; createdAt: string; profilePictureUrl?: string; signatureUrl?: string; contractPdfUrl?: string; rol: string; fingerprint?: boolean; points_balance?: number; total_purchases?: number; membership_type?: string; }
interface UserAddress { id: string; userId: string; street: string; number: string; neighborhood: string; city: string; state: string; postalCode: string; country: string; }
interface EmergencyContact { id: string; userId: string; name: string; phone: string; medicalCondition: string; bloodType: string; }
interface MembershipInfo { id: string; userId: string; referredBy: string; mainMotivation: string; receivePlans: boolean; trainingLevel: string; }
interface ActiveMembership { id: string; planName: string; status: string; start_date: string; end_date: string | null; daysRemaining: number; isActive: boolean; total_frozen_days: number; amount_paid: number; payment_type: string; remaining_visits?: number; total_visits?: number; }

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
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 300], [0, -100]);
  const headerOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  const calculateAge = useCallback((birthDate: string): number => { if (!birthDate) return 0; const today = new Date(); const birth = new Date(birthDate); if (isNaN(birth.getTime())) return 0; let age = today.getFullYear() - birth.getFullYear(); const monthDiff = today.getMonth() - birth.getMonth(); if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) { age--; } return Math.max(0, age); }, []);
  const calculateDaysAsMember = useCallback((registrationDate: string): number => { if (!registrationDate) return 0; const today = new Date(); const registration = new Date(registrationDate); if (isNaN(registration.getTime())) return 0; const diffTime = today.getTime() - registration.getTime(); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return Math.max(0, diffDays); }, []);
  const calculateDaysRemaining = useCallback((endDate: string | null): number => { if (!endDate) return 0; const today = new Date(); const end = new Date(endDate); if (isNaN(end.getTime())) return 0; const diffTime = end.getTime() - today.getTime(); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return diffDays; }, []);
  const formatDate = useCallback((dateString: string): string => { if (!dateString) return 'Fecha no disponible'; try { const dateParts = dateString.split('T')[0]; const [year, month, day] = dateParts.split('-').map(Number); const date = new Date(year, month - 1, day); if (isNaN(date.getTime())) return 'Fecha inválida'; return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return 'Fecha no disponible'; } }, []);
  const downloadFileFromStorage = async (fileName: string, userId: string): Promise<string | null> => { if (!fileName || !userId) return null; try { const filePath = `${userId}/${fileName}`; const { data: fileData, error: downloadError } = await supabase.storage.from('user-files').download(filePath); if (downloadError || !fileData) return null; return URL.createObjectURL(fileData); } catch (error) { console.error(`Error descargando ${fileName}:`, error); return null; } };

  const loadUserData = useCallback(async () => { setLoading(true); setError(null); try { const { data: { user }, error: authError } = await supabase.auth.getUser(); if (authError || !user) { throw new Error('Error de autenticación'); } const response = await fetch(`/api/admin/users/${user.id}`); if (!response.ok) { const errorData = await response.json(); throw new Error('Error al obtener usuario: ' + (errorData.message || 'Usuario no encontrado')); } const completeUserData = await response.json(); setUserInfo(completeUserData); if (completeUserData.address) setAddress(completeUserData.address); if (completeUserData.emergency) setEmergency(completeUserData.emergency); if (completeUserData.membership) setMembershipInfo(completeUserData.membership); const { data: files } = await supabase.storage.from('user-files').list(user.id, { limit: 100, sortBy: { column: 'updated_at', order: 'desc' } }); if (files && files.length > 0) { const latestProfile = files.find(file => file.name.startsWith('profile-')); if (latestProfile) { const url = await downloadFileFromStorage(latestProfile.name, user.id); if (url) setUserInfo(prev => prev ? { ...prev, profilePictureUrl: url } : null); } const latestSignature = files.find(file => file.name.startsWith('signature-')); if (latestSignature) { const url = await downloadFileFromStorage(latestSignature.name, user.id); if (url) setUserInfo(prev => prev ? { ...prev, signatureUrl: url } : null); } const latestContract = files.find(file => file.name.startsWith('contrato-')); if (latestContract) { const url = await downloadFileFromStorage(latestContract.name, user.id); if (url) setUserInfo(prev => prev ? { ...prev, contractPdfUrl: url } : null); } } const { data: activeMembershipData } = await supabase.from('user_memberships').select(`*, membership_plans!planid (name)`).eq('userid', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1); if (activeMembershipData && activeMembershipData.length > 0) { const membership = activeMembershipData[0]; const daysRemaining = calculateDaysRemaining(membership.end_date); setActiveMembership({ id: membership.id, planName: membership.membership_plans?.name || 'Plan No Disponible', status: membership.status, start_date: membership.start_date, end_date: membership.end_date, daysRemaining, isActive: daysRemaining > 0, total_frozen_days: membership.total_frozen_days || 0, amount_paid: membership.amount_paid || 0, payment_type: membership.payment_type || '', remaining_visits: membership.remaining_visits, total_visits: membership.total_visits }); } } catch (err: any) { setError(err.message || 'Error desconocido al cargar información'); } finally { setLoading(false); } }, [supabase, calculateDaysRemaining]);
  useEffect(() => { loadUserData(); }, [loadUserData]);

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } } };
  const cardVariants = { hidden: { y: 50, opacity: 0, scale: 0.9 }, visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } } };
  const floatingVariants = { floating: { y: [-10, 10, -10], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } } };

  const GlassCard = ({ children, gradient = false, hover = true, ...props }: any) => (
    <Card
      component={motion.div}
      variants={cardVariants}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      sx={{
        background: gradient ? `linear-gradient(135deg, ${darkProTokens.glass}, ${darkProTokens.surfaceLevel2})` : darkProTokens.surfaceLevel2,
        backdropFilter: 'blur(20px)', border: `1px solid ${darkProTokens.glassBorder}`, borderRadius: darkProTokens.borderRadius, boxShadow: darkProTokens.shadowMedium, overflow: 'hidden', position: 'relative',
        '&:hover': hover ? { background: gradient ? `linear-gradient(135deg, ${darkProTokens.glassHover}, ${darkProTokens.surfaceLevel3})` : darkProTokens.surfaceLevel3, boxShadow: darkProTokens.shadowHeavy } : {},
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      {...props}
    >
      {children}
    </Card>
  );

  const InfoItem = ({ icon, label, value, color = darkProTokens.primary }: any) => ( <Box sx={{ mb: 3 }}> <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, opacity: 0.8 }}> <Box sx={{ color, fontSize: '1.2rem', display: 'flex', alignItems: 'center', p: 1, borderRadius: '50%', background: `${color}15`, border: `1px solid ${color}30` }}> {icon} </Box> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}> {label} </Typography> </Box> <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600, fontSize: isMobile ? '0.9rem' : '1rem', ml: isMobile ? 0 : 6 }}> {value || 'No disponible'} </Typography> </Box> );

  const StatCard = ({ icon, label, value, color, subtitle }: any) => (
    <GlassCard>
      <CardContent sx={{ p: isMobile ? 2 : 3, textAlign: 'center', minHeight: isMobile ? 140 : 160 }}>
        <Box component={motion.div} variants={floatingVariants} animate="floating" sx={{ fontSize: isMobile ? '2.5rem' : '3rem', color, mb: '1rem', filter: `drop-shadow(0 0 20px ${color}40)` }}> {icon} </Box>
        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1, fontSize: isMobile ? '0.75rem' : '0.875rem', fontWeight: 600 }}> {label} </Typography>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ color: darkProTokens.textPrimary, fontWeight: 800, background: `linear-gradient(135deg, ${color}, ${darkProTokens.textPrimary})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> {value} </Typography>
        {subtitle && ( <Typography variant="caption" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.7rem' : '0.75rem', mt: 0.5, display: 'block' }}> {subtitle} </Typography> )}
      </CardContent>
    </GlassCard>
  );

  if (loading) return ( <Box sx={{ minHeight: '100vh', background: darkProTokens.background, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}> <Card component={motion.div} initial={{ scale: 0 }} animate={{ scale: 1 }} sx={{ p: isMobile ? 3 : 4, textAlign: 'center', background: darkProTokens.surfaceLevel2, borderRadius: darkProTokens.borderRadius, minWidth: isMobile ? 280 : 320 }}> <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}> <CircularProgress size={isMobile ? 50 : 60} sx={{ color: darkProTokens.primary, filter: `drop-shadow(0 0 20px ${darkProTokens.primaryGlow})` }} /> </motion.div> <Typography variant="h6" sx={{ color: darkProTokens.textSecondary, mt: 2, fontSize: isMobile ? '1rem' : '1.25rem' }}> Cargando tu información... </Typography> <LinearProgress sx={{ mt: 2, borderRadius: 2, height: 4, backgroundColor: darkProTokens.glass, '& .MuiLinearProgress-bar': { backgroundColor: darkProTokens.primary, borderRadius: 2 } }} /> </Card> </Box> );
  if (error || !userInfo) return ( <Box sx={{ minHeight: '100vh', background: darkProTokens.background, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}> <Card component={motion.div} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} sx={{ p: isMobile ? 3 : 4, textAlign: 'center', background: darkProTokens.surfaceLevel2, borderRadius: darkProTokens.borderRadius }}> <Alert severity="error" sx={{ backgroundColor: `${darkProTokens.error}15`, color: darkProTokens.textPrimary, border: `1px solid ${darkProTokens.error}30`, borderRadius: darkProTokens.borderRadiusSmall, mb: 3, '& .MuiAlert-icon': { color: darkProTokens.error } }}> {error || 'No se pudo cargar la información del usuario'} </Alert> <Button onClick={loadUserData} variant="contained" startIcon={<FaUser />} sx={{ background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`, color: '#000', fontWeight: 700, px: 4, py: 1.5, borderRadius: darkProTokens.borderRadiusSmall, boxShadow: darkProTokens.shadowGlow, '&:hover': { transform: 'scale(1.05)', boxShadow: `0 8px 32px ${darkProTokens.primaryGlow}` }, transition: 'all 0.3s ease' }}> 🔄 Reintentar </Button> </Card> </Box> );

  const userAge = calculateAge(userInfo.birthDate);
  const daysAsMember = calculateDaysAsMember(userInfo.createdAt);
  const formattedBirthDate = formatDate(userInfo.birthDate);
  const formattedRegistrationDate = formatDate(userInfo.createdAt);

  return (
    <Box sx={{ minHeight: '100vh', background: darkProTokens.background, position: 'relative', overflowX: 'hidden' }}>
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 20% 20%, ${darkProTokens.primaryGlow} 0%, transparent 50%), radial-gradient(circle at 80% 80%, ${darkProTokens.infoGlow} 0%, transparent 50%), radial-gradient(circle at 40% 60%, ${darkProTokens.successGlow} 0%, transparent 50%)`, opacity: 0.3, zIndex: -1 }} />
      <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 4, position: 'relative', zIndex: 1 }}>
        <Box component={motion.div} style={{ y: headerY, opacity: headerOpacity }} initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} sx={{ mb: isMobile ? 3 : 5, textAlign: 'center' }}>
          <Typography variant={isMobile ? "h4" : "h2"} sx={{ fontWeight: 900, background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.warning})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 2, textShadow: `0 0 40px ${darkProTokens.primaryGlow}`, letterSpacing: isMobile ? 1 : 2 }}> Mi Dashboard </Typography>
          <Typography variant={isMobile ? "body1" : "h6"} sx={{ color: darkProTokens.textSecondary, fontWeight: 500, maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}> Vista completa de tu perfil, membresía y documentos </Typography>
        </Box>

        <Grid container component={motion.div} variants={containerVariants} initial="hidden" animate="visible" spacing={isMobile ? 2 : 3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <GlassCard gradient>
              <CardContent sx={{ p: isMobile ? 2 : 4 }}>
                <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? 2 : 3, mb: 4, textAlign: isMobile ? 'center' : 'left' }}>
                  <Avatar component={motion.div} whileHover={{ scale: 1.05, rotate: 2 }} transition={{ type: "spring", stiffness: 300 }} src={userInfo.profilePictureUrl} onClick={() => userInfo.profilePictureUrl && setImagePreview(userInfo.profilePictureUrl)} sx={{ width: isMobile ? 100 : 120, height: isMobile ? 100 : 120, border: `4px solid ${darkProTokens.primary}`, fontSize: '2.5rem', fontWeight: 900, background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`, color: '#000', boxShadow: darkProTokens.shadowGlow, cursor: userInfo.profilePictureUrl ? 'pointer' : 'default' }}> {userInfo.firstName && userInfo.lastName ? `${userInfo.firstName[0]}${userInfo.lastName[0]}` : '??'} </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant={isMobile ? "h5" : "h3"} sx={{ background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.textPrimary})`, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800, mb: 2, lineHeight: 1.2 }}> {userInfo.firstName} {userInfo.lastName} </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                      {userAge > 0 && ( <Chip icon={<FaBirthdayCake />} label={`${userAge} años`} sx={{ background: `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoGlow})`, color: darkProTokens.textPrimary, fontWeight: 700, border: `1px solid ${darkProTokens.info}40`, '& .MuiChip-icon': { color: darkProTokens.textPrimary } }} size={isMobile ? "small" : "medium"} /> )}
                      {userInfo.gender && ( <Chip icon={<FaUserCircle />} label={userInfo.gender} sx={{ background: `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successGlow})`, color: '#000', fontWeight: 700, border: `1px solid ${darkProTokens.success}40`, '& .MuiChip-icon': { color: '#000' } }} size={isMobile ? "small" : "medium"} /> )}
                      {userInfo.isMinor && ( <Chip label="MENOR DE EDAD" sx={{ background: `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningGlow})`, color: '#000', fontWeight: 900, animation: 'pulse 2s infinite' }} size={isMobile ? "small" : "medium"} /> )}
                    </Box>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 800, mb: 3, fontSize: isMobile ? '1.1rem' : '1.25rem' }}> 📋 Datos Personales </Typography>
                <Grid container spacing={isMobile ? 2 : 3}>
                  <Grid size={{ xs: 12, md: 6 }}> <InfoItem icon={<FaEnvelope />} label="Email" value={userInfo.email} color={darkProTokens.info} /> </Grid>
                  <Grid size={{ xs: 12, md: 6 }}> <InfoItem icon={<FaPhone />} label="WhatsApp" value={userInfo.whatsapp} color={darkProTokens.success} /> </Grid>
                  <Grid size={{ xs: 12, md: 6 }}> <InfoItem icon={<FaCalendar />} label="Fecha de Nacimiento" value={formattedBirthDate} color={darkProTokens.warning} /> </Grid>
                  <Grid size={{ xs: 12, md: 6 }}> <InfoItem icon={<FaUser />} label="Estado Civil" value={userInfo.maritalStatus} color={darkProTokens.error} /> </Grid>
                  <Grid size={{ xs: 12 }}> <InfoItem icon={<FaIdCard />} label="ID de Cliente" value={userInfo.id} color={darkProTokens.primary} /> </Grid>
                </Grid>
              </CardContent>
            </GlassCard>
          </Grid>
          
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card component={motion.div} variants={cardVariants} sx={{ background: activeMembership?.isActive ? `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.primary})` : `linear-gradient(135deg, ${darkProTokens.error}, #B71C1C)`, color: '#000', borderRadius: darkProTokens.borderRadius, boxShadow: activeMembership?.isActive ? `0 20px 60px ${darkProTokens.successGlow}` : `0 20px 60px ${darkProTokens.errorGlow}`, border: `1px solid ${activeMembership?.isActive ? darkProTokens.success : darkProTokens.error}40`, overflow: 'hidden', position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: `radial-gradient(circle at 100% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)`, pointerEvents: 'none' }} />
              <CardContent sx={{ p: isMobile ? 2 : 4, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 900 }}> 💪 Mi Membresía </Typography>
                  <Box component={motion.div} animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}> <FaDumbbell style={{ fontSize: isMobile ? '1.5rem' : '2rem' }} /> </Box>
                </Box>
                {activeMembership ? (
                  <Stack spacing={isMobile ? 2 : 3}>
                    <Box> <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}> Plan Actual </Typography> <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 900 }}> {activeMembership.planName} </Typography> </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}> <Box component={motion.div} animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}> <FaCheckCircle /> </Box> <Typography variant="body1" sx={{ fontWeight: 800, fontSize: isMobile ? '0.9rem' : '1rem' }}> {activeMembership.isActive ? 'ACTIVA' : 'VENCIDA'} </Typography> </Box>
                    {activeMembership.end_date && ( <Box> <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}> {activeMembership.isActive ? 'Vence el' : 'Venció el'} </Typography> <Typography variant="body1" sx={{ fontWeight: 800, fontSize: isMobile ? '0.9rem' : '1rem' }}> {formatDate(activeMembership.end_date)} </Typography> </Box> )}
                    <Box> <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}> Monto Pagado </Typography> <Typography variant="body1" sx={{ fontWeight: 800, fontSize: isMobile ? '0.9rem' : '1rem' }}> ${activeMembership.amount_paid} </Typography> </Box>
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: isMobile ? 2 : 3 }}> <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 900, mb: 1 }}> Sin Membresía Activa </Typography> <Typography variant="body2" sx={{ opacity: 0.8, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> Contacta al gimnasio para activar tu membresía </Typography> </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard icon={<FaClock />} label="Miembro desde hace" value={`${daysAsMember}`} subtitle="días" color={darkProTokens.primary} /></Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}><StatCard icon={<FaCalendar />} label={activeMembership?.isActive ? 'Días restantes' : 'Estado'} value={activeMembership?.isActive ? `${activeMembership.daysRemaining}` : 'Vencida'} subtitle={activeMembership?.isActive ? "días" : ""} color={activeMembership?.isActive ? darkProTokens.success : darkProTokens.error} /></Grid>
              <Grid size={{ xs: 12, sm: 12, md: 4 }}><StatCard icon={<FaAward />} label="Miembro desde" value={formattedRegistrationDate} color={darkProTokens.info} /></Grid>
            </Grid>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <GlassCard gradient>
              <CardContent sx={{ p: isMobile ? 2 : 4 }}>
                <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 800, mb: 3, fontSize: isMobile ? '1.1rem' : '1.25rem' }}> 📊 Información Adicional </Typography>
                <Grid container spacing={isMobile ? 3 : 4}>
                  <Grid size={{ xs: 12, md: 4 }}> <Box sx={{ p: isMobile ? 2 : 3, borderRadius: darkProTokens.borderRadiusSmall, background: darkProTokens.glass, border: `1px solid ${darkProTokens.glassBorder}`, height: '100%' }}> <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}> <FaHome style={{ color: darkProTokens.primary, fontSize: '1.2rem' }} /> <Typography variant="subtitle1" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}> Dirección </Typography> </Box> {address ? ( <Stack spacing={1}> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 📍 {address.street} #{address.number} </Typography> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 🏘️ {address.neighborhood} </Typography> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 🌆 {address.city}, {address.state} </Typography> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 📮 CP: {address.postalCode} </Typography> </Stack> ) : ( <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, fontStyle: 'italic', fontSize: isMobile ? '0.8rem' : '0.875rem' }}> No hay dirección registrada </Typography> )} </Box> </Grid>
                  <Grid size={{ xs: 12, md: 4 }}> <Box sx={{ p: isMobile ? 2 : 3, borderRadius: darkProTokens.borderRadiusSmall, background: darkProTokens.glass, border: `1px solid ${darkProTokens.glassBorder}`, height: '100%' }}> <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}> <FaMedkit style={{ color: darkProTokens.error, fontSize: '1.2rem' }} /> <Typography variant="subtitle1" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}> Emergencia </Typography> </Box> {emergency ? ( <Stack spacing={1}> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 👤 {emergency.name} </Typography> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 📞 {emergency.phone} </Typography> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 🩸 {emergency.bloodType} </Typography> </Stack> ) : ( <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, fontStyle: 'italic', fontSize: isMobile ? '0.8rem' : '0.875rem' }}> No hay contacto registrado </Typography> )} </Box> </Grid>
                  <Grid size={{ xs: 12, md: 4 }}> <Box sx={{ p: isMobile ? 2 : 3, borderRadius: darkProTokens.borderRadiusSmall, background: darkProTokens.glass, border: `1px solid ${darkProTokens.glassBorder}`, height: '100%' }}> <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}> <FaGraduationCap style={{ color: darkProTokens.info, fontSize: '1.2rem' }} /> <Typography variant="subtitle1" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}> Entrenamiento </Typography> </Box> {membershipInfo ? ( <Stack spacing={1}> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 🏋️‍♂️ {membershipInfo.trainingLevel} </Typography> <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 🎯 {membershipInfo.mainMotivation} </Typography> {membershipInfo.referredBy && ( <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, fontSize: isMobile ? '0.8rem' : '0.875rem' }}> 👥 {membershipInfo.referredBy} </Typography> )} </Stack> ) : ( <Typography variant="body2" sx={{ color: darkProTokens.textDisabled, fontStyle: 'italic', fontSize: isMobile ? '0.8rem' : '0.875rem' }}> No hay información registrada </Typography> )} </Box> </Grid>
                </Grid>
              </CardContent>
            </GlassCard>
          </Grid>
          
          {(userInfo.profilePictureUrl || userInfo.signatureUrl || userInfo.contractPdfUrl) && (
            <Grid size={{ xs: 12 }}>
              <GlassCard gradient>
                <CardContent sx={{ p: isMobile ? 2 : 4 }}>
                  <Typography variant="h6" sx={{ color: darkProTokens.primary, fontWeight: 800, mb: 3, fontSize: isMobile ? '1.1rem' : '1.25rem' }}> 📄 Mis Documentos </Typography>
                  <Grid container spacing={isMobile ? 2 : 3}>
                    {userInfo.profilePictureUrl && ( <Grid size={{ xs: 12, sm: 6, md: 4 }}> <Box component={motion.div} whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }} sx={{ textAlign: 'center', p: isMobile ? 2 : 3, borderRadius: darkProTokens.borderRadiusSmall, background: darkProTokens.glass, border: `1px solid ${darkProTokens.success}40`, cursor: 'pointer' }} onClick={() => setImagePreview(userInfo.profilePictureUrl!)}> <Typography variant="subtitle2" sx={{ color: darkProTokens.success, mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}> <FaCamera /> Foto de Perfil </Typography> <Box component="img" src={userInfo.profilePictureUrl} alt="Foto de perfil" sx={{ width: '100%', maxWidth: isMobile ? 150 : 200, height: 'auto', borderRadius: darkProTokens.borderRadiusSmall, border: `2px solid ${darkProTokens.success}`, boxShadow: `0 8px 32px ${darkProTokens.successGlow}` }} /> </Box> </Grid> )}
                    {userInfo.signatureUrl && ( <Grid size={{ xs: 12, sm: 6, md: 4 }}> <Box component={motion.div} whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }} sx={{ textAlign: 'center', p: isMobile ? 2 : 3, borderRadius: darkProTokens.borderRadiusSmall, background: darkProTokens.glass, border: `1px solid ${darkProTokens.info}40`, cursor: 'pointer' }} onClick={() => setImagePreview(userInfo.signatureUrl!)}> <Typography variant="subtitle2" sx={{ color: darkProTokens.info, mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}> <FaSignature /> Mi Firma </Typography> <Box component="img" src={userInfo.signatureUrl} alt="Firma" sx={{ width: '100%', maxWidth: isMobile ? 150 : 200, height: 'auto', bgcolor: 'white', borderRadius: darkProTokens.borderRadiusSmall, border: `2px solid ${darkProTokens.info}`, boxShadow: `0 8px 32px ${darkProTokens.infoGlow}`, p: 1 }} /> </Box> </Grid> )}
                    {userInfo.contractPdfUrl && ( <Grid size={{ xs: 12, sm: 12, md: 4 }}> <Box component={motion.div} whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }} sx={{ textAlign: 'center', p: isMobile ? 2 : 3, borderRadius: darkProTokens.borderRadiusSmall, background: darkProTokens.glass, border: `1px solid ${darkProTokens.error}40` }}> <Typography variant="subtitle2" sx={{ color: darkProTokens.error, mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}> <FaFileContract /> Contrato </Typography> <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}> <Box component={motion.div} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} sx={{ fontSize: isMobile ? '3rem' : '4rem', color: darkProTokens.error, filter: `drop-shadow(0 0 20px ${darkProTokens.errorGlow})` }}> 📄 </Box> <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1, width: '100%' }}> <Button variant="contained" startIcon={<FaEye />} onClick={(e) => { e.stopPropagation(); const link = document.createElement('a'); link.href = userInfo.contractPdfUrl!; link.target = '_blank'; link.rel = 'noopener noreferrer'; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} sx={{ background: `linear-gradient(135deg, ${darkProTokens.error}, #B71C1C)`, color: 'white', fontWeight: 700, px: isMobile ? 2 : 3, py: 1.5, borderRadius: darkProTokens.borderRadiusSmall, boxShadow: `0 8px 32px ${darkProTokens.errorGlow}`, flex: 1, '&:hover': { transform: 'scale(1.02)' } }}> Ver Contrato </Button> <Button variant="outlined" startIcon={<FaDownload />} onClick={(e) => { e.stopPropagation(); const link = document.createElement('a'); link.href = userInfo.contractPdfUrl!; link.download = `contrato-${userInfo.firstName}-${userInfo.lastName}.pdf`; document.body.appendChild(link); link.click(); document.body.removeChild(link); }} sx={{ borderColor: darkProTokens.error, color: darkProTokens.error, fontWeight: 600, px: isMobile ? 2 : 3, py: 1.5, borderRadius: darkProTokens.borderRadiusSmall, flex: isMobile ? 1 : 'auto', '&:hover': { backgroundColor: `${darkProTokens.error}10`, borderColor: darkProTokens.error, transform: 'scale(1.02)' } }}> {isMobile ? 'Descargar' : 'Descargar PDF'} </Button> </Box> </Box> </Box> </Grid> )}
                  </Grid>
                </CardContent>
              </GlassCard>
            </Grid>
          )}
        </Grid>
      </Container>
      
      {imagePreview && (
        <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImagePreview(null)} sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, p: isMobile ? 2 : 4, cursor: 'pointer' }}>
          <Box component={motion.img} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300 }} src={imagePreview} alt="Vista previa" sx={{ maxWidth: '90%', maxHeight: '90%', borderRadius: darkProTokens.borderRadiusSmall, boxShadow: darkProTokens.shadowHeavy, cursor: 'default' }} onClick={(e) => e.stopPropagation()} />
          <IconButton onClick={() => setImagePreview(null)} sx={{ position: 'absolute', top: isMobile ? 16 : 32, right: isMobile ? 16 : 32, color: 'white', backgroundColor: 'rgba(0,0,0,0.7)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)', transform: 'scale(1.1)' } }}> <FaEye style={{ fontSize: isMobile ? '20px' : '24px' }} /> </IconButton>
        </Box>
      )}

      <style jsx global>{`
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } }
        body { scrollbar-width: thin; scrollbar-color: ${darkProTokens.primary} ${darkProTokens.surfaceLevel1}; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${darkProTokens.surfaceLevel1}; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover}); border-radius: 4px; border: 1px solid ${darkProTokens.surfaceLevel2}; }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primary}); }
      `}</style>
    </Box>
  );
}
