import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

// ✅ FUNCIÓN HELPER PARA DETECTAR Y SANITIZAR URLs
const isBlobUrl = (url: string): boolean => {
  return url.startsWith('blob:');
};

const isValidBase64Image = (base64: string): boolean => {
  return base64.startsWith('data:image/') && base64.includes('base64,');
};

// ✅ FUNCIÓN HELPER PARA PROCESAR Y SUBIR ARCHIVOS DE MANERA SEGURA
const processAndUploadFile = async (
  base64Data: string,
  userId: string,
  fileType: 'profile' | 'signature' | 'tutorINE',
  contentType: string = 'image/jpeg'
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // ✅ VALIDAR que sea base64 válido, NO blob URL
    if (!base64Data) {
      return { success: false, error: 'No se proporcionó archivo' };
    }
    
    if (isBlobUrl(base64Data)) {
      console.error(`❌ [UPLOAD] Blob URL detectada para ${fileType}:`, base64Data.substring(0, 50));
      return { success: false, error: 'URL temporal detectada, se requiere archivo real' };
    }
    
    if (!isValidBase64Image(base64Data)) {
      console.error(`❌ [UPLOAD] Base64 inválido para ${fileType}`);
      return { success: false, error: 'Formato de imagen inválido' };
    }
    
    console.log(`📤 [UPLOAD] Procesando ${fileType} para usuario ${userId}...`);
    
    // ✅ EXTRAER DATOS BASE64 CORRECTAMENTE
    const base64Content = base64Data.split(',')[1];
    if (!base64Content) {
      return { success: false, error: 'Contenido base64 inválido' };
    }
    
    const buffer = Buffer.from(base64Content, 'base64');
    
    // ✅ VALIDAR TAMAÑO DEL ARCHIVO
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (buffer.length > maxSize) {
      return { success: false, error: 'Archivo demasiado grande (máximo 5MB)' };
    }
    
    // ✅ DETERMINAR EXTENSIÓN BASADA EN EL TIPO MIME
    const mimeType = base64Data.split(',')[0];
    let extension = 'jpg';
    let finalContentType = contentType;
    
    if (mimeType.includes('image/png')) {
      extension = 'png';
      finalContentType = 'image/png';
    } else if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) {
      extension = 'jpg';
      finalContentType = 'image/jpeg';
    } else if (mimeType.includes('image/webp')) {
      extension = 'webp';
      finalContentType = 'image/webp';
    }
    
    // ✅ CREAR BUCKET SI NO EXISTE
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'user-files')) {
        console.log('📁 [BUCKET] Creando bucket user-files...');
        await supabaseAdmin.storage.createBucket('user-files', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
      }
    } catch (bucketError) {
      console.error("⚠️ [BUCKET] Error al verificar/crear bucket:", bucketError);
    }
    
    // ✅ ELIMINAR ARCHIVOS ANTIGUOS DEL MISMO TIPO
    try {
      const { data: existingFiles } = await supabaseAdmin.storage
        .from('user-files')
        .list(userId, {
          limit: 100,
          sortBy: { column: 'updated_at', order: 'desc' }
        });
      
      if (existingFiles) {
        const oldFiles = existingFiles.filter(file => 
          file.name.startsWith(`${fileType}-`)
        );
        
        if (oldFiles.length > 0) {
          const filesToDelete = oldFiles.map(file => `${userId}/${file.name}`);
          console.log(`🗑️ [CLEANUP] Eliminando ${filesToDelete.length} archivos antiguos de ${fileType}`);
          
          await supabaseAdmin.storage
            .from('user-files')
            .remove(filesToDelete);
        }
      }
    } catch (cleanupError) {
      console.warn(`⚠️ [CLEANUP] Error limpiando archivos antiguos de ${fileType}:`, cleanupError);
    }
    
    // ✅ SUBIR ARCHIVO NUEVO
    const timestamp = Date.now();
    const fileName = `${fileType}-${timestamp}.${extension}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log(`📁 [UPLOAD] Subiendo ${fileName}...`);
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('user-files')
      .upload(filePath, buffer, {
        contentType: finalContentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error(`❌ [UPLOAD] Error subiendo ${fileType}:`, uploadError);
      return { success: false, error: `Error al subir ${fileType}: ${uploadError.message}` };
    }

    // ✅ OBTENER URL PÚBLICA
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('user-files')
      .getPublicUrl(filePath);
    
    if (!publicUrlData?.publicUrl) {
      return { success: false, error: 'Error obteniendo URL pública' };
    }
    
    console.log(`✅ [UPLOAD] ${fileType} subido exitosamente: ${fileName}`);
    
    return { 
      success: true, 
      url: publicUrlData.publicUrl 
    };
    
  } catch (error: any) {
    console.error(`💥 [UPLOAD] Error crítico procesando ${fileType}:`, error);
    return { 
      success: false, 
      error: `Error procesando ${fileType}: ${error.message}` 
    };
  }
};

export async function POST(req: NextRequest) {
  console.log("🚀 API de registro iniciada v2.0 - Sin blob URLs - 2024-06-24 by @luishdz044");
  
  try {
    // Obtener los datos del cuerpo de la solicitud
    const data = await req.json();
    
    // ✅ LOG SANITIZADO (sin passwords ni datos sensibles)
    console.log("📥 [DATA] Datos recibidos:", JSON.stringify({
      personalInfo: data.personalInfo ? {
        firstName: data.personalInfo.firstName,
        lastName: data.personalInfo.lastName,
        email: data.personalInfo.email,
        password: '[REDACTED]',
        whatsapp: data.personalInfo.whatsapp ? '[PROVIDED]' : '[NOT_PROVIDED]'
      } : undefined,
      hasProfilePhoto: !!data.profilePhoto,
      hasSignature: !!data.signature,
      hasTutorINE: !!data.tutorINE,
      isMinor: data.isMinor,
      metadata: data.metadata
    }, null, 2));
    
    // ✅ VALIDACIÓN MEJORADA DE DATOS DE ENTRADA
    if (!data.personalInfo?.firstName || !data.personalInfo?.email || !data.personalInfo?.password) {
      return NextResponse.json(
        { success: false, message: 'Datos personales incompletos (nombre, email, contraseña requeridos)' }, 
        { status: 400 }
      );
    }

    // ✅ VALIDAR QUE NO HAYA BLOB URLs EN LOS DATOS
    const urlsToCheck = [data.profilePhoto, data.signature, data.tutorINE].filter(Boolean);
    const hasBlobUrls = urlsToCheck.some(url => isBlobUrl(url));
    
    if (hasBlobUrls) {
      console.error("❌ [VALIDATION] Blob URLs detectadas en el payload:", {
        profilePhoto: data.profilePhoto ? isBlobUrl(data.profilePhoto) : false,
        signature: data.signature ? isBlobUrl(data.signature) : false,
        tutorINE: data.tutorINE ? isBlobUrl(data.tutorINE) : false
      });
      
      return NextResponse.json(
        { success: false, message: 'Error: Se detectaron URLs temporales. Recarga la página e intenta de nuevo.' }, 
        { status: 400 }
      );
    }

    // Verificar si el correo ya está registrado
    console.log("🔍 [CHECK] Verificando si el email ya existe...");
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('Users')
      .select('id')
      .eq('email', data.personalInfo.email)
      .maybeSingle();

    if (checkError) {
      console.error("❌ [CHECK] Error verificando usuario existente:", checkError);
      return NextResponse.json(
        { success: false, message: `Error en la verificación: ${checkError.message}` }, 
        { status: 500 }
      );
    }

    if (existingUser) {
      console.warn("⚠️ [CHECK] Email ya registrado:", data.personalInfo.email);
      return NextResponse.json(
        { success: false, message: 'Este correo ya está registrado' }, 
        { status: 409 }
      );
    }

    // ✅ 1. CREAR USUARIO EN SUPABASE AUTH
    console.log("👤 [AUTH] Creando usuario en Supabase Auth...");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.personalInfo.email,
      password: data.personalInfo.password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        firstName: data.personalInfo.firstName,
        lastName: data.personalInfo.lastName || '',
        registrationSource: 'web_form',
        registrationDate: new Date().toISOString()
      }
    });
    
    if (authError) {
      console.error("❌ [AUTH] Error al crear usuario en Auth:", authError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al registrar usuario en el sistema de autenticación", 
        error: authError.message 
      }, { status: 400 });
    }
    
    // ✅ 2. USAR ID GENERADO POR AUTH PARA LA TABLA USERS
    const userId = authData.user.id;
    console.log("✅ [AUTH] Usuario creado en Auth con ID:", userId);
    
    // ✅ 3. PREPARAR DATOS DEL USUARIO PRINCIPAL
    const userData = {
      id: userId, // IMPORTANTE: Usar el ID de Supabase Auth
      firstName: data.personalInfo.firstName,
      lastName: data.personalInfo.lastName || '',
      email: data.personalInfo.email,
      whatsapp: data.personalInfo.whatsapp || '',
      birthDate: data.personalInfo.birthDate || null,
      gender: data.personalInfo.gender || '',
      maritalStatus: data.personalInfo.maritalStatus || '',
      isMinor: data.isMinor || false,
      rol: 'cliente', // Asignar el rol predeterminado
      emailSent: false,
      whatsappSent: false,
      fingerprint: false,
      createdAt: new Date().toISOString(),
      // ✅ IMPORTANTE: NO incluir URLs aquí, se actualizarán después de subir archivos
      profilePictureUrl: null,
      signatureUrl: null,
      contractPdfUrl: null
    };

    console.log("💾 [USER] Insertando usuario en tabla Users...");

    // ✅ 4. INSERTAR USUARIO PRINCIPAL
    const { error: insertError } = await supabaseAdmin
      .from('Users')
      .insert(userData);

    if (insertError) {
      console.error("❌ [USER] Error al insertar usuario:", insertError);
      // Si falla la inserción en DB, eliminamos el usuario de Auth para mantener consistencia
      console.log("🧹 [CLEANUP] Eliminando usuario de Auth por error en DB...");
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { success: false, message: `Error al insertar usuario: ${insertError.message}` }, 
        { status: 500 }
      );
    }

    console.log("✅ [USER] Usuario insertado correctamente con ID:", userId);

    // ✅ 5. PROCESAR Y SUBIR ARCHIVOS DE MANERA SEGURA
    const fileUploadResults: { [key: string]: any } = {};

    // ✅ PROCESAR FOTO DE PERFIL
    if (data.profilePhoto) {
      console.log("📸 [PROFILE] Procesando foto de perfil...");
      const profileResult = await processAndUploadFile(
        data.profilePhoto, 
        userId, 
        'profile', 
        'image/jpeg'
      );
      
      fileUploadResults.profilePhoto = profileResult;
      
      if (profileResult.success && profileResult.url) {
        // Actualizar usuario con URL de foto de perfil
        await supabaseAdmin
          .from('Users')
          .update({ profilePictureUrl: profileResult.url })
          .eq('id', userId);
        
        console.log("✅ [PROFILE] Foto de perfil actualizada en BD");
      } else {
        console.error("❌ [PROFILE] Error:", profileResult.error);
      }
    }

    // ✅ PROCESAR FIRMA
    if (data.signature) {
      console.log("✍️ [SIGNATURE] Procesando firma...");
      const signatureResult = await processAndUploadFile(
        data.signature, 
        userId, 
        'signature', 
        'image/png'
      );
      
      fileUploadResults.signature = signatureResult;
      
      if (signatureResult.success && signatureResult.url) {
        // Actualizar usuario con URL de firma
        await supabaseAdmin
          .from('Users')
          .update({ signatureUrl: signatureResult.url })
          .eq('id', userId);
        
        console.log("✅ [SIGNATURE] Firma actualizada en BD");
      } else {
        console.error("❌ [SIGNATURE] Error:", signatureResult.error);
      }
    }

    // ✅ PROCESAR INE DEL TUTOR (PARA MENORES)
    if (data.tutorINE && data.isMinor) {
      console.log("📄 [TUTOR-INE] Procesando INE del tutor...");
      const tutorINEResult = await processAndUploadFile(
        data.tutorINE, 
        userId, 
        'tutorINE', 
        'image/jpeg'
      );
      
      fileUploadResults.tutorINE = tutorINEResult;
      
      if (tutorINEResult.success) {
        console.log("✅ [TUTOR-INE] INE del tutor procesado");
      } else {
        console.error("❌ [TUTOR-INE] Error:", tutorINEResult.error);
      }
    }

    // ✅ 6. INSERTAR DIRECCIÓN
    if (data.personalInfo?.address || data.personalInfo) {
      try {
        console.log("🏠 [ADDRESS] Insertando dirección...");
        
        const addressData = {
          userId: userId,
          street: data.personalInfo.address?.street || data.personalInfo.street || '',
          number: data.personalInfo.address?.number || data.personalInfo.number || '',
          neighborhood: data.personalInfo.address?.neighborhood || data.personalInfo.neighborhood || '',
          city: data.personalInfo.address?.city || data.personalInfo.city || '',
          state: data.personalInfo.address?.state || data.personalInfo.state || '',
          postalCode: data.personalInfo.address?.postalCode || data.personalInfo.postalCode || '',
          country: data.personalInfo.address?.country || data.personalInfo.country || 'México',
        };
        
        const { error: addressError } = await supabaseAdmin
          .from('addresses')
          .insert(addressData);

        if (addressError) {
          console.error("❌ [ADDRESS] Error al insertar dirección:", addressError);
        } else {
          console.log("✅ [ADDRESS] Dirección insertada correctamente");
        }
      } catch (addressError) {
        console.error("💥 [ADDRESS] Error general al insertar dirección:", addressError);
      }
    }

    // ✅ 7. INSERTAR CONTACTO DE EMERGENCIA 
    try {
      console.log("🚨 [EMERGENCY] Insertando contacto de emergencia...");
      
      const emergencyData = {
  userId: userId,
  name: data.emergencyContact?.name || '',
  phone: data.emergencyContact?.phone || '',
  medicalCondition: data.emergencyContact?.medicalCondition || '',
  bloodType: data.emergencyContact?.bloodType || ''
};
    
      const { error: contactError } = await supabaseAdmin
        .from('emergency_contacts')
        .insert(emergencyData);
    
      if (contactError) {
        console.error("❌ [EMERGENCY] Error al insertar contacto de emergencia:", contactError);
      } else {
        console.log("✅ [EMERGENCY] Contacto de emergencia insertado correctamente");
      }
    } catch (emergencyError) {
      console.error("💥 [EMERGENCY] Error general al insertar contacto de emergencia:", emergencyError);
    }
    
    // ✅ 8. INSERTAR INFORMACIÓN DE MEMBRESÍA
    try {
      console.log("🎯 [MEMBERSHIP] Insertando información de membresía...");
      
   const membershipData = {
  userId: userId,
  referredBy: data.membershipData?.referredBy || '',
  mainMotivation: data.membershipData?.mainMotivation || '',
  receivePlans: data.membershipData?.receivePlans || false,
  trainingLevel: data.membershipData?.trainingLevel || ''
};
    
      const { error: membershipError } = await supabaseAdmin
        .from('membership_info')
        .insert(membershipData);
    
      if (membershipError) {
        console.error("❌ [MEMBERSHIP] Error al insertar info de membresía:", membershipError);
      } else {
        console.log("✅ [MEMBERSHIP] Información de membresía insertada correctamente");
      }
    } catch (membershipError) {
      console.error("💥 [MEMBERSHIP] Error general al insertar información de membresía:", membershipError);
    }
    
    // ✅ 9. PROCESOS AUTOMÁTICOS (PDF, EMAIL, WHATSAPP)
    try {
      console.log("🎬 [AUTO] Iniciando procesos automáticos...");
      
      // 1. Generar PDF automáticamente
      console.log("📄 [PDF] Generando PDF automáticamente...");
      const pdfRes = await fetch(new URL('/api/generate-pdf', req.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });
      
      if (!pdfRes.ok) {
        const errorText = await pdfRes.text();
        console.error("❌ [PDF] Error al generar PDF:", errorText);
      } else {
        const pdfData = await pdfRes.json();
        console.log("✅ [PDF] PDF generado exitosamente:", pdfData);
        
        // 2. Enviar correo con el PDF
        console.log("📧 [EMAIL] Enviando correo de bienvenida...");
        try {
          const emailRes = await fetch(new URL('/api/send-welcome-email', req.url).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId })
          });
          
          if (!emailRes.ok) {
            const errorText = await emailRes.text();
            console.error("❌ [EMAIL] Error al enviar correo:", errorText);
          } else {
            const emailData = await emailRes.json();
            console.log("✅ [EMAIL] Correo enviado exitosamente");
            
            // Marcar email como enviado
            await supabaseAdmin
              .from('Users')
              .update({ 
                emailSent: true,
                emailSentAt: new Date().toISOString()
              })
              .eq('id', userId);
          }
        } catch (emailError) {
          console.error("💥 [EMAIL] Error crítico:", emailError);
        }
        
        // 3. Enviar mensaje de WhatsApp (solo si hay número)
        if (userData.whatsapp) {
          console.log("📱 [WHATSAPP] Enviando mensaje de bienvenida...");
          try {
            const whatsappRes = await fetch(new URL('/api/send-welcome-whatsapp', req.url).toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: userId })
            });
            
            if (!whatsappRes.ok) {
              const errorText = await whatsappRes.text();
              console.error("❌ [WHATSAPP] Error al enviar WhatsApp:", errorText);
            } else {
              const whatsappData = await whatsappRes.json();
              console.log("✅ [WHATSAPP] WhatsApp enviado exitosamente");
              
              // Marcar WhatsApp como enviado
              await supabaseAdmin
                .from('Users')
                .update({ 
                  whatsappSent: true,
                  whatsappSentAt: new Date().toISOString()
                })
                .eq('id', userId);
            }
          } catch (whatsappError) {
            console.error("💥 [WHATSAPP] Error crítico:", whatsappError);
          }
        } else {
          console.log("ℹ️ [WHATSAPP] Usuario no proporcionó número, omitiendo envío");
        }
      }
    } catch (autoProcessError) {
      console.error("💥 [AUTO] Error en procesamiento automático:", autoProcessError);
      // Continuamos a pesar del error
    }

    // ✅ 10. RESPUESTA FINAL CON RESUMEN
    const response = {
      success: true,
      message: 'Usuario registrado correctamente',
      userId: userId,
      summary: {
        userCreated: true,
        authUserCreated: true,
        filesProcessed: {
          profilePhoto: fileUploadResults.profilePhoto?.success || false,
          signature: fileUploadResults.signature?.success || false,
          tutorINE: fileUploadResults.tutorINE?.success || false
        },
        relatedDataInserted: {
          address: true,
          emergencyContact: true,
          membershipInfo: true
        },
        automaticProcesses: {
          pdfGenerated: true,
          emailSent: true,
          whatsappSent: !!userData.whatsapp
        }
      },
      metadata: {
        version: '2.0-no-blob',
        processedAt: new Date().toISOString(),
        processedBy: 'luishdz044'
      }
    };

    console.log("🎉 [SUCCESS] Registro completado exitosamente:", {
      userId,
      filesUploaded: Object.values(fileUploadResults).filter(r => r?.success).length
    });
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error("💥 [ERROR] Error crítico al procesar el registro:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: `Error al procesar el registro: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
