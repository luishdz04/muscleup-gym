'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  FitnessCenter as FitnessCenterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Timer as TimerIcon,
  Close as CloseIcon,
  PlayCircle as PlayIcon,
  Image as ImageIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { motion, AnimatePresence } from 'framer-motion';
import { RutineFilters, RutineStatsCards, type RutineFiltersState } from '@/components/cliente/rutinas';

interface Exercise {
  id: string;
  name: string;
  type: string;
  level: string;
  material: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  initial_position: string;
  execution_eccentric: string;
  execution_isometric?: string;
  execution_concentric: string;
  common_errors: string[];
  contraindications: string[];
  video_url?: string;
  image_url?: string;
  muscle_group?: { id: string; name: string } | null;
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
  estimated_duration?: number;
  muscle_group_focus?: string;
  routine_exercises: RoutineExercise[];
}

interface UserRoutine {
  id: string;
  assigned_date: string;
  start_date: string;
  end_date?: string;
  status: string;
  notes?: string;
  routine: Routine;
  assigned_by_user?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  is_public_routine?: boolean; // Flag para identificar rutinas públicas generales
}

export default function RutinasCliente() {
  const hydrated = useHydrated();
  const [routines, setRoutines] = useState<UserRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RutineFiltersState>({
    search: '',
    difficultyLevel: '',
    status: '',
    muscleGroup: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);

  useEffect(() => {
    if (hydrated) {
      loadRoutines();
    }
  }, [hydrated]);

  const loadRoutines = async () => {
    try {
      setLoading(true);

      // Cargar rutinas asignadas al usuario (obtiene userId del contexto de sesión)
      const response = await fetch('/api/user-routines');
      if (!response.ok) throw new Error('Error al cargar rutinas');

      const data = await response.json();
      setRoutines(data.userRoutines || []);
      setError(null);
    } catch (err) {
      console.error('Error loading routines:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar rutinas
  const filteredRoutines = useMemo(() => {
    return routines.filter((userRoutine) => {
      const routine = userRoutine.routine;

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = routine.name.toLowerCase().includes(searchLower);
        const matchesDescription = routine.description?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) return false;
      }

      // Difficulty filter
      if (filters.difficultyLevel && routine.difficulty_level !== filters.difficultyLevel) {
        return false;
      }

      // Status filter
      if (filters.status && userRoutine.status !== filters.status) {
        return false;
      }

      // Muscle group filter
      if (filters.muscleGroup && routine.muscle_group_focus !== filters.muscleGroup) {
        return false;
      }

      return true;
    });
  }, [routines, filters]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalExercises = routines.reduce((sum, ur) => {
      return sum + (ur.routine.routine_exercises?.length || 0);
    }, 0);

    const generalRoutines = routines.filter(ur => ur.is_public_routine).length;
    const personalizedRoutines = routines.filter(ur => !ur.is_public_routine).length;

    return {
      totalRoutines: routines.length,
      activeRoutines: routines.filter(ur => ur.status === 'active').length,
      completedRoutines: routines.filter(ur => ur.status === 'completed').length,
      totalExercises,
      generalRoutines,
      personalizedRoutines
    };
  }, [routines]);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      difficultyLevel: '',
      status: '',
      muscleGroup: ''
    });
  };

  const handleShowExerciseDetail = (exercise: RoutineExercise) => {
    setSelectedExercise(exercise);
    setDetailDialog(true);
  };

  const getDifficultyColor = (level: string) => {
    if (level.includes('Principiante')) return colorTokens.success;
    if (level.includes('Intermedio')) return colorTokens.warning;
    if (level.includes('Avanzado')) return colorTokens.danger;
    return colorTokens.info;
  };

  if (!hydrated || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: { xs: 10, lg: 4 } }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ mb: 1 }}>
            <Typography
              component="h3"
              sx={{
                fontWeight: 800,
                color: colorTokens.textPrimary,
                fontSize: { xs: '1.75rem', sm: '2.5rem' },
                display: 'inline'
              }}
            >
              Mis{' '}
            </Typography>
            <Typography
              component="span"
              sx={{
                fontWeight: 800,
                color: colorTokens.brand,
                fontSize: { xs: '1.75rem', sm: '2.5rem' }
              }}
            >
              Rutinas
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
            Rutinas generales y personalizadas disponibles para ti
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Cards */}
      <RutineStatsCards stats={stats} loading={loading} />

      {/* Filters */}
      <RutineFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Lista de rutinas asignadas */}
      {filteredRoutines.length === 0 ? (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          bgcolor: colorTokens.neutral300,
          border: `1px solid ${colorTokens.border}`,
          borderRadius: 3
        }}>
          <FitnessCenterIcon sx={{ fontSize: 80, color: colorTokens.textMuted, mb: 2 }} />
          <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
            {routines.length === 0 ? 'No hay rutinas disponibles' : 'No hay rutinas que coincidan con los filtros'}
          </Typography>
          <Typography variant="body2" sx={{ color: colorTokens.textMuted, mt: 1 }}>
            {routines.length === 0
              ? 'Actualmente no hay rutinas generales ni personalizadas disponibles. Consulta con tu entrenador.'
              : 'Intenta ajustar los filtros para ver más resultados'
            }
          </Typography>
        </Paper>
      ) : (
        <AnimatePresence mode="popLayout">
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {filteredRoutines.map((userRoutine, index) => {
              const routine = userRoutine.routine;
              const isExpanded = expandedRoutine === userRoutine.id;

              return (
                <Grid key={userRoutine.id} size={{ xs: 12 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card
                      sx={{
                        bgcolor: colorTokens.neutral300,
                        border: `1px solid ${colorTokens.border}`,
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: colorTokens.brand,
                          boxShadow: `0 8px 24px ${colorTokens.brand}15`
                        }
                      }}
                    >
                    <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
                      {/* Header de la rutina */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: colorTokens.textPrimary,
                              mb: 1,
                              fontSize: { xs: '1.25rem', sm: '1.5rem' }
                            }}
                          >
                            {routine.name}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                            {/* Indicador de rutina general o personalizada */}
                            {userRoutine.is_public_routine ? (
                              <Chip
                                label="Rutina General"
                                size="small"
                                icon={<PeopleIcon sx={{ fontSize: 14 }} />}
                                sx={{
                                  bgcolor: colorTokens.brand + '20',
                                  color: colorTokens.brand,
                                  fontWeight: 700,
                                  border: `1px solid ${colorTokens.brand}40`
                                }}
                              />
                            ) : (
                              <Chip
                                label="Rutina Personalizada"
                                size="small"
                                icon={<PersonIcon sx={{ fontSize: 14 }} />}
                                sx={{
                                  bgcolor: colorTokens.warning + '20',
                                  color: colorTokens.warning,
                                  fontWeight: 700,
                                  border: `1px solid ${colorTokens.warning}40`
                                }}
                              />
                            )}

                            {/* Status Chip */}
                            <Chip
                              label={
                                userRoutine.status === 'active' ? 'Activa' :
                                userRoutine.status === 'completed' ? 'Completada' :
                                userRoutine.status === 'paused' ? 'Pausada' : userRoutine.status
                              }
                              size="small"
                              sx={{
                                bgcolor:
                                  userRoutine.status === 'active' ? colorTokens.success + '20' :
                                  userRoutine.status === 'completed' ? colorTokens.info + '20' :
                                  userRoutine.status === 'paused' ? colorTokens.warning + '20' :
                                  colorTokens.neutral200,
                                color:
                                  userRoutine.status === 'active' ? colorTokens.success :
                                  userRoutine.status === 'completed' ? colorTokens.info :
                                  userRoutine.status === 'paused' ? colorTokens.warning :
                                  colorTokens.textSecondary,
                                fontWeight: 600,
                                border: 'none'
                              }}
                            />

                            {/* Difficulty Chip */}
                            <Chip
                              label={routine.difficulty_level}
                              size="small"
                              sx={{
                                bgcolor: getDifficultyColor(routine.difficulty_level) + '20',
                                color: getDifficultyColor(routine.difficulty_level),
                                fontWeight: 600,
                                border: 'none'
                              }}
                            />

                            {/* Duration Chip */}
                            {routine.estimated_duration && (
                              <Chip
                                icon={<TimerIcon sx={{ fontSize: 16 }} />}
                                label={`${routine.estimated_duration} min`}
                                size="small"
                                sx={{
                                  bgcolor: colorTokens.info + '20',
                                  color: colorTokens.info,
                                  border: 'none'
                                }}
                              />
                            )}

                            {/* Exercises Count Chip */}
                            <Chip
                              label={`${routine.routine_exercises?.length || 0} ejercicios`}
                              size="small"
                              sx={{
                                bgcolor: colorTokens.brand + '20',
                                color: colorTokens.brand,
                                fontWeight: 600,
                                border: 'none'
                              }}
                            />
                          </Box>

                          {routine.description && (
                            <Typography
                              variant="body2"
                              sx={{
                                color: colorTokens.textSecondary,
                                mb: 1,
                                fontSize: { xs: '0.875rem', sm: '0.938rem' }
                              }}
                            >
                              {routine.description}
                            </Typography>
                          )}

                          {/* Assignment Info */}
                          {userRoutine.is_public_routine ? (
                            <Typography
                              variant="caption"
                              sx={{
                                color: colorTokens.textMuted,
                                display: 'block',
                                mt: 0.5,
                                fontStyle: 'italic'
                              }}
                            >
                              Disponible para todos los usuarios
                            </Typography>
                          ) : userRoutine.assigned_by_user && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: colorTokens.textMuted,
                                display: 'block',
                                mt: 0.5
                              }}
                            >
                              Asignada por: {userRoutine.assigned_by_user.firstName} {userRoutine.assigned_by_user.lastName}
                            </Typography>
                          )}
                        </Box>

                        <IconButton
                          onClick={() => setExpandedRoutine(isExpanded ? null : userRoutine.id)}
                          sx={{
                            color: colorTokens.brand,
                            '&:hover': { bgcolor: colorTokens.brand + '15' }
                          }}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>

                      {/* Lista expandible de ejercicios */}
                      <Collapse in={isExpanded}>
                        <Divider sx={{ my: 2, borderColor: colorTokens.border }} />
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: 700,
                            color: colorTokens.brand,
                            mb: 2,
                            fontSize: { xs: '1rem', sm: '1.125rem' }
                          }}
                        >
                          Ejercicios de la Rutina:
                        </Typography>

                        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                          {routine.routine_exercises?.map((routineEx, index) => (
                            <Grid key={routineEx.id} size={{ xs: 12, sm: 6, md: 4 }}>
                              <Paper
                                onClick={() => handleShowExerciseDetail(routineEx)}
                                sx={{
                                  p: { xs: 1.5, sm: 2 },
                                  bgcolor: colorTokens.neutral200,
                                  border: `1px solid ${colorTokens.border}`,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                '&:hover': {
                                  borderColor: colorTokens.brand,
                                  boxShadow: `0 4px 12px ${colorTokens.brand}33`,
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                                <Box sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  background: `linear-gradient(135deg, ${colorTokens.brand}4D, ${colorTokens.brand}1A)`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <Typography variant="subtitle2" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                                    {index + 1}
                                  </Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 0.5 }}>
                                    {routineEx.exercise.name}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {routineEx.exercise.video_url && (
                                      <Chip
                                        icon={<PlayIcon sx={{ fontSize: 12 }} />}
                                        label="Video"
                                        size="small"
                                        sx={{
                                          height: 18,
                                          fontSize: '0.65rem',
                                          bgcolor: colorTokens.info + '26',
                                          color: colorTokens.info,
                                          '& .MuiChip-icon': { color: colorTokens.info }
                                        }}
                                      />
                                    )}
                                    {routineEx.exercise.image_url && (
                                      <Chip
                                        icon={<ImageIcon sx={{ fontSize: 12 }} />}
                                        label="Img"
                                        size="small"
                                        sx={{
                                          height: 18,
                                          fontSize: '0.65rem',
                                          bgcolor: colorTokens.success + '26',
                                          color: colorTokens.success,
                                          '& .MuiChip-icon': { color: colorTokens.success }
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                              </Box>

                              <Box sx={{ display: 'flex', gap: 1.5, mb: 1 }}>
                                <Box>
                                  <Typography variant="caption" sx={{ color: colorTokens.textMuted, display: 'block' }}>
                                    Sets
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                    {routineEx.sets}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: colorTokens.textMuted, display: 'block' }}>
                                    Reps
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                    {routineEx.reps}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" sx={{ color: colorTokens.textMuted, display: 'block' }}>
                                    Descanso
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                                    {routineEx.rest_seconds}s
                                  </Typography>
                                </Box>
                              </Box>

                              {routineEx.notes && (
                                <Typography variant="caption" sx={{ color: colorTokens.textSecondary, fontStyle: 'italic' }}>
                                  {routineEx.notes}
                                </Typography>
                              )}
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Collapse>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
          </Grid>
        </AnimatePresence>
      )}

      {/* Dialog de detalles del ejercicio */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colorTokens.neutral300,
            backgroundImage: 'none',
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        {selectedExercise && (
          <>
            <DialogTitle sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              bgcolor: colorTokens.neutral200,
              borderBottom: `1px solid ${colorTokens.border}`,
              pb: 2
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 1.5 }}>
                  {selectedExercise.exercise.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                  <Chip label={`${selectedExercise.sets} sets`} sx={{ bgcolor: colorTokens.info + '26', color: colorTokens.info, fontWeight: 600 }} />
                  <Chip label={`${selectedExercise.reps} reps`} sx={{ bgcolor: colorTokens.success + '26', color: colorTokens.success, fontWeight: 600 }} />
                  <Chip label={`${selectedExercise.rest_seconds}s descanso`} sx={{ bgcolor: colorTokens.warning + '26', color: colorTokens.warning, fontWeight: 600 }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={selectedExercise.exercise.level} size="small" sx={{ bgcolor: getDifficultyColor(selectedExercise.exercise.level) + '26', color: getDifficultyColor(selectedExercise.exercise.level), fontWeight: 600 }} />
                  <Chip label={selectedExercise.exercise.type} size="small" sx={{ bgcolor: colorTokens.info + '1A', color: colorTokens.info }} />
                  {selectedExercise.exercise.muscle_group && (
                    <Chip label={selectedExercise.exercise.muscle_group.name} size="small" sx={{ bgcolor: colorTokens.brand + '26', color: colorTokens.brand, fontWeight: 600 }} />
                  )}
                  {selectedExercise.exercise.material && (
                    <Chip label={`Material: ${selectedExercise.exercise.material}`} size="small" sx={{ bgcolor: colorTokens.textSecondary + '1A', color: colorTokens.textSecondary }} />
                  )}
                </Box>
              </Box>
              <IconButton onClick={() => setDetailDialog(false)} sx={{ color: colorTokens.textSecondary }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Información General */}
                <Grid size={12}>
                  <Box sx={{
                    p: 2.5,
                    bgcolor: colorTokens.neutral200,
                    border: `1px solid ${colorTokens.border}`,
                    borderRadius: 2
                  }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.brand, mb: 2 }}>
                      Información General
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          <strong>Material necesario:</strong> {selectedExercise.exercise.material || 'No especificado'}
                        </Typography>
                      </Grid>
                      <Grid size={12}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          <strong>Nivel:</strong> {selectedExercise.exercise.level}
                        </Typography>
                      </Grid>
                      <Grid size={12}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          <strong>Músculos primarios:</strong> {selectedExercise.exercise.primary_muscles && selectedExercise.exercise.primary_muscles.length > 0 ? selectedExercise.exercise.primary_muscles.join(', ') : 'No especificado'}
                        </Typography>
                      </Grid>
                      {selectedExercise.exercise.secondary_muscles && selectedExercise.exercise.secondary_muscles.length > 0 && (
                        <Grid size={12}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            <strong>Músculos secundarios:</strong> {selectedExercise.exercise.secondary_muscles.join(', ')}
                          </Typography>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                </Grid>

                {/* Posición inicial */}
                <Grid size={12}>
                  <Box sx={{
                    p: 2.5,
                    bgcolor: colorTokens.neutral200,
                    border: `1px solid ${colorTokens.border}`,
                    borderRadius: 2
                  }}>
                    <Typography variant="subtitle1" sx={{
                      fontWeight: 700,
                      color: colorTokens.success,
                      mb: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <CheckIcon /> Posición Inicial
                    </Typography>
                    <Typography variant="body1" sx={{ color: colorTokens.textPrimary, lineHeight: 1.7 }}>
                      {selectedExercise.exercise.initial_position}
                    </Typography>
                  </Box>
                </Grid>

                {/* Ejecución */}
                <Grid size={12}>
                  <Box sx={{
                    p: 2.5,
                    bgcolor: colorTokens.neutral200,
                    border: `1px solid ${colorTokens.border}`,
                    borderRadius: 2
                  }}>
                    <Typography variant="subtitle1" sx={{
                      fontWeight: 700,
                      color: colorTokens.info,
                      mb: 2
                    }}>
                      Ejecución del Ejercicio
                    </Typography>
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="subtitle2" sx={{ color: colorTokens.textPrimary, fontWeight: 600, mb: 1 }}>
                        1. Fase Excéntrica (Descenso):
                      </Typography>
                      <Typography variant="body1" sx={{ color: colorTokens.textSecondary, lineHeight: 1.7 }}>
                        {selectedExercise.exercise.execution_eccentric}
                      </Typography>
                    </Box>
                    {selectedExercise.exercise.execution_isometric && (
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle2" sx={{ color: colorTokens.textPrimary, fontWeight: 600, mb: 1 }}>
                          2. Fase Isométrica (Transición):
                        </Typography>
                        <Typography variant="body1" sx={{ color: colorTokens.textSecondary, lineHeight: 1.7 }}>
                          {selectedExercise.exercise.execution_isometric}
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: colorTokens.textPrimary, fontWeight: 600, mb: 1 }}>
                        {selectedExercise.exercise.execution_isometric ? '3' : '2'}. Fase Concéntrica (Ascenso):
                      </Typography>
                      <Typography variant="body1" sx={{ color: colorTokens.textSecondary, lineHeight: 1.7 }}>
                        {selectedExercise.exercise.execution_concentric}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Errores comunes */}
                {selectedExercise.exercise.common_errors && selectedExercise.exercise.common_errors.length > 0 && (
                  <Grid size={12}>
                    <Alert
                      severity="warning"
                      icon={<WarningIcon />}
                      sx={{
                        bgcolor: colorTokens.warning + '15',
                        border: `1px solid ${colorTokens.warning}40`,
                        '& .MuiAlert-icon': { color: colorTokens.warning }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{
                        fontWeight: 700,
                        color: colorTokens.warning,
                        mb: 1.5
                      }}>
                        Errores Comunes a Evitar
                      </Typography>
                      <List dense sx={{ pl: 2 }}>
                        {selectedExercise.exercise.common_errors.map((error, idx) => (
                          <ListItem key={idx} sx={{ display: 'list-item', listStyleType: 'disc', p: 0, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                              {error}
                            </Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                  </Grid>
                )}

                {/* Contraindicaciones */}
                {selectedExercise.exercise.contraindications && selectedExercise.exercise.contraindications.length > 0 && (
                  <Grid size={12}>
                    <Alert
                      severity="error"
                      icon={<InfoIcon />}
                      sx={{
                        bgcolor: colorTokens.danger + '15',
                        border: `1px solid ${colorTokens.danger}40`,
                        '& .MuiAlert-icon': { color: colorTokens.danger }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{
                        fontWeight: 700,
                        color: colorTokens.danger,
                        mb: 1.5
                      }}>
                        Contraindicaciones Clínicas
                      </Typography>
                      <List dense sx={{ pl: 2 }}>
                        {selectedExercise.exercise.contraindications.map((contra, idx) => (
                          <ListItem key={idx} sx={{ display: 'list-item', listStyleType: 'disc', p: 0, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                              {contra}
                            </Typography>
                          </ListItem>
                        ))}
                      </List>
                    </Alert>
                  </Grid>
                )}

                {/* Multimedia */}
                {(selectedExercise.exercise.video_url || selectedExercise.exercise.image_url) && (
                  <Grid size={12}>
                    <Box sx={{
                      p: 2.5,
                      bgcolor: colorTokens.neutral200,
                      border: `1px solid ${colorTokens.border}`,
                      borderRadius: 2
                    }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.brand, mb: 2 }}>
                        Recursos
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {selectedExercise.exercise.video_url && (
                          <Button
                            variant="contained"
                            startIcon={<PlayIcon />}
                            onClick={() => window.open(selectedExercise.exercise.video_url, '_blank')}
                            sx={{
                              bgcolor: colorTokens.info,
                              color: '#fff',
                              '&:hover': { bgcolor: colorTokens.info, filter: 'brightness(1.1)' }
                            }}
                          >
                            Ver Video
                          </Button>
                        )}
                        {selectedExercise.exercise.image_url && (
                          <Button
                            variant="outlined"
                            startIcon={<ImageIcon />}
                            onClick={() => window.open(selectedExercise.exercise.image_url, '_blank')}
                            sx={{
                              borderColor: colorTokens.success,
                              color: colorTokens.success,
                              '&:hover': {
                                borderColor: colorTokens.success,
                                bgcolor: colorTokens.success + '15'
                              }
                            }}
                          >
                            Ver Imagen
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </DialogContent>

            <DialogActions sx={{
              p: 3,
              bgcolor: colorTokens.neutral200,
              borderTop: `1px solid ${colorTokens.border}`
            }}>
              <Button
                onClick={() => setDetailDialog(false)}
                variant="contained"
                sx={{
                  bgcolor: colorTokens.brand,
                  color: '#000',
                  fontWeight: 700,
                  px: 4,
                  '&:hover': { bgcolor: colorTokens.brand, filter: 'brightness(1.1)' }
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
