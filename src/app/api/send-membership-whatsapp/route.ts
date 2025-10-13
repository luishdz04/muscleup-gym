// src/app/api/send-membership-whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import twilio from 'twilio';
import { formatDateLong } from '@/utils/dateUtils';

/**
 * API para enviar notificación de WhatsApp al registrar/renovar membresía
 * 
 * Body esperado:
 * {
 *   membershipId: string,  // ID de la membresía creada en user_memberships
 *   isRenewal: boolean     // true si es renovación, false si es nueva
 * }
 */
export async function POST(req: NextRequest) {
  try {
    console.log("🚀 API send-membership-whatsapp iniciada");
    const body = await req.json();
    const { membershipId, isRenewal } = body;
    
    // ✅ VALIDACIÓN DE PARÁMETROS
    if (!membershipId) {
      console.error("❌ Error: membershipId es requerido");
      return NextResponse.json({ 
        success: false, 
        message: "ID de membresía requerido" 
      }, { status: 400 });
    }
    
    // ✅ OBTENER DATOS COMPLETOS DE LA MEMBRESÍA
    console.log(`📊 Obteniendo datos de membresía ID: ${membershipId}`);
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('user_memberships')
      .select(`
        id,
        userid,
        plan_id,
        start_date,
        end_date,
        payment_type,
        total_amount,
        is_renewal
      `)
      .eq('id', membershipId)
      .single();
      
    if (membershipError) {
      console.error("❌ Error al obtener datos de la membresía:", membershipError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al obtener datos de la membresía", 
        error: membershipError 
      }, { status: 500 });
    }
    
    if (!membership) {
      console.error("❌ Membresía no encontrada:", membershipId);
      return NextResponse.json({ 
        success: false, 
        message: "Membresía no encontrada" 
      }, { status: 404 });
    }
    
    // ✅ OBTENER DATOS DEL USUARIO
    console.log(`👤 Obteniendo datos del usuario ID: ${membership.userid}`);
    const { data: user, error: userError } = await supabaseAdmin
      .from('Users')
      .select('id, firstName, lastName, whatsapp')
      .eq('id', membership.userid)
      .single();
      
    if (userError || !user) {
      console.error("❌ Error al obtener datos del usuario:", userError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al obtener datos del usuario" 
      }, { status: 500 });
    }
    
    // ✅ VALIDAR QUE EL USUARIO TENGA WHATSAPP
    if (!user.whatsapp) {
      console.warn("⚠️ Usuario no tiene número de WhatsApp");
      return NextResponse.json({ 
        success: false, 
        message: "Usuario no tiene número de WhatsApp registrado" 
      }, { status: 400 });
    }
    
    // ✅ OBTENER DATOS DEL PLAN
    console.log(`📋 Obteniendo datos del plan ID: ${membership.plan_id}`);
    const { data: plan, error: planError } = await supabaseAdmin
      .from('membership_plans')
      .select('id, name')
      .eq('id', membership.plan_id)
      .single();
      
    if (planError || !plan) {
      console.error("❌ Error al obtener datos del plan:", planError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al obtener datos del plan" 
      }, { status: 500 });
    }
    
    // ✅ FORMATEAR NÚMERO DE TELÉFONO (formato internacional)
    let formattedPhone = user.whatsapp;
    
    // Si el número no inicia con +, agregamos el código de México (+52)
    if (!formattedPhone.startsWith('+')) {
      // Eliminar el primer dígito si es un 0
      if (formattedPhone.startsWith('0')) {
        formattedPhone = formattedPhone.substring(1);
      }
      
      // Si el número ya comienza con 52, solo agregamos el +
      if (formattedPhone.startsWith('52')) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+52' + formattedPhone;
      }
    }
    
    // Preparar el formato que Twilio espera para WhatsApp
    const whatsappNumber = `whatsapp:${formattedPhone}`;
    console.log(`📱 Número formateado para WhatsApp: ${whatsappNumber}`);
    
    // ✅ VALIDAR CREDENCIALES DE TWILIO
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
    
    if (!accountSid || !authToken || !whatsappFrom) {
      console.error("❌ Credenciales de Twilio no configuradas");
      return NextResponse.json({
        success: false,
        message: "Error de configuración: Credenciales de Twilio no disponibles"
      }, { status: 500 });
    }
    
    // ✅ DETERMINAR PLANTILLA Y VARIABLES SEGÚN TIPO DE MEMBRESÍA
    const isRenewalMembership = isRenewal || membership.is_renewal;
    const templateId = isRenewalMembership 
      ? process.env.TWILIO_MEMBERSHIP_RENEWAL_TEMPLATE_ID 
      : process.env.TWILIO_MEMBERSHIP_NEW_TEMPLATE_ID;
    
    if (!templateId) {
      console.error("❌ Template ID no configurado para", isRenewalMembership ? "renovación" : "nueva membresía");
      return NextResponse.json({
        success: false,
        message: `Template ID no configurado para ${isRenewalMembership ? "renovación" : "nueva membresía"}`
      }, { status: 500 });
    }
    
    // ✅ PREPARAR VARIABLES PARA LA PLANTILLA
    const fullName = `${user.firstName} ${user.lastName}`;
    const planName = plan.name || 'Plan de membresía';
    
    // Mapear payment_type a texto legible
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
    const paymentTypeText = paymentTypeLabels[membership.payment_type] || membership.payment_type;
    
    // Formatear fechas
    const startDateFormatted = formatDateLong(membership.start_date);
    const endDateFormatted = formatDateLong(membership.end_date);
    
    // Formatear monto
    const amountFormatted = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(membership.total_amount);
    
    // ✅ CREAR OBJETO DE VARIABLES PARA TWILIO
    const contentVariables = JSON.stringify({
      "1": fullName,              // Nombre del cliente
      "2": planName,              // Nombre del plan
      "3": paymentTypeText,       // Modalidad de pago
      "4": startDateFormatted,    // Fecha de inicio
      "5": endDateFormatted,      // Fecha de vencimiento
      "6": amountFormatted        // Monto pagado
    });
    
    console.log(`📤 Enviando WhatsApp ${isRenewalMembership ? 'de RENOVACIÓN' : 'de NUEVA MEMBRESÍA'} a ${whatsappNumber}`);
    console.log(`📋 Variables:`, contentVariables);
    
    // ✅ INICIALIZAR CLIENTE DE TWILIO
    const client = twilio(accountSid, authToken);
    
    // ✅ ENVIAR MENSAJE USANDO LA PLANTILLA APROBADA
    try {
      const twilioMessage = await client.messages.create({
        from: whatsappFrom,
        to: whatsappNumber,
        contentSid: templateId,
        contentVariables: contentVariables
      });
      
      console.log("✅ Mensaje enviado con SID:", twilioMessage.sid);
      console.log("📊 Estado del mensaje:", twilioMessage.status);
      
      // ✅ OPCIONAL: Actualizar campo en la membresía para registro
      try {
        await supabaseAdmin
          .from('user_memberships')
          .update({
            whatsapp_sent: true,
            whatsapp_sent_at: new Date().toISOString()
          })
          .eq('id', membershipId);
        
        console.log("✅ Estado de envío de WhatsApp actualizado en la base de datos");
      } catch (updateError) {
        console.warn("⚠️ No se pudo actualizar el estado de WhatsApp en la BD (campos opcionales):", updateError);
        // No falla la operación si no existen los campos
      }
      
      return NextResponse.json({
        success: true,
        messageSid: twilioMessage.sid,
        status: twilioMessage.status,
        type: isRenewalMembership ? 'renewal' : 'new',
        message: `Mensaje de WhatsApp de ${isRenewalMembership ? 'renovación' : 'nueva membresía'} enviado correctamente`
      });
      
    } catch (twilioError: any) {
      console.error("❌ Error de Twilio al enviar mensaje:", twilioError);
      
      // Mapear errores comunes de Twilio
      let errorMessage = "Error al enviar mensaje de WhatsApp";
      if (twilioError.code === 21211) {
        errorMessage = "Número de WhatsApp inválido";
      } else if (twilioError.code === 63030) {
        errorMessage = "Template no encontrado o no aprobado en Twilio";
      } else if (twilioError.code === 21608) {
        errorMessage = "El número no está disponible para WhatsApp";
      }
      
      return NextResponse.json({
        success: false,
        message: errorMessage,
        error: twilioError.message || 'Error desconocido de Twilio',
        code: twilioError.code
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("❌ Error general al enviar mensaje de WhatsApp:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error al enviar mensaje de WhatsApp: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
