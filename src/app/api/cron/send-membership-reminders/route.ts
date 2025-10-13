// src/app/api/cron/send-membership-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * CRON JOB: Enviar recordatorios automáticos de vencimiento de membresías
 * 
 * Este endpoint es llamado automáticamente por Vercel Cron cada día a las 9:00 AM (hora de México)
 * Envía recordatorios a usuarios cuyas membresías vencen en 3 días
 * 
 * IMPORTANTE: Solo funciona en producción (deployment en Vercel)
 * Para testing local, usa directamente: /api/send-expiration-reminders
 * 
 * Configurado en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/send-membership-reminders",
 *     "schedule": "0 15 * * *"  // Diario a las 9 AM hora de México (15:00 UTC)
 *   }]
 * }
 */

export async function GET(request: NextRequest) {
  try {
    // 🔒 SEGURIDAD: Verificar que la petición viene de Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Si tienes CRON_SECRET configurado, verificarlo
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ [CRON] Intento de acceso no autorizado al CRON job');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const timestamp = new Date().toISOString();
    console.log(`🕒 [CRON] Iniciando envío automático de recordatorios... (${timestamp})`);

    // Llamar al endpoint de envío de recordatorios
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // ✅ USAR LA MISMA API QUE EL BOTÓN MANUAL
    const response = await fetch(
      `${apiUrl}/api/send-expiration-reminders?daysBeforeExpiration=3`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ [CRON] Error al enviar recordatorios:', errorData);
      return NextResponse.json(
        {
          success: false,
          error: 'Error al procesar recordatorios',
          details: errorData,
        },
        { status: response.status }
      );
    }

    const results = await response.json();

    console.log('✅ [CRON] Recordatorios enviados exitosamente:', {
      sent: results.sent,
      failed: results.failed,
      skipped: results.skipped,
      total: results.total,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Recordatorios procesados automáticamente',
      results,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ [CRON] Error crítico:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno en CRON job',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// También permitir POST para testing manual
export async function POST(request: NextRequest) {
  return GET(request);
}
