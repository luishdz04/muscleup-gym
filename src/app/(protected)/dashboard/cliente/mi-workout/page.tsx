'use client';

import React, { useState, useEffect } from 'react';
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
  ListItem
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
  CalendarToday as CalendarIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { alpha } from '@mui/material/styles';
import { useHydrated } from '@/hooks/useHydrated';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatDateForDisplay } from '@/utils/dateUtils';

interface Exercise {
  id: string;
  name: string;
  type: string;
  level: string;
  material?: string;
  primary_muscles: string[];
  secondary_muscles?: string[];
  initial_position?: string;
  execution_eccentric?: string;
  execution_isometric?: string;
  execution_concentric?: string;
  common_errors?: string[];
  contraindications?: string[];
  video_url?: string;
  image_url?: string;
  muscle_group?: {
    id: string;
    name: string;
  };
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
  difficulty_level?: string;
  estimated_duration?: number;
  muscle_group_focus?: string;
  routine_exercises: RoutineExercise[];
}

interface UserRoutine {
  id: string;
  user_id: string;
  routine_id: string;
  assigned_by: string;
  assigned_date: string;
  start_date?: string;
  end_date?: string;
  status: string;
  notes?: string;
  routine: Routine;
  assigned_by_user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function MiWorkoutPage() {
  const hydrated = useHydrated();
  const [userRoutines, setUserRoutines] = useState<UserRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);

  useEffect(() => {
    fetchUserRoutines();
  }, []);

  const fetchUserRoutines = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('No hay sesión activa');
        return;
      }

      const response = await fetch(`/api/user-routines?userId=${session.user.id}&status=active`);

      if (!response.ok) {
        throw new Error('Error al cargar rutinas asignadas');
      }

      const data = await response.json();
      setUserRoutines(data.userRoutines || []);
    } catch (err: any) {
      console.error('Error fetching user routines:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShowExerciseDetail = (exercise: RoutineExercise) => {
    setSelectedExercise(exercise);
    setDetailDialog(true);
  };

  const getDifficultyColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'principiante':
        return colorTokens.success;
      case 'intermedio':
        return colorTokens.warning;
      case 'avanzado':
        return colorTokens.danger;
      default:
        return colorTokens.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colorTokens.success;
      case 'completed':
        return colorTokens.info;
      case 'paused':
        return colorTokens.warning;
      default:
        return colorTokens.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'completed':
        return 'Completada';
      case 'paused':
        return 'Pausada';
      default:
        return status;
    }
  };

  if (!hydrated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 1 }}>
            Mi Workout
          </Typography>
          <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
            Rutinas de entrenamiento personalizadas asignadas por tu entrenador
          </Typography>
        </Box>
      </motion.div>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Lista de rutinas asignadas */}
      {userRoutines.length === 0 ? (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          background: alpha(colorTokens.surfaceLevel2, 0.9),
          border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
          borderRadius: 3
        }}>
          <FitnessCenterIcon sx={{ fontSize: 64, color: alpha(colorTokens.brand, 0.3), mb: 2 }} />
          <Typography variant="h6" sx={{ color: colorTokens.textPrimary, mb: 1 }}>
            No tienes rutinas asignadas
          </Typography>
          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
            Tu entrenador aún no te ha asignado ninguna rutina de entrenamiento
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {userRoutines.map((userRoutine, index) => (
            <Grid key={userRoutine.id} size={{ xs: 12 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card sx={{
                  background: alpha(colorTokens.surfaceLevel2, 0.9),
                  border: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: colorTokens.brand,
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(colorTokens.brand, 0.2)}`
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    {/* Header de la rutina */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 1 }}>
                          {userRoutine.routine.name}
                        </Typography>
                        {userRoutine.routine.description && (
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                            {userRoutine.routine.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          <Chip
                            label={getStatusLabel(userRoutine.status)}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(userRoutine.status), 0.15),
                              color: getStatusColor(userRoutine.status),
                              fontWeight: 600
                            }}
                          />
                          {userRoutine.routine.difficulty_level && (
                            <Chip
                              label={userRoutine.routine.difficulty_level}
                              size="small"
                              sx={{
                                bgcolor: alpha(getDifficultyColor(userRoutine.routine.difficulty_level), 0.15),
                                color: getDifficultyColor(userRoutine.routine.difficulty_level),
                                fontWeight: 600
                              }}
                            />
                          )}
                          {userRoutine.routine.estimated_duration && (
                            <Chip
                              icon={<TimerIcon />}
                              label={`${userRoutine.routine.estimated_duration} min`}
                              size="small"
                              sx={{ bgcolor: alpha(colorTokens.info, 0.15), color: colorTokens.info }}
                            />
                          )}
                          {userRoutine.routine.muscle_group_focus && (
                            <Chip
                              label={userRoutine.routine.muscle_group_focus}
                              size="small"
                              sx={{ bgcolor: alpha(colorTokens.brand, 0.15), color: colorTokens.brand, fontWeight: 600 }}
                            />
                          )}
                        </Box>

                        {/* Info de asignación */}
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          {userRoutine.assigned_by_user && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 16, color: colorTokens.textSecondary }} />
                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                Asignado por: {userRoutine.assigned_by_user.firstName} {userRoutine.assigned_by_user.lastName}
                              </Typography>
                            </Box>
                          )}
                          {userRoutine.start_date && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: colorTokens.textSecondary }} />
                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                Inicio: {formatDateForDisplay(userRoutine.start_date)}
                              </Typography>
                            </Box>
                          )}
                          {userRoutine.end_date && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: colorTokens.textSecondary }} />
                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                Fin: {formatDateForDisplay(userRoutine.end_date)}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {userRoutine.notes && (
                          <Alert severity="info" sx={{ mt: 2, bgcolor: alpha(colorTokens.info, 0.1) }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                              Notas del entrenador:
                            </Typography>
                            <Typography variant="body2">
                              {userRoutine.notes}
                            </Typography>
                          </Alert>
                        )}
                      </Box>

                      <IconButton
                        onClick={() => setExpandedRoutine(expandedRoutine === userRoutine.id ? null : userRoutine.id)}
                        sx={{ color: colorTokens.brand }}
                      >
                        {expandedRoutine === userRoutine.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Lista de ejercicios (colapsable) */}
                    <Collapse in={expandedRoutine === userRoutine.id}>
                      <Divider sx={{ my: 2, borderColor: alpha(colorTokens.brand, 0.1) }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 2 }}>
                        Ejercicios ({userRoutine.routine.routine_exercises.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {userRoutine.routine.routine_exercises.map((exercise, idx) => (
                          <Paper
                            key={exercise.id}
                            onClick={() => handleShowExerciseDetail(exercise)}
                            sx={{
                              p: 2,
                              bgcolor: alpha(colorTokens.surfaceLevel1, 0.5),
                              border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                              borderRadius: 2,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(colorTokens.brand, 0.05),
                                borderColor: colorTokens.brand,
                                transform: 'translateX(4px)'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Box sx={{
                                minWidth: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: alpha(colorTokens.brand, 0.15),
                                color: colorTokens.brand,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.875rem'
                              }}>
                                {idx + 1}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colorTokens.textPrimary, mb: 0.5 }}>
                                  {exercise.exercise.name}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={`${exercise.sets} series`}
                                    size="small"
                                    sx={{ bgcolor: alpha(colorTokens.info, 0.15), color: colorTokens.info, fontSize: '0.75rem' }}
                                  />
                                  <Chip
                                    label={`${exercise.reps} reps`}
                                    size="small"
                                    sx={{ bgcolor: alpha(colorTokens.success, 0.15), color: colorTokens.success, fontSize: '0.75rem' }}
                                  />
                                  <Chip
                                    label={`${exercise.rest_seconds}s descanso`}
                                    size="small"
                                    sx={{ bgcolor: alpha(colorTokens.warning, 0.15), color: colorTokens.warning, fontSize: '0.75rem' }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de detalle del ejercicio */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colorTokens.surfaceLevel1,
            backgroundImage: 'none',
            borderRadius: 3,
            border: `1px solid ${alpha(colorTokens.brand, 0.2)}`
          }
        }}
      >
        {selectedExercise && (
          <>
            <DialogTitle sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
              pb: 2
            }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 1.5 }}>
                  {selectedExercise.exercise.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                  <Chip label={`${selectedExercise.sets} sets`} sx={{ bgcolor: alpha(colorTokens.info, 0.15), color: colorTokens.info, fontWeight: 600 }} />
                  <Chip label={`${selectedExercise.reps} reps`} sx={{ bgcolor: alpha(colorTokens.success, 0.15), color: colorTokens.success, fontWeight: 600 }} />
                  <Chip label={`${selectedExercise.rest_seconds}s descanso`} sx={{ bgcolor: alpha(colorTokens.warning, 0.15), color: colorTokens.warning, fontWeight: 600 }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={selectedExercise.exercise.level} size="small" sx={{ bgcolor: alpha(getDifficultyColor(selectedExercise.exercise.level), 0.15), color: getDifficultyColor(selectedExercise.exercise.level), fontWeight: 600 }} />
                  <Chip label={selectedExercise.exercise.type} size="small" sx={{ bgcolor: alpha(colorTokens.info, 0.1), color: colorTokens.info }} />
                  {selectedExercise.exercise.muscle_group && (
                    <Chip label={selectedExercise.exercise.muscle_group.name} size="small" sx={{ bgcolor: alpha(colorTokens.brand, 0.15), color: colorTokens.brand, fontWeight: 600 }} />
                  )}
                  {selectedExercise.exercise.material && (
                    <Chip label={`Material: ${selectedExercise.exercise.material}`} size="small" sx={{ bgcolor: alpha(colorTokens.textSecondary, 0.1), color: colorTokens.textSecondary }} />
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
                  <Box sx={{ p: 2.5, bgcolor: alpha(colorTokens.brand, 0.05), borderRadius: 2 }}>
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
                  <Box sx={{ p: 2.5, bgcolor: alpha(colorTokens.success, 0.05), borderRadius: 2 }}>
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
                  <Box sx={{ p: 2.5, bgcolor: alpha(colorTokens.info, 0.05), borderRadius: 2 }}>
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
                        bgcolor: alpha(colorTokens.warning, 0.05),
                        border: `1px solid ${alpha(colorTokens.warning, 0.2)}`,
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
                        bgcolor: alpha(colorTokens.danger, 0.05),
                        border: `1px solid ${alpha(colorTokens.danger, 0.2)}`,
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
                    <Box sx={{ p: 2.5, bgcolor: alpha(colorTokens.brand, 0.05), borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.brand, mb: 2 }}>
                        Recursos
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {selectedExercise.exercise.video_url && (
                          <Button
                            variant="contained"
                            startIcon={<PlayIcon />}
                            onClick={() => window.open(selectedExercise.exercise.video_url, '_blank')}
                            sx={{ bgcolor: colorTokens.info, color: '#fff' }}
                          >
                            Ver Video
                          </Button>
                        )}
                        {selectedExercise.exercise.image_url && (
                          <Button
                            variant="outlined"
                            startIcon={<ImageIcon />}
                            onClick={() => window.open(selectedExercise.exercise.image_url, '_blank')}
                            sx={{ borderColor: colorTokens.success, color: colorTokens.success }}
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

            <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(colorTokens.brand, 0.1)}` }}>
              <Button
                onClick={() => setDetailDialog(false)}
                variant="contained"
                sx={{
                  bgcolor: colorTokens.brand,
                  color: '#000',
                  fontWeight: 600,
                  '&:hover': { bgcolor: colorTokens.brandHover }
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
