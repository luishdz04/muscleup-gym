-- ============================================================================
-- FIX DUPLICADOS EN TABLAS RELACIONADAS CON USUARIOS
-- ============================================================================
-- Este script:
-- 1. Elimina registros duplicados en addresses, emergency_contacts y membership_info
-- 2. Agrega constraint UNIQUE en userId para prevenir futuros duplicados
-- 3. Permite usar .upsert() con onConflict en el código
-- ============================================================================

-- ============================================================================
-- PASO 1: LIMPIAR DUPLICADOS EN addresses
-- ============================================================================
-- Ver duplicados antes de limpiar
SELECT 
  "userId", 
  COUNT(*) as cantidad,
  array_agg(id::text ORDER BY id) as ids
FROM addresses
GROUP BY "userId"
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Eliminar duplicados, manteniendo solo uno por userId
DELETE FROM addresses a
WHERE a.id NOT IN (
  SELECT DISTINCT ON ("userId") id
  FROM addresses
  ORDER BY "userId", id
);

-- Verificar que no haya duplicados
SELECT 
  "userId", 
  COUNT(*) as cantidad
FROM addresses
GROUP BY "userId"
HAVING COUNT(*) > 1;

-- ============================================================================
-- PASO 2: LIMPIAR DUPLICADOS EN emergency_contacts
-- ============================================================================
-- Ver duplicados antes de limpiar
SELECT 
  "userId", 
  COUNT(*) as cantidad,
  array_agg(id::text ORDER BY id) as ids
FROM emergency_contacts
GROUP BY "userId"
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Eliminar duplicados, manteniendo solo uno por userId
DELETE FROM emergency_contacts a
WHERE a.id NOT IN (
  SELECT DISTINCT ON ("userId") id
  FROM emergency_contacts
  ORDER BY "userId", id
);

-- Verificar que no haya duplicados
SELECT 
  "userId", 
  COUNT(*) as cantidad
FROM emergency_contacts
GROUP BY "userId"
HAVING COUNT(*) > 1;

-- ============================================================================
-- PASO 3: LIMPIAR DUPLICADOS EN membership_info
-- ============================================================================
-- Ver duplicados antes de limpiar
SELECT 
  "userId", 
  COUNT(*) as cantidad,
  array_agg(id::text ORDER BY id) as ids
FROM membership_info
GROUP BY "userId"
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Eliminar duplicados, manteniendo solo uno por userId
DELETE FROM membership_info a
WHERE a.id NOT IN (
  SELECT DISTINCT ON ("userId") id
  FROM membership_info
  ORDER BY "userId", id
);

-- Verificar que no haya duplicados
SELECT 
  "userId", 
  COUNT(*) as cantidad
FROM membership_info
GROUP BY "userId"
HAVING COUNT(*) > 1;

-- ============================================================================
-- PASO 4: AGREGAR CONSTRAINTS UNIQUE
-- ============================================================================
-- addresses: UNIQUE constraint en userId
ALTER TABLE addresses 
DROP CONSTRAINT IF EXISTS addresses_userId_unique;

ALTER TABLE addresses 
ADD CONSTRAINT addresses_userId_unique UNIQUE ("userId");

-- emergency_contacts: UNIQUE constraint en userId
ALTER TABLE emergency_contacts 
DROP CONSTRAINT IF EXISTS emergency_contacts_userId_unique;

ALTER TABLE emergency_contacts 
ADD CONSTRAINT emergency_contacts_userId_unique UNIQUE ("userId");

-- membership_info: UNIQUE constraint en userId
ALTER TABLE membership_info 
DROP CONSTRAINT IF EXISTS membership_info_userId_unique;

ALTER TABLE membership_info 
ADD CONSTRAINT membership_info_userId_unique UNIQUE ("userId");

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Ver constraints creados
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('addresses', 'emergency_contacts', 'membership_info')
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, tc.constraint_name;

-- Ver cantidad de registros por tabla
SELECT 
  'addresses' as tabla,
  COUNT(*) as total_registros,
  COUNT(DISTINCT "userId") as usuarios_unicos
FROM addresses
UNION ALL
SELECT 
  'emergency_contacts' as tabla,
  COUNT(*) as total_registros,
  COUNT(DISTINCT "userId") as usuarios_unicos
FROM emergency_contacts
UNION ALL
SELECT 
  'membership_info' as tabla,
  COUNT(*) as total_registros,
  COUNT(DISTINCT "userId") as usuarios_unicos
FROM membership_info;

-- ============================================================================
-- INSTRUCCIONES:
-- ============================================================================
-- Ejecutar cada sección por separado en Supabase SQL Editor
-- Verificar resultados antes de continuar al siguiente paso
-- ============================================================================
