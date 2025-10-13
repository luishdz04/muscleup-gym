"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Grid from "@mui/material/Grid";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Fingerprint as FingerprintIcon,
  PersonAdd as PersonAddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

import EmployeeFormDialog from "@/components/dashboard/admin/EmployeeFormDialog";
import { colorTokens } from "@/theme";
import { useNotifications } from "@/hooks/useNotifications";
import { useHydrated } from "@/hooks/useHydrated";

interface EmployeeRecord {
  id: string | null;
  user_id: string;
  firstName: string;
  lastName: string;
  email: string;
  rol: "empleado" | "admin";
  phone: string | null;
  position: string | null;
  department: string | null;
  status: string | null;
  salary: number | null;
  hireDate: string | null;
  profilePictureUrl: string | null;
  fingerprint: boolean;
  emergencyContact: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  };
  address: {
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  };
  birthDate: string | null;
  gender: string | null;
  maritalStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string | null;
  hasEmployeeRecord: boolean;
}

const palette = {
  background: colorTokens.neutral0,
  surface1: colorTokens.surfaceLevel1,
  surface2: colorTokens.surfaceLevel2,
  surface3: colorTokens.surfaceLevel3,
  primary: colorTokens.brand,
  primaryHover: colorTokens.brandHover,
  success: colorTokens.success,
  danger: colorTokens.danger,
  warning: colorTokens.warning,
  info: colorTokens.info,
  textPrimary: colorTokens.textPrimary,
  textSecondary: colorTokens.textSecondary,
  textDisabled: colorTokens.textDisabled,
  textOnBrand: colorTokens.textOnBrand,
  divider: colorTokens.divider,
  shadow: colorTokens.shadow
};

const ROLE_META: Record<"admin" | "empleado", { label: string; color: string; background: string }> = {
  admin: {
    label: "Administrador",
    color: palette.primary,
    background: `${palette.primary}20`
  },
  empleado: {
    label: "Empleado",
    color: palette.success,
    background: `${palette.success}20`
  }
};

const FILTER_FIELD_SX = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: palette.surface2,
    color: palette.textPrimary,
    borderRadius: 2,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    "& fieldset": {
      borderColor: palette.textSecondary,
      borderWidth: "2px"
    },
    "&:hover fieldset": {
      borderColor: palette.primary
    },
    "&.Mui-focused fieldset": {
      borderColor: palette.primary,
      boxShadow: `0 0 0 3px ${palette.primary}40`
    }
  },
  "& .MuiInputLabel-root": {
    color: palette.textSecondary,
    "&.Mui-focused": {
      color: palette.primary
    }
  }
};

const TABLE_HEAD_CELL_SX = { color: palette.primary, fontWeight: 600 };

const normalizeStatus = (status: string | null) => {
  const value = (status ?? "").toLowerCase();
  if (["active", "activo"].includes(value)) {
    return { label: "Activo", color: palette.success };
  }
  if (["inactive", "inactivo"].includes(value)) {
    return { label: "Inactivo", color: palette.textDisabled };
  }
  if (["suspended", "suspendido"].includes(value)) {
    return { label: "Suspendido", color: palette.danger };
  }
  return { label: status ?? "Sin estado", color: palette.textDisabled };
};

const ListaEmpleados = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const hydrated = useHydrated();
  const { toast } = useNotifications();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    if (!hydrated) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (positionFilter) params.append("position", positionFilter);
      if (departmentFilter) params.append("department", departmentFilter);
      if (roleFilter) params.append("role", roleFilter);

      const query = params.toString();
      const response = await fetch(`/api/admin/employees${query ? `?${query}` : ""}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Error al cargar usuarios");
      }

      const incoming: EmployeeRecord[] = Array.isArray(payload.employees)
        ? payload.employees
        : [];
      setEmployees(incoming);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      toast.error(error instanceof Error ? error.message : "Error de conexión al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [departmentFilter, hydrated, positionFilter, roleFilter, statusFilter, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesRole = !roleFilter || employee.rol === roleFilter;
      if (!matchesRole) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        `${employee.firstName} ${employee.lastName}`,
        employee.email,
        employee.position ?? "",
        employee.department ?? ""
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [employees, roleFilter, search]);

  const summary = useMemo(() => {
    const total = employees.length;
    const admins = employees.filter((employee) => employee.rol === "admin").length;
    const active = employees.filter((employee) => normalizeStatus(employee.status).label === "Activo").length;
    const fingerprint = employees.filter((employee) => employee.fingerprint).length;

    return { total, admins, active, fingerprint };
  }, [employees]);

  const dialogEmployee = useMemo(() => {
    if (!selectedEmployee || !selectedEmployee.hasEmployeeRecord) {
      return null;
    }

    return {
      id: selectedEmployee.id ?? undefined,
      user_id: selectedEmployee.user_id,
      firstName: selectedEmployee.firstName,
      lastName: selectedEmployee.lastName,
      email: selectedEmployee.email,
      phone: selectedEmployee.phone ?? "",
      position: selectedEmployee.position ?? "",
      department: selectedEmployee.department ?? "",
      salary: selectedEmployee.salary ?? 0,
      hireDate: selectedEmployee.hireDate ?? "",
      status: selectedEmployee.status ?? "activo",
      profilePictureUrl: selectedEmployee.profilePictureUrl ?? undefined,
      fingerprint: selectedEmployee.fingerprint
    };
  }, [selectedEmployee]);

  const selectedRoleMeta = useMemo(() => {
    if (!selectedEmployee) {
      return ROLE_META.empleado;
    }

    return ROLE_META[selectedEmployee.rol];
  }, [selectedEmployee]);

  const openView = (employee: EmployeeRecord) => {
    setSelectedEmployee(employee);
    setIsViewOpen(true);
  };

  const openEdit = (employee: EmployeeRecord) => {
    if (!employee.hasEmployeeRecord) {
      toast.error("Este usuario aún no tiene ficha en empleados. Regístralo desde 'Nuevo Registro'.");
      return;
    }

    setSelectedEmployee(employee);
    setIsEditOpen(true);
  };

  const openDelete = (employee: EmployeeRecord) => {
    if (!employee.hasEmployeeRecord) {
      toast.error("No hay registro de empleado para eliminar.");
      return;
    }

    setSelectedEmployee(employee);
    setIsDeleteOpen(true);
  };

  const closeDialogs = () => {
    setSelectedEmployee(null);
    setIsViewOpen(false);
    setIsEditOpen(false);
    setIsDeleteOpen(false);
    setIsDeleting(false);
  };

  const handleDelete = async () => {
    if (!selectedEmployee?.hasEmployeeRecord || !selectedEmployee.id) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/employees/${selectedEmployee.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Error al eliminar empleado");
      }

      toast.success(`Empleado ${selectedEmployee.firstName} ${selectedEmployee.lastName} eliminado correctamente`);
      await fetchEmployees();
      closeDialogs();
    } catch (error) {
      console.error("Error eliminando empleado:", error);
      toast.error(error instanceof Error ? error.message : "Error de conexión al eliminar empleado");
      setIsDeleting(false);
    }
  };

  const handleSaveEmployee = async (payload: any) => {
    if (!selectedEmployee?.hasEmployeeRecord || !selectedEmployee.id) {
      throw new Error("No existe un registro de empleado para actualizar");
    }

    const response = await fetch(`/api/admin/employees/${selectedEmployee.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Error al actualizar empleado");
    }

    toast.success(`Empleado ${payload.firstName} ${payload.lastName} actualizado correctamente`);
    closeDialogs();
    await fetchEmployees();
  };

  if (!hydrated) {
    return null;
  }

  return (
    <Box
      sx={{
        p: isMobile ? 2 : 3,
        minHeight: "100vh",
        background: `radial-gradient(circle at top, ${palette.surface3} 0%, ${palette.background} 65%)`,
        color: palette.textPrimary
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 4
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: palette.primary }}>
          👥 Lista de Usuarios del Equipo
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => router.push("/dashboard/admin/empleados/registrar")}
          sx={{
            backgroundColor: palette.primary,
            color: palette.textOnBrand,
            fontWeight: 600,
            "&:hover": {
              backgroundColor: palette.primaryHover
            }
          }}
        >
          Nuevo Registro
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${palette.surface2}, ${palette.surface3})`,
              border: `1px solid ${palette.primary}40`
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: palette.textSecondary }}>
                Total usuarios
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: palette.primary }}>
                {summary.total}
              </Typography>
              <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                Empleados y administradores registrados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${palette.surface2}, ${palette.surface3})`,
              border: `1px solid ${palette.primary}40`
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: palette.textSecondary }}>
                Administradores
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: palette.primary }}>
                {summary.admins}
              </Typography>
              <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                Con acceso total a la plataforma
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${palette.surface2}, ${palette.surface3})`,
              border: `1px solid ${palette.success}40`
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: palette.textSecondary }}>
                Activos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: palette.success }}>
                {summary.active}
              </Typography>
              <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                Con estado operativo vigente
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${palette.surface2}, ${palette.surface3})`,
              border: `1px solid ${palette.info}40`
            }}
          >
            <CardContent>
              <Typography variant="overline" sx={{ color: palette.textSecondary }}>
                Huella registrada
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: palette.info }}>
                {summary.fingerprint}
              </Typography>
              <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                Sincronizados con control biométrico
              </Typography>
            </CardContent>
          </Card>
          </Grid>
        </Grid>

      <Paper
        sx={{
          p: isMobile ? 2 : 3,
          mb: 4,
          background: `linear-gradient(135deg, ${palette.surface1}, ${palette.surface2})`,
          border: `1px solid ${palette.divider}`
        }}
      >
        <Grid container spacing={isMobile ? 2 : 3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre, email o puesto..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: palette.textSecondary }} />
                  </InputAdornment>
                )
              }}
              sx={FILTER_FIELD_SX}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              select
              label="Estado"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={FILTER_FIELD_SX}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="active">Activo</MenuItem>
              <MenuItem value="inactive">Inactivo</MenuItem>
              <MenuItem value="suspended">Suspendido</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              select
              label="Puesto"
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              sx={FILTER_FIELD_SX}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Entrenador">Entrenador</MenuItem>
              <MenuItem value="Recepcionista">Recepcionista</MenuItem>
              <MenuItem value="Manager">Manager</MenuItem>
              <MenuItem value="Limpieza">Limpieza</MenuItem>
              <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
              <MenuItem value="Ventas">Ventas</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              select
              label="Departamento"
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              sx={FILTER_FIELD_SX}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Operaciones">Operaciones</MenuItem>
              <MenuItem value="Ventas">Ventas</MenuItem>
              <MenuItem value="Administración">Administración</MenuItem>
              <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              select
              label="Rol"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              sx={FILTER_FIELD_SX}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
              <MenuItem value="empleado">Empleado</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer
        component={Paper}
        sx={{
          background: `linear-gradient(135deg, ${palette.surface2}, ${palette.surface3})`,
          border: `1px solid ${palette.divider}`
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={TABLE_HEAD_CELL_SX}>Usuario</TableCell>
              <TableCell sx={TABLE_HEAD_CELL_SX}>Email</TableCell>
              <TableCell sx={TABLE_HEAD_CELL_SX}>Puesto</TableCell>
              <TableCell sx={TABLE_HEAD_CELL_SX}>Departamento</TableCell>
              <TableCell sx={TABLE_HEAD_CELL_SX}>Rol</TableCell>
              <TableCell sx={TABLE_HEAD_CELL_SX}>Estado</TableCell>
              <TableCell sx={TABLE_HEAD_CELL_SX}>Huella</TableCell>
              <TableCell sx={TABLE_HEAD_CELL_SX}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: palette.textSecondary }}>
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ color: palette.textSecondary }}>
                  No encontramos coincidencias con los filtros seleccionados
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => {
                const roleMeta = ROLE_META[employee.rol] || ROLE_META.empleado; // Fallback for safety
                const statusMeta = normalizeStatus(employee.status);

                return (
                  <TableRow
                    key={`${employee.user_id}-${employee.id ?? "user"}`}
                    sx={{
                      "&:hover": {
                        backgroundColor: `${palette.primary}10`
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          src={employee.profilePictureUrl || undefined}
                          alt={`${employee.firstName} ${employee.lastName}`}
                          imgProps={{
                            loading: "lazy",
                            onError: (e: any) => {
                              console.warn(`⚠️ Error cargando foto de ${employee.firstName} ${employee.lastName}`);
                              e.target.style.display = 'none';
                            }
                          }}
                          sx={{
                            width: 48,
                            height: 48,
                            bgcolor: employee.profilePictureUrl ? palette.surface2 : palette.primary,
                            color: palette.textOnBrand,
                            fontWeight: 600,
                            border: `2px solid ${palette.divider}`,
                            boxShadow: employee.profilePictureUrl ? `0 2px 8px ${palette.shadow}` : 'none',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: `0 4px 12px ${palette.shadow}`
                            }
                          }}
                        >
                          {(employee.firstName?.[0] ?? "").toUpperCase()}
                          {(employee.lastName?.[0] ?? "").toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: palette.textPrimary }}>
                            {employee.firstName} {employee.lastName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                            {employee.phone || "Sin teléfono"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: palette.textSecondary }}>{employee.email}</TableCell>
                    <TableCell sx={{ color: palette.textPrimary }}>{employee.position || "Sin puesto"}</TableCell>
                    <TableCell sx={{ color: palette.textSecondary }}>{employee.department || "Sin asignar"}</TableCell>
                    <TableCell>
                      <Chip
                        label={roleMeta.label}
                        size="small"
                        sx={{
                          backgroundColor: roleMeta.background,
                          color: roleMeta.color,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusMeta.label}
                        size="small"
                        sx={{
                          backgroundColor: `${statusMeta.color}20`,
                          color: statusMeta.color,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {employee.fingerprint ? (
                        <Tooltip title="Huella registrada">
                          <FingerprintIcon sx={{ color: palette.success }} />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Sin huella registrada">
                          <FingerprintIcon sx={{ color: palette.textDisabled }} />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Tooltip title="Ver detalles">
                          <IconButton size="small" sx={{ color: palette.primary }} onClick={() => openView(employee)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={employee.hasEmployeeRecord ? "Editar" : "Registrar ficha"}>
                          <span>
                            <IconButton
                              size="small"
                              sx={{ color: palette.warning }}
                              disabled={!employee.hasEmployeeRecord}
                              onClick={() => openEdit(employee)}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={employee.hasEmployeeRecord ? "Eliminar" : "Sin registro para eliminar"}>
                          <span>
                            <IconButton
                              size="small"
                              sx={{ color: palette.danger }}
                              disabled={!employee.hasEmployeeRecord}
                              onClick={() => openDelete(employee)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isViewOpen}
        onClose={closeDialogs}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${palette.surface2}, ${palette.surface3})`,
            color: palette.textPrimary,
            border: `1px solid ${palette.divider}`
          }
        }}
      >
        <DialogTitle sx={{ color: palette.primary, fontWeight: 600 }}>👁️ Detalles del usuario</DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Foto de perfil */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Avatar
                    src={selectedEmployee.profilePictureUrl || undefined}
                    alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                    imgProps={{
                      loading: "eager",
                      onError: (e: any) => {
                        console.warn(`⚠️ Error cargando foto de ${selectedEmployee.firstName}`);
                        e.target.style.display = 'none';
                      }
                    }}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: selectedEmployee.profilePictureUrl ? palette.surface2 : palette.primary,
                      color: palette.textOnBrand,
                      fontWeight: 600,
                      fontSize: '2.5rem',
                      border: `3px solid ${palette.primary}`,
                      boxShadow: `0 4px 20px ${palette.shadow}`
                    }}
                  >
                    {(selectedEmployee.firstName?.[0] ?? "").toUpperCase()}
                    {(selectedEmployee.lastName?.[0] ?? "").toUpperCase()}
                  </Avatar>
                </Box>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: palette.textSecondary }}>
                  Nombre completo
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: palette.textPrimary }}>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: palette.textSecondary }}>
                  Rol
                </Typography>
                <Chip
                  label={selectedRoleMeta.label}
                  size="small"
                  sx={{
                    backgroundColor: selectedRoleMeta.background,
                    color: selectedRoleMeta.color,
                    fontWeight: 600
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: palette.textSecondary }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ color: palette.textPrimary }}>
                  {selectedEmployee.email}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: palette.textSecondary }}>
                  Teléfono
                </Typography>
                <Typography variant="body1" sx={{ color: palette.textPrimary }}>
                  {selectedEmployee.phone || "Sin teléfono"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: palette.textSecondary }}>
                  Puesto
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, color: palette.textPrimary }}>
                  {selectedEmployee.position || "Sin puesto"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: palette.textSecondary }}>
                  Departamento
                </Typography>
                <Typography variant="body1" sx={{ color: palette.textPrimary }}>
                  {selectedEmployee.department || "Sin asignar"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: palette.textSecondary }}>
                  Estado laboral
                </Typography>
                <Chip
                  label={normalizeStatus(selectedEmployee.status).label}
                  size="small"
                  sx={{
                    backgroundColor: `${normalizeStatus(selectedEmployee.status).color}20`,
                    color: normalizeStatus(selectedEmployee.status).color,
                    fontWeight: 600
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ color: palette.textSecondary }}>
                  Huella dactilar
                </Typography>
                <Typography variant="body1" sx={{ color: palette.textPrimary }}>
                  {selectedEmployee.fingerprint ? "Registrada" : "No registrada"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs} sx={{ color: palette.textSecondary }}>
            Cerrar
          </Button>
          <Button
            variant="outlined"
            onClick={() => selectedEmployee && openEdit(selectedEmployee)}
            disabled={!selectedEmployee?.hasEmployeeRecord}
            sx={{
              borderColor: palette.warning,
              color: palette.warning
            }}
          >
            Editar ficha
          </Button>
        </DialogActions>
      </Dialog>

      {dialogEmployee && (
        <EmployeeFormDialog
          open={isEditOpen}
          onClose={closeDialogs}
          employee={dialogEmployee}
          onSave={handleSaveEmployee}
        />
      )}

      <Dialog
        open={isDeleteOpen}
        onClose={closeDialogs}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${palette.surface2}, ${palette.surface3})`,
            border: `1px solid ${palette.danger}40`
          }
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: palette.danger }}>
          <WarningIcon /> Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          {selectedEmployee && (
            <Alert severity="warning" sx={{ backgroundColor: `${palette.warning}20`, border: `1px solid ${palette.warning}40` }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </Typography>
              <Typography variant="body2">{selectedEmployee.email}</Typography>
              <Typography variant="body2" sx={{ color: palette.textSecondary }}>
                Esta acción eliminará la ficha del empleado y los datos asociados.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ gap: 2 }}>
          <Button onClick={closeDialogs} disabled={isDeleting} sx={{ color: palette.textSecondary }}>
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            variant="contained"
            color="error"
            startIcon={isDeleting ? <CircularProgress size={16} /> : undefined}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListaEmpleados;