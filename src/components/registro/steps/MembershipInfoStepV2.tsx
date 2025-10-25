// src/components/registro/steps/MembershipInfoStepV2.tsx
'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  FitnessCenter as FitnessCenterIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { colorTokens } from '@/theme';

interface MembershipInfoStepV2Props {
  register: any;
  errors: any;
  control: any;
  onNext: () => void;
  onBack: () => void;
}

export const MembershipInfoStepV2: React.FC<MembershipInfoStepV2Props> = ({
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
          <FitnessCenterIcon sx={{ fontSize: 32 }} />
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
            Información de Membresía
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colorTokens.textSecondary }}
          >
            Cuéntanos sobre tus objetivos de entrenamiento
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
        Esta información nos ayudará a brindarte una mejor experiencia.
        La selección y pago de tu plan se realizará después con el personal del gimnasio.
      </Alert>

      {/* Formulario */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* ¿Cómo te enteraste de nosotros? */}
        <Controller
          name="referredBy"
          control={control}
          rules={{ required: 'Este campo es obligatorio' }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="¿Cómo te enteraste de nosotros?"
              error={!!errors.referredBy}
              helperText={errors.referredBy?.message}
              required
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colorTokens.surfaceLevel1,
                  '& fieldset': {
                    borderColor: colorTokens.border
                  },
                  '&:hover fieldset': {
                    borderColor: colorTokens.brand
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colorTokens.brand
                  }
                },
                '& .MuiInputLabel-root': {
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': {
                    color: colorTokens.brand
                  }
                },
                '& .MuiInputBase-input': {
                  color: colorTokens.textPrimary
                }
              }}
            >
              <MenuItem value="">Selecciona una opción</MenuItem>
              <MenuItem value="Redes sociales">Redes sociales</MenuItem>
              <MenuItem value="Recomendación">Recomendación</MenuItem>
              <MenuItem value="Google">Google</MenuItem>
              <MenuItem value="Volantes">Volantes</MenuItem>
              <MenuItem value="Pasé por el lugar">Pasé por el lugar</MenuItem>
              <MenuItem value="Otro">Otro</MenuItem>
            </TextField>
          )}
        />

        {/* Principal motivación para entrenar */}
        <Controller
          name="mainMotivation"
          control={control}
          rules={{ required: 'Este campo es obligatorio' }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Principal motivación para entrenar"
              error={!!errors.mainMotivation}
              helperText={errors.mainMotivation?.message}
              required
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colorTokens.surfaceLevel1,
                  '& fieldset': {
                    borderColor: colorTokens.border
                  },
                  '&:hover fieldset': {
                    borderColor: colorTokens.brand
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colorTokens.brand
                  }
                },
                '& .MuiInputLabel-root': {
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': {
                    color: colorTokens.brand
                  }
                },
                '& .MuiInputBase-input': {
                  color: colorTokens.textPrimary
                }
              }}
            >
              <MenuItem value="">Selecciona una opción</MenuItem>
              <MenuItem value="Bajar de peso">Bajar de peso</MenuItem>
              <MenuItem value="Aumentar masa muscular">Aumentar masa muscular</MenuItem>
              <MenuItem value="Mejorar salud">Mejorar salud</MenuItem>
              <MenuItem value="Rehabilitación">Rehabilitación</MenuItem>
              <MenuItem value="Recreación">Recreación</MenuItem>
              <MenuItem value="Competencia">Competencia</MenuItem>
              <MenuItem value="Otro">Otro</MenuItem>
            </TextField>
          )}
        />

        {/* Nivel de entrenamiento actual */}
        <Controller
          name="trainingLevel"
          control={control}
          rules={{ required: 'Este campo es obligatorio' }}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Nivel de entrenamiento actual"
              error={!!errors.trainingLevel}
              helperText={errors.trainingLevel?.message}
              required
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colorTokens.surfaceLevel1,
                  '& fieldset': {
                    borderColor: colorTokens.border
                  },
                  '&:hover fieldset': {
                    borderColor: colorTokens.brand
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: colorTokens.brand
                  }
                },
                '& .MuiInputLabel-root': {
                  color: colorTokens.textSecondary,
                  '&.Mui-focused': {
                    color: colorTokens.brand
                  }
                },
                '& .MuiInputBase-input': {
                  color: colorTokens.textPrimary
                }
              }}
            >
              <MenuItem value="">Selecciona una opción</MenuItem>
              <MenuItem value="Principiante">Principiante (menos de 3 meses)</MenuItem>
              <MenuItem value="Intermedio">Intermedio (3-12 meses)</MenuItem>
              <MenuItem value="Avanzado">Avanzado (más de 12 meses)</MenuItem>
              <MenuItem value="Atleta">Atleta competitivo</MenuItem>
            </TextField>
          )}
        />

        {/* Checkbox para recibir planes */}
        <Controller
          name="receivePlans"
          control={control}
          defaultValue={false}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  {...field}
                  checked={field.value || false}
                  sx={{
                    color: colorTokens.textMuted,
                    '&.Mui-checked': {
                      color: colorTokens.brand
                    }
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                  Deseo recibir planes de nutrición y entrenamiento
                </Typography>
              }
            />
          )}
        />
      </Box>

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
            '&:hover': {
              bgcolor: colorTokens.brandHover,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 24px ${colorTokens.glow}`
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
