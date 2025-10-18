-- Crear tabla de días festivos
-- Este script debe ejecutarse en Supabase SQL Editor

-- 1. Crear tabla holidays
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('official', 'traditional', 'special')),
  emoji VARCHAR(10) DEFAULT '🎉',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_active ON public.holidays(is_active);

-- 3. Habilitar RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- 4. Política para LECTURA PÚBLICA (cualquiera puede leer días festivos activos)
CREATE POLICY "Permitir lectura pública de holidays activos"
ON public.holidays
FOR SELECT
TO public
USING (is_active = true);

-- 5. Política para LECTURA de todos los holidays (admins y empleados)
CREATE POLICY "Admins y empleados pueden ver todos los holidays"
ON public.holidays
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."Users"
    WHERE "Users".id = auth.uid()
    AND ("Users".rol = 'admin' OR "Users".rol = 'empleado')
  )
);

-- 6. Política para INSERCIÓN (solo admins y empleados)
CREATE POLICY "Solo admins y empleados pueden insertar holidays"
ON public.holidays
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."Users"
    WHERE "Users".id = auth.uid()
    AND ("Users".rol = 'admin' OR "Users".rol = 'empleado')
  )
);

-- 7. Política para ACTUALIZACIÓN (solo admins y empleados)
CREATE POLICY "Solo admins y empleados pueden actualizar holidays"
ON public.holidays
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public."Users"
    WHERE "Users".id = auth.uid()
    AND ("Users".rol = 'admin' OR "Users".rol = 'empleado')
  )
);

-- 8. Política para ELIMINACIÓN (solo admins)
CREATE POLICY "Solo admins pueden eliminar holidays"
ON public.holidays
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public."Users"
    WHERE "Users".id = auth.uid()
    AND "Users".rol = 'admin'
  )
);

-- 9. Insertar días festivos de 2025 (migrados desde holidays.ts)
INSERT INTO public.holidays (date, name, type, emoji, is_active) VALUES
  ('2025-01-01', 'Año Nuevo', 'official', '🎉', true),
  ('2025-02-05', 'Día de la Constitución', 'official', '📜', true),
  ('2025-03-17', 'Natalicio de Benito Juárez', 'official', '🎖️', true),
  ('2025-04-17', 'Jueves Santo', 'traditional', '✝️', true),
  ('2025-04-18', 'Viernes Santo', 'traditional', '✝️', true),
  ('2025-05-01', 'Día del Trabajo', 'official', '👷', true),
  ('2025-05-10', 'Día de las Madres', 'special', '💐', true),
  ('2025-05-15', 'Día del Maestro', 'special', '📚', true),
  ('2025-09-16', 'Día de la Independencia', 'official', '🇲🇽', true),
  ('2025-10-12', 'Día de la Raza', 'traditional', '🌎', true),
  ('2025-11-02', 'Día de Muertos', 'traditional', '💀', true),
  ('2025-11-17', 'Aniversario de la Revolución Mexicana', 'official', '⚔️', true),
  ('2025-12-12', 'Día de la Virgen de Guadalupe', 'traditional', '🙏', true),
  ('2025-12-25', 'Navidad', 'official', '🎄', true),
  ('2025-02-14', 'Día del Amor y la Amistad', 'special', '💝', true),
  ('2025-04-30', 'Día del Niño', 'special', '🧒', true),
  ('2025-06-15', 'Día del Padre', 'special', '👨', true),
  ('2025-09-15', 'Grito de Independencia', 'traditional', '🔔', true),
  ('2025-10-31', 'Halloween', 'special', '🎃', true),
  ('2025-11-01', 'Día de Todos los Santos', 'traditional', '👼', true),
  ('2025-11-20', 'Día de la Revolución Mexicana', 'official', '🎖️', true),
  ('2025-12-24', 'Nochebuena', 'traditional', '🌟', true),
  ('2025-12-31', 'Fin de Año', 'traditional', '🥳', true),
  ('2025-01-06', 'Día de Reyes', 'traditional', '👑', true),
  ('2025-02-02', 'Día de la Candelaria', 'traditional', '🕯️', true)
ON CONFLICT DO NOTHING;

-- 10. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_holidays_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_holidays_updated_at ON public.holidays;
CREATE TRIGGER trigger_update_holidays_updated_at
  BEFORE UPDATE ON public.holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_holidays_updated_at();
