import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    // Verificar contraseña
    const correctPassword = process.env.RUTINAS_PASSWORD || 'rutinas123';
    if (authHeader !== `Bearer ${correctPassword}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Directorio de PDFs
    const pdfDir = path.join(process.cwd(), 'public', 'pdfs');
    
    // Leer archivos en el directorio
    let files;
    try {
      files = await fs.readdir(pdfDir);
    } catch (error) {
      console.error('Error al leer el directorio de PDFs:', error);
      return NextResponse.json(
        { error: 'Error al leer directorio de PDFs' }, 
        { status: 500 }
      );
    }
    
    // Filtrar solo PDFs y obtener metadata básica
    const pdfFiles = files
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .map(filename => {
        // Convertir nombre de archivo a formato legible
        const name = filename
          .replace(/\.pdf$/i, '')
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
          
        return {
          filename,
          nombre: name,
          descripcion: `Rutina: ${name}`
        };
      });
    
    return NextResponse.json({ pdfs: pdfFiles }, { status: 200 });
    
  } catch (error) {
    console.error('Error al listar PDFs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}

// Asegurar que solo aceptamos GET requests
export async function POST() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Método no permitido' }, { status: 405 });
}
