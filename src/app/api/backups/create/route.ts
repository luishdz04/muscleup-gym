import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');

// Tablas a respaldar (en orden de dependencias)
const TABLES_TO_BACKUP = [
  'gym_settings',
  'holidays',
  'payment_commissions',
  'plans',
  'Users',
  'addresses',
  'emergency_contacts',
  'membership_info',
  'user_memberships',
  'payments',
  'biometric_devices',
  'fingerprint_templates',
  'access_logs',
  'products',
  'warehouses',
  'inventory_movements',
  'suppliers',
  'sales',
  'sale_items',
  'layaway_status_history',
  'expenses',
  'expense_categories',
  'cuts',
  'system_logs'
];

// POST: Crear backup manual de la base de datos usando Supabase
export async function POST(request: NextRequest) {
  try {
    console.log('💾 [BACKUP] Iniciando creación de backup manual con Supabase...');

    // Asegurar que el directorio existe
    await fs.mkdir(BACKUPS_DIR, { recursive: true });

    const supabase = createServerSupabaseClient();

    // Generar nombre de archivo único
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-')
      .split('T')
      .join('_')
      .slice(0, -5);

    const filename = `backup_manual_${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);

    console.log(`📝 [BACKUP] Archivo: ${filename}`);

    // Objeto para almacenar todos los datos
    const backupData: any = {
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0',
        type: 'manual',
        source: 'Supabase',
        tables: []
      },
      data: {}
    };

    // Exportar cada tabla
    for (const table of TABLES_TO_BACKUP) {
      try {
        console.log(`📊 [BACKUP] Exportando tabla: ${table}...`);

        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' });

        if (error) {
          console.warn(`⚠️ [BACKUP] Error en tabla ${table}:`, error.message);
          backupData.data[table] = [];
          backupData.metadata.tables.push({
            name: table,
            rows: 0,
            status: 'error',
            error: error.message
          });
        } else {
          backupData.data[table] = data || [];
          backupData.metadata.tables.push({
            name: table,
            rows: count || 0,
            status: 'success'
          });
          console.log(`✅ [BACKUP] ${table}: ${count || 0} registros`);
        }
      } catch (tableError: any) {
        console.warn(`⚠️ [BACKUP] Excepción en tabla ${table}:`, tableError.message);
        backupData.data[table] = [];
        backupData.metadata.tables.push({
          name: table,
          rows: 0,
          status: 'error',
          error: tableError.message
        });
      }
    }

    // Calcular total de registros
    const totalRecords = backupData.metadata.tables.reduce(
      (sum: number, table: any) => sum + (table.rows || 0),
      0
    );

    backupData.metadata.totalRecords = totalRecords;

    // Guardar el archivo JSON
    const jsonContent = JSON.stringify(backupData, null, 2);
    await fs.writeFile(filePath, jsonContent, 'utf-8');

    // Verificar que el archivo se creó
    const stats = await fs.stat(filePath);

    console.log(`✅ [BACKUP] Backup creado exitosamente`);
    console.log(`📊 [BACKUP] Total de registros: ${totalRecords}`);
    console.log(`💾 [BACKUP] Tamaño: ${formatBytes(stats.size)}`);

    return NextResponse.json({
      success: true,
      message: `Backup creado exitosamente con ${totalRecords} registros`,
      backup: {
        filename,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: new Date(),
        type: 'manual',
        totalRecords,
        tables: backupData.metadata.tables.length
      }
    });

  } catch (error: any) {
    console.error('❌ [BACKUP] Error al crear backup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al crear backup',
        message: 'No se pudo crear el backup. Verifica la conexión con Supabase.'
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
