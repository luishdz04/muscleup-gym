// src/app/api/send-expiration-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import twilio from 'twilio';
import { formatDateLong } from '@/utils/dateUtils';

/**
 * API para enviar recordatorios masivos de vencimiento de membresías
 * 
 * Query params:
 * - daysBeforeExpiration: número de días antes del vencimiento (default: 3)
 * 
 * Body esperado:
 * {
 *   targetDate?: string  // Fecha específica (opcional, default: hoy + daysBeforeExpiration)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    console.log("🚀 API send-expiration-reminders iniciada");
    
    // Obtener parámetros
    const { searchParams } = new URL(req.url);
    const daysBeforeExpiration = parseInt(searchParams.get('daysBeforeExpiration') || '3');
    
    const body = await req.json().catch(() => ({}));
    const { targetDate } = body;
    
    // ✅ CALCULAR FECHA OBJETIVO
    let expirationDate: string;
    
    if (targetDate) {
      expirationDate = targetDate;
    } else {
      // Calcular fecha de vencimiento (hoy + días)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Inicio del día
      
      const targetDateObj = new Date(today);
      targetDateObj.setDate(targetDateObj.getDate() + daysBeforeExpiration);
      
      expirationDate = targetDateObj.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }
    
    console.log(`📅 Buscando membresías que vencen el: ${expirationDate}`);
    console.log(`⏰ Días de anticipación: ${daysBeforeExpiration}`);
    
    // ✅ OBTENER MEMBRESÍAS PRÓXIMAS A VENCER
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('user_memberships')
      .select(`
        id,
        userid,
        plan_id,
        end_date,
        payment_type,
        status
      `)
      .eq('status', 'active')
      .eq('end_date', expirationDate)
      .not('payment_type', 'eq', 'visit'); // Excluir visitas
      
    if (membershipsError) {
      console.error("❌ Error al obtener membresías:", membershipsError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al obtener membresías próximas a vencer", 
        error: membershipsError 
      }, { status: 500 });
    }
    
    if (!memberships || memberships.length === 0) {
      console.log("ℹ️ No hay membresías que venzan en la fecha indicada");
      return NextResponse.json({ 
        success: true, 
        message: "No hay membresías próximas a vencer",
        sent: 0,
        failed: 0,
        skipped: 0,
        total: 0
      });
    }
    
    console.log(`📊 Membresías encontradas: ${memberships.length}`);
    
    // ✅ VALIDAR CREDENCIALES DE TWILIO
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
    const templateId = process.env.TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID;
    
    if (!accountSid || !authToken || !whatsappFrom || !templateId) {
      console.error("❌ Credenciales de Twilio no configuradas");
      return NextResponse.json({
        success: false,
        message: "Error de configuración: Credenciales de Twilio no disponibles"
      }, { status: 500 });
    }
    
    // ✅ INICIALIZAR CLIENTE DE TWILIO
    const client = twilio(accountSid, authToken);
    
    // ✅ MAPEO DE PAYMENT TYPES
    const paymentTypeLabels: { [key: string]: string } = {
      'visit': 'Por Visita',
      'weekly': 'Semanal',
      'biweekly': 'Quincenal',
      'monthly': 'Mensual',
      'bimonthly': 'Bimestral',
      'quarterly': 'Trimestral',
      'semester': 'Semestral',
      'annual': 'Anual'
    };
    
    // ✅ PROCESAR CADA MEMBRESÍA
    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
      total: memberships.length,
      details: [] as any[]
    };
    
    for (const membership of memberships) {
      try {
        // Obtener datos del usuario
        const { data: user, error: userError } = await supabaseAdmin
          .from('Users')
          .select('id, firstName, lastName, whatsapp')
          .eq('id', membership.userid)
          .single();
          
        if (userError || !user) {
          console.warn(`⚠️ Usuario no encontrado para membresía ${membership.id}`);
          results.skipped++;
          results.details.push({
            membershipId: membership.id,
            userName: 'Usuario Desconocido',
            phone: 'N/A',
            success: false,
            message: 'Omitido: Usuario no encontrado en la base de datos'
          });
          continue;
        }
        
        // Validar WhatsApp
        if (!user.whatsapp) {
          console.warn(`⚠️ Usuario ${user.firstName} sin WhatsApp`);
          results.skipped++;
          results.details.push({
            membershipId: membership.id,
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            phone: 'Sin WhatsApp',
            success: false,
            message: 'Omitido: Usuario sin WhatsApp registrado'
          });
          continue;
        }
        
        // Obtener datos del plan
        const { data: plan, error: planError } = await supabaseAdmin
          .from('membership_plans')
          .select('id, name')
          .eq('id', membership.plan_id)
          .single();
          
        if (planError || !plan) {
          console.warn(`⚠️ Plan no encontrado para membresía ${membership.id}`);
          results.skipped++;
          results.details.push({
            membershipId: membership.id,
            userName: `${user.firstName} ${user.lastName}`,
            phone: user.whatsapp || 'N/A',
            success: false,
            message: 'Omitido: Plan de membresía no encontrado'
          });
          continue;
        }
        
        // Formatear número de WhatsApp
        let formattedPhone = user.whatsapp;
        if (!formattedPhone.startsWith('+')) {
          if (formattedPhone.startsWith('0')) {
            formattedPhone = formattedPhone.substring(1);
          }
          if (formattedPhone.startsWith('52')) {
            formattedPhone = '+' + formattedPhone;
          } else {
            formattedPhone = '+52' + formattedPhone;
          }
        }
        const whatsappNumber = `whatsapp:${formattedPhone}`;
        
        // Preparar variables para la plantilla
        const fullName = `${user.firstName} ${user.lastName}`;
        const planName = plan.name || 'Plan de membresía';
        const paymentTypeText = paymentTypeLabels[membership.payment_type] || membership.payment_type;
        const endDateFormatted = formatDateLong(membership.end_date);
        
        const contentVariables = JSON.stringify({
          "1": fullName,           // Nombre del cliente
          "2": planName,           // Nombre del plan
          "3": paymentTypeText,    // Modalidad de pago
          "4": endDateFormatted    // Fecha de vencimiento
        });
        
        console.log(`📤 Enviando recordatorio a ${fullName} (${whatsappNumber})`);
        
        // Enviar mensaje
        try {
          const twilioMessage = await client.messages.create({
            from: whatsappFrom,
            to: whatsappNumber,
            contentSid: templateId,
            contentVariables: contentVariables
          });
          
          console.log(`✅ Recordatorio enviado: ${twilioMessage.sid}`);
          
          results.sent++;
          results.details.push({
            membershipId: membership.id,
            userId: user.id,
            userName: fullName,
            phone: formattedPhone,
            success: true,
            message: '✅ Enviado exitosamente'
          });
          
          // Opcional: Actualizar campo en la membresía
          try {
            await supabaseAdmin
              .from('user_memberships')
              .update({
                reminder_sent: true,
                reminder_sent_at: new Date().toISOString()
              })
              .eq('id', membership.id);
          } catch (updateError) {
            console.warn("⚠️ No se pudo actualizar reminder_sent (campo opcional):", updateError);
          }
          
        } catch (twilioError: any) {
          console.error(`❌ Error de Twilio para ${fullName}:`, twilioError.message);
          
          results.failed++;
          results.details.push({
            membershipId: membership.id,
            userId: user.id,
            userName: fullName,
            phone: formattedPhone,
            success: false,
            message: `❌ Error al enviar: ${twilioError.message || 'Error desconocido'}`
          });
        }
        
        // Pequeña pausa para no saturar Twilio
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (membershipError: any) {
        console.error(`❌ Error procesando membresía ${membership.id}:`, membershipError.message);
        results.failed++;
        results.details.push({
          membershipId: membership.id,
          userName: 'Error al procesar',
          phone: 'N/A',
          success: false,
          message: `❌ Error interno: ${membershipError.message || 'Error desconocido'}`
        });
      }
    }
    
    // ✅ RESUMEN FINAL
    console.log("📊 RESUMEN DE ENVÍO:");
    console.log(`   ✅ Enviados: ${results.sent}`);
    console.log(`   ❌ Fallidos: ${results.failed}`);
    console.log(`   ⏭️ Omitidos: ${results.skipped}`);
    console.log(`   📊 Total: ${results.total}`);
    
    return NextResponse.json({
      success: true,
      message: `Recordatorios procesados: ${results.sent} enviados, ${results.failed} fallidos, ${results.skipped} omitidos`,
      expirationDate,
      daysBeforeExpiration,
      sent: results.sent,
      failed: results.failed,
      skipped: results.skipped,
      total: results.total,
      details: results.details
    });
    
  } catch (error) {
    console.error("❌ Error general al enviar recordatorios:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error al enviar recordatorios: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
