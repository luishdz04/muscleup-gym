'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  WhatsApp as WhatsAppIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Send as SendIcon,
} from '@mui/icons-material';

// ✅ USAR DATEUTILS Y THEME CENTRALIZADOS
import { 
  addDaysToDate, 
  formatDateLong, 
  formatDateForDisplay,
  getTodayInMexico 
} from '@/utils/dateUtils';
import { colorTokens } from '@/theme';

interface ExpiringMembership {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    whatsapp?: string;
    email?: string;
  };
  plan: {
    name: string;
  };
  end_date: string;
  payment_type: string;
  status: string;
}

interface ReminderResult {
  membershipId: string;
  userName: string;
  phone: string;
  success: boolean;
  message: string;
}

interface SendResponse {
  success: boolean;
  sent: number;
  failed: number;
  skipped: number;
  total: number;
  details: ReminderResult[];
  message?: string;
}

interface MembershipExpirationReminderProps {
  daysBeforeExpiration?: number;
}

export default function MembershipExpirationReminder({
  daysBeforeExpiration = 3,
}: MembershipExpirationReminderProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [memberships, setMemberships] = useState<ExpiringMembership[]>([]);
  const [sendResults, setSendResults] = useState<SendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calcular la fecha objetivo usando dateUtils centralizado
  const today = getTodayInMexico();
  const targetDate = addDaysToDate(today, daysBeforeExpiration);
  const targetDateString = targetDate; // Ya viene en formato YYYY-MM-DD

  // Abrir dialog y cargar membresías
  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    setSendResults(null);

    try {
      const response = await fetch(
        `/api/user-memberships?status=active&end_date=${targetDateString}&exclude_payment_type=visit`
      );

      if (!response.ok) {
        throw new Error('Error al cargar membresías');
      }

      const data = await response.json();
      setMemberships(data.memberships || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cerrar dialog
  const handleClose = () => {
    setOpen(false);
    setMemberships([]);
    setSendResults(null);
    setError(null);
  };

  // Enviar recordatorios
  const handleSendReminders = async () => {
    setSending(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/send-expiration-reminders?daysBeforeExpiration=${daysBeforeExpiration}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetDate: targetDateString,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar recordatorios');
      }

      const results: SendResponse = await response.json();
      setSendResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSending(false);
    }
  };

  // Contar usuarios con WhatsApp
  const usersWithWhatsApp = memberships.filter(
    (m) => m.user.whatsapp && m.user.whatsapp.trim() !== ''
  ).length;

  return (
    <>
      {/* Botón Principal con Theme Centralizado y Letra Negra */}
      <Tooltip title={`Ver membresías que vencen en ${daysBeforeExpiration} días`}>
        <Button
          variant="contained"
          startIcon={<NotificationsIcon />}
          onClick={handleOpen}
          sx={{
            backgroundColor: '#FFC107', // Amarillo brillante
            color: '#000', // ✅ LETRA NEGRA para mejor contraste
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 700,
            boxShadow: 3,
            px: 3,
            py: 1.5,
            '&:hover': {
              backgroundColor: '#FFB300', // Amarillo más oscuro al hover
              color: '#000',
              transform: 'translateY(-2px)',
              boxShadow: 5,
            },
          }}
        >
          Próximos a Vencer ({daysBeforeExpiration} días)
        </Button>
      </Tooltip>

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        {/* Header con Letra Negra para Mejor Contraste */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#FFC107', // Amarillo brillante
            color: '#000', // ✅ LETRA NEGRA
            borderBottom: '2px solid #FFB300',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ color: '#000' }} />
            <Typography variant="h6" fontWeight="bold" color="#000">
              Membresías por Vencer
            </Typography>
          </Box>
          <IconButton onClick={handleClose} sx={{ color: '#000' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Content */}
        <DialogContent dividers sx={{ minHeight: 400 }}>
          {/* Fecha Objetivo */}
          <Alert severity="info" icon={<CalendarIcon />} sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Fecha objetivo:</strong>{' '}
              {formatDateLong(targetDate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Membresías que vencen exactamente en <strong>{daysBeforeExpiration} días</strong>
            </Typography>
          </Alert>

          {/* Loading State */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {error && !loading && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Empty State */}
          {!loading && !error && memberships.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <NotificationsIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No hay membresías por vencer en esta fecha
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Intenta con otra configuración de días
              </Typography>
            </Box>
          )}

          {/* Memberships List */}
          {!loading && !error && memberships.length > 0 && !sendResults && (
            <>
              {/* Summary con Mejor Contraste */}
              <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                  icon={<PersonIcon />}
                  label={`${memberships.length} membresía${memberships.length !== 1 ? 's' : ''}`}
                  sx={{
                    bgcolor: colorTokens.brand,
                    color: '#fff',
                    fontWeight: 600,
                  }}
                />
                <Chip
                  icon={<WhatsAppIcon />}
                  label={`${usersWithWhatsApp} con WhatsApp`}
                  sx={{
                    bgcolor: colorTokens.success,
                    color: '#fff',
                    fontWeight: 600,
                  }}
                />
                {usersWithWhatsApp < memberships.length && (
                  <Chip
                    label={`${memberships.length - usersWithWhatsApp} sin WhatsApp`}
                    sx={{
                      bgcolor: '#FFC107',
                      color: '#000',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* List */}
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {memberships.map((membership) => (
                  <ListItem
                    key={membership.id}
                    sx={{
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: membership.user.whatsapp ? 'background.paper' : 'action.hover',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {membership.user.firstName.charAt(0)}
                        {membership.user.lastName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold" component="div">
                          {membership.user.firstName} {membership.user.lastName}
                        </Typography>
                      }
                      primaryTypographyProps={{ component: 'div' }}
                      secondary={
                        <Box component="div">
                          <Typography variant="body2" color="text.secondary" component="div">
                            📋 Plan: {membership.plan.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" component="div">
                            📅 Vence: {formatDateForDisplay(membership.end_date)}
                          </Typography>
                          {membership.user.whatsapp ? (
                            <Typography variant="body2" color="success.main" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <WhatsAppIcon fontSize="small" />
                              {membership.user.whatsapp}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="warning.main" component="div">
                              ⚠️ Sin WhatsApp registrado
                            </Typography>
                          )}
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {/* Send Results con Theme Dark */}
          {sendResults && (
            <Box>
              {/* Summary Cards con Colores Dark Mode */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
                {/* Card Enviados - Verde */}
                <Paper elevation={3} sx={{ 
                  py: 2, 
                  px: 2,
                  bgcolor: 'rgba(34, 197, 94, 0.15)', // Verde con transparencia
                  border: `2px solid ${colorTokens.success}`,
                  textAlign: 'center',
                  borderRadius: 2,
                }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: '#86EFAC' }}>
                    {sendResults.sent}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: '#86EFAC' }}>
                    ✅ Enviados
                  </Typography>
                </Paper>
                
                {/* Card Fallidos - Rojo */}
                <Paper elevation={3} sx={{ 
                  py: 2, 
                  px: 2,
                  bgcolor: 'rgba(239, 68, 68, 0.15)', // Rojo con transparencia
                  border: `2px solid ${colorTokens.danger}`,
                  textAlign: 'center',
                  borderRadius: 2,
                }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: '#FCA5A5' }}>
                    {sendResults.failed}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: '#FCA5A5' }}>
                    ❌ Fallidos
                  </Typography>
                </Paper>
                
                {/* Card Omitidos - Amarillo */}
                <Paper elevation={3} sx={{ 
                  py: 2, 
                  px: 2,
                  bgcolor: 'rgba(255, 204, 0, 0.15)', // Amarillo con transparencia
                  border: `2px solid ${colorTokens.warning}`,
                  textAlign: 'center',
                  borderRadius: 2,
                }}>
                  <Typography variant="h3" fontWeight="bold" sx={{ color: '#FDE68A' }}>
                    {sendResults.skipped}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: '#FDE68A' }}>
                    ⚠️ Omitidos
                  </Typography>
                </Paper>
              </Box>

              <Divider sx={{ mb: 2, borderColor: colorTokens.divider }} />

              {/* Detailed Results - VERSIÓN MEJORADA CON THEME DARK */}
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
                📋 Detalles del Envío:
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto', p: 0 }}>
                {sendResults.details.map((detail, index) => {
                  const isSuccess = detail.success;
                  // ✅ VALIDAR QUE MESSAGE EXISTA ANTES DE USAR toLowerCase
                  const messageText = detail.message || '';
                  const isSkipped = messageText.toLowerCase().includes('omitido') || 
                                   messageText.toLowerCase().includes('sin whatsapp');
                  
                  // ✅ DETERMINAR COLORES CON THEME DARK
                  let bgColor: string = 'rgba(239, 68, 68, 0.15)'; // Rojo con transparencia (error)
                  let borderColor: string = colorTokens.danger; // #EF4444
                  let iconBg: string = colorTokens.danger;
                  let textColor: string = '#FCA5A5'; // Rojo claro para texto
                  let icon: string = '✗';
                  
                  if (isSuccess) {
                    bgColor = 'rgba(34, 197, 94, 0.15)'; // Verde con transparencia
                    borderColor = colorTokens.success; // #22C55E
                    iconBg = colorTokens.success;
                    textColor = '#86EFAC'; // Verde claro para texto
                    icon = '✓';
                  } else if (isSkipped) {
                    bgColor = 'rgba(255, 204, 0, 0.15)'; // Amarillo con transparencia
                    borderColor = colorTokens.warning; // #FFCC00
                    iconBg = colorTokens.warning;
                    textColor = '#FDE68A'; // Amarillo claro para texto
                    icon = '⚠';
                  }
                  
                  return (
                    <Paper
                      key={index}
                      elevation={2}
                      sx={{
                        mb: 1.5,
                        p: 2,
                        bgcolor: bgColor,
                        border: `2px solid ${borderColor}`,
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          boxShadow: 4,
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        {/* Icono de Estado */}
                        <Avatar
                          sx={{
                            bgcolor: iconBg,
                            color: '#fff',
                            width: 40,
                            height: 40,
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {icon}
                        </Avatar>

                        {/* Información del Usuario */}
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight="bold" 
                            sx={{ 
                              color: colorTokens.textPrimary, // Blanco en dark mode
                              mb: 0.5 
                            }}
                          >
                            {detail.userName}
                          </Typography>
                          
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: colorTokens.textSecondary, // Gris claro en dark mode
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              mb: 0.5
                            }}
                          >
                            <WhatsAppIcon fontSize="small" sx={{ color: '#25D366' }} />
                            {detail.phone || 'Sin teléfono'}
                          </Typography>
                          
                          {/* Mensaje de Estado con Theme Dark */}
                          <Box
                            sx={{
                              mt: 1,
                              p: 1.5,
                              bgcolor: 'rgba(0,0,0,0.3)', // Fondo más oscuro para dark mode
                              borderRadius: 1,
                              borderLeft: `4px solid ${borderColor}`,
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{
                                color: textColor, // Color dinámico según estado
                              }}
                            >
                              {messageText || 'Sin mensaje'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </List>
            </Box>
          )}

          {/* Sending Progress */}
          {sending && (
            <Box sx={{ py: 3 }}>
              <Typography variant="body1" align="center" gutterBottom>
                Enviando recordatorios...
              </Typography>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                Esto puede tardar unos segundos
              </Typography>
            </Box>
          )}
        </DialogContent>

        {/* Actions con Mejor Contraste */}
        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5' }}>
          {!sendResults ? (
            <>
              <Button 
                onClick={handleClose} 
                disabled={sending}
                sx={{
                  color: '#666',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#e0e0e0',
                  }
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={sending ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <SendIcon />}
                onClick={handleSendReminders}
                disabled={loading || sending || memberships.length === 0 || usersWithWhatsApp === 0}
                sx={{
                  bgcolor: colorTokens.success,
                  color: '#fff',
                  fontWeight: 700,
                  px: 3,
                  '&:hover': {
                    bgcolor: colorTokens.successHover,
                  },
                  '&:disabled': {
                    bgcolor: '#ccc',
                    color: '#666',
                  }
                }}
              >
                {sending ? 'Enviando...' : `Enviar Recordatorios (${usersWithWhatsApp})`}
              </Button>
            </>
          ) : (
            <Button 
              variant="contained" 
              onClick={handleClose}
              sx={{
                bgcolor: colorTokens.brand,
                color: '#fff',
                fontWeight: 700,
                px: 4,
                '&:hover': {
                  bgcolor: colorTokens.brandHover,
                }
              }}
            >
              Cerrar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
