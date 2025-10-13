-- ============================================
-- 🔍 DEBUG: COMPARACIÓN APARTADOS
-- Dashboard vs Historial de Apartados
-- ============================================

-- 1️⃣ DASHBOARD: Abonos de OCTUBRE 2025 (por fecha de pago)
-- Filtra: payment_date entre 2025-10-01 y 2025-10-31
SELECT 
  '📊 DASHBOARD - Abonos Octubre 2025' as fuente,
  COUNT(DISTINCT spd.id) as cantidad_pagos,
  SUM(spd.amount) as total_cobrado,
  MIN(spd.payment_date) as fecha_minima,
  MAX(spd.payment_date) as fecha_maxima
FROM sale_payment_details spd
INNER JOIN sales s ON spd.sale_id = s.id
WHERE s.sale_type = 'layaway'
  AND spd.payment_date >= '2025-10-01 06:00:00+00'
  AND spd.payment_date <= '2025-11-01 05:59:59.999+00';

-- 2️⃣ HISTORIAL APARTADOS: Total cobrado en TODOS los apartados
-- No filtra por fecha, suma paid_amount de todos los apartados no cancelados
SELECT 
  '📦 HISTORIAL - Todos los Apartados (No Cancelados)' as fuente,
  COUNT(DISTINCT s.id) as cantidad_apartados,
  SUM(s.paid_amount) as total_cobrado,
  MIN(s.created_at) as apartado_mas_antiguo,
  MAX(s.created_at) as apartado_mas_reciente
FROM sales s
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled';

-- 3️⃣ DESGLOSE POR APARTADO: Ver cuánto ha pagado cada uno
SELECT 
  '📋 DESGLOSE POR APARTADO' as fuente,
  s.sale_number,
  s.status,
  s.created_at::date as fecha_creacion,
  s.total_amount as total,
  s.paid_amount as pagado,
  s.pending_amount as pendiente,
  COALESCE(
    (SELECT SUM(amount) 
     FROM sale_payment_details 
     WHERE sale_id = s.id), 
    0
  ) as suma_pagos_detalle
FROM sales s
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled'
ORDER BY s.created_at DESC;

-- 4️⃣ PAGOS DE APARTADOS EN OCTUBRE (detallado)
SELECT 
  '💳 PAGOS EN OCTUBRE 2025 (Detallado)' as fuente,
  s.sale_number,
  spd.payment_date::date as fecha_pago,
  spd.payment_method as metodo,
  spd.amount as monto,
  spd.is_partial_payment as es_abono
FROM sale_payment_details spd
INNER JOIN sales s ON spd.sale_id = s.id
WHERE s.sale_type = 'layaway'
  AND spd.payment_date >= '2025-10-01 06:00:00+00'
  AND spd.payment_date <= '2025-11-01 05:59:59.999+00'
ORDER BY spd.payment_date;

-- 5️⃣ TOTAL DE APARTADOS POR MES DE CREACIÓN
SELECT 
  '📅 APARTADOS POR MES DE CREACIÓN' as fuente,
  TO_CHAR(s.created_at, 'YYYY-MM') as mes_creacion,
  COUNT(s.id) as cantidad,
  SUM(s.total_amount) as total,
  SUM(s.paid_amount) as pagado,
  SUM(s.pending_amount) as pendiente
FROM sales s
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled'
GROUP BY TO_CHAR(s.created_at, 'YYYY-MM')
ORDER BY mes_creacion DESC;

-- 6️⃣ COMPARACIÓN DIRECTA
SELECT 
  '🔍 COMPARACIÓN FINAL' as analisis,
  (SELECT SUM(spd.amount) 
   FROM sale_payment_details spd
   INNER JOIN sales s ON spd.sale_id = s.id
   WHERE s.sale_type = 'layaway'
     AND spd.payment_date >= '2025-10-01 06:00:00+00'
     AND spd.payment_date <= '2025-11-01 05:59:59.999+00'
  ) as dashboard_octubre,
  (SELECT SUM(s.paid_amount) 
   FROM sales s
   WHERE s.sale_type = 'layaway'
     AND s.status != 'cancelled'
  ) as historial_todos,
  (SELECT SUM(s.paid_amount) 
   FROM sales s
   WHERE s.sale_type = 'layaway'
     AND s.status != 'cancelled'
  ) - (SELECT SUM(spd.amount) 
   FROM sale_payment_details spd
   INNER JOIN sales s ON spd.sale_id = s.id
   WHERE s.sale_type = 'layaway'
     AND spd.payment_date >= '2025-10-01 06:00:00+00'
     AND spd.payment_date <= '2025-11-01 05:59:59.999+00'
  ) as diferencia;
