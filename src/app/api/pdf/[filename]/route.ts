import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params;
  const authHeader = request.headers.get('authorization');
  
  // Verificar contraseña
  const correctPassword = process.env.RUTINAS_PASSWORD || 'rutinas123';
  if (authHeader !== `Bearer ${correctPassword}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Servir desde public/pdfs (ya que dijiste que están ahí)
    const filePath = path.join(process.cwd(), 'public/pdfs', filename);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }
    
    // Leer el archivo
    const fileBuffer = fs.readFileSync(filePath);
    
    // Headers para seguridad
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Content-Disposition', 'inline');
    
    return new NextResponse(fileBuffer, { headers });
    
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
