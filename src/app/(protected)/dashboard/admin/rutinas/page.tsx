'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  ToggleButtonGroup,
  ToggleButton,
  Collapse
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FitnessCenter as FitnessCenterIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon,
  Timer as TimerIcon,
  RepeatOne as RepsIcon,
  Hotel as RestIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  GridView as GridViewIcon,
  TableRows as TableViewIcon,
  BarChart as ChartIcon,
  ExpandMore as ExpandMoreIcon,
  FileDownload as ExcelIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { alpha } from '@mui/material/styles';
import { useHydrated } from '@/hooks/useHydrated';
import { showSuccess, showError, showDeleteConfirmation } from '@/lib/notifications/MySwal';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { RutineDetailModal, RutineAnalyticsCharts, AssignRoutineModal, AssignedUsersModal } from '@/components/rutinas';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MuscleGroup {
  id: string;
  name: string;
}

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
  execution_concentric: string;
  video_url?: string;
  image_url?: string;
  muscle_group?: MuscleGroup | null;
}

interface RoutineExercise {
  id?: string;
  exercise_id: string;
  exercise?: Exercise;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
}

interface Routine {
  id?: string;
  name: string;
  description?: string;
  difficulty_level: string;
  estimated_duration?: number;
  muscle_group_focus?: string;
  is_public: boolean;
  routine_exercises: RoutineExercise[];
  created_at?: string;
}

interface AnalyticsData {
  totalRoutines: number;
  generalCount: number;
  personalizedCount: number;
  levelDistribution: Record<string, number>;
  durationDistribution: Record<string, number>;
  avgExercisesPerRoutine: number;
  topUsedRoutines: Array<{ name: string; usage_count: number }>;
  unusedRoutinesCount: number;
  activeAssignments: number;
  totalExercisesInRoutines: number;
}

// Componente de ejercicio sortable
function SortableExerciseItem({ exercise, onEdit, onRemove }: {
  exercise: RoutineExercise;
  onEdit: (exercise: RoutineExercise) => void;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.exercise_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 2,
        bgcolor: colorTokens.neutral200,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 2,
        cursor: isDragging ? 'grabbing' : 'default',
        '&:hover': {
          borderColor: colorTokens.brand
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box {...attributes} {...listeners} sx={{ cursor: 'grab', '&:active': { cursor: 'grabbing' } }}>
            <DragIcon sx={{ color: colorTokens.textSecondary, fontSize: 28 }} />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 0.5 }}>
              {exercise.exercise?.name || 'Ejercicio'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Chip
                icon={<RepsIcon sx={{ fontSize: 14 }} />}
                label={`${exercise.sets} sets × ${exercise.reps} reps`}
                size="small"
                sx={{
                  bgcolor: `${colorTokens.info}20`,
                  color: colorTokens.info,
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              />
              <Chip
                icon={<RestIcon sx={{ fontSize: 14 }} />}
                label={`${exercise.rest_seconds}s`}
                size="small"
                sx={{
                  bgcolor: `${colorTokens.warning}20`,
                  color: colorTokens.warning,
                  fontSize: '0.75rem'
                }}
              />
            </Box>
            {exercise.notes && (
              <Typography variant="caption" sx={{ color: colorTokens.textMuted, mt: 0.5, display: 'block' }}>
                {exercise.notes}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => onEdit(exercise)}
              sx={{
                color: colorTokens.info,
                bgcolor: `${colorTokens.info}20`,
                '&:hover': { bgcolor: `${colorTokens.info}30` }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onRemove(exercise.exercise_id)}
              sx={{
                color: colorTokens.danger,
                bgcolor: `${colorTokens.danger}20`,
                '&:hover': { bgcolor: `${colorTokens.danger}30` }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function RutinasAdmin() {
  const hydrated = useHydrated();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [exerciseEditDialog, setExerciseEditDialog] = useState(false);
  const [currentEditingExercise, setCurrentEditingExercise] = useState<RoutineExercise | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Estados para vista enterprise
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [detailRoutine, setDetailRoutine] = useState<Routine | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [assignRoutine, setAssignRoutine] = useState<Routine | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignedUsersRoutine, setAssignedUsersRoutine] = useState<Routine | null>(null);
  const [assignedUsersModalOpen, setAssignedUsersModalOpen] = useState(false);

  const [formData, setFormData] = useState<Routine>({
    name: '',
    description: '',
    difficulty_level: 'Intermedio',
    estimated_duration: 60,
    muscle_group_focus: '',
    is_public: true,
    routine_exercises: []
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (hydrated) {
      loadRoutines();
      loadExercises();
      loadAnalytics();
    }
  }, [hydrated]);

  const loadRoutines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/routines');
      if (!response.ok) throw new Error('Error al cargar rutinas');
      const data = await response.json();
      setRoutines(data.routines || []);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const response = await fetch('/api/exercises');
      if (!response.ok) throw new Error('Error al cargar ejercicios');
      const data = await response.json();
      setExercises(data.exercises || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/routines/analytics');
      if (!response.ok) throw new Error('Error al cargar analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.routine_exercises.findIndex(ex => ex.exercise_id === active.id);
        const newIndex = prev.routine_exercises.findIndex(ex => ex.exercise_id === over.id);
        const newExercises = arrayMove(prev.routine_exercises, oldIndex, newIndex);
        return {
          ...prev,
          routine_exercises: newExercises.map((ex, idx) => ({ ...ex, order_index: idx }))
        };
      });
    }
  };

  const handleAddExerciseToRoutine = (exercise: Exercise) => {
    const alreadyAdded = formData.routine_exercises.some(re => re.exercise_id === exercise.id);
    if (alreadyAdded) {
      showError('Ejercicio Duplicado', 'Este ejercicio ya está agregado en la rutina');
      return;
    }

    const newRoutineExercise: RoutineExercise = {
      exercise_id: exercise.id,
      exercise: exercise,
      order_index: formData.routine_exercises.length,
      sets: 3,
      reps: '10-12',
      rest_seconds: 60,
      notes: ''
    };

    setFormData(prev => ({
      ...prev,
      routine_exercises: [...prev.routine_exercises, newRoutineExercise]
    }));
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setFormData(prev => ({
      ...prev,
      routine_exercises: prev.routine_exercises
        .filter(ex => ex.exercise_id !== exerciseId)
        .map((ex, idx) => ({ ...ex, order_index: idx }))
    }));
  };

  const handleEditExerciseParams = (exercise: RoutineExercise) => {
    setCurrentEditingExercise({ ...exercise });
    setExerciseEditDialog(true);
  };

  const handleSaveExerciseParams = () => {
    if (!currentEditingExercise) return;

    setFormData(prev => ({
      ...prev,
      routine_exercises: prev.routine_exercises.map(ex =>
        ex.exercise_id === currentEditingExercise.exercise_id
          ? currentEditingExercise
          : ex
      )
    }));

    setExerciseEditDialog(false);
    setCurrentEditingExercise(null);
  };

  const handleSaveRoutine = async () => {
    try {
      if (!formData.name.trim()) {
        showError('Validación', 'El nombre de la rutina es requerido');
        return;
      }

      if (formData.routine_exercises.length === 0) {
        showError('Validación', 'Debes agregar al menos un ejercicio a la rutina');
        return;
      }

      const isEditing = !!editingRoutine;
      const url = isEditing ? `/api/routines/${editingRoutine.id}` : '/api/routines';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          exercises: formData.routine_exercises.map(({ exercise, ...rest }) => rest)
        })
      });

      if (!response.ok) throw new Error(`Error al ${isEditing ? 'actualizar' : 'guardar'} rutina`);

      showSuccess(
        isEditing ? 'Rutina Actualizada' : 'Rutina Creada',
        `La rutina "${formData.name}" ha sido ${isEditing ? 'actualizada' : 'creada'} exitosamente`
      );

      await loadRoutines();
      await loadAnalytics();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving routine:', error);
      showError('Error', 'No se pudo guardar la rutina. Intenta de nuevo.');
    }
  };

  const handleCloseDialog = () => {
    setCreateDialog(false);
    setEditingRoutine(null);
    setFormData({
      name: '',
      description: '',
      difficulty_level: 'Intermedio',
      estimated_duration: 60,
      muscle_group_focus: '',
      is_public: true,
      routine_exercises: []
    });
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    const processedExercises = (routine.routine_exercises || []).map((ex, idx) => ({
      ...ex,
      exercise_id: ex.exercise_id || `temp-${idx}-${Date.now()}`,
      order_index: idx
    }));

    setFormData({
      ...routine,
      routine_exercises: processedExercises
    });
    setCreateDialog(true);
  };

  const handleDeleteRoutine = async (id: string) => {
    const routine = routines.find(r => r.id === id);
    const result = await showDeleteConfirmation(
      routine?.name || 'esta rutina'
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/routines/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Error al eliminar');

      showSuccess('Rutina Eliminada', 'La rutina ha sido eliminada exitosamente');
      await loadRoutines();
      await loadAnalytics();
    } catch (error) {
      console.error('Error deleting routine:', error);
      showError('Error', 'No se pudo eliminar la rutina. Intenta de nuevo.');
    }
  };

  const handleDuplicateRoutine = async (routineId: string) => {
    try {
      const response = await fetch(`/api/routines/${routineId}/duplicate`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Error al duplicar rutina');

      const data = await response.json();
      showSuccess('Rutina Duplicada', data.message || 'Rutina duplicada exitosamente');

      await loadRoutines();
      await loadAnalytics();
    } catch (error) {
      console.error('Error duplicating routine:', error);
      showError('Error', 'No se pudo duplicar la rutina. Intenta de nuevo.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const filters = {
        search: searchTerm,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        duration: durationFilter !== 'all' ? durationFilter : undefined
      };

      const response = await fetch('/api/routines/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });

      if (!response.ok) throw new Error('Error al exportar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rutinas-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess('Exportación Exitosa', 'Las rutinas han sido exportadas a Excel');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showError('Error', 'No se pudo exportar a Excel. Intenta de nuevo.');
    }
  };

  const handleViewDetails = (routine: Routine) => {
    setDetailRoutine(routine);
    setDetailModalOpen(true);
  };

  if (!hydrated || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrado de rutinas
  let filteredRoutines = routines.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'all' || r.difficulty_level === levelFilter;
    const matchesType = typeFilter === 'all' ||
                       (typeFilter === 'general' && r.is_public) ||
                       (typeFilter === 'personalizada' && !r.is_public);

    let matchesDuration = true;
    if (durationFilter !== 'all') {
      const duration = r.estimated_duration || 0;
      if (durationFilter === '0-30') matchesDuration = duration <= 30;
      else if (durationFilter === '31-60') matchesDuration = duration > 30 && duration <= 60;
      else if (durationFilter === '61-90') matchesDuration = duration > 60 && duration <= 90;
      else if (durationFilter === '90+') matchesDuration = duration > 90;
    }

    return matchesSearch && matchesLevel && matchesType && matchesDuration;
  });

  const getDifficultyColor = (level: string) => {
    if (level?.toLowerCase().includes('principiante')) return colorTokens.success;
    if (level?.toLowerCase().includes('avanzado')) return colorTokens.danger;
    return colorTokens.warning;
  };

  const paginatedRoutines = filteredRoutines.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ pb: { xs: 10, lg: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
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
              Gestión de{' '}
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
            Sistema completo de gestión de rutinas de entrenamiento
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
          sx={{
            bgcolor: colorTokens.brand,
            color: colorTokens.neutral300,
            fontWeight: 700,
            px: 3,
            '&:hover': { bgcolor: colorTokens.warning }
          }}
        >
          Nueva Rutina
        </Button>
      </Box>

      {/* Stats Cards */}
      {analytics && (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}`, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${colorTokens.success}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FitnessCenterIcon sx={{ color: colorTokens.success, fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 600 }}>
                        Rutinas Generales
                      </Typography>
                      <Typography variant="h4" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                        {analytics.generalCount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}`, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${colorTokens.warning}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FitnessCenterIcon sx={{ color: colorTokens.warning, fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 600 }}>
                        Personalizadas
                      </Typography>
                      <Typography variant="h4" sx={{ color: colorTokens.warning, fontWeight: 700 }}>
                        {analytics.personalizedCount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}`, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${colorTokens.info}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <CalendarIcon sx={{ color: colorTokens.info, fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 600 }}>
                        Asignaciones Activas
                      </Typography>
                      <Typography variant="h4" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                        {analytics.activeAssignments}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}`, height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${colorTokens.brand}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <TrendingUpIcon sx={{ color: colorTokens.brand, fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 600 }}>
                        Promedio Ejercicios
                      </Typography>
                      <Typography variant="h4" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                        {analytics.avgExercisesPerRoutine}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}

      {/* Analytics Section - Collapsible */}
      {analytics && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ChartIcon />}
            endIcon={<ExpandMoreIcon sx={{ transform: showAnalytics ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />}
            onClick={() => setShowAnalytics(!showAnalytics)}
            sx={{
              borderColor: colorTokens.brand,
              color: colorTokens.brand,
              fontWeight: 700,
              mb: 2,
              '&:hover': {
                borderColor: colorTokens.brand,
                bgcolor: `${colorTokens.brand}20`
              }
            }}
          >
            {showAnalytics ? 'Ocultar Analytics' : 'Mostrar Analytics'}
          </Button>

          <Collapse in={showAnalytics}>
            <RutineAnalyticsCharts data={analytics} />
          </Collapse>
        </Box>
      )}

      {/* Filters and View Controls */}
      <Box sx={{
        mb: 3,
        p: { xs: 2, sm: 3 },
        bgcolor: colorTokens.neutral300,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 2
      }}>
        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ alignItems: 'flex-end' }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar rutinas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colorTokens.textSecondary }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: colorTokens.neutral200
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Nivel</InputLabel>
              <Select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                label="Nivel"
                sx={{ bgcolor: colorTokens.neutral200 }}
              >
                <MenuItem value="all">Todos los niveles</MenuItem>
                <MenuItem value="Principiante">Principiante</MenuItem>
                <MenuItem value="Intermedio">Intermedio</MenuItem>
                <MenuItem value="Avanzado">Avanzado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="Tipo"
                sx={{ bgcolor: colorTokens.neutral200 }}
              >
                <MenuItem value="all">Todos los tipos</MenuItem>
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="personalizada">Personalizada</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Duración</InputLabel>
              <Select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                label="Duración"
                sx={{ bgcolor: colorTokens.neutral200 }}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="0-30">0-30 min</MenuItem>
                <MenuItem value="31-60">31-60 min</MenuItem>
                <MenuItem value="61-90">61-90 min</MenuItem>
                <MenuItem value="90+">90+ min</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, md: 1.5 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ExcelIcon />}
              onClick={handleExportExcel}
              sx={{
                borderColor: colorTokens.success,
                color: colorTokens.success,
                fontWeight: 600,
                '&:hover': {
                  borderColor: colorTokens.success,
                  bgcolor: `${colorTokens.success}20`
                }
              }}
            >
              Excel
            </Button>
          </Grid>

          <Grid size={{ xs: 6, md: 1.5 }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newValue) => newValue && setViewMode(newValue)}
              fullWidth
              sx={{
                bgcolor: colorTokens.neutral200,
                '& .MuiToggleButton-root': {
                  color: colorTokens.textSecondary,
                  borderColor: colorTokens.border,
                  '&.Mui-selected': {
                    bgcolor: colorTokens.brand,
                    color: colorTokens.neutral300,
                    '&:hover': {
                      bgcolor: colorTokens.warning
                    }
                  }
                }
              }}
            >
              <ToggleButton value="grid">
                <GridViewIcon />
              </ToggleButton>
              <ToggleButton value="table">
                <TableViewIcon />
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>
        </Grid>
      </Box>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <Grid container spacing={3}>
          {filteredRoutines.map((routine) => (
            <Grid key={routine.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card sx={{
                  bgcolor: colorTokens.neutral300,
                  border: `1px solid ${colorTokens.border}`,
                  borderRadius: 3,
                  height: '100%',
                  '&:hover': {
                    borderColor: colorTokens.brand,
                    transform: 'translateY(-4px)',
                    transition: 'all 0.3s'
                  }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 1 }}>
                          {routine.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={routine.is_public ? 'General' : 'Personalizada'}
                            size="small"
                            sx={{
                              bgcolor: routine.is_public ? `${colorTokens.success}20` : `${colorTokens.warning}20`,
                              color: routine.is_public ? colorTokens.success : colorTokens.warning,
                              fontWeight: 700,
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            label={routine.difficulty_level}
                            size="small"
                            sx={{
                              bgcolor: `${getDifficultyColor(routine.difficulty_level)}20`,
                              color: getDifficultyColor(routine.difficulty_level),
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            icon={<TimerIcon sx={{ fontSize: 12 }} />}
                            label={`${routine.estimated_duration || 0} min`}
                            size="small"
                            sx={{
                              bgcolor: `${colorTokens.info}20`,
                              color: colorTokens.info,
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            label={`${routine.routine_exercises?.length || 0} ejercicios`}
                            size="small"
                            sx={{
                              bgcolor: `${colorTokens.brand}20`,
                              color: colorTokens.brand,
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    {routine.description && (
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 2 }}>
                        {routine.description.substring(0, 100)}{routine.description.length > 100 ? '...' : ''}
                      </Typography>
                    )}

                    <Divider sx={{ borderColor: colorTokens.border, my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Tooltip title="Ver Detalles">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(routine)}
                          sx={{
                            color: colorTokens.brand,
                            bgcolor: `${colorTokens.brand}20`,
                            '&:hover': { bgcolor: `${colorTokens.brand}30` }
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditRoutine(routine)}
                          sx={{
                            color: colorTokens.info,
                            bgcolor: `${colorTokens.info}20`,
                            '&:hover': { bgcolor: `${colorTokens.info}30` }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Duplicar">
                        <IconButton
                          size="small"
                          onClick={() => handleDuplicateRoutine(routine.id!)}
                          sx={{
                            color: colorTokens.success,
                            bgcolor: `${colorTokens.success}20`,
                            '&:hover': { bgcolor: `${colorTokens.success}30` }
                          }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Asignar a Usuario">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setAssignRoutine(routine);
                            setAssignModalOpen(true);
                          }}
                          sx={{
                            color: colorTokens.warning,
                            bgcolor: `${colorTokens.warning}20`,
                            '&:hover': { bgcolor: `${colorTokens.warning}30` }
                          }}
                        >
                          <PersonAddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver Usuarios Asignados">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setAssignedUsersRoutine(routine);
                            setAssignedUsersModalOpen(true);
                          }}
                          sx={{
                            color: '#9C27B0',
                            bgcolor: 'rgba(156, 39, 176, 0.1)',
                            '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.2)' }
                          }}
                        >
                          <PeopleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRoutine(routine.id!)}
                          sx={{
                            color: colorTokens.danger,
                            bgcolor: `${colorTokens.danger}20`,
                            '&:hover': { bgcolor: `${colorTokens.danger}30` }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Box>
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 2,
              mb: 2
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: colorTokens.neutral200 }}>
                  <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Rutina</TableCell>
                  <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Nivel</TableCell>
                  <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }} align="center">Duración</TableCell>
                  <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }} align="center">Ejercicios</TableCell>
                  <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRoutines.map((routine) => (
                  <TableRow
                    key={routine.id}
                    sx={{
                      '&:hover': { bgcolor: `${colorTokens.brand}10` },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                        {routine.name}
                      </Typography>
                      {routine.description && (
                        <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                          {routine.description.substring(0, 60)}{routine.description.length > 60 ? '...' : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={routine.is_public ? 'General' : 'Personalizada'}
                        size="small"
                        sx={{
                          bgcolor: routine.is_public ? `${colorTokens.success}20` : `${colorTokens.warning}20`,
                          color: routine.is_public ? colorTokens.success : colorTokens.warning,
                          fontWeight: 700,
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={routine.difficulty_level}
                        size="small"
                        sx={{
                          bgcolor: `${getDifficultyColor(routine.difficulty_level)}20`,
                          color: getDifficultyColor(routine.difficulty_level),
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                        {routine.estimated_duration || 0} min
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={routine.routine_exercises?.length || 0}
                        size="small"
                        sx={{
                          bgcolor: `${colorTokens.brand}20`,
                          color: colorTokens.brand,
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Tooltip title="Ver">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(routine)}
                            sx={{
                              color: colorTokens.brand,
                              bgcolor: `${colorTokens.brand}20`,
                              '&:hover': { bgcolor: `${colorTokens.brand}30` }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRoutine(routine)}
                            sx={{
                              color: colorTokens.info,
                              bgcolor: `${colorTokens.info}20`,
                              '&:hover': { bgcolor: `${colorTokens.info}30` }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicar">
                          <IconButton
                            size="small"
                            onClick={() => handleDuplicateRoutine(routine.id!)}
                            sx={{
                              color: colorTokens.success,
                              bgcolor: `${colorTokens.success}20`,
                              '&:hover': { bgcolor: `${colorTokens.success}30` }
                            }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Asignar a Usuario">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setAssignRoutine(routine);
                              setAssignModalOpen(true);
                            }}
                            sx={{
                              color: colorTokens.warning,
                              bgcolor: `${colorTokens.warning}20`,
                              '&:hover': { bgcolor: `${colorTokens.warning}30` }
                            }}
                          >
                            <PersonAddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ver Usuarios Asignados">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setAssignedUsersRoutine(routine);
                              setAssignedUsersModalOpen(true);
                            }}
                            sx={{
                              color: '#9C27B0',
                              bgcolor: 'rgba(156, 39, 176, 0.1)',
                              '&:hover': { bgcolor: 'rgba(156, 39, 176, 0.2)' }
                            }}
                          >
                            <PeopleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRoutine(routine.id!)}
                            sx={{
                              color: colorTokens.danger,
                              bgcolor: `${colorTokens.danger}20`,
                              '&:hover': { bgcolor: `${colorTokens.danger}30` }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredRoutines.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{
              color: colorTokens.textPrimary,
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 2,
              '& .MuiTablePagination-select': {
                color: colorTokens.textPrimary
              },
              '& .MuiTablePagination-selectIcon': {
                color: colorTokens.textPrimary
              }
            }}
          />
        </Box>
      )}

      {/* Empty State */}
      {filteredRoutines.length === 0 && (
        <Paper sx={{
          p: 6,
          textAlign: 'center',
          bgcolor: colorTokens.neutral300,
          border: `1px solid ${colorTokens.border}`,
          borderRadius: 3
        }}>
          <FitnessCenterIcon sx={{ fontSize: 80, color: colorTokens.textMuted, mb: 2 }} />
          <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
            No se encontraron rutinas
          </Typography>
          <Typography variant="body2" sx={{ color: colorTokens.textMuted, mt: 1 }}>
            {searchTerm || levelFilter !== 'all' || typeFilter !== 'all' || durationFilter !== 'all'
              ? 'Intenta ajustar los filtros'
              : 'Crea tu primera rutina para comenzar'}
          </Typography>
        </Paper>
      )}

      {/* Detail Modal */}
      <RutineDetailModal
        open={detailModalOpen}
        routine={detailRoutine}
        onClose={() => {
          setDetailModalOpen(false);
          setDetailRoutine(null);
        }}
        onDuplicate={handleDuplicateRoutine}
      />

      {/* Assign Routine Modal */}
      <AssignRoutineModal
        open={assignModalOpen}
        routine={assignRoutine}
        onClose={() => {
          setAssignModalOpen(false);
          setAssignRoutine(null);
        }}
        onAssigned={() => {
          loadRoutines(); // Refresh routines
          loadAnalytics(); // Refresh analytics to update assignment counter
        }}
      />

      {/* Assigned Users Modal */}
      <AssignedUsersModal
        open={assignedUsersModalOpen}
        routine={assignedUsersRoutine}
        onClose={() => {
          setAssignedUsersModalOpen(false);
          setAssignedUsersRoutine(null);
        }}
      />

      {/* Dialog de creación - DISEÑO DE 2 COLUMNAS (MANTENER INTACTO) */}
      <Dialog
        open={createDialog}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3,
              maxHeight: '90vh',
              height: '90vh'
            }
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${colorTokens.border}`
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>
              {editingRoutine ? 'Editar Rutina' : 'Nueva Rutina'}
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mt: 0.5 }}>
              Configura los ejercicios y parámetros de la rutina
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: colorTokens.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2, p: 3 }}>
          {/* Formulario básico */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Nombre de la Rutina"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{
                  '& .MuiInputBase-root': { bgcolor: colorTokens.neutral200 }
                }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
                sx={{
                  '& .MuiInputBase-root': { bgcolor: colorTokens.neutral200 }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.is_public ? 'general' : 'personalizada'}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.value === 'general' })}
                  label="Tipo"
                  sx={{ bgcolor: colorTokens.neutral200 }}
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="personalizada">Personalizada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Dificultad</InputLabel>
                <Select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  label="Dificultad"
                  sx={{ bgcolor: colorTokens.neutral200 }}
                >
                  <MenuItem value="Principiante">Principiante</MenuItem>
                  <MenuItem value="Intermedio">Intermedio</MenuItem>
                  <MenuItem value="Avanzado">Avanzado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Duración Estimada (min)"
                type="number"
                value={formData.estimated_duration || ''}
                onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
                sx={{
                  '& .MuiInputBase-root': { bgcolor: colorTokens.neutral200 }
                }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: colorTokens.border }} />

          {/* DISEÑO DE 2 COLUMNAS */}
          <Grid container spacing={3}>
            {/* COLUMNA IZQUIERDA: Ejercicios disponibles */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{
                p: 2,
                bgcolor: colorTokens.neutral200,
                borderRadius: 2,
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${colorTokens.border}`
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.brand, mb: 2 }}>
                  Ejercicios Disponibles
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Buscar ejercicio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: colorTokens.textSecondary }} />
                      </InputAdornment>
                    )
                  }}
                />
                <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
                  {filteredExercises.map((exercise) => (
                    <Paper
                      key={exercise.id}
                      onClick={() => handleAddExerciseToRoutine(exercise)}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        cursor: 'pointer',
                        bgcolor: colorTokens.neutral300,
                        border: `1px solid ${colorTokens.border}`,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: `${colorTokens.brand}20`,
                          borderColor: colorTokens.brand,
                          transform: 'translateX(4px)'
                        }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: colorTokens.textPrimary, mb: 0.5 }}>
                        {exercise.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={exercise.type} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                        <Chip label={exercise.level} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* COLUMNA DERECHA: Rutina con ejercicios ordenables */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{
                p: 2,
                bgcolor: `${colorTokens.brand}10`,
                borderRadius: 2,
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${colorTokens.brand}30`
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colorTokens.brand, mb: 2 }}>
                  Ejercicios de la Rutina ({formData.routine_exercises.length})
                </Typography>

                <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
                  {formData.routine_exercises.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Haz clic en los ejercicios de la izquierda para agregarlos a la rutina
                    </Alert>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={formData.routine_exercises.map((ex, idx) => ex.exercise_id || `exercise-${idx}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        {formData.routine_exercises.map((exercise, idx) => (
                          <SortableExerciseItem
                            key={exercise.exercise_id || `exercise-key-${idx}`}
                            exercise={exercise}
                            onEdit={handleEditExerciseParams}
                            onRemove={handleRemoveExercise}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.border}` }}>
          <Button onClick={handleCloseDialog} sx={{ color: colorTokens.textSecondary }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveRoutine}
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.neutral300,
              fontWeight: 700,
              '&:hover': { bgcolor: colorTokens.warning }
            }}
          >
            {editingRoutine ? 'Actualizar Rutina' : 'Guardar Rutina'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog editar parámetros */}
      <Dialog
        open={exerciseEditDialog}
        onClose={() => setExerciseEditDialog(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${colorTokens.border}` }}>
          Editar Parámetros
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {currentEditingExercise && (
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Sets"
                  type="number"
                  value={currentEditingExercise.sets}
                  onChange={(e) => setCurrentEditingExercise({
                    ...currentEditingExercise,
                    sets: parseInt(e.target.value) || 1
                  })}
                  sx={{ '& .MuiInputBase-root': { bgcolor: colorTokens.neutral200 } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Repeticiones"
                  value={currentEditingExercise.reps}
                  onChange={(e) => setCurrentEditingExercise({
                    ...currentEditingExercise,
                    reps: e.target.value
                  })}
                  placeholder="10-12"
                  sx={{ '& .MuiInputBase-root': { bgcolor: colorTokens.neutral200 } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Descanso (segundos)"
                  type="number"
                  value={currentEditingExercise.rest_seconds}
                  onChange={(e) => setCurrentEditingExercise({
                    ...currentEditingExercise,
                    rest_seconds: parseInt(e.target.value) || 0
                  })}
                  sx={{ '& .MuiInputBase-root': { bgcolor: colorTokens.neutral200 } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Notas"
                  multiline
                  rows={2}
                  value={currentEditingExercise.notes || ''}
                  onChange={(e) => setCurrentEditingExercise({
                    ...currentEditingExercise,
                    notes: e.target.value
                  })}
                  sx={{ '& .MuiInputBase-root': { bgcolor: colorTokens.neutral200 } }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colorTokens.border}` }}>
          <Button onClick={() => setExerciseEditDialog(false)} sx={{ color: colorTokens.textSecondary }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveExerciseParams}
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.neutral300,
              fontWeight: 700,
              '&:hover': { bgcolor: colorTokens.warning }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
