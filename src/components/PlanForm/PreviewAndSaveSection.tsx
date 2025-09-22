// components/PlanForm/PreviewAndSaveSection.tsx
'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Card,
  CardContent,
  Divider,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { motion } from 'framer-motion';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PreviewIcon from '@mui/icons-material/Preview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import { colorTokens } from '@/theme';
import { PlanFormData } from '@/hooks/usePlanForm';

interface PreviewAndSaveSectionProps {
  formData: PlanFormData;
  loading: boolean;
  hasFormChanges: boolean;
  isFormValid: boolean;
  expanded: boolean;
  onToggle: () => void;
  onSave: (exitAfterSave?: boolean) => void;
  onExit: () => void;
  // Nuevas propiedades opcionales
  buttonText?: string;
  successMessage?: string;
  isEditMode?: boolean;
}

export const PreviewAndSaveSection = React.memo<PreviewAndSaveSectionProps>(({
  formData,
  loading,
  hasFormChanges,
  isFormValid,
  expanded,
  onToggle,
  onSave,
  onExit,
  buttonText = "🚀 Crear Plan",
  successMessage = "creado",
  isEditMode = false
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  const validations = useMemo(() => [
    { 
      label: 'Información básica', 
      check: !!formData.name.trim() && !!formData.description.trim() 
    },
    { 
      label: 'Precios configurados', 
      check: formData.monthly_price > 0 || formData.visit_price > 0 
    },
    { 
      label: 'Características definidas', 
      check: formData.features.length > 0 || formData.gym_access || formData.classes_included 
    },
    { 
      label: 'Control de acceso', 
      check: !formData.access_control_enabled || (
        formData.max_daily_entries > 0 && 
        Object.values(formData.daily_schedules).some(s => s.enabled)
      ) 
    },
    { 
      label: 'Configuración válida', 
      check: isFormValid 
      
    }
  ], [formData, isFormValid]);

  const activePrices = useMemo(() => {
    const prices = [];
    if (formData.inscription_price > 0) prices.push({ label: 'Inscripción', price: formData.inscription_price });
    if (formData.visit_price > 0) prices.push({ label: 'Por Visita', price: formData.visit_price });
    if (formData.monthly_price > 0) prices.push({ label: 'Mensual', price: formData.monthly_price });
    if (formData.weekly_price > 0) prices.push({ label: 'Semanal', price: formData.weekly_price });
    if (formData.biweekly_price > 0) prices.push({ label: 'Quincenal', price: formData.biweekly_price });
    if (formData.quarterly_price > 0) prices.push({ label: 'Trimestral', price: formData.quarterly_price });
    if (formData.annual_price > 0) prices.push({ label: 'Anual', price: formData.annual_price });
    return prices;
  }, [formData]);

  // Texto dinámico para el loading basado en el modo
  const loadingText = isEditMode ? 'Actualizando Plan...' : 'Creando Plan...';
  
  // Título dinámico para la sección
  const sectionTitle = isEditMode ? 'Vista Previa y Actualización' : 'Vista Previa y Guardado';
  const sectionSubtitle = isEditMode ? 'Revise los cambios del plan antes de actualizar' : 'Revise la configuración completa del plan';

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
            {isEditMode ? <EditIcon /> : <PreviewIcon />}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ 
              color: colorTokens.brand, 
              fontWeight: 700
            }}>
              {sectionTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
              {sectionSubtitle}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* Vista previa del plan */}
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}08)`,
              border: `2px solid ${colorTokens.brand}40`,
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <CardContent sx={{ p: 4 }}>
                {/* HEADER */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box>
                    <Typography variant="h3" sx={{ 
                      color: colorTokens.brand, 
                      fontWeight: 700,
                      mb: 1
                    }}>
                      {isEditMode ? '✏️' : '🚀'} {formData.name || 'Nombre del Plan'}
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      color: colorTokens.neutral900, 
                      mb: 2
                    }}>
                      {formData.description || 'Descripción del plan...'}
                    </Typography>
                  </Box>
                  <Stack spacing={1}>
                    <Chip 
                      label={formData.is_active ? 'ACTIVO' : 'INACTIVO'} 
                      sx={{
                        bgcolor: formData.is_active ? `${colorTokens.success}20` : `${colorTokens.danger}20`,
                        color: formData.is_active ? colorTokens.success : colorTokens.danger,
                        border: `1px solid ${formData.is_active ? colorTokens.success : colorTokens.danger}40`,
                        fontWeight: 700
                      }}
                    />
                    {formData.access_control_enabled && (
                      <Chip 
                        icon={<AccessTimeIcon />}
                        label="CONTROL ACTIVO" 
                        sx={{
                          bgcolor: `${colorTokens.warning}20`,
                          color: colorTokens.warning,
                          border: `1px solid ${colorTokens.warning}40`,
                          fontWeight: 700
                        }}
                      />
                    )}
                    {isEditMode && hasFormChanges && (
                      <Chip 
                        label="MODIFICADO" 
                        sx={{
                          bgcolor: `${colorTokens.warning}20`,
                          color: colorTokens.warning,
                          border: `1px solid ${colorTokens.warning}40`,
                          fontWeight: 700
                        }}
                      />
                    )}
                  </Stack>
                </Box>
                
                <Divider sx={{ borderColor: `${colorTokens.brand}40`, my: 3 }} />
                
                {/* PRECIOS */}
                {activePrices.length > 0 && (
                  <>
                    <Typography variant="h5" sx={{ 
                      color: colorTokens.neutral1200, 
                      mb: 2, 
                      fontWeight: 700
                    }}>
                      💰 Estructura de Precios
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                      {activePrices.slice(0, 4).map((priceItem, index) => (
                        <Grid key={index} size={{ xs: 6, md: 3 }}>
                          <Card sx={{
                            bgcolor: colorTokens.neutral300,
                            p: 2,
                            textAlign: 'center',
                            border: `1px solid ${colorTokens.brand}40`
                          }}>
                            <Typography variant="caption" sx={{ color: colorTokens.neutral900 }}>
                              {priceItem.label}
                            </Typography>
                            <Typography variant="h6" sx={{ color: colorTokens.brand, fontWeight: 700 }}>
                              {formatPrice(priceItem.price)}
                            </Typography>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}

                {/* CARACTERÍSTICAS */}
                {formData.features.length > 0 && (
                  <>
                    <Typography variant="h5" sx={{ 
                      color: colorTokens.neutral1200, 
                      mb: 2, 
                      fontWeight: 700
                    }}>
                      ✨ Características Incluidas
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                      {formData.features.slice(0, 6).map((feature, index) => (
                        <Chip
                          key={index}
                          label={feature}
                          icon={<CheckCircleIcon />}
                          sx={{
                            bgcolor: `${colorTokens.success}20`,
                            color: colorTokens.success,
                            border: `1px solid ${colorTokens.success}40`
                          }}
                        />
                      ))}
                      {formData.features.length > 6 && (
                        <Chip
                          label={`+${formData.features.length - 6} más`}
                          sx={{
                            bgcolor: `${colorTokens.info}20`,
                            color: colorTokens.info,
                            border: `1px solid ${colorTokens.info}40`
                          }}
                        />
                      )}
                    </Box>
                  </>
                )}

                {/* CONTROL DE ACCESO */}
                {formData.access_control_enabled && (
                  <>
                    <Typography variant="h5" sx={{ 
                      color: colorTokens.neutral1200, 
                      mb: 2, 
                      fontWeight: 700
                    }}>
                      🔒 Control de Acceso
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: `${colorTokens.warning}10`,
                      border: `1px solid ${colorTokens.warning}30`,
                      borderRadius: 2,
                      mb: 3
                    }}>
                      <Typography variant="body1" sx={{ 
                        color: colorTokens.warning, 
                        fontWeight: 700,
                        mb: 1
                      }}>
                        Límite diario: {formData.max_daily_entries} {formData.max_daily_entries === 1 ? 'entrada' : 'entradas'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.neutral900 }}>
                        Días habilitados: {Object.values(formData.daily_schedules).filter(s => s.enabled).length} de 7
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, lg: 4 }}>
            {/* PANEL DE CONTROL */}
            <Card sx={{
              background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
              border: `1px solid ${colorTokens.neutral400}`,
              borderRadius: 3,
              p: 3,
              position: 'sticky',
              top: 20
            }}>
              <Typography variant="h5" sx={{ 
                color: colorTokens.brand, 
                mb: 3, 
                fontWeight: 700,
                textAlign: 'center'
              }}>
                {isEditMode ? '✏️ Centro de Control' : '🚀 Centro de Control'}
              </Typography>
              
              {/* VALIDACIONES */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ 
                  color: colorTokens.neutral1200, 
                  mb: 2, 
                  fontWeight: 700
                }}>
                  Estado de Configuración:
                </Typography>
                
                {validations.map((validation, index) => (
                  <Box key={index} sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 1,
                    p: 1,
                    bgcolor: validation.check 
                      ? `${colorTokens.success}10`
                      : `${colorTokens.warning}10`,
                    border: validation.check 
                      ? `1px solid ${colorTokens.success}30`
                      : `1px solid ${colorTokens.warning}30`,
                    borderRadius: 1
                  }}>
                    {validation.check ? (
                      <CheckCircleIcon sx={{ color: colorTokens.success, fontSize: 20 }} />
                    ) : (
                      <WarningIcon sx={{ color: colorTokens.warning, fontSize: 20 }} />
                    )}
                    <Typography variant="body2" sx={{ 
                      color: validation.check ? colorTokens.success : colorTokens.warning,
                      fontWeight: 600,
                      flex: 1
                    }}>
                      {validation.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              <Divider sx={{ borderColor: colorTokens.neutral400, my: 3 }} />
              
              {/* BOTONES DE ACCIÓN */}
              <Stack spacing={2}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => onSave(false)}
                    disabled={loading || !formData.name.trim() || !formData.description.trim()}
                    startIcon={loading ? <CircularProgress size={20} /> : (isEditMode ? <EditIcon /> : <SaveIcon />)}
                    sx={{
                      background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.warning})`,
                      color: colorTokens.neutral0,
                      fontWeight: 700,
                      py: 1.5,
                      borderRadius: 2,
                      '&:hover': { 
                        background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.brand})`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${colorTokens.brand}40`
                      },
                      '&:disabled': {
                        bgcolor: colorTokens.neutral600,
                        color: colorTokens.neutral800
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {loading ? loadingText : buttonText}
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    onClick={onExit}
                    disabled={loading}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      borderColor: colorTokens.neutral400,
                      color: colorTokens.neutral900,
                      '&:hover': {
                        borderColor: colorTokens.neutral900,
                        bgcolor: `${colorTokens.brand}05`,
                        color: colorTokens.neutral1200,
                        transform: 'translateX(-2px)'
                      },
                      '&:disabled': {
                        borderColor: colorTokens.neutral600,
                        color: colorTokens.neutral800
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    ← Volver a Planes
                  </Button>
                </motion.div>
              </Stack>
              
              {/* INDICADOR DE CAMBIOS NO GUARDADOS */}
              {hasFormChanges && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginTop: 16 }}
                >
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      bgcolor: `${colorTokens.warning}15`,
                      color: colorTokens.neutral1200,
                      border: `1px solid ${colorTokens.warning}40`,
                      fontSize: '0.8rem'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      ⚠️ Tienes cambios sin guardar
                    </Typography>
                  </Alert>
                </motion.div>
              )}

              {/* MENSAJE DE ÉXITO (cuando sea relevante mostrar el successMessage) */}
              {isEditMode && !hasFormChanges && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginTop: 16 }}
                >
                  <Alert 
                    severity="success" 
                    sx={{ 
                      bgcolor: `${colorTokens.success}15`,
                      color: colorTokens.neutral1200,
                      border: `1px solid ${colorTokens.success}40`,
                      fontSize: '0.8rem'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      ✅ Plan {successMessage} exitosamente
                    </Typography>
                  </Alert>
                </motion.div>
              )}
            </Card>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
});

PreviewAndSaveSection.displayName = 'PreviewAndSaveSection';