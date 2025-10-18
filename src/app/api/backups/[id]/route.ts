import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

// GET: Descargar un backup específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const filename = params.id;
    console.log(`📥 [BACKUP] Descargando backup: ${filename}`);

    // Validar que el archivo existe
    const filePath = path.join(BACKUPS_DIR, filename);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Backup no encontrado' },
        { status: 404 }
      );
    }

    // Leer el archivo
    const fileBuffer = await fs.readFile(filePath);

    // Determinar el tipo de contenido
    let contentType = 'application/octet-stream';
    if (filename.endsWith('.sql')) {
      contentType = 'application/sql';
    } else if (filename.endsWith('.json')) {
      contentType = 'application/json';
    } else if (filename.endsWith('.zip')) {
      contentType = 'application/zip';
    } else if (filename.endsWith('.gz')) {
      contentType = 'application/gzip';
    }

    console.log(`✅ [BACKUP] Descarga iniciada: ${filename}`);

    // Retornar el archivo como descarga
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('❌ [BACKUP] Error al descargar backup:', error);
    return NextResponse.json(
      { success: false, error: 'Error al descargar backup' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar un backup específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const filename = params.id;
    console.log(`🗑️ [BACKUP] Eliminando backup: ${filename}`);

    // Validar que el archivo existe
    const filePath = path.join(BACKUPS_DIR, filename);

    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Backup no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el archivo
    await fs.unlink(filePath);

    console.log(`✅ [BACKUP] Backup eliminado: ${filename}`);

    return NextResponse.json({
      success: true,
      message: 'Backup eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ [BACKUP] Error al eliminar backup:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar backup' },
      { status: 500 }
    );
  }
}
