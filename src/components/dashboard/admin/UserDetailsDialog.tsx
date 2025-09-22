// components/dashboard/admin/UserDetailsDialog.tsx - INTERFAZ CORREGIDA
'use client';

import React from 'react';
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
  ContactEmergency as EmergencyIcon,
  Description as DocumentIcon,
  Fingerprint as FingerprintIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { colorTokens } from '@/theme';
import { User } from '@/types/user';

// INTERFAZ DE PROPIEDADES CORRECTAMENTE DEFINIDA
interface UserDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onEdit?: (user: User) => void;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = React.memo(({ 
  open, 
  onClose, 
  user,
  onEdit 
}) => {
  if (!user) {
    return null;
  }

  // FUNCIÓN CORREGIDA PARA CALCULAR COMPLETITUD (SINCRONIZADA CON useUsers)
  const calculateCompleteness = () => {
    // Usar la misma lógica que en el hook useUsers
    const requiredFields = [
      Boolean(user.profilePictureUrl),     // Foto de perfil
      Boolean(user.signatureUrl),          // Firma digital
      Boolean(user.contractPdfUrl),        // Contrato firmado
      Boolean(user.fingerprint),           // Huella dactilar registrada
      Boolean(user.emailSent),             // Email de bienvenida enviado
      Boolean(user.whatsappSent),          // WhatsApp de confirmación enviado
      Boolean(user.birthDate),             // Fecha de nacimiento
      Boolean(user.whatsapp),              // Número de WhatsApp
    ];

    const completedFields = requiredFields.filter(field => field === true).length;
    return Math.round((completedFields / requiredFields.length) * 100);
  };

  // FUNCIÓN PARA VERIFICAR SI EL PERFIL ESTÁ COMPLETAMENTE LISTO
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

  // Funciones auxiliares existentes...
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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No disponible';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

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
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `1px solid ${colorTokens.neutral400}`,
          borderRadius: 3,
          backdropFilter: 'blur(20px)',
        }
      }}
    >
      {/* HEADER CON INFORMACIÓN PRINCIPAL */}
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${colorTokens.neutral300}, ${colorTokens.neutral400})`,
        color: colorTokens.neutral1200,
        borderBottom: `1px solid ${colorTokens.neutral500}`,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            src={user.profilePictureUrl}
            sx={{
              width: 80,
              height: 80,
              bgcolor: getRoleColor(user.rol),
              border: `3px solid ${getRoleColor(user.rol)}`,
              boxShadow: `0 4px 20px ${getRoleColor(user.rol)}30`,
            }}
          >
            {user.firstName?.[0]?.toUpperCase() || '?'}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ 
              color: colorTokens.neutral1200, 
              fontWeight: 700,
              mb: 1
            }}>
              {user.firstName} {user.lastName}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                icon={getRoleIcon(user.rol)}
                label={getRoleLabel(user.rol)}
                sx={{
                  bgcolor: `${getRoleColor(user.rol)}20`,
                  color: getRoleColor(user.rol),
                  border: `1px solid ${getRoleColor(user.rol)}40`,
                  fontWeight: 600,
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
                  }}
                />
              )}
              
              {user.fingerprint && (
                <Chip
                  icon={<FingerprintIcon />}
                  label="Verificado"
                  size="small"
                  sx={{
                    bgcolor: `${colorTokens.success}20`,
                    color: colorTokens.success,
                    border: `1px solid ${colorTokens.success}40`,
                  }}
                />
              )}

              {/* BADGE DE PERFIL COMPLETO */}
              {profileComplete && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Perfil Completo"
                  size="small"
                  sx={{
                    bgcolor: `${colorTokens.brand}20`,
                    color: colorTokens.brand,
                    border: `1px solid ${colorTokens.brand}40`,
                  }}
                />
              )}
            </Box>

            {/* PROGRESO DE COMPLETITUD CORREGIDO */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: colorTokens.neutral1000 }}>
                  Completitud del Perfil
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: completeness >= 80 ? colorTokens.success : 
                         completeness >= 50 ? colorTokens.warning : colorTokens.danger,
                  fontWeight: 600 
                }}>
                  {completeness}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completeness}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: colorTokens.neutral400,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: completeness >= 80 ? colorTokens.success : 
                            completeness >= 50 ? colorTokens.warning : colorTokens.danger,
                    borderRadius: 4,
                  }
                }}
              />
              
              {/* INDICADOR DETALLADO DE COMPLETITUD */}
              <Typography variant="caption" sx={{ 
                color: colorTokens.neutral900, 
                mt: 1, 
                display: 'block' 
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

      {/* CONTENIDO PRINCIPAL */}
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* INFORMACIÓN PERSONAL */}
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
                <PersonIcon sx={{ color: colorTokens.brand }} />
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
                      {formatDate(user.birthDate)} ({calculateAge(user.birthDate)})
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

          {/* ESTADO DE DOCUMENTOS Y VERIFICACIÓN MEJORADO */}
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

          {/* RESTO DEL CONTENIDO PERMANECE IGUAL... */}
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
                    {formatDate(user.createdAt || '')}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                    Última Actualización
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.neutral1200 }}>
                    {formatDate(user.updatedAt || '')}
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

      {/* ACCIONES */}
      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${colorTokens.neutral500}`,
        bgcolor: `${colorTokens.neutral300}80`
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: colorTokens.neutral1000,
            borderColor: colorTokens.neutral500,
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
            startIcon={<EditIcon />}
            sx={{
              bgcolor: colorTokens.brand,
              '&:hover': { bgcolor: colorTokens.brand }
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