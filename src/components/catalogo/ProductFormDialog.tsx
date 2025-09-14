'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  ViewStream as BarcodeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { useSuppliers, useProducts } from '@/hooks/useCatalog';
import { Product } from '@/services/catalogService';

// ✅ AGREGAR ESTA INTERFAZ AQUÍ
interface FormDataType {
  name: string;
  description: string;
  sku: string;
  barcode: string;
  category: string;
  subcategory: string;
  brand: string;
  cost_price: number;
  sale_price: number;
  profit_margin: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  supplier_id: string;
  location: string;
  expiry_date: string | null; // ✅ ESTO ES LO CLAVE
  is_active: boolean;
  is_taxable: boolean;
  tax_rate: number;
}


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

// 🎯 CATEGORÍAS PREDEFINIDAS
const PRODUCT_CATEGORIES = [
  'Electrodomésticos',
  'Electrónicos',
  'Ropa y Accesorios',
  'Hogar y Jardín',
  'Deportes',
  'Salud y Belleza',
  'Automotriz',
  'Libros y Medios',
  'Juguetes',
  'Alimentos y Bebidas',
  'Herramientas',
  'Oficina',
  'Mascotas',
  'Otros'
];

// 🎯 UNIDADES PREDEFINIDAS
const PRODUCT_UNITS = [
  'pieza',
  'kilogramo',
  'gramo',
  'litro',
  'mililitro',
  'metro',
  'centímetro',
  'paquete',
  'caja',
  'docena',
  'par',
  'rollo',
  'botella',
  'lata',
  'bolsa'
];

// 🎯 ESTADO INICIAL DEL FORMULARIO - CENTRALIZADO
const INITIAL_FORM_STATE = {
  name: '',
  description: '',
  sku: '',
  barcode: '',
  category: '',
  subcategory: '',
  brand: '',
  cost_price: 0,
  sale_price: 0,
  profit_margin: 0,
  current_stock: 0,
  min_stock: 0,
  max_stock: 1000,
  unit: 'pieza',
  supplier_id: '',
  location: '',
  expiry_date:  null, // ✅ Cambiar de '' a null
  is_active: true,
  is_taxable: true,
  tax_rate: 16
};


interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: () => void;
}

export default function ProductFormDialog({
  open,
  onClose,
  product,
  onSave
}: ProductFormDialogProps) {
  
  // 🎯 HOOKS PARA DATOS
  const { 
    suppliers, 
    loading: suppliersLoading 
  } = useSuppliers({ 
    status: 'active', 
    limit: 100 
  });

  const { 
    createProduct, 
    updateProduct 
  } = useProducts();

  // 🎯 ESTADO DEL FORMULARIO
const [formData, setFormData] = useState<FormDataType>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 🎯 EFECTOS - CARGAR DATOS DEL PRODUCTO SI EXISTE
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        brand: product.brand || '',
        cost_price: product.cost_price || 0,
        sale_price: product.sale_price || 0,
        profit_margin: product.profit_margin || 0,
        current_stock: product.current_stock || 0,
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 1000,
        unit: product.unit || 'pieza',
        supplier_id: product.supplier_id || '',
        location: product.location || '',
        expiry_date: product.expiry_date, // ✅ Sin || ''
        is_active: product.is_active !== false,
        is_taxable: product.is_taxable !== false,
        tax_rate: product.tax_rate || 16
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
    setErrors({});
  }, [product, open]);

  // 🎯 CALCULAR MARGEN DE GANANCIA AUTOMÁTICAMENTE
  useEffect(() => {
    if (formData.cost_price > 0 && formData.sale_price > 0) {
      const margin = ((formData.sale_price - formData.cost_price) / formData.cost_price) * 100;
      setFormData(prev => ({ ...prev, profit_margin: Math.round(margin * 100) / 100 }));
    }
  }, [formData.cost_price, formData.sale_price]);

  // 🎯 VALIDACIONES
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del producto es obligatorio';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La categoría es obligatoria';
    }

    if (formData.cost_price < 0) {
      newErrors.cost_price = 'El precio de costo no puede ser negativo';
    }

    if (formData.sale_price < 0) {
      newErrors.sale_price = 'El precio de venta no puede ser negativo';
    }

    if (formData.sale_price > 0 && formData.cost_price > 0 && formData.sale_price < formData.cost_price) {
      newErrors.sale_price = 'El precio de venta no puede ser menor al precio de costo';
    }

    if (formData.current_stock < 0) {
      newErrors.current_stock = 'El stock actual no puede ser negativo';
    }

    if (formData.min_stock < 0) {
      newErrors.min_stock = 'El stock mínimo no puede ser negativo';
    }

    if (formData.max_stock <= formData.min_stock) {
      newErrors.max_stock = 'El stock máximo debe ser mayor al stock mínimo';
    }

    if (formData.sku && formData.sku.length < 3) {
      newErrors.sku = 'El SKU debe tener al menos 3 caracteres';
    }

    if (formData.tax_rate < 0 || formData.tax_rate > 100) {
      newErrors.tax_rate = 'La tasa de impuesto debe estar entre 0 y 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🎯 MANEJAR CAMBIOS EN EL FORMULARIO
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 🎯 MANEJAR GUARDAR - CORREGIDO PARA USAR LOS HOOKS
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // ✅ LIMPIAR DATOS ANTES DE ENVIAR
      const cleanedData = {
        ...formData,
        // Convertir cadenas vacías a undefined para campos opcionales
        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        description: formData.description.trim() || undefined,
        subcategory: formData.subcategory.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        supplier_id: formData.supplier_id || undefined,
        location: formData.location.trim() || undefined,
        expiry_date: formData.expiry_date, // ✅ Ya es string | null, no necesita conversión
      };

      let result;
      
      if (product) {
        // ✅ ACTUALIZAR PRODUCTO EXISTENTE
        result = await updateProduct(product.id, cleanedData);
      } else {
        // ✅ CREAR NUEVO PRODUCTO  
        result = await createProduct(cleanedData);
      }
      
      if (result.success) {
        onSave(); // Recargar la lista en el componente padre
        onClose(); // Cerrar el diálogo
      } else {
        // El hook ya maneja las notificaciones de error
        console.error('Error al guardar:', result.error);
      }
      
    } catch (error) {
      console.error('Error inesperado al guardar producto:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.primary}30`,
          borderRadius: 4,
          color: darkProTokens.textPrimary
        }
      }}
    >
      <DialogTitle 
        component="div"
        sx={{ 
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
          borderBottom: `1px solid ${darkProTokens.primary}30`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <InventoryIcon sx={{ color: darkProTokens.primary }} />
        <Typography variant="h6" fontWeight="bold">
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* 📋 INFORMACIÓN BÁSICA */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `${darkProTokens.surfaceLevel1}`, 
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: darkProTokens.primary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <DescriptionIcon />
                  Información Básica
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      fullWidth
                      label="Nombre del Producto *"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      error={!!errors.name}
                      helperText={errors.name}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Marca"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Descripción"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 🏷️ CÓDIGOS Y CATEGORÍAS */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: `${darkProTokens.surfaceLevel1}`, 
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: darkProTokens.primary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <CategoryIcon />
                  Códigos y Categorías
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="SKU"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value.toUpperCase())}
                      error={!!errors.sku}
                      helperText={errors.sku || 'Código único del producto'}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BarcodeIcon sx={{ color: darkProTokens.primary }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Código de Barras"
                      value={formData.barcode}
                      onChange={(e) => handleChange('barcode', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 8 }}>
                    <Autocomplete
                      freeSolo
                      options={PRODUCT_CATEGORIES}
                      value={formData.category}
                      onChange={(_, newValue) => handleChange('category', newValue || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Categoría *"
                          error={!!errors.category}
                          helperText={errors.category}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: darkProTokens.textPrimary,
                              '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                              '&:hover fieldset': { borderColor: darkProTokens.primary },
                              '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                            },
                            '& .MuiInputLabel-root': { 
                              color: darkProTokens.textSecondary,
                              '&.Mui-focused': { color: darkProTokens.primary }
                            }
                          }}
                        />
                      )}
                      PaperComponent={({ children, ...props }) => (
                        <Box
                          {...props}
                          sx={{
                            background: darkProTokens.surfaceLevel2,
                            border: `1px solid ${darkProTokens.primary}30`,
                            borderRadius: 2,
                            color: darkProTokens.textPrimary
                          }}
                        >
                          {children}
                        </Box>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Subcategoría"
                      value={formData.subcategory}
                      onChange={(e) => handleChange('subcategory', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 💰 PRECIOS Y COSTOS */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: `${darkProTokens.surfaceLevel1}`, 
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: darkProTokens.primary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <MoneyIcon />
                  Precios y Costos
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Precio de Costo"
                      value={formData.cost_price}
                      onChange={(e) => handleChange('cost_price', parseFloat(e.target.value) || 0)}
                      error={!!errors.cost_price}
                      helperText={errors.cost_price}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Precio de Venta"
                      value={formData.sale_price}
                      onChange={(e) => handleChange('sale_price', parseFloat(e.target.value) || 0)}
                      error={!!errors.sale_price}
                      helperText={errors.sale_price}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ 
                      p: 2, 
                      background: `${darkProTokens.success}10`,
                      border: `1px solid ${darkProTokens.success}30`,
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: darkProTokens.success }}>
                        Margen de Ganancia: {formData.profit_margin.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkProTokens.textSecondary }}>
                        Ganancia por unidad: ${(formData.sale_price - formData.cost_price).toFixed(2)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_taxable}
                          onChange={(e) => handleChange('is_taxable', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: darkProTokens.primary,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: darkProTokens.primary,
                            },
                          }}
                        />
                      }
                      label="Producto Gravado"
                      sx={{ color: darkProTokens.textPrimary }}
                    />
                  </Grid>

                  {formData.is_taxable && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Tasa de Impuesto (%)"
                        value={formData.tax_rate}
                        onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
                        error={!!errors.tax_rate}
                        helperText={errors.tax_rate}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: darkProTokens.textPrimary,
                            '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                            '&:hover fieldset': { borderColor: darkProTokens.primary },
                            '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                          },
                          '& .MuiInputLabel-root': { 
                            color: darkProTokens.textSecondary,
                            '&.Mui-focused': { color: darkProTokens.primary }
                          }
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 📦 INVENTARIO */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: `${darkProTokens.surfaceLevel1}`, 
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: darkProTokens.primary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <InventoryIcon />
                  Control de Inventario
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Stock Actual"
                      value={formData.current_stock}
                      onChange={(e) => handleChange('current_stock', parseInt(e.target.value) || 0)}
                      error={!!errors.current_stock}
                      helperText={errors.current_stock || (product ? 'Solo lectura - usar ajuste de stock' : '')}
                      disabled={!!product} // Solo lectura en edición
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      freeSolo
                      options={PRODUCT_UNITS}
                      value={formData.unit}
                      onChange={(_, newValue) => handleChange('unit', newValue || 'pieza')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Unidad de Medida"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: darkProTokens.textPrimary,
                              '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                              '&:hover fieldset': { borderColor: darkProTokens.primary },
                              '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                            },
                            '& .MuiInputLabel-root': { 
                              color: darkProTokens.textSecondary,
                              '&.Mui-focused': { color: darkProTokens.primary }
                            }
                          }}
                        />
                      )}
                      PaperComponent={({ children, ...props }) => (
                        <Box
                          {...props}
                          sx={{
                            background: darkProTokens.surfaceLevel2,
                            border: `1px solid ${darkProTokens.primary}30`,
                            borderRadius: 2,
                            color: darkProTokens.textPrimary
                          }}
                        >
                          {children}
                        </Box>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Stock Mínimo"
                      value={formData.min_stock}
                      onChange={(e) => handleChange('min_stock', parseInt(e.target.value) || 0)}
                      error={!!errors.min_stock}
                      helperText={errors.min_stock || 'Nivel de alerta'}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Stock Máximo"
                      value={formData.max_stock}
                      onChange={(e) => handleChange('max_stock', parseInt(e.target.value) || 1000)}
                      error={!!errors.max_stock}
                      helperText={errors.max_stock || 'Capacidad máxima'}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 🏢 PROVEEDOR Y OTROS */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: `${darkProTokens.surfaceLevel1}`, 
              border: `1px solid ${darkProTokens.grayDark}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: darkProTokens.primary, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <BusinessIcon />
                  Información Adicional
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }}>
                        Proveedor
                      </InputLabel>
                      <Select
                        value={formData.supplier_id}
                        label="Proveedor"
                        onChange={(e) => handleChange('supplier_id', e.target.value)}
                        disabled={suppliersLoading}
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
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              background: darkProTokens.surfaceLevel2,
                              border: `1px solid ${darkProTokens.primary}30`,
                              color: darkProTokens.textPrimary
                            }
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em>Sin proveedor asignado</em>
                        </MenuItem>
                        {suppliers.map((supplier) => (
                          <MenuItem key={supplier.id} value={supplier.id}>
                            {supplier.company_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Ubicación/Anaquel"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Ej: A1, Zona B, etc."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha de Vencimiento"
                      value={formData.expiry_date || ''} // ✅ Aquí SÍ convertir null a string vacía para el input
                      onChange={(e) => handleChange('expiry_date', e.target.value || null)} // ✅ Convertir string vacía a null
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: darkProTokens.textPrimary,
                          '& fieldset': { borderColor: `${darkProTokens.primary}30` },
                          '&:hover fieldset': { borderColor: darkProTokens.primary },
                          '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
                        },
                        '& .MuiInputLabel-root': { 
                          color: darkProTokens.textSecondary,
                          '&.Mui-focused': { color: darkProTokens.primary }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_active}
                          onChange={(e) => handleChange('is_active', e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: darkProTokens.primary,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: darkProTokens.primary,
                            },
                          }}
                        />
                      }
                      label="Producto Activo"
                      sx={{ color: darkProTokens.textPrimary }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 🚨 ERRORES GENERALES */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 3 }}>
            Por favor, corrige los errores en el formulario antes de continuar.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${darkProTokens.grayDark}`,
        gap: 2
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          startIcon={<CloseIcon />}
          sx={{ 
            color: darkProTokens.textSecondary,
            borderColor: `${darkProTokens.textSecondary}60`,
            px: 3, py: 1.5, borderRadius: 3, fontWeight: 600
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
            color: darkProTokens.background,
            fontWeight: 700,
            px: 4, py: 1.5, borderRadius: 3,
            '&:hover': {
              background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`,
            },
            '&:disabled': {
              background: darkProTokens.primaryDisabled,
              color: darkProTokens.textDisabled
            }
          }}
        >
          {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')} Producto
        </Button>
      </DialogActions>
    </Dialog>
  );
}