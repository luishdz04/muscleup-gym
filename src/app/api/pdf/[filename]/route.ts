import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    const authHeader = request.headers.get('authorization');
    
    // Verificar contraseña
    const correctPassword = process.env.RUTINAS_PASSWORD || 'rutinas123';
    if (authHeader !== `Bearer ${correctPassword}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Validar nombre del archivo por seguridad
    if (!filename || filename.includes('..') || !filename.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    // Ruta del archivo en public/pdfs
    const filePath = path.join(process.cwd(), 'public', 'pdfs', filename);
    
    // Verificar si el archivo existe
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }
    
    // Leer el archivo
    const fileBuffer = await fs.readFile(filePath);
    
    // Headers para seguridad y tipo de contenido
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('Content-Disposition', `inline; filename="${filename}"`);
    
    return new NextResponse(fileBuffer, { 
      status: 200,
      headers 
    });
    
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Asegurar que solo aceptamos GET requests
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
