'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Tooltip,
  Stack,
  Divider,
  Badge,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
  BusinessCenter as BusinessIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  AutoAwesome as AutoAwesomeIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';

import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { useNotifications } from '@/hooks/useNotifications';
import { formatTimestampForDisplay } from '@/utils/dateUtils';
import WarehouseFormDialog from '@/components/catalogo/WarehouseFormDialog';
import Swal from 'sweetalert2';

type WarehouseType = 'store' | 'central' | 'warehouse' | 'temporary';

interface Warehouse {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: any; // JSONB type
  warehouse_type: WarehouseType;
  is_active: boolean;
  is_default: boolean;
  manager_user_id?: string;
  auto_restock_enabled: boolean;
  min_stock_threshold?: number;
  max_capacity?: number;
  current_capacity?: number;
  operating_hours?: any; // JSONB type
  time_zone?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

const WAREHOUSE_TYPE_CONFIG = {
  store: { 
    label: 'Tienda', 
    IconComponent: StoreIcon, 
    color: colorTokens.brand,
    bg: `${colorTokens.brand}15`
  },
  central: { 
    label: 'Almacén Central', 
    IconComponent: BusinessIcon, 
    color: colorTokens.info,
    bg: `${colorTokens.info}15`
  },
  warehouse: { 
    label: 'Bodega', 
    IconComponent: WarehouseIcon, 
    color: colorTokens.warning,
    bg: `${colorTokens.warning}15`
  },
  temporary: { 
    label: 'Temporal', 
    IconComponent: LocationIcon, 
    color: colorTokens.textSecondary,
    bg: `${colorTokens.textSecondary}15`
  }
};

export default function AlmacenesPage() {
  // State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Hooks
  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { toast } = useNotifications();

  const { 
    data: warehouses, 
    createItem, 
    updateItem,
    deleteItem,
    fetchData: reloadWarehouses,
    loading,
    stats: entityStats
  } = useEntityCRUD<Warehouse>({
    tableName: 'warehouses',
    selectQuery: 'id, code, name, description, address, warehouse_type, is_active, is_default, manager_user_id, auto_restock_enabled, min_stock_threshold, max_capacity, current_capacity, operating_hours, time_zone, created_at, updated_at, created_by, updated_by'
  });

  // Filtered warehouses
  const filteredWarehouses = useMemo(() => {
    if (!warehouses) return [];
    
    return warehouses.filter(warehouse => {
      const searchLower = searchTerm.toLowerCase();
      const addressStr = warehouse.address?.street || warehouse.address?.city || '';
      return (
        warehouse.name.toLowerCase().includes(searchLower) ||
        warehouse.code.toLowerCase().includes(searchLower) ||
        (addressStr && addressStr.toLowerCase().includes(searchLower))
      );
    });
  }, [warehouses, searchTerm]);

  // Paginated data
  const paginatedWarehouses = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredWarehouses.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredWarehouses, page, rowsPerPage]);

  // Stats
  const warehouseStats = useMemo(() => {
    if (!warehouses) return { total: 0, active: 0, inactive: 0, defaults: 0 };
    
    return {
      total: warehouses.length,
      active: warehouses.filter(w => w.is_active).length,
      inactive: warehouses.filter(w => !w.is_active).length,
      defaults: warehouses.filter(w => w.is_default).length
    };
  }, [warehouses]);

  // Handlers
  const handleOpenDialog = useCallback((warehouse?: Warehouse) => {
    setSelectedWarehouse(warehouse || null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedWarehouse(null);
  }, []);

  const handleSave = useCallback(async (formData: any) => {
    try {
      console.log('💾 Guardando almacén:', formData);
      
      const dataWithAudit = await addAuditFieldsFor(
        'warehouses',
        formData,
        !!selectedWarehouse
      );
      
      console.log('📝 Datos con auditoría:', dataWithAudit);
      
      if (selectedWarehouse) {
        // Update
        console.log('🔄 Actualizando almacén ID:', selectedWarehouse.id);
        await updateItem(selectedWarehouse.id, dataWithAudit);
        toast.success('Almacén actualizado correctamente');
      } else {
        // Create
        console.log('➕ Creando nuevo almacén');
        await createItem({
          ...dataWithAudit,
          is_active: true
        });
        toast.success('Almacén creado correctamente');
      }
      
      // Recargar datos
      console.log('🔃 Recargando lista de almacenes...');
      await reloadWarehouses();
      console.log('✅ Lista recargada');
      
      // Pequeño delay para asegurar que la UI se actualice
      setTimeout(() => {
        handleCloseDialog();
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Error al guardar almacén:', error);
      toast.error(`Error al guardar: ${error.message}`);
      throw error;
    }
  }, [selectedWarehouse, addAuditFieldsFor, updateItem, createItem, reloadWarehouses, toast, handleCloseDialog]);

  const handleDelete = useCallback(async (warehouse: Warehouse) => {
    const result = await Swal.fire({
      title: '¿Eliminar almacén?',
      html: `
        <p style="color: ${colorTokens.textPrimary};">¿Estás seguro de eliminar el almacén:</p>
        <p style="color: ${colorTokens.brand}; font-weight: 700; margin: 12px 0;">
          ${warehouse.name} (${warehouse.code})
        </p>
        <p style="color: ${colorTokens.danger}; margin-top: 16px; font-size: 13px;">
          ⚠️ Esta acción no se puede deshacer
        </p>
      `,
      icon: 'warning',
      iconColor: colorTokens.warning,
      background: colorTokens.neutral200,
      color: colorTokens.textPrimary,
      showCancelButton: true,
      confirmButtonColor: colorTokens.danger,
      cancelButtonColor: colorTokens.neutral600,
      confirmButtonText: '<span style="font-weight: 600;">Sí, eliminar</span>',
      cancelButtonText: '<span style="font-weight: 600;">Cancelar</span>',
      customClass: {
        popup: 'swal-dark-popup',
        title: 'swal-dark-title',
        htmlContainer: 'swal-dark-content',
        confirmButton: 'swal-dark-confirm',
        cancelButton: 'swal-dark-cancel'
      },
      buttonsStyling: true
    });

    if (result.isConfirmed) {
      try {
        await deleteItem(warehouse.id);
        toast.success('Almacén eliminado correctamente');
        await reloadWarehouses();
      } catch (error: any) {
        toast.error(`Error al eliminar: ${error.message}`);
      }
    }
  }, [deleteItem, reloadWarehouses, toast]);

  const handleToggleActive = useCallback(async (warehouse: Warehouse) => {
    try {
      const dataWithAudit = await addAuditFieldsFor('warehouses', {
        is_active: !warehouse.is_active
      }, true);
      
      await updateItem(warehouse.id, dataWithAudit);
      
      toast.success(`Almacén ${warehouse.is_active ? 'desactivado' : 'activado'} correctamente`);
      await reloadWarehouses();
      
    } catch (error: any) {
      toast.error(`Error al actualizar: ${error.message}`);
    }
  }, [updateItem, addAuditFieldsFor, reloadWarehouses, toast]);

  if (!hydrated) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      {/* Header */}
      <Paper sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.info}10)`,
        borderRadius: 3,
        border: `1px solid ${colorTokens.border}`
      }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: colorTokens.textPrimary,
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
            }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                🏭 Gestión de Almacenes
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                🏭 Almacenes
              </Box>
            </Typography>
            <Typography variant="body2" sx={{
              color: colorTokens.textSecondary,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Administra y controla todos los almacenes del sistema
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Gestión y control
              </Box>
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            <Button
              onClick={() => reloadWarehouses()}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              fullWidth={{ xs: true, sm: false }}
              sx={{
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                border: `2px solid ${colorTokens.brand}30`,
                color: colorTokens.brand,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '&:hover': {
                  backgroundColor: `${colorTokens.brand}10`,
                  border: `2px solid ${colorTokens.brand}50`
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Actualizar
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Actualizar
              </Box>
            </Button>
            <Button
              onClick={() => handleOpenDialog()}
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth={{ xs: true, sm: false }}
              sx={{
                background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
                color: colorTokens.textOnBrand,
                fontWeight: 700,
                px: { xs: 2, sm: 4 },
                borderRadius: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                boxShadow: `0 4px 20px ${colorTokens.brand}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 25px ${colorTokens.brand}50`
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Nuevo Almacén
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Nuevo
              </Box>
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}05)`,
            border: `1px solid ${colorTokens.brand}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                    Total Almacenes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: colorTokens.brand }}>
                    {warehouseStats.total}
                  </Typography>
                </Box>
                <WarehouseIcon sx={{ fontSize: 48, color: colorTokens.brand, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${colorTokens.success}15, ${colorTokens.success}05)`,
            border: `1px solid ${colorTokens.success}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                    Activos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: colorTokens.success }}>
                    {warehouseStats.active}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 48, color: colorTokens.success, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${colorTokens.danger}15, ${colorTokens.danger}05)`,
            border: `1px solid ${colorTokens.danger}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                    Inactivos
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: colorTokens.danger }}>
                    {warehouseStats.inactive}
                  </Typography>
                </Box>
                <CancelIcon sx={{ fontSize: 48, color: colorTokens.danger, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${colorTokens.warning}15, ${colorTokens.warning}05)`,
            border: `1px solid ${colorTokens.warning}30`,
            borderRadius: 3
          }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                    Por Defecto
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: colorTokens.warning }}>
                    {warehouseStats.defaults}
                  </Typography>
                </Box>
                <StarIcon sx={{ fontSize: 48, color: colorTokens.warning, opacity: 0.3 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Paper sx={{
        p: { xs: 1.5, sm: 2 },
        mb: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: 3,
        border: `1px solid ${colorTokens.border}`
      }}>
        <TextField
          fullWidth
          placeholder="Buscar por nombre, código o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colorTokens.textSecondary }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 3, border: `1px solid ${colorTokens.border}`, overflow: 'hidden' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead sx={{ background: colorTokens.neutral100 }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Dirección</TableCell>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Características</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress sx={{ color: colorTokens.brand }} />
                  </TableCell>
                </TableRow>
              ) : paginatedWarehouses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                      No se encontraron almacenes
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedWarehouses.map((warehouse) => {
                  const typeConfig = WAREHOUSE_TYPE_CONFIG[warehouse.warehouse_type] || WAREHOUSE_TYPE_CONFIG.store;
                  
                  return (
                    <TableRow 
                      key={warehouse.id}
                      sx={{ 
                        '&:hover': { backgroundColor: colorTokens.neutral100 },
                        opacity: warehouse.is_active ? 1 : 0.6
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ color: colorTokens.textPrimary }}>
                          {warehouse.code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                            {warehouse.name}
                          </Typography>
                          {warehouse.is_default && (
                            <Tooltip title="Almacén por defecto">
                              <StarIcon sx={{ fontSize: 16, color: colorTokens.warning }} />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Box sx={{ color: typeConfig.color, display: 'flex', alignItems: 'center' }}>
                            {React.createElement(typeConfig.IconComponent, { sx: { fontSize: 20 } })}
                          </Box>
                          <Typography variant="body2" sx={{ color: typeConfig.color, fontWeight: 600 }}>
                            {typeConfig.label}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          {warehouse.address?.street ? `${warehouse.address.street}${warehouse.address.city ? `, ${warehouse.address.city}` : ''}` : 'Sin dirección'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={warehouse.is_active ? 'Activo' : 'Inactivo'}
                          size="small"
                          sx={{
                            backgroundColor: warehouse.is_active ? `${colorTokens.success}15` : `${colorTokens.danger}15`,
                            color: warehouse.is_active ? colorTokens.success : colorTokens.danger,
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {warehouse.auto_restock_enabled && (
                            <Tooltip title="Reabastecimiento automático">
                              <AutoAwesomeIcon sx={{ fontSize: 18, color: colorTokens.success }} />
                            </Tooltip>
                          )}
                          {warehouse.max_capacity && (
                            <Tooltip title={`Capacidad máxima: ${warehouse.max_capacity}`}>
                              <InventoryIcon sx={{ fontSize: 18, color: colorTokens.info }} />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(warehouse)}
                              sx={{ 
                                color: colorTokens.info,
                                '&:hover': { backgroundColor: `${colorTokens.info}15` }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={warehouse.is_active ? 'Desactivar' : 'Activar'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleActive(warehouse)}
                              sx={{ 
                                color: warehouse.is_active ? colorTokens.warning : colorTokens.success,
                                '&:hover': { backgroundColor: warehouse.is_active ? `${colorTokens.warning}15` : `${colorTokens.success}15` }
                              }}
                            >
                              {warehouse.is_active ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(warehouse)}
                              sx={{ 
                                color: colorTokens.danger,
                                '&:hover': { backgroundColor: `${colorTokens.danger}15` }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredWarehouses.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          sx={{
            borderTop: `1px solid ${colorTokens.border}`,
            '.MuiTablePagination-select': { color: colorTokens.textPrimary },
            '.MuiTablePagination-displayedRows': { color: colorTokens.textSecondary }
          }}
        />
      </Paper>

      {/* Dialog */}
      <WarehouseFormDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        warehouse={selectedWarehouse}
        loading={loading}
      />
    </Box>
  );
}

