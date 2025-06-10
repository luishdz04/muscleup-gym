import twilio from 'twilio';

export class TwilioHelper {
  private client: twilio.Twilio;
  private maxRetries: number = 3;
  
  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error("Credenciales de Twilio no configuradas");
    }
    
    this.client = twilio(accountSid, authToken);
  }
  
  // Normaliza números de teléfono al formato internacional para México
  normalizePhoneNumber(phone: string): string {
    let normalized = phone.trim();
    
    // Eliminar espacios, paréntesis, guiones, etc.
    normalized = normalized.replace(/[\s()+-]/g, '');
    
    // Si empieza con 0, lo quitamos
    if (normalized.startsWith('0')) {
      normalized = normalized.substring(1);
    }
    
    // Si no empieza con +, asumimos que es número mexicano
    if (!normalized.startsWith('+')) {
      // Si ya tiene 52 al inicio, solo agregamos el +
      if (normalized.startsWith('52')) {
        normalized = '+' + normalized;
      } else {
        normalized = '+52' + normalized;
      }
    }
    
    return normalized;
  }
  
  // Envía mensaje con reintentos automáticos
  async sendTemplatedWhatsAppMessage(
    phoneNumber: string, 
    params: Record<string, string>
  ): Promise<{success: boolean, sid?: string, error?: string}> {
    // Formato correcto para WhatsApp
    const to = `whatsapp:${this.normalizePhoneNumber(phoneNumber)}`;
    let attempts = 0;
    let lastError: any = null;
    
    while (attempts < this.maxRetries) {
      try {
        const message = await this.client.messages.create({
          from: process.env.TWILIO_WHATSAPP_NUMBER,
          to,
          contentSid: process.env.TWILIO_TEMPLATE_ID,
          contentVariables: JSON.stringify(params)
        });
        
        return {
          success: true,
          sid: message.sid
        };
      } catch (error) {
        lastError = error;
        attempts++;
        
        // Espera exponencial entre reintentos
        if (attempts < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'Error desconocido después de múltiples intentos'
    };
  }
}

// Singleton para uso en toda la aplicación
let twilioHelperInstance: TwilioHelper | null = null;

export function getTwilioHelper(): TwilioHelper {
  if (!twilioHelperInstance) {
    twilioHelperInstance = new TwilioHelper();
  }
  return twilioHelperInstance;
}