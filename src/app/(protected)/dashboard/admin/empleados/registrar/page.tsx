'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Grid, 
  MenuItem,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import PhotoCapture from './PhotoCapture';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🎨 DARK PRO TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  success: '#388E3C',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888'
};

const RegistrarEmpleado = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    // Datos básicos
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    rol: 'empleado', // Campo de rol agregado
    
    // Dirección
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    postalCode: '',
    
    // Datos laborales
    position: '',
    department: '',
    salary: '',
    
    // Contacto emergencia
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    
    // Archivo
    profilePicture: null as File | null
  });

useEffect(() => {
  const checkUserRole = async () => {
    try {
      console.log('🔍 Verificando rol via API...');
      const response = await fetch('/api/auth/check-role');
      
      if (response.ok) {
        const { role } = await response.json();
        console.log('🔐 Rol obtenido:', role);
        console.log('✅ Es admin?:', role === 'admin');
        setIsAdmin(role === 'admin');
      } else {
        console.log('❌ No autenticado o error en API');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('💥 Error verificando rol:', error);
      setIsAdmin(false);
    }
  };

  checkUserRole();
}, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePhotoCapture = (file: File) => {
    setFormData(prev => ({
      ...prev,
      profilePicture: file
    }));

    // Crear preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setFormData(prev => ({
      ...prev,
      profilePicture: null
    }));
    setPreviewImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.position) {
        toast.error('Por favor completa todos los campos obligatorios');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      // Crear FormData para enviar archivo
      const submitData = new FormData();
      
      // Agregar todos los campos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'profilePicture' && value !== null && value !== '') {
          submitData.append(key, value.toString());
        }
      });
      
      // Agregar usuario creador
      if (user?.id) {
        submitData.append('createdBy', user.id);
      }
      
      // Agregar archivo si existe
      if (formData.profilePicture) {
        submitData.append('profilePicture', formData.profilePicture);
      }

      const response = await fetch('/api/admin/create-employee', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'Usuario registrado exitosamente');
        router.push('/dashboard/admin/empleados/lista');
      } else {
        toast.error(result.error || 'Error al registrar usuario');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyles = {
    '& .MuiOutlinedInput-root': {
      color: darkProTokens.textPrimary,
      '& fieldset': { borderColor: darkProTokens.textDisabled },
      '&:hover fieldset': { borderColor: darkProTokens.primary },
      '&.Mui-focused fieldset': { borderColor: darkProTokens.primary }
    },
    '& .MuiInputLabel-root': { color: darkProTokens.textSecondary },
    '& .MuiInputLabel-root.Mui-focused': { color: darkProTokens.primary },
    '& .MuiFormHelperText-root': { color: darkProTokens.textDisabled }
  };

  return (
    <Box sx={{ 
      p: 3,
      minHeight: '100vh',
      background: darkProTokens.background,
      color: darkProTokens.textPrimary
    }}>
      <Typography variant="h4" gutterBottom sx={{ color: darkProTokens.primary, fontWeight: 700 }}>
        👨‍💼 Registrar Nuevo Usuario
      </Typography>

      <Paper elevation={3} sx={{ 
        p: 4, 
        mt: 3,
        background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel1}, ${darkProTokens.surfaceLevel2})`,
        border: `1px solid ${darkProTokens.primary}30`
      }}>
        <form onSubmit={handleSubmit}>
          {/* FOTO DE PERFIL */}
          <Card sx={{ 
            mb: 3,
            background: darkProTokens.surfaceLevel1,
            border: `1px solid ${darkProTokens.primary}20`
          }}>
            <CardContent>
              <PhotoCapture
                onPhotoCapture={handleProfilePhotoCapture}
                previewUrl={previewImage}
                onClearPhoto={clearPhoto}
                label="📸 Foto de Perfil"
              />
            </CardContent>
          </Card>

          {/* DATOS PERSONALES */}
          <Card sx={{ 
            mb: 3,
            background: darkProTokens.surfaceLevel1,
            border: `1px solid ${darkProTokens.primary}20`
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: darkProTokens.primary, fontWeight: 600 }}>
                📋 Datos Personales
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Nombre *"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Apellidos *"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Email *"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Contraseña *"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    helperText="El usuario puede cambiarla después"
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Ej: +52 844 123 4567"
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Fecha de Nacimiento"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Género"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    sx={textFieldStyles}
                  >
                    <MenuItem value="">Seleccionar</MenuItem>
                    <MenuItem value="masculino">Masculino</MenuItem>
                    <MenuItem value="femenino">Femenino</MenuItem>
                    <MenuItem value="otro">Otro</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Estado Civil"
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleInputChange}
                    sx={textFieldStyles}
                  >

                    <Grid size={{ xs: 12 }}>
  <Box sx={{ p: 2, bgcolor: 'red', color: 'white' }}>
    DEBUG: isAdmin = {isAdmin ? 'TRUE' : 'FALSE'}
  </Box>
</Grid>
                    <MenuItem value="">Seleccionar</MenuItem>
                    <MenuItem value="soltero">Soltero(a)</MenuItem>
                    <MenuItem value="casado">Casado(a)</MenuItem>
                    <MenuItem value="divorciado">Divorciado(a)</MenuItem>
                    <MenuItem value="viudo">Viudo(a)</MenuItem>
                    <MenuItem value="union_libre">Unión Libre</MenuItem>
                  </TextField>
                </Grid>
                
                {/* 🔐 SELECTOR DE ROL - SOLO PARA ADMINS */}
                {isAdmin && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      select
                      label="Rol de Usuario 🔐"
                      name="rol"
                      value={formData.rol}
                      onChange={handleInputChange}
                      sx={{
                        ...textFieldStyles,
                        '& .MuiOutlinedInput-root': {
                          ...textFieldStyles['& .MuiOutlinedInput-root'],
                          background: `linear-gradient(135deg, ${darkProTokens.primary}10, ${darkProTokens.primary}05)`,
                          border: `2px solid ${darkProTokens.primary}30`
                        }
                      }}
                      helperText="⚠️ Solo administradores pueden asignar rol de admin"
                    >
                      <MenuItem value="empleado">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          👨‍💼 Empleado
                        </Box>
                      </MenuItem>
                      <MenuItem value="admin">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          🔐 Administrador
                        </Box>
                      </MenuItem>
                    </TextField>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* DIRECCIÓN */}
          <Card sx={{ 
            mb: 3,
            background: darkProTokens.surfaceLevel1,
            border: `1px solid ${darkProTokens.primary}20`
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: darkProTokens.primary, fontWeight: 600 }}>
                🏠 Dirección
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    fullWidth
                    label="Calle"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    placeholder="Ej: Av. Francisco I. Madero"
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Número"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    placeholder="Ej: 123, 123-A"
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Colonia"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    placeholder="Ej: Centro"
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Ciudad"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Ej: Saltillo"
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Estado"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Ej: Coahuila"
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Código Postal"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder="Ej: 25000"
                    inputProps={{ maxLength: 5 }}
                    sx={textFieldStyles}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* DATOS LABORALES */}
          <Card sx={{ 
            mb: 3,
            background: darkProTokens.surfaceLevel1,
            border: `1px solid ${darkProTokens.primary}20`
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: darkProTokens.primary, fontWeight: 600 }}>
                💼 Datos Laborales
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Puesto *"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    required
                    sx={textFieldStyles}
                  >
                    <MenuItem value="">Seleccionar puesto</MenuItem>
                    <MenuItem value="Entrenador">Entrenador</MenuItem>
                    <MenuItem value="Recepcionista">Recepcionista</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Supervisor">Supervisor</MenuItem>
                    <MenuItem value="Limpieza">Limpieza</MenuItem>
                    <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                    <MenuItem value="Contador">Contador</MenuItem>
                    <MenuItem value="Vendedor">Vendedor</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Departamento"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    sx={textFieldStyles}
                  >
                    <MenuItem value="">Seleccionar departamento</MenuItem>
                    <MenuItem value="Operaciones">Operaciones</MenuItem>
                    <MenuItem value="Ventas">Ventas</MenuItem>
                    <MenuItem value="Administración">Administración</MenuItem>
                    <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                    <MenuItem value="Contabilidad">Contabilidad</MenuItem>
                    <MenuItem value="Atención al Cliente">Atención al Cliente</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Salario Mensual"
                    name="salary"
                    type="number"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="Ej: 15000"
                    InputProps={{
                      startAdornment: '$',
                    }}
                    helperText="Monto en pesos mexicanos"
                    sx={textFieldStyles}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* CONTACTO DE EMERGENCIA */}
          <Card sx={{ 
            mb: 3,
            background: darkProTokens.surfaceLevel1,
            border: `1px solid ${darkProTokens.primary}20`
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: darkProTokens.primary, fontWeight: 600 }}>
                🚨 Contacto de Emergencia
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Nombre del Contacto"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Ej: María González"
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Teléfono del Contacto"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleInputChange}
                    placeholder="Ej: +52 844 123 4567"
                    sx={textFieldStyles}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Parentesco"
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleInputChange}
                    sx={textFieldStyles}
                  >
                    <MenuItem value="">Seleccionar</MenuItem>
                    <MenuItem value="Madre">Madre</MenuItem>
                    <MenuItem value="Padre">Padre</MenuItem>
                    <MenuItem value="Esposo(a)">Esposo(a)</MenuItem>
                    <MenuItem value="Hermano(a)">Hermano(a)</MenuItem>
                    <MenuItem value="Hijo(a)">Hijo(a)</MenuItem>
                    <MenuItem value="Amigo(a)">Amigo(a)</MenuItem>
                    <MenuItem value="Otro familiar">Otro familiar</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* BOTONES */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'flex-end',
            pt: 2,
            borderTop: `1px solid ${darkProTokens.primary}20`
          }}>
            <Button 
              variant="outlined" 
              onClick={() => router.back()}
              disabled={loading}
              sx={{
                borderColor: darkProTokens.textDisabled,
                color: darkProTokens.textSecondary,
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: darkProTokens.primary,
                  color: darkProTokens.primary
                }
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} sx={{ color: darkProTokens.background }} />}
              sx={{
                backgroundColor: darkProTokens.primary,
                color: darkProTokens.background,
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: darkProTokens.primaryHover
                },
                '&:disabled': {
                  backgroundColor: darkProTokens.textDisabled,
                  color: darkProTokens.textPrimary
                }
              }}
            >
              {loading ? 'Registrando...' : `Registrar ${formData.rol === 'admin' ? 'Administrador' : 'Empleado'}`}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default RegistrarEmpleado;