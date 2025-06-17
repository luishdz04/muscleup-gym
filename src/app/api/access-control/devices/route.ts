import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  
  const { data: devices, error } = await supabase
    .from('biometric_devices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error al obtener dispositivos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ devices });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await req.json();
  
  const { data, error } = await supabase
    .from('biometric_devices')
    .insert({
      name: body.name,
      type: body.type,
      model: body.model,
      ip_address: body.ip,
      port: body.port || 4370,
      status: 'disconnected',
      is_active: true
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error al crear dispositivo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data, { status: 201 });
}