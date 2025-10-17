// components/PlanForm/PricingSection.tsx - ENTERPRISE v4.0
'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Card,
  CardContent,
  InputAdornment,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS
import { colorTokens } from '@/theme';
import { notify } from '@/utils/notifications';
import { PlanFormData } from '@/hooks/usePlanForm';

interface PricingSectionProps {
  formData: PlanFormData;
  errors: {[key: string]: string};
  onInputChange: (field: keyof PlanFormData, value: any) => void;
  onFieldBlur: (field: keyof PlanFormData) => void;
  expanded: boolean;
  onToggle: () => void;
}

export const PricingSection = React.memo<PricingSectionProps>(({
  formData,
  errors,
  onInputChange,
  onFieldBlur,
  expanded,
  onToggle
}) => {
  const fieldStyles = useMemo(() => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: colorTokens.neutral100,
      border: `2px solid ${colorTokens.neutral400}`,
      borderRadius: 2,
      transition: 'all 0.3s ease',
      color: colorTokens.neutral1200,
      '&:hover': {
        backgroundColor: `${colorTokens.brand}05`,
        borderColor: `${colorTokens.brand}60`,
      },
      '&.Mui-focused': {
        backgroundColor: `${colorTokens.brand}08`,
        borderColor: colorTokens.brand,
        boxShadow: `0 0 0 3px ${colorTokens.brand}40`
      },
      '&.Mui-error': {
        borderColor: colorTokens.danger,
        backgroundColor: `${colorTokens.danger}05`,
      },
      '& fieldset': { border: 'none' }
    },
    '& .MuiInputLabel-root': {
      color: colorTokens.neutral900,
      '&.Mui-focused': { color: colorTokens.brand },
      '&.Mui-error': { color: colorTokens.danger }
    },
    '& .MuiFormHelperText-root': {
      color: colorTokens.danger,
      fontWeight: 600,
      marginLeft: 1
    }
  }), []);

  const bestPrice = useMemo(() => 
    Math.max(formData.monthly_price, formData.visit_price), 
    [formData.monthly_price, formData.visit_price]
  );

  // ✅ USAR SISTEMA NOTIFY CENTRALIZADO
  const handlePriceChange = (field: keyof PlanFormData, value: string, label: string) => {
    const numValue = parseFloat(value) || 0;
    onInputChange(field, numValue);
    // NO mostrar notify aquí, solo cuando hace blur y es válido
  };

  const pricingPeriods = useMemo(() => [
    { 
      key: 'weekly_price', 
      label: 'Semanal', 
      duration: '7 días',
      color: colorTokens.success,
      icon: '📅'
    },
    { 
      key: 'biweekly_price', 
      label: 'Quincenal', 
      duration: '15 días',
      color: colorTokens.info,
      icon: '📊'
    },
    { 
      key: 'monthly_price', 
      label: 'Mensual', 
      duration: '30 días',
      color: colorTokens.brand,
      icon: '⭐'
    },
    { 
      key: 'bimonthly_price', 
      label: 'Bimestral', 
      duration: '60 días',
      color: colorTokens.warning,
      icon: '🔶'
    },
    { 
      key: 'quarterly_price', 
      label: 'Trimestral', 
      duration: '90 días',
      color: '#FF6B35',
      icon: '🔥'
    },
    { 
      key: 'semester_price', 
      label: 'Semestral', 
      duration: '180 días',
      color: '#9C27B0',
      icon: '💎'
    },
    { 
      key: 'annual_price', 
      label: 'Anual', 
      duration: '365 días',
      color: '#45B7D1',
      icon: '👑'
    }
  ], []);

  return (
    <Accordion 
      expanded={expanded} 
      onChange={onToggle}
      sx={{
        backgroundColor: 'transparent',
        '&:before': { display: 'none' },
        '& .MuiAccordionSummary-root': {
          background: expanded 
            ? `${colorTokens.info}15`
            : 'transparent',
          borderBottom: `1px solid ${colorTokens.neutral400}`,
          minHeight: 80
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: colorTokens.info }} />}
        sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 1, sm: 1.5 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2, md: 3 }, width: '100%' }}>
          <Avatar sx={{
            background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.info}CC)`,
            color: colorTokens.neutral1200,
            width: { xs: 40, sm: 48, md: 56 },
            height: { xs: 40, sm: 48, md: 56 }
          }}>
            <MonetizationOnIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{
              color: colorTokens.info,
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
            }}>
              Estructura de Precios
            </Typography>
            <Typography variant="body2" sx={{
              color: colorTokens.neutral900,
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              display: { xs: 'none', sm: 'block' }
            }}>
              Configure los precios para diferentes modalidades de membresía
            </Typography>
          </Box>
          {bestPrice > 0 && (
            <Chip
              icon={<TrendingUpIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              label={`$${bestPrice.toLocaleString('es-MX')}`}
              sx={{
                bgcolor: `${colorTokens.info}20`,
                color: colorTokens.info,
                border: `1px solid ${colorTokens.info}40`,
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: '24px', sm: '28px' }
              }}
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Precio de Inscripción"
              type="number"
              value={formData.inscription_price}
              onChange={(e) => handlePriceChange('inscription_price', e.target.value, 'Precio de inscripción')}
              onBlur={() => onFieldBlur('inscription_price')}
              error={!!errors.inscription_price}
              helperText={errors.inscription_price}
              sx={fieldStyles}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Precio por Visita"
              type="number"
              value={formData.visit_price}
              onChange={(e) => handlePriceChange('visit_price', e.target.value, 'Precio por visita')}
              onBlur={() => onFieldBlur('visit_price')}
              error={!!errors.visit_price}
              helperText={errors.visit_price}
              sx={fieldStyles}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>


          <Grid size={12}>
            <Typography variant="h6" sx={{
              color: colorTokens.neutral1200,
              mb: { xs: 2, sm: 2.5, md: 3 },
              fontWeight: 700,
              textAlign: 'center',
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
            }}>
              Modalidades de Membresía
            </Typography>
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              {pricingPeriods.map((period) => (
                <Grid key={period.key} size={{ xs: 12, sm: 6, md: 4 }}>
                  <motion.div whileHover={{ scale: 1.02, y: -4 }}>
                    <Card sx={{
                      background: `linear-gradient(135deg, ${period.color}15, ${period.color}08)`,
                      border: `2px solid ${period.color}30`,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        border: `2px solid ${period.color}60`,
                        boxShadow: `0 8px 25px ${period.color}20`,
                      }
                    }}>
                      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 }, textAlign: 'center' }}>
                        <Typography variant="h4" sx={{
                          mb: 1,
                          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
                        }}>
                          {period.icon}
                        </Typography>
                        <Typography variant="h6" sx={{
                          color: period.color,
                          mb: 1,
                          fontWeight: 700,
                          fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
                        }}>
                          {period.label}
                        </Typography>
                        <Typography variant="caption" sx={{
                          color: colorTokens.neutral900,
                          mb: 2,
                          display: 'block',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' }
                        }}>
                          {period.duration}
                        </Typography>
                        <TextField
                          fullWidth
                          type="number"
                          value={formData[period.key as keyof PlanFormData] as number}
                          onChange={(e) => handlePriceChange(period.key as keyof PlanFormData, e.target.value, period.label)}
                          onBlur={() => onFieldBlur(period.key as keyof PlanFormData)}
                          error={!!errors[period.key]}
                          helperText={errors[period.key]}
                          sx={{
                            ...fieldStyles,
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: `${period.color}10`,
                              border: `2px solid ${period.color}20`,
                            }
                          }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* MOSTRAR ERROR GENERAL DE PRECIOS */}
          {errors.pricing && (
            <Grid size={12}>
              <Box sx={{
                bgcolor: `${colorTokens.danger}10`,
                border: `2px solid ${colorTokens.danger}30`,
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
                textAlign: 'center'
              }}>
                <Typography variant="body2" sx={{
                  color: colorTokens.danger,
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  ⚠️ {errors.pricing}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
});

PricingSection.displayName = 'PricingSection';