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
  Grid as Grid,
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
  Divider
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
import { formatDate, formatPhoneNumber } from '@/utils/formatUtils';
import { showNotification } from '@/utils/notifications';
import { User } from '@/types';
import { corporateColors, getGradient } from '@/theme/colors';

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

  const supabase = createBrowserSupabaseClient();

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
        phone: data.whatsapp,
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
          <PersonIcon />
          <Typography variant="h6" fontWeight="bold">
            👥 Seleccionar Cliente
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'inherit' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 0 }}>
          {/* Tabs */}
          <Tabs 
            value={currentTab} 
            onChange={(_, newValue) => setCurrentTab(newValue)}
            variant="fullWidth"
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              bgcolor: corporateColors.background.dark,
              '& .MuiTab-root': {
                color: corporateColors.text.primary
              },
              '& .Mui-selected': {
                color: corporateColors.primary.main
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

          {/* Tab 1: Buscar cliente */}
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
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setSearchTerm('')}>
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                
                <Grid size={{ xs: 12, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Género</InputLabel>
                    <Select
                      value={genderFilter}
                      label="Género"
                      onChange={(e) => setGenderFilter(e.target.value)}
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
                    sx={{ mt: 1 }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Grid>
              </Grid>

              {/* Estadísticas */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  {filteredCustomers.length} de {customers.length} clientes encontrados
                </Typography>
              </Alert>

              {/* Lista de clientes */}
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography>Cargando clientes...</Typography>
                  </Box>
                ) : filteredCustomers.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <PersonIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No se encontraron clientes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
                        background: getGradient('primary'),
                        color: corporateColors.text.onPrimary
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
                              border: 1,
                              borderColor: 'grey.200',
                              borderRadius: 2,
                              mb: 1,
                              position: 'relative', // ✅ Para positioning de chips
                              minHeight: 80, // ✅ Altura mínima para evitar solapamiento
                              pr: 8, // ✅ Padding derecho para el botón
                              '&:hover': {
                                bgcolor: corporateColors.primary.main + '20',
                                borderColor: corporateColors.primary.main,
                                cursor: 'pointer'
                              }
                            }}
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            <ListItemAvatar>
                              <Badge
                                badgeContent={customer.membership_type ? '⭐' : ''}
                                color="primary"
                              >
                                <Avatar sx={{ bgcolor: corporateColors.primary.main }}>
                                  <PersonIcon />
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            
                            {/* ✅ CORREGIDO: Evitar anidación de elementos p */}
                            <ListItemText
                              primary={customer.name}
                              secondary={formatCustomerInfo(customer)}
                              primaryTypographyProps={{
                                variant: 'subtitle1',
                                fontWeight: 'bold',
                                component: 'div' // ✅ Usar div en lugar de p
                              }}
                              secondaryTypographyProps={{
                                variant: 'body2',
                                color: 'text.secondary',
                                component: 'div', // ✅ Usar div en lugar de p
                                sx: { mt: 0.5 }
                              }}
                            />
                            
                            {/* ✅ Chips posicionados absolutamente */}
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
                                  color="primary" 
                                />
                              )}
                              {customer.isMinor && (
                                <Chip 
                                  label="Menor" 
                                  size="small" 
                                  color="warning" 
                                />
                              )}
                            </Box>
                            
                            {/* ✅ ID y fecha como elemento separado */}
                            <Box sx={{ 
                              position: 'absolute', 
                              bottom: 8, 
                              left: 72, 
                              right: 60 
                            }}>
                              <Typography variant="caption" color="text.secondary" component="div">
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
                                color="primary"
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

          {/* Tab 2: Nuevo cliente */}
          <TabPanel value={currentTab} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonAddIcon color="primary" />
                Crear Nuevo Cliente
              </Typography>

              <Grid container spacing={3}>
                <Grid size={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
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
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            label="Apellidos"
                            value={newCustomerData.lastName}
                            onChange={(e) => setNewCustomerData(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Apellidos del cliente"
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
                                  <EmailIcon />
                                </InputAdornment>
                              ),
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
                                  <WhatsAppIcon />
                                </InputAdornment>
                              ),
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
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CakeIcon />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <FormControl fullWidth>
                            <InputLabel>Género</InputLabel>
                            <Select
                              value={newCustomerData.gender}
                              label="Género"
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, gender: e.target.value }))}
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
                            <InputLabel>Estado Civil</InputLabel>
                            <Select
                              value={newCustomerData.maritalStatus}
                              label="Estado Civil"
                              onChange={(e) => setNewCustomerData(prev => ({ ...prev, maritalStatus: e.target.value }))}
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
                      <Box sx={{ mt: 3, p: 2, bgcolor: corporateColors.background.light, borderRadius: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          👀 Vista previa:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {newCustomerData.firstName} {newCustomerData.lastName}
                        </Typography>
                        {newCustomerData.email && (
                          <Typography variant="body2" color="text.secondary">
                            📧 {newCustomerData.email}
                          </Typography>
                        )}
                        {newCustomerData.whatsapp && (
                          <Typography variant="body2" color="text.secondary">
                            📱 {newCustomerData.whatsapp}
                          </Typography>
                        )}
                        {newCustomerData.birthDate && (
                          <Typography variant="body2" color="text.secondary">
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
            <Button onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => setCurrentTab(1)}
              sx={{
                borderColor: corporateColors.primary.main,
                color: corporateColors.primary.main
              }}
            >
              Nuevo Cliente
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} disabled={creating}>
              Cancelar
            </Button>
            <Button
              variant="outlined"
              onClick={() => setCurrentTab(0)}
              disabled={creating}
              sx={{
                borderColor: corporateColors.primary.main,
                color: corporateColors.primary.main
              }}
            >
              Volver a Buscar
            </Button>
            <Button
              variant="outlined"
              onClick={clearForm}
              disabled={creating}
              sx={{
                borderColor: corporateColors.primary.main,
                color: corporateColors.primary.main
              }}
            >
              Limpiar
            </Button>
            <Button
              variant="contained"
              startIcon={creating ? undefined : <CheckIcon />}
              onClick={createNewCustomer}
              disabled={!newCustomerData.firstName.trim() || creating}
              sx={{
                background: getGradient('primary'),
                color: corporateColors.text.onPrimary,
                fontWeight: 'bold'
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