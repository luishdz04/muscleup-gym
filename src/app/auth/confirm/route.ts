import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase-admin'

export async function GET(request: NextRequest) {
  console.log("🔑 [CONFIRM] Procesando confirmación de email v2.0...");
  
  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    
    console.log("📋 [CONFIRM] Parámetros recibidos:", { 
      token_hash: token_hash ? 'PRESENTE' : 'AUSENTE', 
      type 
    });

    if (!token_hash || !type) {
      console.error("❌ [CONFIRM] Parámetros faltantes");
      return NextResponse.redirect(`${request.nextUrl.origin}/registro-pendiente?error=parametros-faltantes`)
    }

    // ✅ VERIFICAR EL TOKEN CON SUPABASE AUTH
    console.log("🔍 [CONFIRM] Verificando token con Supabase Auth...");
    const { error: verifyError, data } = await supabaseAdmin.auth.verifyOtp({
      type,
      token_hash,
    })

    if (verifyError || !data.user) {
      console.error("❌ [CONFIRM] Error verificando token:", verifyError);
      return NextResponse.redirect(`${request.nextUrl.origin}/registro-pendiente?error=token-invalido`)
    }

    const userId = data.user.id;
    const userEmail = data.user.email;
    
    console.log("✅ [CONFIRM] Token verificado para usuario:", userId);

    // ✅ VERIFICAR QUE EL USUARIO EXISTE EN NUESTRA TABLA
    console.log("👤 [CONFIRM] Verificando usuario en tabla Users...");
    const { data: userData, error: userCheckError } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userCheckError || !userData) {
      console.error("❌ [CONFIRM] Usuario no encontrado en tabla:", userCheckError);
      return NextResponse.redirect(`${request.nextUrl.origin}/registro-pendiente?error=usuario-no-encontrado`)
    }

    // ✅ VERIFICAR SI YA ESTÁ CONFIRMADO
    if (userData.emailConfirmed && userData.registrationCompleted) {
      console.log("ℹ️ [CONFIRM] Email ya confirmado y procesado anteriormente");
      return NextResponse.redirect(`${request.nextUrl.origin}/bienvenido?confirmed=true&type=already-confirmed&userId=${userId}`)
    }

    // ✅ ACTUALIZAR ESTADO DE CONFIRMACIÓN
    console.log("💾 [CONFIRM] Actualizando estado de confirmación...");
    const { error: updateError } = await supabaseAdmin
      .from('Users')
      .update({
        emailConfirmed: true,
        emailConfirmedAt: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error("❌ [CONFIRM] Error actualizando usuario:", updateError);
      return NextResponse.redirect(`${request.nextUrl.origin}/registro-pendiente?error=actualizacion-fallida`)
    }

    console.log("✅ [CONFIRM] Usuario actualizado correctamente");

    // ✅ EXTRAER TOKENS DE LA SESIÓN (si existen)
    let sessionParams = '';
    if (data.session?.access_token && data.session?.refresh_token) {
      sessionParams = `&access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}`;
      console.log("✅ [CONFIRM] Tokens de sesión disponibles");
    } else {
      console.log("ℹ️ [CONFIRM] Continuando sin tokens de sesión");
    }

    // ✅ REDIRIGIR A BIENVENIDA CON PARÁMETROS NECESARIOS
    const redirectUrl = `${request.nextUrl.origin}/bienvenido?confirmed=true&type=signup&userId=${userId}${sessionParams}`;
    
    console.log("🎉 [CONFIRM] Confirmación completada, redirigiendo a bienvenida...");
    console.log("🔗 [CONFIRM] URL de redirección:", redirectUrl.replace(/access_token=[^&]*/, 'access_token=***').replace(/refresh_token=[^&]*/, 'refresh_token=***'));

    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error("💥 [CONFIRM] Error crítico en confirmación:", error);
    return NextResponse.redirect(`${request.nextUrl.origin}/registro-pendiente?error=error-critico`)
  }
}

export const dynamic = 'force-dynamic';