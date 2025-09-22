// hooks/useFileManagement.ts
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface ImageState {
  url: string;
  fileName: string;
  isLoading: boolean;
  isValid: boolean;
  error: string | null;
  isFromStorage: boolean;
}

interface FileUploadProgress {
  profilePicture: boolean;
  signature: boolean;
  contract: boolean;
}

interface UseFileManagementProps {
  userId?: string;
  onFileUploadComplete?: (fileType: string, url: string) => void;
  onFileError?: (fileType: string, error: string) => void;
}

export const useFileManagement = ({ 
  userId, 
  onFileUploadComplete, 
  onFileError 
}: UseFileManagementProps) => {
  
  // Estados de imágenes
  const [profileImage, setProfileImage] = useState<ImageState>({
    url: '',
    fileName: '',
    isLoading: false,
    isValid: false,
    error: null,
    isFromStorage: false
  });

  const [signatureImage, setSignatureImage] = useState<ImageState>({
    url: '',
    fileName: '',
    isLoading: false,
    isValid: false,
    error: null,
    isFromStorage: false
  });

  // Estados de archivos pendientes
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [signature, setSignature] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [contract, setContract] = useState<File | null>(null);

  // Estados de control
  const [fileUploading, setFileUploading] = useState<FileUploadProgress>({
    profilePicture: false,
    signature: false,
    contract: false
  });

  const [filesLoaded, setFilesLoaded] = useState(false);
  const [contractLastUpdated, setContractLastUpdated] = useState<string | null>(null);

  // Referencias para cleanup
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);

  // ✅ CORRECCIÓN: Referencias estables para funciones de props
  const onFileErrorRef = useRef(onFileError);
  const onFileUploadCompleteRef = useRef(onFileUploadComplete);

  // Actualizar referencias en cada render
  onFileErrorRef.current = onFileError;
  onFileUploadCompleteRef.current = onFileUploadComplete;

  // Función para limpiar blob URLs
  const cleanupBlobUrl = useCallback((url: string) => {
    if (url && url.startsWith('blob:') && blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      blobUrlsRef.current.delete(url);
      console.log('🧹 [CLEANUP] Blob URL limpiada:', url.substring(0, 50) + '...');
    }
  }, []);

  const cleanupAllBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    blobUrlsRef.current.clear();
    console.log('🧹 [CLEANUP] Todas las Blob URLs limpiadas');
  }, []);

  // Función para eliminar archivos antiguos del storage
  const deleteOldFiles = useCallback(async (
    userId: string, 
    fileType: 'profile' | 'signature', 
    exceptFileName?: string
  ) => {
    try {
      const supabase = createBrowserSupabaseClient();
      
      console.log(`🔍 [FILES] Listando archivos existentes para ${fileType}...`);
      
      const { data: files, error } = await supabase.storage
        .from('user-files')
        .list(userId, { 
          limit: 100,
          sortBy: { column: 'updated_at', order: 'desc' }
        });
      
      if (error) {
        console.error('❌ [FILES] Error listing files:', error);
        return;
      }
      
      const filePrefix = fileType === 'profile' ? 'profile-' : 'signature-';
      let oldFiles = files?.filter(file => file.name.startsWith(filePrefix)) || [];
      
      if (exceptFileName) {
        oldFiles = oldFiles.filter(file => file.name !== exceptFileName);
      }
      
      if (oldFiles.length > 0) {
        const filesToDelete = oldFiles.map(file => `${userId}/${file.name}`);
        
        console.log(`🗑️ [FILES] Eliminando ${filesToDelete.length} archivos antiguos...`);
        
        const { error: deleteError } = await supabase.storage
          .from('user-files')
          .remove(filesToDelete);
        
        if (deleteError) {
          console.error('❌ [FILES] Error deleting old files:', deleteError);
        } else {
          console.log(`✅ [FILES] Eliminados ${filesToDelete.length} archivos antiguos`);
        }
      }
    } catch (error) {
      console.error('💥 [FILES] Error in deleteOldFiles:', error);
    }
  }, []);

  // Función para subir archivos al storage
  const uploadFileToStorage = useCallback(async (
    file: File, 
    userId: string, 
    fileType: 'profile' | 'signature'
  ): Promise<{ url: string; path: string } | null> => {
    try {
      console.log(`📤 [UPLOAD] Iniciando subida de ${fileType} para usuario ${userId}`);
      
      const supabase = createBrowserSupabaseClient();
      
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${fileType}-${timestamp}.${fileExtension}`;
      const filePath = `${userId}/${fileName}`;
      
      console.log(`📁 [UPLOAD] Subiendo archivo: ${fileName}`);
      
      const { data, error } = await supabase.storage
        .from('user-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('❌ [UPLOAD] Error:', error);
        throw new Error(`Error subiendo archivo: ${error.message}`);
      }
      
      console.log(`✅ [UPLOAD] Archivo subido exitosamente`);
      
      // Eliminar archivos antiguos
      await deleteOldFiles(userId, fileType, fileName);
      
      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);
      
      if (!publicUrlData?.publicUrl) {
        throw new Error('Error obteniendo URL pública');
      }
      
      console.log(`🎉 [UPLOAD] ${fileType} subido exitosamente`);
      
      return {
        url: publicUrlData.publicUrl,
        path: filePath
      };
      
    } catch (error) {
      console.error(`💥 [UPLOAD] Error crítico subiendo ${fileType}:`, error);
      throw error;
    }
  }, [deleteOldFiles]);

  // Función para descargar imagen desde storage
  const downloadImageFromStorage = useCallback(async (
    fileName: string,
    userId: string,
    type: 'profile' | 'signature'
  ) => {
    if (!fileName || !mountedRef.current) return;
    
    const setter = type === 'profile' ? setProfileImage : setSignatureImage;
    
    setter(prev => ({
      ...prev,
      fileName: fileName,
      isLoading: true,
      isValid: false,
      error: null,
      isFromStorage: true
    }));
    
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Intentar usar URL pública directa
      const publicUrlPath = `${userId}/${fileName}`;
      const { data: publicUrlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(publicUrlPath);
      
      if (publicUrlData?.publicUrl) {
        console.log(`📸 [STORAGE-URL] Usando URL pública para ${type}:`, publicUrlData.publicUrl);
        
        // Verificar que la URL sea accesible
        try {
          const testResponse = await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
          if (testResponse.ok) {
            setter(prev => ({
              ...prev,
              url: publicUrlData.publicUrl,
              isLoading: false,
              isValid: true,
              error: null,
              isFromStorage: true
            }));

            // Usar directamente para preview
            if (type === 'profile') {
              setProfilePicturePreview(publicUrlData.publicUrl);
            } else {
              setSignaturePreview(publicUrlData.publicUrl);
            }
            
            console.log(`✅ [STORAGE-URL] ${type} cargado con URL pública`);
            return;
          }
        } catch (testError) {
          console.warn(`⚠️ [STORAGE-URL] URL pública no accesible para ${type}, intentando descarga`);
        }
      }
      
      // Fallback: Descargar archivo y crear blob
      console.log(`🔄 [STORAGE-DOWNLOAD] Descargando ${type} como fallback...`);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-files')
        .download(publicUrlPath);
      
      if (downloadError || !fileData) {
        throw new Error(`Error descargando archivo: ${downloadError?.message || 'Archivo no encontrado'}`);
      }
      
      const objectUrl = URL.createObjectURL(fileData);
      blobUrlsRef.current.add(objectUrl);
      
      if (!mountedRef.current) {
        cleanupBlobUrl(objectUrl);
        return;
      }
      
      setter(prev => ({
        ...prev,
        url: objectUrl,
        isLoading: false,
        isValid: true,
        error: null,
        isFromStorage: true
      }));

      // Para preview
      if (type === 'profile') {
        setProfilePicturePreview(objectUrl);
      } else {
        setSignaturePreview(objectUrl);
      }
      
      console.log(`✅ [STORAGE-DOWNLOAD] ${type} descargado como blob (fallback)`);
      
    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error(`❌ [STORAGE] Error cargando ${type}:`, error);
      
      setter(prev => ({
        ...prev,
        isLoading: false,
        isValid: false,
        error: error.message,
        isFromStorage: true
      }));

      // ✅ CORRECCIÓN: Usar referencia estable
      onFileErrorRef.current?.(type, error.message);
    }
  }, [cleanupBlobUrl]); // ✅ CORRECCIÓN: Removida onFileError de dependencias

  // Función para descargar PDF desde storage
  const downloadPdfFromStorage = useCallback(async (fileName: string, userId: string): Promise<void> => {
    if (!fileName || !mountedRef.current) return;
    
    try {
      const supabase = createBrowserSupabaseClient();
      
      // Intentar URL pública primero
      const publicUrlPath = `${userId}/${fileName}`;
      const { data: publicUrlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(publicUrlPath);
      
      if (publicUrlData?.publicUrl) {
        console.log(`📄 [PDF-URL] Usando URL pública para contrato:`, publicUrlData.publicUrl);
        
        const timestamp = fileName.match(/contrato-(\d+)\.pdf$/);
        if (timestamp) {
          const date = new Date(parseInt(timestamp[1]));
          setContractLastUpdated(date.toISOString());
        }
        
        console.log(`✅ [PDF-URL] Contrato cargado con URL pública`);
        
        // ✅ CORRECCIÓN: Usar referencia estable
        onFileUploadCompleteRef.current?.('contract', publicUrlData.publicUrl);
        return;
      }
      
      // Fallback: Descargar si es necesario
      console.log(`🔄 [PDF-DOWNLOAD] Descargando contrato como fallback...`);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('user-files')
        .download(publicUrlPath);
      
      if (downloadError || !fileData) {
        throw new Error(`Error descargando PDF: ${downloadError?.message || 'Archivo no encontrado'}`);
      }
      
      const objectUrl = URL.createObjectURL(fileData);
      blobUrlsRef.current.add(objectUrl);
      
      if (!mountedRef.current) {
        cleanupBlobUrl(objectUrl);
        return;
      }
      
      const timestamp = fileName.match(/contrato-(\d+)\.pdf$/);
      if (timestamp) {
        const date = new Date(parseInt(timestamp[1]));
        setContractLastUpdated(date.toISOString());
      }
      
      console.log(`✅ [PDF-DOWNLOAD] Contrato descargado como blob (fallback)`);
      
      // ✅ CORRECCIÓN: Usar referencia estable
      onFileUploadCompleteRef.current?.('contract', objectUrl);
      
    } catch (error: any) {
      console.log(`ℹ️ [PDF] No se pudo descargar el contrato (normal si no existe):`, error.message);
      // ✅ CORRECCIÓN: Usar referencia estable
      onFileErrorRef.current?.('contract', error.message);
    }
  }, [cleanupBlobUrl]); // ✅ CORRECCIÓN: Removidas onFileUploadComplete y onFileError

  // Función para cargar archivos existentes
  const loadExistingFiles = useCallback(async (userId: string) => {
    if (!mountedRef.current) return;
    
    try {
      setFilesLoaded(false);
      
      console.log(`📂 [LOAD-FILES] Cargando archivos existentes para usuario: ${userId}`);
      
      const supabase = createBrowserSupabaseClient();
      
      const { data: files, error } = await supabase.storage
        .from('user-files')
        .list(userId, { 
          limit: 100, 
          offset: 0,
          sortBy: { column: 'updated_at', order: 'desc' }
        });
      
      if (error) {
        throw new Error(`Error listando archivos: ${error.message}`);
      }
      
      console.log(`📁 [LOAD-FILES] Archivos encontrados:`, files?.length || 0);
      
      if (files && files.length > 0) {
        const promises: Promise<void>[] = [];
        
        const latestProfile = files.find(file => file.name.startsWith('profile-'));
        const latestSignature = files.find(file => file.name.startsWith('signature-'));
        const latestContract = files.find(file => file.name.startsWith('contrato-'));
        
        if (latestProfile) {
          console.log('📸 [LOAD-FILES] Cargando foto de perfil:', latestProfile.name);
          promises.push(downloadImageFromStorage(latestProfile.name, userId, 'profile'));
        }
        
        if (latestSignature) {
          console.log('✍️ [LOAD-FILES] Cargando firma:', latestSignature.name);
          promises.push(downloadImageFromStorage(latestSignature.name, userId, 'signature'));
        }
        
        if (latestContract) {
          console.log('📄 [LOAD-FILES] Cargando contrato:', latestContract.name);
          promises.push(downloadPdfFromStorage(latestContract.name, userId));
        }
        
        await Promise.allSettled(promises);
      }
      
      if (mountedRef.current) {
        setFilesLoaded(true);
        console.log('✅ [LOAD-FILES] Carga de archivos completada');
      }
      
    } catch (error: any) {
      if (mountedRef.current) {
        console.error('💥 [LOAD-FILES] Error:', error);
        // ✅ CORRECCIÓN: Usar referencia estable
        onFileErrorRef.current?.('general', `Error cargando archivos: ${error.message}`);
        setFilesLoaded(true); // Marcar como completado aunque haya error
      }
    }
  }, [downloadImageFromStorage, downloadPdfFromStorage]); // ✅ CORRECCIÓN: Removida onFileError

  // Función para manejar cambio de archivos
  const handleFileChange = useCallback((fileType: 'profilePicture' | 'signature' | 'contract') => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      
      console.log(`📁 [FILE] ${fileType} seleccionado:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      let isValid = true;
      let errorMessage = '';
      
      // Validación mejorada
      if (fileType === 'profilePicture' || fileType === 'signature') {
        if (!file.type.startsWith('image/')) {
          isValid = false;
          errorMessage = 'El archivo debe ser una imagen';
        } else if (file.size > 5 * 1024 * 1024) {
          isValid = false;
          errorMessage = 'La imagen no debe exceder 5MB';
        }
      } else if (fileType === 'contract') {
        if (file.type !== 'application/pdf') {
          isValid = false;
          errorMessage = 'El archivo debe ser un PDF';
        } else if (file.size > 10 * 1024 * 1024) {
          isValid = false;
          errorMessage = 'El PDF no debe exceder 10MB';
        }
      }
      
      if (!isValid) {
        // ✅ CORRECCIÓN: Usar referencia estable
        onFileErrorRef.current?.(fileType, errorMessage);
        e.target.value = ''; // Limpiar input
        return;
      }
      
      // Limpiar blob URLs anteriores
      if (fileType === 'profilePicture' && profilePicturePreview) {
        cleanupBlobUrl(profilePicturePreview);
      } else if (fileType === 'signature' && signaturePreview) {
        cleanupBlobUrl(signaturePreview);
      }
      
      // Crear nueva blob URL
      const objectUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(objectUrl);
      
      // Actualizar estados
      if (fileType === 'profilePicture') {
        setProfilePicture(file);
        setProfilePicturePreview(objectUrl);
        setProfileImage(prev => ({
          ...prev,
          url: objectUrl,
          isLoading: false,
          isValid: true,
          error: null,
          isFromStorage: false
        }));
      } else if (fileType === 'signature') {
        setSignature(file);
        setSignaturePreview(objectUrl);
        setSignatureImage(prev => ({
          ...prev,
          url: objectUrl,
          isLoading: false,
          isValid: true,
          error: null,
          isFromStorage: false
        }));
      } else if (fileType === 'contract') {
        setContract(file);
      }
      
      console.log('🔄 [FILE] Archivo pendiente de subida');
      
      // Limpiar input
      e.target.value = '';
    }, [profilePicturePreview, signaturePreview, cleanupBlobUrl]); // ✅ CORRECCIÓN: Removida onFileError

  // Función para subir archivos pendientes
  const uploadPendingFiles = useCallback(async (userId: string) => {
    const uploads: Promise<{ type: string; url: string } | null>[] = [];
    
    if (profilePicture) {
      console.log('📤 [UPLOAD] Subiendo foto de perfil...');
      setFileUploading(prev => ({ ...prev, profilePicture: true }));
      
      uploads.push(
        uploadFileToStorage(profilePicture, userId, 'profile')
          .then(result => {
            if (result) {
              setProfilePicturePreview(result.url);
              setProfileImage(prev => ({
                ...prev,
                url: result.url,
                fileName: result.path.split('/').pop() || '',
                isFromStorage: true
              }));
              return { type: 'profilePicture', url: result.url };
            }
            return null;
          })
          .catch(error => {
            // ✅ CORRECCIÓN: Usar referencia estable
            onFileErrorRef.current?.('profilePicture', error.message);
            throw error;
          })
          .finally(() => {
            setFileUploading(prev => ({ ...prev, profilePicture: false }));
          })
      );
    }
    
    if (signature) {
      console.log('📤 [UPLOAD] Subiendo firma...');
      setFileUploading(prev => ({ ...prev, signature: true }));
      
      uploads.push(
        uploadFileToStorage(signature, userId, 'signature')
          .then(result => {
            if (result) {
              setSignaturePreview(result.url);
              setSignatureImage(prev => ({
                ...prev,
                url: result.url,
                fileName: result.path.split('/').pop() || '',
                isFromStorage: true
              }));
              return { type: 'signature', url: result.url };
            }
            return null;
          })
          .catch(error => {
            // ✅ CORRECCIÓN: Usar referencia estable
            onFileErrorRef.current?.('signature', error.message);
            throw error;
          })
          .finally(() => {
            setFileUploading(prev => ({ ...prev, signature: false }));
          })
      );
    }
    
    const results = await Promise.allSettled(uploads);
    const uploadedFiles: { [key: string]: string } = {};
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        uploadedFiles[result.value.type] = result.value.url;
        // ✅ CORRECCIÓN: Usar referencia estable
        onFileUploadCompleteRef.current?.(result.value.type, result.value.url);
      }
    });
    
    return uploadedFiles;
  }, [profilePicture, signature, uploadFileToStorage]); // ✅ CORRECCIÓN: Removidas onFileUploadComplete y onFileError

  // Función para reintentar carga de imagen
  const retryImageLoad = useCallback((type: 'profile' | 'signature') => {
    const imageState = type === 'profile' ? profileImage : signatureImage;
    if (imageState.fileName && userId) {
      downloadImageFromStorage(imageState.fileName, userId, type);
    }
  }, [profileImage, signatureImage, userId, downloadImageFromStorage]);

  // Función para limpiar archivos pendientes
  const clearPendingFiles = useCallback(() => {
    setProfilePicture(null);
    setSignature(null);
    setContract(null);
    
    // Limpiar previews
    if (profilePicturePreview) {
      cleanupBlobUrl(profilePicturePreview);
      setProfilePicturePreview('');
    }
    
    if (signaturePreview) {
      cleanupBlobUrl(signaturePreview);
      setSignaturePreview('');
    }
  }, [profilePicturePreview, signaturePreview, cleanupBlobUrl]);

  // Función para resetear estados
  const resetFileStates = useCallback(() => {
    cleanupAllBlobUrls();
    
    setProfileImage({
      url: '',
      fileName: '',
      isLoading: false,
      isValid: false,
      error: null,
      isFromStorage: false
    });
    
    setSignatureImage({
      url: '',
      fileName: '',
      isLoading: false,
      isValid: false,
      error: null,
      isFromStorage: false
    });
    
    setProfilePicturePreview('');
    setProfilePicture(null);
    setSignaturePreview('');
    setSignature(null);
    setContract(null);
    setFilesLoaded(false);
    setContractLastUpdated(null);
    
    setFileUploading({
      profilePicture: false,
      signature: false,
      contract: false
    });
  }, [cleanupAllBlobUrls]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanupAllBlobUrls();
    };
  }, [cleanupAllBlobUrls]);

  return {
    // Estados de imágenes
    profileImage,
    signatureImage,
    
    // Estados de archivos pendientes
    profilePicture,
    profilePicturePreview,
    signature,
    signaturePreview,
    contract,
    
    // Estados de control
    fileUploading,
    filesLoaded,
    contractLastUpdated,
    
    // Funciones principales
    handleFileChange,
    loadExistingFiles,
    uploadPendingFiles,
    retryImageLoad,
    clearPendingFiles,
    resetFileStates,
    
    // Utilidades
    cleanupBlobUrl,
    cleanupAllBlobUrls,
    
    // Estados computados
    hasPendingFiles: profilePicture !== null || signature !== null || contract !== null
  };
};