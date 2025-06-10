import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId es requerido" },
        { status: 400 }
      );
    }

    // Usar supabaseAdmin para obtener los datos sin restricciones de RLS
    const { data, error } = await supabaseAdmin
      .from('Users')
      .select('firstName, lastName, contractPdfUrl, emailSent')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("Error en API get-user-data:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
    
  } catch (error) {
    console.error("Error en get-user-data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';