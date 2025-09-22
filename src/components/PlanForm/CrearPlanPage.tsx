// components/PlanForm/FeaturesSection.tsx
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
      '& fieldset': { border: 'none' }
    },
    '& .MuiInputLabel-root': {
      color: colorTokens.neutral900,
      '&.Mui-focused': { color: colorTokens.brand }
    }
  }), []);
};

interface FeaturesSectionProps {
  formData: PlanFormData;
  onInputChange: (field: keyof PlanFormData, value: any) => void;
  expanded: boolean;
  onToggle: () => void;
}

export const FeaturesSection = React.memo<FeaturesSectionProps>(({
  formData,
  onInputChange,
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
  } = usePlanFeatures(formData.features, (features) => onInputChange('features', features));

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
        sx={{ px: 4 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
          <Avatar sx={{ 
            background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
            color: colorTokens.neutral1200
          }}>
            <FeatureIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ 
              color: colorTokens.success, 
              fontWeight: 700
            }}>
              Características y Beneficios
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
              Defina las características incluidas en el plan
            </Typography>
          </Box>
          {formData.features.length > 0 && (
            <Badge badgeContent={formData.features.length}>
              <Chip 
                icon={<StarIcon />} 
                label="Características"
                sx={{ 
                  bgcolor: `${colorTokens.success}20`,
                  color: colorTokens.success,
                  border: `1px solid ${colorTokens.success}40`
                }}
              />
            </Badge>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* BENEFICIOS PRINCIPALES */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{
              background: `${colorTokens.success}10`,
              border: `2px solid ${colorTokens.success}30`,
              borderRadius: 3,
              p: 3,
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
              p: 3,
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
              p: 3,
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
            <Divider sx={{ borderColor: colorTokens.neutral400, my: 3 }} />
            <Typography variant="h6" sx={{ 
              color: colorTokens.neutral1200, 
              mb: 3, 
              fontWeight: 700,
              textAlign: 'center'
            }}>
              Características Personalizadas
            </Typography>
            
            {/* AGREGAR NUEVA CARACTERÍSTICA */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
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
                startIcon={<AddIcon />}
                disabled={!newFeature.trim()}
                sx={{
                  background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.warning})`,
                  color: colorTokens.neutral0,
                  minWidth: 120,
                  '&:disabled': {
                    bgcolor: colorTokens.neutral600,
                    color: colorTokens.neutral800
                  }
                }}
              >
                Agregar
              </Button>
            </Box>
            
            {/* CARACTERÍSTICAS POPULARES */}
            <Typography variant="body2" sx={{ 
              color: colorTokens.neutral900, 
              mb: 2,
              textAlign: 'center'
            }}>
              Características populares (clic para agregar):
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'center' }}>
              {availablePredefinedFeatures.slice(0, 6).map((feature) => (
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
                p: 3
              }}>
                <Typography variant="h6" sx={{ 
                  color: colorTokens.success, 
                  mb: 2, 
                  fontWeight: 700,
                  textAlign: 'center'
                }}>
                  Características Incluidas ({formData.features.length}):
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                  {formData.features.map((feature, index) => (
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