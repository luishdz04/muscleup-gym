-- =====================================================
-- 🔔 SISTEMA DE NOTIFICACIONES MUSCLE UP GYM
-- =====================================================
-- VERSIÓN: 1.0 MVP - Enfocado en VENTAS y MEMBRESÍAS
-- FECHA: 2025-01-08
-- =====================================================

-- ✅ PASO 1: CREAR TABLA DE NOTIFICACIONES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  -- IDENTIFICACIÓN
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- DESTINATARIO
  user_id UUID NOT NULL,
  
  -- TIPO DE NOTIFICACIÓN (ENUM PROFESIONAL)
  type VARCHAR(50) NOT NULL CHECK (type IN (
    -- 💰 VENTAS
    'sale_completed',           -- Venta completada exitosamente
    'sale_cancelled',           -- Venta cancelada
    'layaway_created',          -- Apartado creado
    'layaway_payment_received', -- Pago de apartado recibido
    'layaway_completed',        -- Apartado completado
    'layaway_expired',          -- Apartado expirado
    'sale_refunded',            -- Venta reembolsada
    
    -- 💳 MEMBRESÍAS
    'membership_created',       -- Membresía activada
    'membership_expiring_soon', -- Membresía por vencer (7 días)
    'membership_expired',       -- Membresía vencida
    'membership_renewed',       -- Membresía renovada
    'membership_frozen',        -- Membresía congelada
    'membership_unfrozen',      -- Membresía descongelada
    'membership_cancelled',     -- Membresía cancelada
    'membership_payment_pending',-- Pago de membresía pendiente
    
    -- 📦 INVENTARIO (OPCIONAL - FUTURO)
    'low_stock_alert',          -- Stock bajo
    'product_out_of_stock',     -- Producto agotado
    
    -- 🔐 SISTEMA
    'system_message',           -- Mensaje del sistema
    'admin_alert'               -- Alerta administrativa
  )),
  
  -- CONTENIDO
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- ESTADO
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- PRIORIDAD
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- ENLACE DE ACCIÓN (Para navegar al detalle)
  action_url VARCHAR(500),
  
  -- METADATA (JSON para información adicional)
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Ejemplos de metadata:
  -- { "sale_id": "uuid", "sale_number": "V-2025-001234", "amount": 1500.00 }
  -- { "membership_id": "uuid", "plan_name": "Mensual Premium", "expires_at": "2025-02-15" }
  
  -- AUDITORÍA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- FOREIGN KEYS
  CONSTRAINT notifications_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public."Users"(id) 
    ON DELETE CASCADE
);

-- ✅ ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, is_read) 
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_type 
  ON public.notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON public.notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_priority 
  ON public.notifications(priority);

-- ✅ COMENTARIOS EN COLUMNAS (DOCUMENTACIÓN)
-- =====================================================
COMMENT ON TABLE public.notifications IS 'Sistema de notificaciones para eventos de ventas y membresías';
COMMENT ON COLUMN public.notifications.type IS 'Tipo de notificación: sale_*, membership_*, layaway_*, etc.';
COMMENT ON COLUMN public.notifications.priority IS 'Prioridad: low, normal, high, urgent';
COMMENT ON COLUMN public.notifications.metadata IS 'Datos adicionales en formato JSON (IDs, montos, fechas, etc.)';
COMMENT ON COLUMN public.notifications.action_url IS 'URL relativa para navegar al detalle (ej: /dashboard/admin/ventas/V-2025-001)';

-- ✅ FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ TRIGGER PARA AUTO-ACTUALIZAR updated_at
-- =====================================================
DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ✅ FUNCIÓN PARA CREAR NOTIFICACIÓN (HELPER)
-- =====================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_priority VARCHAR DEFAULT 'normal',
  p_action_url VARCHAR DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    priority,
    action_url,
    metadata
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_action_url,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_notification IS 'Helper para crear notificaciones fácilmente desde triggers o API';

-- ✅ FUNCIÓN PARA MARCAR COMO LEÍDA
-- =====================================================
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.notifications
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE id = p_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ✅ FUNCIÓN PARA MARCAR TODAS COMO LEÍDAS (POR USUARIO)
-- =====================================================
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE 
    user_id = p_user_id 
    AND is_read = FALSE;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- ✅ FUNCIÓN PARA OBTENER CONTADOR NO LEÍDAS (SOLO HOY EN MÉXICO)
-- =====================================================
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_today_mexico TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Obtener inicio del día de hoy en zona horaria de México
  v_today_mexico := (CURRENT_DATE AT TIME ZONE 'America/Mexico_City')::TIMESTAMP WITH TIME ZONE;
  
  SELECT COUNT(*)
  INTO v_count
  FROM public.notifications
  WHERE 
    user_id = p_user_id 
    AND is_read = FALSE
    AND created_at >= v_today_mexico; -- Solo notificaciones desde las 00:00 México
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ✅ TRIGGER: NOTIFICAR VENTA COMPLETADA
-- =====================================================
CREATE OR REPLACE FUNCTION notify_sale_completed()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar al cajero que realizó la venta
  PERFORM create_notification(
    NEW.cashier_id,
    'sale_completed',
    '✅ Venta Completada',
    format('Venta %s completada por $%s MXN', NEW.sale_number, NEW.total_amount),
    'normal',
    format('/dashboard/admin/pos?sale=%s', NEW.id),
    jsonb_build_object(
      'sale_id', NEW.id,
      'sale_number', NEW.sale_number,
      'amount', NEW.total_amount,
      'customer_id', NEW.customer_id
    )
  );
  
  -- Si hay cliente registrado, notificarlo también
  IF NEW.customer_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.customer_id,
      'sale_completed',
      '🛍️ Compra Realizada',
      format('Tu compra %s ha sido procesada exitosamente', NEW.sale_number),
      'normal',
      NULL,
      jsonb_build_object(
        'sale_id', NEW.id,
        'sale_number', NEW.sale_number,
        'amount', NEW.total_amount
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_sale_completed ON public.sales;
CREATE TRIGGER trigger_notify_sale_completed
  AFTER INSERT ON public.sales
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.sale_type = 'sale')
  EXECUTE FUNCTION notify_sale_completed();

-- ✅ TRIGGER: NOTIFICAR APARTADO CREADO
-- =====================================================
CREATE OR REPLACE FUNCTION notify_layaway_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar al cajero
  PERFORM create_notification(
    NEW.cashier_id,
    'layaway_created',
    '📦 Apartado Creado',
    format('Apartado %s creado - Anticipo: $%s / Total: $%s MXN', 
      NEW.sale_number, NEW.paid_amount, NEW.total_amount),
    'normal',
    format('/dashboard/admin/layaways/management?id=%s', NEW.id),
    jsonb_build_object(
      'sale_id', NEW.id,
      'sale_number', NEW.sale_number,
      'total_amount', NEW.total_amount,
      'paid_amount', NEW.paid_amount,
      'pending_amount', NEW.pending_amount,
      'expires_at', NEW.layaway_expires_at
    )
  );
  
  -- Notificar al cliente
  IF NEW.customer_id IS NOT NULL THEN
    PERFORM create_notification(
      NEW.customer_id,
      'layaway_created',
      '✅ Apartado Registrado',
      format('Tu apartado %s ha sido creado. Pendiente: $%s MXN', 
        NEW.sale_number, NEW.pending_amount),
      'high',
      NULL,
      jsonb_build_object(
        'sale_id', NEW.id,
        'sale_number', NEW.sale_number,
        'paid_amount', NEW.paid_amount,
        'pending_amount', NEW.pending_amount,
        'expires_at', NEW.layaway_expires_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_layaway_created ON public.sales;
CREATE TRIGGER trigger_notify_layaway_created
  AFTER INSERT ON public.sales
  FOR EACH ROW
  WHEN (NEW.sale_type = 'layaway' AND NEW.status = 'pending')
  EXECUTE FUNCTION notify_layaway_created();

-- ✅ TRIGGER: NOTIFICAR PAGO DE APARTADO
-- =====================================================
CREATE OR REPLACE FUNCTION notify_layaway_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo notificar si hubo cambio en paid_amount
  IF NEW.paid_amount > OLD.paid_amount THEN
    -- Notificar al cajero
    PERFORM create_notification(
      NEW.cashier_id,
      CASE 
        WHEN NEW.status = 'completed' THEN 'layaway_completed'
        ELSE 'layaway_payment_received'
      END,
      CASE 
        WHEN NEW.status = 'completed' THEN '🎉 Apartado Completado'
        ELSE '💰 Pago de Apartado Recibido'
      END,
      format('Apartado %s - Pago: $%s / Pendiente: $%s MXN', 
        NEW.sale_number, NEW.paid_amount - OLD.paid_amount, NEW.pending_amount),
      'normal',
      format('/dashboard/admin/layaways/management?id=%s', NEW.id),
      jsonb_build_object(
        'sale_id', NEW.id,
        'sale_number', NEW.sale_number,
        'payment_amount', NEW.paid_amount - OLD.paid_amount,
        'total_paid', NEW.paid_amount,
        'pending_amount', NEW.pending_amount,
        'completed', NEW.status = 'completed'
      )
    );
    
    -- Notificar al cliente
    IF NEW.customer_id IS NOT NULL THEN
      PERFORM create_notification(
        NEW.customer_id,
        CASE 
          WHEN NEW.status = 'completed' THEN 'layaway_completed'
          ELSE 'layaway_payment_received'
        END,
        CASE 
          WHEN NEW.status = 'completed' THEN '✅ Apartado Completado'
          ELSE '💳 Pago Registrado'
        END,
        format('Tu apartado %s - %s', 
          NEW.sale_number,
          CASE 
            WHEN NEW.status = 'completed' THEN 'ha sido completado. ¡Puedes recogerlo!'
            ELSE format('Pendiente: $%s MXN', NEW.pending_amount)
          END
        ),
        CASE WHEN NEW.status = 'completed' THEN 'high' ELSE 'normal' END,
        NULL,
        jsonb_build_object(
          'sale_id', NEW.id,
          'sale_number', NEW.sale_number,
          'total_paid', NEW.paid_amount,
          'pending_amount', NEW.pending_amount
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_layaway_payment ON public.sales;
CREATE TRIGGER trigger_notify_layaway_payment
  AFTER UPDATE ON public.sales
  FOR EACH ROW
  WHEN (NEW.sale_type = 'layaway' AND NEW.paid_amount <> OLD.paid_amount)
  EXECUTE FUNCTION notify_layaway_payment();

-- ✅ TRIGGER: NOTIFICAR MEMBRESÍA CREADA
-- =====================================================
CREATE OR REPLACE FUNCTION notify_membership_created()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_name VARCHAR;
BEGIN
  -- Obtener nombre del plan
  SELECT name INTO v_plan_name
  FROM public.membership_plans
  WHERE id = NEW.plan_id;
  
  -- Notificar al creador (empleado/admin)
  PERFORM create_notification(
    NEW.created_by,
    'membership_created',
    '🎯 Membresía Activada',
    format('Membresía %s creada para el usuario', COALESCE(v_plan_name, 'Plan')),
    'normal',
    format('/dashboard/admin/membresias?membership=%s', NEW.id),
    jsonb_build_object(
      'membership_id', NEW.id,
      'plan_name', v_plan_name,
      'user_id', NEW.userid,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date,
      'amount', NEW.total_amount
    )
  );
  
  -- Notificar al usuario (cliente)
  PERFORM create_notification(
    NEW.userid,
    'membership_created',
    '🎉 Membresía Activada',
    format('Tu membresía %s está activa desde %s hasta %s', 
      COALESCE(v_plan_name, 'Plan'), 
      TO_CHAR(NEW.start_date, 'DD/MM/YYYY'),
      TO_CHAR(NEW.end_date, 'DD/MM/YYYY')
    ),
    'high',
    NULL,
    jsonb_build_object(
      'membership_id', NEW.id,
      'plan_name', v_plan_name,
      'start_date', NEW.start_date,
      'end_date', NEW.end_date
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_membership_created ON public.user_memberships;
CREATE TRIGGER trigger_notify_membership_created
  AFTER INSERT ON public.user_memberships
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION notify_membership_created();

-- ✅ TRIGGER: NOTIFICAR MEMBRESÍA POR VENCER (EJECUTAR DIARIAMENTE)
-- =====================================================
CREATE OR REPLACE FUNCTION check_expiring_memberships()
RETURNS INTEGER AS $$
DECLARE
  v_record RECORD;
  v_count INTEGER := 0;
  v_plan_name VARCHAR;
BEGIN
  -- Buscar membresías que vencen en 7 días
  FOR v_record IN
    SELECT * FROM public.user_memberships
    WHERE 
      status = 'active'
      AND end_date = CURRENT_DATE + INTERVAL '7 days'
  LOOP
    -- Obtener nombre del plan
    SELECT name INTO v_plan_name
    FROM public.membership_plans
    WHERE id = v_record.plan_id;
    
    -- Notificar al usuario
    PERFORM create_notification(
      v_record.userid,
      'membership_expiring_soon',
      '⚠️ Membresía Por Vencer',
      format('Tu membresía %s vence el %s. ¡Renuévala pronto!', 
        COALESCE(v_plan_name, 'Plan'),
        TO_CHAR(v_record.end_date, 'DD/MM/YYYY')
      ),
      'high',
      NULL,
      jsonb_build_object(
        'membership_id', v_record.id,
        'plan_name', v_plan_name,
        'end_date', v_record.end_date,
        'days_remaining', 7
      )
    );
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_expiring_memberships IS 'Ejecutar diariamente con pg_cron para notificar membresías por vencer';

-- ✅ FUNCIÓN PARA LIMPIAR NOTIFICACIONES ANTIGUAS
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications(p_days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.notifications
  WHERE 
    created_at < NOW() - (p_days_old || ' days')::INTERVAL
    AND is_read = TRUE
  RETURNING COUNT(*) INTO v_deleted_count;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_notifications IS 'Eliminar notificaciones leídas con más de X días (default: 90)';

-- ✅ RLS (ROW LEVEL SECURITY) - SEGURIDAD
-- =====================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo ven sus propias notificaciones (incluso admins)
CREATE POLICY notifications_user_select_policy ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Solo admins y empleados pueden insertar notificaciones directamente
CREATE POLICY notifications_admin_insert_policy ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Users"
      WHERE id = auth.uid() AND rol IN ('admin', 'empleado')
    )
  );

-- Política: Los usuarios pueden actualizar (marcar como leída) solo sus propias notificaciones
CREATE POLICY notifications_user_update_policy ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ✅ INSERTAR NOTIFICACIONES DE PRUEBA (OPCIONAL - COMENTADO)
-- =====================================================
/*
-- Obtener ID de un admin para pruebas
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id
  FROM public."Users"
  WHERE rol = 'admin'
  LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    -- Notificación de venta
    PERFORM create_notification(
      v_admin_id,
      'sale_completed',
      '✅ Venta Completada',
      'Venta V-2025-001234 completada por $1,500.00 MXN',
      'normal',
      '/dashboard/admin/pos',
      '{"sale_id": "test", "amount": 1500}'::jsonb
    );
    
    -- Notificación de membresía
    PERFORM create_notification(
      v_admin_id,
      'membership_expiring_soon',
      '⚠️ Membresía Por Vencer',
      'La membresía Mensual Premium vence en 7 días',
      'high',
      '/dashboard/admin/membresias',
      '{"days_remaining": 7}'::jsonb
    );
  END IF;
END $$;
*/

-- =====================================================
-- ✅ RESUMEN DE FUNCIONES CREADAS
-- =====================================================
-- 
-- FUNCIONES HELPER:
-- - create_notification()            -> Crear notificación manualmente
-- - mark_notification_as_read()      -> Marcar una como leída
-- - mark_all_notifications_as_read() -> Marcar todas como leídas
-- - get_unread_count()               -> Obtener contador no leídas
-- - check_expiring_memberships()     -> Revisar membresías por vencer
-- - cleanup_old_notifications()      -> Limpiar notificaciones antiguas
--
-- TRIGGERS AUTOMÁTICOS:
-- - trigger_notify_sale_completed    -> Notifica ventas completadas
-- - trigger_notify_layaway_created   -> Notifica apartados creados
-- - trigger_notify_layaway_payment   -> Notifica pagos de apartados
-- - trigger_notify_membership_created-> Notifica membresías activadas
--
-- POLÍTICAS RLS:
-- - notifications_user_select_policy -> Usuarios ven solo sus notificaciones
-- - notifications_admin_insert_policy-> Solo admins insertan directamente
-- - notifications_user_update_policy -> Usuarios actualizan sus notificaciones
--
-- =====================================================

-- ✅ FUNCIÓN DE LIMPIEZA AUTOMÁTICA (ZONA HORARIA MÉXICO)
-- =====================================================
-- Borra notificaciones con más de X días (ejecutar semanalmente)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep INTEGER DEFAULT 7)
RETURNS TABLE(deleted_count BIGINT) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count BIGINT;
  v_cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calcular fecha límite en zona horaria de México
  v_cutoff_date := (CURRENT_DATE AT TIME ZONE 'America/Mexico_City' - days_to_keep * INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
  
  DELETE FROM public.notifications
  WHERE created_at < v_cutoff_date;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_notifications IS 'Limpia notificaciones antiguas. Por defecto borra las de más de 7 días. Llamar semanalmente desde backend o pg_cron.';

-- ✅ VERIFICACIÓN FINAL
-- =====================================================
SELECT 
  'Tabla notifications creada' as status,
  COUNT(*) as columnas
FROM information_schema.columns 
WHERE table_name = 'notifications' AND table_schema = 'public';

SELECT 
  'Triggers instalados' as status,
  COUNT(*) as total
FROM information_schema.triggers 
WHERE event_object_table IN ('sales', 'user_memberships')
  AND trigger_name LIKE 'trigger_notify%';
