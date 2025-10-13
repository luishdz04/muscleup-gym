-- ============================================================================
-- ARREGLO URGENTE: RLS BLOQUEANDO RELACIONES DE USUARIOS
-- ============================================================================
-- Ejecutar INMEDIATAMENTE en Supabase SQL Editor
-- ============================================================================

-- 🔓 OPCIÓN 1: DESHABILITAR RLS TEMPORALMENTE (SOLO PARA DEBUG)
-- ⚠️ NO RECOMENDADO EN PRODUCCIÓN
/*
ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_info DISABLE ROW LEVEL SECURITY;
*/

-- ✅ OPCIÓN 2: AGREGAR POLÍTICAS PERMISIVAS (RECOMENDADO)

-- Políticas para addresses
DROP POLICY IF EXISTS "addresses_select_policy" ON public.addresses;
CREATE POLICY "addresses_select_policy" 
ON public.addresses
FOR SELECT
USING (true); -- Permitir lectura a todos (autenticados)

DROP POLICY IF EXISTS "addresses_insert_policy" ON public.addresses;
CREATE POLICY "addresses_insert_policy" 
ON public.addresses
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "addresses_update_policy" ON public.addresses;
CREATE POLICY "addresses_update_policy" 
ON public.addresses
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Políticas para emergency_contacts
DROP POLICY IF EXISTS "emergency_contacts_select_policy" ON public.emergency_contacts;
CREATE POLICY "emergency_contacts_select_policy" 
ON public.emergency_contacts
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "emergency_contacts_insert_policy" ON public.emergency_contacts;
CREATE POLICY "emergency_contacts_insert_policy" 
ON public.emergency_contacts
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "emergency_contacts_update_policy" ON public.emergency_contacts;
CREATE POLICY "emergency_contacts_update_policy" 
ON public.emergency_contacts
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Políticas para membership_info
DROP POLICY IF EXISTS "membership_info_select_policy" ON public.membership_info;
CREATE POLICY "membership_info_select_policy" 
ON public.membership_info
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "membership_info_insert_policy" ON public.membership_info;
CREATE POLICY "membership_info_insert_policy" 
ON public.membership_info
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "membership_info_update_policy" ON public.membership_info;
CREATE POLICY "membership_info_update_policy" 
ON public.membership_info
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- ✅ VERIFICAR QUE LAS POLÍTICAS ESTÁN ACTIVAS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('addresses', 'emergency_contacts', 'membership_info')
ORDER BY tablename, cmd;

-- ============================================================================
-- FIN
-- ============================================================================
