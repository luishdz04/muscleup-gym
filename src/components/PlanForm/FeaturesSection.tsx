// components/PlanForm/FeaturesSection.tsx - CON VALIDACIÓN onBlur
'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Card,
  Divider,
  Badge,
  InputAdornment
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import GroupIcon from '@mui/icons-material/Group';
import FeatureIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { colorTokens } from '@/theme';
import { PlanFormData } from '@/hooks/usePlanForm';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

const useFieldStyles = () => {
  return useMemo(() => ({
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
};

interface FeaturesSectionProps {
  formData: PlanFormData;
  errors: {[key: string]: string};
  onInputChange: (field: keyof PlanFormData, value: any) => void;
  onFieldBlur: (field: keyof PlanFormData) => void; // ✅ Nueva prop
  expanded: boolean;
  onToggle: () => void;
}

export const FeaturesSection = React.memo<FeaturesSectionProps>(({
  formData,
  errors,
  onInputChange,
  onFieldBlur, // ✅ Nueva prop
  expanded,
  onToggle
}) => {
  const fieldStyles = useFieldStyles();
  
  const {
    newFeature,
    setNewFeature,
    addFeature,
    addPredefinedFeature,
    removeFeature,
    availablePredefinedFeatures
  } = usePlanFeatures(formData.features, (features: string[]) => onInputChange('features', features));

  return (
    <Accordion 
      expanded={expanded} 
      onChange={onToggle}
      sx={{
        backgroundColor: 'transparent',
        '&:before': { display: 'none' },
        '& .MuiAccordionSummary-root': {
          background: expanded 
            ? `${colorTokens.success}15`
            : 'transparent',
          borderBottom: `1px solid ${colorTokens.neutral400}`,
          minHeight: 80
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: colorTokens.success }} />}
        sx={{ px: { xs: 2, sm: 3, md: 4 }, py: { xs: 1, sm: 1.5 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2, md: 3 }, width: '100%' }}>
          <Avatar sx={{
            background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
            color: colorTokens.neutral1200,
            width: { xs: 40, sm: 48, md: 56 },
            height: { xs: 40, sm: 48, md: 56 }
          }}>
            <FeatureIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{
              color: colorTokens.success,
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' }
            }}>
              Características y Beneficios
            </Typography>
            <Typography variant="body2" sx={{
              color: colorTokens.neutral900,
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              display: { xs: 'none', sm: 'block' }
            }}>
              Defina las características incluidas en el plan
            </Typography>
          </Box>
          {formData.features.length > 0 && (
            <Badge badgeContent={formData.features.length}>
              <Chip
                icon={<StarIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                label={<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Características</Box>}
                sx={{
                  bgcolor: `${colorTokens.success}20`,
                  color: colorTokens.success,
                  border: `1px solid ${colorTokens.success}40`,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  height: { xs: '24px', sm: '28px' }
                }}
              />
            </Badge>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* BENEFICIOS PRINCIPALES */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{
              background: `${colorTokens.success}10`,
              border: `2px solid ${colorTokens.success}30`,
              borderRadius: 3,
              p: { xs: 2, sm: 2.5, md: 3 },
              height: '100%'
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.gym_access}
                    onChange={(e) => onInputChange('gym_access', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { 
                        color: colorTokens.success,
                        '& + .MuiSwitch-track': { backgroundColor: colorTokens.success }
                      }
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>
                      🏋️ Acceso al Gimnasio
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
                      Equipos y área completa de entrenamiento
                    </Typography>
                  </Box>
                }
              />
            </Card>
          </Grid>


          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{
              background: `${colorTokens.info}10`,
              border: `2px solid ${colorTokens.info}30`,
              borderRadius: 3,
              p: { xs: 2, sm: 2.5, md: 3 },
              height: '100%'
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.classes_included}
                    onChange={(e) => onInputChange('classes_included', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { 
                        color: colorTokens.info,
                        '& + .MuiSwitch-track': { backgroundColor: colorTokens.info }
                      }
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>
                      🧘 Clases Grupales
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
                      Yoga, pilates, spinning y más
                    </Typography>
                  </Box>
                }
              />
            </Card>
          </Grid>


          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{
              background: `${colorTokens.warning}10`,
              border: `2px solid ${colorTokens.warning}30`,
              borderRadius: 3,
              p: { xs: 2, sm: 2.5, md: 3 },
              height: '100%'
            }}>
              <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 700, mb: 2 }}>
                👥 Pases de Invitado
              </Typography>
              <TextField
                fullWidth
                type="number"
                value={formData.guest_passes}
                onChange={(e) => onInputChange('guest_passes', parseInt(e.target.value) || 0)}
                onBlur={() => onFieldBlur('guest_passes')} // ✅ Nueva funcionalidad
                error={!!errors.guest_passes}
                helperText={errors.guest_passes}
                sx={fieldStyles}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <GroupIcon sx={{ color: colorTokens.warning }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Card>
          </Grid>
          
          {/* CARACTERÍSTICAS PERSONALIZADAS */}
          <Grid size={12}>
            <Divider sx={{ borderColor: colorTokens.neutral400, my: { xs: 2, sm: 2.5, md: 3 } }} />
            <Typography variant="h6" sx={{
              color: colorTokens.neutral1200,
              mb: { xs: 2, sm: 2.5, md: 3 },
              fontWeight: 700,
              textAlign: 'center',
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
            }}>
              Características Personalizadas
            </Typography>

            {/* AGREGAR NUEVA CARACTERÍSTICA */}
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 2 },
              mb: { xs: 2, sm: 2.5, md: 3 }
            }}>
              <TextField
                fullWidth
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onBlur={() => {
                  // Validar si hay características definidas cuando salga del campo
                  if (formData.features.length === 0 && !newFeature.trim()) {
                    onFieldBlur('features'); // ✅ Validar cuando no hay características
                  }
                }}
                placeholder="Escriba una característica personalizada..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addFeature();
                  }
                }}
                sx={fieldStyles}
              />
              <Button
                onClick={addFeature}
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                disabled={!newFeature.trim()}
                sx={{
                  background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.warning})`,
                  color: colorTokens.neutral0,
                  minWidth: { xs: '100%', sm: 120 },
                  fontSize: { xs: '0.85rem', sm: '0.875rem' },
                  py: { xs: 1.5, sm: 1 },
                  '&:disabled': {
                    bgcolor: colorTokens.neutral600,
                    color: colorTokens.neutral800
                  }
                }}
              >
                Agregar
              </Button>
            </Box>

            {/* MOSTRAR ERROR DE CARACTERÍSTICAS */}
            {errors.features && (
              <Box sx={{
                bgcolor: `${colorTokens.danger}10`,
                border: `2px solid ${colorTokens.danger}30`,
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
                mb: { xs: 2, sm: 2.5, md: 3 },
                textAlign: 'center'
              }}>
                <Typography variant="body2" sx={{
                  color: colorTokens.danger,
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}>
                  ⚠️ {errors.features}
                </Typography>
              </Box>
            )}

            {/* CARACTERÍSTICAS POPULARES */}
            <Typography variant="body2" sx={{
              color: colorTokens.neutral900,
              mb: { xs: 1.5, sm: 2 },
              textAlign: 'center',
              fontSize: { xs: '0.8rem', sm: '0.875rem' }
            }}>
              Características populares (clic para agregar):
            </Typography>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 0.75, sm: 1 },
              mb: { xs: 3, sm: 3.5, md: 4 },
              justifyContent: 'center'
            }}>
              {availablePredefinedFeatures.slice(0, 6).map((feature: string) => (
                <Chip
                  key={feature}
                  label={feature}
                  onClick={() => addPredefinedFeature(feature)}
                  sx={{
                    bgcolor: `${colorTokens.neutral600}40`,
                    color: colorTokens.neutral900,
                    border: `1px solid ${colorTokens.neutral600}`,
                    '&:hover': {
                      bgcolor: `${colorTokens.brand}20`,
                      color: colorTokens.brand,
                      border: `1px solid ${colorTokens.brand}40`,
                      cursor: 'pointer',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Box>
            
            {/* CARACTERÍSTICAS SELECCIONADAS */}
            {formData.features.length > 0 && (
              <Card sx={{
                bgcolor: `${colorTokens.success}10`,
                border: `2px solid ${colorTokens.success}30`,
                borderRadius: 3,
                p: { xs: 2, sm: 2.5, md: 3 }
              }}>
                <Typography variant="h6" sx={{
                  color: colorTokens.success,
                  mb: { xs: 1.5, sm: 2 },
                  fontWeight: 700,
                  textAlign: 'center',
                  fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
                }}>
                  Características Incluidas ({formData.features.length}):
                </Typography>
                <Box sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: { xs: 0.75, sm: 1 },
                  justifyContent: 'center'
                }}>
                  {formData.features.map((feature: string, index: number) => (
                    <Chip
                      key={index}
                      label={feature}
                      onDelete={() => removeFeature(feature)}
                      deleteIcon={<DeleteIcon />}
                      sx={{
                        bgcolor: `${colorTokens.success}20`,
                        color: colorTokens.success,
                        border: `1px solid ${colorTokens.success}40`,
                        '& .MuiChip-deleteIcon': { 
                          color: colorTokens.success,
                          '&:hover': { 
                            color: colorTokens.danger,
                            transform: 'scale(1.2)'
                          }
                        }
                      }}
                    />
                  ))}
                </Box>
              </Card>
            )}
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
});

FeaturesSection.displayName = 'FeaturesSection';