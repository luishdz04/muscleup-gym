// pages/HistorialMembresiaPage.tsx - CÓDIGO ENTERPRISE v6.0 CORREGIDO
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  CircularProgress,
  Stack,
  Menu,
  MenuItem as MenuItemComponent,
  MenuList,
  ListItemIcon,
  ListItemText,
  Grid
} from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ✅ HOOKS ENTERPRISE OBLIGATORIOS
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useUserTracking } from '@/hooks/useUserTracking';
import { notify } from '@/utils/notifications';
import { 
  getCurrentTimestamp,
  formatTimestampForDisplay,
  formatDateForDisplay,
  formatDateLong,
  daysBetween,
  getTodayInMexico,
  addDaysToDate
} from '@/utils/dateUtils';

// HOOKS PERSONALIZADOS
import { useMembershipFilters } from '@/hooks/useMembershipFilters';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import { useMembershipCRUD } from '@/hooks/useMembershipCRUD';

// COMPONENTES SEPARADOS
import MembershipTable from '@/components/membership/MembershipTable';
import FilterPanel from '@/components/membership/FilterPanel';
import BulkOperationPanel from '@/components/membership/BulkOperationPanel';
import BulkOperationModal from '@/components/membership/BulkOperationModal';
import MembershipDetailsModal from '@/components/membership/MembershipDetailsModal';
import MembershipEditModal from '@/components/membership/MembershipEditModal';

// UTILIDADES Y TIPOS
import type { 
  MembershipHistory, 
  StatusOption, 
  PaymentMethodOption, 
  EditFormData,
  Plan
} from '@/types/membership';

// ICONOS
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AcUnit as AcUnitIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Block as BlockIcon,
  BatchPrediction as BatchIcon
} from '@mui/icons-material';

// OPCIONES DE CONFIGURACIÓN
const statusOptions: StatusOption[] = [
  { value: '', label: 'Todos los estados', color: colorTokens.neutral800, icon: '📋' },
  { value: 'active', label: 'Activa', color: colorTokens.success, icon: '✅' },
  { value: 'expired', label: 'Vencida', color: colorTokens.danger, icon: '❌' },
  { value: 'frozen', label: 'Congelada', color: colorTokens.info, icon: '🧊' },
  { value: 'cancelled', label: 'Cancelada', color: colorTokens.neutral600, icon: '🚫' }
];

const paymentMethodOptions: PaymentMethodOption[] = [
  { value: '', label: 'Todos los métodos', icon: '💳' },
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'debito', label: 'Débito', icon: '💳' },
  { value: 'credito', label: 'Crédito', icon: '💳' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'mixto', label: 'Mixto', icon: '🔄' }
];

export default function HistorialMembresiaPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  
  // ✅ AUDITORÍA AUTOMÁTICA ENTERPRISE v6.0
  const { addAuditFieldsFor } = useUserTracking();
  
  // HOOKS PERSONALIZADOS - LÓGICA SEPARADA
  const {
    memberships,
    plans,
    loading,
    initialLoad,
    selectedMembership,
    editDialogOpen,
    editData,
    editLoading,
    detailsDialogOpen,
    setSelectedMembership,
    setEditDialogOpen,
    setEditData,
    setDetailsDialogOpen,
    loadMemberships,
    loadPlans,
    forceReloadMemberships,
    handleStatusChange,
    handleUpdateMembership,
    initializeEditData,
    formatPrice
  } = useMembershipCRUD();

  const {
    filters,
    filteredMemberships,
    stats,
    showFilters,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    setShowFilters
  } = useMembershipFilters(memberships);

  const {
    selectedMembershipIds,
    bulkMode,
    bulkDialogOpen,
    bulkOperation,
    bulkLoading,
    bulkProgress,
    bulkResults,
    bulkPreview,
    showPreview,
    selectedCount,
    hasSelectedMemberships,
    setBulkMode,
    setBulkDialogOpen,
    setBulkOperation,
    handleSelectAllMemberships,
    handleClearSelection,
    handleToggleMembershipSelection,
    handleBulkFreeze,
    handleBulkUnfreeze,
    executeBulkOperation,
    updatePreview,
    formatDisplayDate,
    getCurrentFrozenDays
  } = useBulkOperations(memberships, forceReloadMemberships);

  const filterPlans = useMemo<Plan[]>(() =>
    plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description
    })),
  [plans]);

  // ESTADOS LOCALES
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [unfreezeLoading, setUnfreezeLoading] = useState(false);

  // FUNCIONES UTILITARIAS MEMOIZADAS
  const calculateDaysRemaining = useCallback((endDate: string | null): number | null => {
    if (!endDate) return null;
    
    try {
      const today = getTodayInMexico();
      return daysBetween(today, endDate);
    } catch (error) {
      return null;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || colorTokens.neutral800;
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.icon || '📋';
  }, []);

  // ✅ FUNCIONES DE CONGELAMIENTO CON AUDITORÍA v6.0
  const handleFreezeMembership = useCallback(async (membership: MembershipHistory) => {
    try {
      setFreezeLoading(true);
      
      if (membership.status !== 'active') {
        notify.error('Solo se pueden congelar membresías activas');
        return;
      }

      await handleStatusChange(membership, 'frozen');
      
      notify.success('✅ Membresía congelada exitosamente');
      setActionMenuAnchor(null);
      
    } catch (err: any) {
      notify.error(`❌ Error al congelar membresía: ${err.message}`);
    } finally {
      setFreezeLoading(false);
    }
  }, [handleStatusChange]);

  const handleUnfreezeMembership = useCallback(async (membership: MembershipHistory) => {
    try {
      setUnfreezeLoading(true);
      
      if (membership.status !== 'frozen') {
        notify.error('Solo se pueden reactivar membresías congeladas');
        return;
      }

      await handleStatusChange(membership, 'active');
      
      notify.success('✅ Membresía reactivada exitosamente');
      setActionMenuAnchor(null);
      
    } catch (err: any) {
      notify.error(`❌ Error al reactivar membresía: ${err.message}`);
    } finally {
      setUnfreezeLoading(false);
    }
  }, [handleStatusChange]);

  // HANDLERS MEMOIZADOS PARA COMPONENTES
  const handleViewDetails = useCallback((membership: MembershipHistory) => {
    setSelectedMembership(membership);
    setDetailsDialogOpen(true);
  }, [setSelectedMembership, setDetailsDialogOpen]);

  const handleEdit = useCallback((membership: MembershipHistory) => {
    setSelectedMembership(membership);
    initializeEditData(membership);
    setEditDialogOpen(true);
  }, [setSelectedMembership, initializeEditData, setEditDialogOpen]);

  const handleMoreActions = useCallback((event: React.MouseEvent<HTMLElement>, membership: MembershipHistory) => {
    setSelectedMembership(membership);
    setActionMenuAnchor(event.currentTarget);
  }, [setSelectedMembership]);

  const handlePageChange = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  // ✅ HANDLER PARA GUARDAR EDICIÓN (hook ya tiene auditoría)
  const handleSaveEdit = useCallback(async (editDataFromModal: EditFormData) => {
    try {
      await handleUpdateMembership(editDataFromModal);
      notify.success('✅ Membresía actualizada exitosamente');
    } catch (error: any) {
      notify.error(`❌ Error al actualizar: ${error.message}`);
    }
  }, [handleUpdateMembership]);

  // HANDLERS PARA BULK OPERATIONS
  const handleBulkFreezeWrapper = useCallback((isManual: boolean) => {
    try {
      handleBulkFreeze(isManual, filteredMemberships);
    } catch (error: any) {
      notify.error(error.message);
    }
  }, [handleBulkFreeze, filteredMemberships]);

  const handleBulkUnfreezeWrapper = useCallback((isManual: boolean) => {
    try {
      handleBulkUnfreeze(isManual, filteredMemberships);
    } catch (error: any) {
      notify.error(error.message);
    }
  }, [handleBulkUnfreeze, filteredMemberships]);

  const handleSelectAllWrapper = useCallback(() => {
    handleSelectAllMemberships(filteredMemberships);
  }, [handleSelectAllMemberships, filteredMemberships]);

  // EFFECTS
  useEffect(() => {
    if (hydrated) {
      loadMemberships();
      loadPlans();
    }
  }, [loadMemberships, loadPlans, hydrated]);

  // ✅ PANTALLA DE CARGA ENTERPRISE CON useHydrated
  if (!hydrated) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`
      }}>
        <CircularProgress size={60} sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 2, sm: 2.5, md: 3 },
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.neutral1200
    }}>
      {/* HEADER PROFESIONAL */}
      <Paper sx={{
        p: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 2, sm: 3, md: 4 },
        background: `linear-gradient(135deg, ${colorTokens.neutral200}98, ${colorTokens.neutral300}95)`,
        border: `2px solid ${colorTokens.brand}30`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${colorTokens.brand}10`
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: { xs: 2, sm: 2.5, md: 3 },
          gap: 2
        }}>
          <Box>
            <Typography variant="h3" sx={{
              color: colorTokens.brand,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5, md: 2 },
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}>
              <HistoryIcon sx={{ fontSize: { xs: 36, sm: 42, md: 50 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Sistema de Historial de Membresías</Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Historial</Box>
            </Typography>
            <Typography variant="h6" sx={{
              color: colorTokens.neutral800,
              fontWeight: 300,
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
              display: { xs: 'none', sm: 'block' }
            }}>
              Gestión Integral | Congelamiento Inteligente | Control Masivo Avanzado
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <Button
              startIcon={<RefreshIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              onClick={forceReloadMemberships}
              disabled={false}
              sx={{
                color: colorTokens.info,
                borderColor: `${colorTokens.info}60`,
                px: { xs: 2, sm: 2.5, md: 3 },
                py: { xs: 1, sm: 1.25, md: 1.5 },
                fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: colorTokens.info,
                  backgroundColor: `${colorTokens.info}10`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
              size="large"
            >
              {loading || initialLoad ? 'Cargando...' : 'Actualizar'}
            </Button>

            <Button
              startIcon={<ArrowBackIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              onClick={() => router.push('/dashboard/admin/membresias')}
              disabled={false}
              sx={{
                color: colorTokens.brand,
                borderColor: `${colorTokens.brand}60`,
                px: { xs: 2, sm: 2.5, md: 3 },
                py: { xs: 1, sm: 1.25, md: 1.5 },
                fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: colorTokens.brand,
                  backgroundColor: `${colorTokens.brand}10`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
              size="large"
            >
              Dashboard
            </Button>
          </Stack>
        </Box>

        {/* ESTADÍSTICAS - SOLO SI NO ES CARGA INICIAL */}
        {!initialLoad && (
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Card sx={{
                background: `linear-gradient(135deg, ${colorTokens.info}20, ${colorTokens.info}10)`,
                border: `1px solid ${colorTokens.info}30`,
                borderRadius: 3,
                textAlign: 'center',
                p: { xs: 1.5, sm: 2 }
              }}>
                <Typography variant="h4" sx={{
                  color: colorTokens.info,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
                }}>
                  <GroupIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
                  {stats.total}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral800, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                  Total Membresías
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Card sx={{
                background: `linear-gradient(135deg, ${colorTokens.success}20, ${colorTokens.success}10)`,
                border: `1px solid ${colorTokens.success}30`,
                borderRadius: 3,
                textAlign: 'center',
                p: { xs: 1.5, sm: 2 }
              }}>
                <Typography variant="h4" sx={{
                  color: colorTokens.success,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
                }}>
                  <CheckCircleIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
                  {stats.active}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral800, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                  Activas
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Card sx={{
                background: `linear-gradient(135deg, ${colorTokens.info}20, ${colorTokens.info}10)`,
                border: `1px solid ${colorTokens.info}30`,
                borderRadius: 3,
                textAlign: 'center',
                p: { xs: 1.5, sm: 2 }
              }}>
                <Typography variant="h4" sx={{
                  color: colorTokens.info,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
                }}>
                  <AcUnitIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
                  {stats.frozen}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral800, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                  Congeladas
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Card sx={{
                background: `linear-gradient(135deg, ${colorTokens.danger}20, ${colorTokens.danger}10)`,
                border: `1px solid ${colorTokens.danger}30`,
                borderRadius: 3,
                textAlign: 'center',
                p: { xs: 1.5, sm: 2 }
              }}>
                <Typography variant="h4" sx={{
                  color: colorTokens.danger,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }
                }}>
                  <CancelIcon sx={{ fontSize: { xs: 20, sm: 24, md: 28 } }} />
                  {stats.expired}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral800, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                  Vencidas
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Card sx={{
                background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
                border: `1px solid ${colorTokens.brand}30`,
                borderRadius: 3,
                textAlign: 'center',
                p: { xs: 1.5, sm: 2 }
              }}>
                <Typography variant="h5" sx={{
                  color: colorTokens.brand,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
                }}>
                  <AttachMoneyIcon sx={{ fontSize: { xs: 18, sm: 20, md: 24 } }} />
                  {formatPrice(stats.totalRevenue).replace('MX$', '$')}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral800, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                  Ingresos Totales
                </Typography>
              </Card>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2 }}>
              <Card sx={{
                background: `linear-gradient(135deg, ${colorTokens.warning}20, ${colorTokens.warning}10)`,
                border: `1px solid ${colorTokens.warning}30`,
                borderRadius: 3,
                textAlign: 'center',
                p: { xs: 1.5, sm: 2 }
              }}>
                <Typography variant="h6" sx={{
                  color: colorTokens.warning,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                }}>
                  <TrendingUpIcon sx={{ fontSize: { xs: 18, sm: 20, md: 24 } }} />
                  {formatPrice(stats.totalCommissions).replace('MX$', '$')}
                </Typography>
                <Typography variant="body2" sx={{ color: colorTokens.neutral800, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                  Comisiones
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* COMPONENTE DE OPERACIONES MASIVAS */}
      <AnimatePresence>
        {bulkMode && !initialLoad && (
          <BulkOperationPanel
            bulkMode={bulkMode}
            selectedCount={selectedCount}
            onCloseBulkMode={() => {
              setBulkMode(false);
              handleClearSelection();
            }}
            onSelectAll={handleSelectAllWrapper}
            onClearSelection={handleClearSelection}
            onBulkFreeze={handleBulkFreezeWrapper}
            onBulkUnfreeze={handleBulkUnfreezeWrapper}
            hasSelectedMemberships={hasSelectedMemberships}
          />
        )}
      </AnimatePresence>

      {/* COMPONENTE DE FILTROS */}
      {!initialLoad && (
        <FilterPanel
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          plans={filterPlans}
          hasActiveFilters={hasActiveFilters}
          statusOptions={statusOptions}
          paymentMethodOptions={paymentMethodOptions}
        />
      )}

      {/* BOTÓN PARA ACTIVAR MODO MASIVO */}
      {!bulkMode && !initialLoad && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            startIcon={<BatchIcon />}
            onClick={() => setBulkMode(true)}
            disabled={false}
            sx={{ 
              color: colorTokens.info,
              backgroundColor: `${colorTokens.info}15`,
              borderColor: `${colorTokens.info}40`,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              fontSize: '1.1rem',
              '&:hover': {
                backgroundColor: `${colorTokens.info}20`,
                borderColor: colorTokens.info,
                transform: 'translateY(-2px)'
              }
            }}
            variant="outlined"
            size="large"
          >
            🧊 Activar Congelamiento Masivo
          </Button>
        </Box>
      )}

      {/* COMPONENTE DE TABLA PRINCIPAL */}
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.brand}20`,
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 0 }}>
          {initialLoad || loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress 
                size={60} 
                sx={{ color: colorTokens.brand }}
                thickness={4}
              />
            </Box>
          ) : filteredMemberships.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ 
                color: colorTokens.neutral800,
                mb: 2
              }}>
                📋 No se encontraron membresías
              </Typography>
              <Typography variant="body1" sx={{ 
                color: colorTokens.neutral800
              }}>
                Intente ajustar los filtros de búsqueda
              </Typography>
            </Box>
          ) : (
            <MembershipTable
              memberships={filteredMemberships}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onMoreActions={handleMoreActions}
              bulkMode={bulkMode}
              selectedIds={selectedMembershipIds}
              onToggleSelection={handleToggleMembershipSelection}
              onSelectAll={handleSelectAllWrapper}
              statusOptions={statusOptions}
              paymentMethodOptions={paymentMethodOptions}
              formatPrice={formatPrice}
              formatDisplayDate={formatDisplayDate}
              calculateDaysRemaining={calculateDaysRemaining}
              getCurrentFrozenDays={getCurrentFrozenDays}
            />
          )}
        </CardContent>
      </Card>

      {/* ✅ MENU DE ACCIONES CORREGIDO - SIN FRAGMENTS */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
            border: `1px solid ${colorTokens.brand}30`,
            borderRadius: 2
          }
        }}
      >
        <MenuList>
          {selectedMembership?.status === 'active' && [
            <MenuItemComponent 
              key="freeze"
              onClick={() => {
                if (selectedMembership) {
                  handleFreezeMembership(selectedMembership);
                }
              }}
              disabled={freezeLoading}
              sx={{ color: colorTokens.info }}
            >
              <ListItemIcon>
                {freezeLoading ? (
                  <CircularProgress size={20} sx={{ color: colorTokens.info }} />
                ) : (
                  <PauseIcon sx={{ color: colorTokens.info }} />
                )}
              </ListItemIcon>
              <ListItemText>
                {freezeLoading ? 'Congelando...' : '🧊 Congelar Membresía'}
              </ListItemText>
            </MenuItemComponent>,
            
            <MenuItemComponent 
              key="cancel"
              onClick={() => {
                if (selectedMembership) {
                  handleStatusChange(selectedMembership, 'cancelled');
                  setActionMenuAnchor(null);
                }
              }}
              sx={{ color: colorTokens.danger }}
            >
              <ListItemIcon>
                <BlockIcon sx={{ color: colorTokens.danger }} />
              </ListItemIcon>
              <ListItemText>🚫 Cancelar Membresía</ListItemText>
            </MenuItemComponent>
          ]}
          
          {selectedMembership?.status === 'frozen' && (
            <MenuItemComponent 
              onClick={() => {
                if (selectedMembership) {
                  handleUnfreezeMembership(selectedMembership);
                }
              }}
              disabled={unfreezeLoading}
              sx={{ color: colorTokens.success }}
            >
              <ListItemIcon>
                {unfreezeLoading ? (
                  <CircularProgress size={20} sx={{ color: colorTokens.success }} />
                ) : (
                  <PlayArrowIcon sx={{ color: colorTokens.success }} />
                )}
              </ListItemIcon>
              <ListItemText>
                {unfreezeLoading ? 'Reactivando...' : '🔄 Reactivar Membresía'}
              </ListItemText>
            </MenuItemComponent>
          )}
        </MenuList>
      </Menu>

      {/* ✅ MODAL DE OPERACIONES MASIVAS CON onPreviewUpdate */}
      <BulkOperationModal
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        operation={bulkOperation}
        onOperationChange={(updates) => setBulkOperation(prev => ({ ...prev, ...updates }))}
        onExecute={executeBulkOperation}
        loading={bulkLoading}
        progress={bulkProgress}
        results={bulkResults}
        preview={bulkPreview}
        showPreview={showPreview}
        formatDisplayDate={formatDisplayDate}
        onPreviewUpdate={updatePreview}
      />

      {/* MODAL DE DETALLES */}
      <MembershipDetailsModal
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        membership={selectedMembership}
        onEdit={() => {
          if (selectedMembership) {
            initializeEditData(selectedMembership);
            setDetailsDialogOpen(false);
            setEditDialogOpen(true);
          }
        }}
        formatDisplayDate={formatDisplayDate}
        formatTimestampForDisplay={formatTimestampForDisplay}
        formatPrice={formatPrice}
        calculateDaysRemaining={calculateDaysRemaining}
        getCurrentFrozenDays={getCurrentFrozenDays}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        paymentMethodOptions={paymentMethodOptions}
      />

      {/* ✅ MODAL DE EDICIÓN */}
      <MembershipEditModal
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditData({});
        }}
        membership={selectedMembership}
        onSave={handleSaveEdit}
        loading={editLoading}
        formatDisplayDate={formatDisplayDate}
        formatPrice={formatPrice}
        addDaysToDate={addDaysToDate}
        plans={plans}
      />
    </Box>
  );
}