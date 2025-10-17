'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, Typography, Avatar } from '@mui/material';
import { 
  CloudUpload as UploadIcon,
  PhotoCamera as CameraIcon,
  Person as PersonIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// 🎨 DARK PRO TOKENS
const darkProTokens = {
  background: '#000000',
  surfaceLevel1: '#121212',
  surfaceLevel2: '#1E1E1E',
  primary: '#FFCC00',
  primaryHover: '#E6B800',
  success: '#388E3C',
  error: '#D32F2F',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textDisabled: '#888888'
};

interface PhotoCaptureProps {
  onPhotoCapture: (file: File) => void;
  previewUrl: string | null;
  onClearPhoto: () => void;
  label: string;
  errorMessage?: string;
}

export default function PhotoCapture({
  onPhotoCapture,
  previewUrl,
  onClearPhoto,
  label,
  errorMessage
}: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Comprobar si hay cámara disponible al cargar
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setHasCamera(false);
      return;
    }
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        // Liberar el stream inmediatamente, sólo estamos comprobando
        stream.getTracks().forEach(track => track.stop());
        setHasCamera(true);
      })
      .catch(() => {
        console.log('Cámara no disponible');
        setHasCamera(false);
      });
  }, []);

  // Limpiar stream al desmontar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCapturing(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tu navegador no soporta acceso a la cámara");
      }
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };
      
      const streamObj = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(streamObj);
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamObj;
        await videoRef.current.play().catch(e => {
          console.error("Error al reproducir video:", e);
          throw new Error("No se pudo inicializar el video");
        });
      } else {
        throw new Error("Error al inicializar el video");
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error);
      setError('No se pudo acceder a la cámara. Intenta subir una foto.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Error al capturar imagen');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Asegurar que el video esté reproduciendo
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setError('La cámara no está lista. Intenta de nuevo.');
      return;
    }
    
    try {
      // Configurar el canvas al tamaño del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujar el fotograma actual en el canvas
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertir a blob con buena calidad
      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Error al procesar la imagen');
          return;
        }
        
        // Crear un archivo a partir del blob con timestamp para evitar caché
        const timestamp = new Date().getTime();
        const file = new File([blob], `camera-photo-${timestamp}.jpg`, { type: 'image/jpeg' });
        onPhotoCapture(file);
        stopCamera();
      }, 'image/jpeg', 0.9); // Calidad 90%
    } catch (e) {
      console.error('Error al capturar foto:', e);
      setError('Error al capturar la imagen');
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      return;
    }
    
    try {
      const file = files[0];
      
      // Validar el tamaño del archivo (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen es demasiado grande (máx. 5MB)');
        return;
      }
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('El archivo debe ser una imagen');
        return;
      }
      
      onPhotoCapture(file);
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      setError('Error al procesar el archivo');
    }
  };

  const handleFileSelection = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{
        color: darkProTokens.primary,
        fontWeight: 600,
        fontSize: { xs: '1rem', sm: '1.25rem' }
      }}>
        {label}
      </Typography>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'center', sm: 'center' },
        gap: { xs: 2, sm: 3 },
        mb: 2
      }}>
        {/* Avatar Preview */}
        <Avatar
          src={previewUrl || undefined}
          sx={{
            width: { xs: 100, sm: 120 },
            height: { xs: 100, sm: 120 },
            bgcolor: darkProTokens.primary,
            color: darkProTokens.background,
            fontSize: { xs: '1.5rem', sm: '2rem' },
            border: `3px solid ${darkProTokens.primary}30`
          }}
        >
          {!previewUrl && <PersonIcon sx={{ fontSize: { xs: '2.5rem', sm: '3rem' } }} />}
        </Avatar>

        {/* Controls */}
        <Box sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
          {!isCapturing ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />

              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1.5, sm: 2 },
                mb: 2
              }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
                  onClick={handleFileSelection}
                  fullWidth={{ xs: true, sm: false }}
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    borderColor: darkProTokens.primary,
                    color: darkProTokens.primary,
                    '&:hover': {
                      borderColor: darkProTokens.primaryHover,
                      backgroundColor: `${darkProTokens.primary}10`
                    }
                  }}
                >
                  Subir Foto
                </Button>
                
                {hasCamera !== false && (
                  <Button
                    variant="outlined"
                    startIcon={<CameraIcon />}
                    onClick={startCamera}
                    sx={{
                      borderColor: darkProTokens.primary,
                      color: darkProTokens.primary,
                      '&:hover': {
                        borderColor: darkProTokens.primaryHover,
                        backgroundColor: `${darkProTokens.primary}10`
                      }
                    }}
                  >
                    Tomar Foto
                  </Button>
                )}
              </Box>

              {previewUrl && (
                <Button
                  variant="text"
                  size="small"
                  startIcon={<CloseIcon />}
                  onClick={onClearPhoto}
                  sx={{ color: darkProTokens.error }}
                >
                  Remover imagen
                </Button>
              )}
            </>
          ) : (
            <Box sx={{
              border: `2px solid ${darkProTokens.primary}`,
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: darkProTokens.surfaceLevel2
            }}>
              <video 
                ref={videoRef} 
                style={{ 
                  width: '100%', 
                  maxWidth: '400px',
                  height: 'auto'
                }}
                autoPlay 
                playsInline
                muted
              />
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                p: 2,
                backgroundColor: darkProTokens.surfaceLevel1
              }}>
                <Button
                  variant="contained"
                  onClick={stopCamera}
                  sx={{
                    backgroundColor: darkProTokens.error,
                    '&:hover': { backgroundColor: '#B71C1C' }
                  }}
                >
                  Cancelar
                </Button>
                
                <Button
                  variant="contained"
                  onClick={capturePhoto}
                  sx={{
                    backgroundColor: darkProTokens.primary,
                    color: darkProTokens.background,
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: darkProTokens.primaryHover
                    }
                  }}
                >
                  Capturar
                </Button>
              </Box>
            </Box>
          )}

          <Typography variant="caption" sx={{ 
            color: darkProTokens.textDisabled, 
            display: 'block',
            mt: 1
          }}>
            Formatos: JPG, PNG, GIF. Máximo 5MB
          </Typography>
        </Box>
      </Box>

      {/* Canvas oculto para procesamiento */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Errores */}
      {(errorMessage || error) && (
        <Typography sx={{ 
          color: darkProTokens.error, 
          fontSize: '0.875rem',
          mt: 1
        }}>
          {errorMessage || error}
        </Typography>
      )}
    </Box>
  );
}