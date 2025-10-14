// components/dashboard/admin/UserTableRow.tsx - VERSIÓN ENTERPRISE
'use client';

import React, { useCallback, memo, useMemo } from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Avatar,
  Typography,
  Chip,
  ButtonGroup,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  AdminPanelSettings as AdminIcon,
  Work as EmployeeIcon,
  FitnessCenter as ClientIcon,
  Person as PersonIcon,
  Fingerprint as FingerprintIcon,
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { colorTokens } from '@/theme';
import { formatTimestampForDisplay } from '@/utils/dateUtils';
import { User } from '@/types/user';

interface UserTableRowProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (user: User) => void;
}

// ✅ FUNCIONES AUXILIARES MEMOIZADAS (fuera del componente para mejor performance)
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return <AdminIcon sx={{ color: colorTokens.brand, fontSize: '1rem' }} />;
    case 'empleado': return <EmployeeIcon sx={{ color: colorTokens.info, fontSize: '1rem' }} />;
    case 'cliente': return <ClientIcon sx={{ color: colorTokens.success, fontSize: '1rem' }} />;
    default: return <PersonIcon sx={{ color: colorTokens.neutral700, fontSize: '1rem' }} />;
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

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'empleado': return 'Empleado';
    case 'cliente': return 'Cliente';
    default: return 'Desconocido';
  }
};

// ✅ FUNCIÓN MEJORADA PARA CALCULAR COMPLETITUD (sincronizada con useUsers)
const getCompletionPercentage = (user: User) => {
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
  
  const completed = requiredFields.filter(field => field === true).length;
  return Math.round((completed / requiredFields.length) * 100);
};

const getCompletionColor = (percentage: number) => {
  if (percentage >= 80) return colorTokens.success;
  if (percentage >= 50) return colorTokens.warning;
  return colorTokens.danger;
};

// ✅ FUNCIÓN PARA FORMATEAR FECHA RELATIVA CON dateUtils
const getRelativeTimeDisplay = (timestamp: string | null | undefined) => {
  if (!timestamp) return 'Sin fecha';
  
  try {
    // Usar formatTimestampForDisplay y extraer solo la parte relativa
    const fullFormat = formatTimestampForDisplay(timestamp);
    
    // Para tabla, mostrar formato más corto
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    if (diffInDays < 7) return `Hace ${diffInDays} días`;
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} sem.`;
    if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`;
    
    return `Hace ${Math.floor(diffInDays / 365)} años`;
  } catch {
    return 'Fecha inválida';
  }
};

const UserTableRow = memo<UserTableRowProps>(({ 
  user, 
  onEdit, 
  onDelete, 
  onView 
}) => {
  // ✅ HANDLERS MEMOIZADOS
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(user);
  }, [user, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(user);
  }, [user, onDelete]);

  const handleView = useCallback(() => {
    onView(user);
  }, [user, onView]);

  // ✅ VALORES COMPUTADOS MEMOIZADOS
  const memoizedValues = useMemo(() => ({
    completionPercentage: getCompletionPercentage(user),
    roleColor: getRoleColor(user.rol),
    roleLabel: getRoleLabel(user.rol),
    relativeTime: getRelativeTimeDisplay(user.createdAt)
  }), [user]);

  const completionColor = getCompletionColor(memoizedValues.completionPercentage);

  return (
    <TableRow
      hover
      onClick={handleView}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: `${colorTokens.brand}08`,
          transform: 'scale(1.005)',
          boxShadow: `0 4px 20px ${colorTokens.brand}15`,
        },
        '&:nth-of-type(odd)': {
          bgcolor: `${colorTokens.neutral100}80`,
        },
        '&:nth-of-type(even)': {
          bgcolor: `${colorTokens.neutral200}80`,
        }
      }}
    >
      {/* COLUMNA USUARIO - RESPONSIVE */}
      <TableCell sx={{ minWidth: { xs: 200, sm: 220, md: 240 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={user.profilePictureUrl?.startsWith('http') ? user.profilePictureUrl : undefined}
              sx={{
                width: { xs: 40, sm: 44, md: 48 },
                height: { xs: 40, sm: 44, md: 48 },
                bgcolor: memoizedValues.roleColor,
                color: colorTokens.neutral1200,
                border: `2px solid ${memoizedValues.roleColor}`,
                boxShadow: `0 4px 15px ${memoizedValues.roleColor}30`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                  boxShadow: `0 6px 25px ${memoizedValues.roleColor}50`,
                }
              }}
            >
              {user.firstName?.[0]?.toUpperCase() || '?'}
            </Avatar>
            
            {/* BADGE DE VERIFICACIÓN */}
            {user.fingerprint && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 20,
                  height: 20,
                  bgcolor: colorTokens.brand,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${colorTokens.neutral200}`,
                  boxShadow: `0 2px 8px ${colorTokens.brand}40`
                }}
              >
                <FingerprintIcon sx={{ fontSize: 12, color: colorTokens.black }} />
              </Box>
            )}
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                color: colorTokens.neutral1200,
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
                lineHeight: 1.2,
                mb: 0.5
              }}
            >
              {user.firstName} {user.lastName}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              {getRoleIcon(user.rol)}
              <Typography 
                variant="caption" 
                sx={{ 
                  color: memoizedValues.roleColor,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}
              >
                {memoizedValues.roleLabel}
              </Typography>
              
              {user.isMinor && (
                <Chip
                  label="Menor"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: `${colorTokens.warning}20`,
                    color: colorTokens.warning,
                    border: `1px solid ${colorTokens.warning}40`,
                  }}
                />
              )}
            </Box>
            
            <Typography 
              variant="caption" 
              sx={{ 
                color: colorTokens.neutral900,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {/* ✅ USAR dateUtils CENTRALIZADOS */}
              {memoizedValues.relativeTime}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      
      {/* COLUMNA CONTACTO */}
      <TableCell sx={{ minWidth: 220 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: colorTokens.neutral1200,
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }}
          >
            {user.email}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              color: colorTokens.neutral900,
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}
          >
            {user.whatsapp || 'Sin WhatsApp'}
          </Typography>
          
          {/* BADGES DE ESTADO DE ENVÍO */}
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Chip
              label={user.emailSent ? "Email ✓" : "Email ✗"}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                bgcolor: user.emailSent ? `${colorTokens.success}20` : `${colorTokens.danger}20`,
                color: user.emailSent ? colorTokens.success : colorTokens.danger,
                border: `1px solid ${user.emailSent ? colorTokens.success : colorTokens.danger}40`,
              }}
            />
            <Chip
              label={user.whatsappSent ? "WA ✓" : "WA ✗"}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                bgcolor: user.whatsappSent ? `${colorTokens.success}20` : `${colorTokens.danger}20`,
                color: user.whatsappSent ? colorTokens.success : colorTokens.danger,
                border: `1px solid ${user.whatsappSent ? colorTokens.success : colorTokens.danger}40`,
              }}
            />
          </Box>
        </Box>
      </TableCell>
      
      {/* COLUMNA ROL */}
      <TableCell>
        <Chip
          icon={getRoleIcon(user.rol)}
          label={memoizedValues.roleLabel}
          sx={{
            bgcolor: `${memoizedValues.roleColor}20`,
            color: memoizedValues.roleColor,
            border: `1px solid ${memoizedValues.roleColor}40`,
            fontWeight: 600,
            '& .MuiChip-icon': {
              color: memoizedValues.roleColor
            }
          }}
        />
      </TableCell>
      
      {/* COLUMNA ESTADO */}
      <TableCell>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
              Completitud:
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: completionColor,
                fontWeight: 700,
                fontSize: '0.8rem'
              }}
            >
              {memoizedValues.completionPercentage}%
            </Typography>
          </Box>
          
          {/* PROGRESS BAR VISUAL */}
          <Box
            sx={{
              width: '100%',
              height: 8,
              bgcolor: colorTokens.neutral400,
              borderRadius: 4,
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                width: `${memoizedValues.completionPercentage}%`,
                height: '100%',
                bgcolor: completionColor,
                borderRadius: 4,
                transition: 'all 0.3s ease',
                boxShadow: `0 0 8px ${completionColor}40`
              }}
            />
          </Box>
          
          {/* INDICADORES DE DOCUMENTOS */}
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 0.5 }}>
            {user.profilePictureUrl && (
              <Box sx={{ 
                width: 8, 
                height: 8, 
                bgcolor: colorTokens.success, 
                borderRadius: '50%',
                boxShadow: `0 0 4px ${colorTokens.success}60`
              }} />
            )}
            {user.signatureUrl && (
              <Box sx={{ 
                width: 8, 
                height: 8, 
                bgcolor: colorTokens.info, 
                borderRadius: '50%',
                boxShadow: `0 0 4px ${colorTokens.info}60`
              }} />
            )}
            {user.contractPdfUrl && (
              <Box sx={{ 
                width: 8, 
                height: 8, 
                bgcolor: colorTokens.warning, 
                borderRadius: '50%',
                boxShadow: `0 0 4px ${colorTokens.warning}60`
              }} />
            )}
          </Box>
        </Box>
      </TableCell>
      
      {/* COLUMNA ACCIONES - RESPONSIVE */}
      <TableCell sx={{ textAlign: 'center' }}>
        <ButtonGroup
          variant="outlined"
          size="small"
          sx={{
            '& .MuiButton-root': {
              borderColor: colorTokens.neutral400,
              color: colorTokens.neutral900,
              minWidth: { xs: '32px', sm: '34px', md: '36px' },
              height: { xs: '32px', sm: '34px', md: '36px' },
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px rgba(0,0,0,0.2)`
              }
            }
          }}
        >
          <Tooltip title="Ver detalles completos">
            <Button
              onClick={handleView}
              sx={{
                '&:hover': {
                  borderColor: `${colorTokens.info} !important`,
                  bgcolor: `${colorTokens.info}15 !important`,
                  color: `${colorTokens.info} !important`
                }
              }}
            >
              <VisibilityIcon sx={{ fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }} />
            </Button>
          </Tooltip>

          <Tooltip title="Editar usuario">
            <Button
              onClick={handleEdit}
              sx={{
                '&:hover': {
                  borderColor: `${colorTokens.warning} !important`,
                  bgcolor: `${colorTokens.warning}15 !important`,
                  color: `${colorTokens.warning} !important`
                }
              }}
            >
              <EditIcon sx={{ fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }} />
            </Button>
          </Tooltip>

          <Tooltip title="Eliminar usuario">
            <Button
              onClick={handleDelete}
              sx={{
                '&:hover': {
                  borderColor: `${colorTokens.danger} !important`,
                  bgcolor: `${colorTokens.danger}15 !important`,
                  color: `${colorTokens.danger} !important`
                }
              }}
            >
              <DeleteIcon sx={{ fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' } }} />
            </Button>
          </Tooltip>
        </ButtonGroup>
      </TableCell>
    </TableRow>
  );
});

UserTableRow.displayName = 'UserTableRow';

export default UserTableRow;