import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ success: false, message: "ID de usuario requerido" }, { status: 400 });
    }
    
    const { data, error } = await supabaseAdmin
      .from('Users')
      .select('firstName, lastName')
      .eq('id', userId)
      .single();
      
    if (error || !data) {
      return NextResponse.json({ success: false, message: "Usuario no encontrado" }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      name: `${data.firstName} ${data.lastName}`.trim()
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: `Error: ${error instanceof Error ? error.message : 'Desconocido'}` 
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';