'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid as Grid,
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
  Badge
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
  RestoreFromTrash as RestoreIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatPrice } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';
import SupplierFormDialog from '@/components/catalogo/SupplierFormDialog';
import { Supplier } from '@/types';
import { corporateColors, getGradient } from '@/theme/colors';

interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalCreditLimit: number;
  totalBalance: number;
}

export default function ProveedoresPage() {
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

  const supabase = createBrowserSupabaseClient();

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
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.rfc && supplier.rfc.toLowerCase().includes(searchTerm.toLowerCase()))
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
        border: supplier.is_active === false ? '1px dashed red' : 'none',
        background: supplier.is_active === false ? '#fafafa' : 'white',
        '&:hover': { 
          boxShadow: 6,
          transform: 'translateY(-2px)'
        },
        transition: 'all 0.3s ease'
      }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ 
                bgcolor: supplier.is_active === false ? 'grey.400' : corporateColors.primary.main,
                color: corporateColors.text.onPrimary 
              }}>
                <BusinessIcon />
              </Avatar>
              {supplier.is_active === false && (
                <Chip label="INACTIVO" color="error" size="small" />
              )}
            </Box>
            <IconButton 
              size="small"
              onClick={(e) => handleMenuOpen(e, supplier)}
            >
              <MoreVertIcon />
            </IconButton>
          </Box>
          
          <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 1 }}>
            {supplier.company_name}
          </Typography>
          
          {supplier.contact_person && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Contacto: {supplier.contact_person}
            </Typography>
          )}
          
          {supplier.email && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {supplier.email}
              </Typography>
            </Box>
          )}
          
          {supplier.phone && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {supplier.phone}
              </Typography>
            </Box>
          )}
          
          {supplier.website && (
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
              <WebsiteIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary" noWrap>
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
            />
            <Typography variant="body2" color="text.secondary">
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
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
              {supplier.categories.length > 3 && (
                <Chip 
                  label={`+${supplier.categories.length - 3}`}
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>
          )}
          
          {/* Información financiera */}
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={1}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Límite crédito:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatPrice(supplier.credit_limit || 0)}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Saldo actual:
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight="bold"
                  color={(supplier.current_balance || 0) > 0 ? 'error.main' : 'success.main'}
                >
                  {formatPrice(supplier.current_balance || 0)}
                </Typography>
              </Grid>
            </Grid>
            
            <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
              <DeliveryIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
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
              color="success"
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
              sx={{ color: corporateColors.primary.main }}
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
      bgcolor: corporateColors.background.default,
      color: corporateColors.text.primary,
      p: 3
    }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold"
          sx={{ color: corporateColors.text.primary }}
        >
          🏢 Gestión de Proveedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedSupplier(null);
            setFormDialogOpen(true);
          }}
          sx={{
            background: getGradient('primary'),
            color: corporateColors.text.onPrimary,
            fontWeight: 'bold',
            '&:hover': {
              background: getGradient('primaryDark'),
            }
          }}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: getGradient('info'), color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalSuppliers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Proveedores
                  </Typography>
                </Box>
                <BusinessIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: getGradient('success'), color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.activeSuppliers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Proveedores Activos
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: getGradient('primary'), color: corporateColors.text.onPrimary }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatPrice(stats.totalCreditLimit)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Límite Total Crédito
                  </Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ background: getGradient('warning'), color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatPrice(stats.totalBalance)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Saldo Pendiente
                  </Typography>
                </Box>
                <TrendingDownIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        bgcolor: corporateColors.background.paper,
        color: corporateColors.text.onWhite
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
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="active">✅ Activos</MenuItem>
                <MenuItem value="inactive">❌ Inactivos</MenuItem>
                <MenuItem value="all">📋 Todos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={categoryFilter}
                label="Categoría"
                onChange={(e) => setCategoryFilter(e.target.value)}
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
              <InputLabel>Rating mínimo</InputLabel>
              <Select
                value={ratingFilter}
                label="Rating mínimo"
                onChange={(e) => setRatingFilter(e.target.value)}
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
            <Typography variant="body2" color="text.secondary" sx={{ pt: 2 }}>
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
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Grid de proveedores */}
      <AnimatePresence mode="wait">
        {loading ? (
          <Box 
            display="flex" 
            justifyContent="center" 
            alignItems="center" 
            minHeight="40vh"
            sx={{ color: corporateColors.text.primary }}
          >
            <Typography>Cargando proveedores...</Typography>
          </Box>
        ) : filteredSuppliers.length === 0 ? (
          <Paper sx={{ 
            p: 8, 
            textAlign: 'center',
            bgcolor: corporateColors.background.paper,
            color: corporateColors.text.onWhite
          }}>
            <BusinessIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron proveedores
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
                background: getGradient('primary'),
                color: corporateColors.text.onPrimary
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

      {/* Menú de acciones */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {menuSupplier?.is_active === false ? (
          <MenuItem onClick={() => {
            if (menuSupplier) handleRestoreSupplier(menuSupplier);
            handleMenuClose();
          }}>
            <ListItemIcon>
              <RestoreIcon color="success" />
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
              <EditIcon />
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
            <VisibilityIcon />
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
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon color="error" />
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

      {/* Dialog de confirmación de eliminación */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: corporateColors.background.paper,
            color: corporateColors.text.onWhite
          }
        }}
      >
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar el proveedor "{supplierToDelete?.company_name}"?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            {supplierToDelete?.is_active === false 
              ? 'Esta acción eliminará permanentemente el proveedor de la base de datos.'
              : 'Esta acción no se puede deshacer. El proveedor será eliminado o desactivado si tiene productos asociados.'
            }
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteSupplier} 
            color="error" 
            variant="contained"
            sx={{
              background: getGradient('error')
            }}
          >
            {supplierToDelete?.is_active === false ? 'Eliminar Permanente' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para agregar proveedor */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: getGradient('primary'),
          color: corporateColors.text.onPrimary,
          '&:hover': {
            background: getGradient('primaryDark'),
          }
        }}
        onClick={() => {
          setSelectedSupplier(null);
          setFormDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}