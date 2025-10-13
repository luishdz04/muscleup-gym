-- ============================================================================
-- PERMISOS COMPLETOS PARA LECTURA DE TABLAS
-- ============================================================================
-- EJECUTAR INMEDIATAMENTE EN SUPABASE SQL EDITOR
-- Esto permite que CUALQUIER usuario autenticado pueda leer estas tablas
-- ============================================================================

-- 1️⃣ DAR PERMISOS DE LECTURA A USUARIOS AUTENTICADOS
GRANT SELECT ON public."Users" TO authenticated;
GRANT SELECT ON public.addresses TO authenticated;
GRANT SELECT ON public.emergency_contacts TO authenticated;
GRANT SELECT ON public.membership_info TO authenticated;

-- 2️⃣ DAR PERMISOS DE LECTURA A USUARIOS ANÓNIMOS (OPCIONAL)
GRANT SELECT ON public."Users" TO anon;
GRANT SELECT ON public.addresses TO anon;
GRANT SELECT ON public.emergency_contacts TO anon;
GRANT SELECT ON public.membership_info TO anon;

-- 3️⃣ ASEGURAR QUE LAS POLÍTICAS RLS PERMITAN TODO (SIMPLIFICADO)
-- Eliminar políticas restrictivas existentes y crear una permisiva

-- Para Users
DROP POLICY IF EXISTS "Users can view own data" ON public."Users";
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Users";
CREATE POLICY "Allow all authenticated users to read Users" 
ON public."Users"
FOR SELECT
USING (true);

-- Para addresses
DROP POLICY IF EXISTS "Users can view own related data" ON public.addresses;
DROP POLICY IF EXISTS "Enable related data creation" ON public.addresses;
CREATE POLICY "Allow all authenticated users to read addresses" 
ON public.addresses
FOR SELECT
USING (true);

-- Para emergency_contacts
DROP POLICY IF EXISTS "Users can view own related data" ON public.emergency_contacts;
DROP POLICY IF EXISTS "Enable related data creation" ON public.emergency_contacts;
CREATE POLICY "Allow all authenticated users to read emergency_contacts" 
ON public.emergency_contacts
FOR SELECT
USING (true);

-- Para membership_info
DROP POLICY IF EXISTS "Users can view own related data" ON public.membership_info;
DROP POLICY IF EXISTS "Enable related data creation" ON public.membership_info;
CREATE POLICY "Allow all authenticated users to read membership_info" 
ON public.membership_info
FOR SELECT
USING (true);

-- 4️⃣ VERIFICAR PERMISOS OTORGADOS
SELECT 
    grantee, 
    table_schema, 
    table_name, 
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name IN ('Users', 'addresses', 'emergency_contacts', 'membership_info')
AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;

-- 5️⃣ VERIFICAR POLÍTICAS ACTIVAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('Users', 'addresses', 'emergency_contacts', 'membership_info')
ORDER BY tablename, cmd;

-- ============================================================================
-- PRUEBA RÁPIDA: ¿Puedo leer ahora?
-- ============================================================================
SELECT COUNT(*) as total_users FROM public."Users";
SELECT COUNT(*) as total_addresses FROM public.addresses;
SELECT COUNT(*) as total_emergency FROM public.emergency_contacts;
SELECT COUNT(*) as total_membership FROM public.membership_info;

-- ============================================================================
-- PRUEBA DE JOIN (lo que hace Supabase internamente)
-- ============================================================================
SELECT 
    u.id,
    u."firstName",
    u."lastName",
    a.street,
    ec.name as emergency_name,
    mi."trainingLevel"
FROM public."Users" u
LEFT JOIN public.addresses a ON a."userId" = u.id
LEFT JOIN public.emergency_contacts ec ON ec."userId" = u.id
LEFT JOIN public.membership_info mi ON mi."userId" = u.id
WHERE u.rol = 'cliente'
LIMIT 5;

-- Si este último query funciona, entonces el problema NO es de permisos
-- Si falla, entonces HAY un problema de RLS

-- ============================================================================
-- OPCIÓN NUCLEAR: DESHABILITAR RLS COMPLETAMENTE (SOLO PARA DEBUG)
-- ============================================================================
-- ⚠️ USAR SOLO SI LO ANTERIOR NO FUNCIONA
-- ⚠️ NO DEJAR ASÍ EN PRODUCCIÓN
/*
ALTER TABLE public."Users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_info DISABLE ROW LEVEL SECURITY;
*/

-- Para REACTIVAR RLS después del debug:
/*
ALTER TABLE public."Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_info ENABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- FIN
-- ============================================================================
