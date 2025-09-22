import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import jsPDF from 'jspdf';
import { deleteAllUserPdfs } from '@/utils/deleteUsersPdfs';

// 🎨 COLORES CORPORATIVOS ENTERPRISE
const COLORS = {
  BLACK: [0, 0, 0] as const,
  WHITE: [255, 255, 255] as const,
  GOLD: [255, 204, 0] as const,
  DARK_GRAY: [30, 30, 30] as const,
  LIGHT_GRAY: [150, 150, 150] as const,
  SUCCESS_GREEN: [76, 175, 80] as const,
  ERROR_RED: [244, 67, 54] as const
};

// 📏 CONSTANTES DE LAYOUT PROFESIONAL
const LAYOUT = {
  PAGE_WIDTH: 215.9,
  PAGE_HEIGHT: 279.4,
  MARGIN_LEFT: 15,
  MARGIN_RIGHT: 15,
  MARGIN_TOP: 20,
  MARGIN_BOTTOM: 35,
  CONTENT_WIDTH: 185.9,
  FOOTER_Y: 250,
  SECTION_SPACING: 12,
  ROW_HEIGHT: 7,
  HEADER_HEIGHT: 12
};

// ✅ FUNCIÓN DE FORMATEO DE FECHA
function formatBirthDate(dateString: string | null | undefined): string {
  try {
    if (!dateString || dateString.trim() === '') {
      return 'No disponible';
    }
    
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'No disponible';
    }
    
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error al formatear fecha de nacimiento:", error);
    return 'No disponible';
  }
}

// 🛡️ FUNCIÓN HELPER PARA VALORES SEGUROS
function safeValue(value: any, defaultValue: string = 'No disponible'): string {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return String(value).trim();
}

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 API generate-contract ENTERPRISE COMPLETE iniciada");
    const body = await req.json();
    
    const isRegeneration = body.isRegeneration || false;
    const userId = body.userId;
    
    // 🔧 VALIDACIÓN DE ENTRADA
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "ID de usuario requerido" 
      }, { status: 400 });
    }
    
    if (isRegeneration) {
      console.log("🔄 Modo regeneración detectado");
    } else {
      console.log("🏗️ Modo original - generación inicial");
    }
    
    // 📡 OBTENER DATOS DEL USUARIO
    console.log("📡 Obteniendo datos del usuario...");
    const { data: userData, error: userError } = await supabaseAdmin
      .from('Users')
      .select(`
        *,
        addresses!inner(*),
        emergency_contacts!inner(*),
        membership_info!inner(*)
      `)
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      console.error("❌ Error al obtener datos del usuario:", userError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al obtener datos del usuario" 
      }, { status: 500 });
    }
    
    console.log("✅ Datos del usuario obtenidos correctamente");
    
    // 🗑️ LIMPIAR TODOS LOS PDFs SI ES REGENERACIÓN
    if (isRegeneration) {
      await deleteAllUserPdfs(userId);
    }
    
    // 🔍 OBTENER URLs DE ARCHIVOS
    let signatureUrl: string | null = null;
    let profilePictureUrl: string | null = null;
    
    const { data: storageFiles, error: storageError } = await supabaseAdmin.storage
      .from('user-files')
      .list(userId, { 
        limit: 100,
        sortBy: { column: 'updated_at', order: 'desc' }
      });
    
    if (!storageError && storageFiles && storageFiles.length > 0) {
      const signatureFile = storageFiles.find(file => file.name.startsWith('signature-'));
      if (signatureFile) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('user-files')
          .getPublicUrl(`${userId}/${signatureFile.name}`);
        signatureUrl = publicUrlData.publicUrl;
      }
      
      const profileFile = storageFiles.find(file => file.name.startsWith('profile-'));
      if (profileFile) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('user-files')
          .getPublicUrl(`${userId}/${profileFile.name}`);
        profilePictureUrl = publicUrlData.publicUrl;
      }
    }
    
    // 🔄 FALLBACK A URLs DE LA BASE DE DATOS
    if (!signatureUrl && userData.signatureUrl && !userData.signatureUrl.startsWith('blob:')) {
      signatureUrl = userData.signatureUrl;
    }
    
    if (!profilePictureUrl && userData.profilePictureUrl && !userData.profilePictureUrl.startsWith('blob:')) {
      profilePictureUrl = userData.profilePictureUrl;
    }
    
    console.log("🔍 URLs finales:", { signatureUrl: !!signatureUrl, profilePictureUrl: !!profilePictureUrl });

    // 🎨 CREAR PDF CON LAYOUT PERFECTO
    console.log("🎨 Iniciando generación del PDF ENTERPRISE COMPLETE...");
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    
    // 🦶 PIE DE PÁGINA PERFECTO
    const addPerfectFooter = (): void => {
      const pageCount = doc.internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // 📏 LÍNEA SEPARADORA DORADA
        doc.setDrawColor(...COLORS.GOLD);
        doc.setLineWidth(1);
        doc.line(LAYOUT.MARGIN_LEFT, LAYOUT.FOOTER_Y, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, LAYOUT.FOOTER_Y);
        
        // 🏢 INFORMACIÓN CORPORATIVA - CENTRADA
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.WHITE);
        doc.setFont('helvetica', 'bold');
        doc.text('MUSCLE UP GYM', LAYOUT.PAGE_WIDTH / 2, LAYOUT.FOOTER_Y + 6, {align: 'center'});
        
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.LIGHT_GRAY);
        doc.setFont('helvetica', 'normal');
        doc.text('Email: administracion@muscleupgym.fitness | Tel: 866-112-7905', LAYOUT.PAGE_WIDTH / 2, LAYOUT.FOOTER_Y + 11, {align: 'center'});
        doc.text('Tu salud y bienestar es nuestra misión', LAYOUT.PAGE_WIDTH / 2, LAYOUT.FOOTER_Y + 16, {align: 'center'});
        
        // 📄 NÚMERO DE PÁGINA - DERECHA
        doc.setTextColor(...COLORS.GOLD);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`Página ${i} de ${pageCount}`, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, LAYOUT.FOOTER_Y + 6, {align: 'right'});
        
        // 📅 FECHA - IZQUIERDA
        const currentDate = new Date();
        const dateStr = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
        doc.setTextColor(...COLORS.LIGHT_GRAY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`Generado: ${dateStr}`, LAYOUT.MARGIN_LEFT, LAYOUT.FOOTER_Y + 16);
      }
    };
    
    // 🎨 FUNCIÓN PARA CREAR HEADER DE SECCIÓN
    const createSectionHeader = (title: string, y: number): number => {
      doc.setFillColor(...COLORS.DARK_GRAY);
      doc.rect(LAYOUT.MARGIN_LEFT, y - 3, LAYOUT.CONTENT_WIDTH, LAYOUT.HEADER_HEIGHT, 'F');
      
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(title, LAYOUT.MARGIN_LEFT + 5, y + 4);
      
      doc.setDrawColor(...COLORS.GOLD);
      doc.setLineWidth(0.5);
      doc.line(LAYOUT.MARGIN_LEFT + 5, y + 6, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 5, y + 6);
      
      return y + LAYOUT.HEADER_HEIGHT + 5;
    };
    
    // 🎨 FUNCIÓN PARA CREAR FILA DE DATOS CORREGIDA
    const createDataRow = (label: string, value: string, y: number, isEven: boolean, maxWidth: number = LAYOUT.CONTENT_WIDTH - 10): number => {
      // 🎨 FONDO ALTERNADO CON ANCHO AJUSTADO
      if (isEven) {
        doc.setFillColor(20, 20, 20);
        doc.rect(LAYOUT.MARGIN_LEFT + 5, y - 2, maxWidth, LAYOUT.ROW_HEIGHT - 1, 'F');
      }
      
      // 🏷️ ETIQUETA
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(label, LAYOUT.MARGIN_LEFT + 8, y + 2);
      
      // 📝 VALOR
      doc.setTextColor(...COLORS.WHITE);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(value, LAYOUT.MARGIN_LEFT + 65, y + 2);
      
      return y + LAYOUT.ROW_HEIGHT;
    };
    
    // 🎨 FUNCIÓN PARA VERIFICAR ESPACIO EN PÁGINA
    const checkPageSpace = (currentY: number, requiredSpace: number): number => {
      if (currentY + requiredSpace > LAYOUT.FOOTER_Y - 10) {
        doc.addPage();
        // 🖤 FONDO NEGRO PARA NUEVA PÁGINA
        doc.setFillColor(...COLORS.BLACK);
        doc.rect(0, 0, LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT, 'F');
        return LAYOUT.MARGIN_TOP;
      }
      return currentY;
    };
    
    try {
      // 🖤 FONDO NEGRO PRINCIPAL
      doc.setFillColor(...COLORS.BLACK);
      doc.rect(0, 0, LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT, 'F');
      
      let currentY = LAYOUT.MARGIN_TOP;
      
      // 🎨 HEADER PRINCIPAL PERFECTO
      try {
        const logoUrl = `${req.nextUrl.origin}/logo.png`;
        const logoResponse = await fetch(logoUrl);
        
        if (logoResponse.ok) {
          const logoBuffer = await logoResponse.arrayBuffer();
          const base64Logo = Buffer.from(logoBuffer).toString('base64');
          
          // 🖼️ LOGO CON PROPORCIONES PERFECTAS
          const logoX = LAYOUT.MARGIN_LEFT;
          const logoY = currentY;
          const logoWidth = 45;
          const logoHeight = 25;
          
          // 🖼️ MARCO DORADO
          doc.setDrawColor(...COLORS.GOLD);
          doc.setLineWidth(1);
          doc.rect(logoX - 1, logoY - 1, logoWidth + 2, logoHeight + 2);
          
          doc.addImage(`data:image/png;base64,${base64Logo}`, 'PNG', logoX, logoY, logoWidth, logoHeight);
          console.log("✅ Logo añadido perfectamente");
        }
      } catch (logoError) {
        console.error("⚠️ Error con logo:", logoError);
        
        // 🎨 PLACEHOLDER PERFECTO
        const logoX = LAYOUT.MARGIN_LEFT;
        const logoY = currentY;
        const logoWidth = 45;
        const logoHeight = 25;
        
        doc.setFillColor(...COLORS.GOLD);
        doc.rect(logoX, logoY, logoWidth, logoHeight, 'F');
        
        doc.setTextColor(...COLORS.BLACK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('MUSCLE UP GYM', logoX + logoWidth/2, logoY + logoHeight/2, {align: 'center'});
      }
      
      // 🏢 INFORMACIÓN CORPORATIVA PERFECTA
      const infoX = LAYOUT.MARGIN_LEFT + 55;
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('MUSCLE UP GYM', infoX, currentY + 8);
      
      doc.setTextColor(...COLORS.LIGHT_GRAY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Centro de Acondicionamiento Físico Profesional', infoX, currentY + 15);
      doc.text('Tu salud y bienestar es nuestra misión', infoX, currentY + 20);
      
      currentY += 35;
      
      // 🏷️ TÍTULO PRINCIPAL PERFECTO
      doc.setFillColor(...COLORS.GOLD);
      doc.rect(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.CONTENT_WIDTH, 12, 'F');
      
      doc.setTextColor(...COLORS.BLACK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('CONTRATO DE MEMBRESÍA', LAYOUT.PAGE_WIDTH / 2, currentY + 8, {align: 'center'});
      
      currentY += 20;
      
      // 📏 LÍNEA DECORATIVA
      doc.setDrawColor(...COLORS.GOLD);
      doc.setLineWidth(1.5);
      doc.line(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, currentY);
      
      currentY += 10;
      
      // 👤 INFORMACIÓN PERSONAL
      currentY = checkPageSpace(currentY, 80);
      currentY = createSectionHeader('INFORMACIÓN PERSONAL', currentY);
      
      // 🖼️ FOTO DE PERFIL CORREGIDA - POSICIÓN SUPERIOR
      if (profilePictureUrl) {
        try {
          const profilePicPath = new URL(profilePictureUrl).pathname.split('/object/public/user-files/')[1];
          const { data: imageData, error: imageError } = await supabaseAdmin
            .storage
            .from('user-files')
            .download(profilePicPath);
          
          if (!imageError && imageData) {
            const buffer = Buffer.from(await imageData.arrayBuffer());
            const imageBase64 = buffer.toString('base64');
            
            // 🎯 POSICIÓN CORREGIDA - MÁS ARRIBA Y MEJOR ALINEADA
            const photoX = LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 38;
            const photoY = currentY - 5; // ✅ MÁS ARRIBA
            const photoSize = 35;
            
            // 🖼️ MARCO DORADO PERFECTO SIN SOLAPAMIENTO
            doc.setDrawColor(...COLORS.GOLD);
            doc.setLineWidth(1.5);
            doc.rect(photoX - 1, photoY - 1, photoSize + 2, photoSize + 2);
            
            // 🎨 FONDO BLANCO LIMPIO
            doc.setFillColor(...COLORS.WHITE);
            doc.rect(photoX, photoY, photoSize, photoSize, 'F');
            
            const imageFormat = profilePictureUrl.toLowerCase().includes('.png') ? 'PNG' : 'JPEG';
            doc.addImage(`data:image/${imageFormat.toLowerCase()};base64,${imageBase64}`, imageFormat, photoX, photoY, photoSize, photoSize);
            
            console.log("✅ Foto posicionada correctamente arriba");
          }
        } catch (profileError) {
          console.error("❌ Error procesando foto:", profileError);
        }
      }
      
      // 📋 DATOS PERSONALES CON MARGEN AJUSTADO PARA NO SOLAPAR
      const personalData = [
        ['Nombre Completo:', `${safeValue(userData.firstName)} ${safeValue(userData.lastName)}`],
        ['Correo Electrónico:', safeValue(userData.email)],
        ['WhatsApp:', safeValue(userData.whatsapp)],
        ['Fecha de Nacimiento:', formatBirthDate(userData.birthDate)],
        ['Género:', safeValue(userData.gender, 'No especificado')],
        ['Estado Civil:', safeValue(userData.maritalStatus, 'No especificado')]
      ];
      
      personalData.forEach(([label, value], index) => {
        // 🎯 MARGEN AJUSTADO PARA NO SOLAPAR CON FOTO
        currentY = createDataRow(label, value, currentY, index % 2 === 0, 130); // ✅ ANCHO REDUCIDO
      });
      
      // 🆔 HUELLA DIGITAL
      currentY += 5;
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Huella Digital:', LAYOUT.MARGIN_LEFT + 8, currentY);
      
      if (userData.fingerprint) {
        doc.setTextColor(...COLORS.SUCCESS_GREEN);
        doc.text('✓ REGISTRADA', LAYOUT.MARGIN_LEFT + 65, currentY);
      } else {
        doc.setTextColor(...COLORS.ERROR_RED);
        doc.text('✗ PENDIENTE', LAYOUT.MARGIN_LEFT + 65, currentY);
      }
      
      currentY += LAYOUT.SECTION_SPACING;
      
      // 🏠 DIRECCIÓN
      if (userData.addresses && userData.addresses.length > 0) {
        currentY = checkPageSpace(currentY, 70);
        currentY = createSectionHeader('DIRECCIÓN', currentY);
        
        const address = userData.addresses[0];
        const addressData = [
          ['Calle:', safeValue(address.street)],
          ['Número:', safeValue(address.number)],
          ['Colonia:', safeValue(address.neighborhood)],
          ['Ciudad:', safeValue(address.city)],
          ['Estado:', safeValue(address.state)],
          ['Código Postal:', safeValue(address.postalCode)],
          ['País:', safeValue(address.country, 'México')]
        ];
        
        addressData.forEach(([label, value], index) => {
          currentY = createDataRow(label, value, currentY, index % 2 === 0);
        });
        
        currentY += LAYOUT.SECTION_SPACING;
      }
      
      // 🆘 CONTACTO DE EMERGENCIA
      if (userData.emergency_contacts && userData.emergency_contacts.length > 0) {
        currentY = checkPageSpace(currentY, 50);
        currentY = createSectionHeader('CONTACTO DE EMERGENCIA', currentY);
        
        const emergency = userData.emergency_contacts[0];
        const emergencyData = [
          ['Nombre:', safeValue(emergency.name)],
          ['Teléfono:', safeValue(emergency.phone)],
          ['Condición Médica:', safeValue(emergency.medicalCondition)],
          ['Tipo de Sangre:', safeValue(emergency.bloodType)]
        ];
        
        emergencyData.forEach(([label, value], index) => {
          currentY = createDataRow(label, value, currentY, index % 2 === 0);
        });
        
        currentY += LAYOUT.SECTION_SPACING;
      }
      
      // 💪 INFORMACIÓN DE MEMBRESÍA
      if (userData.membership_info && userData.membership_info.length > 0) {
        currentY = checkPageSpace(currentY, 50);
        currentY = createSectionHeader('INFORMACIÓN DE MEMBRESÍA', currentY);
        
        const membership = userData.membership_info[0];
        const membershipData = [
          ['Referido por:', safeValue(membership.referredBy, 'No especificado')],
          ['Motivación principal:', safeValue(membership.mainMotivation, 'No especificado')],
          ['Nivel de entrenamiento:', safeValue(membership.trainingLevel, 'No especificado')],
          ['Recibe promociones:', membership.receivePlans ? 'Sí' : 'No']
        ];
        
        membershipData.forEach(([label, value], index) => {
          currentY = createDataRow(label, value, currentY, index % 2 === 0);
        });
      }
      
      // 📜 REGLAMENTO COMPLETO - NUEVA PÁGINA
      doc.addPage();
      doc.setFillColor(...COLORS.BLACK);
      doc.rect(0, 0, LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT, 'F');
      
      currentY = LAYOUT.MARGIN_TOP;
      
      // 🎨 HEADER DE REGLAMENTO PERFECTO
      doc.setFillColor(...COLORS.GOLD);
      doc.rect(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.CONTENT_WIDTH, 15, 'F');
      
      doc.setTextColor(...COLORS.BLACK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('NORMATIVAS PARA SER USUARIO DE MUSCLE UP GYM', LAYOUT.PAGE_WIDTH / 2, currentY + 10, {align: 'center'});
      
      currentY += 25;
      
      // 📋 SECCIÓN 1: CONTROL DE ACCESO Y VIGENCIA
      currentY = checkPageSpace(currentY, 20);
      
      doc.setFillColor(...COLORS.DARK_GRAY);
      doc.rect(LAYOUT.MARGIN_LEFT, currentY - 3, LAYOUT.CONTENT_WIDTH, 10, 'F');
      
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RESPECTO AL CONTROL DE ACCESO Y VIGENCIA DE MEMBRESÍA', LAYOUT.MARGIN_LEFT + 5, currentY + 3);
      
      currentY += 15;
      
      // 📝 NOTA IMPORTANTE DE RENOVACIÓN
      doc.setTextColor(...COLORS.WHITE);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('"La renovación del pago se deberá realizar mínimo con dos días de antelación a la fecha de corte".', LAYOUT.MARGIN_LEFT + 5, currentY);
      
      currentY += 10;
      
      const accessRules = [
        'El acceso a las instalaciones de MUSCLE UP GYM se realizará mediante la identificación oportuna de su huella digital, respetando los horarios establecidos y la instalación asignada.',
        'El biométrico de huella digital liberará el acceso a las instalaciones de MUSCLE UP GYM siempre y cuando su membresía esté vigente.',
        'Su vigencia terminará el día que sea indicado en su comprobante de pago, por ejemplo, si su vigencia termina el día 5 de enero, ese día el biométrico ya no liberará acceso si no ha renovado.',
        'Si el usuario tiene que ausentarse de su actividad en el GIMNASIO debido a cuestiones personales, por ejemplo, mudanzas, lesiones, etc., su membresía no podrá ser congelada ni transferida a otra persona.',
        'Después de un periodo de inactividad de 6 meses continuos en el gimnasio, se DEPURARÁ (eliminará) sus datos, por tanto, al reactivar su membresía tendrá que cubrir el pago de inscripción nuevamente.',
        'Una vez utilizada la membresía no podrá ser cambiada o transferida a otra modalidad de membresía, sin embargo, una vez vencida la membresía el usuario podrá elegir pagar otro tipo de membresía si así lo desea.',
        'Podrá realizar su pago de inscripción y membresía con antelación e indicarnos cuándo comenzará a asistir.',
        'La dirección se reserva el derecho de realizar cambios en la reglamentación, costos y horarios cuando estime oportuno.',
        'El usuario podrá acceder en dos ocasiones con su huella digital durante el día por lo cual tiene permitido salir de emergencia; sin embargo, si regresa una tercera vez se negará el segundo acceso.',
        'Los menores de 18 años deberán presentar la firma del padre, madre o tutor del presente documento.',
        'Por motivos de seguridad, la edad mínima para inscribirse como usuario de MUSCLE UP GYM es de 12 años.'
      ];
      
      accessRules.forEach((rule, index) => {
        currentY = checkPageSpace(currentY, 15);
        
        // 🎨 BULLET POINT DORADO
        doc.setFillColor(...COLORS.GOLD);
        doc.circle(LAYOUT.MARGIN_LEFT + 8, currentY + 3, 1.5, 'F');
        
        // 📝 TEXTO DE LA REGLA
        doc.setTextColor(...COLORS.WHITE);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(rule, LAYOUT.CONTENT_WIDTH - 20);
        doc.text(lines, LAYOUT.MARGIN_LEFT + 15, currentY + 4);
        
        currentY += lines.length * 4 + 3;
      });
      
      // 📋 SECCIÓN 2: HORARIOS DE OPERACIÓN
      currentY = checkPageSpace(currentY, 20);
      currentY += 10;
      
      doc.setFillColor(...COLORS.DARK_GRAY);
      doc.rect(LAYOUT.MARGIN_LEFT, currentY - 3, LAYOUT.CONTENT_WIDTH, 10, 'F');
      
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RESPECTO A LOS HORARIOS DE OPERACIÓN', LAYOUT.MARGIN_LEFT + 5, currentY + 3);
      
      currentY += 15;
      
      const scheduleRules = [
        'Los horarios en los que MUSCLE UP GYM opera son de lunes a viernes de 6:30 am a 10:00 pm y sábados de 9:00 am a 5:00 pm.',
        'En días festivos nacionales que sean marcados entre lunes a viernes, el horario será modificado de 8:30 am a 6:30 pm; en cuanto a festivos nacionales que sean marcados en sábado se modificará de 9:00 am a 3:00 pm.',
        'Los días 25 de diciembre, 1 de enero y viernes y sábado de semana santa las instalaciones de MUSCLE UP GYM permanecerán cerradas.',
        'MUSCLE UP GYM podrá modificar el horario por algún trabajo de reparación o remodelación o por alguna necesidad de operación en las instalaciones, notificando con antelación a los usuarios.'
      ];
      
      scheduleRules.forEach((rule, index) => {
        currentY = checkPageSpace(currentY, 15);
        
        doc.setFillColor(...COLORS.GOLD);
        doc.circle(LAYOUT.MARGIN_LEFT + 8, currentY + 3, 1.5, 'F');
        
        doc.setTextColor(...COLORS.WHITE);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(rule, LAYOUT.CONTENT_WIDTH - 20);
        doc.text(lines, LAYOUT.MARGIN_LEFT + 15, currentY + 4);
        
        currentY += lines.length * 4 + 3;
      });
      
      // 📋 SECCIÓN 3: RESPONSABILIDAD POR USO DE INSTALACIONES
      currentY = checkPageSpace(currentY, 20);
      currentY += 10;
      
      doc.setFillColor(...COLORS.DARK_GRAY);
      doc.rect(LAYOUT.MARGIN_LEFT, currentY - 3, LAYOUT.CONTENT_WIDTH, 10, 'F');
      
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RESPECTO A LA RESPONSABILIDAD POR EL USO DE LAS INSTALACIONES', LAYOUT.MARGIN_LEFT + 5, currentY + 3);
      
      currentY += 15;
      
      const responsibilityRules = [
        'Con carácter general, MUSCLE UP GYM no será responsable de las lesiones que pueda sufrir el usuario salvo que se deriven de un mal estado de la instalación.',
        'La entidad MUSCLE UP GYM no promete ninguna indemnización al usuario en caso de accidentes o desperfectos derivados del incumplimiento de estas normas.',
        'MUSCLE UP GYM no se hará responsable por el robo o sustracción de sus pertenencias. Sin embargo, tendrá a su disposición un servicio alternativo de custodia.',
        'El staff de MUSCLE UP GYM tiene prohibido resguardar objetos personales de los usuarios en la oficina.',
        'Los usuarios mantendrán la limpieza y el orden de toda la instalación, equipamientos y material deportivo, así como un comportamiento respetuoso. El incumplimiento supondrá la baja automática y definitiva.',
        'Antes de comenzar cualquier actividad física, es recomendable que el usuario pase una revisión médica inicial.',
        'Por motivos de seguridad, higiene y salud es OBLIGATORIO realizar protocolo de ingreso: ingresar con su huella digital, pasar por tapete sanitizante y realizar el secado de su suela.',
        'Por motivos de higiene y salud es OBLIGATORIO el uso de 2 toallas para la utilización de las máquinas.',
        'El usuario deberá colocar el material en los lugares destinados a tal fin, una vez finalizada su utilización.',
        'El usuario deberá dejar libres las máquinas entre descansos de series para que otro usuario pueda utilizarlas.',
        'Por motivos de seguridad personal y protección de equipo, el usuario deberá portar de forma obligatoria ropa deportiva.',
        'Queda prohibido lanzar, arrojar o azotar las mancuernas, barras, máquinas o implementos de entrenamiento. El incumplimiento supondrá la baja automática y definitiva.',
        'Queda prohibido realizar cualquier tipo de actividad física ajena a la sesión de entrenamiento que pueda dañar a los demás usuarios. El incumplimiento supondrá la baja automática.',
        'Queda prohibida la comercialización u ofertamiento de servicios o productos de cualquier tipo dentro de las instalaciones.',
        'Queda prohibido fingir como entrenador personal o instructor, así como ofertar planes de entrenamiento o nutricionales.',
        'Queda prohibida la difusión, repartición, promoción de volantes, folletos, cupones, demostración de mercancías, o cualquier tipo de actividad lucrativa.',
        'Queda prohibido el ingreso de mascotas a las instalaciones, así como dejarlas en el área de oficina/recepción.',
        'En caso de que el usuario asista con una acompañante que no esté inscrito en MUSCLE UP GYM podrá esperar en el área de la oficina siempre y cuando sea mayor a 12 años.',
        'Está prohibido ingerir bebidas alcohólicas, drogas o fumar dentro de las instalaciones.',
        'Si el usuario presenta aliento alcohólico o se encuentra bajo la influencia de drogas se negará su acceso a las instalaciones.',
        'Ningún usuario podrá ingresar a las instalaciones portando armas ni objetos punzocortantes.',
        'MUSCLE UP GYM cuenta con venta de suplementos deportivos, sin embargo, la compra y consumo será completa responsabilidad del usuario.',
        'Está parcialmente permitido que el usuario se tome fotografías y videos a sí mismo dentro de las instalaciones, siempre y cuando no fotografíe a personas ajenas sin consentimiento.',
        'El usuario afirma conocer y se compromete a respetar la normativa desde el momento de formalizar la inscripción.',
        'MUSCLE UP GYM se reserva el derecho de admisión.'
      ];
      
      responsibilityRules.forEach((rule, index) => {
        currentY = checkPageSpace(currentY, 15);
        
        doc.setFillColor(...COLORS.GOLD);
        doc.circle(LAYOUT.MARGIN_LEFT + 8, currentY + 3, 1.5, 'F');
        
        doc.setTextColor(...COLORS.WHITE);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const lines = doc.splitTextToSize(rule, LAYOUT.CONTENT_WIDTH - 20);
        doc.text(lines, LAYOUT.MARGIN_LEFT + 15, currentY + 4);
        
        currentY += lines.length * 4 + 3;
      });
      
      // ✍️ SECCIÓN DE FIRMA CORREGIDA - SIN MARCO GRANDE
      currentY = checkPageSpace(currentY, 40);
      currentY += 15;
      
      // 🎨 SOLO TEXTO DE ACEPTACIÓN - SIN MARCO GRANDE
      doc.setTextColor(...COLORS.GOLD);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ACEPTACIÓN Y FIRMA', LAYOUT.PAGE_WIDTH / 2, currentY, {align: 'center'});
      
      // 📏 LÍNEA DORADA SIMPLE BAJO EL TÍTULO
      doc.setDrawColor(...COLORS.GOLD);
      doc.setLineWidth(1);
      doc.line(LAYOUT.MARGIN_LEFT + 50, currentY + 2, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 50, currentY + 2);
      
      currentY += 10;
      
      doc.setTextColor(...COLORS.WHITE);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('He leído, entendido y acepto completamente el reglamento anterior:', LAYOUT.PAGE_WIDTH / 2, currentY, {align: 'center'});
      
      currentY += 15;
      
      // 🖊️ FIRMA CON SOLO MARCO EN LA IMAGEN
      const signatureAreaY = currentY;
      if (signatureUrl) {
        try {
          const signaturePath = new URL(signatureUrl).pathname.split('/object/public/user-files/')[1];
          const { data: signatureData, error: signatureError } = await supabaseAdmin
            .storage
            .from('user-files')
            .download(signaturePath);
          
          if (!signatureError && signatureData) {
            const buffer = Buffer.from(await signatureData.arrayBuffer());
            const signatureBase64 = buffer.toString('base64');
            
            const sigWidth = 50;
            const sigHeight = 12;
            const sigX = (LAYOUT.PAGE_WIDTH - sigWidth) / 2;
            
            // ✅ SOLO MARCO PARA LA IMAGEN DE LA FIRMA
            doc.setDrawColor(...COLORS.GOLD);
            doc.setLineWidth(1);
            doc.rect(sigX - 1, signatureAreaY - 1, sigWidth + 2, sigHeight + 2);
            
            // 🎨 FONDO BLANCO SOLO PARA LA FIRMA
            doc.setFillColor(...COLORS.WHITE);
            doc.rect(sigX, signatureAreaY, sigWidth, sigHeight, 'F');
            
            doc.addImage(`data:image/png;base64,${signatureBase64}`, 'PNG', sigX, signatureAreaY, sigWidth, sigHeight);
            console.log("✅ Firma añadida con marco individual");
          }
        } catch (signError) {
          console.error("❌ Error procesando firma:", signError);
          // 📝 LÍNEA MANUAL SIMPLE
          doc.setDrawColor(...COLORS.GOLD);
          doc.setLineWidth(1);
          doc.line(LAYOUT.PAGE_WIDTH/2 - 25, signatureAreaY + 6, LAYOUT.PAGE_WIDTH/2 + 25, signatureAreaY + 6);
        }
      } else {
        // 📝 LÍNEA MANUAL SIMPLE
        doc.setDrawColor(...COLORS.GOLD);
        doc.setLineWidth(1);
        doc.line(LAYOUT.PAGE_WIDTH/2 - 25, signatureAreaY + 6, LAYOUT.PAGE_WIDTH/2 + 25, signatureAreaY + 6);
      }
      
      currentY += 20;
      
      // 📝 NOMBRE DEL CLIENTE
      doc.setTextColor(...COLORS.WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${safeValue(userData.firstName)} ${safeValue(userData.lastName)}`, LAYOUT.PAGE_WIDTH / 2, currentY, {align: 'center'});
      
      currentY += 7;
      doc.setTextColor(...COLORS.LIGHT_GRAY);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('Nombre completo del cliente', LAYOUT.PAGE_WIDTH / 2, currentY, {align: 'center'});
      
      // 🦶 AÑADIR PIE DE PÁGINA PERFECTO
      addPerfectFooter();
      
      console.log("✅ PDF ENTERPRISE COMPLETE generado correctamente");
      
    } catch (pdfError) {
      console.error("❌ Error generando PDF:", pdfError);
      return NextResponse.json({ 
        success: false, 
        message: `Error generando PDF: ${pdfError instanceof Error ? pdfError.message : 'Error desconocido'}` 
      }, { status: 500 });
    }
    
    // 📦 FINALIZACIÓN PERFECTA
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const timestamp = Date.now();
    const pdfPath = `${userId}/contrato-enterprise-complete-${timestamp}.pdf`;
    
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('user-files')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (uploadError) {
      console.error("❌ Error subiendo PDF:", uploadError);
      return NextResponse.json({ 
        success: false, 
        message: "Error subiendo PDF" 
      }, { status: 500 });
    }
    
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from('user-files')
      .getPublicUrl(pdfPath);
      
    if (!publicUrlData?.publicUrl) {
      return NextResponse.json({ 
        success: false, 
        message: "Error obteniendo URL del PDF" 
      }, { status: 500 });
    }
    
    // 💾 ACTUALIZAR REFERENCIA
    await supabaseAdmin
      .from('Users')
      .update({ 
        contractPdfUrl: publicUrlData.publicUrl,
        contractUpdatedAt: new Date().toISOString()
      })
      .eq('id', userId);
    
    const successMessage = isRegeneration 
      ? "PDF ENTERPRISE COMPLETE regenerado correctamente"
      : "PDF ENTERPRISE COMPLETE generado correctamente";
    
    console.log(`✅ ${successMessage}`);
    
    return NextResponse.json({
      success: true,
      pdfUrl: publicUrlData.publicUrl,
      message: successMessage,
      isRegeneration: isRegeneration,
      signatureIncluded: !!signatureUrl,
      profilePictureIncluded: !!profilePictureUrl,
      version: "ENTERPRISE_COMPLETE",
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Error general:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Error general: ${error instanceof Error ? error.message : 'Error desconocido'}`
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';