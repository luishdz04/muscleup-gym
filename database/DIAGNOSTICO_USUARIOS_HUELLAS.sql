-- ============================================================================
-- DIAGNÓSTICO DE SISTEMA DE USUARIOS Y HUELLAS
-- ============================================================================
-- Ejecutar en Supabase SQL Editor para diagnosticar problemas
-- ============================================================================

-- 1️⃣ VERIFICAR USUARIOS EXISTENTES
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN fingerprint = true THEN 1 END) as con_huella_flag,
    COUNT(CASE WHEN rol = 'cliente' THEN 1 END) as clientes,
    COUNT(CASE WHEN rol = 'empleado' THEN 1 END) as empleados
FROM public."Users";

-- 2️⃣ VERIFICAR TEMPLATES DE HUELLAS GUARDADOS
SELECT 
    COUNT(*) as total_templates,
    COUNT(DISTINCT user_id) as usuarios_con_template
FROM public.fingerprint_templates;

-- 3️⃣ VERIFICAR MAPPINGS CREADOS
SELECT 
    COUNT(*) as total_mappings,
    MIN(device_user_id) as min_id,
    MAX(device_user_id) as max_id
FROM public.device_user_mappings;

-- 4️⃣ USUARIOS CON TEMPLATE PERO SIN FLAG fingerprint=true
SELECT 
    u.id,
    u."firstName",
    u."lastName",
    u.email,
    u.fingerprint as flag_huella,
    ft.finger_index,
    ft.device_user_id,
    ft.created_at as template_creado
FROM public."Users" u
INNER JOIN public.fingerprint_templates ft ON ft.user_id = u.id
WHERE u.fingerprint != true OR u.fingerprint IS NULL;

-- 5️⃣ TEMPLATES SIN MAPPING
SELECT 
    ft.user_id,
    ft.device_user_id,
    ft.finger_index,
    ft.created_at,
    dm.id as mapping_id
FROM public.fingerprint_templates ft
LEFT JOIN public.device_user_mappings dm 
    ON dm.user_id = ft.user_id 
    AND dm.device_user_id = ft.device_user_id
WHERE dm.id IS NULL;

-- 6️⃣ VERIFICAR RELACIONES FK
SELECT 
    u.id as user_id,
    u."firstName",
    u."lastName",
    u.fingerprint,
    COUNT(a.id) as num_addresses,
    COUNT(ec.id) as num_emergency_contacts,
    COUNT(mi.id) as num_memberships
FROM public."Users" u
LEFT JOIN public.addresses a ON a."userId" = u.id
LEFT JOIN public.emergency_contacts ec ON ec."userId" = u.id
LEFT JOIN public.membership_info mi ON mi."userId" = u.id
WHERE u.rol = 'cliente'
GROUP BY u.id, u."firstName", u."lastName", u.fingerprint
ORDER BY u."createdAt" DESC
LIMIT 20;

-- 7️⃣ ÚLTIMOS USUARIOS CREADOS (DETALLE COMPLETO)
SELECT 
    u.id,
    u."firstName",
    u."lastName",
    u.email,
    u.rol,
    u.fingerprint,
    u."createdAt",
    ft.finger_index as huella_dedo,
    ft.device_user_id as huella_device_id,
    dm.device_id as mapping_device
FROM public."Users" u
LEFT JOIN public.fingerprint_templates ft ON ft.user_id = u.id
LEFT JOIN public.device_user_mappings dm ON dm.user_id = u.id
WHERE u.rol = 'cliente'
ORDER BY u."createdAt" DESC
LIMIT 10;

-- 8️⃣ VERIFICAR SI HAY ERRORES DE NAMING (snake_case vs camelCase)
-- Esto puede causar que las queries fallen silenciosamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('Users', 'addresses', 'emergency_contacts', 'membership_info')
AND column_name LIKE '%user%'
ORDER BY table_name, column_name;

-- 9️⃣ POLÍTICAS RLS ACTIVAS
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
AND tablename IN ('Users', 'fingerprint_templates', 'device_user_mappings', 'addresses', 'emergency_contacts', 'membership_info')
ORDER BY tablename, cmd;

-- 🔟 VERIFICAR SI RLS ESTÁ BLOQUEANDO LAS QUERIES
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('Users', 'fingerprint_templates', 'device_user_mappings', 'addresses', 'emergency_contacts', 'membership_info');

-- ============================================================================
-- QUERIES DE REPARACIÓN (Ejecutar solo si se detectan problemas)
-- ============================================================================

-- REPARACIÓN 1: Actualizar flag fingerprint=true para usuarios con template
-- DESCOMENTAR SOLO SI ES NECESARIO:
/*
UPDATE public."Users" u
SET fingerprint = true
FROM public.fingerprint_templates ft
WHERE ft.user_id = u.id
AND (u.fingerprint != true OR u.fingerprint IS NULL);
*/

-- REPARACIÓN 2: Crear mappings faltantes
-- DESCOMENTAR SOLO SI ES NECESARIO:
/*
INSERT INTO public.device_user_mappings (user_id, device_id, device_user_id, is_active, created_at, updated_at)
SELECT 
    ft.user_id,
    'F22_001' as device_id,
    ft.device_user_id,
    true as is_active,
    NOW() as created_at,
    NOW() as updated_at
FROM public.fingerprint_templates ft
LEFT JOIN public.device_user_mappings dm 
    ON dm.user_id = ft.user_id 
    AND dm.device_user_id = ft.device_user_id
WHERE dm.id IS NULL
AND ft.device_user_id IS NOT NULL;
*/

-- ============================================================================
-- FIN DEL DIAGNÓSTICO
-- ============================================================================
