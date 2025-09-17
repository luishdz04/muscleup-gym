import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function POST(req: NextRequest) {
  console.log("🎬 [WELCOME-PACKAGE] API iniciada v2.1 (Token Auth) - 2025-09-16");

  try {
    // 🔴 CAMBIO CLAVE: Obtener token del header Authorization
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error("❌ [WELCOME-PACKAGE] No se encontró token de autorización");
      return NextResponse.json({ 
        success: false, 
        message: "Token de autorización requerido" 
      }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log("🔐 [WELCOME-PACKAGE] Token recibido, verificando...");
    
    // Verificar token con Supabase Admin
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ [WELCOME-PACKAGE] Token inválido:", userError?.message);
      return NextResponse.json({ 
        success: false, 
        message: "Token inválido" 
      }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email;
    console.log("✅ [WELCOME-PACKAGE] Token válido para usuario:", userId);

    // Buscar usuario en nuestra tabla
    console.log("🔍 [WELCOME-PACKAGE] Buscando usuario en tabla Users...");
    const { data: userRecord, error: userRecordError } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userRecordError || !userRecord) {
      console.error("❌ [WELCOME-PACKAGE] Usuario no encontrado en tabla Users:", userRecordError);
      return NextResponse.json({ 
        success: false, 
        message: "Usuario no encontrado en base de datos" 
      }, { status: 404 });
    }

    console.log("✅ [WELCOME-PACKAGE] Usuario encontrado:", userRecord.email);

    // Verificar si ya se procesó el paquete de bienvenida
    if (userRecord.registrationCompleted) {
      console.log("⚠️ [WELCOME-PACKAGE] Ya procesado anteriormente");
      return NextResponse.json({
        success: true,
        message: "Paquete de bienvenida ya fue procesado anteriormente",
        alreadyProcessed: true,
        processResults: {
          pdf: true,
          email: true,
          whatsapp: true
        }
      });
    }

    // Marcar como en proceso
    console.log("💾 [WELCOME-PACKAGE] Marcando como en proceso...");
    await supabaseAdmin
      .from('Users')
      .update({ 
        pendingWelcomeEmail: false,
        emailConfirmed: true,
        emailConfirmedAt: new Date().toISOString()
      })
      .eq('id', userId);

    // Obtener la URL base para las llamadas a las APIs
    const baseUrl = req.nextUrl.origin;
    console.log("🌐 [WELCOME-PACKAGE] URL base:", baseUrl);

    let processResults = {
      pdf: false,
      email: false,
      whatsapp: false
    };

    try {
      // 1. Generar PDF
      console.log("📄 [WELCOME-PACKAGE] Generando PDF...");
      try {
        const pdfRes = await fetch(`${baseUrl}/api/generate-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        });
        
        if (pdfRes.ok) {
          console.log("✅ [WELCOME-PACKAGE] PDF generado exitosamente");
          processResults.pdf = true;
        } else {
          const errorText = await pdfRes.text();
          console.error("❌ [WELCOME-PACKAGE] Error generando PDF:", errorText);
        }
      } catch (pdfError) {
        console.error("💥 [WELCOME-PACKAGE] Error crítico en PDF:", pdfError);
      }

      // 2. Enviar Email de Bienvenida
      console.log("📧 [WELCOME-PACKAGE] Enviando correo de bienvenida...");
      try {
        const emailRes = await fetch(`${baseUrl}/api/send-welcome-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId })
        });
        
        if (emailRes.ok) {
          console.log("✅ [WELCOME-PACKAGE] Correo enviado exitosamente");
          processResults.email = true;
        } else {
          const errorText = await emailRes.text();
          console.error("❌ [WELCOME-PACKAGE] Error enviando correo:", errorText);
        }
      } catch (emailError) {
        console.error("💥 [WELCOME-PACKAGE] Error crítico en email:", emailError);
      }

      // 3. Enviar WhatsApp (solo si hay número)
      if (userRecord.whatsapp && userRecord.whatsapp.trim() !== '') {
        console.log("📱 [WELCOME-PACKAGE] Enviando mensaje de WhatsApp...");
        try {
          const whatsappRes = await fetch(`${baseUrl}/api/send-welcome-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId })
          });
          
          if (whatsappRes.ok) {
            console.log("✅ [WELCOME-PACKAGE] WhatsApp enviado exitosamente");
            processResults.whatsapp = true;
          } else {
            const errorText = await whatsappRes.text();
            console.error("❌ [WELCOME-PACKAGE] Error enviando WhatsApp:", errorText);
          }
        } catch (whatsappError) {
          console.error("💥 [WELCOME-PACKAGE] Error crítico en WhatsApp:", whatsappError);
        }
      } else {
        console.log("ℹ️ [WELCOME-PACKAGE] Usuario sin número de WhatsApp, omitiendo envío");
        processResults.whatsapp = true; // Marcamos como exitoso porque no aplica
      }

      // 4. Marcar registro como completado
      console.log("🎯 [WELCOME-PACKAGE] Actualizando estado final...");
      await supabaseAdmin
        .from('Users')
        .update({ 
          registrationCompleted: true,
          registrationCompletedAt: new Date().toISOString(),
          processingErrors: false
        })
        .eq('id', userId);

      console.log("🎉 [WELCOME-PACKAGE] Paquete de bienvenida completado exitosamente");

      return NextResponse.json({
        success: true,
        message: "Paquete de bienvenida procesado exitosamente",
        processResults: processResults,
        userId: userId,
        userEmail: userEmail,
        completedAt: new Date().toISOString()
      });

    } catch (processError) {
      console.error("💥 [WELCOME-PACKAGE] Error en procesamiento:", processError);
      
      // Marcar como con errores pero email confirmado
      await supabaseAdmin
        .from('Users')
        .update({ 
          processingErrors: true,
          registrationCompleted: false
        })
        .eq('id', userId);
      
      return NextResponse.json({
        success: false,
        message: "Error procesando paquete de bienvenida",
        error: processError instanceof Error ? processError.message : 'Error desconocido',
        processResults: processResults,
        userId: userId
      }, { status: 500 });
    }

  } catch (error) {
    console.error("💥 [WELCOME-PACKAGE] Error crítico:", error);
    return NextResponse.json({
      success: false,
      message: `Error crítico en paquete de bienvenida: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';