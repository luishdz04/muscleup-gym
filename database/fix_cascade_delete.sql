-- ============================================================================
-- SCRIPT: Agregar ON DELETE CASCADE a Foreign Keys
-- Fecha: 2025-01-07
-- Descripción: Asegura que al eliminar sales o memberships, 
--              se eliminen automáticamente sus registros relacionados
-- ============================================================================

-- 1. SALES -> SALE_ITEMS (Eliminar productos de venta cuando se elimina la venta)
-- ============================================================================
DO $$ 
BEGIN
  -- Verificar si existe el constraint antes de eliminarlo
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sale_items_sale_id_fkey' 
    AND table_name = 'sale_items'
  ) THEN
    ALTER TABLE public.sale_items 
      DROP CONSTRAINT sale_items_sale_id_fkey;
    
    ALTER TABLE public.sale_items 
      ADD CONSTRAINT sale_items_sale_id_fkey 
      FOREIGN KEY (sale_id) 
      REFERENCES public.sales(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ sale_items_sale_id_fkey actualizado con CASCADE';
  END IF;
END $$;

-- 2. SALES -> SALE_PAYMENT_DETAILS (Eliminar detalles de pago cuando se elimina la venta)
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sale_payment_details_sale_id_fkey' 
    AND table_name = 'sale_payment_details'
  ) THEN
    ALTER TABLE public.sale_payment_details 
      DROP CONSTRAINT sale_payment_details_sale_id_fkey;
    
    ALTER TABLE public.sale_payment_details 
      ADD CONSTRAINT sale_payment_details_sale_id_fkey 
      FOREIGN KEY (sale_id) 
      REFERENCES public.sales(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ sale_payment_details_sale_id_fkey actualizado con CASCADE';
  END IF;
END $$;

-- 3. USER_MEMBERSHIPS -> MEMBERSHIP_PAYMENT_DETAILS (Eliminar pagos cuando se elimina membresía)
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'membership_payment_details_membership_id_fkey' 
    AND table_name = 'membership_payment_details'
  ) THEN
    ALTER TABLE public.membership_payment_details 
      DROP CONSTRAINT membership_payment_details_membership_id_fkey;
    
    ALTER TABLE public.membership_payment_details 
      ADD CONSTRAINT membership_payment_details_membership_id_fkey 
      FOREIGN KEY (membership_id) 
      REFERENCES public.user_memberships(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ membership_payment_details_membership_id_fkey actualizado con CASCADE';
  END IF;
END $$;

-- 4. SALES -> REFUNDS (Eliminar reembolsos cuando se elimina la venta)
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'refunds_sale_id_fkey' 
    AND table_name = 'refunds'
  ) THEN
    ALTER TABLE public.refunds 
      DROP CONSTRAINT refunds_sale_id_fkey;
    
    ALTER TABLE public.refunds 
      ADD CONSTRAINT refunds_sale_id_fkey 
      FOREIGN KEY (sale_id) 
      REFERENCES public.sales(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ refunds_sale_id_fkey actualizado con CASCADE';
  END IF;
END $$;

-- 5. REFUNDS -> REFUND_ITEMS (Eliminar items de reembolso cuando se elimina el reembolso)
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'refund_items_refund_id_fkey' 
    AND table_name = 'refund_items'
  ) THEN
    ALTER TABLE public.refund_items 
      DROP CONSTRAINT refund_items_refund_id_fkey;
    
    ALTER TABLE public.refund_items 
      ADD CONSTRAINT refund_items_refund_id_fkey 
      FOREIGN KEY (refund_id) 
      REFERENCES public.refunds(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ refund_items_refund_id_fkey actualizado con CASCADE';
  END IF;
END $$;

-- 6. SALES -> LAYAWAY_STATUS_HISTORY (Eliminar historial cuando se elimina apartado)
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'layaway_status_history_layaway_id_fkey' 
    AND table_name = 'layaway_status_history'
  ) THEN
    ALTER TABLE public.layaway_status_history 
      DROP CONSTRAINT layaway_status_history_layaway_id_fkey;
    
    ALTER TABLE public.layaway_status_history 
      ADD CONSTRAINT layaway_status_history_layaway_id_fkey 
      FOREIGN KEY (layaway_id) 
      REFERENCES public.sales(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ layaway_status_history_layaway_id_fkey actualizado con CASCADE';
  END IF;
END $$;

-- 7. SALES -> SALE_EDIT_HISTORY (Eliminar historial de ediciones cuando se elimina la venta)
-- ============================================================================
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sale_edit_history_sale_id_fkey' 
    AND table_name = 'sale_edit_history'
  ) THEN
    ALTER TABLE public.sale_edit_history 
      DROP CONSTRAINT sale_edit_history_sale_id_fkey;
    
    ALTER TABLE public.sale_edit_history 
      ADD CONSTRAINT sale_edit_history_sale_id_fkey 
      FOREIGN KEY (sale_id) 
      REFERENCES public.sales(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE '✅ sale_edit_history_sale_id_fkey actualizado con CASCADE';
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
  AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'sale_items', 
    'sale_payment_details', 
    'membership_payment_details',
    'refunds',
    'refund_items',
    'layaway_status_history',
    'sale_edit_history'
  )
  AND ccu.table_name IN ('sales', 'user_memberships', 'refunds')
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ Todas las FK relacionadas deben mostrar delete_rule = 'CASCADE'
-- 
-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- ============================================================================
