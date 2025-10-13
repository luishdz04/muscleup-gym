-- ============================================
-- ✅ VALIDACIÓN FINAL: APARTADOS CORREGIDOS
-- Verificar que ambas consultas den el mismo resultado
-- ============================================

-- 1️⃣ MÉTODO DASHBOARD: Pagos de octubre excluyendo cancelados
SELECT 
  '📊 DASHBOARD (Corregido)' as metodo,
  COUNT(DISTINCT spd.id) as cantidad_pagos,
  SUM(spd.amount) as total_cobrado
FROM sale_payment_details spd
INNER JOIN sales s ON spd.sale_id = s.id
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled'  -- ✅ NUEVO: Excluir cancelados
  AND spd.payment_date >= '2025-10-01 06:00:00+00'
  AND spd.payment_date <= '2025-11-01 05:59:59.999+00';

-- 2️⃣ MÉTODO HISTORIAL: paid_amount de apartados no cancelados
SELECT 
  '📦 HISTORIAL' as metodo,
  COUNT(DISTINCT s.id) as cantidad_apartados,
  SUM(s.paid_amount) as total_cobrado
FROM sales s
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled';

-- 3️⃣ VERIFICAR APARTADOS CANCELADOS (no deben contar)
SELECT 
  '❌ PAGOS DE CANCELADOS (Excluidos)' as tipo,
  s.sale_number,
  s.status,
  s.cancelled_at,
  COALESCE(SUM(spd.amount), 0) as pagos_realizados,
  s.refund_amount as reembolsado
FROM sales s
LEFT JOIN sale_payment_details spd ON spd.sale_id = s.id
WHERE s.sale_type = 'layaway'
  AND s.status = 'cancelled'
GROUP BY s.id, s.sale_number, s.status, s.cancelled_at, s.refund_amount
ORDER BY s.created_at DESC;

-- 4️⃣ DESGLOSE COMPLETO DE APARTADOS ACTIVOS/COMPLETADOS
SELECT 
  '✅ APARTADOS VÁLIDOS (Octubre)' as tipo,
  s.sale_number,
  s.status,
  s.paid_amount as paid_amount_venta,
  COALESCE(
    (SELECT SUM(amount) 
     FROM sale_payment_details 
     WHERE sale_id = s.id 
       AND payment_date >= '2025-10-01 06:00:00+00'
       AND payment_date <= '2025-11-01 05:59:59.999+00'
    ), 
    0
  ) as pagos_octubre
FROM sales s
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled'
ORDER BY s.created_at DESC;

-- 5️⃣ COMPARACIÓN FINAL (Debe coincidir)
SELECT 
  '🎯 RESULTADO FINAL' as analisis,
  (SELECT SUM(spd.amount) 
   FROM sale_payment_details spd
   INNER JOIN sales s ON spd.sale_id = s.id
   WHERE s.sale_type = 'layaway'
     AND s.status != 'cancelled'
     AND spd.payment_date >= '2025-10-01 06:00:00+00'
     AND spd.payment_date <= '2025-11-01 05:59:59.999+00'
  ) as dashboard_octubre_correcto,
  (SELECT SUM(s.paid_amount) 
   FROM sales s
   WHERE s.sale_type = 'layaway'
     AND s.status != 'cancelled'
  ) as historial_todos,
  CASE 
    WHEN (SELECT SUM(spd.amount) 
          FROM sale_payment_details spd
          INNER JOIN sales s ON spd.sale_id = s.id
          WHERE s.sale_type = 'layaway'
            AND s.status != 'cancelled'
            AND spd.payment_date >= '2025-10-01 06:00:00+00'
            AND spd.payment_date <= '2025-11-01 05:59:59.999+00'
         ) <= (SELECT SUM(s.paid_amount) 
               FROM sales s
               WHERE s.sale_type = 'layaway'
                 AND s.status != 'cancelled')
    THEN '✅ CORRECTO: Dashboard <= Historial'
    ELSE '⚠️ ERROR: Dashboard > Historial'
  END as validacion;
