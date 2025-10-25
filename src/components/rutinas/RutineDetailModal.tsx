'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Divider,
  Stack,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  FitnessCenter as FitnessCenterIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Timer as TimerIcon,
  Repeat as RepeatIcon,
  SelfImprovement as RestIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { motion } from 'framer-motion';

interface Exercise {
  name: string;
  type: string;
  level: string;
  material: string;
  primary_muscles: string[];
  secondary_muscles: string[];
}

interface RoutineExercise {
  id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  exercise: Exercise;
}

interface Routine {
  id: string;
  name: string;
  description?: string;
  difficulty_level: string;
  estimated_duration: number;
  muscle_group_focus?: string;
  is_public: boolean;
  routine_exercises: RoutineExercise[];
  created_at: string;
}

interface Props {
  open: boolean;
  routine: Routine | null;
  onClose: () => void;
  onDuplicate?: (routineId: string) => void;
}

export default function RutineDetailModal({ open, routine, onClose, onDuplicate }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  if (!routine) return null;

  const getDifficultyColor = (level: string) => {
    if (level?.toLowerCase().includes('principiante')) return colorTokens.success;
    if (level?.toLowerCase().includes('avanzado')) return colorTokens.danger;
    return colorTokens.warning;
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/routines/${routine.id}/pdf`);

      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rutina-${routine.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error al descargar el PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!onDuplicate) return;

    try {
      setDuplicating(true);
      await onDuplicate(routine.id);
      onClose();
    } catch (error) {
      console.error('Error duplicating routine:', error);
      alert('Error al duplicar la rutina');
    } finally {
      setDuplicating(false);
    }
  };

  const sortedExercises = [...routine.routine_exercises].sort((a, b) => a.order_index - b.order_index);
  const totalExercises = sortedExercises.length;
  const totalSets = sortedExercises.reduce((sum, ex) => sum + ex.sets, 0);
  const avgRestTime = sortedExercises.length > 0
    ? Math.round(sortedExercises.reduce((sum, ex) => sum + ex.rest_seconds, 0) / sortedExercises.length)
    : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: colorTokens.neutral300,
            border: `1px solid ${colorTokens.border}`,
            backgroundImage: 'none',
            maxHeight: '90vh'
          }
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: `1px solid ${colorTokens.border}`, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography variant="h5" sx={{ color: colorTokens.textPrimary, fontWeight: 700, mb: 1 }}>
              {routine.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={routine.is_public ? 'RUTINA GENERAL' : 'RUTINA PERSONALIZADA'}
                size="small"
                sx={{
                  bgcolor: routine.is_public ? `${colorTokens.success}20` : `${colorTokens.warning}20`,
                  color: routine.is_public ? colorTokens.success : colorTokens.warning,
                  fontWeight: 700
                }}
              />
              <Chip
                label={routine.difficulty_level}
                size="small"
                sx={{
                  bgcolor: `${getDifficultyColor(routine.difficulty_level)}20`,
                  color: getDifficultyColor(routine.difficulty_level),
                  fontWeight: 600
                }}
              />
              {routine.muscle_group_focus && (
                <Chip
                  icon={<FitnessCenterIcon sx={{ fontSize: 14 }} />}
                  label={routine.muscle_group_focus}
                  size="small"
                  sx={{
                    bgcolor: `${colorTokens.info}20`,
                    color: colorTokens.info,
                    fontWeight: 600
                  }}
                />
              )}
              <Chip
                icon={<TimerIcon sx={{ fontSize: 14 }} />}
                label={`${routine.estimated_duration || 0} min`}
                size="small"
                sx={{
                  bgcolor: `${colorTokens.brand}20`,
                  color: colorTokens.brand,
                  fontWeight: 600
                }}
              />
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: colorTokens.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Description */}
          {routine.description && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: colorTokens.textSecondary, mb: 1, fontWeight: 600 }}>
                Descripción:
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                {routine.description}
              </Typography>
            </Box>
          )}

          {/* Quick Stats */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box
              sx={{
                flex: 1,
                minWidth: 150,
                p: 2,
                borderRadius: 1,
                bgcolor: `${colorTokens.brand}15`,
                border: `1px solid ${colorTokens.brand}30`
              }}
            >
              <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 600 }}>
                Total Ejercicios
              </Typography>
              <Typography variant="h4" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                {totalExercises}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                minWidth: 150,
                p: 2,
                borderRadius: 1,
                bgcolor: `${colorTokens.success}15`,
                border: `1px solid ${colorTokens.success}30`
              }}
            >
              <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 600 }}>
                Total Sets
              </Typography>
              <Typography variant="h4" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                {totalSets}
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                minWidth: 150,
                p: 2,
                borderRadius: 1,
                bgcolor: `${colorTokens.info}15`,
                border: `1px solid ${colorTokens.info}30`
              }}
            >
              <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 600 }}>
                Descanso Promedio
              </Typography>
              <Typography variant="h4" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                {avgRestTime}s
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: colorTokens.border }} />

          {/* Exercises Table */}
          <Box>
            <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700, mb: 2 }}>
              Ejercicios de la Rutina
            </Typography>

            {sortedExercises.length === 0 ? (
              <Alert severity="info" sx={{ bgcolor: `${colorTokens.info}20`, color: colorTokens.textPrimary }}>
                Esta rutina no tiene ejercicios asignados
              </Alert>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  bgcolor: colorTokens.neutral200,
                  border: `1px solid ${colorTokens.border}`,
                  backgroundImage: 'none'
                }}
              >
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: colorTokens.neutral300 }}>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, width: 40 }}>
                        #
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                        Ejercicio
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, width: 80 }} align="center">
                        Sets
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, width: 100 }} align="center">
                        Reps
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, width: 100 }} align="center">
                        Descanso
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700, width: 120 }}>
                        Tipo
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedExercises.map((routineExercise, index) => (
                      <React.Fragment key={routineExercise.id}>
                        <TableRow
                          sx={{
                            '&:nth-of-type(odd)': { bgcolor: colorTokens.neutral200 },
                            '&:nth-of-type(even)': { bgcolor: colorTokens.neutral300 }
                          }}
                        >
                          <TableCell sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                {routineExercise.exercise.name}
                              </Typography>
                              {routineExercise.exercise.material && (
                                <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                                  Material: {routineExercise.exercise.material}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <RepeatIcon sx={{ fontSize: 16, color: colorTokens.success }} />
                              <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                {routineExercise.sets}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                              {routineExercise.reps}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <RestIcon sx={{ fontSize: 16, color: colorTokens.info }} />
                              <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                {routineExercise.rest_seconds}s
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={routineExercise.exercise.type}
                              size="small"
                              sx={{
                                bgcolor: `${colorTokens.warning}20`,
                                color: colorTokens.warning,
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                        {routineExercise.notes && (
                          <TableRow
                            sx={{
                              '&:nth-of-type(odd)': { bgcolor: colorTokens.neutral200 },
                              '&:nth-of-type(even)': { bgcolor: colorTokens.neutral300 }
                            }}
                          >
                            <TableCell colSpan={6} sx={{ pt: 0, pb: 2 }}>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  bgcolor: `${colorTokens.brand}10`,
                                  border: `1px solid ${colorTokens.brand}30`
                                }}
                              >
                                <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 700 }}>
                                  📝 Nota:
                                </Typography>
                                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mt: 0.5 }}>
                                  {routineExercise.notes}
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Divider sx={{ borderColor: colorTokens.border }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleDownloadPDF}
              disabled={downloading}
              sx={{
                bgcolor: colorTokens.brand,
                color: colorTokens.neutral300,
                fontWeight: 700,
                '&:hover': {
                  bgcolor: colorTokens.warning
                },
                '&:disabled': {
                  bgcolor: colorTokens.neutral400,
                  color: colorTokens.textMuted
                }
              }}
            >
              {downloading ? 'Generando PDF...' : 'Descargar PDF Enterprise'}
            </Button>

            {onDuplicate && (
              <Button
                variant="outlined"
                startIcon={duplicating ? <CircularProgress size={16} /> : <CopyIcon />}
                onClick={handleDuplicate}
                disabled={duplicating}
                sx={{
                  borderColor: colorTokens.info,
                  color: colorTokens.info,
                  fontWeight: 700,
                  '&:hover': {
                    borderColor: colorTokens.info,
                    bgcolor: `${colorTokens.info}20`
                  },
                  '&:disabled': {
                    borderColor: colorTokens.neutral400,
                    color: colorTokens.textMuted
                  }
                }}
              >
                {duplicating ? 'Duplicando...' : 'Duplicar Rutina'}
              </Button>
            )}
          </Box>

          {/* Tips */}
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: `${colorTokens.success}10`,
              border: `1px solid ${colorTokens.success}30`
            }}
          >
            <Typography variant="subtitle2" sx={{ color: colorTokens.success, fontWeight: 700, mb: 1 }}>
              💡 Consejos Profesionales
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="caption" sx={{ color: colorTokens.textSecondary, mb: 0.5 }}>
                Realiza un calentamiento de 5-10 minutos antes de comenzar
              </Typography>
              <Typography component="li" variant="caption" sx={{ color: colorTokens.textSecondary, mb: 0.5 }}>
                Mantén una técnica correcta en cada ejercicio
              </Typography>
              <Typography component="li" variant="caption" sx={{ color: colorTokens.textSecondary, mb: 0.5 }}>
                Respeta los tiempos de descanso indicados
              </Typography>
              <Typography component="li" variant="caption" sx={{ color: colorTokens.textSecondary }}>
                Hidrátate adecuadamente durante la sesión
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
