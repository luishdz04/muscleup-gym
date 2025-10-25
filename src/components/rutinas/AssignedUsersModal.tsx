'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  People as PeopleIcon,
  Delete as DeleteIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as ActiveIcon,
  Pause as PausedIcon,
  Done as CompletedIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { showSuccess, showError, showDeleteConfirmation } from '@/lib/notifications/MySwal';
import { formatDateForDisplay } from '@/utils/dateUtils';

interface UserRoutine {
  id: string;
  user_id: string;
  routine_id: string;
  assigned_date: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'paused';
  notes: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assigned_by_user?: {
    firstName: string;
    lastName: string;
  };
}

interface Routine {
  id: string;
  name: string;
}

interface AssignedUsersModalProps {
  open: boolean;
  onClose: () => void;
  routine: Routine | null;
}

export default function AssignedUsersModal({
  open,
  onClose,
  routine
}: AssignedUsersModalProps) {
  const [assignments, setAssignments] = useState<UserRoutine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && routine) {
      fetchAssignments();
    }
  }, [open, routine]);

  const fetchAssignments = async () => {
    if (!routine) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/user-routines?routine_id=${routine.id}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al cargar asignaciones');

      setAssignments(data.userRoutines || []);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      showError('Error al cargar usuarios asignados');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (assignmentId: string, userName: string) => {
    const confirmed = await showDeleteConfirmation(
      '¿Desasignar rutina?',
      `¿Estás seguro de que deseas desasignar esta rutina de ${userName}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/user-routines/${assignmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al desasignar rutina');
      }

      showSuccess('Rutina desasignada exitosamente');
      fetchAssignments(); // Refresh list
    } catch (err: any) {
      console.error('Error unassigning routine:', err);
      showError(err.message || 'Error al desasignar rutina');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ActiveIcon sx={{ fontSize: 16 }} />;
      case 'paused':
        return <PausedIcon sx={{ fontSize: 16 }} />;
      case 'completed':
        return <CompletedIcon sx={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colorTokens.success;
      case 'paused':
        return colorTokens.warning;
      case 'completed':
        return colorTokens.info;
      default:
        return colorTokens.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'paused':
        return 'Pausada';
      case 'completed':
        return 'Completada';
      default:
        return status;
    }
  };

  if (!routine) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colorTokens.neutral300,
          backgroundImage: 'none',
          borderRadius: 2,
          border: `1px solid ${colorTokens.border}`
        }
      }}
    >
      {/* HEADER */}
      <DialogTitle
        sx={{
          bgcolor: colorTokens.neutral200,
          color: colorTokens.textPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${colorTokens.border}`,
          py: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ color: colorTokens.brand }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colorTokens.textPrimary }}>
              Usuarios Asignados
            </Typography>
            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
              {routine.name}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: colorTokens.textSecondary }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* CONTENT */}
      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
          </Box>
        ) : assignments.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              bgcolor: colorTokens.info + '15',
              color: colorTokens.info,
              '& .MuiAlert-icon': { color: colorTokens.info }
            }}
          >
            No hay usuarios con esta rutina asignada actualmente.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: colorTokens.neutral200,
                    '& th': {
                      color: colorTokens.textSecondary,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: `1px solid ${colorTokens.border}`
                    }
                  }}
                >
                  <TableCell>Usuario</TableCell>
                  <TableCell>Inicio</TableCell>
                  <TableCell>Fin</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow
                    key={assignment.id}
                    sx={{
                      '&:hover': { bgcolor: colorTokens.neutral200 },
                      '& td': {
                        color: colorTokens.textPrimary,
                        borderBottom: `1px solid ${colorTokens.border}`
                      }
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {assignment.user.firstName} {assignment.user.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          {assignment.user.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16, color: colorTokens.textSecondary }} />
                        <Typography variant="body2">
                          {formatDateForDisplay(assignment.start_date)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {assignment.end_date ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon sx={{ fontSize: 16, color: colorTokens.textSecondary }} />
                          <Typography variant="body2">
                            {formatDateForDisplay(assignment.end_date)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                          Sin fecha
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(assignment.status)}
                        label={getStatusLabel(assignment.status)}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(assignment.status) + '20',
                          color: getStatusColor(assignment.status),
                          border: 'none',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Desasignar rutina">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleUnassign(
                              assignment.id,
                              `${assignment.user.firstName} ${assignment.user.lastName}`
                            )
                          }
                          sx={{
                            color: colorTokens.danger,
                            '&:hover': { bgcolor: colorTokens.danger + '20' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      {/* ACTIONS */}
      <DialogActions
        sx={{
          p: 2.5,
          borderTop: `1px solid ${colorTokens.border}`,
          bgcolor: colorTokens.neutral200
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            color: colorTokens.textSecondary,
            '&:hover': { bgcolor: colorTokens.neutral300 }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
