// src/components/catalogo/ProductFormDialog.tsx
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
  InputAdornment,
  Alert,
  CircularProgress,
  Autocomplete,
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

// ✅ IMPORTS ENTERPRISE v6.0
import { colorTokens } from '@/theme';
import { notify } from '@/utils/notifications';
import { showSuccess, showError } from '@/lib/notifications/MySwal';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { useSuppliers, useProducts } from '@/hooks/useCatalog';
import { Product } from '@/services/catalogService';

// CATEGORÍAS Y UNIDADES PREDEFINIDAS
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

// ✅ ESTADO INICIAL - min_stock y max_stock con valores por defecto (no mostrados en UI)
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
  min_stock: 0,        // ✅ Valor por defecto - no mostrado
  max_stock: 1000,     // ✅ Valor por defecto - no mostrado
  unit: 'pieza',
  supplier_id: '',
  location: '',
  expiry_date: null as string | null,
  is_active: true,
  is_taxable: true,
  tax_rate: 16
};

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
  min_stock: number;
  max_stock: number;
  unit: string;
  supplier_id: string;
  location: string;
  expiry_date: string | null;
  is_active: boolean;
  is_taxable: boolean;
  tax_rate: number;
}

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: () => void;
  categories?: Array<{id: string, name: string, subcategories: string[]}>;
}

export default function ProductFormDialog({
  open,
  onClose,
  product,
  onSave,
  categories = []
}: ProductFormDialogProps) {
  
  // HOOKS
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

  // ESTADO
  const [formData, setFormData] = useState<FormDataType>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  // CARGAR DATOS DEL PRODUCTO
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
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 1000,
        unit: product.unit || 'pieza',
        supplier_id: product.supplier_id || '',
        location: product.location || '',
        expiry_date: product.expiry_date,
        is_active: product.is_active !== false,
        is_taxable: product.is_taxable !== false,
        tax_rate: product.tax_rate || 16
      });
    } else {
      setFormData(INITIAL_FORM_STATE);
    }
    setErrors({});
  }, [product, open]);

  // ACTUALIZAR SUBCATEGORÍAS DISPONIBLES CUANDO CAMBIE LA CATEGORÍA
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.name === formData.category);
      if (selectedCategory) {
        setAvailableSubcategories(selectedCategory.subcategories);
        // Si la subcategoría actual no está en las disponibles, limpiarla
        if (formData.subcategory && !selectedCategory.subcategories.includes(formData.subcategory)) {
          setFormData(prev => ({ ...prev, subcategory: '' }));
        }
      } else {
        setAvailableSubcategories([]);
        setFormData(prev => ({ ...prev, subcategory: '' }));
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [formData.category, categories]);

  // CALCULAR MARGEN AUTOMÁTICAMENTE
  useEffect(() => {
    if (formData.cost_price > 0 && formData.sale_price > 0) {
      const margin = ((formData.sale_price - formData.cost_price) / formData.cost_price) * 100;
      setFormData(prev => ({ ...prev, profit_margin: Math.round(margin * 100) / 100 }));
    }
  }, [formData.cost_price, formData.sale_price]);

  // VALIDACIONES
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

    if (formData.sku && formData.sku.length < 3) {
      newErrors.sku = 'El SKU debe tener al menos 3 caracteres';
    }

    if (formData.tax_rate < 0 || formData.tax_rate > 100) {
      newErrors.tax_rate = 'La tasa de impuesto debe estar entre 0 y 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // HANDLERS
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // ✅ DATOS LIMPIOS - min_stock y max_stock se envían con valores por defecto
      const cleanedData = {
        ...formData,
        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        description: formData.description.trim() || undefined,
        subcategory: formData.subcategory.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        supplier_id: formData.supplier_id || undefined,
        location: formData.location.trim() || undefined,
        expiry_date: formData.expiry_date
      };

      let result;
      
      if (product) {
        result = await updateProduct(product.id, cleanedData);
      } else {
        result = await createProduct(cleanedData);
      }
      
      if (result.success) {
        onSave();
        onClose();
      }
      
    } catch (error) {
      console.error('Error inesperado al guardar producto:', error);
      await showError('Error inesperado al guardar producto', '❌ Error al Guardar');
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
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}30`,
          borderRadius: 4,
          color: colorTokens.textPrimary
        }
      }}
    >
      <DialogTitle 
        component="div"
        sx={{ 
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel3}, ${colorTokens.neutral400})`,
          borderBottom: `1px solid ${colorTokens.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <InventoryIcon sx={{ color: colorTokens.brand }} />
        <Typography variant="h6" fontWeight="bold">
          {product ? 'Editar Producto' : 'Nuevo Producto'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* INFORMACIÓN BÁSICA */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: colorTokens.surfaceLevel1, 
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.brand, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <DescriptionIcon />
                  Información Básica
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <TextField
                      fullWidth
                      label="Nombre del Producto *"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      error={!!errors.name}
                      helperText={errors.name}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Marca"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <Autocomplete
                      freeSolo
                      options={PRODUCT_UNITS}
                      value={formData.unit}
                      onChange={(_, newValue) => handleChange('unit', newValue || 'pieza')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Unidad"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: colorTokens.textPrimary,
                              '& fieldset': { borderColor: `${colorTokens.brand}30` },
                              '&:hover fieldset': { borderColor: colorTokens.brand },
                              '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                            },
                            '& .MuiInputLabel-root': { 
                              color: colorTokens.textSecondary,
                              '&.Mui-focused': { color: colorTokens.brand }
                            }
                          }}
                        />
                      )}
                      PaperComponent={({ children, ...props }) => (
                        <Box
                          {...props}
                          sx={{
                            background: colorTokens.surfaceLevel2,
                            border: `1px solid ${colorTokens.brand}30`,
                            borderRadius: 2,
                            color: colorTokens.textPrimary
                          }}
                        >
                          {children}
                        </Box>
                      )}
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
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* CÓDIGOS Y CATEGORÍAS */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: colorTokens.surfaceLevel1, 
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.brand, 
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
                            <BarcodeIcon sx={{ color: colorTokens.brand }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
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
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
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
                              color: colorTokens.textPrimary,
                              '& fieldset': { borderColor: `${colorTokens.brand}30` },
                              '&:hover fieldset': { borderColor: colorTokens.brand },
                              '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                            },
                            '& .MuiInputLabel-root': { 
                              color: colorTokens.textSecondary,
                              '&.Mui-focused': { color: colorTokens.brand }
                            }
                          }}
                        />
                      )}
                      PaperComponent={({ children, ...props }) => (
                        <Box
                          {...props}
                          sx={{
                            background: colorTokens.surfaceLevel2,
                            border: `1px solid ${colorTokens.brand}30`,
                            borderRadius: 2,
                            color: colorTokens.textPrimary
                          }}
                        >
                          {children}
                        </Box>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Subcategoría</InputLabel>
                      <Select
                        value={formData.subcategory}
                        onChange={(e) => handleChange('subcategory', e.target.value)}
                        label="Subcategoría"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: colorTokens.textPrimary,
                            '& fieldset': { borderColor: `${colorTokens.brand}30` },
                            '&:hover fieldset': { borderColor: colorTokens.brand },
                            '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                          },
                          '& .MuiInputLabel-root': { 
                            color: colorTokens.textSecondary,
                            '&.Mui-focused': { color: colorTokens.brand }
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em>Sin subcategoría</em>
                        </MenuItem>
                        {availableSubcategories.map((subcategory) => (
                          <MenuItem key={subcategory} value={subcategory}>
                            {subcategory}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* PRECIOS Y COSTOS */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: colorTokens.surfaceLevel1, 
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.brand, 
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
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
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
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ 
                      p: 2, 
                      background: `${colorTokens.success}10`,
                      border: `1px solid ${colorTokens.success}30`,
                      borderRadius: 2,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.success }}>
                        Margen de Ganancia: {formData.profit_margin.toFixed(2)}%
                      </Typography>
                      <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
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
                              color: colorTokens.brand,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colorTokens.brand,
                            },
                          }}
                        />
                      }
                      label="Producto Gravado"
                      sx={{ color: colorTokens.textPrimary }}
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
                            color: colorTokens.textPrimary,
                            '& fieldset': { borderColor: `${colorTokens.brand}30` },
                            '&:hover fieldset': { borderColor: colorTokens.brand },
                            '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                          },
                          '& .MuiInputLabel-root': { 
                            color: colorTokens.textSecondary,
                            '&.Mui-focused': { color: colorTokens.brand }
                          }
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* PROVEEDOR Y OTROS */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: colorTokens.surfaceLevel1, 
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ 
                  color: colorTokens.brand, 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <BusinessIcon />
                  Información Adicional
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: colorTokens.textSecondary,
                        '&.Mui-focused': { color: colorTokens.brand }
                      }}>
                        Proveedor
                      </InputLabel>
                      <Select
                        value={formData.supplier_id}
                        label="Proveedor"
                        onChange={(e) => handleChange('supplier_id', e.target.value)}
                        disabled={suppliersLoading}
                        sx={{
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
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              background: colorTokens.surfaceLevel2,
                              border: `1px solid ${colorTokens.brand}30`,
                              color: colorTokens.textPrimary
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

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Ubicación/Anaquel"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                      placeholder="Ej: A1, Zona B"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha de Vencimiento"
                      value={formData.expiry_date || ''}
                      onChange={(e) => handleChange('expiry_date', e.target.value || null)}
                      InputLabelProps={{ shrink: true }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: colorTokens.textPrimary,
                          '& fieldset': { borderColor: `${colorTokens.brand}30` },
                          '&:hover fieldset': { borderColor: colorTokens.brand },
                          '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                        },
                        '& .MuiInputLabel-root': { 
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.brand }
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
                              color: colorTokens.brand,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colorTokens.brand,
                            },
                          }}
                        />
                      }
                      label="Producto Activo"
                      sx={{ color: colorTokens.textPrimary }}
                    />
                  </Grid>

                  {/* ✅ MENSAJE INFORMATIVO PARA PRODUCTOS NUEVOS */}
                  {!product && (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="info" sx={{ 
                        backgroundColor: `${colorTokens.info}10`,
                        border: `1px solid ${colorTokens.info}30`,
                        borderRadius: 2
                      }}>
                        <strong>Gestión de Inventario:</strong> El producto se creará sin stock inicial. Para agregar inventario, dirígete al módulo de <strong>Inventario</strong> y registra un movimiento de entrada.
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ERRORES GENERALES */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mt: 3 }}>
            Por favor, corrige los errores en el formulario antes de continuar.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: `1px solid ${colorTokens.border}`,
        gap: 2
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          startIcon={<CloseIcon />}
          sx={{ 
            color: colorTokens.textSecondary,
            borderColor: `${colorTokens.textSecondary}60`,
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
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 4, py: 1.5, borderRadius: 3,
            boxShadow: `0 4px 20px ${colorTokens.brand}40`,
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 25px ${colorTokens.brand}50`
            },
            '&:disabled': {
              background: colorTokens.neutral400,
              color: colorTokens.textMuted
            },
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')} Producto
        </Button>
      </DialogActions>
    </Dialog>
  );
}