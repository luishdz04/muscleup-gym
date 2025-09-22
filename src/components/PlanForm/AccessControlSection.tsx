// components/PlanForm/AccessControlSection.tsx - CON VALIDACIÓN onBlur
'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Card,
  InputAdornment
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion, AnimatePresence } from 'framer-motion';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LimitIcon from '@mui/icons-material/Speed';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { colorTokens } from '@/theme';
import { PlanFormData, DailySchedules, DaySchedule } from '@/hooks/usePlanForm';
import { useNotifications } from '@/hooks/useNotifications';

const WEEKDAY_CONFIG = [
  { key: 'monday', label: 'Lunes', short: 'L' },
  { key: 'tuesday', label: 'Martes', short: 'M' },
  { key: 'wednesday', label: 'Miércoles', short: 'X' },
  { key: 'thursday', label: 'Jueves', short: 'J' },
  { key: 'friday', label: 'Viernes', short: 'V' },
  { key: 'saturday', label: 'Sábado', short: 'S' },
  { key: 'sunday', label: 'Domingo', short: 'D' }
] as const;

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

interface AccessControlSectionProps {
  formData: PlanFormData;
  errors: {[key: string]: string};
  onInputChange: (field: keyof PlanFormData, value: any) => void;
  onFieldBlur: (field: keyof PlanFormData) => void; // ✅ Nueva prop
  updateDaySchedule: (day: keyof DailySchedules, field: keyof DaySchedule, value: any) => void;
  expanded: boolean;
  onToggle: () => void;
}

export const AccessControlSection = React.memo<AccessControlSectionProps>(({
  formData,
  errors,
  onInputChange,
  onFieldBlur, // ✅ Nueva prop
  updateDaySchedule,
  expanded,
  onToggle
}) => {
  const fieldStyles = useFieldStyles();
  const { toast } = useNotifications();

  const handleAccessToggle = (enabled: boolean) => {
    onInputChange('access_control_enabled', enabled);
    // Toast solo para feedback inmediato de la acción
    if (enabled) {
      toast.success('Control de acceso activado');
    } else {
      toast.success('Control de acceso desactivado'); // Cambié a success para ser neutral
    }
  };

  const handleDayToggle = (day: keyof DailySchedules, enabled: boolean) => {
    updateDaySchedule(day, 'enabled', enabled);
    const dayLabel = WEEKDAY_CONFIG.find(d => d.key === day)?.label || day;
    // Toast solo para feedback inmediato
    if (enabled) {
      toast.success(`${dayLabel} habilitado`);
    } else {
      toast.success(`${dayLabel} deshabilitado`);
    }
  };

  const handleEntryLimitChange = (value: string) => {
    const numValue = parseInt(value) || 1;
    onInputChange('max_daily_entries', numValue);
    // NO mostrar toast aquí, solo cuando haga blur y sea válido
  };

  const handleTimeValidation = (day: keyof DailySchedules, field: keyof DaySchedule, value: string) => {
    updateDaySchedule(day, field, value);
    const schedule = formData.daily_schedules[day];
    // Solo mostrar error si el tiempo de fin es menor o igual al de inicio
    if (field === 'end_time' && value <= schedule.start_time) {
      toast.error('La hora de fin debe ser posterior al inicio');
    }
  };

  return (
    <Accordion 
      expanded={expanded} 
      onChange={onToggle}
      sx={{
        backgroundColor: 'transparent',
        '&:before': { display: 'none' },
        '& .MuiAccordionSummary-root': {
          background: expanded 
            ? `${colorTokens.warning}15`
            : 'transparent',
          borderBottom: `1px solid ${colorTokens.neutral400}`,
          minHeight: 80
        }
      }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon sx={{ color: colorTokens.warning }} />}
        sx={{ px: 4 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
          <Avatar sx={{ 
            background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.warning}CC)`,
            color: colorTokens.neutral0
          }}>
            <AccessTimeIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ 
              color: colorTokens.warning, 
              fontWeight: 700
            }}>
              Control de Acceso
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
              Configure límites de entrada y horarios por día
            </Typography>
          </Box>
          <Chip 
            label={formData.access_control_enabled ? 'ACTIVO' : 'DESACTIVADO'}
            sx={{
              bgcolor: formData.access_control_enabled 
                ? `${colorTokens.warning}20`
                : `${colorTokens.neutral600}20`,
              color: formData.access_control_enabled ? colorTokens.warning : colorTokens.neutral800,
              border: formData.access_control_enabled 
                ? `1px solid ${colorTokens.warning}40`
                : `1px solid ${colorTokens.neutral600}40`
            }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 4 }}>
        <Grid container spacing={4}>
          {/* ACTIVAR CONTROL DE ACCESO */}
          <Grid size={12}>
            <Card sx={{
              bgcolor: `${colorTokens.warning}10`,
              border: `2px solid ${colorTokens.warning}30`,
              borderRadius: 3,
              p: 3
            }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.access_control_enabled}
                    onChange={(e) => handleAccessToggle(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { 
                        color: colorTokens.warning,
                        '& + .MuiSwitch-track': { backgroundColor: colorTokens.warning }
                      }
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>
                      🔒 Activar Control de Acceso
                    </Typography>
                    <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
                      Aplique límites de entrada y configure horarios específicos por día
                    </Typography>
                  </Box>
                }
              />
            </Card>
          </Grid>

          {formData.access_control_enabled && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ width: '100%' }}
              >
                <Grid container spacing={4}>
                  {/* LÍMITE DE ENTRADAS POR DÍA */}
                  <Grid size={12}>
                    <Card sx={{
                      background: `${colorTokens.danger}10`,
                      border: `2px solid ${colorTokens.danger}30`,
                      borderRadius: 3,
                      p: 3,
                      textAlign: 'center',
                      mb: 3
                    }}>
                      <LimitIcon sx={{ color: colorTokens.danger, fontSize: 48, mb: 2 }} />
                      <Typography variant="h5" sx={{ 
                        color: colorTokens.danger, 
                        mb: 2, 
                        fontWeight: 700
                      }}>
                        Límite de Entradas por Día
                      </Typography>
                      <Box sx={{ maxWidth: 300, mx: 'auto' }}>
                        <TextField
                          fullWidth
                          type="number"
                          value={formData.max_daily_entries}
                          onChange={(e) => handleEntryLimitChange(e.target.value)}
                          onBlur={() => onFieldBlur('max_daily_entries')} // ✅ Nueva funcionalidad
                          error={!!errors.max_daily_entries}
                          helperText={errors.max_daily_entries}
                          sx={fieldStyles}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">entradas/día</InputAdornment>,
                            inputProps: { min: 1, max: 20 }
                          }}
                        />
                      </Box>
                    </Card>
                  </Grid>

                  {/* MOSTRAR ERROR GENERAL DE CONTROL DE ACCESO */}
                  {errors.access_control && (
                    <Grid size={12}>
                      <Box sx={{
                        bgcolor: `${colorTokens.danger}10`,
                        border: `2px solid ${colorTokens.danger}30`,
                        borderRadius: 2,
                        p: 2,
                        mb: 3,
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" sx={{ 
                          color: colorTokens.danger,
                          fontWeight: 600
                        }}>
                          ⚠️ {errors.access_control}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {/* HORARIOS POR DÍA */}
                  <Grid size={12}>
                    <Typography variant="h5" sx={{ 
                      color: colorTokens.neutral1200, 
                      mb: 3, 
                      fontWeight: 700,
                      textAlign: 'center'
                    }}>
                      📅 Configuración de Horarios por Día
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {WEEKDAY_CONFIG.map((day) => (
                        <Grid key={day.key} size={{ xs: 12, md: 6, lg: 4 }}>
                          <motion.div whileHover={{ scale: 1.02 }}>
                            <Card sx={{
                              background: formData.daily_schedules[day.key as keyof DailySchedules].enabled
                                ? `${colorTokens.success}10`
                                : `${colorTokens.neutral600}20`,
                              border: formData.daily_schedules[day.key as keyof DailySchedules].enabled
                                ? `2px solid ${colorTokens.success}30`
                                : `2px solid ${colorTokens.neutral600}40`,
                              borderRadius: 3,
                              p: 3,
                              transition: 'all 0.3s ease'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{
                                    bgcolor: formData.daily_schedules[day.key as keyof DailySchedules].enabled
                                      ? colorTokens.success
                                      : colorTokens.neutral600,
                                    color: colorTokens.neutral1200,
                                    fontWeight: 700,
                                    width: 36,
                                    height: 36
                                  }}>
                                    {day.short}
                                  </Avatar>
                                  <Typography variant="h6" sx={{ 
                                    color: colorTokens.neutral1200,
                                    fontWeight: 700
                                  }}>
                                    {day.label}
                                  </Typography>
                                </Box>
                                <Switch
                                  checked={formData.daily_schedules[day.key as keyof DailySchedules].enabled}
                                  onChange={(e) => handleDayToggle(day.key as keyof DailySchedules, e.target.checked)}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': { 
                                      color: colorTokens.success,
                                      '& + .MuiSwitch-track': { backgroundColor: colorTokens.success }
                                    }
                                  }}
                                />
                              </Box>
                              
                              {formData.daily_schedules[day.key as keyof DailySchedules].enabled && (
                                <AnimatePresence>
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                  >
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                      <TextField
                                        label="Desde"
                                        type="time"
                                        value={formData.daily_schedules[day.key as keyof DailySchedules].start_time}
                                        onChange={(e) => updateDaySchedule(day.key as keyof DailySchedules, 'start_time', e.target.value)}
                                        onBlur={() => {
                                          // Validar horarios cuando salga del campo
                                          const schedule = formData.daily_schedules[day.key as keyof DailySchedules];
                                          if (schedule.start_time >= schedule.end_time) {
                                            onFieldBlur(`schedule_${day.key}` as keyof PlanFormData);
                                          }
                                        }}
                                        error={!!errors[`schedule_${day.key}`]}
                                        helperText={errors[`schedule_${day.key}`]}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ ...fieldStyles, flex: 1 }}
                                      />
                                      <Typography sx={{ color: colorTokens.neutral1200 }}>→</Typography>
                                      <TextField
                                        label="Hasta"
                                        type="time"
                                        value={formData.daily_schedules[day.key as keyof DailySchedules].end_time}
                                        onChange={(e) => handleTimeValidation(day.key as keyof DailySchedules, 'end_time', e.target.value)}
                                        onBlur={() => {
                                          // Validar horarios cuando salga del campo
                                          const schedule = formData.daily_schedules[day.key as keyof DailySchedules];
                                          if (schedule.start_time >= schedule.end_time) {
                                            onFieldBlur(`schedule_${day.key}` as keyof PlanFormData);
                                          }
                                        }}
                                        error={!!errors[`schedule_${day.key}`]}
                                        helperText={errors[`schedule_${day.key}`]}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ ...fieldStyles, flex: 1 }}
                                      />
                                    </Box>
                                  </motion.div>
                                </AnimatePresence>
                              )}
                            </Card>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                </Grid>
              </motion.div>
            </AnimatePresence>
          )}
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
});

AccessControlSection.displayName = 'AccessControlSection';