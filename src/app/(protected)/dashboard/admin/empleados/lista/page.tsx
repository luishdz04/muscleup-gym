'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PersonAdd as PersonAddIcon,
  Fingerprint as FingerprintIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

// IMPORTAR COMPONENTE DE EDICIÓN
import EmployeeFormDialog from '@/components/dashboard/admin/EmployeeFormDialog';

// 🎨 DARK PRO TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  success: '#388E3C',
  error: '#D32F2F',
  warning: '#F57C00',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888'
};

interface Employee {
  id: string;
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  salary: number;
  hireDate: string;
  profilePictureUrl?: string;
  fingerprint: boolean;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ListaEmpleados = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // ESTADOS PARA MODALES
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (positionFilter) params.append('position', positionFilter);
      if (departmentFilter) params.append('department', departmentFilter);

      const response = await fetch(`/api/admin/employees?${params}`);
      const result = await response.json();

      if (response.ok) {
        setEmployees(result.employees);
      } else {
        toast.error(result.error || 'Error al cargar empleados');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [statusFilter, positionFilter, departmentFilter]);

  const filteredEmployees = employees.filter(emp => 
    search === '' || 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.position.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return darkProTokens.success;
      case 'inactive': return darkProTokens.textDisabled;
      case 'suspended': return darkProTokens.error;
      default: return darkProTokens.textDisabled;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'suspended': return 'Suspendido';
      default: return status;
    }
  };

  // HANDLERS PARA ACCIONES
  const handleView = (employee: Employee) => {
    console.log('👁️ Ver empleado:', employee.firstName, employee.lastName);
    setSelectedEmployee(employee);
    setViewDialogOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    console.log('✏️ Editar empleado:', employee.firstName, employee.lastName);
    setSelectedEmployee(employee);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    console.log('🗑️ Eliminar empleado:', employee.firstName, employee.lastName);
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;

    try {
      setDeleting(true);
      console.log('🗑️ Eliminando empleado:', selectedEmployee.id);

      const response = await fetch(`/api/admin/employees/${selectedEmployee.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success(`Empleado ${selectedEmployee.firstName} ${selectedEmployee.lastName} eliminado correctamente`);
        
        // Actualizar lista
        setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
        
        // Cerrar modal
        setDeleteDialogOpen(false);
        setSelectedEmployee(null);
      } else {
        const result = await response.json();
        toast.error(result.error || 'Error al eliminar empleado');
      }
    } catch (error) {
      console.error('❌ Error eliminando empleado:', error);
      toast.error('Error de conexión al eliminar empleado');
    } finally {
      setDeleting(false);
    }
  };

  // HANDLER PARA GUARDAR CAMBIOS
  const handleSaveEmployee = async (employeeData: any) => {
    try {
      console.log('💾 Guardando cambios empleado:', employeeData);

      const url = selectedEmployee 
        ? `/api/admin/employees/${selectedEmployee.id}`
        : '/api/admin/employees';
      
      const method = selectedEmployee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData),
      });

      if (response.ok) {
        const result = await response.json();
        
        toast.success(selectedEmployee 
          ? `Empleado ${employeeData.firstName} ${employeeData.lastName} actualizado correctamente`
          : `Empleado ${employeeData.firstName} ${employeeData.lastName} creado correctamente`
        );

        // Actualizar lista
        await fetchEmployees();
        
        // Cerrar modal
        setEditDialogOpen(false);
        setSelectedEmployee(null);
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Error al guardar empleado');
      }
    } catch (error: any) {
      console.error('❌ Error guardando empleado:', error);
      throw error; // Re-throw para que el modal lo maneje
    }
  };

  // CERRAR MODALES
  const handleCloseView = () => {
    setViewDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleCloseEdit = () => {
    setEditDialogOpen(false);
    setSelectedEmployee(null);
  };

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  return (
    <Box sx={{ 
      p: 3,
      minHeight: '100vh',
      background: darkProTokens.background,
      color: darkProTokens.textPrimary
    }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
          👥 Lista de Empleados
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => router.push('/dashboard/admin/empleados/registrar')}
          sx={{
            backgroundColor: darkProTokens.primary,
            color: darkProTokens.background,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: darkProTokens.primaryHover
            }
          }}
        >
          Nuevo Empleado
        </Button>
      </Box>

      {/* STATS CARDS */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: darkProTokens.surfaceLevel1,
            border: `1px solid ${darkProTokens.success}30`
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: darkProTokens.success, fontWeight: 700 }}>
                {employees.filter(e => e.status === 'active').length}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Empleados Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: darkProTokens.surfaceLevel1,
            border: `1px solid ${darkProTokens.primary}30`
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
                {employees.length}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Total Empleados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: darkProTokens.surfaceLevel1,
            border: `1px solid ${darkProTokens.warning}30`
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: darkProTokens.warning, fontWeight: 700 }}>
                {employees.filter(e => e.fingerprint).length}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Con Huella Digital
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: darkProTokens.surfaceLevel1,
            border: `1px solid ${darkProTokens.error}30`
          }}>
            <CardContent>
              <Typography variant="h4" sx={{ color: darkProTokens.error, fontWeight: 700 }}>
                {employees.filter(e => e.status === 'suspended').length}
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Suspendidos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FILTROS */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: darkProTokens.surfaceLevel1,
        border: `1px solid ${darkProTokens.primary}20`
      }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Buscar empleados..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: darkProTokens.textSecondary }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: darkProTokens.textPrimary,
                  '& fieldset': { borderColor: darkProTokens.textDisabled },
                  '&:hover fieldset': { borderColor: darkProTokens.primary },
                  '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              select
              label="Estado"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: darkProTokens.textPrimary,
                  '& fieldset': { borderColor: darkProTokens.textDisabled },
                  '&:hover fieldset': { borderColor: darkProTokens.primary },
                  '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                },
                '& .MuiInputLabel-root': { color: darkProTokens.textSecondary },
                '& .MuiInputLabel-root.Mui-focused': { color: darkProTokens.primary }
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="inactive">Inactivo</MenuItem>
              <MenuItem value="suspended">Suspendido</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Puesto"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: darkProTokens.textPrimary,
                  '& fieldset': { borderColor: darkProTokens.textDisabled },
                  '&:hover fieldset': { borderColor: darkProTokens.primary },
                  '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                },
                '& .MuiInputLabel-root': { color: darkProTokens.textSecondary },
                '& .MuiInputLabel-root.Mui-focused': { color: darkProTokens.primary }
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Entrenador">Entrenador</MenuItem>
              <MenuItem value="Recepcionista">Recepcionista</MenuItem>
              <MenuItem value="Manager">Manager</MenuItem>
              <MenuItem value="Limpieza">Limpieza</MenuItem>
              <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              select
              label="Departamento"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: darkProTokens.textPrimary,
                  '& fieldset': { borderColor: darkProTokens.textDisabled },
                  '&:hover fieldset': { borderColor: darkProTokens.primary },
                  '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                },
                '& .MuiInputLabel-root': { color: darkProTokens.textSecondary },
                '& .MuiInputLabel-root.Mui-focused': { color: darkProTokens.primary }
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Operaciones">Operaciones</MenuItem>
              <MenuItem value="Ventas">Ventas</MenuItem>
              <MenuItem value="Administración">Administración</MenuItem>
              <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* TABLA */}
      <TableContainer component={Paper} sx={{ 
        background: darkProTokens.surfaceLevel1,
        border: `1px solid ${darkProTokens.primary}20`
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color: darkProTokens.primary, fontWeight: 600 }}>Empleado</TableCell>
              <TableCell sx={{ color: darkProTokens.primary, fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ color: darkProTokens.primary, fontWeight: 600 }}>Puesto</TableCell>
              <TableCell sx={{ color: darkProTokens.primary, fontWeight: 600 }}>Departamento</TableCell>
              <TableCell sx={{ color: darkProTokens.primary, fontWeight: 600 }}>Estado</TableCell>
              <TableCell sx={{ color: darkProTokens.primary, fontWeight: 600 }}>Huella</TableCell>
              <TableCell sx={{ color: darkProTokens.primary, fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', color: darkProTokens.textSecondary }}>
                  Cargando empleados...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', color: darkProTokens.textSecondary }}>
                  No se encontraron empleados
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
                <TableRow key={employee.id} sx={{ '&:hover': { backgroundColor: `${darkProTokens.primary}05` } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar 
                        src={employee.profilePictureUrl || undefined}
                        sx={{ 
                          bgcolor: darkProTokens.primary,
                          color: darkProTokens.background,
                          fontWeight: 600
                        }}
                        imgProps={{
                          onError: () => {
                            console.error('❌ Error loading image:', employee.profilePictureUrl);
                          }
                        }}
                      >
                        {employee.firstName[0]}{employee.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                          {employee.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: darkProTokens.textSecondary }}>
                    {employee.email}
                  </TableCell>
                  <TableCell sx={{ color: darkProTokens.textPrimary }}>
                    {employee.position}
                  </TableCell>
                  <TableCell sx={{ color: darkProTokens.textSecondary }}>
                    {employee.department || 'Sin asignar'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(employee.status)}
                      size="small"
                      sx={{
                        backgroundColor: `${getStatusColor(employee.status)}20`,
                        color: getStatusColor(employee.status),
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {employee.fingerprint ? (
                      <Tooltip title="Huella registrada">
                        <FingerprintIcon sx={{ color: darkProTokens.success }} />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Sin huella registrada">
                        <FingerprintIcon sx={{ color: darkProTokens.textDisabled }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Ver empleado">
                        <IconButton 
                          size="small" 
                          sx={{ color: darkProTokens.primary }}
                          onClick={() => handleView(employee)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar empleado">
                        <IconButton 
                          size="small" 
                          sx={{ color: darkProTokens.warning }}
                          onClick={() => handleEdit(employee)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar empleado">
                        <IconButton 
                          size="small" 
                          sx={{ color: darkProTokens.error }}
                          onClick={() => handleDeleteClick(employee)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL DE VER EMPLEADO (READONLY) */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseView}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: darkProTokens.surfaceLevel2,
            color: darkProTokens.textPrimary
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${darkProTokens.primary}30`,
          color: darkProTokens.primary,
          fontWeight: 600
        }}>
          👁️ Ver Empleado
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedEmployee && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary }}>
                    Nombre Completo
                  </Typography>
                  <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary }}>
                    Email
                  </Typography>
                  <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                    {selectedEmployee.email}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary }}>
                    Teléfono
                  </Typography>
                  <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                    {selectedEmployee.phone}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary }}>
                    Puesto
                  </Typography>
                  <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, fontWeight: 600 }}>
                    {selectedEmployee.position}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary }}>
                    Departamento
                  </Typography>
                  <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                    {selectedEmployee.department || 'Sin asignar'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary }}>
                    Salario
                  </Typography>
                  <Typography variant="body1" sx={{ color: darkProTokens.success, fontWeight: 600 }}>
                    ${selectedEmployee.salary?.toLocaleString() || 'No especificado'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary }}>
                    Fecha de Contratación
                  </Typography>
                  <Typography variant="body1" sx={{ color: darkProTokens.textPrimary }}>
                    {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString('es-MX') : 'No especificada'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary }}>
                    Estado
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedEmployee.status)}
                    size="small"
                    sx={{
                      backgroundColor: `${getStatusColor(selectedEmployee.status)}20`,
                      color: getStatusColor(selectedEmployee.status),
                      fontWeight: 600
                    }}
                  />
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: darkProTokens.textSecondary }}>
                    Huella Dactilar
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FingerprintIcon sx={{ 
                      color: selectedEmployee.fingerprint ? darkProTokens.success : darkProTokens.textDisabled 
                    }} />
                    <Typography variant="body1" sx={{ 
                      color: selectedEmployee.fingerprint ? darkProTokens.success : darkProTokens.textDisabled,
                      fontWeight: 600
                    }}>
                      {selectedEmployee.fingerprint ? 'Registrada' : 'No registrada'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: `1px solid ${darkProTokens.primary}30` }}>
          <Button onClick={handleCloseView} sx={{ color: darkProTokens.textSecondary }}>
            Cerrar
          </Button>
          <Button 
            variant="outlined"
            onClick={() => {
              handleCloseView();
              if (selectedEmployee) {
                handleEdit(selectedEmployee);
              }
            }}
            sx={{
              borderColor: darkProTokens.warning,
              color: darkProTokens.warning,
              '&:hover': {
                backgroundColor: `${darkProTokens.warning}10`,
                borderColor: darkProTokens.warning
              }
            }}
          >
            Editar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL DE EDITAR EMPLEADO */}
      {selectedEmployee && (
        <EmployeeFormDialog
          open={editDialogOpen}
          onClose={handleCloseEdit}
          employee={selectedEmployee}
          onSave={handleSaveEmployee}
        />
      )}

      {/* MODAL DE CONFIRMAR ELIMINACIÓN */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: darkProTokens.surfaceLevel2,
            color: darkProTokens.textPrimary,
            border: `2px solid ${darkProTokens.error}40`
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: darkProTokens.error,
          fontWeight: 600
        }}>
          <WarningIcon />
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <>
              <Typography variant="body1" sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
                ¿Estás seguro de que deseas eliminar al empleado:
              </Typography>
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 2,
                  backgroundColor: `${darkProTokens.warning}20`,
                  color: darkProTokens.textPrimary,
                  border: `1px solid ${darkProTokens.warning}40`
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </Typography>
                <Typography variant="body2">
                  {selectedEmployee.position} - {selectedEmployee.department}
                </Typography>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  {selectedEmployee.email}
                </Typography>
              </Alert>
              <Typography variant="body2" sx={{ color: darkProTokens.error, fontWeight: 600 }}>
                ⚠️ Esta acción eliminará:
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, ml: 2 }}>
                • Todos los datos del empleado
                <br />
                • Archivos asociados (foto de perfil)
                <br />
                • Datos de huella dactilar (BD + F22)
                <br />
                • Historial de registros
              </Typography>
              <Typography variant="body2" sx={{ color: darkProTokens.error, fontWeight: 600, mt: 2 }}>
                Esta acción no se puede deshacer.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button 
            onClick={handleCloseDelete}
            disabled={deleting}
            sx={{ color: darkProTokens.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
            sx={{
              backgroundColor: darkProTokens.error,
              '&:hover': {
                backgroundColor: '#B71C1C'
              }
            }}
          >
            {deleting ? 'Eliminando...' : 'Eliminar Empleado'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListaEmpleados;