'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Autocomplete,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  CalendarMonth as CalendarIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { showSuccess, showError } from '@/lib/notifications/MySwal';
import { formatDateForDisplay } from '@/utils/dateUtils';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp?: string;
}

interface Routine {
  id: string;
  name: string;
  difficulty_level: string;
  estimated_duration: number;
  is_public: boolean;
}

interface AssignRoutineModalProps {
  open: boolean;
  onClose: () => void;
  routine: Routine | null;
  onAssigned?: () => void;
}

export default function AssignRoutineModal({
  open,
  onClose,
  routine,
  onAssigned
}: AssignRoutineModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState('');

  // Cargar lista de usuarios (solo clientes)
  useEffect(() => {
    if (open) {
      fetchUsers();
      // Set fecha de inicio por defecto a hoy
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      // Set fecha de fin por defecto a 1 mes después
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      setEndDate(oneMonthLater.toISOString().split('T')[0]);
    } else {
      // Reset form cuando se cierra
      setSelectedUser(null);
      setStartDate('');
      setEndDate('');
      setNotes('');
      setError('');
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('/api/admin/users?rol=cliente&limit=1000');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al cargar usuarios');

      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      showError('Error al cargar la lista de usuarios');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssign = async () => {
    // Validaciones
    if (!selectedUser) {
      setError('Por favor selecciona un usuario');
      return;
    }

    if (!startDate) {
      setError('Por favor selecciona una fecha de inicio');
      return;
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/user-routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          routine_id: routine?.id,
          start_date: startDate,
          end_date: endDate || null,
          notes: notes.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al asignar rutina');
      }

      showSuccess(
        `Rutina asignada exitosamente a ${selectedUser.firstName} ${selectedUser.lastName}`,
        'Asignación Exitosa'
      );

      onAssigned?.();
      onClose();
    } catch (err: any) {
      console.error('Error assigning routine:', err);
      setError(err.message || 'Error al asignar rutina');
      showError(err.message || 'Error al asignar rutina');
    } finally {
      setLoading(false);
    }
  };

  if (!routine) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          <PersonAddIcon sx={{ color: colorTokens.brand }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colorTokens.textPrimary }}>
              Asignar Rutina a Usuario
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
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Información de la Rutina */}
          <Box
            sx={{
              p: 2,
              bgcolor: colorTokens.neutral200,
              borderRadius: 1,
              border: `1px solid ${colorTokens.border}`
            }}
          >
            <Typography variant="subtitle2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
              Detalles de la Rutina
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={routine.difficulty_level}
                size="small"
                sx={{
                  bgcolor:
                    routine.difficulty_level === 'Principiante'
                      ? colorTokens.success + '20'
                      : routine.difficulty_level === 'Intermedio'
                      ? colorTokens.warning + '20'
                      : colorTokens.danger + '20',
                  color:
                    routine.difficulty_level === 'Principiante'
                      ? colorTokens.success
                      : routine.difficulty_level === 'Intermedio'
                      ? colorTokens.warning
                      : colorTokens.danger,
                  border: 'none'
                }}
              />
              <Chip
                label={`${routine.estimated_duration} min`}
                size="small"
                sx={{
                  bgcolor: colorTokens.info + '20',
                  color: colorTokens.info,
                  border: 'none'
                }}
              />
              <Chip
                label={routine.is_public ? 'Rutina General' : 'Rutina Personalizada'}
                size="small"
                sx={{
                  bgcolor: routine.is_public ? colorTokens.success + '20' : colorTokens.warning + '20',
                  color: routine.is_public ? colorTokens.success : colorTokens.warning,
                  border: 'none'
                }}
              />
            </Stack>
          </Box>

          <Divider sx={{ borderColor: colorTokens.border }} />

          {/* Error Message */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError('')}
              sx={{
                bgcolor: colorTokens.danger + '15',
                color: colorTokens.danger,
                '& .MuiAlert-icon': { color: colorTokens.danger }
              }}
            >
              {error}
            </Alert>
          )}

          {/* Selector de Usuario */}
          <Autocomplete
            options={users}
            getOptionLabel={(option) =>
              `${option.firstName} ${option.lastName} - ${option.email}`
            }
            value={selectedUser}
            onChange={(_, newValue) => {
              setSelectedUser(newValue);
              setError('');
            }}
            loading={loadingUsers}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Seleccionar Usuario"
                placeholder="Buscar por nombre o email..."
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingUsers ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    color: colorTokens.textPrimary,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputLabel-root': {
                    color: colorTokens.textSecondary,
                    '&.Mui-focused': { color: colorTokens.brand }
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                    {option.email}
                  </Typography>
                </Box>
              </li>
            )}
            noOptionsText="No se encontraron usuarios"
            sx={{
              '& .MuiAutocomplete-popupIndicator': { color: colorTokens.textSecondary },
              '& .MuiAutocomplete-clearIndicator': { color: colorTokens.textSecondary }
            }}
          />

          {/* Fechas */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              type="date"
              label="Fecha de Inicio"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <CalendarIcon sx={{ mr: 1, color: colorTokens.brand }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colorTokens.neutral200,
                  color: colorTokens.textPrimary,
                  '& fieldset': { borderColor: colorTokens.border },
                  '&:hover fieldset': { borderColor: colorTokens.brand },
                  '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                },
                '& .MuiInputLabel-root': {
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': { color: colorTokens.brand }
                }
              }}
            />

            <TextField
              type="date"
              label="Fecha de Fin (Opcional)"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <CalendarIcon sx={{ mr: 1, color: colorTokens.info }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colorTokens.neutral200,
                  color: colorTokens.textPrimary,
                  '& fieldset': { borderColor: colorTokens.border },
                  '&:hover fieldset': { borderColor: colorTokens.brand },
                  '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                },
                '& .MuiInputLabel-root': {
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': { color: colorTokens.brand }
                }
              }}
            />
          </Box>

          {/* Notas */}
          <TextField
            label="Notas (Opcional)"
            placeholder="Instrucciones especiales, recomendaciones, etc."
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <NotesIcon sx={{ mr: 1, mt: 1, alignSelf: 'flex-start', color: colorTokens.textSecondary }} />
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: colorTokens.neutral200,
                color: colorTokens.textPrimary,
                '& fieldset': { borderColor: colorTokens.border },
                '&:hover fieldset': { borderColor: colorTokens.brand },
                '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
              },
              '& .MuiInputLabel-root': {
                color: colorTokens.textSecondary,
                '&.Mui-focused': { color: colorTokens.brand }
              }
            }}
          />
        </Stack>
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
          disabled={loading}
          sx={{
            color: colorTokens.textSecondary,
            '&:hover': { bgcolor: colorTokens.neutral300 }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={loading || !selectedUser}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
          sx={{
            bgcolor: colorTokens.brand,
            color: '#000',
            fontWeight: 600,
            '&:hover': { bgcolor: colorTokens.brandHover },
            '&:disabled': {
              bgcolor: colorTokens.neutral300,
              color: colorTokens.textMuted
            }
          }}
        >
          {loading ? 'Asignando...' : 'Asignar Rutina'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
