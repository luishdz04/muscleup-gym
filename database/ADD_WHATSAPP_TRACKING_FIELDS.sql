-- =====================================================
-- AGREGAR CAMPOS DE TRACKING DE WHATSAPP
-- Tabla: user_memberships
-- Fecha: 10 de octubre de 2025
-- =====================================================
-- Descripción:
-- Agrega dos campos opcionales para rastrear si se envió
-- notificación de WhatsApp al registrar/renovar membresía
-- =====================================================

-- ✅ PASO 1: Agregar campo whatsapp_sent (booleano)
ALTER TABLE public.user_memberships 
ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT false;

-- ✅ PASO 2: Agregar campo whatsapp_sent_at (timestamp)
ALTER TABLE public.user_memberships 
ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ;

-- ✅ PASO 3: Agregar comentarios para documentación
COMMENT ON COLUMN public.user_memberships.whatsapp_sent 
IS 'Indica si se envió notificación de WhatsApp al registrar/renovar la membresía';

COMMENT ON COLUMN public.user_memberships.whatsapp_sent_at 
IS 'Fecha y hora exacta en que se envió la notificación de WhatsApp';

-- ✅ PASO 4: Crear índice para consultas rápidas (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_user_memberships_whatsapp_sent 
ON public.user_memberships(whatsapp_sent) 
WHERE whatsapp_sent = true;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Para verificar que los campos se agregaron correctamente:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'user_memberships'
-- AND column_name IN ('whatsapp_sent', 'whatsapp_sent_at')
-- ORDER BY column_name;

-- =====================================================
-- CONSULTAS ÚTILES POST-INSTALACIÓN
-- =====================================================

-- Ver membresías que tienen WhatsApp enviado:
-- SELECT 
--   id,
--   userid,
--   payment_type,
--   whatsapp_sent,
--   whatsapp_sent_at,
--   created_at
-- FROM user_memberships
-- WHERE whatsapp_sent = true
-- ORDER BY whatsapp_sent_at DESC;

-- Contar cuántas membresías tienen WhatsApp enviado:
-- SELECT 
--   COUNT(*) as total_membresias,
--   COUNT(*) FILTER (WHERE whatsapp_sent = true) as con_whatsapp,
--   COUNT(*) FILTER (WHERE whatsapp_sent = false OR whatsapp_sent IS NULL) as sin_whatsapp
-- FROM user_memberships;

-- Ver tasa de envío de WhatsApp por día:
-- SELECT 
--   DATE(created_at) as fecha,
--   COUNT(*) as total_membresias,
--   COUNT(*) FILTER (WHERE whatsapp_sent = true) as whatsapp_enviados,
--   ROUND(100.0 * COUNT(*) FILTER (WHERE whatsapp_sent = true) / COUNT(*), 2) as porcentaje
-- FROM user_memberships
-- WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
-- GROUP BY DATE(created_at)
-- ORDER BY fecha DESC;
