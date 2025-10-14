// components/dashboard/admin/UserDetailsDialog.tsx - VERSIÓN ENTERPRISE
'use client';

import React, { memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Chip,
  Grid,
  Paper,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  Verified as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  AdminPanelSettings as AdminIcon,
  Work as EmployeeIcon,
  FitnessCenter as ClientIcon,
  CalendarToday as CalendarIcon,
  Description as DocumentIcon,
  Fingerprint as FingerprintIcon,
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { useHydrated } from '@/hooks/useHydrated';
import { 
  formatTimestampForDisplay, 
  formatTimestampDateOnly,
  formatDateForDisplay 
} from '@/utils/dateUtils';
import { colorTokens } from '@/theme';
import { User } from '@/types/user';

interface UserDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onEdit?: (user: User) => void;
}

const UserDetailsDialog = memo<UserDetailsDialogProps>(({ 
  open, 
  onClose, 
  user,
  onEdit 
}) => {
  // ✅ SSR SAFETY OBLIGATORIO
  const hydrated = useHydrated();

  if (!user || !hydrated) {
    return null;
  }

  // ✅ FUNCIÓN PARA CALCULAR COMPLETITUD (SINCRONIZADA CON useUsers)
  const calculateCompleteness = () => {
    const requiredFields = [
      Boolean(user.profilePictureUrl),
      Boolean(user.signatureUrl),
      Boolean(user.contractPdfUrl),
      Boolean(user.fingerprint),
      Boolean(user.emailSent),
      Boolean(user.whatsappSent),
      Boolean(user.birthDate),
      Boolean(user.whatsapp),
    ];

    const completedFields = requiredFields.filter(field => field === true).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  const isProfileComplete = () => {
    return Boolean(
      user.profilePictureUrl &&
      user.signatureUrl &&
      user.contractPdfUrl &&
      user.fingerprint &&
      user.emailSent &&
      user.whatsappSent &&
      user.birthDate &&
      user.whatsapp
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <AdminIcon sx={{ color: colorTokens.brand }} />;
      case 'empleado': return <EmployeeIcon sx={{ color: colorTokens.info }} />;
      case 'cliente': return <ClientIcon sx={{ color: colorTokens.success }} />;
      default: return <PersonIcon sx={{ color: colorTokens.neutral700 }} />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'empleado': return 'Empleado';
      case 'cliente': return 'Cliente';
      default: return 'Desconocido';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return colorTokens.brand;
      case 'empleado': return colorTokens.info;
      case 'cliente': return colorTokens.success;
      default: return colorTokens.neutral700;
    }
  };

  // ✅ CALCULAR EDAD USANDO dateUtils
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'No disponible';
    try {
      const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
      return `${age} años`;
    } catch {
      return 'No disponible';
    }
  };

  const completeness = calculateCompleteness();
  const profileComplete = isProfileComplete();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={false} // Permitir fullScreen en móviles si es necesario
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `1px solid ${colorTokens.neutral400}`,
          borderRadius: { xs: 0, sm: 3 },
          backdropFilter: 'blur(20px)',
          maxHeight: { xs: '100vh', sm: '95vh' },
          m: { xs: 0, sm: 2 }
        }
      }}
    >
      {/* HEADER CON INFORMACIÓN PRINCIPAL - RESPONSIVE */}
      <DialogTitle sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral300}, ${colorTokens.neutral400})`,
        color: colorTokens.neutral1200,
        borderBottom: `1px solid ${colorTokens.neutral500}`,
        position: 'relative',
        p: { xs: 2, sm: 2.5, md: 3 }
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'center', sm: 'flex-start' },
          gap: { xs: 2, sm: 2.5, md: 3 }
        }}>
          <Avatar
            src={user.profilePictureUrl}
            sx={{
              width: { xs: 60, sm: 70, md: 80 },
              height: { xs: 60, sm: 70, md: 80 },
              bgcolor: getRoleColor(user.rol),
              border: `3px solid ${getRoleColor(user.rol)}`,
              boxShadow: `0 4px 20px ${getRoleColor(user.rol)}30`,
            }}
          >
            {user.firstName?.[0]?.toUpperCase() || '?'}
          </Avatar>

          <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' }, width: { xs: '100%', sm: 'auto' } }}>
            <Typography variant="h4" sx={{
              color: colorTokens.neutral1200,
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}>
              {user.firstName} {user.lastName}
            </Typography>
            
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'center', sm: 'flex-start' },
              gap: { xs: 1, sm: 1.5, md: 2 },
              mb: { xs: 1.5, sm: 2 },
              flexWrap: 'wrap'
            }}>
              <Chip
                icon={getRoleIcon(user.rol)}
                label={getRoleLabel(user.rol)}
                size="small"
                sx={{
                  bgcolor: `${getRoleColor(user.rol)}20`,
                  color: getRoleColor(user.rol),
                  border: `1px solid ${getRoleColor(user.rol)}40`,
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  height: { xs: '26px', sm: '28px' }
                }}
              />

              {user.isMinor && (
                <Chip
                  label="Menor de Edad"
                  size="small"
                  sx={{
                    bgcolor: `${colorTokens.warning}20`,
                    color: colorTokens.warning,
                    border: `1px solid ${colorTokens.warning}40`,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: '24px', sm: '26px' }
                  }}
                />
              )}

              {user.fingerprint && (
                <Chip
                  icon={<FingerprintIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                  label="Verificado"
                  size="small"
                  sx={{
                    bgcolor: `${colorTokens.success}20`,
                    color: colorTokens.success,
                    border: `1px solid ${colorTokens.success}40`,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: '24px', sm: '26px' }
                  }}
                />
              )}

              {profileComplete && (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                  label="Perfil Completo"
                  size="small"
                  sx={{
                    bgcolor: `${colorTokens.brand}20`,
                    color: colorTokens.brand,
                    border: `1px solid ${colorTokens.brand}40`,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    height: { xs: '24px', sm: '26px' }
                  }}
                />
              )}
            </Box>

            {/* PROGRESO DE COMPLETITUD - RESPONSIVE */}
            <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: { xs: 0.75, sm: 1 }
              }}>
                <Typography variant="body2" sx={{
                  color: colorTokens.neutral1000,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  Completitud del Perfil
                </Typography>
                <Typography variant="body2" sx={{
                  color: completeness >= 80 ? colorTokens.success :
                         completeness >= 50 ? colorTokens.warning : colorTokens.danger,
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  {completeness}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completeness}
                sx={{
                  height: { xs: 6, sm: 8 },
                  borderRadius: 4,
                  bgcolor: colorTokens.neutral400,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: completeness >= 80 ? colorTokens.success :
                            completeness >= 50 ? colorTokens.warning : colorTokens.danger,
                    borderRadius: 4,
                  }
                }}
              />

              <Typography variant="caption" sx={{
                color: colorTokens.neutral900,
                mt: { xs: 0.75, sm: 1 },
                display: 'block',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}>
                {Math.round((completeness / 100) * 8)} de 8 campos requeridos completados
                {!profileComplete && completeness < 100 &&
                  ` (falta${completeness < 50 ? 'n varios campos' : completeness < 80 ? 'n algunos campos' : ' completar campos pendientes'})`
                }
              </Typography>
            </Box>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: colorTokens.neutral1000,
            '&:hover': { bgcolor: `${colorTokens.neutral500}30` }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* CONTENIDO PRINCIPAL - RESPONSIVE */}
      <DialogContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {/* INFORMACIÓN PERSONAL - RESPONSIVE */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              bgcolor: `${colorTokens.neutral100}80`,
              border: `1px solid ${colorTokens.neutral400}`,
              borderRadius: 2,
              height: 'fit-content'
            }}>
              <Typography variant="h6" sx={{
                color: colorTokens.neutral1200,
                mb: { xs: 1.5, sm: 2 },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
              }}>
                <PersonIcon sx={{
                  color: colorTokens.brand,
                  fontSize: { xs: 20, sm: 22, md: 24 }
                }} />
                Información Personal
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    Email
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: colorTokens.neutral800 }} />
                    <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    WhatsApp
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: colorTokens.neutral800 }} />
                    <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                      {user.whatsapp || 'No disponible'}
                    </Typography>
                    {!user.whatsapp && (
                      <Chip 
                        label="Requerido" 
                        size="small" 
                        sx={{ 
                          bgcolor: `${colorTokens.danger}20`, 
                          color: colorTokens.danger,
                          height: 20,
                          fontSize: '0.65rem'
                        }} 
                      />
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    Fecha de Nacimiento
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ fontSize: 16, color: colorTokens.neutral800 }} />
                    <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                      {/* ✅ USAR dateUtils EN LUGAR DE date-fns */}
                      {formatDateForDisplay(user.birthDate)} ({calculateAge(user.birthDate)})
                    </Typography>
                    {!user.birthDate && (
                      <Chip 
                        label="Requerido" 
                        size="small" 
                        sx={{ 
                          bgcolor: `${colorTokens.danger}20`, 
                          color: colorTokens.danger,
                          height: 20,
                          fontSize: '0.65rem'
                        }} 
                      />
                    )}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    Género
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                    {user.gender || 'No especificado'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    Estado Civil
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                    {user.maritalStatus || 'No especificado'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* ESTADO DE DOCUMENTOS Y VERIFICACIÓN */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{
              p: 3,
              bgcolor: `${colorTokens.neutral100}80`,
              border: `1px solid ${colorTokens.neutral400}`,
              borderRadius: 2,
              height: 'fit-content'
            }}>
              <Typography variant="h6" sx={{ 
                color: colorTokens.neutral1200, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <DocumentIcon sx={{ color: colorTokens.info }} />
                Estado de Documentos
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Foto de Perfil', value: Boolean(user.profilePictureUrl), icon: <CheckCircleIcon />, required: true },
                  { label: 'Firma Digital', value: Boolean(user.signatureUrl), icon: <CheckCircleIcon />, required: true },
                  { label: 'Contrato PDF', value: Boolean(user.contractPdfUrl), icon: <CheckCircleIcon />, required: true },
                  { label: 'Huella Dactilar', value: Boolean(user.fingerprint), icon: <FingerprintIcon />, required: true },
                  { label: 'Email Enviado', value: Boolean(user.emailSent), icon: <EmailIcon />, required: true },
                  { label: 'WhatsApp Enviado', value: Boolean(user.whatsappSent), icon: <PhoneIcon />, required: true },
                ].map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                      {item.label}
                      {item.required && !item.value && (
                        <Typography component="span" sx={{ color: colorTokens.danger, ml: 1, fontSize: '0.75rem' }}>
                          *
                        </Typography>
                      )}
                    </Typography>
                    <Chip
                      icon={item.value ? item.icon : <CancelIcon />}
                      label={item.value ? 'Completado' : 'Pendiente'}
                      size="small"
                      sx={{
                        bgcolor: item.value ? `${colorTokens.success}20` : `${colorTokens.danger}20`,
                        color: item.value ? colorTokens.success : colorTokens.danger,
                        border: `1px solid ${item.value ? colorTokens.success : colorTokens.danger}40`,
                      }}
                    />
                  </Box>
                ))}
              </Box>
              
              {!profileComplete && (
                <Box sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: `${colorTokens.warning}10`, 
                  border: `1px solid ${colorTokens.warning}30`,
                  borderRadius: 1 
                }}>
                  <Typography variant="caption" sx={{ color: colorTokens.warning }}>
                    * Campos requeridos para completar el perfil
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* INFORMACIÓN DEL SISTEMA */}
          <Grid size={{ xs: 12 }}>
            <Paper sx={{
              p: 3,
              bgcolor: `${colorTokens.neutral100}80`,
              border: `1px solid ${colorTokens.neutral400}`,
              borderRadius: 2,
            }}>
              <Typography variant="h6" sx={{ 
                color: colorTokens.neutral1200, 
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CalendarIcon sx={{ color: colorTokens.info }} />
                Información del Sistema
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    Fecha de Registro
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                    {/* ✅ USAR dateUtils CENTRALIZADOS */}
                    {formatTimestampDateOnly(user.createdAt || null)}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    Última Actualización
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                    {/* ✅ USAR dateUtils CENTRALIZADOS */}
                    {formatTimestampForDisplay(user.updatedAt || null)}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    ID del Usuario
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: colorTokens.neutral1000,
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}>
                    {user.id}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      {/* ACCIONES - RESPONSIVE */}
      <DialogActions sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        borderTop: `1px solid ${colorTokens.neutral500}`,
        bgcolor: `${colorTokens.neutral300}80`,
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={false}
          sx={{
            color: colorTokens.neutral1000,
            borderColor: colorTokens.neutral500,
            fontSize: { xs: '0.8rem', sm: '0.875rem' },
            px: { xs: 2, sm: 2.5, md: 3 },
            width: { xs: '100%', sm: 'auto' },
            '&:hover': {
              borderColor: colorTokens.neutral700,
              bgcolor: `${colorTokens.neutral500}20`
            }
          }}
        >
          Cerrar
        </Button>

        {onEdit && (
          <Button
            onClick={() => onEdit(user)}
            variant="contained"
            startIcon={<EditIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
            sx={{
              bgcolor: colorTokens.brand,
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              px: { xs: 2, sm: 2.5, md: 3 },
              width: { xs: '100%', sm: 'auto' },
              '&:hover': { bgcolor: colorTokens.brandHover }
            }}
          >
            Editar Usuario
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
});

UserDetailsDialog.displayName = 'UserDetailsDialog';

export default UserDetailsDialog;