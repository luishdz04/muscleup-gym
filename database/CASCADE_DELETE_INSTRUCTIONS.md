# 🔥 CORRECCIÓN CRÍTICA: ON DELETE CASCADE

## ❌ Problema Actual

Las tablas relacionadas NO se eliminan automáticamente cuando borras una venta o membresía:

```sql
-- ❌ ACTUAL (SIN CASCADE)
CONSTRAINT sale_items_sale_id_fkey 
  FOREIGN KEY (sale_id) REFERENCES public.sales(id)
  -- Sin ON DELETE CASCADE

CONSTRAINT membership_payment_details_membership_id_fkey 
  FOREIGN KEY (membership_id) REFERENCES public.user_memberships(id)
  -- Sin ON DELETE CASCADE
```

### Consecuencias:
- ❌ Error al intentar eliminar una venta que tiene items
- ❌ Error al intentar eliminar una membresía con pagos
- ❌ Datos huérfanos en la base de datos
- ❌ Inconsistencia de datos

---

## ✅ Solución

Agregar `ON DELETE CASCADE` a las Foreign Keys para que automáticamente se eliminen:

### 1. **SALES (Ventas)**
Cuando eliminas una venta (`sales`), debe eliminar:
- ✅ `sale_items` - Productos vendidos
- ✅ `sale_payment_details` - Detalles de pago
- ✅ `refunds` - Reembolsos
- ✅ `layaway_status_history` - Historial de apartados
- ✅ `sale_edit_history` - Historial de ediciones

### 2. **USER_MEMBERSHIPS (Membresías)**
Cuando eliminas una membresía (`user_memberships`), debe eliminar:
- ✅ `membership_payment_details` - Detalles de pago

### 3. **REFUNDS (Reembolsos)**
Cuando eliminas un reembolso (`refunds`), debe eliminar:
- ✅ `refund_items` - Items del reembolso

---

## 📋 Instrucciones de Aplicación

### Opción 1: Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard
2. Abre el **SQL Editor**
3. Copia el contenido de `database/fix_cascade_delete.sql`
4. Ejecuta el script
5. Verifica los resultados con la query de verificación incluida

### Opción 2: psql Command Line

```bash
# Conectar a tu base de datos
psql -h db.your-project.supabase.co -U postgres -d postgres

# Ejecutar el script
\i database/fix_cascade_delete.sql
```

---

## ✅ Verificación

Después de ejecutar el script, verifica que las FK tengan CASCADE:

```sql
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule  -- Debe ser 'CASCADE'
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN (
    'sale_items', 
    'sale_payment_details', 
    'membership_payment_details'
  )
ORDER BY tc.table_name;
```

**Resultado esperado:**
```
constraint_name                              | table_name                  | delete_rule
---------------------------------------------|----------------------------|-------------
sale_items_sale_id_fkey                     | sale_items                 | CASCADE ✅
sale_payment_details_sale_id_fkey           | sale_payment_details       | CASCADE ✅
membership_payment_details_membership_id_fkey| membership_payment_details | CASCADE ✅
```

---

## 🎯 Comportamiento Después del Fix

### Eliminar una Venta:
```typescript
// Ahora puedes hacer esto sin errores:
await supabase
  .from('sales')
  .delete()
  .eq('id', saleId);

// Automáticamente se eliminan:
// - sale_items
// - sale_payment_details
// - refunds (si existen)
// - layaway_status_history
// - sale_edit_history
```

### Eliminar una Membresía:
```typescript
await supabase
  .from('user_memberships')
  .delete()
  .eq('id', membershipId);

// Automáticamente se eliminan:
// - membership_payment_details
```

---

## ⚠️ IMPORTANTE

### Antes de ejecutar:
1. ✅ Haz un backup de tu base de datos
2. ✅ Verifica que no haya datos críticos que podrían perderse
3. ✅ Prueba en entorno de desarrollo primero

### Después de ejecutar:
1. ✅ Verifica con la query de verificación
2. ✅ Prueba eliminando una venta de prueba
3. ✅ Confirma que los registros relacionados se eliminaron

---

## 📊 Tablas Afectadas

| Tabla Padre | Tabla Hija | FK Actualizada |
|------------|-----------|----------------|
| `sales` | `sale_items` | ✅ CASCADE |
| `sales` | `sale_payment_details` | ✅ CASCADE |
| `sales` | `refunds` | ✅ CASCADE |
| `sales` | `layaway_status_history` | ✅ CASCADE |
| `sales` | `sale_edit_history` | ✅ CASCADE |
| `user_memberships` | `membership_payment_details` | ✅ CASCADE |
| `refunds` | `refund_items` | ✅ CASCADE |

---

## 🔒 Seguridad

El script usa bloques `DO $$` con verificación de existencia para:
- ✅ No fallar si el constraint no existe
- ✅ Mostrar mensajes de éxito
- ✅ Ser idempotente (puede ejecutarse varias veces)

---

## 📝 Notas

- Este cambio NO afecta datos existentes
- Solo cambia el comportamiento de las eliminaciones futuras
- Es un cambio a nivel de base de datos, no requiere cambios en código
- Mejora la integridad referencial de tu base de datos
