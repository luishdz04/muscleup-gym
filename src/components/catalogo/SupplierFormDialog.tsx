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
  Rating,
  Card,
  CardContent,
  Divider,
  Autocomplete
} from '@mui/material';
import {
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { showNotification } from '@/utils/notifications';
import { Supplier } from '@/types';
import { corporateColors, getGradient } from '@/theme/colors';

interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onSave: () => void;
}

interface SupplierFormData {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  rfc: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  payment_terms: string;
  credit_limit: number;
  current_balance: number;
  rating: number;
  categories: string[];
  delivery_time: number;
  notes: string;
}

const PAYMENT_TERMS = [
  { value: 'contado', label: 'Contado' },
  { value: '15_dias', label: '15 días' },
  { value: '30_dias', label: '30 días' },
  { value: '45_dias', label: '45 días' },
  { value: '60_dias', label: '60 días' },
  { value: '90_dias', label: '90 días' }
];

const STATES_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

const COMMON_CATEGORIES = [
  'Suplementos', 'Bebidas', 'Ropa Deportiva', 'Accesorios',
  'Equipamiento', 'Snacks', 'Proteínas', 'Vitaminas',
  'Equipos de Gimnasio', 'Limpieza', 'Otros'
];

export default function SupplierFormDialog({ 
  open, 
  onClose, 
  supplier, 
  onSave 
}: SupplierFormDialogProps) {
  const [formData, setFormData] = useState<SupplierFormData>({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    rfc: '',
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'México'
    },
    payment_terms: 'contado',
    credit_limit: 0,
    current_balance: 0,
    rating: 5,
    categories: [],
    delivery_time: 7,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const supabase = createBrowserSupabaseClient();

  // ✅ Cargar datos del proveedor si está editando
  useEffect(() => {
    if (supplier) {
      setFormData({
        company_name: supplier.company_name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        whatsapp: supplier.whatsapp || '',
        website: supplier.website || '',
        rfc: supplier.rfc || '',
        address: supplier.address || {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'México'
        },
        payment_terms: supplier.payment_terms || 'contado',
        credit_limit: supplier.credit_limit || 0,
        current_balance: supplier.current_balance || 0,
        rating: supplier.rating || 5,
        categories: supplier.categories || [],
        delivery_time: supplier.delivery_time || 7,
        notes: supplier.notes || ''
      });
    } else {
      // Resetear formulario para nuevo proveedor
      setFormData({
        company_name: '',
        contact_person: '',
        email: '',
        phone: '',
        whatsapp: '',
        website: '',
        rfc: '',
        address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'México'
        },
        payment_terms: 'contado',
        credit_limit: 0,
        current_balance: 0,
        rating: 5,
        categories: [],
        delivery_time: 7,
        notes: ''
      });
    }
    setErrors({});
  }, [supplier, open]);

  // ✅ Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'El nombre de la empresa es requerido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (formData.phone && formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'El teléfono debe tener al menos 10 dígitos';
    }

    if (formData.whatsapp && formData.whatsapp.replace(/\D/g, '').length < 10) {
      newErrors.whatsapp = 'El WhatsApp debe tener al menos 10 dígitos';
    }

    if (formData.rfc && formData.rfc.length < 12) {
      newErrors.rfc = 'El RFC debe tener al menos 12 caracteres';
    }

    if (formData.credit_limit < 0) {
      newErrors.credit_limit = 'El límite de crédito no puede ser negativo';
    }

    if (formData.delivery_time < 1) {
      newErrors.delivery_time = 'El tiempo de entrega debe ser al menos 1 día';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Manejar cambios en campos
  const handleFieldChange = (field: string, value: any) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // ✅ Agregar categoría
  const addCategory = () => {
    if (newCategory.trim() && !formData.categories.includes(newCategory.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  // ✅ Remover categoría
  const removeCategory = (categoryToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat !== categoryToRemove)
    }));
  };

  // ✅ Guardar proveedor
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      const supplierData = {
        company_name: formData.company_name.trim(),
        contact_person: formData.contact_person.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
        website: formData.website.trim() || null,
        rfc: formData.rfc.trim().toUpperCase() || null,
        address: formData.address,
        payment_terms: formData.payment_terms,
        credit_limit: formData.credit_limit,
        current_balance: formData.current_balance,
        rating: formData.rating,
        categories: formData.categories,
        delivery_time: formData.delivery_time,
        notes: formData.notes.trim() || null,
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      if (supplier) {
        // ✅ Actualizar proveedor existente
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', supplier.id);

        if (error) throw error;
        showNotification('Proveedor actualizado correctamente', 'success');
      } else {
        // ✅ Crear nuevo proveedor
        const { error } = await supabase
          .from('suppliers')
          .insert([{
            ...supplierData,
            is_active: true,
            created_at: new Date().toISOString(),
            created_by: userId
          }]);

        if (error) throw error;
        showNotification('Proveedor creado correctamente', 'success');
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      
      if (error.code === '23505') {
        if (error.constraint?.includes('company_name')) {
          setErrors({ company_name: 'Ya existe un proveedor con este nombre' });
        } else if (error.constraint?.includes('rfc')) {
          setErrors({ rfc: 'Ya existe un proveedor con este RFC' });
        } else {
          showNotification('Ya existe un proveedor con esta información', 'error');
        }
      } else {
        showNotification('Error al guardar proveedor', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3,
          bgcolor: corporateColors.background.paper,
          color: corporateColors.text.onWhite
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
          <BusinessIcon />
          <Typography variant="h6" fontWeight="bold">
            {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                  <BusinessIcon color="primary" />
                  Información Básica
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Nombre de la Empresa *"
                      value={formData.company_name}
                      onChange={(e) => handleFieldChange('company_name', e.target.value)}
                      error={!!errors.company_name}
                      helperText={errors.company_name}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Persona de Contacto"
                      value={formData.contact_person}
                      onChange={(e) => handleFieldChange('contact_person', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Teléfono"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="WhatsApp"
                      value={formData.whatsapp}
                      onChange={(e) => handleFieldChange('whatsapp', e.target.value)}
                      error={!!errors.whatsapp}
                      helperText={errors.whatsapp}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Sitio Web"
                      value={formData.website}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                      placeholder="https://ejemplo.com"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LanguageIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="RFC"
                      value={formData.rfc}
                      onChange={(e) => handleFieldChange('rfc', e.target.value.toUpperCase())}
                      error={!!errors.rfc}
                      helperText={errors.rfc}
                      placeholder="XAXX010101000"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Dirección */}
          <Grid size={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon color="primary" />
                  Dirección
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      fullWidth
                      label="Calle"
                      value={formData.address.street}
                      onChange={(e) => handleFieldChange('address.street', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Número"
                      value={formData.address.number}
                      onChange={(e) => handleFieldChange('address.number', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Colonia"
                      value={formData.address.neighborhood}
                      onChange={(e) => handleFieldChange('address.neighborhood', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Ciudad"
                      value={formData.address.city}
                      onChange={(e) => handleFieldChange('address.city', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Autocomplete
                      options={STATES_MEXICO}
                      value={formData.address.state}
                      onChange={(_, newValue) => handleFieldChange('address.state', newValue || '')}
                      renderInput={(params) => (
                        <TextField {...params} label="Estado" fullWidth />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="Código Postal"
                      value={formData.address.postalCode}
                      onChange={(e) => handleFieldChange('address.postalCode', e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      fullWidth
                      label="País"
                      value={formData.address.country}
                      onChange={(e) => handleFieldChange('address.country', e.target.value)}
                      disabled
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Términos comerciales */}
          <Grid size={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💼 Términos Comerciales
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel>Términos de Pago</InputLabel>
                      <Select
                        value={formData.payment_terms}
                        label="Términos de Pago"
                        onChange={(e) => handleFieldChange('payment_terms', e.target.value)}
                      >
                        {PAYMENT_TERMS.map((term) => (
                          <MenuItem key={term.value} value={term.value}>
                            {term.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Límite de Crédito"
                      type="number"
                      value={formData.credit_limit}
                      onChange={(e) => handleFieldChange('credit_limit', parseFloat(e.target.value) || 0)}
                      error={!!errors.credit_limit}
                      helperText={errors.credit_limit}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Saldo Actual"
                      type="number"
                      value={formData.current_balance}
                      onChange={(e) => handleFieldChange('current_balance', parseFloat(e.target.value) || 0)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box>
                      <Typography component="legend" gutterBottom>Rating del Proveedor</Typography>
                      <Rating
                        value={formData.rating}
                        onChange={(_, newValue) => handleFieldChange('rating', newValue || 5)}
                        icon={<StarIcon fontSize="inherit" />}
                        emptyIcon={<StarIcon fontSize="inherit" />}
                        size="large"
                      />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Tiempo de Entrega (días)"
                      type="number"
                      value={formData.delivery_time}
                      onChange={(e) => handleFieldChange('delivery_time', parseInt(e.target.value) || 7)}
                      error={!!errors.delivery_time}
                      helperText={errors.delivery_time}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Categorías */}
          <Grid size={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🏷️ Categorías de Productos
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" gap={1} sx={{ mb: 2 }}>
                    <Autocomplete
                      options={COMMON_CATEGORIES}
                      value={newCategory}
                      onInputChange={(_, newValue) => setNewCategory(newValue)}
                      freeSolo
                      sx={{ flex: 1 }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          label="Nueva Categoría" 
                          placeholder="Escribe o selecciona una categoría"
                        />
                      )}
                    />
                    <Button 
                      variant="contained" 
                      onClick={addCategory}
                      disabled={!newCategory.trim()}
                      sx={{
                        background: getGradient('primary'),
                        color: corporateColors.text.onPrimary
                      }}
                    >
                      <AddIcon />
                    </Button>
                  </Box>

                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {formData.categories.map((category, index) => (
                      <Chip
                        key={index}
                        label={category}
                        onDelete={() => removeCategory(category)}
                        deleteIcon={<DeleteIcon />}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Notas */}
          <Grid size={12}>
            <TextField
              fullWidth
              label="Notas"
              multiline
              rows={4}
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Información adicional sobre el proveedor..."
            />
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
          {loading ? 'Guardando...' : (supplier ? 'Actualizar' : 'Crear')} Proveedor
        </Button>
      </DialogActions>
    </Dialog>
  );
}