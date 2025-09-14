// 📁 src/app/dashboard/admin/catalogo/proveedores/components/SupplierFormDialog.tsx
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
  CardContent,
  Rating,
  Slider
} from '@mui/material';
import {
  Save as SaveIcon,
  Close as CloseIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Language as WebsiteIcon,
  Home as AddressIcon,
  CreditCard as CreditIcon,
  Star as StarIcon,
  Category as CategoryIcon,
  Schedule as DeliveryIcon
} from '@mui/icons-material';
import { Supplier } from '@/services/catalogService'; // Mejora #3: Tipado fuerte

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

// 🎯 CATEGORÍAS PREDEFINIDAS PARA PROVEEDORES
const SUPPLIER_CATEGORIES = [
  'Tecnología',
  'Alimentos y Bebidas',
  'Textil y Confección',
  'Construcción',
  'Automotriz',
  'Salud y Farmacia',
  'Oficina y Papelería',
  'Limpieza y Mantenimiento',
  'Electrodomésticos',
  'Deportes y Recreación',
  'Hogar y Decoración',
  'Herramientas',
  'Químicos',
  'Servicios',
  'Otros'
];

// 🎯 TÉRMINOS DE PAGO PREDEFINIDOS
const PAYMENT_TERMS = [
  'contado',
  '15 días',
  '30 días',
  '45 días',
  '60 días',
  '90 días',
  'personalizado'
];

// 🎯 ESTADOS DE MÉXICO
const MEXICO_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

// 🎯 ESTADO INICIAL DEL FORMULARIO - CENTRALIZADO (Mejora #1)
const INITIAL_FORM_STATE = {
  company_name: '',
  contact_person: '',
  email: '',
  phone: '',
  whatsapp: '',
  website: '',
  rfc: '',
  address: {
    street: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'México'
  },
  payment_terms: 'contado',
  credit_limit: 0,
  current_balance: 0,
  rating: 5,
  is_active: true,
  categories: [] as string[],
  delivery_time: 7,
  notes: ''
};

interface SupplierFormDialogProps {
  open: boolean;
  onClose: () => void;
  supplier?: Supplier | null; // Mejora #3: Tipado fuerte
  onSave: () => void;
}

export default function SupplierFormDialog({
  open,
  onClose,
  supplier,
  onSave
}: SupplierFormDialogProps) {
  
  // 🎯 ESTADO DEL FORMULARIO - USA CONSTANTE CENTRALIZADA
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // 🎯 EFECTOS - SIMPLIFICADO (Mejora #1)
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
        address: {
          street: supplier.address?.street || '',
          city: supplier.address?.city || '',
          state: supplier.address?.state || '',
          postal_code: supplier.address?.postal_code || '',
          country: supplier.address?.country || 'México'
        },
        payment_terms: supplier.payment_terms || 'contado',
        credit_limit: supplier.credit_limit || 0,
        current_balance: supplier.current_balance || 0,
        rating: supplier.rating || 5,
        is_active: supplier.is_active !== false,
        categories: supplier.categories || [],
        delivery_time: supplier.delivery_time || 7,
        notes: supplier.notes || ''
      });
    } else {
      // ✅ REUTILIZA LA CONSTANTE EN LUGAR DE DUPLICAR
      setFormData(INITIAL_FORM_STATE);
    }
    setErrors({});
  }, [supplier, open]);

  // 🎯 VALIDACIONES
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'El nombre de la empresa es obligatorio';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'El formato del email no es válido';
    }

    if (formData.rfc && !isValidRFC(formData.rfc)) {
      newErrors.rfc = 'El formato del RFC no es válido';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'El formato del teléfono no es válido';
    }

    if (formData.whatsapp && !isValidPhone(formData.whatsapp)) {
      newErrors.whatsapp = 'El formato del WhatsApp no es válido';
    }

    if (formData.website && !isValidURL(formData.website)) {
      newErrors.website = 'El formato del sitio web no es válido';
    }

    if (formData.credit_limit < 0) {
      newErrors.credit_limit = 'El límite de crédito no puede ser negativo';
    }

    if (formData.current_balance < 0) {
      newErrors.current_balance = 'El saldo actual no puede ser negativo';
    }

    if (formData.delivery_time < 1) {
      newErrors.delivery_time = 'El tiempo de entrega debe ser al menos 1 día';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🎯 VALIDADORES
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidRFC = (rfc: string): boolean => {
    const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    return rfcRegex.test(rfc.toUpperCase());
  };

  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  };

  const isValidURL = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  // 🎯 MANEJAR CAMBIOS EN EL FORMULARIO
  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 🎯 MANEJAR GUARDAR
  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Preparar datos con RFC en mayúsculas
      const dataToSave = {
        ...formData,
        rfc: formData.rfc.toUpperCase()
      };

      // Aquí se llamaría al hook de proveedores para crear/actualizar
      // const result = supplier 
      //   ? await updateSupplier(supplier.id, dataToSave)
      //   : await createSupplier(dataToSave);
      
      // Simular operación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🎯 FORMATEAR TELÉFONO
  const formatPhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return phone;
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
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
        borderBottom: `1px solid ${darkProTokens.primary}30`,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <BusinessIcon sx={{ color: darkProTokens.primary }} />
        <Typography variant="h6" fontWeight="bold">
          {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* 🏢 INFORMACIÓN DE LA EMPRESA */}
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
                  <BusinessIcon />
                  Información de la Empresa
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      fullWidth
                      label="Nombre de la Empresa *"
                      value={formData.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      error={!!errors.company_name}
                      helperText={errors.company_name}
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
                      label="RFC"
                      value={formData.rfc}
                      onChange={(e) => handleChange('rfc', e.target.value.toUpperCase())}
                      error={!!errors.rfc}
                      helperText={errors.rfc || 'Formato: ABC123456XYZ'}
                      placeholder="XAXX010101000"
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
                    {/* ✅ AUTOCOMPLETE SIMPLIFICADO (Mejora #2) */}
                    <Autocomplete
                      multiple
                      options={SUPPLIER_CATEGORIES}
                      value={formData.categories} // ✅ Directo de formData
                      onChange={(_, newValue) => {
                        handleChange('categories', newValue); // ✅ Una sola fuente de verdad
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Categorías"
                          placeholder="Selecciona las categorías del proveedor"
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
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                          const { key, ...chipProps } = getTagProps({ index });
                          return (
                            <Chip
                              key={key}
                              label={option}
                              {...chipProps}
                              sx={{
                                backgroundColor: `${darkProTokens.info}20`,
                                color: darkProTokens.info,
                                border: `1px solid ${darkProTokens.info}40`,
                                '& .MuiChip-deleteIcon': { color: darkProTokens.info }
                              }}
                            />
                          );
                        })
                      }
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 👤 INFORMACIÓN DE CONTACTO */}
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
                  <PersonIcon />
                  Información de Contacto
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Persona de Contacto"
                      value={formData.contact_person}
                      onChange={(e) => handleChange('contact_person', e.target.value)}
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
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      error={!!errors.email}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: darkProTokens.primary }} />
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
                      label="Teléfono"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      error={!!errors.phone}
                      helperText={errors.phone || 'Formato: 10 dígitos'}
                      placeholder="5551234567"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: darkProTokens.success }} />
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
                      label="WhatsApp"
                      value={formData.whatsapp}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                      error={!!errors.whatsapp}
                      helperText={errors.whatsapp || 'Formato: 10 dígitos'}
                      placeholder="5551234567"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WhatsAppIcon sx={{ color: darkProTokens.success }} />
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

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Sitio Web"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      error={!!errors.website}
                      helperText={errors.website || 'Ej: www.empresa.com'}
                      placeholder="https://www.empresa.com"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WebsiteIcon sx={{ color: darkProTokens.info }} />
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* 🏠 DIRECCIÓN */}
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
                  <AddressIcon />
                  Dirección
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Calle y Número"
                      value={formData.address.street}
                      onChange={(e) => handleChange('address.street', e.target.value)}
                      placeholder="Av. Principal #123, Col. Centro"
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
                      label="Ciudad"
                      value={formData.address.city}
                      onChange={(e) => handleChange('address.city', e.target.value)}
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
                      options={MEXICO_STATES}
                      value={formData.address.state}
                      onChange={(_, newValue) => handleChange('address.state', newValue || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Estado"
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
                      label="Código Postal"
                      value={formData.address.postal_code}
                      onChange={(e) => handleChange('address.postal_code', e.target.value)}
                      placeholder="12345"
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
                      label="País"
                      value={formData.address.country}
                      onChange={(e) => handleChange('address.country', e.target.value)}
                      disabled
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

          {/* 💳 TÉRMINOS COMERCIALES */}
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
                  <CreditIcon />
                  Términos Comerciales
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ 
                        color: darkProTokens.textSecondary,
                        '&.Mui-focused': { color: darkProTokens.primary }
                      }}>
                        Términos de Pago
                      </InputLabel>
                      <Select
                        value={formData.payment_terms}
                        label="Términos de Pago"
                        onChange={(e) => handleChange('payment_terms', e.target.value)}
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
                        {PAYMENT_TERMS.map((term) => (
                          <MenuItem key={term} value={term}>
                            {term.charAt(0).toUpperCase() + term.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Límite de Crédito"
                      value={formData.credit_limit}
                      onChange={(e) => handleChange('credit_limit', parseFloat(e.target.value) || 0)}
                      error={!!errors.credit_limit}
                      helperText={errors.credit_limit}
                      InputProps={{
                        startAdornment: <Box sx={{ color: darkProTokens.textSecondary, mr: 1 }}>$</Box>,
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
                      label="Saldo Actual"
                      value={formData.current_balance}
                      onChange={(e) => handleChange('current_balance', parseFloat(e.target.value) || 0)}
                      error={!!errors.current_balance}
                      helperText={errors.current_balance || 'Saldo pendiente de pago'}
                      disabled={!!supplier} // Solo lectura en edición
                      InputProps={{
                        startAdornment: <Box sx={{ color: darkProTokens.textSecondary, mr: 1 }}>$</Box>,
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* ⭐ CALIFICACIÓN Y OTROS */}
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
                  <StarIcon />
                  Evaluación y Servicios
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                        Calificación del Proveedor
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Rating
                          value={formData.rating}
                          onChange={(_, newValue) => handleChange('rating', newValue || 1)}
                          size="large"
                          sx={{
                            '& .MuiRating-iconFilled': {
                              color: darkProTokens.primary,
                            },
                            '& .MuiRating-iconEmpty': {
                              color: `${darkProTokens.primary}40`,
                            },
                          }}
                        />
                        <Typography variant="body1" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                          {formData.rating}/5
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 1 }}>
                        Tiempo de Entrega (días): {formData.delivery_time}
                      </Typography>
                      <Slider
                        value={formData.delivery_time}
                        onChange={(_, newValue) => handleChange('delivery_time', newValue)}
                        min={1}
                        max={30}
                        step={1}
                        marks={[
                          { value: 1, label: '1' },
                          { value: 7, label: '7' },
                          { value: 15, label: '15' },
                          { value: 30, label: '30' }
                        ]}
                        sx={{
                          color: darkProTokens.primary,
                          '& .MuiSlider-thumb': {
                            backgroundColor: darkProTokens.primary,
                          },
                          '& .MuiSlider-track': {
                            backgroundColor: darkProTokens.primary,
                          },
                          '& .MuiSlider-rail': {
                            backgroundColor: `${darkProTokens.primary}30`,
                          },
                          '& .MuiSlider-mark': {
                            backgroundColor: darkProTokens.textSecondary,
                          },
                          '& .MuiSlider-markLabel': {
                            color: darkProTokens.textSecondary,
                          },
                        }}
                      />
                    </Box>
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
                      label="Proveedor Activo"
                      sx={{ color: darkProTokens.textPrimary }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Notas Adicionales"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                      multiline
                      rows={3}
                      placeholder="Información adicional sobre el proveedor..."
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
          {loading ? 'Guardando...' : (supplier ? 'Actualizar' : 'Crear')} Proveedor
        </Button>
      </DialogActions>
    </Dialog>
  );
}