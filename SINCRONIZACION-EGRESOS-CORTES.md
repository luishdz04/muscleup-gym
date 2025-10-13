# 🔄 Sincronización entre Egresos y Cortes

## 📊 Resumen Ejecutivo

**SÍ, los egresos y cortes están sincronizados automáticamente**, pero hay casos específicos donde puede haber desincronización. Este documento explica cómo funciona el sistema y las mejoras implementadas.

---

## ✅ Flujos de Sincronización AUTOMÁTICA

### 1️⃣ **Al CREAR un Egreso** (`POST /api/expenses/create`)

```
Usuario crea egreso → Sistema suma todos los egresos del día → Busca corte de esa fecha → Actualiza corte automáticamente
```

**Campos actualizados en `cash_cuts`:**
- ✅ `expenses_amount` = suma de todos los egresos activos del día
- ✅ `final_balance` = grand_total - expenses_amount
- ✅ `updated_at` = timestamp actual
- ✅ `updated_by` = usuario que creó el egreso

**Código relevante:**
```typescript
// Consultar todos los egresos activos del día
const { data: dayExpenses } = await supabase
  .from('expenses')
  .select('amount')
  .eq('expense_date', expense_date)
  .eq('status', 'active');

const totalExpenses = dayExpenses?.reduce((sum, exp) => 
  sum + parseFloat(exp.amount.toString()), 0
) || 0;

// Actualizar corte si existe
await supabase
  .from('cash_cuts')
  .update({
    expenses_amount: totalExpenses,
    final_balance: grand_total - totalExpenses,
    updated_at: now,
    updated_by: userId
  })
  .eq('cut_date', expense_date);
```

---

### 2️⃣ **Al ACTUALIZAR un Egreso** (`PUT /api/expenses/update/[id]`)

```
Usuario edita egreso → Sistema recalcula suma del día → Actualiza corte automáticamente
```

**Flujo:**
1. Se obtiene el egreso existente
2. Se recalculan todos los egresos del día (incluyendo el editado)
3. Se busca el corte de esa fecha
4. Se actualiza el corte con el nuevo total

**Ejemplo:**
- Día 15/06: Egreso de $500 → Corte tiene expenses_amount = $500
- Editas el egreso a $700 → Sistema recalcula → Corte actualizado a $700
- ✅ **Sincronización automática**

---

### 3️⃣ **Al ELIMINAR un Egreso** (`DELETE /api/expenses/delete/[id]`)

```
Usuario elimina egreso → Sistema recalcula suma del día (sin el eliminado) → Actualiza corte
```

**Flujo:**
1. Se cambia el status del egreso a 'deleted'
2. Se recalculan solo los egresos con status = 'active'
3. Se actualiza el corte correspondiente

**Ejemplo:**
- Día 15/06: Egresos de $500 + $300 = $800 → Corte tiene $800
- Eliminas el de $300 → Sistema recalcula → Corte actualizado a $500
- ✅ **Sincronización automática**

---

## ⚠️ CASOS DE DESINCRONIZACIÓN

### 🚨 **Problema Original: Editar Corte Manualmente**

**Antes de la corrección:**

```
Usuario edita corte desde historial → Cambia expenses_amount manualmente → NO se verifica contra egresos reales
```

❌ **Podía causar:**
- Corte con expenses_amount = $1000
- Egresos reales del día = $500
- Desincronización de $500

---

## 🛠️ SOLUCIONES IMPLEMENTADAS

### ✨ **1. Sincronización Automática al Editar Corte**

**Nuevo comportamiento en `PATCH /api/cuts/[id]`:**

```typescript
// Si NO se envía expenses_amount manualmente, el sistema lo recalcula automáticamente
if (body.expenses_amount === undefined && body.syncExpenses !== false) {
  const { data: currentCut } = await supabase
    .from('cash_cuts')
    .select('cut_date')
    .eq('id', cutId)
    .single();
  
  // Consultar gastos reales del día
  const { data: dayExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('expense_date', currentCut.cut_date)
    .eq('status', 'active');
  
  const totalExpenses = dayExpenses.reduce((sum, exp) => 
    sum + parseFloat(exp.amount.toString()), 0
  );
  
  updateData.expenses_amount = totalExpenses; // ✅ Auto-sincronizado
}
```

**Comportamiento:**
- ✅ Si editas POS, membresías, abonos → `expenses_amount` se mantiene sincronizado con egresos reales
- ✅ Si editas `expenses_amount` manualmente → Respeta tu valor (para casos especiales)
- ✅ Puedes deshabilitar la sync enviando `syncExpenses: false`

---

### ✨ **2. Alerta Visual de Desincronización**

**En el diálogo de edición de cortes:**

```tsx
// Al abrir un corte para editar, se cargan los gastos reales
const loadRealExpenses = async (cutDate: string) => {
  const response = await fetch(`/api/expenses/daily?date=${cutDate}`);
  const data = await response.json();
  setRealExpensesAmount(data.totalAmount || 0);
};

// Si hay diferencia, se muestra alerta
{realExpensesAmount !== null && 
 Math.abs(editingCut.expenses_amount - realExpensesAmount) > 0.01 && (
  <Alert severity="warning">
    ⚠️ Desincronización Detectada
    Corte: {formatPrice(editingCut.expenses_amount)}
    Real: {formatPrice(realExpensesAmount)}
    <Button onClick={syncExpensesWithReal}>Sincronizar</Button>
  </Alert>
)}
```

**Funcionalidad:**
1. 🔍 Detecta automáticamente desincronizaciones
2. ⚠️ Muestra alerta visual con diferencia exacta
3. 🔄 Botón "Sincronizar" para corregir con un click
4. 💡 Muestra gastos reales como ayuda visual

---

### ✨ **3. Sincronización Manual Disponible**

**Endpoint dedicado:** `POST /api/expenses/sync-with-cut`

```typescript
const response = await fetch('/api/expenses/sync-with-cut', {
  method: 'POST',
  body: JSON.stringify({ date: '2025-06-15' })
});
```

**Uso:**
- Para corregir desincronizaciones antiguas
- Después de migración o importación de datos
- Como herramienta de mantenimiento

---

## 🎯 Casos de Uso Prácticos

### ✅ **Caso 1: Crear Egreso Después de Hacer Corte**

**Escenario:**
1. Haces corte del día 15/06 a las 11:00 PM
2. A las 11:30 PM recuerdas un gasto de $200 que no registraste
3. Creas el egreso con fecha 15/06

**Resultado:**
- ✅ El egreso se crea correctamente
- ✅ El corte del 15/06 se actualiza automáticamente
- ✅ `expenses_amount` aumenta en $200
- ✅ `final_balance` disminuye en $200
- ✅ **Todo sincronizado automáticamente**

---

### ✅ **Caso 2: Editar Egreso de Días Pasados**

**Escenario:**
1. Corte del 10/06 cerrado con expenses_amount = $1000
2. El 15/06 descubres error en un gasto del 10/06
3. Editas el gasto de $200 a $300

**Resultado:**
- ✅ El egreso se actualiza
- ✅ El corte del 10/06 se recalcula automáticamente
- ✅ `expenses_amount` cambia de $1000 a $1100
- ✅ `final_balance` se ajusta
- ✅ **Sincronización retroactiva automática**

---

### ✅ **Caso 3: Editar Corte sin Tocar Gastos**

**Escenario:**
1. Necesitas ajustar los montos de POS en un corte pasado
2. Editas `pos_efectivo`, `pos_transferencia`, etc.
3. NO tocas `expenses_amount`

**Resultado:**
- ✅ Se actualizan los campos editados
- ✅ Se recalcula `grand_total` automáticamente
- ✅ Se consultan los gastos reales del día
- ✅ Se usa el valor real de gastos (no el que tenía el corte)
- ✅ `final_balance` se recalcula correctamente
- ✅ **Sincronización preventiva automática**

---

### ⚠️ **Caso 4: Editar Gastos Manualmente en Corte (Caso Especial)**

**Escenario:**
1. Necesitas ajustar `expenses_amount` por razón contable especial
2. Los gastos reales son $500 pero necesitas registrar $600
3. Editas manualmente `expenses_amount` a $600

**Resultado:**
- ✅ Se respeta tu valor manual de $600
- ⚠️ Se muestra alerta de desincronización
- 💡 Puedes sincronizar con un click si fue error
- ✅ **Control manual cuando lo necesites**

---

## 📋 Verificación de Sincronización

### Cómo Verificar si Hay Desincronización

**Opción 1: Visual (en Historial de Cortes)**
1. Abre un corte para editar
2. Ve al tab "Info General"
3. Si hay desincronización, verás alerta naranja
4. Click en "Sincronizar" para corregir

**Opción 2: API (programática)**
```typescript
// Obtener gastos reales del día
GET /api/expenses/daily?date=2025-06-15

// Obtener datos del corte
GET /api/cuts/{cutId}

// Comparar expenses_amount vs totalAmount
```

**Opción 3: Sincronización Manual**
```typescript
// Forzar sincronización de un día específico
POST /api/expenses/sync-with-cut
Body: { date: "2025-06-15" }
```

---

## 🔧 Mantenimiento y Mejores Prácticas

### ✅ **Mejores Prácticas**

1. **Registrar gastos en el momento:**
   - Crear egresos el mismo día que ocurren
   - Evita ediciones retroactivas cuando sea posible

2. **Revisar alertas:**
   - Al editar cortes, verificar alerta de sincronización
   - Usar botón "Sincronizar" si aparece

3. **Orden de operaciones:**
   - Primero: Registrar todos los gastos del día
   - Después: Hacer el corte de caja
   - Si olvidas algo: Agrégalo, se sincronizará automáticamente

4. **Auditoría:**
   - Los campos `updated_at` y `updated_by` rastrean cambios
   - Cada sincronización queda registrada

---

## 🚀 Beneficios del Sistema Actual

✅ **Sincronización Bidireccional:** Egresos ↔ Cortes  
✅ **Retroactiva:** Ediciones pasadas se reflejan  
✅ **Automática:** No requiere acción manual  
✅ **Inteligente:** Detecta desincronizaciones  
✅ **Flexible:** Permite ajustes manuales cuando necesario  
✅ **Auditable:** Registra quién y cuándo modificó  
✅ **Visual:** Alertas claras en la UI  

---

## 📞 Soporte y Dudas

Si encuentras un caso donde la sincronización no funciona:

1. Verificar en el tab "Info General" del corte
2. Usar botón "Sincronizar" si hay alerta
3. Revisar logs de sincronización en consola del navegador
4. Como último recurso, usar endpoint de sincronización manual

---

**Última actualización:** Octubre 2025  
**Versión del sistema:** 2.0 con sincronización mejorada
