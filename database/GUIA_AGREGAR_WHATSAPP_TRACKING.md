# 📋 GUÍA: AGREGAR CAMPOS DE TRACKING DE WHATSAPP

## 🎯 OBJETIVO
Agregar dos campos opcionales a la tabla `user_memberships` para rastrear si se envió notificación de WhatsApp al registrar/renovar membresías.

---

## 📦 CAMPOS QUE SE AGREGARÁN

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `whatsapp_sent` | BOOLEAN | `false` | Indica si se envió WhatsApp |
| `whatsapp_sent_at` | TIMESTAMPTZ | `NULL` | Fecha/hora del envío |

---

## ✅ PASO 1: VERIFICAR QUE NO EXISTAN LOS CAMPOS

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_memberships'
AND column_name IN ('whatsapp_sent', 'whatsapp_sent_at');
```

**Resultado esperado**: `0 rows` (los campos no existen todavía)

---

## ✅ PASO 2: EJECUTAR EL SCRIPT EN SUPABASE

### Opción A: Desde Supabase Dashboard (RECOMENDADO)

1. **Ir a Supabase Dashboard**
   - Abre: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abrir SQL Editor**
   - Menú lateral → `SQL Editor`
   - Click en `New query`

3. **Copiar y pegar el contenido completo del archivo**
   - Archivo: `database/ADD_WHATSAPP_TRACKING_FIELDS.sql`
   - Copiar TODO el contenido
   - Pegar en el editor

4. **Ejecutar el script**
   - Click en botón `Run` (o Ctrl+Enter)
   - Esperar mensaje de éxito

### Opción B: Desde Terminal (Alternativo)

```bash
# Solo si tienes Supabase CLI instalado
supabase db push --file database/ADD_WHATSAPP_TRACKING_FIELDS.sql
```

---

## ✅ PASO 3: VERIFICAR QUE SE AGREGARON CORRECTAMENTE

```sql
-- Verificar estructura
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'user_memberships'
AND column_name IN ('whatsapp_sent', 'whatsapp_sent_at')
ORDER BY column_name;
```

**Resultado esperado**:
```
column_name       | data_type                   | is_nullable | column_default
------------------|-----------------------------|-------------|---------------
whatsapp_sent     | boolean                     | YES         | false
whatsapp_sent_at  | timestamp with time zone    | YES         | NULL
```

---

## ✅ PASO 4: VERIFICAR COMENTARIOS

```sql
SELECT 
  column_name,
  col_description('user_memberships'::regclass, ordinal_position) as description
FROM information_schema.columns
WHERE table_name = 'user_memberships'
AND column_name IN ('whatsapp_sent', 'whatsapp_sent_at')
ORDER BY column_name;
```

---

## ✅ PASO 5: VERIFICAR ÍNDICE

```sql
SELECT 
  indexname, 
  indexdef
FROM pg_indexes
WHERE tablename = 'user_memberships'
AND indexname = 'idx_user_memberships_whatsapp_sent';
```

**Resultado esperado**:
```
indexname                              | indexdef
---------------------------------------|--------------------------------------------------
idx_user_memberships_whatsapp_sent     | CREATE INDEX idx_user_memberships_whatsapp_sent...
```

---

## ✅ PASO 6: PROBAR ACTUALIZACIÓN MANUAL

```sql
-- Crear una membresía de prueba (o usar una existente)
-- Y simular que se envió WhatsApp

UPDATE user_memberships
SET 
  whatsapp_sent = true,
  whatsapp_sent_at = NOW()
WHERE id = 'AQUI_VA_UN_ID_DE_PRUEBA';

-- Verificar que se actualizó
SELECT 
  id,
  whatsapp_sent,
  whatsapp_sent_at
FROM user_memberships
WHERE id = 'AQUI_VA_UN_ID_DE_PRUEBA';
```

---

## ✅ PASO 7: ACTUALIZAR SCHEMA_COMPLETO.TXT

Agregar estos campos a la definición de `user_memberships`:

```sql
CREATE TABLE public.user_memberships (
  -- ... campos existentes ...
  paid_amount numeric DEFAULT 0,
  pending_amount numeric DEFAULT 0,
  whatsapp_sent boolean DEFAULT false,               -- ✅ NUEVO
  whatsapp_sent_at timestamp with time zone,         -- ✅ NUEVO
  CONSTRAINT user_memberships_pkey PRIMARY KEY (id),
  -- ... constraints existentes ...
);
```

---

## 🧪 TESTING POST-INSTALACIÓN

### Test 1: Registrar Nueva Membresía
1. Ve a "Registrar Membresía"
2. Selecciona un cliente con WhatsApp válido
3. Completa y registra
4. Verifica en la consola: `✅ Estado de envío de WhatsApp actualizado en la base de datos`
5. Verifica en Supabase:
   ```sql
   SELECT whatsapp_sent, whatsapp_sent_at 
   FROM user_memberships 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
   Debe mostrar: `whatsapp_sent = true` y `whatsapp_sent_at` con timestamp

### Test 2: Cliente Sin WhatsApp
1. Registra membresía para cliente sin campo whatsapp
2. Verifica que `whatsapp_sent` permanezca en `false`
3. Verifica que no haya errores en la aplicación

---

## 📊 CONSULTAS ÚTILES

### Ver todas las membresías con WhatsApp enviado
```sql
SELECT 
  um.id,
  u.firstName || ' ' || u.lastName as cliente,
  um.payment_type,
  um.whatsapp_sent,
  um.whatsapp_sent_at,
  um.created_at
FROM user_memberships um
JOIN "Users" u ON u.id = um.userid
WHERE um.whatsapp_sent = true
ORDER BY um.whatsapp_sent_at DESC
LIMIT 20;
```

### Estadísticas de envío
```sql
SELECT 
  COUNT(*) as total_membresias,
  COUNT(*) FILTER (WHERE whatsapp_sent = true) as con_whatsapp,
  COUNT(*) FILTER (WHERE whatsapp_sent = false OR whatsapp_sent IS NULL) as sin_whatsapp,
  ROUND(100.0 * COUNT(*) FILTER (WHERE whatsapp_sent = true) / COUNT(*), 2) as porcentaje_exito
FROM user_memberships
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
```

### Últimas membresías registradas hoy
```sql
SELECT 
  um.id,
  u.firstName || ' ' || u.lastName as cliente,
  u.whatsapp,
  um.payment_type,
  um.total_amount,
  um.whatsapp_sent,
  um.whatsapp_sent_at,
  um.created_at
FROM user_memberships um
JOIN "Users" u ON u.id = um.userid
WHERE DATE(um.created_at) = CURRENT_DATE
ORDER BY um.created_at DESC;
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Los campos son opcionales**: Si no existen, el sistema funciona igual
2. **No hay migración de datos**: Membresías anteriores tendrán `whatsapp_sent = false`
3. **El API ya está preparado**: Solo actualiza si los campos existen (try-catch)
4. **No afecta membresías existentes**: Solo nuevas membresías registradas después de la migración

---

## 🆘 TROUBLESHOOTING

### Error: "column already exists"
**Causa**: Los campos ya fueron agregados anteriormente  
**Solución**: No hacer nada, el script usa `IF NOT EXISTS`

### Error: "permission denied"
**Causa**: No tienes permisos de ALTER TABLE  
**Solución**: Usar cuenta de admin de Supabase

### El campo no aparece en la app
**Causa**: Prisma schema no actualizado  
**Solución**: No es necesario actualizar Prisma si no consultas estos campos en queries

---

## ✅ CHECKLIST FINAL

- [ ] Script ejecutado sin errores
- [ ] Campos verificados en `information_schema.columns`
- [ ] Índice creado correctamente
- [ ] Comentarios agregados
- [ ] Test manual de UPDATE exitoso
- [ ] SCHEMA_COMPLETO.txt actualizado
- [ ] Primera membresía de prueba registrada con éxito
- [ ] WhatsApp recibido por el cliente
- [ ] Campos `whatsapp_sent` y `whatsapp_sent_at` actualizados en BD

---

**Fecha**: 10 de octubre de 2025  
**Autor**: Sistema de Gestión Muscle Up Gym  
**Status**: ✅ LISTO PARA EJECUTAR
