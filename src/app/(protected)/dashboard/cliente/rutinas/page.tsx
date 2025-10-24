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
  Warning as WarningIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { alpha } from '@mui/material/styles';
import { useHydrated } from '@/hooks/useHydrated';
import { motion } from 'framer-motion';

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
}

export default function RutinasCliente() {
  const hydrated = useHydrated();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
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

      // Cargar todas las rutinas públicas/generales
      const response = await fetch('/api/routines');
      if (!response.ok) throw new Error('Error al cargar rutinas');

      const data = await response.json();
      setRoutines(data.routines || []);
      setError(null);
    } catch (err) {
      console.error('Error loading routines:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
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
            Rutinas{' '}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontWeight: 800,
              color: colorTokens.brand,
              fontSize: { xs: '1.75rem', sm: '2.5rem' }
            }}
          >
            Disponibles
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
          Explora las rutinas de entrenamiento disponibles en el gimnasio
        </Typography>
      </Box>

      {/* Lista de rutinas disponibles */}
      {routines.length === 0 ? (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          background: alpha(colorTokens.surfaceLevel2, 0.9),
          border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
          borderRadius: 3
        }}>
          <FitnessCenterIcon sx={{ fontSize: 80, color: colorTokens.textMuted, mb: 2 }} />
          <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
            No hay rutinas disponibles
          </Typography>
          <Typography variant="body2" sx={{ color: colorTokens.textMuted, mt: 1 }}>
            El gimnasio aún no ha creado rutinas de entrenamiento
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {routines.map((routine) => (
            <Grid key={routine.id} size={{ xs: 12 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card sx={{
                  background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
                  border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                  borderRadius: 3
                }}>
                  <CardContent>
                    {/* Header de la rutina */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 1 }}>
                          {routine.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Chip
                            label={routine.difficulty_level}
                            sx={{
                              bgcolor: alpha(getDifficultyColor(routine.difficulty_level), 0.15),
                              color: getDifficultyColor(routine.difficulty_level),
                              fontWeight: 600
                            }}
                          />
                          {routine.estimated_duration && (
                            <Chip
                              icon={<TimerIcon sx={{ fontSize: 16 }} />}
                              label={`${routine.estimated_duration} minutos`}
                              sx={{
                                bgcolor: alpha(colorTokens.info, 0.15),
                                color: colorTokens.info
                              }}
                            />
                          )}
                          <Chip
                            label={`${routine.routine_exercises?.length || 0} ejercicios`}
                            sx={{
                              bgcolor: alpha(colorTokens.brand, 0.15),
                              color: colorTokens.brand,
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        {routine.description && (
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                            {routine.description}
                          </Typography>
                        )}
                      </Box>
                      <IconButton
                        onClick={() => setExpandedRoutine(expandedRoutine === routine.id ? null : routine.id)}
                        sx={{ color: colorTokens.brand }}
                      >
                        {expandedRoutine === routine.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Lista expandible de ejercicios */}
                    <Collapse in={expandedRoutine === routine.id}>
                      <Divider sx={{ my: 2, borderColor: alpha(colorTokens.brand, 0.2) }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.brand, mb: 2 }}>
                        Ejercicios de la Rutina:
                      </Typography>

                      <Grid container spacing={2}>
                        {routine.routine_exercises?.map((routineEx, index) => (
                          <Grid key={routineEx.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                              onClick={() => handleShowExerciseDetail(routineEx)}
                              sx={{
                                p: 2,
                                background: alpha(colorTokens.surfaceLevel3, 0.5),
                                border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                                borderRadius: 2,
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  borderColor: colorTokens.brand,
                                  boxShadow: `0 4px 12px ${alpha(colorTokens.brand, 0.2)}`,
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
                                <Box sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  background: `linear-gradient(135deg, ${alpha(colorTokens.brand, 0.3)}, ${alpha(colorTokens.brand, 0.1)})`,
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
                                          bgcolor: alpha(colorTokens.info, 0.15),
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
                                          bgcolor: alpha(colorTokens.success, 0.15),
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
          ))}
        </Grid>
      )}

      {/* Dialog de detalles del ejercicio */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: colorTokens.surfaceLevel2,
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

            <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(colorTokens.brand, 0.2)}` }}>
              <Button
                onClick={() => setDetailDialog(false)}
                variant="contained"
                sx={{
                  bgcolor: colorTokens.brand,
                  color: colorTokens.black,
                  fontWeight: 700,
                  px: 4
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
