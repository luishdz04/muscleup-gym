'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Tooltip,
  Divider,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  Cake as CakeIcon,
  Star as StarIcon,
  Clear as ClearIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

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

interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  whatsapp?: string;
  birthDate?: string;
  gender?: string;
  maritalStatus?: string;
  rol?: string;
  isMinor?: boolean;
  createdAt?: string;
}

interface Customer extends User {
  name: string;
  membership_type?: string;
  points_balance?: number;
  total_purchases?: number;
}

interface CustomerSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

interface NewCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const GENDER_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
  { value: 'prefiero_no_decir', label: 'Prefiero no decir' }
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'soltero', label: 'Soltero(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viudo', label: 'Viudo(a)' },
  { value: 'union_libre', label: 'Unión libre' }
];

export default function CustomerSelector({ open, onClose, onSelect }: CustomerSelectorProps) {
  const [currentTab, setCurrentTab] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados para nuevo cliente
  const [newCustomerData, setNewCustomerData] = useState<NewCustomerData>({
    firstName: '',
    lastName: '',
    email: '',
    whatsapp: '',
    birthDate: '',
    gender: '',
    maritalStatus: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

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

  // ✅ Formatear fecha
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // ✅ Formatear teléfono
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '+52 $1 $2 $3');
    }
    return phone;
  };

  // ✅ Mostrar notificación
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  // Cargar clientes
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Users')
        .select('*')
        .in('rol', ['cliente', 'miembro'])
        .order('firstName');

      if (error) throw error;

      const transformedCustomers: Customer[] = (data || []).map(user => ({
        ...user,
        name: `${user.firstName} ${user.lastName || ''}`.trim(),
        membership_type: user.rol === 'miembro' ? 'Miembro activo' : undefined,
        points_balance: 0,
        total_purchases: 0
      }));

      setCustomers(transformedCustomers);
      setFilteredCustomers(transformedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      showNotification('Error al cargar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes
  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.whatsapp && customer.whatsapp.includes(searchTerm)) ||
        (customer.id && customer.id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (genderFilter) {
      filtered = filtered.filter(customer => customer.gender === genderFilter);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, genderFilter]);

  // Validar nuevo cliente
  const validateNewCustomer = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newCustomerData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (newCustomerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomerData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (newCustomerData.whatsapp && newCustomerData.whatsapp.replace(/\D/g, '').length < 10) {
      newErrors.whatsapp = 'El WhatsApp debe tener al menos 10 dígitos';
    }

    if (newCustomerData.birthDate) {
      const birthDate = new Date(newCustomerData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 0 || age > 120) {
        newErrors.birthDate = 'Fecha de nacimiento no válida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Crear nuevo cliente
  const createNewCustomer = async () => {
    if (!validateNewCustomer()) return;

    try {
      setCreating(true);

      const customerData = {
        firstName: newCustomerData.firstName.trim(),
        lastName: newCustomerData.lastName.trim() || null,
        email: newCustomerData.email.trim() || null,
        whatsapp: newCustomerData.whatsapp.trim() || null,
        birthDate: newCustomerData.birthDate || null,
        gender: newCustomerData.gender || null,
        maritalStatus: newCustomerData.maritalStatus || null,
        isMinor: false,
        createdAt: new Date().toISOString(),
        rol: 'cliente',
        fingerprint: false,
        emailSent: false,
        whatsappSent: false
      };

      // Calcular si es menor de edad
      if (newCustomerData.birthDate) {
        const birthDate = new Date(newCustomerData.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          customerData.isMinor = age - 1 < 18;
        } else {
          customerData.isMinor = age < 18;
        }
      }

      const { data, error } = await supabase
        .from('Users')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      const newCustomer: Customer = {
        ...data,
        name: `${data.firstName} ${data.lastName || ''}`.trim(),
        membership_type: data.rol === 'miembro' ? 'Miembro activo' : undefined,
        points_balance: 0,
        total_purchases: 0
      };

      showNotification('Cliente creado exitosamente', 'success');
      setCustomers(prev => [newCustomer, ...prev]);
      onSelect(newCustomer);
      onClose();
    } catch (error: any) {
      console.error('Error creating customer:', error);
      
      if (error.code === '23505') {
        if (error.constraint?.includes('email')) {
          showNotification('Ya existe un cliente con ese email', 'error');
          setErrors({ email: 'Ya existe un cliente con ese email' });
        } else {
          showNotification('Ya existe un cliente con esa información', 'error');
        }
      } else {
        showNotification('Error al crear cliente', 'error');
      }
    } finally {
      setCreating(false);
    }
  };

  // Seleccionar cliente
  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer);
    onClose();
  };

  // Formatear teléfono en tiempo real
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setNewCustomerData(prev => ({ ...prev, whatsapp: formatted }));
  };

  // Limpiar formulario
  const clearForm = () => {
    setNewCustomerData({
      firstName: '',
      lastName: '',
      email: '',
      whatsapp: '',
      birthDate: '',
      gender: '',
      maritalStatus: ''
    });
    setErrors({});
  };

  // Cargar datos cuando se abre
  useEffect(() => {
    if (open) {
      loadCustomers();
      setCurrentTab(0);
      setSearchTerm('');
      setGenderFilter('');
      clearForm();
    }
  }, [open]);

  // Función para calcular edad
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // ✅ Formatear información del cliente para display
  const formatCustomerInfo = (customer: Customer) => {
    const parts = [];
    
    if (customer.email) {
      parts.push(`📧 ${customer.email}`);
    }
    
    if (customer.whatsapp) {
      parts.push(`📱 ${customer.whatsapp}`);
    }
    
    if (customer.birthDate) {
      const age = calculateAge(customer.birthDate);
      if (age !== null) {
        parts.push(`🎂 ${age} años`);
      }
    }
    
    return parts.join(' • ');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 4,
          background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}, ${darkProTokens.surfaceLevel3})`,
          border: `2px solid ${darkProTokens.primary}50`,
          color: darkProTokens.textPrimary,
          maxHeight: '90vh',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5)`
        }
      }}
    >
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

      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
        color: darkProTokens.background,
        pb: 2,
        borderRadius: '16px 16px 0 0'
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <PersonIcon sx={{ fontSize: 35 }} />
          <Typography variant="h5" fontWeight="bold">
            👥 Seleccionar Cliente
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose} 
          sx={{ 
            color: darkProTokens.background,
            '&:hover': {
              backgroundColor: `${darkProTokens.background}20`
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 0 }}>
          {/* ✅ TABS CON DARK PRO SYSTEM */}
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
            sx={{ 
              borderBottom: `1px solid ${darkProTokens.grayDark}`,
              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
              '& .MuiTab-root': {
                color: darkProTokens.textSecondary,
                fontWeight: 600,
                '&.Mui-selected': {
                  color: darkProTokens.primary
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: darkProTokens.primary,
                height: 3
              }
            }}
          >
            <Tab 
              label="🔍 Buscar Cliente" 
              icon={<SearchIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="➕ Nuevo Cliente" 
              icon={<PersonAddIcon />} 
              iconPosition="start"
            />
          </Tabs>

          {/* ✅ TAB 1: BUSCAR CLIENTE CON DARK PRO SYSTEM */}
          <TabPanel value={currentTab} index={0}>
            <Box sx={{ p: 3 }}>
              {/* Filtros de búsqueda */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    fullWidth
                    placeholder="Buscar por nombre, email, teléfono o ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: darkProTokens.primary }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <ClearIcon sx={{ color: darkProTokens.textSecondary }} />
                          </IconButton>
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
                
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ 
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }}>
                      Género
                    </InputLabel>
                    <Select
                      value={genderFilter}
                      label="Género"
                      onChange={(e) => setGenderFilter(e.target.value)}
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
                      {GENDER_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid size={{ xs: 12, md: 1 }}>
                  <IconButton 
                    onClick={loadCustomers}
                    disabled={loading}
                    sx={{ 
                      mt: 1,
                      color: darkProTokens.textSecondary,
                      '&:hover': {
                        color: darkProTokens.primary,
                        backgroundColor: `${darkProTokens.primary}10`
                      }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Grid>
              </Grid>

              {/* Estadísticas */}
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3,
                  backgroundColor: `${darkProTokens.info}10`,
                  color: darkProTokens.textPrimary,
                  border: `1px solid ${darkProTokens.info}30`,
                  '& .MuiAlert-icon': { color: darkProTokens.info }
                }}
              >
                <Typography variant="body2">
                  {filteredCustomers.length} de {customers.length} clientes encontrados
                </Typography>
              </Alert>

              {/* Lista de clientes */}
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress sx={{ color: darkProTokens.primary }} size={60} thickness={4} />
                  </Box>
                ) : filteredCustomers.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <PersonIcon sx={{ fontSize: 64, color: darkProTokens.textSecondary, mb: 2 }} />
                    <Typography variant="h6" sx={{ color: darkProTokens.textSecondary }} gutterBottom>
                      No se encontraron clientes
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkProTokens.textSecondary, mb: 3 }}>
                      {customers.length === 0 
                        ? 'No hay clientes registrados'
                        : 'Intenta ajustar los filtros de búsqueda'
                      }
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PersonAddIcon />}
                      onClick={() => setCurrentTab(1)}
                      sx={{
                        background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                        color: darkProTokens.background,
                        fontWeight: 700
                      }}
                    >
                      Crear Primer Cliente
                    </Button>
                  </Box>
                ) : (
                  <List>
                    <AnimatePresence mode="wait">
                      {filteredCustomers.map((customer, index) => (
                        <motion.div
                          key={customer.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <ListItem
                            sx={{
                              border: `1px solid ${darkProTokens.grayDark}`,
                              borderRadius: 2,
                              mb: 1,
                              background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel3}, ${darkProTokens.surfaceLevel4})`,
                              position: 'relative',
                              minHeight: 80,
                              pr: 8,
                              '&:hover': {
                                bgcolor: `${darkProTokens.primary}10`,
                                borderColor: darkProTokens.primary,
                                cursor: 'pointer',
                                transform: 'translateY(-2px)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <ListItemAvatar>
                              <Badge
                                badgeContent={customer.membership_type ? '⭐' : ''}
                                sx={{
                                  '& .MuiBadge-badge': {
                                    backgroundColor: darkProTokens.primary,
                                    color: darkProTokens.background
                                  }
                                }}
                              >
                                <Avatar sx={{ bgcolor: darkProTokens.primary, color: darkProTokens.background }}>
                                  <PersonIcon />
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            
                            <ListItemText
                              primary={customer.name}
                              secondary={formatCustomerInfo(customer)}
                              primaryTypographyProps={{
                                variant: 'subtitle1',
                                fontWeight: 'bold',
                                component: 'div',
                                sx: { color: darkProTokens.textPrimary }
                              }}
                              secondaryTypographyProps={{
                                variant: 'body2',
                                component: 'div',
                                sx: { 
                                  mt: 0.5,
                                  color: darkProTokens.textSecondary
                                }
                              }}
                            />
                            
                            {/* Chips posicionados absolutamente */}
                            <Box sx={{ 
                              position: 'absolute', 
                              top: 8, 
                              right: 60,
                              display: 'flex',
                              gap: 0.5
                            }}>
                              {customer.membership_type && (
                                <Chip 
                                  label={customer.membership_type} 
                                  size="small" 
                                  sx={{
                                    backgroundColor: `${darkProTokens.primary}20`,
                                    color: darkProTokens.primary,
                                    border: `1px solid ${darkProTokens.primary}40`,
                                    fontWeight: 600
                                  }}
                                />
                              )}
                              {customer.isMinor && (
                                <Chip 
                                  label="Menor" 
                                  size="small" 
                                  sx={{
                                    backgroundColor: `${darkProTokens.warning}20`,
                                    color: darkProTokens.warning,
                                    border: `1px solid ${darkProTokens.warning}40`,
                                    fontWeight: 600
                                  }}
                                />
                              )}
                            </Box>
                            
                            {/* ID y fecha como elemento separado */}
                            <Box sx={{ 
                              position: 'absolute', 
                              bottom: 8, 
                              left: 72, 
                              right: 60 
                            }}>
                              <Typography variant="caption" component="div" sx={{ color: darkProTokens.textSecondary }}>
                                ID: {customer.id.slice(0, 8)}... • Registro: {formatDate(customer.createdAt || '')}
                              </Typography>
                            </Box>
                            
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectCustomer(customer);
                                }}
                                sx={{ color: darkProTokens.primary }}
                              >
                                <CheckIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </List>
                )}
              </Box>
            </Box>
          </TabPanel>

          {/* ✅ TAB 2: NUEVO CLIENTE CON DARK PRO SYSTEM */}
          <TabPanel value={currentTab} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: darkProTokens.textPrimary,
                fontWeight: 700
              }}>
                <PersonAddIcon sx={{ color: darkProTokens.primary }} />
                Crear Nuevo Cliente
              </Typography>

              <Grid container spacing={3}>
                <Grid size={12}>
                  <Card sx={{
                    background: `${darkProTokens.info}10`,
                    border: `1px solid ${darkProTokens.info}30`,
                    borderRadius: 3
                  }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: darkProTokens.info }}>
                        📋 Información Personal
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Nombre *"
                            value={newCustomerData.firstName}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, firstName: e.target.value }))}
                            error={!!errors.firstName}
                            helperText={errors.firstName}
                            placeholder="Nombre del cliente"
                            InputProps={{
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
                            InputLabelProps={{
                              sx: { 
                                color: darkProTokens.textSecondary,
                                '&.Mui-focused': { color: darkProTokens.primary }
                              }
                            }}
                            FormHelperTextProps={{
                              sx: { color: darkProTokens.error }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Apellidos"
                            value={newCustomerData.lastName}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Apellidos del cliente"
                            InputProps={{
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
                            InputLabelProps={{
                              sx: { 
                                color: darkProTokens.textSecondary,
                                '&.Mui-focused': { color: darkProTokens.primary }
                              }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={newCustomerData.email}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                            error={!!errors.email}
                            helperText={errors.email}
                            placeholder="cliente@email.com"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <EmailIcon sx={{ color: darkProTokens.primary }} />
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
                            InputLabelProps={{
                              sx: { 
                                color: darkProTokens.textSecondary,
                                '&.Mui-focused': { color: darkProTokens.primary }
                              }
                            }}
                            FormHelperTextProps={{
                              sx: { color: darkProTokens.error }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="WhatsApp"
                            value={newCustomerData.whatsapp}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            error={!!errors.whatsapp}
                            helperText={errors.whatsapp}
                            placeholder="+52 55 1234 5678"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <WhatsAppIcon sx={{ color: darkProTokens.success }} />
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
                            InputLabelProps={{
                              sx: { 
                                color: darkProTokens.textSecondary,
                                '&.Mui-focused': { color: darkProTokens.primary }
                              }
                            }}
                            FormHelperTextProps={{
                              sx: { color: darkProTokens.error }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <TextField
                            fullWidth
                            label="Fecha de Nacimiento"
                            type="date"
                            value={newCustomerData.birthDate}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, birthDate: e.target.value }))}
                            error={!!errors.birthDate}
                            helperText={errors.birthDate}
                            InputLabelProps={{
                              shrink: true,
                              sx: { 
                                color: darkProTokens.textSecondary,
                                '&.Mui-focused': { color: darkProTokens.primary }
                              }
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CakeIcon sx={{ color: darkProTokens.warning }} />
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
                            FormHelperTextProps={{
                              sx: { color: darkProTokens.error }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <FormControl fullWidth>
                            <InputLabel sx={{ 
                              color: darkProTokens.textSecondary,
                              '&.Mui-focused': { color: darkProTokens.primary }
                            }}>
                              Género
                            </InputLabel>
                            <Select
                              value={newCustomerData.gender}
                              label="Género"
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, gender: e.target.value }))}
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
                              <MenuItem value="">No especificar</MenuItem>
                              {GENDER_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <FormControl fullWidth>
                            <InputLabel sx={{ 
                              color: darkProTokens.textSecondary,
                              '&.Mui-focused': { color: darkProTokens.primary }
                            }}>
                              Estado Civil
                            </InputLabel>
                            <Select
                              value={newCustomerData.maritalStatus}
                              label="Estado Civil"
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, maritalStatus: e.target.value }))}
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
                              <MenuItem value="">No especificar</MenuItem>
                              {MARITAL_STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>

                      {/* Previsualización */}
                      <Box sx={{ 
                        mt: 3, 
                        p: 2, 
                        background: `${darkProTokens.success}10`,
                        border: `1px solid ${darkProTokens.success}30`,
                        borderRadius: 2
                      }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: darkProTokens.success }}>
                          👀 Vista previa:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: darkProTokens.textPrimary }}>
                          {newCustomerData.firstName} {newCustomerData.lastName}
                        </Typography>
                        {newCustomerData.email && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            📧 {newCustomerData.email}
                          </Typography>
                        )}
                        {newCustomerData.whatsapp && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            📱 {newCustomerData.whatsapp}
                          </Typography>
                        )}
                        {newCustomerData.birthDate && (
                          <Typography variant="body2" sx={{ color: darkProTokens.textSecondary }}>
                            🎂 {calculateAge(newCustomerData.birthDate)} años
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        {currentTab === 0 ? (
          <>
            <Button 
              onClick={onClose}
              sx={{ color: darkProTokens.textSecondary }}
            >
              Cancelar
            </Button>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => setCurrentTab(1)}
              sx={{
                borderColor: darkProTokens.primary,
                color: darkProTokens.primary,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  backgroundColor: `${darkProTokens.primary}10`
                }
              }}
            >
              Nuevo Cliente
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={onClose} 
              disabled={creating}
              sx={{ color: darkProTokens.textSecondary }}
            >
              Cancelar
            </Button>
            <Button
              variant="outlined"
              onClick={() => setCurrentTab(0)}
              disabled={creating}
              sx={{
                borderColor: darkProTokens.primary,
                color: darkProTokens.primary,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  backgroundColor: `${darkProTokens.primary}10`
                }
              }}
            >
              Volver a Buscar
            </Button>
            <Button
              variant="outlined"
              onClick={clearForm}
              disabled={creating}
              sx={{
                borderColor: darkProTokens.textSecondary,
                color: darkProTokens.textSecondary,
                '&:hover': {
                  borderColor: darkProTokens.textSecondary,
                  backgroundColor: `${darkProTokens.textSecondary}10`
                }
              }}
            >
              Limpiar
            </Button>
            <Button
              variant="contained"
              startIcon={creating ? <CircularProgress size={20} sx={{ color: darkProTokens.background }} /> : <CheckIcon />}
              onClick={createNewCustomer}
              disabled={!newCustomerData.firstName.trim() || creating}
              sx={{
                background: `linear-gradient(135deg, ${darkProTokens.primary}, ${darkProTokens.primaryHover})`,
                color: darkProTokens.background,
                fontWeight: 'bold',
                '&:hover': {
                  background: `linear-gradient(135deg, ${darkProTokens.primaryHover}, ${darkProTokens.primaryActive})`
                }
              }}
            >
              {creating ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
