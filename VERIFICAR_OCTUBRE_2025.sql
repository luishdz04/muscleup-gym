-- ========================================-- Script de verificación de datos de Octubre 2025

-- SCRIPT DE VERIFICACIÓN DE DATOS OCTUBRE 2025-- Ejecutar en Supabase SQL Editor

-- Ejecutar en Supabase SQL Editor

-- ========================================-- 1. VENTAS POS (sale_type='sale')

SELECT 

-- 1. VENTAS POS (sale_type='sale') - OCTUBRE 2025  DATE(s.created_at AT TIME ZONE 'America/Mexico_City') as fecha,

SELECT   COUNT(DISTINCT s.id) as ventas_count,

  DATE(s.created_at AT TIME ZONE 'America/Mexico_City') as fecha,  SUM(spd.amount) as total_ventas

  COUNT(DISTINCT s.id) as ventas_count,FROM sales s

  SUM(spd.amount) as total_ventasLEFT JOIN sale_payment_details spd ON spd.sale_id = s.id

FROM sales sWHERE s.sale_type = 'sale'

LEFT JOIN sale_payment_details spd ON spd.sale_id = s.id  AND s.status = 'completed'

WHERE s.sale_type = 'sale'  AND s.created_at >= '2025-10-01T06:00:00Z'

  AND s.status = 'completed'  AND s.created_at <= '2025-10-31T05:59:59.999Z'

  AND s.created_at >= '2025-10-01T06:00:00Z'  AND spd.is_partial_payment = false

  AND s.created_at <= '2025-10-31T05:59:59.999Z'GROUP BY fecha

  AND (spd.is_partial_payment = false OR spd.is_partial_payment IS NULL)ORDER BY fecha;

GROUP BY fecha

ORDER BY fecha;-- 2. ABONOS (is_partial_payment=true)

SELECT 

-- ========================================  DATE(spd.payment_date AT TIME ZONE 'America/Mexico_City') as fecha,

  COUNT(DISTINCT spd.sale_id) as abonos_count,

-- 2. ABONOS (is_partial_payment=true) - OCTUBRE 2025  SUM(spd.amount) as total_abonos

SELECT FROM sale_payment_details spd

  DATE(spd.payment_date AT TIME ZONE 'America/Mexico_City') as fecha,INNER JOIN sales s ON s.id = spd.sale_id

  COUNT(DISTINCT spd.sale_id) as abonos_count,WHERE spd.is_partial_payment = true

  SUM(spd.amount) as total_abonos  AND spd.payment_date >= '2025-10-01T06:00:00Z'

FROM sale_payment_details spd  AND spd.payment_date <= '2025-10-31T05:59:59.999Z'

INNER JOIN sales s ON s.id = spd.sale_idGROUP BY fecha

WHERE spd.is_partial_payment = trueORDER BY fecha;

  AND spd.payment_date >= '2025-10-01T06:00:00Z'

  AND spd.payment_date <= '2025-10-31T05:59:59.999Z'-- 3. MEMBRESÍAS

GROUP BY fechaSELECT 

ORDER BY fecha;  DATE(mpd.created_at AT TIME ZONE 'America/Mexico_City') as fecha,

  COUNT(DISTINCT mpd.membership_id) as membresias_count,

-- ========================================  SUM(mpd.amount) as total_membresias

FROM membership_payment_details mpd

-- 3. MEMBRESÍAS - OCTUBRE 2025WHERE mpd.created_at >= '2025-10-01T06:00:00Z'

SELECT   AND mpd.created_at <= '2025-10-31T05:59:59.999Z'

  DATE(mpd.created_at AT TIME ZONE 'America/Mexico_City') as fecha,GROUP BY fecha

  COUNT(DISTINCT mpd.membership_id) as membresias_count,ORDER BY fecha;

  SUM(mpd.amount) as total_membresias

FROM membership_payment_details mpd-- 4. RESUMEN TOTAL OCTUBRE

WHERE mpd.created_at >= '2025-10-01T06:00:00Z'SELECT 

  AND mpd.created_at <= '2025-10-31T05:59:59.999Z'  COALESCE(SUM(ventas), 0) + COALESCE(SUM(abonos), 0) + COALESCE(SUM(membresias), 0) as total_octubre

GROUP BY fechaFROM (

ORDER BY fecha;  -- Ventas

  SELECT SUM(spd.amount) as ventas, 0 as abonos, 0 as membresias

-- ========================================  FROM sales s

  LEFT JOIN sale_payment_details spd ON spd.sale_id = s.id

-- 4. RESUMEN TOTAL OCTUBRE 2025  WHERE s.sale_type = 'sale'

SELECT     AND s.status = 'completed'

  'Total Octubre 2025' as concepto,    AND s.created_at >= '2025-10-01T06:00:00Z'

  COALESCE(SUM(ventas), 0) as total_ventas,    AND s.created_at <= '2025-10-31T05:59:59.999Z'

  COALESCE(SUM(abonos), 0) as total_abonos,    AND spd.is_partial_payment = false

  COALESCE(SUM(membresias), 0) as total_membresias,  

  COALESCE(SUM(ventas), 0) + COALESCE(SUM(abonos), 0) + COALESCE(SUM(membresias), 0) as gran_total  UNION ALL

FROM (  

  -- Ventas POS  -- Abonos

  SELECT   SELECT 0, SUM(spd.amount), 0

    COALESCE(SUM(spd.amount), 0) as ventas,  FROM sale_payment_details spd

    0 as abonos,  INNER JOIN sales s ON s.id = spd.sale_id

    0 as membresias  WHERE spd.is_partial_payment = true

  FROM sales s    AND spd.payment_date >= '2025-10-01T06:00:00Z'

  LEFT JOIN sale_payment_details spd ON spd.sale_id = s.id    AND spd.payment_date <= '2025-10-31T05:59:59.999Z'

  WHERE s.sale_type = 'sale'  

    AND s.status = 'completed'  UNION ALL

    AND s.created_at >= '2025-10-01T06:00:00Z'  

    AND s.created_at <= '2025-10-31T05:59:59.999Z'  -- Membresías

    AND (spd.is_partial_payment = false OR spd.is_partial_payment IS NULL)  SELECT 0, 0, SUM(mpd.amount)

    FROM membership_payment_details mpd

  UNION ALL  WHERE mpd.created_at >= '2025-10-01T06:00:00Z'

      AND mpd.created_at <= '2025-10-31T05:59:59.999Z'

  -- Abonos) totales;

  SELECT 
    0,
    COALESCE(SUM(spd.amount), 0),
    0
  FROM sale_payment_details spd
  INNER JOIN sales s ON s.id = spd.sale_id
  WHERE spd.is_partial_payment = true
    AND spd.payment_date >= '2025-10-01T06:00:00Z'
    AND spd.payment_date <= '2025-10-31T05:59:59.999Z'
  
  UNION ALL
  
  -- Membresías
  SELECT 
    0,
    0,
    COALESCE(SUM(mpd.amount), 0)
  FROM membership_payment_details mpd
  WHERE mpd.created_at >= '2025-10-01T06:00:00Z'
    AND mpd.created_at <= '2025-10-31T05:59:59.999Z'
) totales;

-- ========================================

-- 5. VERIFICAR RANGOS DE FECHAS (Para depuración)
SELECT 
  'Ventas POS' as tipo,
  MIN(s.created_at) as primera_fecha,
  MAX(s.created_at) as ultima_fecha,
  COUNT(*) as total_registros
FROM sales s
WHERE s.sale_type = 'sale'
  AND s.status = 'completed'
  AND s.created_at >= '2025-10-01T06:00:00Z'
  AND s.created_at <= '2025-10-31T05:59:59.999Z'

UNION ALL

SELECT 
  'Abonos' as tipo,
  MIN(spd.payment_date),
  MAX(spd.payment_date),
  COUNT(*)
FROM sale_payment_details spd
WHERE spd.is_partial_payment = true
  AND spd.payment_date >= '2025-10-01T06:00:00Z'
  AND spd.payment_date <= '2025-10-31T05:59:59.999Z'

UNION ALL

SELECT 
  'Membresías' as tipo,
  MIN(mpd.created_at),
  MAX(mpd.created_at),
  COUNT(*)
FROM membership_payment_details mpd
WHERE mpd.created_at >= '2025-10-01T06:00:00Z'
  AND mpd.created_at <= '2025-10-31T05:59:59.999Z';
