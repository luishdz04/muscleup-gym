'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid as Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  Inventory as InventoryIcon,
  AttachMoney as MoneyIcon,
  Category as CategoryIcon,
 QrCode as BarcodeIcon,
  Business as BusinessIcon,
  Image as ImageIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { showNotification } from '@/utils/notifications';
import { Product, Supplier } from '@/types';
import { corporateColors, getGradient } from '@/theme/colors';

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: () => void;
}

interface ProductFormData {
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
  image_url: string;
  is_active: boolean;
  is_taxable: boolean;
  tax_rate: number;
  location: string;
  expiry_date: string;
}

const CATEGORIES = [
  'Suplementos',
  'Bebidas',
  'Ropa Deportiva',
  'Accesorios',
  'Equipamiento',
  'Snacks',
  'Proteínas',
  'Vitaminas',
  'Equipos de Gimnasio',
  'Limpieza',
  'Otros'
];

const UNITS = [
  { value: 'pieza', label: 'Pieza' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'g', label: 'Gramo' },
  { value: 'l', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'botella', label: 'Botella' },
  { value: 'sobre', label: 'Sobre' },
  { value: 'bote', label: 'Bote' }
];

export default function ProductFormDialog({ 
  open, 
  onClose, 
  product, 
  onSave 
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>({
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
    image_url: '',
    is_active: true,
    is_taxable: true,
    tax_rate: 16,
    location: '',
    expiry_date: ''
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserSupabaseClient();

  // ✅ Cargar proveedores
  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, company_name, is_active')
        .eq('is_active', true)
        .order('company_name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  // ✅ Cargar datos del producto si está editando
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
        image_url: product.image_url || '',
        is_active: product.is_active !== false,
        is_taxable: product.is_taxable !== false,
        tax_rate: product.tax_rate || 16,
        location: product.location || '',
        expiry_date: product.expiry_date || ''
      });
    } else {
      // Resetear formulario para nuevo producto
      setFormData({
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
        image_url: '',
        is_active: true,
        is_taxable: true,
        tax_rate: 16,
        location: '',
        expiry_date: ''
      });
    }
    setErrors({});
  }, [product, open]);

  // ✅ Cargar proveedores al abrir
  useEffect(() => {
    if (open) {
      loadSuppliers();
    }
  }, [open]);

  // ✅ Calcular margen de ganancia automáticamente
  useEffect(() => {
    if (formData.cost_price > 0 && formData.sale_price > 0) {
      const margin = ((formData.sale_price - formData.cost_price) / formData.cost_price) * 100;
      setFormData(prev => ({
        ...prev,
        profit_margin: Math.round(margin * 100) / 100
      }));
    }
  }, [formData.cost_price, formData.sale_price]);

  // ✅ Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del producto es requerido';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'La categoría es requerida';
    }

    if (formData.cost_price < 0) {
      newErrors.cost_price = 'El precio de costo no puede ser negativo';
    }

    if (formData.sale_price < 0) {
      newErrors.sale_price = 'El precio de venta no puede ser negativo';
    }

    if (formData.sale_price < formData.cost_price) {
      newErrors.sale_price = 'El precio de venta debe ser mayor al precio de costo';
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

    if (formData.tax_rate < 0 || formData.tax_rate > 100) {
      newErrors.tax_rate = 'La tasa de impuesto debe estar entre 0 y 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Manejar cambios en campos
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ Generar SKU automático
  const generateSKU = () => {
    const categoryCode = formData.category.substring(0, 3).toUpperCase();
    const brandCode = formData.brand ? formData.brand.substring(0, 2).toUpperCase() : 'XX';
    const timestamp = Date.now().toString().slice(-4);
    const generatedSKU = `${categoryCode}${brandCode}${timestamp}`;
    
    handleFieldChange('sku', generatedSKU);
  };

  // ✅ Guardar producto
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        sku: formData.sku.trim() || null,
        barcode: formData.barcode.trim() || null,
        category: formData.category.trim(),
        subcategory: formData.subcategory.trim() || null,
        brand: formData.brand.trim() || null,
        cost_price: formData.cost_price,
        sale_price: formData.sale_price,
        profit_margin: formData.profit_margin,
        current_stock: formData.current_stock,
        min_stock: formData.min_stock,
        max_stock: formData.max_stock,
        unit: formData.unit,
        supplier_id: formData.supplier_id || null,
        image_url: formData.image_url.trim() || null,
        is_active: formData.is_active,
        is_taxable: formData.is_taxable,
        tax_rate: formData.tax_rate,
        location: formData.location.trim() || null,
        expiry_date: formData.expiry_date || null,
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      if (product) {
        // ✅ Actualizar producto existente
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
        showNotification('Producto actualizado correctamente', 'success');
      } else {
        // ✅ Crear nuevo producto
        const { error } = await supabase
          .from('products')
          .insert([{
            ...productData,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);

        if (error) throw error;
        showNotification('Producto creado correctamente', 'success');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      
      if (error.code === '23505') {
        if (error.constraint?.includes('sku')) {
          setErrors({ sku: 'Ya existe un producto con este SKU' });
        } else if (error.constraint?.includes('barcode')) {
          setErrors({ barcode: 'Ya existe un producto con este código de barras' });
        } else {
          showNotification('Ya existe un producto con esta información', 'error');
        }
      } else {
        showNotification('Error al guardar producto', 'error');
      }
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
          borderRadius: 3,
          bgcolor: corporateColors.background.paper,
          color: corporateColors.text.onWhite,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: getGradient('primary'),
        color: corporateColors.text.onPrimary,
        pb: 2
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <InventoryIcon />
          <Typography variant="h6" fontWeight="bold">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }} disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid size={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon color="primary" />
                  Información Básica
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Nombre del Producto *"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      error={!!errors.name}
                      helperText={errors.name}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Marca"
                      value={formData.brand}
                      onChange={(e) => handleFieldChange('brand', e.target.value)}
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Descripción"
                      multiline
                      rows={3}
                      value={formData.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      placeholder="Describe las características del producto..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="SKU"
                      value={formData.sku}
                      onChange={(e) => handleFieldChange('sku', e.target.value)}
                      error={!!errors.sku}
                      helperText={errors.sku}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button size="small" onClick={generateSKU}>
                              Generar
                            </Button>
                          </InputAdornment>
                        ),
                        startAdornment: (
                          <InputAdornment position="start">
                            <BarcodeIcon />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Código de Barras"
                      value={formData.barcode}
                      onChange={(e) => handleFieldChange('barcode', e.target.value)}
                      error={!!errors.barcode}
                      helperText={errors.barcode}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Autocomplete
                      options={CATEGORIES}
                      value={formData.category}
                      onChange={(_, newValue) => handleFieldChange('category', newValue || '')}
                      freeSolo
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Categoría *" 
                          error={!!errors.category}
                          helperText={errors.category}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CategoryIcon />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Subcategoría"
                      value={formData.subcategory}
                      onChange={(e) => handleFieldChange('subcategory', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Precios */}
          <Grid size={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon color="primary" />
                  Precios y Rentabilidad
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Precio de Costo *"
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => handleFieldChange('cost_price', parseFloat(e.target.value) || 0)}
                      error={!!errors.cost_price}
                      helperText={errors.cost_price}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Precio de Venta *"
                      type="number"
                      value={formData.sale_price}
                      onChange={(e) => handleFieldChange('sale_price', parseFloat(e.target.value) || 0)}
                      error={!!errors.sale_price}
                      helperText={errors.sale_price}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Margen de Ganancia"
                      value={`${formData.profit_margin}%`}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalculateIcon />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          color: formData.profit_margin > 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold'
                        }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.is_taxable}
                            onChange={(e) => handleFieldChange('is_taxable', e.target.checked)}
                          />
                        }
                        label="Producto Gravado"
                      />
                      {formData.is_taxable && (
                        <TextField
                          fullWidth
                          label="Tasa de IVA (%)"
                          type="number"
                          value={formData.tax_rate}
                          onChange={(e) => handleFieldChange('tax_rate', parseFloat(e.target.value) || 16)}
                          error={!!errors.tax_rate}
                          helperText={errors.tax_rate}
                          sx={{ mt: 1 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                        />
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Inventario */}
          <Grid size={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📦 Control de Inventario
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Unidad</InputLabel>
                      <Select
                        value={formData.unit}
                        label="Unidad"
                        onChange={(e) => handleFieldChange('unit', e.target.value)}
                      >
                        {UNITS.map((unit) => (
                          <MenuItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Stock Actual"
                      type="number"
                      value={formData.current_stock}
                      onChange={(e) => handleFieldChange('current_stock', parseInt(e.target.value) || 0)}
                      error={!!errors.current_stock}
                      helperText={errors.current_stock}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Stock Mínimo"
                      type="number"
                      value={formData.min_stock}
                      onChange={(e) => handleFieldChange('min_stock', parseInt(e.target.value) || 0)}
                      error={!!errors.min_stock}
                      helperText={errors.min_stock}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Stock Máximo"
                      type="number"
                      value={formData.max_stock}
                      onChange={(e) => handleFieldChange('max_stock', parseInt(e.target.value) || 1000)}
                      error={!!errors.max_stock}
                      helperText={errors.max_stock}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Ubicación"
                      value={formData.location}
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                      placeholder="Ej: A1-B2"
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      label="Fecha de Vencimiento"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => handleFieldChange('expiry_date', e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Proveedor e imagen */}
          <Grid size={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🏢 Proveedor e Imagen
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Proveedor</InputLabel>
                      <Select
                        value={formData.supplier_id}
                        label="Proveedor"
                        onChange={(e) => handleFieldChange('supplier_id', e.target.value)}
                      >
                        <MenuItem value="">Sin proveedor</MenuItem>
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
                      label="URL de Imagen"
                      value={formData.image_url}
                      onChange={(e) => handleFieldChange('image_url', e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <ImageIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                      />
                    }
                    label="Producto Activo"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading}
          sx={{
            background: getGradient('primary'),
            color: corporateColors.text.onPrimary,
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')} Producto
        </Button>
      </DialogActions>
    </Dialog>
  );
}