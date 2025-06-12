'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Fab,
  Avatar,
  Rating,
  Menu,
  ListItemIcon,
  ListItemText,
  Badge,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebsiteIcon,
  Star as StarIcon,
  LocalShipping as DeliveryIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  RestoreFromTrash as RestoreIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import SupplierFormDialog from '@/components/catalogo/SupplierFormDialog';

// 🎨 DARK PRO SYSTEM - TOKENS ACTUALIZADOS
const darkProTokens = {
  // Base Colors
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  surfaceLevel3: '#252525',
  surfaceLevel4: '#2E2E2E',
  
  // Neutrals
  grayDark: '#333333',
  grayMedium: '#444444',
  grayLight: '#555555',
  grayMuted: '#777777',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888',
  
  // Primary Accent (Golden)
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  primaryActive: '#CCAA00',
  primaryDisabled: 'rgba(255,204,0,0.3)',
  
  // Semantic Colors
  success: '#388E3C',
  successHover: '#2E7D32',
  error: '#D32F2F',
  errorHover: '#B71C1C',
  warning: '#FFB300',
  warningHover: '#E6A700',
  info: '#1976D2',
  infoHover: '#1565C0',
  
  // User Roles
  roleAdmin: '#FFCC00',
  roleStaff: '#1976D2',
  roleTrainer: '#009688',
  roleUser: '#777777',
  roleModerator: '#9C27B0',
  roleGuest: '#444444',
  
  // Interactions
  hoverOverlay: 'rgba(255,204,0,0.05)',
  activeOverlay: 'rgba(255,204,0,0.1)',
  borderDefault: '#333333',
  borderHover: '#FFCC00',
  borderActive: '#E6B800'
};

interface Supplier {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  rating?: number;
  categories?: string[];
  credit_limit?: number;
  current_balance?: number;
  delivery_time?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalCreditLimit: number;
  totalBalance: number;
}

export default function ProveedoresPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalCreditLimit: 0,
    totalBalance: 0
  });
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados de dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  
  // Estados de menú
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSupplier, setMenuSupplier] = useState<Supplier | null>(null);

  // Estados de notificaciones
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const supabase = createBrowserSupabaseClient();

  // ✅ Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  // ✅ Mostrar notificación
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  // ✅ Cargar proveedores
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('company_name');

      if (error) throw error;
      
      setSuppliers(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      showNotification('Error al cargar proveedores', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Calcular estadísticas
  const calculateStats = (supplierList: Supplier[]) => {
    const activeSuppliers = supplierList.filter(s => s.is_active !== false);
    const totalCreditLimit = activeSuppliers.reduce((sum, s) => sum + (s.credit_limit || 0), 0);
    const totalBalance = activeSuppliers.reduce((sum, s) => sum + (s.current_balance || 0), 0);

    setStats({
      totalSuppliers: supplierList.length,
      activeSuppliers: activeSuppliers.length,
      totalCreditLimit,
      totalBalance
    });
  };

  // ✅ Filtrar proveedores
  useEffect(() => {
    let filtered = suppliers;

    // Filtro por estado
    if (statusFilter === 'active') {
      filtered = filtered.filter(supplier => supplier.is_active !== false);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(supplier => supplier.is_active === false);
    }

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(supplier =>
        supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.contact_person && supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por categoría
    if (categoryFilter) {
      filtered = filtered.filter(supplier => 
        supplier.categories && supplier.categories.includes(categoryFilter)
      );
    }

    // Filtro por rating
    if (ratingFilter) {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(supplier => (supplier.rating || 5) >= rating);
    }

    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm, statusFilter, categoryFilter, ratingFilter]);

  // ✅ Eliminar proveedor
  const handleDeleteSupplier = async () => {
    if (!supplierToDelete) return;

    try {
      // Intentar eliminación real
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierToDelete.id);

      if (error) throw error;

      showNotification('Proveedor eliminado correctamente', 'success');
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
      loadSuppliers();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      
      // Si hay referencias, hacer soft delete
      if (error.code === '23503') {
        try {
          const { error: softError } = await supabase
            .from('suppliers')
            .update({ 
              is_active: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', supplierToDelete.id);

          if (softError) throw softError;
          
          showNotification('Proveedor desactivado (tiene productos asociados)', 'warning');
          setDeleteDialogOpen(false);
          setSupplierToDelete(null);
          loadSuppliers();
        } catch (softDeleteError) {
          showNotification('Error al eliminar proveedor', 'error');
        }
      } else {
        showNotification('Error al eliminar proveedor', 'error');
      }
    }
  };

  // ✅ Restaurar proveedor
  const handleRestoreSupplier = async (supplier: Supplier) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ 
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', supplier.id);

      if (error) throw error;

      showNotification('Proveedor restaurado correctamente', 'success');
      loadSuppliers();
    } catch (error) {
      console.error('Error restoring supplier:', error);
      showNotification('Error al restaurar proveedor', 'error');
    }
  };

  // Manejar menú
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, supplier: Supplier) => {
    setMenuAnchor(event.currentTarget);
    setMenuSupplier(supplier);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuSupplier(null);
  };

  // Obtener categorías únicas
  const getUniqueCategories = () => {
    const categories = new Set<string>();
    suppliers.forEach(supplier => {
      if (supplier.categories && Array.isArray(supplier.categories)) {
        supplier.categories.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories);
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadSuppliers();
  }, []);

  const SupplierCard = ({ supplier }: { supplier: Supplier }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ 
        height: '100%',
        opacity: supplier.is_active === false ? 0.6 : 1,
        border: supplier.is_active === false ? `1px dashed ${darkProTokens.error}` : `1px solid ${darkProTokens.grayDark}`,
        background: supplier.is_active === false 
          ? `${darkProTokens.surfaceLevel2}80` 
          : `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        color: darkProTokens.textPrimary,
        '&:hover': { 
          boxShadow: `0 8px 32px ${darkProTokens.primary}20`,
          transform: 'translateY(-4px)',
          borderColor: darkProTokens.primary
        },
        transition: 'all 0.3s ease',
        borderRadius: 3
      }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ 
                bgcolor: supplier.is_active === false ? darkProTokens.grayMuted : darkProTokens.primary,
                color: darkProTokens.background
              }}>
                <BusinessIcon />
              </Avatar>
              {supplier.is_active === false && (
                <Chip 
                  label="INACTIVO" 
                  sx={{
                    backgroundColor: darkProTokens.error,
                    color: darkProTokens.textPrimary,
                    fontWeight: 700
                  }} 
                  size="small" 
                />
              )}
            </Box>
            <IconButton 
              size="small"
              onClick={(e) => handleMenuOpen(e, supplier)}
              sx={{ color: darkProTokens.textSecondary }}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          
          <Typography variant="h6" component="h2" fontWeight="bold" sx={{ 
            mb: 1,
            color: darkProTokens.textPrimary 
          }}>
            {supplier.company_name}
          </Typography>
          
          {supplier.contact_person && (
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }} gutterBottom>
              Contacto: {supplier.contact_person}
            </Typography>
          )}
          
          {supplier.email && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <EmailIcon fontSize="small" sx={{ color: darkProTokens.primary }} />
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                {supplier.email}
              </Typography>
            </Box>
          )}
          
          {supplier.phone && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <PhoneIcon fontSize="small" sx={{ color: darkProTokens.info }} />
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                {supplier.phone}
              </Typography>
            </Box>
          )}
          
          {supplier.website && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <WebsiteIcon fontSize="small" sx={{ color: darkProTokens.success }} />
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }} noWrap>
                {supplier.website}
              </Typography>
            </Box>
          )}
          
          {/* Rating */}
          <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
            <Rating 
              value={supplier.rating || 5} 
              readOnly 
              size="small"
              icon={<StarIcon fontSize="inherit" />}
              emptyIcon={<StarIcon fontSize="inherit" />}
              sx={{
                '& .MuiRating-iconFilled': { color: darkProTokens.primary },
                '& .MuiRating-iconEmpty': { color: darkProTokens.grayMuted }
              }}
            />
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
              ({supplier.rating || 5}/5)
            </Typography>
          </Box>
          
          {/* Categorías */}
          {supplier.categories && supplier.categories.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={0.5} sx={{ mb: 2 }}>
              {supplier.categories.slice(0, 3).map((category, index) => (
                <Chip 
                  key={index}
                  label={category} 
                  size="small" 
                  sx={{
                    fontSize: '0.7rem',
                    backgroundColor: `${darkProTokens.info}20`,
                    color: darkProTokens.info,
                    border: `1px solid ${darkProTokens.info}40`
                  }}
                />
              ))}
              {supplier.categories.length > 3 && (
                <Chip 
                  label={`+${supplier.categories.length - 3}`}
                  size="small" 
                  sx={{
                    fontSize: '0.7rem',
                    backgroundColor: `${darkProTokens.warning}20`,
                    color: darkProTokens.warning,
                    border: `1px solid ${darkProTokens.warning}40`
                  }}
                />
              )}
            </Box>
          )}
          
          {/* Información financiera */}
          <Box sx={{ 
            mt: 2, 
            pt: 2, 
            borderTop: `1px solid ${darkProTokens.grayDark}` 
          }}>
            <Grid container spacing={1}>
              <Grid size={6}>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Límite crédito:
                </Typography>
                <Typography variant="body2" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                  {formatPrice(supplier.credit_limit || 0)}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                  Saldo actual:
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  sx={{ 
                    color: (supplier.current_balance || 0) > 0 ? darkProTokens.error : darkProTokens.success
                  }}
                >
                  {formatPrice(supplier.current_balance || 0)}
                </Typography>
              </Grid>
            </Grid>
            
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
              <DeliveryIcon fontSize="small" sx={{ color: darkProTokens.warning }} />
              <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                Entrega: {supplier.delivery_time || 7} días
              </Typography>
            </Box>
          </Box>
        </CardContent>
        
        <CardActions sx={{ px: 2, pb: 2 }}>
          {supplier.is_active === false ? (
            <Button 
              size="small" 
              startIcon={<RestoreIcon />}
              onClick={() => handleRestoreSupplier(supplier)}
              sx={{ 
                color: darkProTokens.success,
                fontWeight: 600
              }}
            >
              Restaurar
            </Button>
          ) : (
            <Button 
              size="small" 
              startIcon={<EditIcon />}
              onClick={() => {
                setSelectedSupplier(supplier);
                setFormDialogOpen(true);
              }}
              sx={{ 
                color: darkProTokens.primary,
                fontWeight: 600
              }}
            >
              Editar
            </Button>
          )}
          
          <Button 
            size="small" 
            startIcon={<VisibilityIcon />}
            onClick={() => {
              // TODO: Ver detalles
            }}
            sx={{ 
              color: darkProTokens.info,
              fontWeight: 600
            }}
          >
            Ver
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${darkProTokens.background}, ${darkProTokens.surfaceLevel1})`,
      color: darkProTokens.textPrimary,
      p: 3
    }}>
      {/* ✅ SNACKBAR CON DARK PRO SYSTEM */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={notification.severity}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          sx={{
            background: notification.severity === 'success' ? 
              `linear-gradient(135deg, ${darkProTokens.success}, ${darkProTokens.successHover})` :
              notification.severity === 'error' ?
              `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})` :
              notification.severity === 'warning' ?
              `linear-gradient(135deg, ${darkProTokens.warning}, ${darkProTokens.warningHover})` :
              `linear-gradient(135deg, ${darkProTokens.info}, ${darkProTokens.infoHover})`,
            color: darkProTokens.textPrimary,
            border: `1px solid ${
              notification.severity === 'success' ? darkProTokens.success :
              notification.severity === 'error' ? darkProTokens.error :
              notification.severity === 'warning' ? darkProTokens.warning :
              darkProTokens.info
            }60`,
            borderRadius: 3,
            fontWeight: 600,
            '& .MuiAlert-icon': { color: darkProTokens.textPrimary },
            '& .MuiAlert-action': { color: darkProTokens.textPrimary }
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* ✅ HEADER CON DARK PRO SYSTEM */}
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
              Red de Suministros | Control de Proveedores y Relaciones Comerciales
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/dashboard/admin/catalogo')}
              sx={{ 
                color: darkProTokens.primary,
                borderColor: `${darkProTokens.primary}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  backgroundColor: `${darkProTokens.primary}10`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
            >
              Catálogo
            </Button>
            
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadSuppliers}
              disabled={loading}
              sx={{
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}60`,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  backgroundColor: `${darkProTokens.textSecondary}10`,
                  transform: 'translateY(-2px)'
                }
              }}
              variant="outlined"
            >
              Actualizar
            </Button>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedSupplier(null);
                setFormDialogOpen(true);
              }}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                color: darkProTokens.background,
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 3,
                '&:hover': {
                  background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Nuevo Proveedor
            </Button>
          </Box>
        </Box>

        {/* ✅ ESTADÍSTICAS CON DARK PRO SYSTEM */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `${darkProTokens.info}10`, 
              border: `1px solid ${darkProTokens.info}30`,
              borderRadius: 3,
              color: darkProTokens.textPrimary
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: darkProTokens.info }}>
                      {stats.totalSuppliers}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Total Proveedores
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
              borderRadius: 3,
              color: darkProTokens.textPrimary
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
                  <TrendingUpIcon sx={{ fontSize: 40, color: darkProTokens.success, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `${darkProTokens.primary}10`, 
              border: `1px solid ${darkProTokens.primary}30`,
              borderRadius: 3,
              color: darkProTokens.textPrimary
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.primary }}>
                      {formatPrice(stats.totalCreditLimit)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Límite Total Crédito
                    </Typography>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: darkProTokens.primary, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              background: `${darkProTokens.warning}10`, 
              border: `1px solid ${darkProTokens.warning}30`,
              borderRadius: 3,
              color: darkProTokens.textPrimary
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.warning }}>
                      {formatPrice(stats.totalBalance)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                      Saldo Pendiente
                    </Typography>
                  </Box>
                  <TrendingDownIcon sx={{ fontSize: 40, color: darkProTokens.warning, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* ✅ FILTROS CON DARK PRO SYSTEM */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
        border: `1px solid ${darkProTokens.grayDark}`,
        borderRadius: 3,
        color: darkProTokens.textPrimary
      }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                Estado
              </InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
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
                }}
              >
                <MenuItem value="active">✅ Activos</MenuItem>
                <MenuItem value="inactive">❌ Inactivos</MenuItem>
                <MenuItem value="all">📋 Todos</MenuItem>
              </Select>
            </FormControl>
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
                value={categoryFilter}
                label="Categoría"
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{
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
                }}
              >
                <MenuItem value="">Todas</MenuItem>
                {getUniqueCategories().map((category) => (
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
                Rating mínimo
              </InputLabel>
              <Select
                value={ratingFilter}
                label="Rating mínimo"
                onChange={(e) => setRatingFilter(e.target.value)}
                sx={{
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
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="5">⭐⭐⭐⭐⭐ (5)</MenuItem>
                <MenuItem value="4">⭐⭐⭐⭐ (4+)</MenuItem>
                <MenuItem value="3">⭐⭐⭐ (3+)</MenuItem>
                <MenuItem value="2">⭐⭐ (2+)</MenuItem>
                <MenuItem value="1">⭐ (1+)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <Typography variant="body2" sx={{ 
              color: darkProTokens.textSecondary, 
              pt: 2,
              textAlign: 'center'
            }}>
              {filteredSuppliers.length} de {suppliers.length}
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('active');
                setCategoryFilter('');
                setRatingFilter('');
              }}
              sx={{
                color: darkProTokens.textSecondary,
                borderColor: `${darkProTokens.textSecondary}40`,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  backgroundColor: `${darkProTokens.textSecondary}10`
                }
              }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ✅ GRID DE PROVEEDORES CON DARK PRO SYSTEM */}
      <AnimatePresence mode="wait">
        {loading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="40vh"
            sx={{ color: darkProTokens.textPrimary }}
          >
            <CircularProgress sx={{ color: darkProTokens.primary }} size={60} thickness={4} />
          </Box>
        ) : filteredSuppliers.length === 0 ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center',
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `1px solid ${darkProTokens.grayDark}`,
            borderRadius: 3,
            color: darkProTokens.textPrimary
          }}>
            <BusinessIcon sx={{ fontSize: 80, color: darkProTokens.textSecondary, mb: 2 }} />
            <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }} gutterBottom>
              No se encontraron proveedores
            </Typography>
            <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
              {suppliers.length === 0 
                ? 'Comienza agregando tu primer proveedor'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedSupplier(null);
                setFormDialogOpen(true);
              }}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                color: darkProTokens.background,
                fontWeight: 700
              }}
            >
              {suppliers.length === 0 ? 'Agregar Primer Proveedor' : 'Agregar Proveedor'}
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredSuppliers.map((supplier) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={supplier.id}>
                <SupplierCard supplier={supplier} />
              </Grid>
            ))}
          </Grid>
        )}
      </AnimatePresence>

      {/* ✅ MENÚ DE ACCIONES CON DARK PRO SYSTEM */}
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
        {menuSupplier?.is_active === false ? (
          <MenuItem onClick={() => {
            if (menuSupplier) handleRestoreSupplier(menuSupplier);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <RestoreIcon sx={{ color: darkProTokens.success }} />
            </ListItemIcon>
            <ListItemText>Restaurar Proveedor</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => {
            if (menuSupplier) {
              setSelectedSupplier(menuSupplier);
              setFormDialogOpen(true);
            }
            handleMenuClose();
          }}>
            <ListItemIcon>
              <EditIcon sx={{ color: darkProTokens.primary }} />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          if (menuSupplier) {
            // TODO: Ver detalles
          }
          handleMenuClose();
        }}>
          <ListItemIcon>
            <VisibilityIcon sx={{ color: darkProTokens.info }} />
          </ListItemIcon>
          <ListItemText>Ver Detalles</ListItemText>
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            if (menuSupplier) {
              setSupplierToDelete(menuSupplier);
              setDeleteDialogOpen(true);
            }
            handleMenuClose();
          }}
          sx={{ color: darkProTokens.error }}
        >
          <ListItemIcon>
            <DeleteIcon sx={{ color: darkProTokens.error }} />
          </ListItemIcon>
          <ListItemText>
            {menuSupplier?.is_active === false ? 'Eliminar Permanente' : 'Eliminar'}
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Dialog de formulario */}
      <SupplierFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        supplier={selectedSupplier}
        onSave={() => {
          setFormDialogOpen(false);
          loadSuppliers();
        }}
      />

      {/* ✅ DIALOG DE CONFIRMACIÓN CON DARK PRO SYSTEM */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
            border: `2px solid ${darkProTokens.error}50`,
            borderRadius: 4,
            color: darkProTokens.textPrimary
          }
        }}
      >
        <DialogTitle sx={{ color: darkProTokens.error, fontWeight: 700 }}>
          Confirmar Eliminación
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: darkProTokens.textPrimary, mb: 2 }}>
            ¿Estás seguro de que deseas eliminar el proveedor "{supplierToDelete?.company_name}"?
          </Typography>
          <Alert 
            severity="warning" 
            sx={{
              backgroundColor: `${darkProTokens.warning}10`,
              color: darkProTokens.textPrimary,
              border: `1px solid ${darkProTokens.warning}30`,
              '& .MuiAlert-icon': { color: darkProTokens.warning }
            }}
          >
            {supplierToDelete?.is_active === false 
              ? 'Esta acción eliminará permanentemente el proveedor de la base de datos.'
              : 'Esta acción no se puede deshacer. El proveedor será eliminado o desactivado si tiene productos asociados.'
            }
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: darkProTokens.textSecondary }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteSupplier} 
            variant="contained"
            sx={{
              background: `linear-gradient(135deg, ${darkProTokens.error}, ${darkProTokens.errorHover})`,
              color: darkProTokens.textPrimary,
              fontWeight: 700
            }}
          >
            {supplierToDelete?.is_active === false ? 'Eliminar Permanente' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅ FAB CON DARK PRO SYSTEM */}
      <Fab
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
          color: darkProTokens.background,
          '&:hover': {
            background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
            transform: 'scale(1.1)'
          }
        }}
        onClick={() => {
          setSelectedSupplier(null);
          setFormDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

      {/* 🎨 ESTILOS CSS DARK PRO PERSONALIZADOS */}
      <style jsx>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkProTokens.surfaceLevel1};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover});
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive});
        }
      `}</style>
    </Box>
  );
}
