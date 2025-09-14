import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function POST(req: NextRequest) {
  try {
    console.log("🎬 [WELCOME-PACKAGE] API iniciada v1.0 - 2025-09-14 by @MuscleUpGYM");
    
    const body = await req.json();
    const { userId, userEmail } = body;

    if (!userId && !userEmail) {
      return NextResponse.json({ 
        success: false, 
        message: "Se requiere userId o userEmail" 
      }, { status: 400 });
    }

    // Buscar usuario por ID o email
    let whereClause = userId ? { id: userId } : { email: userEmail };
    
    console.log("🔍 [WELCOME-PACKAGE] Buscando usuario:", whereClause);
    const { data: user, error: userError } = await supabaseAdmin
      .from('Users')
      .select('*')
      .match(whereClause)
      .single();
      
    if (userError || !user) {
      console.error("❌ [WELCOME-PACKAGE] Usuario no encontrado:", userError);
      return NextResponse.json({ 
        success: false, 
        message: "Usuario no encontrado" 
      }, { status: 404 });
    }

    console.log("✅ [WELCOME-PACKAGE] Usuario encontrado:", user.email);

    // Verificar si ya se procesó el paquete de bienvenida
    if (user.registrationCompleted) {
      console.log("⚠️ [WELCOME-PACKAGE] Ya procesado anteriormente");
      return NextResponse.json({
        success: true,
        message: "Paquete de bienvenida ya fue procesado anteriormente",
        alreadyProcessed: true
      });
    }

    // Marcar como en proceso
    await supabaseAdmin
      .from('Users')
      .update({ 
        pendingWelcomeEmail: false,
        emailConfirmed: true,
        emailConfirmedAt: new Date().toISOString()
      })
      .eq('id', user.id);

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
      const pdfRes = await fetch(`${baseUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      
      if (pdfRes.ok) {
        console.log("✅ [WELCOME-PACKAGE] PDF generado exitosamente");
        processResults.pdf = true;
      } else {
        const errorText = await pdfRes.text();
        console.error("❌ [WELCOME-PACKAGE] Error generando PDF:", errorText);
        throw new Error(`Error en PDF: ${errorText}`);
      }

      // 2. Enviar Email de Bienvenida (solo si PDF exitoso)
      if (processResults.pdf) {
        console.log("📧 [WELCOME-PACKAGE] Enviando correo de bienvenida...");
        const emailRes = await fetch(`${baseUrl}/api/send-welcome-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (emailRes.ok) {
          console.log("✅ [WELCOME-PACKAGE] Correo enviado exitosamente");
          processResults.email = true;
        } else {
          const errorText = await emailRes.text();
          console.error("❌ [WELCOME-PACKAGE] Error enviando correo:", errorText);
          throw new Error(`Error en Email: ${errorText}`);
        }
      }

      // 3. Enviar WhatsApp (solo si hay número)
      if (user.whatsapp && user.whatsapp.trim() !== '') {
        console.log("📱 [WELCOME-PACKAGE] Enviando mensaje de WhatsApp...");
        const whatsappRes = await fetch(`${baseUrl}/api/send-welcome-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        
        if (whatsappRes.ok) {
          console.log("✅ [WELCOME-PACKAGE] WhatsApp enviado exitosamente");
          processResults.whatsapp = true;
        } else {
          const errorText = await whatsappRes.text();
          console.error("❌ [WELCOME-PACKAGE] Error enviando WhatsApp:", errorText);
          // No lanzamos error aquí, WhatsApp es opcional
        }
      } else {
        console.log("ℹ️ [WELCOME-PACKAGE] Usuario sin número de WhatsApp, omitiendo envío");
        processResults.whatsapp = true; // Marcamos como exitoso porque no aplica
      }

      // 4. Marcar registro como completado
      await supabaseAdmin
        .from('Users')
        .update({ 
          registrationCompleted: true,
          registrationCompletedAt: new Date().toISOString(),
          processingErrors: false
        })
        .eq('id', user.id);

      console.log("🎉 [WELCOME-PACKAGE] Paquete de bienvenida completado exitosamente");

      return NextResponse.json({
        success: true,
        message: "Paquete de bienvenida procesado exitosamente",
        processResults: processResults,
        userId: user.id,
        userEmail: user.email,
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
        .eq('id', user.id);
      
      return NextResponse.json({
        success: false,
        message: "Error procesando paquete de bienvenida",
        error: processError instanceof Error ? processError.message : 'Error desconocido',
        processResults: processResults,
        userId: user.id
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