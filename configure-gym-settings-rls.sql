-- Configurar Row Level Security (RLS) para gym_settings
-- Este script debe ejecutarse en Supabase SQL Editor

-- 1. Habilitar RLS en la tabla
ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

-- 2. Política para LECTURA PÚBLICA (cualquiera puede leer)
CREATE POLICY "Permitir lectura pública de gym_settings"
ON public.gym_settings
FOR SELECT
USING (true);

-- 3. Política para ACTUALIZACIÓN (solo admins y empleados autenticados)
CREATE POLICY "Solo admins y empleados pueden actualizar gym_settings"
ON public.gym_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public."Users"
    WHERE "Users".id = auth.uid()
    AND ("Users".rol = 'admin' OR "Users".rol = 'empleado')
  )
);

-- 4. Política para INSERCIÓN (solo admins y empleados autenticados)
CREATE POLICY "Solo admins y empleados pueden insertar gym_settings"
ON public.gym_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Users"
    WHERE "Users".id = auth.uid()
    AND ("Users".rol = 'admin' OR "Users".rol = 'empleado')
  )
);

-- 5. Política para ELIMINACIÓN (solo admins)
CREATE POLICY "Solo admins pueden eliminar gym_settings"
ON public.gym_settings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public."Users"
    WHERE "Users".id = auth.uid()
    AND "Users".rol = 'admin'
  )
);

-- Verificar que existe al menos un registro
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.gym_settings LIMIT 1) THEN
    INSERT INTO public.gym_settings (
      gym_name,
      gym_address,
      gym_phone,
      gym_email,
      gym_facebook_url,
      gym_maps_url,
      gym_hours
    ) VALUES (
      'Muscle Up GYM',
      'Francisco I. Madero 708, Colonia Lindavista, San Buenaventura, Coahuila, México',
      '866 112 7905',
      'administracion@muscleupgym.fitness',
      'https://www.facebook.com/Lindavistagym',
      'https://maps.app.goo.gl/preWqm3w7S2JZLg17',
      '{
        "monday": {"open": "06:00", "close": "23:00", "enabled": true},
        "tuesday": {"open": "06:00", "close": "23:00", "enabled": true},
        "wednesday": {"open": "06:00", "close": "23:00", "enabled": true},
        "thursday": {"open": "06:00", "close": "23:00", "enabled": true},
        "friday": {"open": "06:00", "close": "23:00", "enabled": true},
        "saturday": {"open": "06:00", "close": "23:00", "enabled": true},
        "sunday": {"open": "06:00", "close": "23:00", "enabled": false}
      }'::jsonb
    );
  END IF;
END $$;
