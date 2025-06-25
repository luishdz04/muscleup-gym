import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    console.log("API send-welcome-email iniciada");
    const body = await req.json();
    const userId = body.userId;
    
    if (!userId) {
      console.error("Error: userId es requerido");
      return NextResponse.json({ success: false, message: "ID de usuario requerido" }, { status: 400 });
    }
    
    // Obtener datos del usuario incluyendo la URL del PDF
    console.log("Obteniendo datos del usuario...");
    const { data: user, error: userError } = await supabaseAdmin
      .from('Users')
      .select('firstName, lastName, email, contractPdfUrl')
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
    
    if (!user || !user.email) {
      console.error("Usuario no encontrado o sin correo electrónico:", userId);
      return NextResponse.json({ 
        success: false, 
        message: "Usuario no tiene correo electrónico" 
      }, { status: 400 });
    }
    
    // Verificar las credenciales de correo
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587');
    
    if (!emailUser || !emailPass) {
      console.error("Credenciales de correo no configuradas");
      return NextResponse.json({
        success: false,
        message: "Error de configuración: Credenciales de correo no disponibles"
      }, { status: 500 });
    }

    // SOLUCIÓN: Extraer el path del archivo desde la URL
    let pdfAttachment = null;
    let pdfUrl = '';
    
    try {
      if (user.contractPdfUrl) {
        pdfUrl = user.contractPdfUrl;
        
        // Obtiene la ruta del archivo en el bucket a partir de la URL
        const pdfPath = decodeURIComponent(user.contractPdfUrl.split('/object/public/user-files/')[1]);
        console.log("Intentando obtener PDF desde Storage con path:", pdfPath);
        
        // Descargar usando el cliente de Supabase en lugar de axios
        const { data: pdfData, error: pdfError } = await supabaseAdmin
          .storage
          .from('user-files')
          .download(pdfPath);
          
        if (pdfError || !pdfData) {
          console.error("Error al descargar PDF desde Supabase Storage:", pdfError);
          // Continuamos sin adjunto, proporcionaremos el enlace en su lugar
        } else {
          console.log("PDF descargado correctamente con Supabase");
          // Convertir el Blob a Buffer para adjuntarlo
          const arrayBuffer = await pdfData.arrayBuffer();
          pdfAttachment = {
            filename: `Contrato_Muscle_Up_Gym_${user.firstName}_${user.lastName}.pdf`,
            content: Buffer.from(arrayBuffer),
            contentType: 'application/pdf'
          };
        }
      }
    } catch (pdfError) {
      console.error("Error al procesar el PDF:", pdfError);
      // Continuamos sin adjunto, usaremos el enlace
    }
    
    // Configurar el transportador de correo
    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465, // true para 465, false para otros puertos
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
    
    // Nombre completo para la personalización
    const fullName = `${user.firstName} ${user.lastName}`;
    console.log(`Enviando correo a ${user.email} para ${fullName}...`);
    
    // Preparamos el contenido del correo con o sin enlace al PDF
    let pdfContent = '';
    if (pdfAttachment) {
      pdfContent = `<p style="color: #666; line-height: 1.6;">
        Hemos adjuntado a este correo tu contrato de membresía. Por favor, revísalo y consérvalo para futuras referencias.
      </p>`;
    } else if (pdfUrl) {
      pdfContent = `<p style="color: #666; line-height: 1.6;">
        Puedes descargar tu contrato de membresía <a href="${pdfUrl}" target="_blank" style="color: #ffcc00; font-weight: bold;">haciendo click aquí</a>. 
        Por favor, revísalo y consérvalo para futuras referencias.
      </p>`;
    }
    
    // Contenido del correo
    const mailOptions = {
      from: `"Muscle Up Gym" <${emailUser}>`,
      to: user.email,
      subject: "¡Bienvenido a Muscle Up Gym!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://muscleupgym.com.mx/wp-content/uploads/2024/02/logo-word-bueno.png" alt="Muscle Up Gym Logo" style="max-width: 200px;">
          </div>
          
          <h2 style="color: #000; text-align: center;">¡Hola ${fullName}!</h2>
          
          <p style="color: #666; line-height: 1.6;">
            ¡Bienvenido a Muscle Up Gym! Estamos emocionados de tenerte como parte de nuestra comunidad fitness.
          </p>
          
          ${pdfContent}
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #000; margin-top: 0;">Horario de atención:</h3>
            <ul style="color: #666; padding-left: 20px;">
              <li>Lunes a Viernes: 6:00 AM a 10:00 PM</li>
              <li>Sábados: 9:00 AM a 5:00 PM</li>
            </ul>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos:
          </p>
          
          <ul style="color: #666; padding-left: 20px;">
            <li>Teléfono: 866-112-7905</li>
            <li>Email: administracion@muscleupgym.fitness</li>
          </ul>
          
          <p style="color: #666; line-height: 1.6; text-align: center; margin-top: 30px; font-style: italic;">
            "Tu salud y bienestar es nuestra misión"
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">
              © ${new Date().getFullYear()} Muscle Up Gym. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
      attachments: pdfAttachment ? [pdfAttachment] : []
    };
    
    // Enviar el correo
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Correo enviado con ID:", info.messageId);
      
      // Actualizar estado en la base de datos
      await supabaseAdmin
        .from('Users')
        .update({
          emailSent: true,
          emailSentAt: new Date().toISOString()
        })
        .eq('id', userId);
      
      console.log("Estado de envío de correo actualizado en la base de datos");
      
      return NextResponse.json({
        success: true,
        messageId: info.messageId,
        message: "Correo electrónico enviado correctamente"
      });
    } catch (emailError) {
      console.error("Error al enviar correo:", emailError);
      return NextResponse.json({
        success: false,
        message: "Error al enviar correo electrónico",
        error: emailError instanceof Error ? emailError.message : 'Error desconocido'
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error general al enviar correo:", error);
    return NextResponse.json(
      { success: false, message: `Error al enviar correo: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
