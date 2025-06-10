import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import twilio from 'twilio';

export async function POST(req: NextRequest) {
  try {
    console.log("API send-welcome-whatsapp iniciada");
    const body = await req.json();
    const userId = body.userId;
    
    if (!userId) {
      console.error("Error: userId es requerido");
      return NextResponse.json({ success: false, message: "ID de usuario requerido" }, { status: 400 });
    }
    
    // Obtener datos del usuario
    console.log("Obteniendo datos del usuario...");
    const { data: user, error: userError } = await supabaseAdmin
      .from('Users')
      .select('firstName, lastName, whatsapp')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error("Error al obtener datos del usuario:", userError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al obtener datos del usuario", 
        error: userError 
      }, { status: 500 });
    }
    
    if (!user || !user.whatsapp) {
      console.error("Usuario no encontrado o sin número de WhatsApp:", userId);
      return NextResponse.json({ 
        success: false, 
        message: "Usuario no tiene número de WhatsApp" 
      }, { status: 400 });
    }
    
    // Formatear el número de teléfono (asegurarse que tiene formato internacional)
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
    console.log(`Número formateado para WhatsApp: ${whatsappNumber}`);
    
    // Inicializar cliente de Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.error("Credenciales de Twilio no configuradas");
      return NextResponse.json({
        success: false,
        message: "Error de configuración: Credenciales de Twilio no disponibles"
      }, { status: 500 });
    }
    
    const client = twilio(accountSid, authToken);
    
    // Obtener nombre completo para la variable de la plantilla
    const fullName = `${user.firstName} ${user.lastName}`;
    console.log(`Enviando mensaje de WhatsApp a ${whatsappNumber} para ${fullName}...`);
    
    // Enviar mensaje usando la plantilla aprobada
    try {
      const twilioMessage = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: whatsappNumber,
        contentSid: process.env.TWILIO_TEMPLATE_ID,
        contentVariables: JSON.stringify({
          "1": fullName
        })
      });
      
      console.log("Mensaje enviado con SID:", twilioMessage.sid);
      
      // Actualizar estado en la base de datos
      await supabaseAdmin
        .from('Users')
        .update({
          whatsappSent: true,
          whatsappSentAt: new Date().toISOString()
        })
        .eq('id', userId);
      
      console.log("Estado de envío de WhatsApp actualizado en la base de datos");
      
      return NextResponse.json({
        success: true,
        messageSid: twilioMessage.sid,
        status: twilioMessage.status,
        message: "Mensaje de WhatsApp enviado correctamente"
      });
    } catch (twilioError: any) {
      console.error("Error de Twilio al enviar mensaje:", twilioError);
      return NextResponse.json({
        success: false,
        message: "Error al enviar mensaje de WhatsApp",
        error: twilioError.message || 'Error desconocido de Twilio',
        code: twilioError.code
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error general al enviar mensaje de WhatsApp:", error);
    return NextResponse.json(
      { success: false, message: `Error al enviar mensaje de WhatsApp: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';