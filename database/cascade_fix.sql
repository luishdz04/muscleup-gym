-- CASCADE DELETE FIX - Ejecutar en Supabase SQL Editor
-- Fecha: 2025-01-07

-- 1. SALES -> SALE_ITEMS
ALTER TABLE public.sale_items DROP CONSTRAINT IF EXISTS sale_items_sale_id_fkey;
ALTER TABLE public.sale_items ADD CONSTRAINT sale_items_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;

-- 2. SALES -> SALE_PAYMENT_DETAILS
ALTER TABLE public.sale_payment_details DROP CONSTRAINT IF EXISTS sale_payment_details_sale_id_fkey;
ALTER TABLE public.sale_payment_details ADD CONSTRAINT sale_payment_details_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;

-- 3. USER_MEMBERSHIPS -> MEMBERSHIP_PAYMENT_DETAILS
ALTER TABLE public.membership_payment_details DROP CONSTRAINT IF EXISTS membership_payment_details_membership_id_fkey;
ALTER TABLE public.membership_payment_details ADD CONSTRAINT membership_payment_details_membership_id_fkey 
  FOREIGN KEY (membership_id) REFERENCES public.user_memberships(id) ON DELETE CASCADE;

-- 4. SALES -> REFUNDS
ALTER TABLE public.refunds DROP CONSTRAINT IF EXISTS refunds_sale_id_fkey;
ALTER TABLE public.refunds ADD CONSTRAINT refunds_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;

-- 5. REFUNDS -> REFUND_ITEMS
ALTER TABLE public.refund_items DROP CONSTRAINT IF EXISTS refund_items_refund_id_fkey;
ALTER TABLE public.refund_items ADD CONSTRAINT refund_items_refund_id_fkey 
  FOREIGN KEY (refund_id) REFERENCES public.refunds(id) ON DELETE CASCADE;

-- 6. SALES -> LAYAWAY_STATUS_HISTORY
ALTER TABLE public.layaway_status_history DROP CONSTRAINT IF EXISTS layaway_status_history_layaway_id_fkey;
ALTER TABLE public.layaway_status_history ADD CONSTRAINT layaway_status_history_layaway_id_fkey 
  FOREIGN KEY (layaway_id) REFERENCES public.sales(id) ON DELETE CASCADE;

-- 7. SALES -> SALE_EDIT_HISTORY
ALTER TABLE public.sale_edit_history DROP CONSTRAINT IF EXISTS sale_edit_history_sale_id_fkey;
ALTER TABLE public.sale_edit_history ADD CONSTRAINT sale_edit_history_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;

-- VERIFICACIÓN
SELECT 
  tc.constraint_name,
  tc.table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
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
ORDER BY tc.table_name;
