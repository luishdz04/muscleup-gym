"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  CardContent,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  useTheme,
  useMediaQuery
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useRouter } from 'next/navigation';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';

import PhotoCapture from '@/components/registro/PhotoCapture';
import { colorTokens } from '@/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useHydrated } from '@/hooks/useHydrated';
import { validateFileSimple } from '@/utils/fileValidation';
import { getTodayInMexico } from '@/utils/dateUtils';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

type EmployeeRegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  rol: 'empleado' | 'admin';
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  position: string;
  department: string;
  salary: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
};

const INITIAL_FORM: EmployeeRegistrationData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  birthDate: '',
  gender: '',
  maritalStatus: '',
  rol: 'empleado',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  postalCode: '',
  position: '',
  department: '',
  salary: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: ''
};

const RegistrarEmpleado = () => {
  const router = useRouter();
  const theme = useTheme();
  const hydrated = useHydrated();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { toast } = useNotifications();
  const { getCurrentUser } = useUserTracking();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmployeeRegistrationData>(INITIAL_FORM);
  const [birthDate, setBirthDate] = useState<Dayjs | null>(null);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const previewUrlRef = useRef<string | null>(null);

  const inputStyles = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      bgcolor: colorTokens.surfaceLevel2,
      color: colorTokens.neutral1200,
      '& fieldset': {
        borderColor: colorTokens.neutral500,
        borderWidth: '2px'
      },
      '&:hover fieldset': {
        borderColor: colorTokens.brand
      },
      '&.Mui-focused fieldset': {
        borderColor: colorTokens.brand,
        boxShadow: `0 0 0 3px ${colorTokens.brand}40`
      },
      '&.Mui-error fieldset': {
        borderColor: colorTokens.danger
      }
    },
    '& .MuiInputLabel-root': {
      color: colorTokens.neutral900,
      '&.Mui-focused': {
        color: colorTokens.brand
      },
      '&.Mui-error': {
        color: colorTokens.danger
      }
    },
    '& .MuiFormHelperText-root': {
      color: colorTokens.danger,
      fontWeight: 500
    }
  }), []);

  const selectStyles = useMemo(() => ({
    bgcolor: colorTokens.surfaceLevel2,
    color: colorTokens.neutral1200,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: colorTokens.neutral500,
      borderWidth: '2px'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: colorTokens.brand
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: colorTokens.brand,
      boxShadow: `0 0 0 3px ${colorTokens.brand}40`
    }
  }), []);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      if (!hydrated) return;
      try {
        const userId = await getCurrentUser();
        if (!userId || !isMounted) return;
        setCreatorId(userId);

        const { data, error } = await supabase
          .from('Users')
          .select('rol')
          .eq('id', userId)
          .single();

        if (!isMounted) return;
        if (error) {
          console.warn('Error obteniendo rol del usuario actual:', error);
          return;
        }

        setIsAdmin(data?.rol === 'admin');
      } catch (err) {
        console.error('Error determinando rol actual:', err);
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [getCurrentUser, hydrated, supabase]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const removeError = useCallback((field: string | string[]) => {
    setErrors(prev => {
      const fields = Array.isArray(field) ? field : [field];
      let changed = false;
      const next = { ...prev };
      fields.forEach(name => {
        if (next[name]) {
          delete next[name];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    if (!name) return;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    removeError(name);
  }, [removeError]);

  const handleSelectChange = useCallback((event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    if (!name) return;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    removeError(name);
  }, [removeError]);

  const handleBirthDateChange = useCallback((value: Dayjs | null) => {
    const nextValue = value ?? null;
    setBirthDate(nextValue);
    setFormData(prev => ({
      ...prev,
      birthDate: nextValue ? nextValue.format('YYYY-MM-DD') : ''
    }));
    removeError('birthDate');
  }, [removeError]);

  const handleProfilePhotoCapture = useCallback((file: File) => {
    const validation = validateFileSimple(file, 'image');
    if (!validation.isValid) {
      toast.error(validation.error || 'Archivo de imagen inválido');
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setProfilePicture(file);
    setPreviewUrl(objectUrl);
    removeError('profilePicture');
  }, [removeError, toast]);

  const handleClearPhoto = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setProfilePicture(null);
    setPreviewUrl(null);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    if (!formData.lastName.trim()) newErrors.lastName = 'Los apellidos son obligatorios';

    if (!formData.email.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'El email no es válido';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.position) {
      newErrors.position = 'Selecciona un puesto';
    }

    if (formData.postalCode && !/^\d{5}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'El código postal debe tener 5 dígitos';
    }

    if (formData.salary && Number(formData.salary) < 0) {
      newErrors.salary = 'El salario debe ser mayor o igual a 0';
    }

    if (birthDate && birthDate.isAfter(dayjs(getTodayInMexico()))) {
      newErrors.birthDate = 'La fecha de nacimiento no puede ser futura';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [birthDate, formData]);

  const buildFormData = useCallback(() => {
    const submitData = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        submitData.append(key, value);
      }
    });

    if (creatorId) {
      submitData.append('createdBy', creatorId);
    }

    if (profilePicture) {
      submitData.append('profilePicture', profilePicture);
    }

    return submitData;
  }, [creatorId, formData, profilePicture]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    if (!validateForm()) {
      toast.error('Revisa los campos marcados en rojo');
      return;
    }

    const toastId = toast.loading('Registrando usuario...');
    setLoading(true);

    try {
      const submitData = buildFormData();

      const response = await fetch('/api/admin/create-employee', {
        method: 'POST',
        body: submitData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al registrar usuario');
      }

      toast.success(result.message || 'Usuario registrado exitosamente');

      setFormData(INITIAL_FORM);
      setBirthDate(null);
      handleClearPhoto();

      router.push('/dashboard/admin/empleados/lista');
    } catch (error: any) {
      console.error('Error registrando empleado:', error);
      toast.error(error?.message || 'Error de conexión');
    } finally {
      toast.dismiss(toastId);
      setLoading(false);
    }
  }, [buildFormData, handleClearPhoto, loading, router, toast, validateForm]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  if (!hydrated) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `radial-gradient(circle at top, ${colorTokens.surfaceLevel3} 0%, ${colorTokens.neutral0} 60%)`,
        color: colorTokens.neutral1200,
        p: { xs: 2, sm: 3, md: 4 }
      }}
    >
      <Box sx={{ maxWidth: 1080, mx: 'auto' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colorTokens.brand,
            mb: { xs: 1.5, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            👨‍💼 Registrar Nuevo Usuario
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            👨‍💼 Nuevo Usuario
          </Box>
        </Typography>
        <Typography variant="body1" sx={{
          color: colorTokens.neutral900,
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '0.875rem', sm: '1rem' },
          display: { xs: 'none', sm: 'block' }
        }}>
          Completa la información para agregar nuevos colaboradores o administradores al sistema.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            background: `linear-gradient(135deg, ${colorTokens.surfaceLevel1}, ${colorTokens.surfaceLevel2})`,
            border: `1px solid ${colorTokens.neutral400}60`,
            boxShadow: `0 12px 30px ${colorTokens.shadow}`,
            borderRadius: 4
          }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <Card
              sx={{
                mb: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `1px solid ${colorTokens.brand}30`
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 600, mb: 2 }}>
                  📸 Foto de Perfil
                </Typography>
                <PhotoCapture
                  inputId="employee-registration-photo"
                  label="Capturar o subir foto"
                  tooltip="Utiliza la cámara o carga una imagen existente para la credencial del equipo"
                  previewUrl={previewUrl}
                  onPhotoCapture={handleProfilePhotoCapture}
                  onClearPhoto={handleClearPhoto}
                  errorMessage={errors.profilePicture}
                />
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `1px solid ${colorTokens.neutral500}30`
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: colorTokens.neutral1100, fontWeight: 600, mb: 2 }}>
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
                      sx={inputStyles}
                      error={!!errors.firstName}
                      helperText={errors.firstName}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Apellidos *"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      sx={inputStyles}
                      error={!!errors.lastName}
                      helperText={errors.lastName}
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
                      sx={inputStyles}
                      error={!!errors.email}
                      helperText={errors.email}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Contraseña temporal *"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      sx={inputStyles}
                      helperText={errors.password || 'El colaborador podrá cambiarla después'}
                      error={!!errors.password}
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
                      sx={inputStyles}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label="Fecha de nacimiento"
                        value={birthDate}
                        onChange={(value) => handleBirthDateChange(value as Dayjs | null)}
                        maxDate={dayjs(getTodayInMexico())}
                        format="DD/MM/YYYY"
                        slotProps={{
                          textField: {
                            sx: inputStyles,
                            fullWidth: true,
                            error: !!errors.birthDate,
                            helperText: errors.birthDate
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth error={!!errors.gender} sx={{ ...selectStyles, borderRadius: 2 }}>
                      <InputLabel>Género</InputLabel>
                      <Select
                        name="gender"
                        value={formData.gender}
                        label="Género"
                        onChange={handleSelectChange}
                        sx={selectStyles}
                      >
                        <MenuItem value="">Seleccionar</MenuItem>
                        <MenuItem value="masculino">Masculino</MenuItem>
                        <MenuItem value="femenino">Femenino</MenuItem>
                        <MenuItem value="otro">Otro</MenuItem>
                      </Select>
                      {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl fullWidth error={!!errors.maritalStatus} sx={{ ...selectStyles, borderRadius: 2 }}>
                      <InputLabel>Estado civil</InputLabel>
                      <Select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        label="Estado civil"
                        onChange={handleSelectChange}
                        sx={selectStyles}
                      >
                        <MenuItem value="">Seleccionar</MenuItem>
                        <MenuItem value="soltero">Soltero(a)</MenuItem>
                        <MenuItem value="casado">Casado(a)</MenuItem>
                        <MenuItem value="divorciado">Divorciado(a)</MenuItem>
                        <MenuItem value="viudo">Viudo(a)</MenuItem>
                        <MenuItem value="union_libre">Unión libre</MenuItem>
                      </Select>
                      {errors.maritalStatus && <FormHelperText>{errors.maritalStatus}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  {isAdmin && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth sx={{ ...selectStyles, borderRadius: 2 }}>
                        <InputLabel>Rol en plataforma</InputLabel>
                        <Select
                          name="rol"
                          value={formData.rol}
                          label="Rol en plataforma"
                          onChange={handleSelectChange}
                          sx={{
                            ...selectStyles,
                            bgcolor: `${colorTokens.brand}10`,
                            border: `1px solid ${colorTokens.brand}55`
                          }}
                        >
                          <MenuItem value="empleado">👨‍💼 Empleado</MenuItem>
                          <MenuItem value="admin">🛡️ Administrador</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `1px solid ${colorTokens.neutral500}30`
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: colorTokens.neutral1100, fontWeight: 600, mb: 2 }}>
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
                      sx={inputStyles}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Número"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      placeholder="Ej: 125-A"
                      sx={inputStyles}
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
                      sx={inputStyles}
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
                      sx={inputStyles}
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
                      sx={inputStyles}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Código postal"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      placeholder="Ej: 25000"
                      inputProps={{ maxLength: 5 }}
                      sx={inputStyles}
                      error={!!errors.postalCode}
                      helperText={errors.postalCode}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `1px solid ${colorTokens.neutral500}30`
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: colorTokens.neutral1100, fontWeight: 600, mb: 2 }}>
                  💼 Información Laboral
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth error={!!errors.position} sx={{ ...selectStyles, borderRadius: 2 }}>
                      <InputLabel>Puesto *</InputLabel>
                      <Select
                        name="position"
                        value={formData.position}
                        label="Puesto"
                        onChange={handleSelectChange}
                        sx={selectStyles}
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
                      </Select>
                      {errors.position && <FormHelperText>{errors.position}</FormHelperText>}
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth sx={{ ...selectStyles, borderRadius: 2 }}>
                      <InputLabel>Departamento</InputLabel>
                      <Select
                        name="department"
                        value={formData.department}
                        label="Departamento"
                        onChange={handleSelectChange}
                        sx={selectStyles}
                      >
                        <MenuItem value="">Seleccionar departamento</MenuItem>
                        <MenuItem value="Operaciones">Operaciones</MenuItem>
                        <MenuItem value="Ventas">Ventas</MenuItem>
                        <MenuItem value="Administración">Administración</MenuItem>
                        <MenuItem value="Mantenimiento">Mantenimiento</MenuItem>
                        <MenuItem value="Contabilidad">Contabilidad</MenuItem>
                        <MenuItem value="Atención al Cliente">Atención al Cliente</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Salario mensual"
                      name="salary"
                      type="number"
                      value={formData.salary}
                      onChange={handleInputChange}
                      placeholder="Ej: 15000"
                      sx={inputStyles}
                      error={!!errors.salary}
                      helperText={errors.salary || 'Monto en pesos mexicanos'}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card
              sx={{
                mb: 3,
                background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
                border: `1px solid ${colorTokens.neutral500}30`
              }}
            >
              <CardContent>
                <Typography variant="h6" sx={{ color: colorTokens.neutral1100, fontWeight: 600, mb: 2 }}>
                  🚨 Contacto de Emergencia
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Nombre del contacto"
                      name="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={handleInputChange}
                      placeholder="Ej: María González"
                      sx={inputStyles}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Teléfono del contacto"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone}
                      onChange={handleInputChange}
                      placeholder="Ej: +52 844 123 4567"
                      sx={inputStyles}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth sx={{ ...selectStyles, borderRadius: 2 }}>
                      <InputLabel>Parentesco</InputLabel>
                      <Select
                        name="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        label="Parentesco"
                        onChange={handleSelectChange}
                        sx={selectStyles}
                      >
                        <MenuItem value="">Seleccionar</MenuItem>
                        <MenuItem value="Madre">Madre</MenuItem>
                        <MenuItem value="Padre">Padre</MenuItem>
                        <MenuItem value="Esposo(a)">Esposo(a)</MenuItem>
                        <MenuItem value="Hermano(a)">Hermano(a)</MenuItem>
                        <MenuItem value="Hijo(a)">Hijo(a)</MenuItem>
                        <MenuItem value="Amigo(a)">Amigo(a)</MenuItem>
                        <MenuItem value="Otro familiar">Otro familiar</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'flex-end',
                pt: 3,
                borderTop: `1px solid ${colorTokens.neutral500}40`
              }}
            >
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
                sx={{
                  borderColor: colorTokens.neutral600,
                  color: colorTokens.neutral1100,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    borderColor: colorTokens.brand,
                    color: colorTokens.brand
                  }
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} sx={{ color: colorTokens.textOnBrand }} /> : undefined}
                sx={{
                  backgroundColor: colorTokens.brand,
                  color: colorTokens.textOnBrand,
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: colorTokens.brandHover
                  },
                  '&:disabled': {
                    backgroundColor: colorTokens.neutral500,
                    color: colorTokens.neutral1200
                  }
                }}
              >
                {loading ? 'Registrando…' : formData.rol === 'admin' ? 'Registrar administrador' : 'Registrar empleado'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Box>
  );
};

export default RegistrarEmpleado;