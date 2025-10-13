// ========================================
// 🔔 MENÚ DE NOTIFICACIONES - COMPONENTE UI
// ========================================
import React, { useEffect, useState, useMemo } from 'react';
import {
  Menu,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { colorTokens } from '@/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

// ICONOS
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';

// ✅ ESTILOS PERSONALIZADOS
const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    background: `linear-gradient(135deg, ${colorTokens.neutral100}, ${colorTokens.neutral200})`,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
    borderRadius: '16px',
    boxShadow: `0 8px 32px ${alpha(colorTokens.black, 0.4)}`,
    minWidth: '400px',
    maxWidth: '450px',
    maxHeight: '600px',
  }
}));

const NotificationItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  borderRadius: '12px',
  margin: '4px 8px',
  padding: '12px',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: alpha(colorTokens.brand, 0.1),
    transform: 'translateX(4px)'
  }
}));

// ✅ MAPEO DE ICONOS POR TIPO
const getNotificationIcon = (type: string) => {
  if (type.startsWith('sale_') || type.startsWith('layaway_')) {
    return <ShoppingCartIcon sx={{ color: colorTokens.brand }} />;
  }
  if (type.startsWith('membership_')) {
    return <CardMembershipIcon sx={{ color: colorTokens.success }} />;
  }
  if (type.includes('warning') || type.includes('expir')) {
    return <WarningIcon sx={{ color: '#FF9800' }} />;
  }
  return <InfoIcon sx={{ color: colorTokens.brand }} />;
};

// ✅ MAPEO DE COLORES POR PRIORIDAD
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return colorTokens.danger;
    case 'high': return '#FF9800';
    case 'normal': return colorTokens.brand;
    case 'low': return colorTokens.neutral200;
    default: return colorTokens.brand;
  }
};

// ✅ FORMATO DE TIEMPO RELATIVO
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Justo ahora';
  if (diffMins === 1) return 'Hace 1 minuto';
  if (diffMins < 60) return `Hace ${diffMins} minutos`;
  if (diffHours === 1) return 'Hace 1 hora';
  if (diffHours < 24) return `Hace ${diffHours} horas`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

// ✅ PROPS
interface NotificationsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

export default function NotificationsMenu({ anchorEl, open, onClose }: NotificationsMenuProps) {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount,
    loading,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // ✅ ESTADO PARA FILTRAR
  const [showOnlyUnread, setShowOnlyUnread] = useState(true);

  // ✅ FILTRAR NOTIFICACIONES
  const filteredNotifications = useMemo(() => {
    if (showOnlyUnread) {
      return notifications.filter(n => !n.is_read);
    }
    return notifications;
  }, [notifications, showOnlyUnread]);

  // ✅ CARGAR NOTIFICACIONES AL ABRIR
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  // ✅ MANEJAR CLICK EN NOTIFICACIÓN
  const handleNotificationClick = async (notification: any) => {
    // Marcar como leída
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navegar si tiene URL y cerrar
    if (notification.action_url) {
      router.push(notification.action_url);
      onClose();
    }
  };

  // ✅ MANEJAR MARCAR TODAS COMO LEÍDAS
  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <StyledMenu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <Box>
      {/* HEADER */}
      <Box sx={{ 
        px: 3, 
        py: 2,
        background: alpha(colorTokens.brand, 0.05),
        borderBottom: `1px solid ${alpha(colorTokens.brand, 0.1)}`
      }}>
        {/* FILA 1: Título y Cerrar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              color: colorTokens.textPrimary
            }}>
              Notificaciones
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                sx={{
                  backgroundColor: colorTokens.danger,
                  color: colorTokens.white,
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  height: '24px',
                  minWidth: '24px'
                }}
              />
            )}
          </Box>
          <IconButton 
            size="small" 
            onClick={onClose}
            sx={{
              '&:hover': {
                backgroundColor: alpha(colorTokens.brand, 0.1)
              }
            }}
          >
            <CloseIcon fontSize="small" sx={{ color: colorTokens.textSecondary }} />
          </IconButton>
        </Box>

        {/* FILA 2: Toggle de Filtro */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterListIcon sx={{ fontSize: 18, color: colorTokens.textSecondary }} />
          <ToggleButtonGroup
            value={showOnlyUnread ? 'unread' : 'all'}
            exclusive
            onChange={(e, newValue) => {
              if (newValue !== null) {
                setShowOnlyUnread(newValue === 'unread');
              }
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                textTransform: 'none',
                border: `1px solid ${alpha(colorTokens.brand, 0.3)}`,
                '&.Mui-selected': {
                  backgroundColor: colorTokens.brand,
                  color: colorTokens.white,
                  '&:hover': {
                    backgroundColor: colorTokens.brand,
                  }
                }
              }
            }}
          >
            <ToggleButton value="unread">
              No leídas ({unreadCount})
            </ToggleButton>
            <ToggleButton value="all">
              Todas ({notifications.length})
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* LOADING */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '200px'
        }}>
          <CircularProgress 
            size={40}
            sx={{ 
              color: colorTokens.brand 
            }} 
          />
        </Box>
      )}

      {/* LISTA DE NOTIFICACIONES */}
      {!loading && filteredNotifications.length > 0 && (
        <List sx={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          py: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(colorTokens.brand, 0.3),
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: alpha(colorTokens.brand, 0.5)
            }
          }
        }}>
          {filteredNotifications.map((notification) => (
            <Box
              key={notification.id}
              component={motion.div}
              whileHover={{ x: 4 }}
            >
              <NotificationItem
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  backgroundColor: !notification.is_read 
                    ? alpha(colorTokens.brand, 0.08)
                    : 'transparent',
                  borderLeft: !notification.is_read 
                    ? `3px solid ${getPriorityColor(notification.priority)}`
                    : 'none'
                }}
              >
              <ListItemAvatar>
                <Avatar sx={{ 
                  bgcolor: alpha(getPriorityColor(notification.priority), 0.15),
                  width: 44,
                  height: 44
                }}>
                  {getNotificationIcon(notification.type)}
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography component="span" variant="body2" sx={{ 
                      fontWeight: notification.is_read ? 500 : 700,
                      color: colorTokens.textPrimary,
                      flex: 1
                    }}>
                      {notification.title}
                    </Typography>
                    {!notification.is_read && (
                      <Box component="span" sx={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: getPriorityColor(notification.priority)
                      }} />
                    )}
                  </Box>
                }
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" sx={{ 
                      display: 'block',
                      color: colorTokens.textSecondary,
                      fontSize: '0.85rem',
                      mb: 0.5
                    }}>
                      {notification.message}
                    </Typography>
                    <Typography component="span" variant="caption" sx={{ 
                      display: 'block',
                      color: alpha(colorTokens.textSecondary, 0.7),
                      fontSize: '0.75rem'
                    }}>
                      {getRelativeTime(notification.created_at)}
                    </Typography>
                  </React.Fragment>
                }
              />
            </NotificationItem>
            </Box>
          ))}
        </List>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredNotifications.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 6,
          px: 3
        }}>
          <CheckCircleIcon sx={{ 
            fontSize: 64, 
            color: alpha(colorTokens.success, 0.5),
            mb: 2
          }} />
          <Typography variant="h6" sx={{ 
            color: colorTokens.textPrimary,
            fontWeight: 600,
            mb: 1
          }}>
            {showOnlyUnread ? '¡Todo al día!' : 'Sin notificaciones'}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: colorTokens.textSecondary 
          }}>
            {showOnlyUnread 
              ? 'No tienes notificaciones pendientes' 
              : 'No tienes notificaciones en este momento'}
          </Typography>
        </Box>
      )}

      {/* FOOTER CON BOTÓN "MARCAR TODAS COMO LEÍDAS" */}
      {!loading && notifications.length > 0 && unreadCount > 0 && (
        <>
          <Divider sx={{ borderColor: alpha(colorTokens.brand, 0.1) }} />
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Button
              fullWidth
              variant="text"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllRead}
              sx={{
                color: colorTokens.brand,
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: alpha(colorTokens.brand, 0.1)
                }
              }}
            >
              Marcar todas como leídas
            </Button>
          </Box>
        </>
      )}
      </Box>
    </StyledMenu>
  );
}
