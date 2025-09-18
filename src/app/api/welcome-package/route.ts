import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseAdmin } from '@/utils/supabase-admin';

// Variables de entorno directas
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  console.log("🎬 [WELCOME-PACKAGE] API v2.2 (Optimizada Simple) iniciada - 2025-09-16");

  try {
    // Crear cliente Supabase para leer cookies
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set() {}, // No necesitamos set en POST
          remove() {}, // No necesitamos remove en POST
        },
      }
    );

    // Obtener sesión del usuario
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.error("❌ [WELCOME-PACKAGE] Sin sesión válida:", sessionError?.message);
      return NextResponse.json({ 
        success: false, 
        message: "Sesión requerida. Intenta recargar la página." 
      }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;
    console.log("✅ [WELCOME-PACKAGE] Sesión válida para usuario:", userId);

    // Buscar usuario en base de datos
    const { data: user, error: userError } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      console.error("❌ [WELCOME-PACKAGE] Usuario no encontrado:", userError?.message);
      return NextResponse.json({ 
        success: false, 
        message: "Usuario no encontrado en base de datos" 
      }, { status: 404 });
    }

    console.log("✅ [WELCOME-PACKAGE] Usuario encontrado:", user.email);

    // Verificar si ya se procesó
    if (user.registrationCompleted) {
      console.log("⚠️ [WELCOME-PACKAGE] Ya procesado anteriormente");
      return NextResponse.json({
        success: true,
        message: "Paquete de bienvenida ya procesado",
        alreadyProcessed: true,
        processResults: { pdf: true, email: true, whatsapp: true }
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
      .eq('id', userId);

    const baseUrl = req.nextUrl.origin;
    let processResults = { pdf: false, email: false, whatsapp: false };

    // OPTIMIZACIÓN: Procesar en paralelo en lugar de secuencial
    console.log("⚡ [WELCOME-PACKAGE] Iniciando procesos en paralelo...");
    
    const processes = [
      // PDF
      fetch(`${baseUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }).then(res => ({ type: 'pdf', success: res.ok, response: res })),
      
      // Email
      fetch(`${baseUrl}/api/send-welcome-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }).then(res => ({ type: 'email', success: res.ok, response: res })),
      
      // WhatsApp (solo si tiene número)
      ...(user.whatsapp && user.whatsapp.trim() !== '' ? [
        fetch(`${baseUrl}/api/send-welcome-whatsapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }).then(res => ({ type: 'whatsapp', success: res.ok, response: res }))
      ] : [])
    ];

    // Esperar a que todos terminen (máximo 25 segundos)
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
    if (!user.whatsapp || user.whatsapp.trim() === '') {
      processResults.whatsapp = true;
      console.log("ℹ️ [WHATSAPP] No aplica - marcado como exitoso");
    }

    // Actualizar estado final
    await supabaseAdmin
      .from('Users')
      .update({ 
        registrationCompleted: true,
        registrationCompletedAt: new Date().toISOString(),
        processingErrors: false
      })
      .eq('id', userId);

    console.log("🎉 [WELCOME-PACKAGE] Completado exitosamente");

    return NextResponse.json({
      success: true,
      message: "Paquete de bienvenida procesado exitosamente",
      processResults,
      userId,
      userEmail,
      completedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("💥 [WELCOME-PACKAGE] Error crítico:", error);
    return NextResponse.json({
      success: false,
      message: `Error crítico: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';