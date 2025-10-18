import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

interface BackupFile {
  id: string;
  filename: string;
  type: 'manual' | 'automatic';
  size: number;
  sizeFormatted: string;
  createdAt: Date;
  status: 'ok' | 'error';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// GET: Listar todos los backups disponibles
export async function GET(request: NextRequest) {
  try {
    console.log('📦 [BACKUPS] Listando backups disponibles...');

    // Asegurar que el directorio existe
    await fs.mkdir(BACKUPS_DIR, { recursive: true });

    // Leer archivos del directorio
    const files = await fs.readdir(BACKUPS_DIR);

    // Filtrar solo archivos de backup
    const backupFiles = files.filter(file =>
      file.startsWith('backup_') && (
        file.endsWith('.sql') ||
        file.endsWith('.json') ||
        file.endsWith('.zip') ||
        file.endsWith('.gz')
      )
    );

    // Obtener información de cada archivo
    const backups: BackupFile[] = await Promise.all(
      backupFiles.map(async (filename) => {
        const filePath = path.join(BACKUPS_DIR, filename);
        const stats = await fs.stat(filePath);

        // Extraer información del nombre del archivo
        // Formato: backup_manual_2025-10-18_14-30-00.sql
        const parts = filename.replace(/\.(sql|json|zip|gz)$/, '').split('_');
        const type = parts[1] === 'manual' ? 'manual' : 'automatic';

        return {
          id: filename,
          filename,
          type,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.birthtime || stats.mtime,
          status: 'ok' as const
        };
      })
    );

    // Ordenar por fecha (más reciente primero)
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log(`✅ [BACKUPS] ${backups.length} backups encontrados`);

    return NextResponse.json({
      success: true,
      backups,
      total: backups.length,
      totalSize: backups.reduce((acc, b) => acc + b.size, 0),
      totalSizeFormatted: formatBytes(backups.reduce((acc, b) => acc + b.size, 0))
    });

  } catch (error) {
    console.error('❌ [BACKUPS] Error al listar backups:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al listar backups',
        backups: [],
        total: 0,
        totalSize: 0,
        totalSizeFormatted: '0 Bytes'
      },
      { status: 500 }
    );
  }
}
