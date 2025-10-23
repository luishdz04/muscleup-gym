// src/app/(protected)/dashboard/admin/catalogo/proveedores/page.tsx
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
  CircularProgress,
  Fab,
  Avatar,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Rating,
  Fade,
  Slide
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
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Language as WebsiteIcon,
  CreditCard as CreditIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

// ✅ IMPORTS ENTERPRISE v6.0
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { notify } from '@/utils/notifications';
import { showSuccess, showError, showDeleteConfirmation, showConfirmation } from '@/lib/notifications/MySwal';
import { formatTimestampForDisplay } from '@/utils/dateUtils';
import { useSuppliers, useSupplierStats } from '@/hooks/useCatalog';
import { Supplier } from '@/services/catalogService';
import SupplierFormDialog from '@/components/catalogo/SupplierFormDialog';

const STATUS_FILTERS = [
  { value: 'active', label: 'Proveedores Activos' },
  { value: 'inactive', label: 'Proveedores Inactivos' },
  { value: 'all', label: 'Todos los Proveedores' }
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
  const hydrated = useHydrated();
  
  // HOOKS ENTERPRISE
  const {
    suppliers,
    loading,
    error,
    total,
    page,
    filters,
    updateFilters,
    changePage,
    deleteSupplier,
    restoreSupplier,
    reload
  } = useSuppliers({
    status: 'active',
    limit: 20
  });

  const {
    stats,
    loading: statsLoading,
    reload: reloadStats
  } = useSupplierStats();

  // ESTADOS LOCALES
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSupplier, setMenuSupplier] = useState<Supplier | null>(null);

  // CATEGORÍAS ÚNICAS MEMORIZADAS
  const uniqueCategories = useMemo(() => {
    const allCategories = suppliers.flatMap(s => s.categories || []);
    return [...new Set(allCategories)];
  }, [suppliers]);

  // HANDLERS
  const handleSearch = (value: string) => {
    updateFilters({ search: value, page: 1 });
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

  const handleSupplierSave = async () => {
    reload();
    reloadStats();
    closeSupplierDialog();
    await showSuccess('Proveedor guardado exitosamente', '✅ Proveedor Guardado');
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
    const result = await showDeleteConfirmation('este proveedor');
    if (result.isConfirmed) {
      const finalResult = await showConfirmation(
        `¿Estás COMPLETAMENTE seguro de eliminar este proveedor?\n\n` +
        `Esta acción eliminará:\n` +
        `• El proveedor del catálogo\n` +
        `• Todas las referencias asociadas\n` +
        `• El historial de compras\n\n` +
        `⚠️ Esta acción NO se puede deshacer`,
        '⚠️ Confirmación Final',
        'Sí, eliminar definitivamente',
        'Cancelar'
      );
      
      if (finalResult.isConfirmed) {
        try {
          await deleteSupplier(supplierId);
          await showSuccess('Proveedor eliminado exitosamente', '✅ Proveedor Eliminado');
          reload();
          reloadStats();
        } catch (error: any) {
          await showError(`Error al eliminar proveedor: ${error.message}`, '❌ Error');
        }
      }
    }
    handleMenuClose();
  };

  const handleRestore = async (supplierId: string) => {
    await restoreSupplier(supplierId);
    handleMenuClose();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
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
    if (rating >= 4.5) return colorTokens.success;
    if (rating >= 3.5) return colorTokens.brand;
    if (rating >= 2.5) return colorTokens.warning;
    return colorTokens.danger;
  };

  // SSR SAFETY
  if (!hydrated) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
        flexDirection: 'column',
        gap: 3
      }}>
        <CircularProgress size={80} sx={{ color: colorTokens.brand }} />
        <Typography variant="h5" sx={{ color: colorTokens.textSecondary }}>
          Cargando Gestión de Proveedores...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${colorTokens.neutral0}, ${colorTokens.neutral100})`,
      color: colorTokens.textPrimary,
      p: 3
    }}>
      {/* HEADER CON ESTADÍSTICAS */}
      <Fade in timeout={1000}>
        <Paper sx={{
          p: 4,
          mb: 4,
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}30`,
          borderRadius: 4,
          boxShadow: `0 12px 40px ${colorTokens.glow}`,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.brandHover})`
          }
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{
                  fontWeight: 900,
                  color: colorTokens.brand,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 1,
                  textShadow: `0 2px 8px ${colorTokens.glow}`
                }}
              >
                <BusinessIcon sx={{ fontSize: 50 }} />
                Gestión de Proveedores
              </Typography>
              <Typography variant="h6" sx={{ 
                color: colorTokens.textSecondary,
                fontWeight: 400
              }}>
                Directorio | Relaciones Comerciales | Control de Crédito
              </Typography>
            </Box>
            
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={reload}
              disabled={loading}
              sx={{ 
                color: colorTokens.textSecondary,
                borderColor: `${colorTokens.textSecondary}60`,
                px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Actualizar'}
            </Button>
          </Box>

          {/* ESTADÍSTICAS */}
          {statsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress sx={{ color: colorTokens.brand }} />
            </Box>
          ) : stats ? (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${colorTokens.info}15, ${colorTokens.info}10)`, 
                  border: `1px solid ${colorTokens.info}30`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${colorTokens.info}20`
                  }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.info }}>
                          {stats.totalSuppliers}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Total de Proveedores
                        </Typography>
                      </Box>
                      <BusinessIcon sx={{ fontSize: 40, color: colorTokens.info, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${colorTokens.success}15, ${colorTokens.success}10)`, 
                  border: `1px solid ${colorTokens.success}30`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${colorTokens.success}20`
                  }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.success }}>
                          {stats.activeSuppliers}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Proveedores Activos
                        </Typography>
                      </Box>
                      <CheckCircleIcon sx={{ fontSize: 40, color: colorTokens.success, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${colorTokens.warning}15, ${colorTokens.warning}10)`, 
                  border: `1px solid ${colorTokens.warning}30`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${colorTokens.warning}20`
                  }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.warning }}>
                          {formatPrice(stats.totalCreditLimit)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Límite de Crédito Total
                        </Typography>
                      </Box>
                      <CreditIcon sx={{ fontSize: 40, color: colorTokens.warning, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ 
                  background: `linear-gradient(135deg, ${colorTokens.danger}15, ${colorTokens.danger}10)`, 
                  border: `1px solid ${colorTokens.danger}30`,
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${colorTokens.danger}20`
                  }
                }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.danger }}>
                          {formatPrice(stats.totalBalance)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                          Saldo Pendiente Total
                        </Typography>
                      </Box>
                      <AccountBalanceIcon sx={{ fontSize: 40, color: colorTokens.danger, opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : null}
        </Paper>
      </Fade>

      {/* FILTROS */}
      <Slide in direction="up" timeout={600}>
        <Paper sx={{ 
          p: 3, 
          mb: 3,
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `1px solid ${colorTokens.border}`,
          borderRadius: 3
        }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                placeholder="Buscar proveedores..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: colorTokens.brand }} />
                    </InputAdornment>
                  ),
                  sx: {
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.brand
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colorTokens.brand
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ 
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': { color: colorTokens.brand }
                }}>
                  Categoría
                </InputLabel>
                <Select
                  value={filters.category || ''}
                  label="Categoría"
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
                    }
                  }}
                >
                  <MenuItem value="">Todas</MenuItem>
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
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': { color: colorTokens.brand }
                }}>
                  Calificación
                </InputLabel>
                <Select
                  value={filters.rating?.toString() || ''}
                  label="Calificación"
                  onChange={(e) => handleRatingFilter(e.target.value)}
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
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
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': { color: colorTokens.brand }
                }}>
                  Estado
                </InputLabel>
                <Select
                  value={filters.status}
                  label="Estado"
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  sx={{
                    color: colorTokens.textPrimary,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colorTokens.brand}30`
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
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                  {suppliers.length}
                </Typography>
                <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                  de {total} proveedores
                </Typography>
              </Box>
            </Grid>
            
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => {
                  updateFilters({ 
                    search: '', 
                    category: '', 
                    rating: undefined,
                    page: 1 
                  });
                  await showSuccess('Filtros limpiados', '🧹 Filtros Limpiados');
                }}
                sx={{
                  color: colorTokens.textSecondary,
                  borderColor: `${colorTokens.textSecondary}40`
                }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Slide>

      {/* TABLA DE PROVEEDORES */}
      <Fade in timeout={1000}>
        <Paper sx={{ 
          mb: 3,
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `1px solid ${colorTokens.border}`,
          borderRadius: 3,
          overflow: 'hidden'
        }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress sx={{ color: colorTokens.brand }} size={40} />
            </Box>
          ) : error ? (
            <Box p={3}>
              <Typography color="error">Error al cargar proveedores: {error}</Typography>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral400})`
                    }}>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Proveedor</TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Contacto</TableCell>
                      <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Categorías</TableCell>
                      <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Calificación</TableCell>
                      <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
                      <TableCell align="right" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Crédito</TableCell>
                      <TableCell align="center" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {suppliers.map((supplier) => (
                      <TableRow 
                        key={supplier.id} 
                        hover
                        sx={{ 
                          opacity: supplier.is_active === false ? 0.6 : 1,
                          backgroundColor: supplier.is_active === false ? `${colorTokens.danger}10` : 'transparent',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: colorTokens.hoverOverlay,
                            transform: 'scale(1.005)'
                          }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ 
                              backgroundColor: `${colorTokens.brand}20`,
                              color: colorTokens.brand,
                              fontWeight: 'bold'
                            }}>
                              {supplier.company_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                                {supplier.company_name}
                              </Typography>
                              {supplier.rfc && (
                                <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                  RFC: {supplier.rfc}
                                </Typography>
                              )}
                              {supplier.is_active === false && (
                                <Chip 
                                  label="INACTIVO" 
                                  sx={{
                                    backgroundColor: colorTokens.danger,
                                    color: colorTokens.textOnBrand,
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
                              <Typography variant="subtitle2" sx={{ color: colorTokens.textPrimary }}>
                                {supplier.contact_person}
                              </Typography>
                            )}
                            <Box display="flex" gap={1} mt={0.5}>
                              {supplier.email && (
                                <Tooltip title={supplier.email}>
                                  <IconButton size="small" sx={{ color: colorTokens.info }}>
                                    <EmailIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {supplier.phone && (
                                <Tooltip title={supplier.phone}>
                                  <IconButton size="small" sx={{ color: colorTokens.success }}>
                                    <PhoneIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {supplier.whatsapp && (
                                <Tooltip title={supplier.whatsapp}>
                                  <IconButton size="small" sx={{ color: colorTokens.success }}>
                                    <WhatsAppIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {supplier.website && (
                                <Tooltip title={supplier.website}>
                                  <IconButton size="small" sx={{ color: colorTokens.brand }}>
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
                                    backgroundColor: `${colorTokens.info}20`,
                                    color: colorTokens.info,
                                    border: `1px solid ${colorTokens.info}40`
                                  }}
                                />
                              ))
                            ) : (
                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                Sin categorías
                              </Typography>
                            )}
                            {supplier.categories && supplier.categories.length > 2 && (
                              <Chip 
                                label={`+${supplier.categories.length - 2}`}
                                size="small" 
                                sx={{
                                  backgroundColor: `${colorTokens.textSecondary}20`,
                                  color: colorTokens.textSecondary,
                                  border: `1px solid ${colorTokens.textSecondary}40`
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
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
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
                              backgroundColor: supplier.is_active === false ? `${colorTokens.danger}20` : `${colorTokens.success}20`,
                              color: supplier.is_active === false ? colorTokens.danger : colorTokens.success,
                              border: `1px solid ${supplier.is_active === false ? colorTokens.danger : colorTokens.success}40`
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                              Límite: {formatPrice(supplier.credit_limit || 0)}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: getBalanceColor(supplier) === 'error' ? colorTokens.danger :
                                      getBalanceColor(supplier) === 'warning' ? colorTokens.warning :
                                      getBalanceColor(supplier) === 'info' ? colorTokens.info :
                                      colorTokens.success
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
                            sx={{ 
                              color: colorTokens.textSecondary,
                              '&:hover': {
                                backgroundColor: `${colorTokens.brand}15`,
                                color: colorTokens.brand
                              }
                            }}
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
                page={page - 1}
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
                  color: colorTokens.textSecondary,
                  borderTop: `1px solid ${colorTokens.border}`,
                  background: `${colorTokens.brand}03`,
                  '& .MuiTablePagination-selectIcon': { color: colorTokens.textSecondary },
                  '& .MuiTablePagination-actions button': { 
                    color: colorTokens.textSecondary,
                    '&:hover': {
                      backgroundColor: `${colorTokens.brand}10`
                    }
                  }
                }}
              />
            </>
          )}
        </Paper>
      </Fade>

      {/* FAB PARA AGREGAR PROVEEDOR */}
      <Fab
        sx={{
          position: 'fixed',
          bottom: 80, // Cambiar de 24 a 80 para evitar superposición con scroll to top
          right: 24,
          background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
          color: colorTokens.textOnBrand,
          fontWeight: 700,
          boxShadow: `0 8px 25px ${colorTokens.brand}40`,
          '&:hover': {
            background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
            transform: 'scale(1.1)',
            boxShadow: `0 12px 35px ${colorTokens.brand}60`
          },
          transition: 'all 0.3s ease'
        }}
        onClick={() => openSupplierDialog()}
      >
        <AddIcon />
      </Fab>

      {/* MENÚ DE ACCIONES */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
            border: `1px solid ${colorTokens.brand}30`,
            borderRadius: 2,
            color: colorTokens.textPrimary
          }
        }}
      >
        <MenuItem onClick={() => openSupplierDialog(menuSupplier!)}>
          <ListItemIcon>
            <EditIcon sx={{ color: colorTokens.brand }} />
          </ListItemIcon>
          <ListItemText>Editar Proveedor</ListItemText>
        </MenuItem>
        
        {menuSupplier?.is_active === false ? (
          <MenuItem onClick={() => handleRestore(menuSupplier.id)}>
            <ListItemIcon>
              <RestoreIcon sx={{ color: colorTokens.success }} />
            </ListItemIcon>
            <ListItemText>Restaurar Proveedor</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleDelete(menuSupplier?.id!)}>
            <ListItemIcon>
              <DeleteIcon sx={{ color: colorTokens.danger }} />
            </ListItemIcon>
            <ListItemText>Eliminar Proveedor</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => {
          router.push(`/dashboard/admin/catalogo/productos?supplier=${menuSupplier?.id}`);
          handleMenuClose();
        }}>
          <ListItemIcon>
            {menuSupplier?.is_active === false ? 
              <VisibilityOffIcon sx={{ color: colorTokens.warning }} /> : 
              <VisibilityIcon sx={{ color: colorTokens.info }} />
            }
          </ListItemIcon>
          <ListItemText>Ver Productos</ListItemText>
        </MenuItem>
      </Menu>

      {/* DIALOG DE FORMULARIO */}
      <SupplierFormDialog
        open={supplierDialogOpen}
        onClose={closeSupplierDialog}
        supplier={selectedSupplier}
        onSave={handleSupplierSave}
      />
    </Box>
  );
}