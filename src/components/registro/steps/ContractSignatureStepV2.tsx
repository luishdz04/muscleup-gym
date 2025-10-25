// src/components/registro/steps/ContractSignatureStepV2.tsx
'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Description as DescriptionIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Info as InfoIcon,
  Draw as DrawIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import Image from 'next/image';

interface ContractSignatureStepV2Props {
  register: any;
  errors: any;
  isSubmitting: boolean;
  showTutorField: boolean;
  tutorINEUrl: string | null;
  handleTutorINECapture: (file: File) => Promise<void>;
  clearTutorINE: () => void;
  sigCanvas: React.RefObject<any>;
  clearSignature: () => void;
  onBack: () => void;
  onSubmit: () => void;
}

export const ContractSignatureStepV2: React.FC<ContractSignatureStepV2Props> = ({
  register,
  errors,
  isSubmitting,
  showTutorField,
  tutorINEUrl,
  handleTutorINECapture,
  clearTutorINE,
  sigCanvas,
  clearSignature,
  onBack,
  onSubmit
}) => {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Wrapper para manejar el evento del input y extraer el archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleTutorINECapture(file);
    }
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
          <DescriptionIcon sx={{ fontSize: 32 }} />
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
            Contrato y Firma
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colorTokens.textSecondary }}
          >
            Último paso: revisa y firma tu contrato
          </Typography>
        </Box>
      </Box>

      {/* Contrato - Contenido */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: colorTokens.surfaceLevel1,
          border: `1px solid ${colorTokens.border}`,
          borderRadius: 2,
          maxHeight: 400,
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: colorTokens.neutral600
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: colorTokens.brand,
            borderRadius: '4px'
          }
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: colorTokens.textPrimary,
            mb: 2,
            textAlign: 'center'
          }}
        >
          CONTRATO DE MEMBRESÍA - MUSCLE UP GYM
        </Typography>

        <Divider sx={{ my: 2, borderColor: colorTokens.border }} />

        <Typography
          variant="body2"
          sx={{ color: colorTokens.textPrimary, mb: 2, lineHeight: 1.8 }}
        >
          <strong>1. OBJETO DEL CONTRATO:</strong> El presente contrato tiene por objeto regular
          la prestación de servicios de gimnasio y actividades físicas ofrecidas por Muscle Up Gym
          al SOCIO/CLIENTE.
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: colorTokens.textPrimary, mb: 2, lineHeight: 1.8 }}
        >
          <strong>2. DERECHOS DEL SOCIO:</strong>
          <br />
          - Acceso a las instalaciones del gimnasio durante el horario establecido
          <br />
          - Uso de equipamiento y maquinaria disponible
          <br />
          - Asesoría inicial y orientación sobre el uso correcto del equipo
          <br />- Participación en clases grupales según disponibilidad
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: colorTokens.textPrimary, mb: 2, lineHeight: 1.8 }}
        >
          <strong>3. OBLIGACIONES DEL SOCIO:</strong>
          <br />
          - Realizar el pago puntual de la membresía
          <br />
          - Usar adecuadamente las instalaciones y equipamiento
          <br />
          - Respetar el reglamento interno del gimnasio
          <br />- Notificar cualquier condición médica relevante
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: colorTokens.textPrimary, mb: 2, lineHeight: 1.8 }}
        >
          <strong>4. RESPONSABILIDAD:</strong> El SOCIO reconoce que la práctica de ejercicio
          físico conlleva riesgos inherentes y exime a Muscle Up Gym de responsabilidad por
          lesiones o daños que pudieran ocurrir durante el uso de las instalaciones, salvo casos
          de negligencia comprobada del establecimiento.
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: colorTokens.textPrimary, mb: 2, lineHeight: 1.8 }}
        >
          <strong>5. CANCELACIÓN:</strong> El SOCIO podrá solicitar la cancelación de su
          membresía con 30 días de anticipación. No se realizarán reembolsos por días no
          utilizados dentro del periodo de membresía activa.
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: colorTokens.textPrimary, mb: 2, lineHeight: 1.8 }}
        >
          <strong>6. PROTECCIÓN DE DATOS:</strong> Los datos personales proporcionados serán
          tratados conforme a la Ley Federal de Protección de Datos Personales en Posesión de
          los Particulares y únicamente serán utilizados para fines administrativos del gimnasio.
        </Typography>
      </Paper>

      {/* Campo de tutor (si es menor de edad) */}
      {showTutorField && (
        <Box sx={{ mb: 4 }}>
          <Alert
            severity="warning"
            icon={<InfoIcon />}
            sx={{
              mb: 3,
              bgcolor: `${colorTokens.warning}15`,
              color: colorTokens.textPrimary,
              border: `1px solid ${colorTokens.warning}30`,
              '& .MuiAlert-icon': {
                color: colorTokens.warning
              }
            }}
          >
            Como eres menor de edad, necesitamos los datos de tu tutor o padre/madre responsable.
          </Alert>

          <TextField
            {...register('tutorName', {
              required: showTutorField ? 'El nombre del tutor es obligatorio' : false
            })}
            fullWidth
            label="Nombre Completo del Tutor"
            placeholder="Nombre del padre, madre o tutor legal"
            error={!!errors.tutorName}
            helperText={errors.tutorName?.message}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: colorTokens.surfaceLevel1
              }
            }}
          />

          {/* Captura de INE del tutor */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                color: colorTokens.textSecondary,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 18, color: colorTokens.brand }} />
              INE/IFE del Tutor *
            </Typography>

            {tutorINEUrl ? (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 300,
                  height: 180,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `2px solid ${colorTokens.brand}`
                }}
              >
                <Image
                  src={tutorINEUrl}
                  alt="INE del tutor"
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <IconButton
                  onClick={clearTutorINE}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: `${colorTokens.error}dd`,
                    color: 'white',
                    '&:hover': {
                      bgcolor: colorTokens.error
                    }
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCameraIcon />}
                sx={{
                  borderColor: colorTokens.border,
                  color: colorTokens.textPrimary,
                  '&:hover': {
                    borderColor: colorTokens.brand,
                    bgcolor: `${colorTokens.brand}10`
                  }
                }}
              >
                Capturar INE/IFE
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Área de firma */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="body1"
            sx={{
              color: colorTokens.textPrimary,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <DrawIcon sx={{ color: colorTokens.brand }} />
            Firma Digital *
          </Typography>
          <Tooltip title="Limpiar firma" arrow>
            <IconButton
              onClick={clearSignature}
              size="small"
              sx={{
                color: colorTokens.textMuted,
                '&:hover': {
                  color: colorTokens.error
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box
          sx={{
            border: `2px dashed ${colorTokens.border}`,
            borderRadius: 2,
            bgcolor: colorTokens.surfaceLevel1,
            p: 1
          }}
        >
          <canvas
            ref={sigCanvas}
            width={800}
            height={200}
            style={{
              width: '100%',
              height: '200px',
              cursor: 'crosshair',
              display: 'block'
            }}
          />
        </Box>
        <Typography
          variant="caption"
          sx={{ color: colorTokens.textMuted, mt: 1, display: 'block' }}
        >
          Dibuja tu firma en el recuadro usando tu mouse o dedo (en dispositivos táctiles)
        </Typography>
      </Box>

      {/* Checkbox de aceptación */}
      <FormControlLabel
        control={
          <Checkbox
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
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
            He leído y acepto los términos y condiciones del contrato de membresía
          </Typography>
        }
        sx={{ mb: 3 }}
      />

      {/* Error si no acepta términos */}
      {!acceptedTerms && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            bgcolor: `${colorTokens.warning}15`,
            color: colorTokens.textPrimary,
            border: `1px solid ${colorTokens.warning}30`
          }}
        >
          Debes aceptar los términos y condiciones para continuar
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
          disabled={isSubmitting}
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
          endIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
          onClick={onSubmit}
          disabled={!acceptedTerms || isSubmitting}
          sx={{
            bgcolor: colorTokens.success,
            color: 'white',
            px: 4,
            py: 1.5,
            fontWeight: 700,
            boxShadow: `0 4px 14px ${colorTokens.successGlow}`,
            '&:hover': {
              bgcolor: colorTokens.successHover,
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 20px ${colorTokens.successGlow}`
            },
            '&:disabled': {
              bgcolor: colorTokens.neutral600,
              color: colorTokens.textMuted
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isSubmitting ? 'Registrando...' : 'Completar Registro'}
        </Button>
      </Box>
    </Paper>
  );
};

export default ContractSignatureStepV2;
