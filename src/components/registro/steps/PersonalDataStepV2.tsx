// src/components/registro/steps/PersonalDataStepV2.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  IconButton,
  Tooltip,
  InputAdornment,
  Alert,
  Divider,
  Avatar
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  Visibility,
  VisibilityOff,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon
} from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { colorTokens } from '@/theme';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const PasswordStrengthMeter = dynamic(
  () => import('@/components/PasswordStrengthMeter'),
  { ssr: false }
);

interface PersonalDataStepV2Props {
  register: any;
  errors: any;
  control: any;
  watch: any;
  setValue: any;
  getCurrentMexicoDate: () => string;
  validateAge: (birthDate: string) => boolean | string;
  handleProfilePhotoCapture: (file: File) => void;
  previewUrl: string | null;
  clearPhoto: () => void;
  onNext: () => void;
}

export const PersonalDataStepV2: React.FC<PersonalDataStepV2Props> = ({
  register,
  errors,
  control,
  watch,
  setValue,
  getCurrentMexicoDate,
  validateAge,
  handleProfilePhotoCapture,
  previewUrl,
  clearPhoto,
  onNext
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const password = watch('password');

  // Initialize Google Places Autocomplete
  useEffect(() => {
    // Check if Google Maps script is loaded
    if (typeof window !== 'undefined' && window.google && addressInputRef.current) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          componentRestrictions: { country: 'mx' },
          fields: ['address_components', 'formatted_address', 'geometry'],
          types: ['address']
        }
      );

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (place.formatted_address) {
          setValue('address', place.formatted_address, { shouldValidate: true });
        }
      });

      setAutocomplete(autocompleteInstance);
    }
  }, [setValue]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleProfilePhotoCapture(file);
    }
  };

  return (
    <Paper
      elevation={0}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        p: { xs: 3, md: 4 },
        bgcolor: colorTokens.surfaceLevel2,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: colorTokens.brand,
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          📋 Datos Personales
        </Typography>
        <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
          Completa tu información básica para crear tu cuenta
        </Typography>
      </Box>

      {/* Photo Upload Section */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="profile-photo-upload"
          type="file"
          capture="environment"
          onChange={handlePhotoChange}
        />
        <label htmlFor="profile-photo-upload">
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              cursor: 'pointer',
              '&:hover .overlay': {
                opacity: 1
              }
            }}
          >
            <Avatar
              src={previewUrl || undefined}
              sx={{
                width: 120,
                height: 120,
                bgcolor: colorTokens.neutral600,
                border: `3px solid ${colorTokens.brand}`,
                fontSize: '3rem'
              }}
            >
              {!previewUrl && <PhotoCameraIcon sx={{ fontSize: '3rem' }} />}
            </Avatar>
            <Box
              className="overlay"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                bgcolor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.3s'
              }}
            >
              <PhotoCameraIcon sx={{ color: colorTokens.brand, fontSize: '2rem' }} />
            </Box>
          </Box>
        </label>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Tooltip title="Esta foto aparecerá en tu credencial y expediente" arrow>
            <IconButton size="small" sx={{ color: colorTokens.info }}>
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {previewUrl && (
            <Tooltip title="Eliminar foto" arrow>
              <IconButton
                size="small"
                onClick={clearPhoto}
                sx={{
                  color: colorTokens.danger,
                  '&:hover': { bgcolor: `${colorTokens.danger}20` }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {errors.profilePhoto && (
          <Typography variant="caption" sx={{ color: colorTokens.danger, mt: 1, display: 'block' }}>
            {errors.profilePhoto.message}
          </Typography>
        )}
      </Box>

      <Divider sx={{ my: 3, borderColor: colorTokens.border }} />

      {/* Personal Information */}
      <Grid container spacing={3}>
        {/* Name Fields */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Nombre(s)"
            placeholder="Escribe tu nombre"
            {...register('firstName', {
              required: 'El nombre es requerido',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' }
            })}
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Tu nombre como aparece en tu identificación oficial" arrow>
                    <InfoIcon sx={{ color: colorTokens.textMuted, fontSize: 20 }} />
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Apellidos"
            placeholder="Escribe tus apellidos"
            {...register('lastName', {
              required: 'Los apellidos son requeridos',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' }
            })}
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
          />
        </Grid>

        {/* Birth Date */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type="date"
            label="Fecha de Nacimiento"
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: getCurrentMexicoDate()
            }}
            {...register('birthDate', {
              required: 'La fecha de nacimiento es requerida',
              validate: validateAge
            })}
            error={!!errors.birthDate}
            helperText={errors.birthDate?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CakeIcon sx={{ color: colorTokens.brand }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Debes ser mayor de 16 años para registrarte" arrow>
                    <InfoIcon sx={{ color: colorTokens.textMuted, fontSize: 20 }} />
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* Phone */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="phone"
            control={control}
            rules={{
              required: 'El teléfono es requerido',
              minLength: { value: 10, message: 'Teléfono inválido' }
            }}
            render={({ field }) => (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PhoneIcon sx={{ color: colorTokens.brand, fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Teléfono
                  </Typography>
                  <Tooltip title="Número de contacto principal" arrow>
                    <InfoIcon sx={{ color: colorTokens.textMuted, fontSize: 18 }} />
                  </Tooltip>
                </Box>
                <PhoneInput
                  {...field}
                  country={'mx'}
                  onlyCountries={['mx']}
                  placeholder="(000) 000-0000"
                  containerStyle={{ width: '100%' }}
                  inputStyle={{
                    width: '100%',
                    height: '56px',
                    backgroundColor: colorTokens.neutral300,
                    border: errors.phone
                      ? `1px solid ${colorTokens.danger}`
                      : `1px solid ${colorTokens.border}`,
                    borderRadius: '12px',
                    color: colorTokens.textPrimary,
                    fontSize: '1rem',
                    paddingLeft: '48px'
                  }}
                  buttonStyle={{
                    backgroundColor: colorTokens.neutral400,
                    border: 'none',
                    borderRadius: '12px 0 0 12px'
                  }}
                  dropdownStyle={{
                    backgroundColor: colorTokens.neutral300,
                    color: colorTokens.textPrimary
                  }}
                />
                {errors.phone && (
                  <Typography variant="caption" sx={{ color: colorTokens.danger, mt: 0.5, display: 'block' }}>
                    {errors.phone.message}
                  </Typography>
                )}
              </Box>
            )}
          />
        </Grid>

        {/* Email */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            type="email"
            label="Correo Electrónico"
            placeholder="tu@correo.com"
            {...register('email', {
              required: 'El correo es requerido',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Correo electrónico inválido'
              }
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: colorTokens.brand }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Usarás este correo para iniciar sesión" arrow>
                    <InfoIcon sx={{ color: colorTokens.textMuted, fontSize: 20 }} />
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* Address with Google Places */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Dirección"
            placeholder="Comienza a escribir tu dirección..."
            inputRef={addressInputRef}
            {...register('address', {
              required: 'La dirección es requerida'
            })}
            error={!!errors.address}
            helperText={errors.address?.message || 'Comienza a escribir y selecciona de las sugerencias'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationIcon sx={{ color: colorTokens.brand }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Usa el autocompletado de Google para mayor precisión" arrow>
                    <InfoIcon sx={{ color: colorTokens.textMuted, fontSize: 20 }} />
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* Password Fields */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Contraseña"
            placeholder="Crea una contraseña segura"
            {...register('password', {
              required: 'La contraseña es requerida',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' }
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: colorTokens.textSecondary }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirmar Contraseña"
            placeholder="Repite tu contraseña"
            {...register('confirmPassword', {
              required: 'Confirma tu contraseña',
              validate: (value: string) =>
                value === password || 'Las contraseñas no coinciden'
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                    sx={{ color: colorTokens.textSecondary }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        {/* Password Strength Meter */}
        {password && (
          <Grid size={{ xs: 12 }}>
            <PasswordStrengthMeter password={password} />
          </Grid>
        )}
      </Grid>

      {/* Navigation Button */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          onClick={onNext}
          sx={{
            bgcolor: colorTokens.brand,
            color: colorTokens.black,
            fontWeight: 700,
            px: 4,
            py: 1.5,
            '&:hover': {
              bgcolor: colorTokens.brandHover,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 20px ${colorTokens.glow}`
            }
          }}
        >
          Continuar
        </Button>
      </Box>

      {/* Info Alert */}
      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          mt: 3,
          bgcolor: `${colorTokens.info}15`,
          border: `1px solid ${colorTokens.info}40`,
          '& .MuiAlert-icon': { color: colorTokens.info }
        }}
      >
        <Typography variant="body2">
          Todos tus datos están protegidos y se usarán únicamente para tu registro en el gimnasio.
        </Typography>
      </Alert>
    </Paper>
  );
};
