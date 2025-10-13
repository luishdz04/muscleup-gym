-- ========================================
-- DEBUG: COMPARAR ABONOS DE OCTUBRE 2025
-- ========================================

-- 1. ABONOS SEGÚN EL API (lo que usa el dashboard actualmente)
-- Usa: is_partial_payment = true
SELECT 
  'API Dashboard (is_partial_payment=true)' as origen,
  COUNT(*) as total_pagos,
  COUNT(DISTINCT spd.sale_id) as apartados_unicos,
  SUM(spd.amount) as total_cobrado
FROM sale_payment_details spd
INNER JOIN sales s ON s.id = spd.sale_id
WHERE spd.is_partial_payment = true
  AND spd.payment_date >= '2025-10-01T06:00:00Z'
  AND spd.payment_date <= '2025-10-31T05:59:59.999Z';

-- ========================================

-- 2. ABONOS DE APARTADOS (sale_type='layaway')
-- Debe coincidir con el historial de apartados
SELECT 
  'Historial Apartados (sale_type=layaway)' as origen,
  COUNT(*) as total_pagos,
  COUNT(DISTINCT spd.sale_id) as apartados_unicos,
  SUM(spd.amount) as total_cobrado
FROM sale_payment_details spd
INNER JOIN sales s ON s.id = spd.sale_id
WHERE s.sale_type = 'layaway'
  AND spd.payment_date >= '2025-10-01T06:00:00Z'
  AND spd.payment_date <= '2025-10-31T05:59:59.999Z';

-- ========================================

-- 3. DETALLE: ¿QUÉ ABONOS SE ESTÁN CONTANDO MAL?
-- Abonos que NO son de apartados pero tienen is_partial_payment=true
SELECT 
  s.sale_number,
  s.sale_type,
  s.status,
  spd.payment_date,
  spd.amount,
  spd.is_partial_payment,
  s.id as sale_id
FROM sale_payment_details spd
INNER JOIN sales s ON s.id = spd.sale_id
WHERE spd.is_partial_payment = true
  AND s.sale_type != 'layaway'  -- ❌ NO son apartados
  AND spd.payment_date >= '2025-10-01T06:00:00Z'
  AND spd.payment_date <= '2025-10-31T05:59:59.999Z'
ORDER BY spd.payment_date DESC;

-- ========================================

-- 4. VERIFICAR: ¿Hay apartados SIN is_partial_payment=true?
SELECT 
  s.sale_number,
  s.sale_type,
  s.status,
  spd.payment_date,
  spd.amount,
  spd.is_partial_payment,
  s.id as sale_id
FROM sale_payment_details spd
INNER JOIN sales s ON s.id = spd.sale_id
WHERE s.sale_type = 'layaway'
  AND (spd.is_partial_payment = false OR spd.is_partial_payment IS NULL)
  AND spd.payment_date >= '2025-10-01T06:00:00Z'
  AND spd.payment_date <= '2025-10-31T05:59:59.999Z'
ORDER BY spd.payment_date DESC;

-- ========================================

-- 5. RESUMEN COMPARATIVO
SELECT 
  'Diferencia' as analisis,
  (SELECT SUM(spd.amount) 
   FROM sale_payment_details spd
   INNER JOIN sales s ON s.id = spd.sale_id
   WHERE s.sale_type = 'layaway'
     AND spd.payment_date >= '2025-10-01T06:00:00Z'
     AND spd.payment_date <= '2025-10-31T05:59:59.999Z') as historial_apartados,
  
  (SELECT SUM(spd.amount) 
   FROM sale_payment_details spd
   WHERE spd.is_partial_payment = true
     AND spd.payment_date >= '2025-10-01T06:00:00Z'
     AND spd.payment_date <= '2025-10-31T05:59:59.999Z') as api_dashboard,
  
  (SELECT SUM(spd.amount) 
   FROM sale_payment_details spd
   INNER JOIN sales s ON s.id = spd.sale_id
   WHERE s.sale_type = 'layaway'
     AND spd.payment_date >= '2025-10-01T06:00:00Z'
     AND spd.payment_date <= '2025-10-31T05:59:59.999Z') 
  - 
  (SELECT SUM(spd.amount) 
   FROM sale_payment_details spd
   WHERE spd.is_partial_payment = true
     AND spd.payment_date >= '2025-10-01T06:00:00Z'
     AND spd.payment_date <= '2025-10-31T05:59:59.999Z') as diferencia;
