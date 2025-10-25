// src/components/registro/steps/EmergencyContactStepV2.tsx
'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  Tooltip,
  IconButton,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  ContactEmergency as EmergencyIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { colorTokens } from '@/theme';

interface EmergencyContactStepV2Props {
  register: any;
  errors: any;
  control: any;
  onNext: () => void;
  onBack: () => void;
}

export const EmergencyContactStepV2: React.FC<EmergencyContactStepV2Props> = ({
  register,
  errors,
  control,
  onNext,
  onBack
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 3, md: 5 },
        bgcolor: colorTokens.surfaceLevel2,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header con decoración */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, ${colorTokens.brand}15 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />

      {/* Título de la sección */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: `${colorTokens.brand}20`,
            color: colorTokens.brand
          }}
        >
          <EmergencyIcon sx={{ fontSize: 32 }} />
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: colorTokens.textPrimary,
              mb: 0.5
            }}
          >
            Contacto de Emergencia
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colorTokens.textSecondary }}
          >
            Por tu seguridad, necesitamos los datos de una persona de confianza
          </Typography>
        </Box>
      </Box>

      {/* Alert informativo */}
      <Alert
        severity="info"
        icon={<InfoIcon />}
        sx={{
          mb: 4,
          bgcolor: `${colorTokens.info}15`,
          color: colorTokens.textPrimary,
          border: `1px solid ${colorTokens.info}30`,
          '& .MuiAlert-icon': {
            color: colorTokens.info
          }
        }}
      >
        Esta persona será contactada en caso de emergencia durante tu entrenamiento. 
        Asegúrate de que esté disponible y al tanto de tu actividad física.
      </Alert>

      {/* Formulario */}
      <Grid container spacing={3}>
        {/* Nombre del contacto */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Tooltip
            title="Nombre completo de tu contacto de emergencia"
            placement="top"
            arrow
          >
            <TextField
              {...register('emergencyContact.name', {
                required: 'El nombre del contacto es obligatorio',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' }
              })}
              fullWidth
              label="Nombre Completo"
              placeholder="Ej: María González López"
              error={!!errors.emergencyContact?.name}
              helperText={errors.emergencyContact?.name?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: colorTokens.brand }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end">
                      <InfoIcon sx={{ fontSize: 18, color: colorTokens.textMuted }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colorTokens.surfaceLevel1,
                  '&:hover': {
                    bgcolor: colorTokens.surfaceLevel2
                  },
                  '&.Mui-focused': {
                    bgcolor: colorTokens.surfaceLevel2,
                    '& fieldset': {
                      borderColor: colorTokens.brand,
                      borderWidth: 2
                    }
                  }
                }
              }}
            />
          </Tooltip>
        </Grid>

        {/* Relación */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Tooltip
            title="¿Qué relación tienes con esta persona?"
            placement="top"
            arrow
          >
            <TextField
              {...register('emergencyContact.relationship', {
                required: 'La relación es obligatoria'
              })}
              fullWidth
              label="Relación"
              placeholder="Ej: Madre, Hermano, Esposo(a)"
              error={!!errors.emergencyContact?.relationship}
              helperText={errors.emergencyContact?.relationship?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HomeIcon sx={{ color: colorTokens.brand }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end">
                      <InfoIcon sx={{ fontSize: 18, color: colorTokens.textMuted }} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colorTokens.surfaceLevel1,
                  '&:hover': {
                    bgcolor: colorTokens.surfaceLevel2
                  },
                  '&.Mui-focused': {
                    bgcolor: colorTokens.surfaceLevel2,
                    '& fieldset': {
                      borderColor: colorTokens.brand,
                      borderWidth: 2
                    }
                  }
                }
              }}
            />
          </Tooltip>
        </Grid>

        {/* Teléfono 1 */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Tooltip
            title="Número principal de tu contacto de emergencia"
            placement="top"
            arrow
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  color: colorTokens.textSecondary,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <PhoneIcon sx={{ fontSize: 18, color: colorTokens.brand }} />
                Teléfono Principal *
              </Typography>
              <Controller
                name="emergencyContact.phone1"
                control={control}
                rules={{
                  required: 'El teléfono del contacto es obligatorio',
                  minLength: { value: 10, message: 'Teléfono inválido' }
                }}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    defaultCountry="mx"
                    placeholder="Ingresa el teléfono"
                    inputStyle={{
                      width: '100%',
                      height: '56px',
                      fontSize: '16px',
                      backgroundColor: colorTokens.surfaceLevel1,
                      border: errors.emergencyContact?.phone1
                        ? `1px solid ${colorTokens.error}`
                        : `1px solid ${colorTokens.border}`,
                      borderRadius: '8px',
                      color: colorTokens.textPrimary
                    }}
                  />
                )}
              />
              {errors.emergencyContact?.phone1 && (
                <Typography
                  variant="caption"
                  sx={{ color: colorTokens.error, mt: 0.5, display: 'block' }}
                >
                  {errors.emergencyContact?.phone1?.message}
                </Typography>
              )}
            </Box>
          </Tooltip>
        </Grid>

        {/* Teléfono 2 (opcional) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Tooltip
            title="Número alternativo (opcional)"
            placement="top"
            arrow
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  mb: 1,
                  color: colorTokens.textSecondary,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <PhoneIcon sx={{ fontSize: 18, color: colorTokens.textMuted }} />
                Teléfono Alternativo (Opcional)
              </Typography>
              <Controller
                name="emergencyContact.phone2"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    defaultCountry="mx"
                    placeholder="Teléfono adicional"
                    inputStyle={{
                      width: '100%',
                      height: '56px',
                      fontSize: '16px',
                      backgroundColor: colorTokens.surfaceLevel1,
                      border: `1px solid ${colorTokens.border}`,
                      borderRadius: '8px',
                      color: colorTokens.textPrimary
                    }}
                  />
                )}
              />
            </Box>
          </Tooltip>
        </Grid>
      </Grid>

      {/* Botones de navegación */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 5,
          pt: 3,
          borderTop: `1px solid ${colorTokens.border}`
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{
            borderColor: colorTokens.border,
            color: colorTokens.textPrimary,
            px: 4,
            py: 1.5,
            '&:hover': {
              borderColor: colorTokens.brand,
              bgcolor: `${colorTokens.brand}10`
            }
          }}
        >
          Anterior
        </Button>

        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={onNext}
          sx={{
            bgcolor: colorTokens.brand,
            color: colorTokens.black,
            px: 4,
            py: 1.5,
            fontWeight: 700,
            boxShadow: `0 4px 14px ${colorTokens.glow}`,
            '&:hover': {
              bgcolor: colorTokens.brandHover,
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 20px ${colorTokens.glow}`
            },
            transition: 'all 0.3s ease'
          }}
        >
          Siguiente
        </Button>
      </Box>
    </Paper>
  );
};
