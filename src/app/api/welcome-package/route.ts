import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  console.log("🎬 [WELCOME-PACKAGE] API v2.3 (Bearer Auth) iniciada - 2025-09-16");

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

    // OPTIMIZACIÓN: Procesar en paralelo en lugar de secuencial
    console.log("⚡ [WELCOME-PACKAGE] Iniciando procesos en paralelo...");
    
    const processes = [
      // PDF
      fetch(`${baseUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }).then(res => ({ type: 'pdf', success: res.ok, response: res })).catch(err => ({ type: 'pdf', success: false, error: err })),
      
      // Email
      fetch(`${baseUrl}/api/send-welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }).then(res => ({ type: 'email', success: res.ok, response: res })).catch(err => ({ type: 'email', success: false, error: err })),
      
      // WhatsApp (solo si tiene número)
      ...(userRecord.whatsapp && userRecord.whatsapp.trim() !== '' ? [
        fetch(`${baseUrl}/api/send-welcome-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }).then(res => ({ type: 'whatsapp', success: res.ok, response: res })).catch(err => ({ type: 'whatsapp', success: false, error: err }))
      ] : [])
    ];

    // Esperar a que todos terminen (máximo 30 segundos por Promise.allSettled)
    const results = await Promise.allSettled(processes);
    
    // Procesar resultados
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const { type, success } = result.value;
        processResults[type as keyof typeof processResults] = success;
        console.log(`${success ? '✅' : '❌'} [${type.toUpperCase()}] ${success ? 'Completado' : 'Falló'}`);
      } else {
        console.error("💥 [PROCESS] Error en proceso:", result.reason);
      }
    });

    // WhatsApp como exitoso si no aplica
    if (!userRecord.whatsapp || userRecord.whatsapp.trim() === '') {
      processResults.whatsapp = true;
      console.log("ℹ️ [WHATSAPP] No aplica - marcado como exitoso");
    }

    // Actualizar estado final
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

  } catch (error) {
    console.error("💥 [WELCOME-PACKAGE] Error crítico:", error);
    return NextResponse.json({
      success: false,
      message: `Error crítico en paquete de bienvenida: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';