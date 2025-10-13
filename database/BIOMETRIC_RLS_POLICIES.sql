-- ============================================================================
-- POLÍTICAS RLS PARA SISTEMA DE HUELLAS BIOMÉTRICAS
-- ============================================================================
-- Fecha: 13 de Octubre de 2025
-- Descripción: Políticas de Row Level Security para tablas biométricas
--              fingerprint_templates y device_user_mappings
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLA: fingerprint_templates
-- ----------------------------------------------------------------------------

-- Habilitar RLS en la tabla
ALTER TABLE public.fingerprint_templates ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura a usuarios autenticados
CREATE POLICY "fingerprint_templates_select_policy" 
ON public.fingerprint_templates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política: Permitir inserción a usuarios autenticados
CREATE POLICY "fingerprint_templates_insert_policy" 
ON public.fingerprint_templates
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Permitir actualización a usuarios autenticados
CREATE POLICY "fingerprint_templates_update_policy" 
ON public.fingerprint_templates
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Política: Permitir eliminación a usuarios autenticados (admin)
CREATE POLICY "fingerprint_templates_delete_policy" 
ON public.fingerprint_templates
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 2. TABLA: device_user_mappings
-- ----------------------------------------------------------------------------

-- Habilitar RLS en la tabla
ALTER TABLE public.device_user_mappings ENABLE ROW LEVEL SECURITY;

-- Política: Permitir lectura a usuarios autenticados
CREATE POLICY "device_user_mappings_select_policy" 
ON public.device_user_mappings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Política: Permitir inserción a usuarios autenticados
CREATE POLICY "device_user_mappings_insert_policy" 
ON public.device_user_mappings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Permitir actualización a usuarios autenticados
CREATE POLICY "device_user_mappings_update_policy" 
ON public.device_user_mappings
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Política: Permitir eliminación a usuarios autenticados
CREATE POLICY "device_user_mappings_delete_policy" 
ON public.device_user_mappings
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ----------------------------------------------------------------------------
-- 3. VERIFICACIÓN DE POLÍTICAS
-- ----------------------------------------------------------------------------

-- Ver todas las políticas de fingerprint_templates
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'fingerprint_templates';

-- Ver todas las políticas de device_user_mappings
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'device_user_mappings';

-- ----------------------------------------------------------------------------
-- 4. GRANT PERMISSIONS (Si es necesario)
-- ----------------------------------------------------------------------------

-- Asegurar permisos para usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fingerprint_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_user_mappings TO authenticated;

-- Asegurar permisos para usuarios anónimos (solo lectura si es necesario)
-- GRANT SELECT ON public.fingerprint_templates TO anon;
-- GRANT SELECT ON public.device_user_mappings TO anon;

-- ----------------------------------------------------------------------------
-- 5. ÍNDICES PARA OPTIMIZACIÓN (Si no existen)
-- ----------------------------------------------------------------------------

-- Índices en fingerprint_templates
CREATE INDEX IF NOT EXISTS idx_fingerprint_templates_user_id 
ON public.fingerprint_templates(user_id);

CREATE INDEX IF NOT EXISTS idx_fingerprint_templates_device_user_id 
ON public.fingerprint_templates(device_user_id);

CREATE INDEX IF NOT EXISTS idx_fingerprint_templates_created_at 
ON public.fingerprint_templates(created_at);

-- Índices en device_user_mappings
CREATE INDEX IF NOT EXISTS idx_device_user_mappings_user_id 
ON public.device_user_mappings(user_id);

CREATE INDEX IF NOT EXISTS idx_device_user_mappings_device_user_id 
ON public.device_user_mappings(device_user_id);

CREATE INDEX IF NOT EXISTS idx_device_user_mappings_device_id 
ON public.device_user_mappings(device_id);

CREATE INDEX IF NOT EXISTS idx_device_user_mappings_active 
ON public.device_user_mappings(is_active) 
WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- 6. TRIGGERS PARA AUDITORÍA (Opcional)
-- ----------------------------------------------------------------------------

-- Función para actualizar timestamp de updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger en fingerprint_templates
DROP TRIGGER IF EXISTS update_fingerprint_templates_updated_at ON public.fingerprint_templates;
CREATE TRIGGER update_fingerprint_templates_updated_at
    BEFORE UPDATE ON public.fingerprint_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger en device_user_mappings
DROP TRIGGER IF EXISTS update_device_user_mappings_updated_at ON public.device_user_mappings;
CREATE TRIGGER update_device_user_mappings_updated_at
    BEFORE UPDATE ON public.device_user_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 7. VERIFICAR QUE TODO ESTÉ FUNCIONANDO
-- ----------------------------------------------------------------------------

-- Consulta de prueba (ejecutar como usuario autenticado)
-- SELECT COUNT(*) FROM fingerprint_templates;
-- SELECT COUNT(*) FROM device_user_mappings;

-- Si ambas consultas retornan resultados sin error 406, las políticas están correctas

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================

-- NOTAS DE IMPLEMENTACIÓN:
-- 1. Ejecutar este script en la consola SQL de Supabase
-- 2. Verificar que el usuario autenticado tenga permisos
-- 3. Probar las operaciones CRUD desde la aplicación
-- 4. Monitorear logs de Supabase para detectar errores de permisos

-- COMANDOS ÚTILES PARA DEBUGGING:
-- Ver estado de RLS:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Desactivar RLS temporalmente (solo para debugging):
-- ALTER TABLE public.fingerprint_templates DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.device_user_mappings DISABLE ROW LEVEL SECURITY;
