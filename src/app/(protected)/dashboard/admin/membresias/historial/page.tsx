// pages/HistorialMembresiaPage.tsx - ACTUALIZADO CON PALETA UNIFICADA
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
  Menu,
  MenuItem as MenuItemComponent,
  MenuList,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// 🎯 HOOKS PERSONALIZADOS IMPORTADOS
import { useMembershipFilters } from '@/hooks/useMembershipFilters';
import { useBulkOperations } from '@/hooks/useBulkOperations';
import { useMembershipCRUD } from '@/hooks/useMembershipCRUD';

// 🧩 COMPONENTES SEPARADOS IMPORTADOS
import MembershipTable from '@/components/membership/MembershipTable';
import FilterPanel from '@/components/membership/FilterPanel';
import BulkOperationPanel from '@/components/membership/BulkOperationPanel';
import BulkOperationModal from '@/components/membership/BulkOperationModal';

// ✅ PALETA DE COLORES UNIFICADA - Igual que registrar membresía
const colorTokens = {
  // Colores base
  brand: '#FFCC00',
  black: '#000000',
  white: '#FFFFFF',
  
  // Escala neutra (Dark Theme)
  neutral0: '#0A0A0B',
  neutral50: '#0F1012',
  neutral100: '#14161A',
  neutral200: '#1B1E24',
  neutral300: '#23272F',
  neutral400: '#2C313B',
  neutral500: '#363C48',
  neutral600: '#424959',
  neutral700: '#535B6E',
  neutral800: '#6A7389',
  neutral900: '#8B94AA',
  neutral1000: '#C9CFDB',
  neutral1100: '#E8ECF5',
  neutral1200: '#FFFFFF',
  
  // Semánticos
  success: '#22C55E',
  danger: '#EF4444',
  info: '#38BDF8',
  warning: '#FFCC00', // Mismo que brand
  
  // Escala de marca
  brand50: '#FFF4CC',
  brand100: '#FFE999',
  brand200: '#FFDD66',
  brand300: '#FFD333',
  brand400: '#FFCC00',
  brand500: '#E6B800',
  brand600: '#CCA300',
  brand700: '#A67F00',
  brand800: '#806300',
  brand900: '#594400'
};

// 🔧 ICONOS
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Group as GroupIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AcUnit as AcUnitIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
  Block as BlockIcon,
  BatchPrediction as BatchIcon
} from '@mui/icons-material';

// ✅ OPCIONES VERIFICADAS (Actualizadas con nueva paleta)
const statusOptions = [
  { value: '', label: 'Todos los estados', color: colorTokens.neutral800, icon: '📋' },
  { value: 'active', label: 'Activa', color: colorTokens.success, icon: '✅' },
  { value: 'expired', label: 'Vencida', color: colorTokens.danger, icon: '❌' },
  { value: 'frozen', label: 'Congelada', color: colorTokens.info, icon: '🧊' },
  { value: 'cancelled', label: 'Cancelada', color: colorTokens.neutral600, icon: '🚫' }
];

const paymentMethodOptions = [
  { value: '', label: 'Todos los métodos', icon: '💳' },
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'debito', label: 'Débito', icon: '💳' },
  { value: 'credito', label: 'Crédito', icon: '💳' },
  { value: 'transferencia', label: 'Transferencia', icon: '🏦' },
  { value: 'mixto', label: 'Mixto', icon: '🔄' }
];

export default function HistorialMembresiaPage() {
  const router = useRouter();
  
  // 🎯 HOOKS PERSONALIZADOS - LÓGICA SEPARADA
  const {
    memberships,
    plans,
    loading,
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
    getBulkOperationTitle,
    formatDisplayDate,
    getCurrentFrozenDays
  } = useBulkOperations(memberships, forceReloadMemberships);

  // 🔧 ESTADOS LOCALES SIMPLIFICADOS
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [unfreezeLoading, setUnfreezeLoading] = useState(false);

  // ✅ FUNCIONES UTILITARIAS MEMOIZADAS
  const calculateDaysRemaining = useCallback((endDate: string | null): number | null => {
    if (!endDate) return null;
    
    try {
      const today = new Date();
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endDateObj = new Date(endDate + 'T00:00:00');
      
      if (isNaN(todayDate.getTime()) || isNaN(endDateObj.getTime())) {
        return null;
      }
      
      const diffTime = endDateObj.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      return null;
    }
  }, []);

  // ✅ FUNCIONES DE CONGELAMIENTO INDIVIDUAL (Con toast notifications)
  const handleFreezeMembership = useCallback(async (membership: any) => {
    try {
      setFreezeLoading(true);
      const toastId = toast.loading('🧊 Congelando membresía...');
      
      if (membership.status !== 'active') {
        toast.error('Solo se pueden congelar membresías activas', { id: toastId });
        return;
      }

      // Aquí iría la lógica de congelamiento individual
      // Simulando delay de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('✅ Membresía congelada exitosamente', { id: toastId });
      await forceReloadMemberships();
      setActionMenuAnchor(null);
      
    } catch (err: any) {
      toast.error(`Error al congelar membresía: ${err.message}`);
    } finally {
      setFreezeLoading(false);
    }
  }, [forceReloadMemberships]);

  const handleUnfreezeMembership = useCallback(async (membership: any) => {
    try {
      setUnfreezeLoading(true);
      const toastId = toast.loading('🔄 Reactivando membresía...');
      
      if (membership.status !== 'frozen') {
        toast.error('Solo se pueden reactivar membresías congeladas', { id: toastId });
        return;
      }

      // Aquí iría la lógica de reactivación individual
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('✅ Membresía reactivada exitosamente', { id: toastId });
      await forceReloadMemberships();
      setActionMenuAnchor(null);
      
    } catch (err: any) {
      toast.error(`Error al reactivar membresía: ${err.message}`);
    } finally {
      setUnfreezeLoading(false);
    }
  }, [forceReloadMemberships]);

  // ✅ HANDLERS MEMOIZADOS PARA COMPONENTES
  const handleViewDetails = useCallback((membership: any) => {
    setSelectedMembership(membership);
    setDetailsDialogOpen(true);
  }, [setSelectedMembership, setDetailsDialogOpen]);

  const handleEdit = useCallback((membership: any) => {
    setSelectedMembership(membership);
    initializeEditData(membership);
    setEditDialogOpen(true);
  }, [setSelectedMembership, initializeEditData, setEditDialogOpen]);

  const handleMoreActions = useCallback((event: React.MouseEvent<HTMLElement>, membership: any) => {
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

  // ✅ HANDLERS PARA BULK OPERATIONS
  const handleBulkFreezeWrapper = useCallback((isManual: boolean) => {
    try {
      handleBulkFreeze(isManual, filteredMemberships);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [handleBulkFreeze, filteredMemberships]);

  const handleBulkUnfreezeWrapper = useCallback((isManual: boolean) => {
    try {
      handleBulkUnfreeze(isManual, filteredMemberships);
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [handleBulkUnfreeze, filteredMemberships]);

  const handleSelectAllWrapper = useCallback(() => {
    handleSelectAllMemberships(filteredMemberships);
  }, [handleSelectAllMemberships, filteredMemberships]);

  // ✅ EFFECTS
  useEffect(() => {
    loadMemberships();
    loadPlans();
  }, [loadMemberships, loadPlans]);

  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      minHeight: '100vh',
      color: colorTokens.neutral1200
    }}>
      {/* ✅ HEADER PROFESIONAL CON NUEVA PALETA */}
      <Paper sx={{
        p: 4,
        mb: 4,
        background: `linear-gradient(135deg, ${colorTokens.neutral200}98, ${colorTokens.neutral300}95)`,
        border: `2px solid ${colorTokens.brand}30`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${colorTokens.brand}10`
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Box>
            <Typography variant="h3" sx={{ 
              color: colorTokens.brand, 
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}>
              <HistoryIcon sx={{ fontSize: 50 }} />
              Sistema de Historial de Membresías
            </Typography>
            <Typography variant="h6" sx={{ 
              color: colorTokens.neutral800,
              fontWeight: 300
            }}>
              Gestión Integral | Congelamiento Inteligente | Control Masivo Avanzado
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={forceReloadMemberships}
              disabled={loading}
              sx={{ 
                color: colorTokens.info,
                borderColor: `${colorTokens.info}60`,
                px: 3,
                py: 1.5,
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
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
            
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/dashboard/admin/membresias')}
              sx={{ 
                color: colorTokens.brand,
                borderColor: `${colorTokens.brand}60`,
                px: 3,
                py: 1.5,
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

        {/* ✅ ESTADÍSTICAS MEJORADAS CON NUEVA PALETA */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.info}20, ${colorTokens.info}10)`,
              border: `1px solid ${colorTokens.info}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: colorTokens.info, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <GroupIcon />
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                Total Membresías
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.success}20, ${colorTokens.success}10)`,
              border: `1px solid ${colorTokens.success}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: colorTokens.success, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <CheckCircleIcon />
                {stats.active}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                Activas
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.info}20, ${colorTokens.info}10)`,
              border: `1px solid ${colorTokens.info}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: colorTokens.info, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <AcUnitIcon />
                {stats.frozen}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                Congeladas
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.danger}20, ${colorTokens.danger}10)`,
              border: `1px solid ${colorTokens.danger}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h4" sx={{ 
                color: colorTokens.danger, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <CancelIcon />
                {stats.expired}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                Vencidas
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
              border: `1px solid ${colorTokens.brand}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h5" sx={{ 
                color: colorTokens.brand, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <AttachMoneyIcon />
                {formatPrice(stats.totalRevenue).replace('MX$', '$')}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                Ingresos Totales
              </Typography>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.warning}20, ${colorTokens.warning}10)`,
              border: `1px solid ${colorTokens.warning}30`,
              borderRadius: 3,
              textAlign: 'center',
              p: 2
            }}>
              <Typography variant="h6" sx={{ 
                color: colorTokens.warning, 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <TrendingUpIcon />
                {formatPrice(stats.totalCommissions).replace('MX$', '$')}
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                Comisiones
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* 🧩 COMPONENTE DE OPERACIONES MASIVAS */}
      <AnimatePresence>
        {bulkMode && (
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

      {/* 🧩 COMPONENTE DE FILTROS */}
      <FilterPanel
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        plans={plans}
        hasActiveFilters={hasActiveFilters}
        statusOptions={statusOptions}
        paymentMethodOptions={paymentMethodOptions}
      />

      {/* ✅ BOTÓN PARA ACTIVAR MODO MASIVO */}
      {!bulkMode && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            startIcon={<BatchIcon />}
            onClick={() => setBulkMode(true)}
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

      {/* 🧩 COMPONENTE DE TABLA PRINCIPAL */}
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.brand}20`,
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
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

      {/* ✅ MENU DE ACCIONES CON NUEVA PALETA */}
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
          {selectedMembership?.status === 'active' && (
            <>
              <MenuItemComponent 
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
              </MenuItemComponent>
              
              <MenuItemComponent 
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
            </>
          )}
          
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

      {/* 🧩 MODAL DE OPERACIONES MASIVAS */}
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
      />

      {/* TODO: Añadir aquí los modales de Details y Edit cuando se extraigan */}
    </Box>
  );
}
