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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
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
  PlaylistAdd as PlaylistAddIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { alpha } from '@mui/material/styles';
import { useHydrated } from '@/hooks/useHydrated';
import { showSuccess, showError, showDeleteConfirmation } from '@/lib/notifications/MySwal';
import { motion } from 'framer-motion';
import { formatDateForDisplay } from '@/utils/dateUtils';
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
        background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
        borderRadius: 2,
        cursor: isDragging ? 'grabbing' : 'default',
        '&:hover': {
          borderColor: alpha(colorTokens.brand, 0.3)
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
                  bgcolor: alpha(colorTokens.info, 0.15),
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
                  bgcolor: alpha(colorTokens.warning, 0.15),
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
                bgcolor: alpha(colorTokens.info, 0.1),
                '&:hover': { bgcolor: alpha(colorTokens.info, 0.2) }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onRemove(exercise.exercise_id)}
              sx={{
                color: colorTokens.danger,
                bgcolor: alpha(colorTokens.danger, 0.1),
                '&:hover': { bgcolor: alpha(colorTokens.danger, 0.2) }
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [exerciseEditDialog, setExerciseEditDialog] = useState(false);
  const [currentEditingExercise, setCurrentEditingExercise] = useState<RoutineExercise | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Estados para tabs (3 tabs: Generales, Personalizadas, Asignadas)
  const [activeTab, setActiveTab] = useState(0);

  // Estados para asignación de rutinas a usuarios
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Estados para rutinas asignadas
  const [assignedRoutines, setAssignedRoutines] = useState<any[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  // Estados para edición de asignación
  const [editAssignmentDialog, setEditAssignmentDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'paused'>('active');

  const [formData, setFormData] = useState<Routine>({
    name: '',
    description: '',
    difficulty_level: 'Intermedio',
    estimated_duration: 60,
    muscle_group_focus: '',
    is_public: false,
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

  const loadAssignedRoutines = async () => {
    try {
      setLoadingAssigned(true);
      const response = await fetch('/api/user-routines');
      if (!response.ok) throw new Error('Error al cargar rutinas asignadas');
      const data = await response.json();
      setAssignedRoutines(data.userRoutines || []);
      console.log('✅ Rutinas asignadas cargadas:', data.userRoutines?.length || 0);
    } catch (error) {
      console.error('Error loading assigned routines:', error);
    } finally {
      setLoadingAssigned(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Tab 2 = Rutinas Asignadas
    if (newValue === 2 && assignedRoutines.length === 0) {
      loadAssignedRoutines();
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
      is_public: false,
      routine_exercises: []
    });
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    // Asegurar que cada ejercicio tenga un exercise_id único
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
    } catch (error) {
      console.error('Error deleting routine:', error);
      showError('Error', 'No se pudo eliminar la rutina. Intenta de nuevo.');
    }
  };

  // Función para abrir modal de asignación
  const handleOpenAssignDialog = async (routine: Routine) => {
    setSelectedRoutine(routine);
    setAssignDialog(true);

    // Cargar usuarios (clientes)
    try {
      const response = await fetch('/api/admin/clients');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        console.log('✅ Clientes cargados:', data.users?.length || 0);
      } else {
        throw new Error('Error al cargar clientes');
      }
    } catch (error) {
      console.error('Error loading clients:', error);
      showError('Error', 'No se pudieron cargar los clientes');
    }
  };

  // Función para asignar rutina a usuario
  const handleAssignRoutine = async () => {
    if (!selectedUserId || !selectedRoutine) {
      showError('Validación', 'Debes seleccionar un usuario');
      return;
    }

    try {
      const response = await fetch('/api/user-routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          routine_id: selectedRoutine.id,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          notes: assignNotes || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al asignar rutina');
      }

      showSuccess(
        'Rutina Asignada',
        `La rutina "${selectedRoutine.name}" ha sido asignada exitosamente`
      );

      // Limpiar y cerrar
      setAssignDialog(false);
      setSelectedUserId('');
      setAssignNotes('');
      setStartDate('');
      setEndDate('');
      setSelectedRoutine(null);

      // Recargar asignadas si estamos en esa tab
      if (activeTab === 2) {
        loadAssignedRoutines();
      }
    } catch (error: any) {
      console.error('Error assigning routine:', error);
      showError('Error', error.message || 'No se pudo asignar la rutina');
    }
  };

  // Función para eliminar asignación de rutina
  const handleDeleteAssignment = async (assignmentId: string, routineName: string, userName: string) => {
    const result = await showDeleteConfirmation(
      `Asignación de "${routineName}" a ${userName}`
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/user-routines/${assignmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar asignación');
      }

      showSuccess('Asignación Eliminada', 'La rutina ha sido desasignada exitosamente');
      loadAssignedRoutines();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      showError('Error', error.message || 'No se pudo eliminar la asignación');
    }
  };

  // Función para abrir el diálogo de edición de asignación
  const handleOpenEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setEditStartDate(assignment.start_date || '');
    setEditEndDate(assignment.end_date || '');
    setEditNotes(assignment.notes || '');
    setEditStatus(assignment.status || 'active');
    setEditAssignmentDialog(true);
  };

  // Función para guardar cambios de asignación
  const handleSaveAssignmentEdit = async () => {
    if (!editingAssignment) return;

    try {
      const response = await fetch(`/api/user-routines/${editingAssignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: editStartDate || undefined,
          end_date: editEndDate || undefined,
          notes: editNotes || undefined,
          status: editStatus
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar asignación');
      }

      showSuccess('Asignación Actualizada', 'Los cambios han sido guardados exitosamente');

      // Cerrar y limpiar
      setEditAssignmentDialog(false);
      setEditingAssignment(null);
      setEditStartDate('');
      setEditEndDate('');
      setEditNotes('');
      setEditStatus('active');

      // Recargar lista
      loadAssignedRoutines();
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      showError('Error', error.message || 'No se pudo actualizar la asignación');
    }
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

  return (
    <Box sx={{ pb: { xs: 10, lg: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
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
            {activeTab === 0 && 'Rutinas generales disponibles para todos los clientes'}
            {activeTab === 1 && 'Rutinas personalizadas asignadas a usuarios específicos'}
            {activeTab === 2 && 'Registro de todas las rutinas asignadas'}
          </Typography>
        </Box>
        {(activeTab === 0 || activeTab === 1) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              // Configurar is_public según el tab activo
              setFormData(prev => ({
                ...prev,
                is_public: activeTab === 0 // true para Generales, false para Personalizadas
              }));
              setCreateDialog(true);
            }}
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.black,
              fontWeight: 700,
              px: 3,
              '&:hover': { bgcolor: alpha(colorTokens.brand, 0.9) }
            }}
          >
            {activeTab === 0 ? 'Nueva Rutina General' : 'Nueva Rutina Personalizada'}
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: alpha(colorTokens.brand, 0.2), mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: colorTokens.textSecondary,
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              minHeight: 48,
              '&.Mui-selected': {
                color: colorTokens.brand
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: colorTokens.brand,
              height: 3
            }
          }}
        >
          <Tab label="Rutinas Generales" />
          <Tab label="Rutinas Personalizadas" />
          <Tab label="Rutinas Asignadas" />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Rutinas Generales (is_public = true) */}
      {activeTab === 0 && (
        <>
          {routines.filter(r => r.is_public).length === 0 ? (
            <Paper sx={{
              p: 6,
              textAlign: 'center',
              background: alpha(colorTokens.surfaceLevel2, 0.9),
              border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
              borderRadius: 3
            }}>
              <PlaylistAddIcon sx={{ fontSize: 80, color: colorTokens.textMuted, mb: 2 }} />
              <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                No hay rutinas generales creadas
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textMuted, mt: 1 }}>
                Las rutinas generales están disponibles para todos los clientes
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {routines.filter(r => r.is_public).map((routine) => (
                <Grid key={routine.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card sx={{
                      background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
                      border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                      borderRadius: 3,
                      height: '100%'
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 1 }}>
                          {routine.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label="General"
                            size="small"
                            sx={{
                              bgcolor: alpha(colorTokens.success, 0.15),
                              color: colorTokens.success,
                              fontWeight: 600
                            }}
                          />
                          <Chip
                            label={routine.difficulty_level}
                            size="small"
                            sx={{
                              bgcolor: alpha(colorTokens.info, 0.15),
                              color: colorTokens.info,
                              fontWeight: 600
                            }}
                          />
                          {routine.estimated_duration && (
                            <Chip
                              icon={<TimerIcon sx={{ fontSize: 14 }} />}
                              label={`${routine.estimated_duration} min`}
                              size="small"
                              sx={{
                                bgcolor: alpha(colorTokens.warning, 0.15),
                                color: colorTokens.warning
                              }}
                            />
                          )}
                          <Chip
                            label={`${routine.routine_exercises?.length || 0} ejercicios`}
                            size="small"
                            sx={{
                              bgcolor: alpha(colorTokens.brand, 0.15),
                              color: colorTokens.brand
                            }}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {/* Rutinas Generales NO necesitan asignación - están disponibles para todos */}
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRoutine(routine)}
                            sx={{
                              color: colorTokens.info,
                              bgcolor: alpha(colorTokens.info, 0.1),
                              '&:hover': { bgcolor: alpha(colorTokens.info, 0.2) }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRoutine(routine.id!)}
                            sx={{
                              color: colorTokens.danger,
                              bgcolor: alpha(colorTokens.danger, 0.1),
                              '&:hover': { bgcolor: alpha(colorTokens.danger, 0.2) }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {routine.description && (
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        {routine.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}
        </>
      )}

      {/* Tab Panel 1: Rutinas Personalizadas (is_public = false) */}
      {activeTab === 1 && (
        <>
          {routines.filter(r => !r.is_public).length === 0 ? (
            <Paper sx={{
              p: 6,
              textAlign: 'center',
              background: alpha(colorTokens.surfaceLevel2, 0.9),
              border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
              borderRadius: 3
            }}>
              <PersonAddIcon sx={{ fontSize: 80, color: colorTokens.textMuted, mb: 2 }} />
              <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                No hay rutinas personalizadas creadas
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textMuted, mt: 1 }}>
                Las rutinas personalizadas se asignan a usuarios específicos
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {routines.filter(r => !r.is_public).map((routine) => (
                <Grid key={routine.id} size={{ xs: 12, md: 6, lg: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card sx={{
                      background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
                      border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                      borderRadius: 3,
                      height: '100%'
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: colorTokens.textPrimary, mb: 1 }}>
                          {routine.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label="Personalizada"
                            size="small"
                            sx={{
                              bgcolor: alpha(colorTokens.warning, 0.15),
                              color: colorTokens.warning,
                              fontWeight: 600
                            }}
                          />
                          <Chip
                            label={routine.difficulty_level}
                            size="small"
                            sx={{
                              bgcolor: alpha(colorTokens.info, 0.15),
                              color: colorTokens.info,
                              fontWeight: 600
                            }}
                          />
                          {routine.estimated_duration && (
                            <Chip
                              icon={<TimerIcon sx={{ fontSize: 14 }} />}
                              label={`${routine.estimated_duration} min`}
                              size="small"
                              sx={{
                                bgcolor: alpha(colorTokens.warning, 0.15),
                                color: colorTokens.warning
                              }}
                            />
                          )}
                          <Chip
                            label={`${routine.routine_exercises?.length || 0} ejercicios`}
                            size="small"
                            sx={{
                              bgcolor: alpha(colorTokens.brand, 0.15),
                              color: colorTokens.brand
                            }}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Asignar a Usuario">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenAssignDialog(routine)}
                            sx={{
                              color: colorTokens.success,
                              bgcolor: alpha(colorTokens.success, 0.1),
                              '&:hover': { bgcolor: alpha(colorTokens.success, 0.2) }
                            }}
                          >
                            <PersonAddIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleEditRoutine(routine)}
                            sx={{
                              color: colorTokens.info,
                              bgcolor: alpha(colorTokens.info, 0.1),
                              '&:hover': { bgcolor: alpha(colorTokens.info, 0.2) }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRoutine(routine.id!)}
                            sx={{
                              color: colorTokens.danger,
                              bgcolor: alpha(colorTokens.danger, 0.1),
                              '&:hover': { bgcolor: alpha(colorTokens.danger, 0.2) }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {routine.description && (
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        {routine.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}
        </>
      )}

      {/* Tab Panel 2: Rutinas Asignadas */}
      {activeTab === 2 && (
        <>
          {loadingAssigned ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: colorTokens.brand }} />
            </Box>
          ) : assignedRoutines.length === 0 ? (
            <Paper sx={{
              p: 6,
              textAlign: 'center',
              background: alpha(colorTokens.surfaceLevel2, 0.9),
              border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
              borderRadius: 3
            }}>
              <PersonAddIcon sx={{ fontSize: 80, color: colorTokens.textMuted, mb: 2 }} />
              <Typography variant="h6" sx={{ color: colorTokens.textSecondary }}>
                No hay rutinas asignadas
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textMuted, mt: 1 }}>
                Las rutinas asignadas a usuarios aparecerán aquí
              </Typography>
            </Paper>
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                background: alpha(colorTokens.surfaceLevel2, 0.9),
                border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                borderRadius: 3
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(colorTokens.surfaceLevel3, 0.5) }}>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                      Rutina
                    </TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                      Usuario
                    </TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                      Asignado por
                    </TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                      Fecha Inicio
                    </TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                      Fecha Fin
                    </TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
                      Estado
                    </TableCell>
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }} align="right">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignedRoutines.map((assignment) => (
                    <TableRow
                      key={assignment.id}
                      sx={{
                        '&:hover': { bgcolor: alpha(colorTokens.brand, 0.05) },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <TableCell sx={{ color: colorTokens.textPrimary }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {assignment.routine?.name || 'N/A'}
                        </Typography>
                        {assignment.routine?.difficulty_level && (
                          <Chip
                            label={assignment.routine.difficulty_level}
                            size="small"
                            sx={{
                              mt: 0.5,
                              bgcolor: alpha(colorTokens.info, 0.15),
                              color: colorTokens.info,
                              fontSize: '0.7rem'
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textSecondary }}>
                        <Typography variant="body2">
                          {assignment.user?.firstName} {assignment.user?.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
                          {assignment.user?.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textSecondary }}>
                        {assignment.assigned_by_user?.firstName} {assignment.assigned_by_user?.lastName}
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textSecondary }}>
                        {assignment.start_date ? formatDateForDisplay(assignment.start_date) : '-'}
                      </TableCell>
                      <TableCell sx={{ color: colorTokens.textSecondary }}>
                        {assignment.end_date ? formatDateForDisplay(assignment.end_date) : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.status === 'active' ? 'Activa' : assignment.status === 'completed' ? 'Completada' : 'Pausada'}
                          size="small"
                          sx={{
                            bgcolor: assignment.status === 'active'
                              ? alpha(colorTokens.success, 0.15)
                              : assignment.status === 'completed'
                              ? alpha(colorTokens.info, 0.15)
                              : alpha(colorTokens.warning, 0.15),
                            color: assignment.status === 'active'
                              ? colorTokens.success
                              : assignment.status === 'completed'
                              ? colorTokens.info
                              : colorTokens.warning,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Editar Asignación">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditAssignment(assignment)}
                              sx={{
                                color: colorTokens.info,
                                bgcolor: alpha(colorTokens.info, 0.1),
                                '&:hover': { bgcolor: alpha(colorTokens.info, 0.2) }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar Asignación">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAssignment(
                                assignment.id,
                                assignment.routine?.name || 'rutina',
                                `${assignment.user?.firstName} ${assignment.user?.lastName}`
                              )}
                              sx={{
                                color: colorTokens.danger,
                                bgcolor: alpha(colorTokens.danger, 0.1),
                                '&:hover': { bgcolor: alpha(colorTokens.danger, 0.2) }
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
          )}
        </>
      )}

      {/* Dialog de creación - DISEÑO DE 2 COLUMNAS */}
      <Dialog
        open={createDialog}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            background: colorTokens.surfaceLevel2,
            borderRadius: 3,
            maxHeight: '90vh',
            height: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(colorTokens.brand, 0.2)}`
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>
              {editingRoutine ? 'Editar Rutina' : formData.is_public ? 'Nueva Rutina General' : 'Nueva Rutina Personalizada'}
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mt: 0.5 }}>
              {formData.is_public ? 'Estará disponible para todos los clientes' : 'Solo para usuarios asignados'}
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
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Dificultad</InputLabel>
                <Select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  label="Dificultad"
                >
                  <MenuItem value="Principiante">Principiante</MenuItem>
                  <MenuItem value="Intermedio">Intermedio</MenuItem>
                  <MenuItem value="Avanzado">Avanzado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Duración Estimada (min)"
                type="number"
                value={formData.estimated_duration || ''}
                onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3, borderColor: alpha(colorTokens.brand, 0.2) }} />

          {/* DISEÑO DE 2 COLUMNAS */}
          <Grid container spacing={3}>
            {/* COLUMNA IZQUIERDA: Ejercicios disponibles */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{
                p: 2,
                bgcolor: alpha(colorTokens.surfaceLevel3, 0.5),
                borderRadius: 2,
                height: '500px',
                display: 'flex',
                flexDirection: 'column'
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
                        background: alpha(colorTokens.surfaceLevel2, 0.8),
                        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: alpha(colorTokens.brand, 0.1),
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
                bgcolor: alpha(colorTokens.brand, 0.05),
                borderRadius: 2,
                height: '500px',
                display: 'flex',
                flexDirection: 'column'
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

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(colorTokens.brand, 0.2)}` }}>
          <Button onClick={handleCloseDialog} sx={{ color: colorTokens.textSecondary }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveRoutine}
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.black,
              fontWeight: 700,
              '&:hover': { bgcolor: alpha(colorTokens.brand, 0.9) }
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
        PaperProps={{
          sx: {
            background: colorTokens.surfaceLevel2,
            borderRadius: 3
          }
        }}
      >
        <DialogTitle>Editar Parámetros</DialogTitle>
        <DialogContent>
          {currentEditingExercise && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
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
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExerciseEditDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveExerciseParams}
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.black,
              '&:hover': { bgcolor: alpha(colorTokens.brand, 0.9) }
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Asignación a Usuario */}
      <Dialog
        open={assignDialog}
        onClose={() => setAssignDialog(false)}
        maxWidth="sm"
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
        <DialogTitle sx={{
          borderBottom: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>
              Asignar Rutina a Usuario
            </Typography>
            {selectedRoutine && (
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mt: 0.5 }}>
                {selectedRoutine.name}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setAssignDialog(false)} sx={{ color: colorTokens.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>
                  Usuario *
                </InputLabel>
                <Select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  label="Usuario *"
                  sx={{
                    bgcolor: alpha(colorTokens.surfaceLevel2, 0.5),
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(colorTokens.brand, 0.2)
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(colorTokens.brand, 0.4)
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.brand
                    }
                  }}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} - {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fecha de Inicio"
                type="date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: alpha(colorTokens.surfaceLevel2, 0.5),
                    color: colorTokens.textPrimary
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(colorTokens.brand, 0.2)
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    cursor: 'pointer'
                  },
                  '& input[type="date"]': {
                    colorScheme: 'dark'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fecha de Fin"
                type="date"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: alpha(colorTokens.surfaceLevel2, 0.5),
                    color: colorTokens.textPrimary
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(colorTokens.brand, 0.2)
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    cursor: 'pointer'
                  },
                  '& input[type="date"]': {
                    colorScheme: 'dark'
                  }
                }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                label="Notas para el cliente"
                multiline
                rows={4}
                fullWidth
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
                placeholder="Instrucciones especiales, recomendaciones, objetivos..."
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: alpha(colorTokens.surfaceLevel2, 0.5)
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(colorTokens.brand, 0.2)
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(colorTokens.brand, 0.1)}` }}>
          <Button
            onClick={() => setAssignDialog(false)}
            sx={{ color: colorTokens.textSecondary }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssignRoutine}
            variant="contained"
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.black,
              fontWeight: 600,
              '&:hover': { bgcolor: alpha(colorTokens.brand, 0.9) }
            }}
          >
            Asignar Rutina
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de edición de asignación */}
      <Dialog
        open={editAssignmentDialog}
        onClose={() => setEditAssignmentDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: colorTokens.surfaceLevel2,
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(colorTokens.brand, 0.2)}`
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>
              Editar Asignación de Rutina
            </Typography>
            {editingAssignment && (
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mt: 0.5 }}>
                {editingAssignment.routine?.name} - {editingAssignment.user?.firstName} {editingAssignment.user?.lastName}
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={() => setEditAssignmentDialog(false)}
            sx={{ color: colorTokens.textSecondary }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: colorTokens.textSecondary }}>
                  Estado
                </InputLabel>
                <Select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as 'active' | 'completed' | 'paused')}
                  label="Estado"
                  sx={{
                    bgcolor: alpha(colorTokens.surfaceLevel2, 0.5),
                    color: colorTokens.textPrimary
                  }}
                >
                  <MenuItem value="active">Activa</MenuItem>
                  <MenuItem value="paused">Pausada</MenuItem>
                  <MenuItem value="completed">Completada</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fecha de Inicio"
                type="date"
                fullWidth
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: alpha(colorTokens.surfaceLevel2, 0.5),
                    color: colorTokens.textPrimary
                  },
                  '& .MuiInputLabel-root': {
                    color: colorTokens.textSecondary
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    cursor: 'pointer'
                  },
                  '& input[type="date"]': {
                    colorScheme: 'dark'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Fecha de Fin"
                type="date"
                fullWidth
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: alpha(colorTokens.surfaceLevel2, 0.5),
                    color: colorTokens.textPrimary
                  },
                  '& .MuiInputLabel-root': {
                    color: colorTokens.textSecondary
                  },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    filter: 'invert(1)',
                    cursor: 'pointer'
                  },
                  '& input[type="date"]': {
                    colorScheme: 'dark'
                  }
                }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                label="Notas del Entrenador"
                multiline
                rows={4}
                fullWidth
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Notas adicionales sobre la asignación..."
                sx={{
                  '& .MuiInputBase-root': {
                    bgcolor: alpha(colorTokens.surfaceLevel2, 0.5),
                    color: colorTokens.textPrimary
                  },
                  '& .MuiInputLabel-root': {
                    color: colorTokens.textSecondary
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(colorTokens.brand, 0.2)}` }}>
          <Button
            onClick={() => setEditAssignmentDialog(false)}
            sx={{
              color: colorTokens.textSecondary,
              '&:hover': { bgcolor: alpha(colorTokens.neutral300, 0.1) }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAssignmentEdit}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.black,
              fontWeight: 600,
              '&:hover': { bgcolor: alpha(colorTokens.brand, 0.9) }
            }}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
