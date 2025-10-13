-- ============================================
-- 🔍 VER TODOS LOS PAGOS DEL APARTADO PROBLEMÁTICO
-- APT-1759546185329-HPXTSQ
-- ============================================

-- Ver TODOS los pagos de este apartado específico
SELECT 
  spd.id,
  spd.payment_date,
  spd.payment_method,
  spd.amount,
  spd.commission_rate,
  spd.commission_amount,
  spd.is_partial_payment,
  spd.payment_reference,
  spd.sequence_order,
  spd.created_at,
  spd.created_by,
  CASE 
    WHEN spd.payment_date >= '2025-10-01 06:00:00+00' 
     AND spd.payment_date <= '2025-11-01 05:59:59.999+00'
    THEN '✅ Octubre 2025'
    ELSE '❌ Otro mes'
  END as periodo
FROM sale_payment_details spd
INNER JOIN sales s ON spd.sale_id = s.id
WHERE s.sale_number = 'APT-1759546185329-HPXTSQ'
ORDER BY spd.payment_date, spd.sequence_order;

-- Verificar la suma total
SELECT 
  s.sale_number,
  s.status,
  s.total_amount,
  s.paid_amount as paid_amount_registro,
  COALESCE(SUM(spd.amount), 0) as suma_real_pagos,
  COALESCE(SUM(spd.amount), 0) - s.paid_amount as diferencia,
  s.pending_amount as pending_registro,
  s.total_amount - COALESCE(SUM(spd.amount), 0) as pending_real
FROM sales s
LEFT JOIN sale_payment_details spd ON spd.sale_id = s.id
WHERE s.sale_number = 'APT-1759546185329-HPXTSQ'
GROUP BY s.id, s.sale_number, s.status, s.total_amount, s.paid_amount, s.pending_amount;

-- Ver el apartado completo
SELECT 
  id,
  sale_number,
  status,
  payment_status,
  total_amount,
  paid_amount,
  pending_amount,
  created_at,
  completed_at,
  last_payment_date
FROM sales
WHERE sale_number = 'APT-1759546185329-HPXTSQ';
