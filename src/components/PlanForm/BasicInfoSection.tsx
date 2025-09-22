// components/PlanForm/BasicInfoSection.tsx - CON VALIDACIÓN onBlur
'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { colorTokens } from '@/theme';
import { PlanFormData } from '@/hooks/usePlanForm';

// Estilos reutilizables memoizados
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

interface BasicInfoSectionProps {
  formData: PlanFormData;
  errors: {[key: string]: string};
  onInputChange: (field: keyof PlanFormData, value: any) => void;
  onFieldBlur: (field: keyof PlanFormData) => void; // ✅ Nueva prop
  expanded: boolean;
  onToggle: () => void;
}

export const BasicInfoSection = React.memo<BasicInfoSectionProps>(({
  formData,
  errors,
  onInputChange,
  onFieldBlur, // ✅ Nueva prop
  expanded,
  onToggle
}) => {
  const fieldStyles = useFieldStyles();
  
  const isCompleted = useMemo(() => 
    !!formData.name.trim() && !!formData.description.trim(), 
    [formData.name, formData.description]
  );

  return (
    <Accordion 
      expanded={expanded} 
      onChange={onToggle}
      sx={{
        backgroundColor: 'transparent',
        '&:before': { display: 'none' },
        '& .MuiAccordionSummary-root': {
          background: expanded 
            ? `${colorTokens.brand}15`
            : 'transparent',
          borderBottom: `1px solid ${colorTokens.neutral400}`,
          minHeight: 80
        }
      }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon sx={{ color: colorTokens.brand }} />}
        sx={{ px: 4 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
          <Avatar sx={{ 
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.warning})`,
            color: colorTokens.neutral0
          }}>
            <EditIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ 
              color: colorTokens.brand, 
              fontWeight: 700
            }}>
              Información Básica
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
              Nombre, descripción y configuración general del plan
            </Typography>
          </Box>
          {isCompleted && (
            <Chip 
              icon={<CheckCircleIcon />} 
              label="Completado" 
              sx={{ 
                bgcolor: `${colorTokens.success}20`,
                color: colorTokens.success,
                border: `1px solid ${colorTokens.success}40`
              }} 
            />
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label="Nombre del Plan"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              onBlur={() => onFieldBlur('name')} // ✅ Nueva funcionalidad
              error={!!errors.name}
              helperText={errors.name}
              required
              placeholder="Ej: Plan Básico, Plan Premium"
              sx={fieldStyles}
            />
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth sx={fieldStyles}>
              <InputLabel>Vigencia</InputLabel>
              <Select
                value={formData.validity_type}
                onChange={(e) => onInputChange('validity_type', e.target.value)}
                onBlur={() => onFieldBlur('validity_type')} // ✅ Nueva funcionalidad
                label="Vigencia"
              >
                <MenuItem value="permanent">Permanente</MenuItem>
                <MenuItem value="limited">Tiempo Limitado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={12}>
            <TextField
              fullWidth
              label="Descripción del Plan"
              value={formData.description}
              onChange={(e) => onInputChange('description', e.target.value)}
              onBlur={() => onFieldBlur('description')} // ✅ Nueva funcionalidad
              error={!!errors.description}
              helperText={errors.description}
              multiline
              rows={3}
              required
              placeholder="Describa las características y beneficios del plan..."
              sx={fieldStyles}
            />
          </Grid>

          {formData.validity_type === 'limited' && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ width: '100%' }}
              >
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Fecha de Inicio"
                      type="date"
                      value={formData.validity_start_date}
                      onChange={(e) => onInputChange('validity_start_date', e.target.value)}
                      onBlur={() => onFieldBlur('validity_start_date')} // ✅ Nueva funcionalidad
                      error={!!errors.validity}
                      helperText={errors.validity}
                      InputLabelProps={{ shrink: true }}
                      sx={fieldStyles}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Fecha de Fin"
                      type="date"
                      value={formData.validity_end_date}
                      onChange={(e) => onInputChange('validity_end_date', e.target.value)}
                      onBlur={() => onFieldBlur('validity_end_date')} // ✅ Nueva funcionalidad
                      error={!!errors.validity}
                      helperText={errors.validity}
                      InputLabelProps={{ shrink: true }}
                      sx={fieldStyles}
                    />
                  </Grid>
                </Grid>
              </motion.div>
            </AnimatePresence>
          )}
          
          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => onInputChange('is_active', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { 
                      color: colorTokens.brand,
                      '& + .MuiSwitch-track': { backgroundColor: colorTokens.brand }
                    }
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 600 }}>
                    Plan Activo
                  </Typography>
                  <Chip 
                    label={formData.is_active ? 'ACTIVO' : 'INACTIVO'} 
                    size="small"
                    sx={{
                      bgcolor: formData.is_active ? `${colorTokens.success}20` : `${colorTokens.danger}20`,
                      color: formData.is_active ? colorTokens.success : colorTokens.danger,
                      border: `1px solid ${formData.is_active ? colorTokens.success : colorTokens.danger}40`
                    }}
                  />
                </Box>
              }
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
});

BasicInfoSection.displayName = 'BasicInfoSection';