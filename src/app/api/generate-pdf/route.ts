import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase-admin';
import jsPDF from 'jspdf';

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

// 📏 CONSTANTES DE LAYOUT PROFESIONAL (IDÉNTICAS AL ENTERPRISE)
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

// ✅ FUNCIÓN PARA FORMATEAR LA FECHA DE NACIMIENTO CORRECTAMENTE (ORIGINAL)
function formatBirthDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return dateString || 'No disponible';
    }
    
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error al formatear fecha de nacimiento:", error);
    return dateString || 'No disponible';
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
    console.log("🚀 API generate-pdf ENTERPRISE iniciada");
    const body = await req.json();
    const userId = body.userId;
    
    console.log("📊 Generando PDF ENTERPRISE para usuario:", userId);
    
    if (!userId) {
      console.error("❌ Error: userId es requerido");
      return NextResponse.json({ success: false, message: "ID de usuario requerido" }, { status: 400 });
    }
    
    // 📡 OBTENER DATOS DEL USUARIO Y TABLAS RELACIONADAS (ORIGINAL)
    console.log("📡 Obteniendo datos del usuario...");
const { data: userData, error: userError } = await supabaseAdmin
  .from('Users')
  .select(`
    *,
    addresses(*),
    emergency_contacts(*),
    membership_info(*)
  `)
  .eq('id', userId)
  .single();
      
    if (userError) {
      console.error("❌ Error al obtener datos del usuario:", userError);
      return NextResponse.json({ 
        success: false, 
        message: "Error al obtener datos del usuario", 
        error: userError 
      }, { status: 500 });
    }
    
    if (!userData) {
      console.error("❌ Usuario no encontrado:", userId);
      return NextResponse.json({ success: false, message: "Usuario no encontrado" }, { status: 404 });
    }
    
    console.log("✅ Datos del usuario obtenidos correctamente");
    
    // 🔍 OBTENER URL DE LA FIRMA Y FOTO DE PERFIL SI EXISTEN (ORIGINAL)
    const signatureUrl = userData.signatureUrl || null;
    const profilePictureUrl = userData.profilePictureUrl || null;

    // 🎨 CREAR UNA INSTANCIA DE jsPDF PARA TAMAÑO CARTA (ORIGINAL)
    console.log("🎨 Iniciando generación del PDF ENTERPRISE...");
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });
    
    // 🦶 PIE DE PÁGINA ENTERPRISE PERFECTO (IDÉNTICO AL ENTERPRISE)
    const addFooter = (): void => {
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
    
    // 🎨 FUNCIÓN PARA CREAR HEADER DE SECCIÓN (IDÉNTICA AL ENTERPRISE)
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
    
    // 🎨 FUNCIÓN PARA CREAR FILA DE DATOS (IDÉNTICA AL ENTERPRISE)
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
    
    // 🎨 FUNCIÓN PARA VERIFICAR ESPACIO EN PÁGINA (IDÉNTICA AL ENTERPRISE)
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
      // 🖤 FONDO NEGRO PRINCIPAL (ENTERPRISE STYLE)
      doc.setFillColor(...COLORS.BLACK);
      doc.rect(0, 0, LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT, 'F');
      
      let currentY = LAYOUT.MARGIN_TOP;
      
      // --- LOGO Y ENCABEZADO ENTERPRISE ---
      try {
        const logoUrl = `${req.nextUrl.origin}/logo.png`;
        console.log("📥 Descargando logo desde:", logoUrl);
        const logoResponse = await fetch(logoUrl);
        
        if (!logoResponse.ok) {
          throw new Error(`Error al descargar el logo: ${logoResponse.status} ${logoResponse.statusText}`);
        }
        
        const logoBuffer = await logoResponse.arrayBuffer();
        const base64Logo = Buffer.from(logoBuffer).toString('base64');
        
        // 🖼️ LOGO CON PROPORCIONES PERFECTAS (ENTERPRISE STYLE)
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
      } catch (logoError) {
        console.error("⚠️ Error al cargar logo:", logoError);
        
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
        
        console.log("⚠️ Continuando la generación del PDF sin logo");
      }
      
      // 🏢 INFORMACIÓN CORPORATIVA PERFECTA (ENTERPRISE STYLE)
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
      
      // 🏷️ TÍTULO PRINCIPAL PERFECTO (ENTERPRISE STYLE)
      doc.setFillColor(...COLORS.GOLD);
      doc.rect(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.CONTENT_WIDTH, 12, 'F');
      
      doc.setTextColor(...COLORS.BLACK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('INSCRIPCIÓN DE CLIENTE MUP', LAYOUT.PAGE_WIDTH / 2, currentY + 8, {align: 'center'});
      
      currentY += 20;
      
      // 📏 LÍNEA DECORATIVA (ENTERPRISE STYLE)
      doc.setDrawColor(...COLORS.GOLD);
      doc.setLineWidth(1.5);
      doc.line(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT, currentY);
      
      currentY += 10;
      
      // --- INFORMACIÓN PERSONAL ENTERPRISE ---
      currentY = checkPageSpace(currentY, 80);
      currentY = createSectionHeader('INFORMACIÓN PERSONAL', currentY);
      
      // 🖼️ AÑADIR FOTO DE PERFIL SI EXISTE (ORIGINAL LOGIC CON ENTERPRISE STYLE)
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
            
            // 🎯 POSICIÓN CORREGIDA - MÁS ARRIBA Y MEJOR ALINEADA (ENTERPRISE STYLE)
            const photoX = LAYOUT.PAGE_WIDTH - LAYOUT.MARGIN_RIGHT - 38;
            const photoY = currentY - 5;
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
          }
        } catch (profileError) {
          console.error("❌ Error al procesar foto de perfil:", profileError);
        }
      }
      
      // 📋 DATOS PERSONALES ENTERPRISE STYLE
      const personalData = [
        ['Nombre:', `${safeValue(userData.firstName)} ${safeValue(userData.lastName)}`],
        ['Email:', safeValue(userData.email)],
        ['WhatsApp:', safeValue(userData.whatsapp)],
        ['Fecha de Nacimiento:', userData.birthDate ? formatBirthDate(userData.birthDate) : 'No disponible'],
        ['Género:', safeValue(userData.gender, 'No especificado')],
        ['Estado Civil:', safeValue(userData.maritalStatus, 'No especificado')]
      ];
      
      personalData.forEach(([label, value], index) => {
        // 🎯 MARGEN AJUSTADO PARA NO SOLAPAR CON FOTO
        currentY = createDataRow(label, value, currentY, index % 2 === 0, 130);
      });
      
      currentY += LAYOUT.SECTION_SPACING;
      
      // --- DIRECCIÓN ENTERPRISE ---
      if (userData.addresses && userData.addresses.length > 0) {
        const address = userData.addresses[0];
        
        currentY = checkPageSpace(currentY, 70);
        currentY = createSectionHeader('DIRECCIÓN', currentY);
        
        const addressParts = [
          `Calle: ${address.street || 'No disponible'}`,
          `Número: ${address.number || 'No disponible'}`,
          `Colonia: ${address.neighborhood || 'No disponible'}`,
          `Ciudad: ${address.city || 'No disponible'}`,
          `Estado: ${address.state || 'No disponible'}`,
          `Código Postal: ${address.postalCode || 'No disponible'}`,
          `País: ${address.country || 'México'}`
        ];
        
        addressParts.forEach((part, index) => {
          const [label, value] = part.split(': ');
          currentY = createDataRow(label + ':', value, currentY, index % 2 === 0);
        });
        
        currentY += LAYOUT.SECTION_SPACING;
      }
      
      // --- CONTACTO DE EMERGENCIA ENTERPRISE ---
      if (userData.emergency_contacts && userData.emergency_contacts.length > 0) {
        const emergency = userData.emergency_contacts[0];
        
        currentY = checkPageSpace(currentY, 50);
        currentY = createSectionHeader('CONTACTO DE EMERGENCIA', currentY);
        
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
      
      // --- INFORMACIÓN DE MEMBRESÍA ENTERPRISE ---
      if (userData.membership_info && userData.membership_info.length > 0) {
        // ✅ SI LA PÁGINA SE ESTÁ LLENANDO, CREAMOS UNA NUEVA (ORIGINAL LOGIC)
        currentY = checkPageSpace(currentY, 50);
        
        const membership = userData.membership_info[0];
        
        currentY = createSectionHeader('INFORMACIÓN DE MEMBRESÍA', currentY);
        
        const membershipData = [
          ['Referido por:', safeValue(membership.referredBy, 'No especificado')],
          ['Motivación principal:', safeValue(membership.mainMotivation, 'No especificado')],
          ['Nivel de entrenamiento:', safeValue(membership.trainingLevel, 'No especificado')]
        ];
        
        membershipData.forEach(([label, value], index) => {
          currentY = createDataRow(label, value, currentY, index % 2 === 0);
        });
      }
      
      // --- 📜 REGLAMENTO COMPLETO ENTERPRISE DEL ENTERPRISE - NUEVA PÁGINA ---
      doc.addPage();
      doc.setFillColor(...COLORS.BLACK);
      doc.rect(0, 0, LAYOUT.PAGE_WIDTH, LAYOUT.PAGE_HEIGHT, 'F');
      
      currentY = LAYOUT.MARGIN_TOP;
      
      // 🎨 HEADER DE REGLAMENTO PERFECTO (ENTERPRISE STYLE)
      doc.setFillColor(...COLORS.GOLD);
      doc.rect(LAYOUT.MARGIN_LEFT, currentY, LAYOUT.CONTENT_WIDTH, 15, 'F');
      
      doc.setTextColor(...COLORS.BLACK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('NORMATIVAS PARA SER USUARIO DE MUSCLE UP GYM', LAYOUT.PAGE_WIDTH / 2, currentY + 10, {align: 'center'});
      
      currentY += 25;
      
      // 📋 SECCIÓN 1: CONTROL DE ACCESO Y VIGENCIA (COMPLETA DEL ENTERPRISE)
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
      
      // 📋 SECCIÓN 2: HORARIOS DE OPERACIÓN (COMPLETA DEL ENTERPRISE)
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
      
      // 📋 SECCIÓN 3: RESPONSABILIDAD POR USO DE INSTALACIONES (COMPLETA DEL ENTERPRISE - 25 REGLAS)
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
        'El usuario deberá limpiar y secar los aparatos que haya utilizado después de cada ejercicio.',
        'El usuario deberá dejar libres las máquinas entre descansos de series para que otro usuario pueda utilizarlas.',
        'Por motivos de seguridad personal y para el buen estado del material deportivo, el usuario deberá portar de forma obligatoria ropa deportiva (shorts, pants, playeras, tenis).',
        'Queda terminantemente prohibido lanzar, arrojar o azotar las mancuernas, barras, máquinas o implementos de entrenamiento. El incumplimiento de esta norma supondrá la baja automática y definitiva del usuario.',
        'Queda prohibido realizar cualquier tipo de actividad física ajena a la sesión de entrenamiento que pueda dañar o poner en riesgo a los demás usuarios o a las instalaciones. El incumplimiento de esta norma supondrá la baja automática y definitiva del usuario.',
        'Queda prohibida la comercialización u ofertamiento de servicios o productos de cualquier tipo dentro de las instalaciones.',
        'Queda prohibido fingir como entrenador personal o instructor del gimnasio, así como ofertar planes de entrenamiento o nutricionales.',
        'Queda prohibida la difusión, repartición, promoción de volantes, folletos, cupones, demostración de mercancías, venta de productos, o cualquier tipo de actividad lucrativa o comercial.',
        'Queda prohibido el ingreso de mascotas a las instalaciones, así como dejarlas en el área de oficina/recepción.',
        'En caso de que el usuario asista con una acompañante que no esté inscrito como usuario en MUSCLE UP GYM podrá esperar en el área de la oficina siempre y cuando sea mayor a 12 años de edad, sin embargo, no podrá ingresar a las áreas de entrenamiento.',
        'Está terminantemente prohibido ingerir bebidas alcohólicas, drogas o fumar dentro de las instalaciones.',
        'Si el usuario presenta aliento alcohólico o se encuentra bajo la influencia de drogas se negará su acceso a las instalaciones.',
        'Ningún usuario podrá ingresar a las instalaciones portando armas de fuego, armas blancas ni objetos punzocortantes.',
        'MUSCLE UP GYM cuenta con venta de suplementos deportivos, sin embargo, la compra y consumo de los mismos será completa responsabilidad del usuario.',
        'Está parcialmente permitido que el usuario se tome fotografías y videos a sí mismo dentro de las instalaciones, siempre y cuando no fotografíe o grabe a personas ajenas sin su consentimiento.',
        'El usuario afirma conocer y se compromete a respetar la normativa anterior desde el momento de formalizar la inscripción.',
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
      
      // --- FIRMA Y ACEPTACIÓN ENTERPRISE ---
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
      
      // 🖊️ AÑADIR FIRMA SI EXISTE (ORIGINAL LOGIC CON ENTERPRISE STYLE)
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
          console.error("❌ Error al procesar firma:", signError);
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
      doc.text(`${userData.firstName} ${userData.lastName}`, LAYOUT.PAGE_WIDTH / 2, currentY, {align: 'center'});
      
      currentY += 7;
      doc.setTextColor(...COLORS.LIGHT_GRAY);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('Nombre completo del cliente', LAYOUT.PAGE_WIDTH / 2, currentY, {align: 'center'});
      
      // 🦶 AÑADIR PIE DE PÁGINA A TODAS LAS PÁGINAS (ENTERPRISE STYLE)
      addFooter();
      
      console.log("✅ PDF generado en memoria correctamente");
    } catch (pdfError) {
      console.error("❌ Error al generar contenido del PDF:", pdfError);
      return NextResponse.json({ 
        success: false, 
        message: `Error al generar contenido del PDF: ${pdfError instanceof Error ? pdfError.message : 'Error desconocido'}` 
      }, { status: 500 });
    }
    
    // 📦 OBTENER EL PDF COMO ARRAY BUFFER (ORIGINAL)
    console.log("📦 Convirtiendo PDF a buffer...");
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // ☁️ SUBIR EL PDF A SUPABASE STORAGE (ORIGINAL)
    console.log("☁️ Subiendo PDF a Supabase Storage...");
    const pdfPath = `${userId}/contrato-${Date.now()}.pdf`;
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('user-files')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });
      
    if (uploadError) {
      console.error("❌ Error al subir PDF:", uploadError);
      return NextResponse.json({ success: false, message: "Error al subir PDF", error: uploadError }, { status: 500 });
    }
    
    // 🔗 OBTENER URL PÚBLICA DEL PDF (ORIGINAL)
    console.log("🔗 Obteniendo URL pública del PDF...");
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from('user-files')
      .getPublicUrl(pdfPath);
      
    if (!publicUrlData?.publicUrl) {
      console.error("❌ No se pudo obtener la URL pública del PDF");
      return NextResponse.json({ success: false, message: "Error al obtener URL del PDF" }, { status: 500 });
    }
    
    console.log("✅ URL del PDF obtenida:", publicUrlData.publicUrl);
    
    // 💾 ACTUALIZAR REFERENCIA EN LA BASE DE DATOS (ORIGINAL)
    console.log("💾 Actualizando referencia en la base de datos...");
    const { error: updateError } = await supabaseAdmin
      .from('Users')
      .update({ contractPdfUrl: publicUrlData.publicUrl })
      .eq('id', userId);
      
    if (updateError) {
      console.error("⚠️ Error al actualizar referencia del PDF:", updateError);
      // Continuamos a pesar del error porque el PDF se generó correctamente
    }
    
    console.log("🎉 Proceso de generación de PDF completado exitosamente");
    return NextResponse.json({
      success: true,
      pdfUrl: publicUrlData.publicUrl,
      message: "PDF generado correctamente"
    });
    
  } catch (error) {
    console.error("💥 Error general al generar PDF:", error);
    return NextResponse.json(
      { success: false, message: `Error al generar PDF: ${error instanceof Error ? error.message : 'Error desconocido'}` },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
