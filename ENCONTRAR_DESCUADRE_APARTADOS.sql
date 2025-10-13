-- ============================================
-- 🔍 ENCONTRAR DESCUADRE EN APARTADOS
-- Comparar paid_amount vs suma de pagos detalle
-- ============================================

-- 1️⃣ APARTADOS CON DESCUADRE (paid_amount ≠ suma de pagos)
SELECT 
  '⚠️ APARTADOS DESCUADRADOS' as tipo,
  s.sale_number,
  s.status,
  s.paid_amount as paid_amount_en_venta,
  COALESCE(
    (SELECT SUM(amount) FROM sale_payment_details WHERE sale_id = s.id),
    0
  ) as suma_pagos_detalle,
  COALESCE(
    (SELECT SUM(amount) FROM sale_payment_details WHERE sale_id = s.id),
    0
  ) - s.paid_amount as diferencia
FROM sales s
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled'
  AND s.paid_amount != COALESCE(
    (SELECT SUM(amount) FROM sale_payment_details WHERE sale_id = s.id),
    0
  )
ORDER BY ABS(
  COALESCE(
    (SELECT SUM(amount) FROM sale_payment_details WHERE sale_id = s.id),
    0
  ) - s.paid_amount
) DESC;

-- 2️⃣ DETALLE DE PAGOS DE APARTADOS EN OCTUBRE
SELECT 
  '💳 PAGOS OCTUBRE 2025' as tipo,
  s.sale_number,
  s.status,
  s.paid_amount as paid_amount_venta,
  spd.payment_date,
  spd.amount,
  spd.payment_method,
  spd.is_partial_payment
FROM sale_payment_details spd
INNER JOIN sales s ON spd.sale_id = s.id
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled'
  AND spd.payment_date >= '2025-10-01 06:00:00+00'
  AND spd.payment_date <= '2025-11-01 05:59:59.999+00'
ORDER BY s.sale_number, spd.payment_date;

-- 3️⃣ TODOS LOS PAGOS POR APARTADO (incluyendo fuera de octubre)
SELECT 
  '📋 TODOS LOS PAGOS POR APARTADO' as tipo,
  s.sale_number,
  s.status,
  s.paid_amount as paid_amount_venta,
  spd.payment_date,
  spd.amount,
  CASE 
    WHEN spd.payment_date >= '2025-10-01 06:00:00+00' 
     AND spd.payment_date <= '2025-11-01 05:59:59.999+00'
    THEN '✅ En Octubre'
    ELSE '❌ Fuera de Octubre'
  END as periodo
FROM sale_payment_details spd
INNER JOIN sales s ON spd.sale_id = s.id
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled'
ORDER BY s.sale_number, spd.payment_date;

-- 4️⃣ RESUMEN POR APARTADO
SELECT 
  '📊 RESUMEN POR APARTADO' as tipo,
  s.sale_number,
  s.status,
  s.created_at::date as fecha_creacion,
  s.total_amount,
  s.paid_amount,
  s.pending_amount,
  COALESCE(
    (SELECT SUM(amount) FROM sale_payment_details WHERE sale_id = s.id),
    0
  ) as suma_total_pagos,
  COALESCE(
    (SELECT SUM(amount) 
     FROM sale_payment_details 
     WHERE sale_id = s.id
       AND payment_date >= '2025-10-01 06:00:00+00'
       AND payment_date <= '2025-11-01 05:59:59.999+00'
    ),
    0
  ) as suma_pagos_octubre,
  COALESCE(
    (SELECT COUNT(*) FROM sale_payment_details WHERE sale_id = s.id),
    0
  ) as cantidad_pagos
FROM sales s
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled'
ORDER BY s.created_at DESC;

-- 5️⃣ SCRIPT DE CORRECCIÓN (si hay descuadre)
-- Actualiza paid_amount para que coincida con la suma real de pagos
SELECT 
  '🔧 SCRIPT DE CORRECCIÓN' as accion,
  s.sale_number,
  s.paid_amount as valor_actual_incorrecto,
  COALESCE(
    (SELECT SUM(amount) FROM sale_payment_details WHERE sale_id = s.id),
    0
  ) as valor_correcto,
  format(
    'UPDATE sales SET paid_amount = %s, pending_amount = %s, updated_at = NOW() WHERE id = ''%s'';',
    COALESCE((SELECT SUM(amount) FROM sale_payment_details WHERE sale_id = s.id), 0),
    s.total_amount - COALESCE((SELECT SUM(amount) FROM sale_payment_details WHERE sale_id = s.id), 0),
    s.id
  ) as sql_update
FROM sales s
WHERE s.sale_type = 'layaway'
  AND s.status != 'cancelled'
  AND s.paid_amount != COALESCE(
    (SELECT SUM(amount) FROM sale_payment_details WHERE sale_id = s.id),
    0
  );
