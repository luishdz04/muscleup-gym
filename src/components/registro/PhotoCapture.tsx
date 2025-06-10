'use client';

import { useState, useRef, useEffect } from 'react';
import styles from '@/styles/registro/RegistroWizard.module.css';

interface PhotoCaptureProps {
  onPhotoCapture: (file: File) => void;
  previewUrl: string | null;
  onClearPhoto: () => void;
  label: string;
  tooltip?: string;
  inputId: string;
  errorMessage?: string;
}

export default function PhotoCapture({
  onPhotoCapture,
  previewUrl,
  onClearPhoto,
  label,
  tooltip,
  inputId,
  errorMessage
}: PhotoCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Detectar si hay cámara disponible
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

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
      
      // Validar el tamaño del archivo (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('La imagen es demasiado grande (máx. 10MB)');
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
    <div className="space-y-3">
      <div className="flex items-center">
        <label className="block font-medium">{label} <span className="text-yellow-400">*</span></label>
        {tooltip && (
          <span className={styles.tooltip} title={tooltip}>❔</span>
        )}
      </div>
      
      {!isCapturing ? (
        <>
          <input
            ref={inputRef}
            type="file"
            id={inputId}
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            aria-label={`Upload ${label}`}
          />
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleFileSelection}
              className={styles.photoButton}
            >
              <span className="mr-2">📁</span> Subir foto
            </button>
            
            {hasCamera !== false && (
              <button
                type="button"
                onClick={startCamera}
                className={styles.photoButton}
              >
                <span className="mr-2">📷</span> Tomar foto
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-lg overflow-hidden bg-zinc-800 p-2">
          <video 
            ref={videoRef} 
            className="w-full rounded" 
            autoPlay 
            playsInline
            muted
          />
          
          <div className="flex justify-between mt-2">
            <button
              type="button"
              onClick={stopCamera}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm"
            >
              Cancelar
            </button>
            
            <button
              type="button"
              onClick={capturePhoto}
              className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1.5 rounded text-sm font-medium"
            >
              Capturar
            </button>
          </div>
        </div>
      )}
      
      {/* Canvas oculto para procesamiento */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Previsualización de la imagen */}
      {previewUrl && (
        <div className={styles.imagePreview}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm">Foto seleccionada:</p>
            <button 
              type="button" 
              onClick={onClearPhoto}
              className="text-red-500 text-sm hover:text-red-400"
            >
              Eliminar
            </button>
          </div>
          <img 
            src={previewUrl} 
            alt="Vista previa" 
            className="max-h-32 max-w-full object-contain mx-auto"
          />
        </div>
      )}
      
      {(errorMessage || error) && (
        <p className={styles.errorText}>{errorMessage || error}</p>
      )}
    </div>
  );
}