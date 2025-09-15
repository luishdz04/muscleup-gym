import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (token_hash && type) {
    const { error, data } = await supabaseAdmin.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error && data.user) {
      // Actualizar el campo emailConfirmed en tu tabla (esto activará el trigger)
      await supabaseAdmin
        .from('Users')
        .update({ 
          emailConfirmed: true,
          emailConfirmedAt: new Date().toISOString()
        })
        .eq('email', data.user.email)

      // Redirigir a tu página de bienvenida
      return NextResponse.redirect(`${request.nextUrl.origin}/bienvenido?confirmed=true&type=signup`)
    }
  }

  return NextResponse.redirect(`${request.nextUrl.origin}/registro-pendiente`)
}