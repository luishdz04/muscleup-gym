// src/app/api/admin/plans/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  // Listar todos los planes
  const { data, error } = await supabaseAdmin
    .from('Plans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  try {
    const planData = {
      ...body,
      created_by: body.created_by  // asegúrate de incluir created_by en el JSON
    };
    const { data, error } = await supabaseAdmin
      .from('Plans')
      .insert(planData)
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
