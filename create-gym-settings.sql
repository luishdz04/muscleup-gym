-- Crear tabla gym_settings en Supabase
CREATE TABLE IF NOT EXISTS public.gym_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  gym_name text NOT NULL DEFAULT 'Muscle Up GYM',
  gym_address text NOT NULL DEFAULT 'Francisco I. Madero 708, Colonia Lindavista, San Buenaventura, Coahuila, México',
  gym_phone text NOT NULL DEFAULT '866 112 7905',
  gym_email text,
  gym_logo_url text,
  gym_facebook_url text NOT NULL DEFAULT 'https://www.facebook.com/Lindavistagym',
  gym_maps_url text NOT NULL DEFAULT 'https://maps.app.goo.gl/preWqm3w7S2JZLg17',
  gym_hours jsonb NOT NULL DEFAULT '{
    "monday": {"open": "06:00", "close": "23:00", "enabled": true},
    "tuesday": {"open": "06:00", "close": "23:00", "enabled": true},
    "wednesday": {"open": "06:00", "close": "23:00", "enabled": true},
    "thursday": {"open": "06:00", "close": "23:00", "enabled": true},
    "friday": {"open": "06:00", "close": "23:00", "enabled": true},
    "saturday": {"open": "06:00", "close": "23:00", "enabled": true},
    "sunday": {"open": "06:00", "close": "23:00", "enabled": false}
  }'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT gym_settings_pkey PRIMARY KEY (id)
);

-- Insertar registro inicial con valores por defecto
INSERT INTO public.gym_settings (id, gym_name, gym_address, gym_phone, gym_facebook_url, gym_maps_url)
VALUES (
  gen_random_uuid(),
  'Muscle Up GYM',
  'Francisco I. Madero 708, Colonia Lindavista, San Buenaventura, Coahuila, México',
  '866 112 7905',
  'https://www.facebook.com/Lindavistagym',
  'https://maps.app.goo.gl/preWqm3w7S2JZLg17'
)
ON CONFLICT (id) DO NOTHING;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS gym_settings_created_at_idx ON public.gym_settings(created_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.gym_settings ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT a todos los usuarios autenticados
CREATE POLICY "Allow authenticated users to read gym settings"
  ON public.gym_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para permitir UPDATE solo a admins/empleados
CREATE POLICY "Allow admin/empleado to update gym settings"
  ON public.gym_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public."Users"
      WHERE id = auth.uid()
      AND (rol = 'admin' OR rol = 'empleado')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public."Users"
      WHERE id = auth.uid()
      AND (rol = 'admin' OR rol = 'empleado')
    )
  );

COMMENT ON TABLE public.gym_settings IS 'Configuración general del gimnasio (nombre, dirección, horarios, etc.)';
