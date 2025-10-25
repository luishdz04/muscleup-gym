// src/components/registro/steps/MembershipInfoStepV2.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  FitnessCenter as FitnessCenterIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Controller } from 'react-hook-form';
import { colorTokens } from '@/theme';
import { createBrowserClient } from '@supabase/ssr';

interface MembershipInfoStepV2Props {
  register: any;
  errors: any;
  control: any;
  onNext: () => void;
  onBack: () => void;
}

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  description: string;
  features: string[];
  is_active: boolean;
  recommended?: boolean;
}

export const MembershipInfoStepV2: React.FC<MembershipInfoStepV2Props> = ({
  register,
  errors,
  control,
  onNext,
  onBack
}) => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabase
        .from('membership_types')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      setPlans(data || []);
    } catch (error) {
      console.error('Error al cargar planes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (days: number) => {
    if (days === 30) return '1 Mes';
    if (days === 90) return '3 Meses';
    if (days === 180) return '6 Meses';
    if (days === 365) return '1 Año';
    return `${days} días`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

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
            Selecciona tu Membresía
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colorTokens.textSecondary }}
          >
            Elige el plan que mejor se adapte a tus objetivos
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
        Todos nuestros planes incluyen acceso completo al gimnasio y asesoría inicial gratuita.
        Puedes cambiar o renovar tu plan en cualquier momento.
      </Alert>

      {/* Loading */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: colorTokens.brand }} />
        </Box>
      ) : (
        <Controller
          name="membershipTypeId"
          control={control}
          rules={{ required: 'Debes seleccionar un plan de membresía' }}
          render={({ field }) => (
            <RadioGroup
              {...field}
              value={field.value || selectedPlan}
              onChange={(e) => {
                field.onChange(e);
                setSelectedPlan(e.target.value);
              }}
            >
              <Grid container spacing={3}>
                {plans.map((plan) => (
                  <Grid size={{ xs: 12, md: 6 }} key={plan.id}>
                    <Card
                      sx={{
                        position: 'relative',
                        cursor: 'pointer',
                        border: `2px solid ${
                          field.value === plan.id || selectedPlan === plan.id
                            ? colorTokens.brand
                            : colorTokens.border
                        }`,
                        bgcolor:
                          field.value === plan.id || selectedPlan === plan.id
                            ? `${colorTokens.brand}05`
                            : colorTokens.surfaceLevel1,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: colorTokens.brand,
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 24px ${colorTokens.glow}`
                        },
                        height: '100%'
                      }}
                      onClick={() => {
                        field.onChange(plan.id);
                        setSelectedPlan(plan.id);
                      }}
                    >
                      {/* Badge recomendado */}
                      {plan.recommended && (
                        <Chip
                          label="Recomendado"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            bgcolor: colorTokens.brand,
                            color: colorTokens.black,
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}
                        />
                      )}

                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <FormControlLabel
                            value={plan.id}
                            control={
                              <Radio
                                sx={{
                                  color: colorTokens.textMuted,
                                  '&.Mui-checked': {
                                    color: colorTokens.brand
                                  }
                                }}
                              />
                            }
                            label=""
                            sx={{ m: 0, mr: 2 }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: colorTokens.textPrimary,
                                mb: 0.5
                              }}
                            >
                              {plan.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: colorTokens.textSecondary, mb: 2 }}
                            >
                              {plan.description}
                            </Typography>
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2, borderColor: colorTokens.border }} />

                        {/* Precio */}
                        <Box sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography
                              variant="h4"
                              sx={{
                                fontWeight: 800,
                                color: colorTokens.brand
                              }}
                            >
                              {formatPrice(plan.price)}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: colorTokens.textMuted }}
                            >
                              / {formatDuration(plan.duration_days)}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Características */}
                        {plan.features && plan.features.length > 0 && (
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: colorTokens.textSecondary,
                                mb: 1.5
                              }}
                            >
                              Incluye:
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {plan.features.map((feature, index) => (
                                <Box
                                  key={index}
                                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                                >
                                  <CheckCircleIcon
                                    sx={{
                                      fontSize: 18,
                                      color: colorTokens.success
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{ color: colorTokens.textPrimary }}
                                  >
                                    {feature}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>
          )}
        />
      )}

      {/* Error de validación */}
      {errors.membershipTypeId && (
        <Alert
          severity="error"
          sx={{
            mt: 3,
            bgcolor: `${colorTokens.error}15`,
            color: colorTokens.error,
            border: `1px solid ${colorTokens.error}30`
          }}
        >
          {errors.membershipTypeId.message}
        </Alert>
      )}

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
          disabled={!selectedPlan && !control._formValues?.membershipTypeId}
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
            '&:disabled': {
              bgcolor: colorTokens.neutral600,
              color: colorTokens.textMuted
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
