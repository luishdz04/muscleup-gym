'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Menu,
  ListItemIcon,
  ListItemText,
  Alert,
  Collapse
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FitnessCenter as FitnessCenterIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  ContentCopy as CopyIcon,
  GetApp as DownloadIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { motion } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { showSuccess, showError, showDeleteConfirmation } from '@/lib/notifications/MySwal';
import ExerciseAnalyticsCharts from '@/components/biblioteca/ExerciseAnalyticsCharts';
import ExerciseDetailModal from '@/components/biblioteca/ExerciseDetailModal';

interface MuscleGroup {
  id: string;
  name: string;
  description: string;
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
  muscle_group?: MuscleGroup;
  initial_position: string;
  execution_eccentric: string;
  execution_isometric: string;
  execution_concentric: string;
  common_errors: string[];
  contraindications: string[];
  video_url?: string;
  image_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ExerciseFormData {
  name: string;
  type: string;
  muscle_group_id: string;
  primary_muscles: string;
  secondary_muscles: string;
  material: string;
  level: string;
  initial_position: string;
  execution_eccentric: string;
  execution_isometric: string;
  execution_concentric: string;
  common_errors: string;
  contraindications: string;
  video_url: string;
  image_url: string;
}

interface AnalyticsData {
  totalExercises: number;
  muscleGroupDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  levelDistribution: Record<string, number>;
  multimediaStats: {
    withVideo: number;
    withImage: number;
    withoutVideo: number;
    withoutImage: number;
  };
  topUsedExercises: Array<{ name: string; usage_count: number }>;
  unusedExercisesCount: number;
  unusedExercises?: Array<{ id: string; name: string }>;
}

const getUniqueValues = (exercises: Exercise[], field: keyof Exercise): string[] => {
  const values = exercises.map(ex => ex[field] as string).filter(Boolean);
  return Array.from(new Set(values)).sort();
};

export default function BibliotecaAdminPage() {
  const { notifySuccess, notifyError } = useNotifications();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Tabla
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  // Analytics
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<Exercise | null>(null);

  // Menu actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuExercise, setMenuExercise] = useState<Exercise | null>(null);

  const [formData, setFormData] = useState<ExerciseFormData>({
    name: '',
    type: '',
    muscle_group_id: '',
    primary_muscles: '',
    secondary_muscles: '',
    material: '',
    level: '',
    initial_position: '',
    execution_eccentric: '',
    execution_isometric: '',
    execution_concentric: '',
    common_errors: '',
    contraindications: '',
    video_url: '',
    image_url: ''
  });

  useEffect(() => {
    fetchData();
    fetchAnalytics();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [exercisesRes, muscleGroupsRes] = await Promise.all([
        fetch('/api/exercises'),
        fetch('/api/muscle-groups')
      ]);

      if (exercisesRes.ok) {
        const data = await exercisesRes.json();
        setExercises(data.exercises || []);
      }

      if (muscleGroupsRes.ok) {
        const data = await muscleGroupsRes.json();
        setMuscleGroups(data.muscleGroups || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/exercises/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleOpenDialog = (exercise?: Exercise) => {
    if (exercise) {
      setEditingExercise(exercise);
      setFormData({
        name: exercise.name,
        type: exercise.type,
        muscle_group_id: exercise.muscle_group_id,
        primary_muscles: exercise.primary_muscles ? exercise.primary_muscles.join(', ') : '',
        secondary_muscles: exercise.secondary_muscles ? exercise.secondary_muscles.join(', ') : '',
        material: exercise.material,
        level: exercise.level,
        initial_position: exercise.initial_position,
        execution_eccentric: exercise.execution_eccentric,
        execution_isometric: exercise.execution_isometric,
        execution_concentric: exercise.execution_concentric,
        common_errors: exercise.common_errors ? exercise.common_errors.join('\n') : '',
        contraindications: exercise.contraindications ? exercise.contraindications.join('\n') : '',
        video_url: exercise.video_url || '',
        image_url: exercise.image_url || ''
      });
    } else {
      setEditingExercise(null);
      setFormData({
        name: '',
        type: '',
        muscle_group_id: '',
        primary_muscles: '',
        secondary_muscles: '',
        material: '',
        level: '',
        initial_position: '',
        execution_eccentric: '',
        execution_isometric: '',
        execution_concentric: '',
        common_errors: '',
        contraindications: '',
        video_url: '',
        image_url: ''
      });
    }
    setOpenDialog(true);
    setActiveTab(0);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingExercise(null);
  };

  const handleSaveExercise = async () => {
    try {
      if (!formData.name.trim()) {
        showError('Validación', 'El nombre del ejercicio es requerido');
        return;
      }
      if (!formData.muscle_group_id) {
        showError('Validación', 'Debes seleccionar un grupo muscular');
        return;
      }

      const exerciseData = {
        name: formData.name,
        type: formData.type,
        muscle_group_id: formData.muscle_group_id,
        primary_muscles: formData.primary_muscles.split(',').map(m => m.trim()).filter(m => m),
        secondary_muscles: formData.secondary_muscles.split(',').map(m => m.trim()).filter(m => m),
        material: formData.material,
        level: formData.level,
        initial_position: formData.initial_position,
        execution_eccentric: formData.execution_eccentric,
        execution_isometric: formData.execution_isometric,
        execution_concentric: formData.execution_concentric,
        common_errors: formData.common_errors.split('\n').filter(e => e.trim()),
        contraindications: formData.contraindications.split('\n').filter(c => c.trim()),
        video_url: formData.video_url || null,
        image_url: formData.image_url || null
      };

      const isEditing = !!editingExercise;
      const url = isEditing ? `/api/exercises/${editingExercise.id}` : '/api/exercises';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData)
      });

      if (response.ok) {
        showSuccess(
          isEditing ? 'Ejercicio Actualizado' : 'Ejercicio Creado',
          `El ejercicio "${formData.name}" ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`
        );
        await fetchData();
        await fetchAnalytics();
        handleCloseDialog();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'No se pudo guardar el ejercicio');
      }
    } catch (error) {
      console.error('Error saving exercise:', error);
      showError('Error', 'No se pudo guardar el ejercicio. Intenta de nuevo.');
    }
  };

  const handleDeleteClick = async (exercise: Exercise) => {
    const result = await showDeleteConfirmation(
      '¿Eliminar este ejercicio?',
      `El ejercicio "${exercise.name}" será eliminado permanentemente. Esta acción no se puede deshacer.`
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/exercises/${exercise.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Ejercicio Eliminado', `El ejercicio "${exercise.name}" ha sido eliminado exitosamente`);
        await fetchData();
        await fetchAnalytics();
      } else {
        showError('Error', 'No se pudo eliminar el ejercicio');
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      showError('Error', 'No se pudo eliminar el ejercicio. Intenta de nuevo.');
    }
  };

  const handleDuplicateExercise = async (exercise: Exercise) => {
    try {
      const response = await fetch(`/api/exercises/${exercise.id}/duplicate`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess('Ejercicio Duplicado', `Se ha creado una copia: "${data.exercise.name}"`);
        await fetchData();
        await fetchAnalytics();
      } else {
        const error = await response.json();
        showError('Error', error.error || 'No se pudo duplicar el ejercicio');
      }
    } catch (error) {
      console.error('Error duplicating exercise:', error);
      showError('Error', 'No se pudo duplicar el ejercicio');
    }
  };

  const handleExportExcel = async () => {
    try {
      const filters = {
        search: searchTerm,
        muscleGroup: selectedMuscleGroup,
        level: selectedDifficulty,
        type: selectedType
      };

      const response = await fetch('/api/exercises/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `biblioteca-ejercicios-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showSuccess('Exportación Exitosa', 'El archivo Excel ha sido descargado');
      } else {
        showError('Error', 'No se pudo exportar el archivo');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      showError('Error', 'No se pudo exportar el archivo');
    }
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = filteredExercises.map(ex => ex.id);
      setSelectedExercises(newSelected);
      return;
    }
    setSelectedExercises([]);
  };

  const handleSelectClick = (id: string) => {
    const selectedIndex = selectedExercises.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedExercises, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedExercises.slice(1));
    } else if (selectedIndex === selectedExercises.length - 1) {
      newSelected = newSelected.concat(selectedExercises.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedExercises.slice(0, selectedIndex),
        selectedExercises.slice(selectedIndex + 1),
      );
    }

    setSelectedExercises(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedExercises.length === 0) return;

    const result = await showDeleteConfirmation(
      `¿Eliminar ${selectedExercises.length} ejercicio(s)?`,
      'Esta acción no se puede deshacer.'
    );

    if (!result.isConfirmed) return;

    try {
      const deletePromises = selectedExercises.map(id =>
        fetch(`/api/exercises/${id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);

      showSuccess('Ejercicios Eliminados', `${selectedExercises.length} ejercicio(s) eliminado(s) exitosamente`);
      setSelectedExercises([]);
      await fetchData();
      await fetchAnalytics();
    } catch (error) {
      console.error('Error deleting selected exercises:', error);
      showError('Error', 'No se pudieron eliminar algunos ejercicios');
    }
  };

  const handleViewDetail = (exercise: Exercise) => {
    setSelectedExerciseDetail(exercise);
    setDetailModalOpen(true);
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.primary_muscles?.some(m => m.toLowerCase().includes(searchTerm.toLowerCase())) ||
      exercise.secondary_muscles?.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMuscleGroup = selectedMuscleGroup === 'all' || exercise.muscle_group_id === selectedMuscleGroup;
    const matchesDifficulty = selectedDifficulty === 'all' || exercise.level === selectedDifficulty;
    const matchesType = selectedType === 'all' || exercise.type === selectedType;

    return matchesSearch && matchesMuscleGroup && matchesDifficulty && matchesType;
  });

  const exerciseTypes = getUniqueValues(exercises, 'type');
  const difficultyLevels = getUniqueValues(exercises, 'level');

  const getDifficultyColor = (level: string) => {
    if (level.toLowerCase().includes('principiante')) return colorTokens.success;
    if (level.toLowerCase().includes('avanzado')) return colorTokens.danger;
    return colorTokens.warning;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: colorTokens.textPrimary,
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}
            >
              Biblioteca de Ejercicios
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
              Gestión profesional completa con {exercises.length} ejercicios en {muscleGroups.length} grupos musculares
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant={showAnalytics ? 'contained' : 'outlined'}
              startIcon={<AnalyticsIcon />}
              onClick={() => setShowAnalytics(!showAnalytics)}
              sx={{
                borderColor: colorTokens.info,
                color: showAnalytics ? '#000' : colorTokens.info,
                bgcolor: showAnalytics ? colorTokens.info : 'transparent',
                '&:hover': {
                  borderColor: colorTokens.info,
                  bgcolor: showAnalytics ? colorTokens.info : `${colorTokens.info}20`
                }
              }}
            >
              {showAnalytics ? 'Ocultar' : 'Ver'} Analytics
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportExcel}
              sx={{
                borderColor: colorTokens.success,
                color: colorTokens.success,
                '&:hover': {
                  borderColor: colorTokens.success,
                  bgcolor: `${colorTokens.success}20`
                }
              }}
            >
              Exportar Excel
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Analytics Section - Collapsible */}
      <Collapse in={showAnalytics}>
        <Box sx={{ mb: 4 }}>
          {analyticsData && (
            <ExerciseAnalyticsCharts data={analyticsData} />
          )}
        </Box>
      </Collapse>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}` }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Total Ejercicios
                </Typography>
                <Typography variant="h4" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                  {exercises.length}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}` }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Grupos Musculares
                </Typography>
                <Typography variant="h4" sx={{ color: colorTokens.success, fontWeight: 700 }}>
                  {muscleGroups.length}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}` }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Con Video
                </Typography>
                <Typography variant="h4" sx={{ color: colorTokens.info, fontWeight: 700 }}>
                  {exercises.filter(e => e.video_url).length}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}` }}>
              <CardContent>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Con Imagen
                </Typography>
                <Typography variant="h4" sx={{ color: colorTokens.warning, fontWeight: 700 }}>
                  {exercises.filter(e => e.image_url).length}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}`, mb: 3 }}>
        <CardContent>
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                placeholder="Buscar ejercicios..."
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
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Tipo</InputLabel>
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="Tipo"
                  sx={{
                    bgcolor: colorTokens.neutral200,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                    '& .MuiSelect-select': { color: colorTokens.textPrimary }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {exerciseTypes.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Grupo Muscular</InputLabel>
                <Select
                  value={selectedMuscleGroup}
                  onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                  label="Grupo Muscular"
                  sx={{
                    bgcolor: colorTokens.neutral200,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                    '& .MuiSelect-select': { color: colorTokens.textPrimary }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {muscleGroups.map(group => (
                    <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Nivel</InputLabel>
                <Select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  label="Nivel"
                  sx={{
                    bgcolor: colorTokens.neutral200,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                    '& .MuiSelect-select': { color: colorTokens.textPrimary }
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {difficultyLevels.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 6, md: 1.5 }}>
              <Button
                fullWidth
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('grid')}
                startIcon={<ViewModuleIcon />}
                sx={{
                  bgcolor: viewMode === 'grid' ? colorTokens.brand : 'transparent',
                  color: viewMode === 'grid' ? '#000' : colorTokens.brand,
                  borderColor: colorTokens.brand,
                  '&:hover': {
                    bgcolor: viewMode === 'grid' ? '#e6b800' : `${colorTokens.brand}20`,
                    borderColor: colorTokens.brand
                  },
                  height: '56px'
                }}
              >
                Tarjetas
              </Button>
            </Grid>

            <Grid size={{ xs: 6, md: 1.5 }}>
              <Button
                fullWidth
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
                startIcon={<ViewListIcon />}
                sx={{
                  bgcolor: viewMode === 'table' ? colorTokens.brand : 'transparent',
                  color: viewMode === 'table' ? '#000' : colorTokens.brand,
                  borderColor: colorTokens.brand,
                  '&:hover': {
                    bgcolor: viewMode === 'table' ? '#e6b800' : `${colorTokens.brand}20`,
                    borderColor: colorTokens.brand
                  },
                  height: '56px'
                }}
              >
                Tabla
              </Button>
            </Grid>
          </Grid>

          {/* Selected Actions */}
          {selectedExercises.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={`${selectedExercises.length} seleccionado(s)`}
                sx={{
                  bgcolor: `${colorTokens.brand}20`,
                  color: colorTokens.brand,
                  fontWeight: 600
                }}
              />
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                sx={{
                  borderColor: colorTokens.danger,
                  color: colorTokens.danger,
                  '&:hover': {
                    borderColor: colorTokens.danger,
                    bgcolor: `${colorTokens.danger}20`
                  }
                }}
              >
                Eliminar Seleccionados
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSelectedExercises([])}
                sx={{
                  borderColor: colorTokens.textSecondary,
                  color: colorTokens.textSecondary
                }}
              >
                Deseleccionar Todo
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Results + New Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
          Mostrando {filteredExercises.length} de {exercises.length} ejercicios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: colorTokens.brand,
            color: '#000',
            fontWeight: 600,
            '&:hover': { bgcolor: '#e6b800' }
          }}
        >
          Nuevo Ejercicio
        </Button>
      </Box>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {filteredExercises.map((exercise, index) => (
            <Grid key={exercise.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  sx={{
                    bgcolor: colorTokens.neutral300,
                    border: `1px solid ${selectedExercises.includes(exercise.id) ? colorTokens.brand : colorTokens.border}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: colorTokens.brand,
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${colorTokens.brand}40`
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Checkbox
                            checked={selectedExercises.includes(exercise.id)}
                            onChange={() => handleSelectClick(exercise.id)}
                            sx={{
                              color: colorTokens.brand,
                              '&.Mui-checked': { color: colorTokens.brand },
                              p: 0
                            }}
                          />
                          <Typography
                            variant="h6"
                            sx={{
                              color: colorTokens.textPrimary,
                              fontWeight: 600,
                              fontSize: { xs: '1rem', sm: '1.125rem' },
                              cursor: 'pointer',
                              '&:hover': { color: colorTokens.brand }
                            }}
                            onClick={() => handleViewDetail(exercise)}
                          >
                            {exercise.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={exercise.type}
                            size="small"
                            sx={{
                              bgcolor: `${colorTokens.info}20`,
                              color: colorTokens.info,
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                          <Chip
                            label={exercise.level}
                            size="small"
                            sx={{
                              bgcolor: `${getDifficultyColor(exercise.level)}20`,
                              color: getDifficultyColor(exercise.level),
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                        </Box>
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setMenuExercise(exercise);
                          }}
                          sx={{ color: colorTokens.textSecondary }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FitnessCenterIcon sx={{ fontSize: '1rem', color: colorTokens.textSecondary }} />
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          {exercise.muscle_group?.name || 'Sin grupo'}
                        </Typography>
                      </Box>

                      {exercise.material && (
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          <strong>Material:</strong> {exercise.material}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {exercise.video_url && (
                          <Chip
                            icon={<VideoIcon sx={{ fontSize: '1rem' }} />}
                            label="Video"
                            size="small"
                            sx={{
                              bgcolor: `${colorTokens.info}20`,
                              color: colorTokens.info,
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                        {exercise.image_url && (
                          <Chip
                            icon={<ImageIcon sx={{ fontSize: '1rem' }} />}
                            label="Imagen"
                            size="small"
                            sx={{
                              bgcolor: `${colorTokens.warning}20`,
                              color: colorTokens.warning,
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </Box>

                      {exercise.primary_muscles && exercise.primary_muscles.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary, fontWeight: 600 }}>
                            Músculos primarios:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                            {exercise.primary_muscles.slice(0, 3).map((muscle, i) => (
                              <Chip
                                key={i}
                                label={muscle}
                                size="small"
                                sx={{
                                  bgcolor: colorTokens.neutral200,
                                  color: colorTokens.textSecondary,
                                  fontSize: '0.65rem'
                                }}
                              />
                            ))}
                            {exercise.primary_muscles.length > 3 && (
                              <Chip
                                label={`+${exercise.primary_muscles.length - 3}`}
                                size="small"
                                sx={{
                                  bgcolor: colorTokens.neutral200,
                                  color: colorTokens.textSecondary,
                                  fontSize: '0.65rem'
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <TableContainer
          component={Card}
          sx={{
            bgcolor: colorTokens.neutral300,
            border: `1px solid ${colorTokens.border}`
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colorTokens.neutral200 }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedExercises.length > 0 && selectedExercises.length < filteredExercises.length}
                    checked={filteredExercises.length > 0 && selectedExercises.length === filteredExercises.length}
                    onChange={handleSelectAllClick}
                    sx={{
                      color: colorTokens.brand,
                      '&.Mui-checked': { color: colorTokens.brand }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Nivel</TableCell>
                <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Grupo Muscular</TableCell>
                <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Material</TableCell>
                <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }} align="center">Multimedia</TableCell>
                <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }} align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExercises
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((exercise) => {
                  const isSelected = selectedExercises.includes(exercise.id);
                  return (
                    <TableRow
                      key={exercise.id}
                      selected={isSelected}
                      sx={{
                        '&:hover': { bgcolor: `${colorTokens.brand}10` },
                        '&.Mui-selected': { bgcolor: `${colorTokens.brand}20` }
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectClick(exercise.id)}
                          sx={{
                            color: colorTokens.brand,
                            '&.Mui-checked': { color: colorTokens.brand }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: colorTokens.textPrimary,
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': { color: colorTokens.brand }
                          }}
                          onClick={() => handleViewDetail(exercise)}
                        >
                          {exercise.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={exercise.type}
                          size="small"
                          sx={{
                            bgcolor: `${colorTokens.info}20`,
                            color: colorTokens.info,
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={exercise.level}
                          size="small"
                          sx={{
                            bgcolor: `${getDifficultyColor(exercise.level)}20`,
                            color: getDifficultyColor(exercise.level),
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textSecondary }}>
                        {exercise.muscle_group?.name || '-'}
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textSecondary }}>
                        {exercise.material || '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {exercise.video_url && (
                            <VideoIcon sx={{ color: colorTokens.info, fontSize: '1.2rem' }} />
                          )}
                          {exercise.image_url && (
                            <ImageIcon sx={{ color: colorTokens.warning, fontSize: '1.2rem' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setAnchorEl(e.currentTarget);
                            setMenuExercise(exercise);
                          }}
                          sx={{ color: colorTokens.textSecondary }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredExercises.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              color: colorTokens.textSecondary,
              borderTop: `1px solid ${colorTokens.border}`,
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                color: colorTokens.textSecondary
              },
              '& .MuiTablePagination-select': {
                color: colorTokens.textPrimary
              }
            }}
          />
        </TableContainer>
      )}

      {/* Empty State */}
      {filteredExercises.length === 0 && (
        <Card sx={{ bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}`, mt: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <FitnessCenterIcon sx={{ fontSize: 64, color: colorTokens.textMuted, mb: 2 }} />
            <Typography variant="h6" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
              No se encontraron ejercicios
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
              Intenta ajustar los filtros de búsqueda
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              backgroundImage: 'none'
            }
          }
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuExercise) handleViewDetail(menuExercise);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" sx={{ color: colorTokens.info }} />
          </ListItemIcon>
          <ListItemText sx={{ color: colorTokens.textPrimary }}>Ver Detalles</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuExercise) handleOpenDialog(menuExercise);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: colorTokens.brand }} />
          </ListItemIcon>
          <ListItemText sx={{ color: colorTokens.textPrimary }}>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuExercise) handleDuplicateExercise(menuExercise);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <CopyIcon fontSize="small" sx={{ color: colorTokens.success }} />
          </ListItemIcon>
          <ListItemText sx={{ color: colorTokens.textPrimary }}>Duplicar</ListItemText>
        </MenuItem>
        <Divider sx={{ borderColor: colorTokens.border }} />
        <MenuItem
          onClick={() => {
            if (menuExercise) handleDeleteClick(menuExercise);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: colorTokens.danger }} />
          </ListItemIcon>
          <ListItemText sx={{ color: colorTokens.danger }}>Eliminar</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog - SAME AS BEFORE */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              backgroundImage: 'none'
            }
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${colorTokens.border}`, pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
              {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon sx={{ color: colorTokens.textSecondary }} />
            </IconButton>
          </Box>
        </DialogTitle>

        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            borderBottom: `1px solid ${colorTokens.border}`,
            px: 3,
            '& .MuiTab-root': {
              color: colorTokens.textSecondary,
              '&.Mui-selected': { color: colorTokens.brand }
            },
            '& .MuiTabs-indicator': { bgcolor: colorTokens.brand }
          }}
        >
          <Tab label="Información Básica" />
          <Tab label="Ejecución" />
          <Tab label="Errores y Contraindicaciones" />
          <Tab label="Media" />
        </Tabs>

        <DialogContent sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Nombre del Ejercicio"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <TextField
                fullWidth
                label="Tipo de Ejercicio"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="Ej: Compuesto, Aislamiento"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <FormControl fullWidth required>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>Grupo Muscular</InputLabel>
                <Select
                  value={formData.muscle_group_id}
                  onChange={(e) => setFormData({ ...formData, muscle_group_id: e.target.value })}
                  label="Grupo Muscular"
                  sx={{
                    bgcolor: colorTokens.neutral200,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.border },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                    '& .MuiSelect-select': { color: colorTokens.textPrimary }
                  }}
                >
                  {muscleGroups.map(group => (
                    <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Nivel de Dificultad"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                placeholder="Ej: Principiante, Intermedio, Avanzado"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <TextField
                fullWidth
                label="Material Necesario"
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                placeholder="Ej: Barra, Discos, Banco"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <TextField
                fullWidth
                label="Músculos Primarios (separados por comas)"
                value={formData.primary_muscles}
                onChange={(e) => setFormData({ ...formData, primary_muscles: e.target.value })}
                placeholder="Ej: Cuádriceps, Vasto lateral, Vasto medial"
                multiline
                rows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <TextField
                fullWidth
                label="Músculos Secundarios (separados por comas)"
                value={formData.secondary_muscles}
                onChange={(e) => setFormData({ ...formData, secondary_muscles: e.target.value })}
                placeholder="Ej: Glúteos, Isquiotibiales"
                multiline
                rows={2}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />
            </Stack>
          )}

          {activeTab === 1 && (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Posición Inicial"
                value={formData.initial_position}
                onChange={(e) => setFormData({ ...formData, initial_position: e.target.value })}
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <TextField
                fullWidth
                label="Fase Excéntrica"
                value={formData.execution_eccentric}
                onChange={(e) => setFormData({ ...formData, execution_eccentric: e.target.value })}
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <TextField
                fullWidth
                label="Fase Isométrica"
                value={formData.execution_isometric}
                onChange={(e) => setFormData({ ...formData, execution_isometric: e.target.value })}
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <TextField
                fullWidth
                label="Fase Concéntrica"
                value={formData.execution_concentric}
                onChange={(e) => setFormData({ ...formData, execution_concentric: e.target.value })}
                multiline
                rows={3}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />
            </Stack>
          )}

          {activeTab === 2 && (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Errores Comunes (uno por línea)"
                value={formData.common_errors}
                onChange={(e) => setFormData({ ...formData, common_errors: e.target.value })}
                multiline
                rows={6}
                placeholder="Error 1&#10;Error 2&#10;Error 3"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <TextField
                fullWidth
                label="Contraindicaciones (una por línea)"
                value={formData.contraindications}
                onChange={(e) => setFormData({ ...formData, contraindications: e.target.value })}
                multiline
                rows={6}
                placeholder="Contraindicación 1&#10;Contraindicación 2"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />
            </Stack>
          )}

          {activeTab === 3 && (
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="URL del Video"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VideoIcon sx={{ color: colorTokens.textSecondary }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              <TextField
                fullWidth
                label="URL de la Imagen"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ImageIcon sx={{ color: colorTokens.textSecondary }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colorTokens.neutral200,
                    '& fieldset': { borderColor: colorTokens.border },
                    '&:hover fieldset': { borderColor: colorTokens.brand },
                    '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                  },
                  '& .MuiInputBase-input': { color: colorTokens.textPrimary },
                  '& .MuiInputLabel-root': { color: colorTokens.textSecondary }
                }}
              />

              {formData.image_url && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary, mb: 1, display: 'block' }}>
                    Vista previa de la imagen:
                  </Typography>
                  <Box
                    component="img"
                    src={formData.image_url}
                    alt="Preview"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: 1,
                      border: `1px solid ${colorTokens.border}`
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ borderTop: `1px solid ${colorTokens.border}`, p: 2.5 }}>
          <Button onClick={handleCloseDialog} sx={{ color: colorTokens.textSecondary }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveExercise}
            disabled={!formData.name || !formData.type || !formData.muscle_group_id || !formData.level}
            sx={{
              bgcolor: colorTokens.brand,
              color: '#000',
              fontWeight: 600,
              '&:hover': { bgcolor: '#e6b800' },
              '&:disabled': { bgcolor: colorTokens.neutral400, color: colorTokens.textMuted }
            }}
          >
            {editingExercise ? 'Guardar Cambios' : 'Crear Ejercicio'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Modal */}
      <ExerciseDetailModal
        open={detailModalOpen}
        exercise={selectedExerciseDetail}
        onClose={() => setDetailModalOpen(false)}
      />
    </Box>
  );
}
