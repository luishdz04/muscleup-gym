'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Button
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  FitnessCenter as FitnessCenterIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  PlayCircleOutline as PlayIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';

interface Exercise {
  id: string;
  name: string;
  type: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  material: string;
  level: string;
  muscle_group?: {
    id: string;
    name: string;
    description: string;
  };
  initial_position: string;
  execution_eccentric: string;
  execution_isometric: string;
  execution_concentric: string;
  common_errors: string[];
  contraindications: string[];
  video_url?: string;
  image_url?: string;
  is_active?: boolean;
}

interface Props {
  open: boolean;
  exercise: Exercise | null;
  onClose: () => void;
}

export default function ExerciseDetailModal({ open, exercise, onClose }: Props) {
  const [expanded, setExpanded] = useState<string | false>('initial');

  if (!exercise) return null;

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getDifficultyColor = (level: string) => {
    if (level.toLowerCase().includes('principiante')) return colorTokens.success;
    if (level.toLowerCase().includes('avanzado')) return colorTokens.danger;
    return colorTokens.warning;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            bgcolor: colorTokens.neutral300,
            border: `1px solid ${colorTokens.border}`,
            backgroundImage: 'none',
            maxHeight: '90vh'
          }
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: `1px solid ${colorTokens.border}`, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography variant="h5" sx={{ color: colorTokens.textPrimary, fontWeight: 700, mb: 1 }}>
              {exercise.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={exercise.type}
                size="small"
                sx={{
                  bgcolor: `${colorTokens.info}20`,
                  color: colorTokens.info,
                  fontWeight: 600
                }}
              />
              <Chip
                label={exercise.level}
                size="small"
                sx={{
                  bgcolor: `${getDifficultyColor(exercise.level)}20`,
                  color: getDifficultyColor(exercise.level),
                  fontWeight: 600
                }}
              />
              {exercise.muscle_group && (
                <Chip
                  icon={<FitnessCenterIcon sx={{ fontSize: 14 }} />}
                  label={exercise.muscle_group.name}
                  size="small"
                  sx={{
                    bgcolor: `${colorTokens.brand}20`,
                    color: colorTokens.brand,
                    fontWeight: 600
                  }}
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: colorTokens.textSecondary }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Material */}
          {exercise.material && (
            <Box>
              <Typography variant="subtitle2" sx={{ color: colorTokens.textSecondary, mb: 0.5, fontWeight: 600 }}>
                Material Necesario:
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textPrimary }}>
                {exercise.material}
              </Typography>
            </Box>
          )}

          {/* Músculos */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: colorTokens.textSecondary, mb: 1, fontWeight: 600 }}>
              Músculos Trabajados:
            </Typography>
            {exercise.primary_muscles && exercise.primary_muscles.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 600 }}>
                  Primarios:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {exercise.primary_muscles.map((muscle, i) => (
                    <Chip
                      key={i}
                      label={muscle}
                      size="small"
                      sx={{
                        bgcolor: colorTokens.neutral200,
                        color: colorTokens.textPrimary,
                        fontSize: '0.75rem'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: colorTokens.textMuted, fontWeight: 600 }}>
                  Secundarios:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {exercise.secondary_muscles.map((muscle, i) => (
                    <Chip
                      key={i}
                      label={muscle}
                      size="small"
                      sx={{
                        bgcolor: colorTokens.neutral200,
                        color: colorTokens.textSecondary,
                        fontSize: '0.75rem'
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: colorTokens.border }} />

          {/* Ejecución - Accordions */}
          <Box>
            <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700, mb: 2 }}>
              Instrucciones de Ejecución
            </Typography>

            {/* Posición Inicial */}
            {exercise.initial_position && (
              <Accordion
                expanded={expanded === 'initial'}
                onChange={handleAccordionChange('initial')}
                sx={{
                  bgcolor: colorTokens.neutral200,
                  border: `1px solid ${colorTokens.border}`,
                  '&:before': { display: 'none' },
                  mb: 1
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colorTokens.textSecondary }} />}>
                  <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    ✨ Posición Inicial
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    {exercise.initial_position}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Fase Excéntrica */}
            {exercise.execution_eccentric && (
              <Accordion
                expanded={expanded === 'eccentric'}
                onChange={handleAccordionChange('eccentric')}
                sx={{
                  bgcolor: colorTokens.neutral200,
                  border: `1px solid ${colorTokens.border}`,
                  '&:before': { display: 'none' },
                  mb: 1
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colorTokens.textSecondary }} />}>
                  <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    ⬇️ Fase Excéntrica (bajada)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    {exercise.execution_eccentric}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Fase Isométrica */}
            {exercise.execution_isometric && (
              <Accordion
                expanded={expanded === 'isometric'}
                onChange={handleAccordionChange('isometric')}
                sx={{
                  bgcolor: colorTokens.neutral200,
                  border: `1px solid ${colorTokens.border}`,
                  '&:before': { display: 'none' },
                  mb: 1
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colorTokens.textSecondary }} />}>
                  <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    ⏸️ Fase Isométrica (pausa)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    {exercise.execution_isometric}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Fase Concéntrica */}
            {exercise.execution_concentric && (
              <Accordion
                expanded={expanded === 'concentric'}
                onChange={handleAccordionChange('concentric')}
                sx={{
                  bgcolor: colorTokens.neutral200,
                  border: `1px solid ${colorTokens.border}`,
                  '&:before': { display: 'none' },
                  mb: 1
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colorTokens.textSecondary }} />}>
                  <Typography sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    ⬆️ Fase Concéntrica (subida)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    {exercise.execution_concentric}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>

          {/* Errores Comunes */}
          {exercise.common_errors && exercise.common_errors.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: colorTokens.warning, mb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <WarningIcon fontSize="small" />
                Errores Comunes a Evitar:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {exercise.common_errors.map((error, i) => (
                  <Typography
                    key={i}
                    component="li"
                    variant="body2"
                    sx={{ color: colorTokens.textSecondary, mb: 0.5 }}
                  >
                    {error}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {/* Contraindicaciones */}
          {exercise.contraindications && exercise.contraindications.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: colorTokens.danger, mb: 1, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <ErrorIcon fontSize="small" />
                Contraindicaciones:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {exercise.contraindications.map((contra, i) => (
                  <Typography
                    key={i}
                    component="li"
                    variant="body2"
                    sx={{ color: colorTokens.textSecondary, mb: 0.5 }}
                  >
                    {contra}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          <Divider sx={{ borderColor: colorTokens.border }} />

          {/* Multimedia */}
          {(exercise.video_url || exercise.image_url) && (
            <Box>
              <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 700, mb: 2 }}>
                Recursos Multimedia
              </Typography>
              <Stack spacing={2}>
                {exercise.video_url && (
                  <Button
                    variant="outlined"
                    startIcon={<PlayIcon />}
                    href={exercise.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderColor: colorTokens.info,
                      color: colorTokens.info,
                      '&:hover': {
                        borderColor: colorTokens.info,
                        bgcolor: `${colorTokens.info}20`
                      }
                    }}
                  >
                    Ver Video Tutorial
                  </Button>
                )}
                {exercise.image_url && (
                  <Box
                    component="img"
                    src={exercise.image_url}
                    alt={exercise.name}
                    sx={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: 1,
                      border: `1px solid ${colorTokens.border}`,
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
