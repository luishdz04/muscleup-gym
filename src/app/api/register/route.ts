import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function POST(req: NextRequest) {
  console.log("API de registro iniciada con Supabase Auth");
  try {
    // Obtener los datos del cuerpo de la solicitud
    const data = await req.json();
    console.log("Datos recibidos:", JSON.stringify({
      ...data,
      personalInfo: data.personalInfo ? {
        ...data.personalInfo,
        password: '[REDACTED]'
      } : undefined
    }, null, 2));
    
    // Validación básica
    if (!data.personalInfo?.firstName || !data.personalInfo?.email || !data.personalInfo?.password) {
      return NextResponse.json(
        { success: false, message: 'Datos incompletos' }, 
        { status: 400 }
      );
    }

    // Verificar si el correo ya está registrado
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('Users')
      .select('id')
      .eq('email', data.personalInfo.email)
      .maybeSingle();

    if (checkError) {
      console.error("Error verificando usuario existente:", checkError);
      return NextResponse.json(
        { success: false, message: `Error en la verificación: ${checkError.message}` }, 
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Este correo ya está registrado' }, 
        { status: 409 }
      );
    }

    // 1. NUEVO: Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.personalInfo.email,
      password: data.personalInfo.password,
      email_confirm: true, // Auto-confirmar email (no requiere verificación)
      user_metadata: {
        firstName: data.personalInfo.firstName,
        lastName: data.personalInfo.lastName || ''
      }
    });
    
    if (authError) {
      console.error("Error al crear usuario en Auth:", authError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al registrar usuario en el sistema de autenticación", 
        error: authError.message 
      }, { status: 400 });
    }
    
    // 2. Usar el ID generado por Auth para la tabla Users
    const userId = authData.user.id;
    
    // Preparar datos del usuario principal - ahora usando ID de Auth
    const userData = {
      id: userId, // IMPORTANTE: Usar el ID de Supabase Auth
      firstName: data.personalInfo.firstName,
      lastName: data.personalInfo.lastName || '',
      email: data.personalInfo.email,
      // Eliminamos password ya que ahora lo maneja Supabase Auth
      whatsapp: data.personalInfo.whatsapp || '',
      birthDate: data.personalInfo.birthDate || null,
      gender: data.personalInfo.gender || '',
      maritalStatus: data.personalInfo.maritalStatus || '',
      isMinor: data.isMinor || false,
      rol: 'cliente', // Asignar el rol predeterminado
      createdAt: new Date().toISOString()
    };

    console.log("Insertando usuario con datos:", userData);

    // Insertar el usuario principal con el ID de Auth
    const { error: insertError } = await supabaseAdmin
      .from('Users')
      .insert(userData);

    if (insertError) {
      console.error("Error al insertar usuario:", insertError);
      // Si falla la inserción en DB, eliminamos el usuario de Auth para mantener consistencia
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { success: false, message: `Error al insertar usuario: ${insertError.message}` }, 
        { status: 500 }
      );
    }

    console.log("Usuario creado con ID:", userId);

    // Procesar y subir firma si existe
    if (data.signature) {
      try {
        const signatureBase64 = data.signature.split(',')[1];
        const signatureBuffer = Buffer.from(signatureBase64, 'base64');
        
        // Crear el bucket si no existe
        try {
          const { data: buckets } = await supabaseAdmin.storage.listBuckets();
          if (!buckets?.find(b => b.name === 'user-files')) {
            await supabaseAdmin.storage.createBucket('user-files', {
              public: true
            });
          }
        } catch (bucketError) {
          console.error("Error al verificar/crear bucket:", bucketError);
        }
        
        // Subir firma
        const signaturePath = `${userId}/signature-${Date.now()}.png`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from('user-files')
          .upload(signaturePath, signatureBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error("Error al subir firma:", uploadError);
        } else {
          // Obtener URL de la firma
          const { data: publicUrlData } = supabaseAdmin.storage
            .from('user-files')
            .getPublicUrl(signaturePath);
          
          // Actualizar referencia en la base de datos
          if (publicUrlData?.publicUrl) {
            await supabaseAdmin
              .from('Users')
              .update({ signatureUrl: publicUrlData.publicUrl })
              .eq('id', userId);
          }
        }
      } catch (signatureError) {
        console.error("Error al procesar firma:", signatureError);
      }
    }

    // Procesar y subir foto de perfil si existe
    if (data.profilePhoto) {
      try {
        const photoBase64 = data.profilePhoto.split(',')[1];
        const photoBuffer = Buffer.from(photoBase64, 'base64');
        
        // Subir foto
        const photoPath = `${userId}/profile-${Date.now()}.jpg`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from('user-files')
          .upload(photoPath, photoBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error("Error al subir foto de perfil:", uploadError);
        } else {
          // Obtener URL de la foto
          const { data: publicUrlData } = supabaseAdmin.storage
            .from('user-files')
            .getPublicUrl(photoPath);
          
          // Actualizar referencia en la base de datos
          if (publicUrlData?.publicUrl) {
            await supabaseAdmin
              .from('Users')
              .update({ profilePictureUrl: publicUrlData.publicUrl })
              .eq('id', userId);
          }
        }
      } catch (photoError) {
        console.error("Error al procesar foto de perfil:", photoError);
      }
    }

    // Insertar la dirección
    if (data.personalInfo) {
      try {
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
        
        console.log("Insertando dirección:", addressData);
        
        const { error: addressError } = await supabaseAdmin
          .from('addresses')
          .insert(addressData);

        if (addressError) {
          console.error("Error al insertar dirección:", addressError);
        } else {
          console.log("Dirección insertada correctamente");
        }
      } catch (addressError) {
        console.error("Error general al insertar dirección:", addressError);
      }
    }

    // Insertar contacto de emergencia 
    try {
      console.log("Intentando insertar contacto de emergencia");
      
      const emergencyData = {
        userId: userId,
        name: data.emergencyContact?.name || data.emergencyName || '',
        phone: data.emergencyContact?.phone || data.emergencyPhone || '',
        medicalCondition: data.emergencyContact?.medicalCondition || data.medicalCondition || '',
        bloodType: data.emergencyContact?.bloodType || data.bloodType || ''
      };
    
      console.log("Datos de contacto de emergencia:", emergencyData);
    
      const { error: contactError } = await supabaseAdmin
        .from('emergency_contacts')
        .insert(emergencyData);
    
      if (contactError) {
        console.error("Error al insertar contacto de emergencia:", contactError);
      } else {
        console.log("Contacto de emergencia insertado correctamente");
      }
    } catch (emergencyError) {
      console.error("Error general al insertar contacto de emergencia:", emergencyError);
    }
    
    // Insertar información de membresía
    try {
      console.log("Intentando insertar información de membresía");
      
      const membershipData = {
        userId: userId,
        referredBy: data.membershipData?.referredBy || data.referredBy || '',
        mainMotivation: data.membershipData?.mainMotivation || data.mainMotivation || '',
        receivePlans: data.membershipData?.receivePlans || data.receivePlans || false,
        trainingLevel: data.membershipData?.trainingLevel || data.trainingLevel || ''
      };
    
      console.log("Datos de membresía:", membershipData);
    
      const { error: membershipError } = await supabaseAdmin
        .from('membership_info')
        .insert(membershipData);
    
      if (membershipError) {
        console.error("Error al insertar info de membresía:", membershipError);
      } else {
        console.log("Información de membresía insertada correctamente");
      }
    } catch (membershipError) {
      console.error("Error general al insertar información de membresía:", membershipError);
    }
    
    // Generar PDF y enviar notificaciones automáticamente
    try {
      console.log("Generando PDF automáticamente para el usuario:", userId);
      
      // 1. Llamar a la API de generación de PDF
      const pdfRes = await fetch(new URL('/api/generate-pdf', req.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId })
      });
      
      if (!pdfRes.ok) {
        const errorText = await pdfRes.text();
        console.error("Error al generar PDF:", errorText);
        // Continuamos a pesar del error para no interrumpir el registro
      } else {
        const pdfData = await pdfRes.json();
        console.log("PDF generado exitosamente:", pdfData);
        
        // 2. Enviar correo con el PDF
        console.log("Enviando correo de bienvenida...");
        const emailRes = await fetch(new URL('/api/send-welcome-email', req.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        });
        
        if (!emailRes.ok) {
          const errorText = await emailRes.text();
          console.error("Error al enviar correo:", errorText);
        } else {
          const emailData = await emailRes.json();
          console.log("Correo enviado exitosamente:", emailData);
        }
        
        // 3. Enviar mensaje de WhatsApp (solo si hay número)
        if (userData.whatsapp) {
          console.log("Enviando mensaje de WhatsApp de bienvenida...");
          const whatsappRes = await fetch(new URL('/api/send-welcome-whatsapp', req.url).toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId })
          });
          
          if (!whatsappRes.ok) {
            const errorText = await whatsappRes.text();
            console.error("Error al enviar WhatsApp:", errorText);
          } else {
            const whatsappData = await whatsappRes.json();
            console.log("WhatsApp enviado exitosamente:", whatsappData);
          }
        } else {
          console.log("Usuario no proporcionó número de WhatsApp, omitiendo envío de mensaje");
        }
      }
    } catch (autoProcessError) {
      console.error("Error en procesamiento automático:", autoProcessError);
      // Continuamos a pesar del error
    }

    // Responder con éxito
    return NextResponse.json(
      { 
        success: true, 
        message: 'Usuario registrado correctamente',
        userId: userId 
      }, 
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error al procesar el registro:", error);
    
    return NextResponse.json(
      { success: false, message: `Error al procesar el registro: ${error instanceof Error ? error.message : 'Error desconocido'}` }, 
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';