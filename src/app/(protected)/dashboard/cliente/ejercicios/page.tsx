'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Skeleton
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Search as SearchIcon,
  FitnessCenter as FitnessCenterIcon,
  PlayCircle as PlayIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  TrendingUp as LevelIcon,
  Category as CategoryIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { alpha } from '@mui/material/styles';
import { useHydrated } from '@/hooks/useHydrated';
import { motion, AnimatePresence } from 'framer-motion';

interface MuscleGroup {
  id: string;
  name: string;
  description?: string;
}

interface Exercise {
  id: string;
  name: string;
  type: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  material: string;
  level: string;
  muscle_group_id: string;
  muscle_group?: MuscleGroup | null;
  initial_position: string;
  execution_eccentric: string;
  execution_isometric?: string;
  execution_concentric: string;
  common_errors: string[];
  contraindications: string[];
  video_url?: string;
  image_url?: string;
}

export default function BibliotecaEjerciciosCliente() {
  const hydrated = useHydrated();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);

  useEffect(() => {
    if (hydrated) {
      loadMuscleGroups();
      loadExercises();
    }
  }, [hydrated, searchTerm, selectedMuscle, selectedLevel]);

  const loadMuscleGroups = async () => {
    try {
      const response = await fetch('/api/muscle-groups');
      if (!response.ok) throw new Error('Error al cargar grupos musculares');
      const data = await response.json();
      setMuscleGroups(data.muscleGroups || []);
    } catch (err) {
      console.error('Error loading muscle groups:', err);
    }
  };

  const loadExercises = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(selectedMuscle && { muscleGroup: selectedMuscle }),
        ...(selectedLevel && { level: selectedLevel })
      });

      const response = await fetch(`/api/exercises?${params}`);
      if (!response.ok) throw new Error('Error al cargar ejercicios');

      const data = await response.json();
      setExercises(data.exercises || []);
      setError(null);
    } catch (err) {
      console.error('Error loading exercises:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleShowDetail = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setDetailDialog(true);
  };

  const getLevelColor = (level: string) => {
    if (level.includes('Principiante')) return colorTokens.success;
    if (level.includes('Intermedio')) return colorTokens.warning;
    if (level.includes('Avanzado')) return colorTokens.danger;
    return colorTokens.info;
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  };

  if (!hydrated) {
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
            Biblioteca de{' '}
          </Typography>
          <Typography
            component="span"
            sx={{
              fontWeight: 800,
              color: colorTokens.brand,
              fontSize: { xs: '1.75rem', sm: '2.5rem' }
            }}
          >
            Ejercicios
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
          Explora nuestra colección completa de ejercicios con instrucciones detalladas
        </Typography>
      </Box>

      {/* Stats Cards */}
      {!loading && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{
              p: 2,
              background: `linear-gradient(135deg, ${alpha(colorTokens.brand, 0.15)}, ${alpha(colorTokens.brand, 0.05)})`,
              border: `1px solid ${alpha(colorTokens.brand, 0.2)}`,
              borderRadius: 2
            }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.brand, mb: 0.5 }}>
                {exercises.length}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.75rem' }}>
                Total Ejercicios
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{
              p: 2,
              background: `linear-gradient(135deg, ${alpha(colorTokens.success, 0.15)}, ${alpha(colorTokens.success, 0.05)})`,
              border: `1px solid ${alpha(colorTokens.success, 0.2)}`,
              borderRadius: 2
            }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.success, mb: 0.5 }}>
                {new Set(exercises.filter(e => e.muscle_group_id).map(e => e.muscle_group_id)).size}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.75rem' }}>
                Grupos Musculares
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{
              p: 2,
              background: `linear-gradient(135deg, ${alpha(colorTokens.info, 0.15)}, ${alpha(colorTokens.info, 0.05)})`,
              border: `1px solid ${alpha(colorTokens.info, 0.2)}`,
              borderRadius: 2
            }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.info, mb: 0.5 }}>
                {exercises.filter(e => e.video_url).length}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.75rem' }}>
                Con Video
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{
              p: 2,
              background: `linear-gradient(135deg, ${alpha(colorTokens.warning, 0.15)}, ${alpha(colorTokens.warning, 0.05)})`,
              border: `1px solid ${alpha(colorTokens.warning, 0.2)}`,
              borderRadius: 2
            }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.warning, mb: 0.5 }}>
                {new Set(exercises.map(e => e.type)).size}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.75rem' }}>
                Tipos
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Filtros */}
      <Paper sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
        borderRadius: 3
      }}>
        <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar ejercicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colorTokens.textSecondary }} />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Grupo Muscular</InputLabel>
              <Select
                value={selectedMuscle}
                onChange={(e) => setSelectedMuscle(e.target.value)}
                label="Grupo Muscular"
                startAdornment={
                  <InputAdornment position="start">
                    <CategoryIcon sx={{ color: colorTokens.textSecondary, ml: 1 }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="">Todos</MenuItem>
                {muscleGroups.map(group => (
                  <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Nivel</InputLabel>
              <Select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                label="Nivel"
                startAdornment={
                  <InputAdornment position="start">
                    <LevelIcon sx={{ color: colorTokens.textSecondary, ml: 1 }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="">Todos</MenuItem>
                {Array.from(new Set(exercises.map(e => e.level))).sort().map(level => (
                  <MenuItem key={level} value={level}>{level}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setSelectedMuscle('');
                setSelectedLevel('');
              }}
              startIcon={<FilterIcon />}
              sx={{
                borderColor: colorTokens.textSecondary,
                color: colorTokens.textSecondary,
                '&:hover': {
                  borderColor: colorTokens.brand,
                  color: colorTokens.brand
                }
              }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de ejercicios */}
      {loading ? (
        <Paper sx={{
          background: alpha(colorTokens.surfaceLevel2, 0.9),
          border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i}>
              <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: alpha(colorTokens.brand, 0.1) }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" sx={{ bgcolor: alpha(colorTokens.brand, 0.1) }} />
                  <Skeleton variant="text" width="40%" sx={{ bgcolor: alpha(colorTokens.brand, 0.1) }} />
                </Box>
              </Box>
              {i < 5 && <Divider sx={{ borderColor: alpha(colorTokens.brand, 0.1) }} />}
            </Box>
          ))}
        </Paper>
      ) : exercises.length === 0 ? (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          background: alpha(colorTokens.surfaceLevel2, 0.9),
          border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
          borderRadius: 3
        }}>
          <FitnessCenterIcon sx={{ fontSize: 80, color: colorTokens.textMuted, mb: 2 }} />
          <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
            No se encontraron ejercicios
          </Typography>
          <Typography variant="body2" sx={{ color: colorTokens.textMuted, mt: 1 }}>
            Intenta ajustar los filtros de búsqueda
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{
          background: alpha(colorTokens.surfaceLevel2, 0.9),
          border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          <List disablePadding>
            <AnimatePresence mode="wait">
              {exercises.map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  custom={index}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <ListItemButton
                    onClick={() => handleShowDetail(exercise)}
                    sx={{
                      py: 2,
                      px: { xs: 2, sm: 3 },
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: alpha(colorTokens.brand, 0.08),
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Box sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha(colorTokens.brand, 0.2)}, ${alpha(colorTokens.brand, 0.1)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FitnessCenterIcon sx={{ color: colorTokens.brand, fontSize: 24 }} />
                      </Box>
                    </ListItemIcon>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{
                          fontWeight: 700,
                          color: colorTokens.textPrimary,
                          fontSize: { xs: '0.95rem', sm: '1.05rem' }
                        }}>
                          {exercise.name}
                        </Typography>
                        {exercise.video_url && (
                          <Chip
                            icon={<VideoIcon sx={{ fontSize: 14 }} />}
                            label="Video"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(colorTokens.info, 0.15),
                              color: colorTokens.info,
                              '& .MuiChip-icon': { color: colorTokens.info }
                            }}
                          />
                        )}
                        {exercise.image_url && (
                          <Chip
                            icon={<ImageIcon sx={{ fontSize: 14 }} />}
                            label="Imagen"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(colorTokens.success, 0.15),
                              color: colorTokens.success,
                              '& .MuiChip-icon': { color: colorTokens.success }
                            }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={exercise.level}
                            size="small"
                            sx={{
                              bgcolor: alpha(getLevelColor(exercise.level), 0.15),
                              color: getLevelColor(exercise.level),
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                          <Chip
                            label={exercise.type}
                            size="small"
                            sx={{
                              bgcolor: alpha(colorTokens.info, 0.1),
                              color: colorTokens.info,
                              fontSize: '0.75rem'
                            }}
                          />
                          {exercise.muscle_group && (
                            <Chip
                              label={exercise.muscle_group.name}
                              size="small"
                              sx={{
                                bgcolor: alpha(colorTokens.brand, 0.15),
                                color: colorTokens.brand,
                                fontWeight: 600,
                                fontSize: '0.75rem'
                              }}
                            />
                          )}
                          {exercise.material && (
                            <Typography variant="caption" sx={{
                              color: colorTokens.textSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '0.75rem'
                            }}>
                              Material: {exercise.material}
                            </Typography>
                          )}
                      </Box>
                    </Box>
                  </ListItemButton>
                  {index < exercises.length - 1 && (
                    <Divider sx={{ borderColor: alpha(colorTokens.brand, 0.1) }} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </Paper>
      )}

      {/* Dialog de detalles */}
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
                  {selectedExercise.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedExercise.muscle_group && (
                    <Chip
                      label={selectedExercise.muscle_group.name}
                      sx={{
                        bgcolor: alpha(colorTokens.brand, 0.15),
                        color: colorTokens.brand,
                        fontWeight: 600
                      }}
                    />
                  )}
                  <Chip
                    label={selectedExercise.type}
                    sx={{
                      bgcolor: alpha(colorTokens.info, 0.15),
                      color: colorTokens.info
                    }}
                  />
                  <Chip
                    label={selectedExercise.level}
                    sx={{
                      bgcolor: alpha(getLevelColor(selectedExercise.level), 0.15),
                      color: getLevelColor(selectedExercise.level),
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Box>
              <IconButton onClick={() => setDetailDialog(false)} sx={{ color: colorTokens.textSecondary }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Información básica */}
                <Grid size={12}>
                  <Box sx={{ p: 2.5, bgcolor: alpha(colorTokens.brand, 0.05), borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.brand, mb: 2 }}>
                      Información General
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          <strong>Material necesario:</strong> {selectedExercise.material}
                        </Typography>
                      </Grid>
                      <Grid size={12}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          <strong>Nivel:</strong> {selectedExercise.level}
                        </Typography>
                      </Grid>
                      <Grid size={12}>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          <strong>Músculos primarios:</strong> {selectedExercise.primary_muscles && selectedExercise.primary_muscles.length > 0 ? selectedExercise.primary_muscles.join(', ') : 'No especificado'}
                        </Typography>
                      </Grid>
                      {selectedExercise.secondary_muscles && selectedExercise.secondary_muscles.length > 0 && (
                        <Grid size={12}>
                          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                            <strong>Músculos secundarios:</strong> {selectedExercise.secondary_muscles.join(', ')}
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
                      {selectedExercise.initial_position}
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
                        {selectedExercise.execution_eccentric}
                      </Typography>
                    </Box>
                    {selectedExercise.execution_isometric && (
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="subtitle2" sx={{ color: colorTokens.textPrimary, fontWeight: 600, mb: 1 }}>
                          2. Fase Isométrica (Transición):
                        </Typography>
                        <Typography variant="body1" sx={{ color: colorTokens.textSecondary, lineHeight: 1.7 }}>
                          {selectedExercise.execution_isometric}
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="subtitle2" sx={{ color: colorTokens.textPrimary, fontWeight: 600, mb: 1 }}>
                        {selectedExercise.execution_isometric ? '3' : '2'}. Fase Concéntrica (Ascenso):
                      </Typography>
                      <Typography variant="body1" sx={{ color: colorTokens.textSecondary, lineHeight: 1.7 }}>
                        {selectedExercise.execution_concentric}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Errores comunes */}
                {selectedExercise.common_errors && selectedExercise.common_errors.length > 0 && (
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
                        {selectedExercise.common_errors.map((error, idx) => (
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
                {selectedExercise.contraindications && selectedExercise.contraindications.length > 0 && (
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
                        {selectedExercise.contraindications.map((contra, idx) => (
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
                {(selectedExercise.video_url || selectedExercise.image_url) && (
                  <Grid size={12}>
                    <Box sx={{ p: 2.5, bgcolor: alpha(colorTokens.brand, 0.05), borderRadius: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.brand, mb: 2 }}>
                        Recursos Multimedia
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        {selectedExercise.video_url && (
                          <Button
                            variant="contained"
                            startIcon={<PlayIcon />}
                            onClick={() => window.open(selectedExercise.video_url, '_blank')}
                            sx={{
                              bgcolor: colorTokens.info,
                              color: '#fff',
                              '&:hover': { bgcolor: alpha(colorTokens.info, 0.9) }
                            }}
                          >
                            Ver Video Tutorial
                          </Button>
                        )}
                        {selectedExercise.image_url && (
                          <Button
                            variant="outlined"
                            startIcon={<ImageIcon />}
                            onClick={() => window.open(selectedExercise.image_url, '_blank')}
                            sx={{
                              borderColor: colorTokens.success,
                              color: colorTokens.success,
                              '&:hover': {
                                borderColor: colorTokens.success,
                                bgcolor: alpha(colorTokens.success, 0.1)
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

            <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(colorTokens.brand, 0.2)}` }}>
              <Button
                onClick={() => setDetailDialog(false)}
                variant="contained"
                sx={{
                  bgcolor: colorTokens.brand,
                  color: colorTokens.black,
                  fontWeight: 700,
                  px: 4,
                  '&:hover': { bgcolor: alpha(colorTokens.brand, 0.9) }
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
