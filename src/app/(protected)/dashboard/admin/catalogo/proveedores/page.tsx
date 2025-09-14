// 📁 src/app/dashboard/admin/catalogo/proveedores/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  Snackbar,
  CircularProgress,
  Fab,
  Avatar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Rating,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  FileDownload as ExportIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Language as WebsiteIcon,
  Assessment as AssessmentIcon,
  CreditCard as CreditIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// 🎯 IMPORTAR NUESTROS HOOKS ENTERPRISE Y TIPOS
import { useSuppliers, useSupplierStats } from '@/hooks/useCatalog';
import { Supplier } from '@/services/catalogService'; // Mejora #3: Tipado fuerte
import SupplierFormDialog from '@/components/catalogo/SupplierFormDialog';

// 🎨 DARK PRO SYSTEM - TOKENS CENTRALIZADOS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

const STATUS_FILTERS = [
  { value: 'active', label: '✅ Proveedores Activos' },
  { value: 'inactive', label: '❌ Proveedores Inactivos' },
  { value: 'all', label: '📋 Todos los Proveedores' }
];

const RATING_FILTERS = [
  { value: '', label: 'Todas las calificaciones' },
  { value: 5, label: '⭐⭐⭐⭐⭐ 5 estrellas' },
  { value: 4, label: '⭐⭐⭐⭐ 4+ estrellas' },
  { value: 3, label: '⭐⭐⭐ 3+ estrellas' },
  { value: 2, label: '⭐⭐ 2+ estrellas' },
  { value: 1, label: '⭐ 1+ estrellas' }
];

export default function ProveedoresPage() {
  const router = useRouter();
  
  // 🎯 USAR NUESTROS HOOKS ENTERPRISE
  const {
    suppliers,
    loading,
    error,
    total,
    page,
    hasMore,
    filters,
    notification,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    restoreSupplier,
    updateFilters,
    changePage,
    reload,
    closeNotification
  } = useSuppliers({
    status: 'active',
    limit: 20
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError,
    reload: reloadStats
  } = useSupplierStats();

  // 🎯 ESTADOS LOCALES SIMPLIFICADOS - MEJORA #3: TIPADO FUERTE
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSupplier, setMenuSupplier] = useState<Supplier | null>(null);

  // ✅ MEJORA #2: MEMORIZAR CÁLCULO DE CATEGORÍAS ÚNICAS
  const uniqueCategories = useMemo(() => {
    const allCategories = suppliers.flatMap(s => s.categories || []);
    return [...new Set(allCategories)];
  }, [suppliers]);

  // 🎯 FUNCIONES SIMPLIFICADAS - MEJORA #1: ELIMINAR ESTADOS REDUNDANTES
  const handleSearch = (value: string) => {
    updateFilters({ search: value, page: 1 }); // Resetear página al filtrar
  };

  const handleCategoryFilter = (value: string) => {
    updateFilters({ category: value, page: 1 });
  };

  const handleRatingFilter = (value: string) => {
    updateFilters({ rating: value ? parseInt(value) : undefined, page: 1 });
  };

  const handleStatusFilter = (value: string) => {
    updateFilters({ status: value as any, page: 1 });
  };

  const openSupplierDialog = (supplier?: Supplier) => {
    setSelectedSupplier(supplier || null);
    setSupplierDialogOpen(true);
    setMenuAnchor(null);
  };

  const closeSupplierDialog = () => {
    setSelectedSupplier(null);
    setSupplierDialogOpen(false);
  };

  const handleSupplierSave = () => {
  console.log('🔄 Proveedor guardado, recargando datos...');
  reload(); // Recargar la lista de proveedores
  reloadStats(); // Recargar las estadísticas también
  closeSupplierDialog(); // Cerrar el diálogo
};

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, supplier: Supplier) => {
    setMenuAnchor(event.currentTarget);
    setMenuSupplier(supplier);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuSupplier(null);
  };

  const handleDelete = async (supplierId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;
    
    await deleteSupplier(supplierId);
    handleMenuClose();
  };

  const handleRestore = async (supplierId: string) => {
    await restoreSupplier(supplierId);
    handleMenuClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBalanceColor = (supplier: Supplier): 'error' | 'warning' | 'success' | 'info' => {
    const balance = supplier.current_balance || 0;
    const creditLimit = supplier.credit_limit || 0;
    
    if (balance < 0) return 'error';
    if (creditLimit > 0 && balance >= creditLimit * 0.8) return 'warning';
    if (balance > 0) return 'info';
    return 'success';
  };

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return darkProTokens.success;
    if (rating >= 3.5) return darkProTokens.primary;
    if (rating >= 2.5) return darkProTokens.warning;
    return darkProTokens.error;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
      p: 3
    }}>
      {/* 🔔 NOTIFICACIÓN ENTERPRISE */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={notification.severity}
          onClose={closeNotification}
          sx={{
            background: notification.severity === 'success' ? 
              `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})` :
              notification.severity === 'error' ?
              `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})` :
              notification.severity === 'warning' ?
              `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})` :
              `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
            color: darkProTokens.textPrimary,
            fontWeight: 600,
            borderRadius: 3
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* 📊 HEADER CON ESTADÍSTICAS ENTERPRISE */}
      <Paper sx={{
        p: 4,
        mb: 4,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `2px solid ${darkProTokens.primary}30`,
        borderRadius: 4,
        boxShadow: `0 8px 32px ${darkProTokens.primary}10`
      }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{
                fontWeight: 800,
                color: darkProTokens.primary,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 1
              }}
            >
              <BusinessIcon sx={{ fontSize: 50 }} />
              Gestión de Proveedores
            </Typography>
            <Typography variant="h6" sx={{ 
              color: darkProTokens.textSecondary,
              fontWeight: 300
            }}>
              Directorio | Relaciones Comerciales | Control de Crédito
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              sx={{ 
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              Reportes
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              sx={{ 
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              Exportar
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={reload}
              disabled={loading}
              sx={{ 
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Actualizar'}
            </Button>
          </Box>
        </Box>

        {/* 📊 ESTADÍSTICAS CON LOADING STATE */}
        {statsLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: darkProTokens.primary }} />
          </Box>
        ) : statsError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error al cargar estadísticas: {statsError}
          </Alert>
        ) : stats ? (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${darkProTokens.info}10`, 
                border: `1px solid ${darkProTokens.info}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                        {stats.totalSuppliers}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Total de Proveedores
                      </Typography>
                    </Box>
                    <BusinessIcon sx={{ fontSize: 40, color: darkProTokens.info, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${darkProTokens.success}10`, 
                border: `1px solid ${darkProTokens.success}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                        {stats.activeSuppliers}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Proveedores Activos
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ fontSize: 40, color: darkProTokens.success, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${darkProTokens.warning}10`, 
                border: `1px solid ${darkProTokens.warning}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                        {formatPrice(stats.totalCreditLimit)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Límite de Crédito Total
                      </Typography>
                    </Box>
                    <CreditIcon sx={{ fontSize: 40, color: darkProTokens.warning, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                background: `${darkProTokens.error}10`, 
                border: `1px solid ${darkProTokens.error}30`,
                borderRadius: 3
              }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.error }}>
                        {formatPrice(stats.totalBalance)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                        Saldo Pendiente Total
                      </Typography>
                    </Box>
                    <AccountBalanceIcon sx={{ fontSize: 40, color: darkProTokens.error, opacity: 0.8 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : null}
      </Paper>

      {/* 🔍 FILTROS ENTERPRISE - MEJORA #1: USAR ESTADO CENTRALIZADO */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar proveedores..."
              value={filters.search || ''} // ✅ Usar estado centralizado
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: darkProTokens.primary }} />
                  </InputAdornment>
                ),
                sx: {
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}30`
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkProTokens.primary
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: darkProTokens.primary
                  }
                }
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: darkProTokens.textSecondary,
                '&.Mui-focused': { color: darkProTokens.primary }
              }}>
                Categoría
              </InputLabel>
              <Select
                value={filters.category || ''} // ✅ Usar estado centralizado
                label="Categoría"
                onChange={(e) => handleCategoryFilter(e.target.value)}
                sx={{
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}30`
                  }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {/* ✅ MEJORA #2: USAR CATEGORÍAS MEMORIZADAS */}
                {uniqueCategories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: darkProTokens.textSecondary,
                '&.Mui-focused': { color: darkProTokens.primary }
              }}>
                Calificación
              </InputLabel>
              <Select
                value={filters.rating?.toString() || ''} // ✅ Usar estado centralizado
                label="Calificación"
                onChange={(e) => handleRatingFilter(e.target.value)}
                sx={{
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}30`
                  }
                }}
              >
                {RATING_FILTERS.map((filter) => (
                  <MenuItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ 
                color: darkProTokens.textSecondary,
                '&.Mui-focused': { color: darkProTokens.primary }
              }}>
                Estado
              </InputLabel>
              <Select
                value={filters.status}
                label="Estado"
                onChange={(e) => handleStatusFilter(e.target.value)}
                sx={{
                  color: darkProTokens.textPrimary,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: `${darkProTokens.primary}30`
                  }
                }}
              >
                {STATUS_FILTERS.map((filter) => (
                  <MenuItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <Typography variant="body2" sx={{ 
              color: darkProTokens.textSecondary, 
              textAlign: 'center' 
            }}>
              {suppliers.length} de {total} proveedores
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                // ✅ LIMPIAR FILTROS USANDO ESTADO CENTRALIZADO
                updateFilters({ 
                  search: '', 
                  category: '', 
                  rating: undefined,
                  page: 1 
                });
              }}
              sx={{
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}40`
              }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 📋 TABLA DE PROVEEDORES ENTERPRISE */}
      <Paper sx={{ 
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3
      }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress sx={{ color: darkProTokens.primary }} size={40} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 3 }}>
            Error al cargar proveedores: {error}
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ 
                    background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`
                  }}>
                    <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Proveedor</TableCell>
                    <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Contacto</TableCell>
                    <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Categorías</TableCell>
                    <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Calificación</TableCell>
                    <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
                    <TableCell align="right" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Crédito</TableCell>
                    <TableCell align="center" sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow 
                      key={supplier.id} 
                      hover
                      sx={{ 
                        opacity: supplier.is_active === false ? 0.6 : 1,
                        backgroundColor: supplier.is_active === false ? `${darkProTokens.error}10` : 'transparent',
                        '&:hover': {
                          backgroundColor: `${darkProTokens.primary}05`
                        }
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ 
                            backgroundColor: `${darkProTokens.primary}20`,
                            color: darkProTokens.primary,
                            fontWeight: 'bold'
                          }}>
                            {supplier.company_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                              {supplier.company_name}
                            </Typography>
                            {supplier.rfc && (
                              <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                                RFC: {supplier.rfc}
                              </Typography>
                            )}
                            {supplier.is_active === false && (
                              <Chip 
                                label="INACTIVO" 
                                sx={{
                                  backgroundColor: darkProTokens.error,
                                  color: darkProTokens.textPrimary,
                                  fontWeight: 700,
                                  ml: 1
                                }} 
                                size="small" 
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {supplier.contact_person && (
                            <Typography variant="subtitle2" sx={{ color: darkProTokens.textPrimary }}>
                              {supplier.contact_person}
                            </Typography>
                          )}
                          <Box display="flex" gap={1} mt={0.5}>
                            {supplier.email && (
                              <Tooltip title={supplier.email}>
                                <IconButton size="small" sx={{ color: darkProTokens.info }}>
                                  <EmailIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {supplier.phone && (
                              <Tooltip title={supplier.phone}>
                                <IconButton size="small" sx={{ color: darkProTokens.success }}>
                                  <PhoneIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {supplier.whatsapp && (
                              <Tooltip title={supplier.whatsapp}>
                                <IconButton size="small" sx={{ color: darkProTokens.success }}>
                                  <WhatsAppIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {supplier.website && (
                              <Tooltip title={supplier.website}>
                                <IconButton size="small" sx={{ color: darkProTokens.primary }}>
                                  <WebsiteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {supplier.categories && supplier.categories.length > 0 ? (
                            supplier.categories.slice(0, 2).map((category, index) => (
                              <Chip 
                                key={index}
                                label={category} 
                                size="small" 
                                sx={{
                                  backgroundColor: `${darkProTokens.info}20`,
                                  color: darkProTokens.info,
                                  border: `1px solid ${darkProTokens.info}40`
                                }}
                              />
                            ))
                          ) : (
                            <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                              Sin categorías
                            </Typography>
                          )}
                          {supplier.categories && supplier.categories.length > 2 && (
                            <Chip 
                              label={`+${supplier.categories.length - 2}`}
                              size="small" 
                              sx={{
                                backgroundColor: `${darkProTokens.textSecondary}20`,
                                color: darkProTokens.textSecondary,
                                border: `1px solid ${darkProTokens.textSecondary}40`
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <Rating 
                            value={supplier.rating || 0} 
                            readOnly 
                            size="small"
                            sx={{
                              '& .MuiRating-iconFilled': {
                                color: getRatingColor(supplier.rating || 0)
                              }
                            }}
                          />
                          <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                            {supplier.rating || 0}/5
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          icon={supplier.is_active === false ? <WarningIcon /> : <CheckCircleIcon />}
                          label={supplier.is_active === false ? 'Inactivo' : 'Activo'}
                          sx={{
                            backgroundColor: supplier.is_active === false ? `${darkProTokens.error}20` : `${darkProTokens.success}20`,
                            color: supplier.is_active === false ? darkProTokens.error : darkProTokens.success,
                            border: `1px solid ${supplier.is_active === false ? darkProTokens.error : darkProTokens.success}40`
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                            Límite: {formatPrice(supplier.credit_limit || 0)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: getBalanceColor(supplier) === 'error' ? darkProTokens.error :
                                    getBalanceColor(supplier) === 'warning' ? darkProTokens.warning :
                                    getBalanceColor(supplier) === 'info' ? darkProTokens.info :
                                    darkProTokens.success
                            }}
                          >
                            Saldo: {formatPrice(supplier.current_balance || 0)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, supplier)}
                          sx={{ color: darkProTokens.textSecondary }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={total}
              page={page - 1} // TablePagination usa índice base 0
              onPageChange={(_, newPage) => changePage(newPage + 1)}
              rowsPerPage={filters.limit || 20}
              onRowsPerPageChange={(e) => {
                updateFilters({ limit: parseInt(e.target.value, 10) });
              }}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
              sx={{
                color: darkProTokens.textSecondary,
                borderTop: `1px solid ${darkProTokens.grayDark}`,
                '& .MuiTablePagination-selectIcon': { color: darkProTokens.textSecondary },
                '& .MuiTablePagination-actions button': { color: darkProTokens.textSecondary }
              }}
            />
          </>
        )}
      </Paper>

      {/* 🎯 FAB PARA AGREGAR PROVEEDOR */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
          color: darkProTokens.background,
          fontWeight: 700,
          '&:hover': {
            background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
            transform: 'scale(1.1)'
          }
        }}
        onClick={() => openSupplierDialog()}
      >
        <AddIcon />
      </Fab>

      {/* 📝 MENÚ DE ACCIONES */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.primary}30`,
            borderRadius: 2,
            color: darkProTokens.textPrimary
          }
        }}
      >
        <MenuItem onClick={() => openSupplierDialog(menuSupplier!)}>
          <ListItemIcon>
            <EditIcon sx={{ color: darkProTokens.primary }} />
          </ListItemIcon>
          <ListItemText>Editar Proveedor</ListItemText>
        </MenuItem>
        
        {menuSupplier?.is_active === false ? (
          <MenuItem onClick={() => handleRestore(menuSupplier.id)}>
            <ListItemIcon>
              <RestoreIcon sx={{ color: darkProTokens.success }} />
            </ListItemIcon>
            <ListItemText>Restaurar Proveedor</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleDelete(menuSupplier?.id!)}>
            <ListItemIcon>
              <DeleteIcon sx={{ color: darkProTokens.error }} />
            </ListItemIcon>
            <ListItemText>Eliminar Proveedor</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => {
          // Navegar a productos del proveedor
          router.push(`/dashboard/admin/catalogo/productos?supplier=${menuSupplier?.id}`);
          handleMenuClose();
        }}>
          <ListItemIcon>
            {menuSupplier?.is_active === false ? 
              <VisibilityOffIcon sx={{ color: darkProTokens.warning }} /> : 
              <VisibilityIcon sx={{ color: darkProTokens.info }} />
            }
          </ListItemIcon>
          <ListItemText>Ver Productos</ListItemText>
        </MenuItem>
      </Menu>

      {/* 📝 DIALOG DE FORMULARIO */}
      <SupplierFormDialog
  open={supplierDialogOpen}
  onClose={closeSupplierDialog}
  supplier={selectedSupplier}
  onSave={handleSupplierSave}
/>
    </Box>
  );
}