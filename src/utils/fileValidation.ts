export const FILE_VALIDATIONS = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    minWidth: 100,
    minHeight: 100,
    maxWidth: 4000,
    maxHeight: 4000
  },
  document: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'],
    allowedExtensions: ['.pdf']
  },
  signature: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    minWidth: 200,
    minHeight: 100,
    maxWidth: 1000,
    maxHeight: 500
  }
} as const;

export type FileType = keyof typeof FILE_VALIDATIONS;

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export const validateFile = async (
  file: File, 
  type: FileType
): Promise<FileValidationResult> => {
  const config = FILE_VALIDATIONS[type];
  const warnings: string[] = [];
  
  // ✅ VALIDACIÓN DE TAMAÑO
  if (file.size > config.maxSize) {
    return { 
      isValid: false, 
      error: `Archivo muy grande. Máximo ${(config.maxSize / 1024 / 1024).toFixed(1)}MB` 
    };
  }
  
  // ✅ VALIDACIÓN DE TIPO
  if (!config.allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Tipo no permitido. Solo: ${config.allowedExtensions.join(', ')}` 
    };
  }

  // ✅ VALIDACIÓN DE DIMENSIONES PARA IMÁGENES
  if (type === 'image' || type === 'signature') {
    try {
      const dimensions = await getImageDimensions(file);
      
      if (dimensions.width < config.minWidth! || dimensions.height < config.minHeight!) {
        return {
          isValid: false,
          error: `Imagen muy pequeña. Mínimo ${config.minWidth}x${config.minHeight}px`
        };
      }
      
      if (dimensions.width > config.maxWidth! || dimensions.height > config.maxHeight!) {
        return {
          isValid: false,
          error: `Imagen muy grande. Máximo ${config.maxWidth}x${config.maxHeight}px`
        };
      }

      // ✅ WARNINGS PARA DIMENSIONES SUBÓPTIMAS
      if (type === 'image') {
        if (dimensions.width < 300 || dimensions.height < 300) {
          warnings.push('Imagen de baja resolución, considera usar una imagen más grande');
        }
      }
      
      if (type === 'signature') {
        if (dimensions.width < 400 || dimensions.height < 200) {
          warnings.push('Firma pequeña, considera una imagen más grande para mejor calidad');
        }
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'Error al validar dimensiones de imagen'
      };
    }
  }

  // ✅ VALIDACIÓN DE NOMBRE DE ARCHIVO
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'Nombre de archivo muy largo (máximo 255 caracteres)'
    };
  }

  // ✅ VALIDACIÓN DE CARACTERES ESPECIALES
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(file.name)) {
    return {
      isValid: false,
      error: 'Nombre de archivo contiene caracteres no permitidos'
    };
  }
  
  return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
};

// ✅ FUNCIÓN AUXILIAR PARA OBTENER DIMENSIONES
const getImageDimensions = (file: File): Promise<{width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error al cargar imagen'));
    };
    
    img.src = url;
  });
};

// ✅ VALIDADOR DE MÚLTIPLES ARCHIVOS
export const validateMultipleFiles = async (
  files: FileList | File[],
  type: FileType,
  maxFiles: number = 10
): Promise<{
  validFiles: File[];
  invalidFiles: { file: File; error: string }[];
  warnings: string[];
}> => {
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const invalidFiles: { file: File; error: string }[] = [];
  const allWarnings: string[] = [];

  if (fileArray.length > maxFiles) {
    return {
      validFiles: [],
      invalidFiles: fileArray.map(file => ({ 
        file, 
        error: `Máximo ${maxFiles} archivos permitidos` 
      })),
      warnings: []
    };
  }

  for (const file of fileArray) {
    const validation = await validateFile(file, type);
    
    if (validation.isValid) {
      validFiles.push(file);
      if (validation.warnings) {
        allWarnings.push(...validation.warnings);
      }
    } else {
      invalidFiles.push({ file, error: validation.error! });
    }
  }

  return {
    validFiles,
    invalidFiles,
    warnings: [...new Set(allWarnings)] // Eliminar duplicados
  };
};