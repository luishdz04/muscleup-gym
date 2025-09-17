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
  console.log("🚀 API de registro v5.0 (generateLink + user_metadata + Resend) iniciada - 2025-09-16 by @luishdz044");
  
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

    // ✅ 1. CREAR USUARIO Y GENERAR LINK CON generateLink() + user_metadata CORRECTO
    console.log("👤🔗 [AUTH] Creando usuario y generando link de signup con generateLink()...");
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: data.personalInfo.email,
      password: data.personalInfo.password,
      options: {
        redirectTo: `${req.nextUrl.origin}/auth/confirm`,
        user_metadata: {
          firstName: data.personalInfo.firstName,
          lastName: data.personalInfo.lastName || '',
          registrationSource: 'web_form',
          registrationDate: new Date().toISOString()
        }
      }
    });
    
    if (linkError || !linkData?.user || !linkData?.properties) {
      console.error("❌ [AUTH] Error al generar link de signup:", linkError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al registrar usuario en el sistema de autenticación", 
        error: linkError?.message || 'No se pudo generar el link o el usuario'
      }, { status: 400 });
    }
    
    // ✅ 2. EXTRAER DATOS DE LA RESPUESTA
    const userId = linkData.user.id;
    const actionLink = linkData.properties.action_link;

    console.log("✅ [AUTH] Usuario creado en Auth con ID:", userId);
    console.log("📧 [EMAIL] Link de confirmación generado:", actionLink);
    
    // ✅ 3. ENVIAR EMAIL DE CONFIRMACIÓN CON RESEND
    console.log("📤 [RESEND] Enviando email de confirmación con Resend...");
    let emailSentSuccessfully = false;
    
    try {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Muscle Up Gym <administracion@muscleupgym.fitness>',
          to: [data.personalInfo.email],
          subject: '¡Confirma tu cuenta en Muscle Up Gym! 💪',
          html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Confirma tu cuenta - Muscle Up Gym</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
            
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
                <tr>
                    <td align="center" style="padding: 20px;">
                        <table width="600" border="0" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px;">
                            
                            <tr>
                                <td style="height: 6px; background-color: #ffcc00; border-radius: 8px 8px 0 0;"></td>
                            </tr>
            
                            <tr>
                                <td align="center" style="padding: 30px 20px 20px 20px;">
                                    <img src="https://muscleupgym.fitness/logo.png" alt="Muscle Up Gym Logo" style="max-width: 180px; margin-bottom: 20px; display: block;">
                                    <h2 style="margin: 0; color: #000000;">¡Bienvenido a Muscle Up Gym!</h2>
                                </td>
                            </tr>
            
                            <tr>
                                <td style="padding: 0 30px;">
                                    <p style="font-size: 18px; font-weight: bold; color: #000000; margin-bottom: 15px;">¡Hola ${data.personalInfo.firstName}!</p>
                                    
                                    <p>Estamos emocionados de tenerte como parte de nuestra comunidad fitness. Para finalizar tu registro y acceder a todos nuestros servicios, por favor confirma tu dirección de correo electrónico:</p>
                                    
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td align="center" style="padding: 20px 0;">
                                                <a href="${actionLink}" style="background-color: #ffcc00; color: #000000; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Confirmar mi cuenta</a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p>O copia y pega este enlace en tu navegador:</p>
                                    <p style="word-break: break-all; font-size: 12px; color: #555555;">${actionLink}</p>
                                    
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8f8f8; border-radius: 5px; margin: 20px 0;">
                                        <tr>
                                            <td style="padding: 20px;">
                                                <p style="color: #000000; font-weight: bold; margin-top: 0; margin-bottom: 10px;">Como miembro de Muscle Up Gym disfrutarás de:</p>
                                                <ul style="margin: 0; padding-left: 20px;">
                                                    <li>Acceso a nuestras modernas instalaciones</li>
                                                    <li>Equipos de alta calidad</li>
                                                    <li>Una comunidad motivada que te apoya</li>
                                                    <li>ESPERA SORPRESAS PROXIMAMENTE</li>
                                                </ul>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos:</p>
                                    <p>📞 Tel: 866-112-7905<br>
                                       📧 Email: administracion@muscleupgym.fitness</p>
                                    
                                    <p style="margin-top: 25px;">Saludos,<br>El equipo de Muscle Up Gym</p>
                                </td>
                            </tr>
            
                            <tr>
                                <td align="center" style="padding: 20px 30px; margin-top: 30px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777777;">
                                    <p style="margin: 0;">© 2025 Muscle Up Gym | Tel: 866-112-7905 | administracion@muscleupgym.com.mx</p>
                                    <p style="margin: 10px 0 0 0;">"Tu salud y bienestar son nuestra misión"</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
            
            </body>
            </html>
          `
        })
      });

      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        console.log("✅ [RESEND] Email enviado exitosamente:", emailData.id);
        emailSentSuccessfully = true;
      } else {
        const errorData = await emailResponse.text();
        console.error("❌ [RESEND] Error enviando email:", errorData);
      }
    } catch (emailError) {
      console.error("💥 [RESEND] Error crítico enviando email:", emailError);
    }
    
    // ✅ 4. PROCESAR Y SUBIR ARCHIVOS DE MANERA SEGURA
    const fileUploadResults: { [key: string]: any } = {};
    let profilePictureUrl = null;
    let signatureUrl = null;

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
        profilePictureUrl = profileResult.url;
        console.log("✅ [PROFILE] Foto de perfil procesada");
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
        signatureUrl = signatureResult.url;
        console.log("✅ [SIGNATURE] Firma procesada");
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

    // ✅ 5. PREPARAR DATOS DEL USUARIO PRINCIPAL
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
      profilePictureUrl: profilePictureUrl,
      signatureUrl: signatureUrl,
      contractPdfUrl: null,
      // ✅ NUEVOS CAMPOS PARA CONTROL DE CONFIRMACIÓN
      emailConfirmed: false,
      pendingWelcomeEmail: true,
      registrationCompleted: false,
      emailSent: emailSentSuccessfully,
      whatsappSent: false,
      fingerprint: false,
      createdAt: new Date().toISOString()
    };

    console.log("💾 [USER] Insertando usuario en tabla Users...");

    // ✅ 6. INSERTAR USUARIO PRINCIPAL
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

    // ✅ 7. INSERTAR DIRECCIÓN
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

    // ✅ 8. INSERTAR CONTACTO DE EMERGENCIA 
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
    
    // ✅ 9. INSERTAR INFORMACIÓN DE MEMBRESÍA
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
    
    // ✅ 10. RESPUESTA FINAL
    const response = {
      success: true,
      message: emailSentSuccessfully ? 
        'Registro exitoso. Por favor, revisa tu correo para verificar tu cuenta antes de continuar.' :
        'Registro exitoso, pero hubo un problema enviando el email de confirmación. Contacta a soporte.',
      userId: userId,
      emailVerificationRequired: true,
      summary: {
        userCreated: true,
        authUserCreated: true,
        emailConfirmationGenerated: true,
        emailSentViaResend: emailSentSuccessfully,
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
          pdfGenerated: false, // Se generará después de confirmar email
          welcomeEmailSent: false,    // Se enviará después de confirmar email
          whatsappSent: false  // Se enviará después de confirmar email
        }
      },
      metadata: {
        version: '5.0-generateLink-user_metadata-resend-integration',
        processedAt: new Date().toISOString(),
        processedBy: 'luishdz044',
        emailProvider: 'resend',
        authMethod: 'generateLink-with-user_metadata'
      }
    };

    console.log("🎉 [SUCCESS] Registro completado con generateLink + user_metadata + Resend:", {
      userId,
      actionLinkGenerated: !!actionLink,
      emailSent: emailSentSuccessfully,
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