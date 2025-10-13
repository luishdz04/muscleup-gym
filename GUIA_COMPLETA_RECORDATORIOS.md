# 🚀 Sistema Completo de Recordatorios de Vencimiento

Este sistema ofrece **2 formas** de enviar recordatorios de vencimiento de membresías:

1. **Manual** (Botón en UI) - Control total del usuario
2. **Automático** (CRON Job) - Envío diario sin intervención

---

## 📋 Tabla de Contenidos

- [1. Opción Manual: Botón en UI](#1-opción-manual-botón-en-ui)
- [2. Opción Automática: CRON Job](#2-opción-automática-cron-job)
- [3. Configuración Inicial](#3-configuración-inicial)
- [4. Testing](#4-testing)
- [5. Monitoring](#5-monitoring)
- [6. FAQ](#6-faq)

---

## 1. Opción Manual: Botón en UI

### ✅ Características

- **Control total**: Tú decides cuándo enviar
- **Preview**: Ver lista de usuarios antes de enviar
- **Feedback inmediato**: Resultados detallados en tiempo real
- **Filtros**: Por defecto 3 días, personalizable

### 📍 Ubicación del Componente

El componente está integrado en la página principal de **Dashboard de Membresías**:

**Ubicación:** `src/app/(protected)/dashboard/admin/membresias/page.tsx`

El botón aparece en el header, junto a los botones de "Actualizar" y "Nueva Membresía".

✅ **Ya está implementado** - No necesitas agregarlo manualmente

### 🎯 Flujo de Uso

1. Usuario hace clic en **"Próximos a Vencer (3 días)"**
2. Se abre un dialog mostrando:
   - Fecha objetivo (hoy + 3 días)
   - Lista de usuarios con membresías que vencen esa fecha
   - Contador de usuarios con/sin WhatsApp
3. Usuario revisa la lista
4. Usuario hace clic en **"Enviar Recordatorios"**
5. Sistema envía WhatsApp a cada usuario (con delay de 300ms)
6. Muestra resultados:
   - ✅ Enviados exitosamente
   - ❌ Fallidos (con razón)
   - ⚠️ Omitidos (sin WhatsApp)

### 🎨 Personalización

Puedes ajustar los días de anticipación:

```tsx
{/* Recordatorio con 5 días de anticipación */}
<MembershipExpirationReminder daysBeforeExpiration={5} />

{/* Recordatorio con 1 día de anticipación */}
<MembershipExpirationReminder daysBeforeExpiration={1} />

{/* Múltiples botones para diferentes escenarios */}
<Box sx={{ display: 'flex', gap: 2 }}>
  <MembershipExpirationReminder daysBeforeExpiration={7} />
  <MembershipExpirationReminder daysBeforeExpiration={3} />
  <MembershipExpirationReminder daysBeforeExpiration={1} />
</Box>
```

---

## 2. Opción Automática: CRON Job

### ✅ Características

- **Totalmente automático**: Sin intervención humana
- **Programado**: Ejecuta diario a las 9:00 AM
- **Consistente**: Nunca se olvida de enviar
- **Logs detallados**: Para monitoring y debugging

### ⚙️ Configuración en Vercel

El CRON job ya está configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-membership-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Explicación del Schedule:**
- `0 9 * * *` = Todos los días a las 9:00 AM (UTC)
- Para GMT-6 (México): 3:00 AM hora local
- Para cambiar la hora, ajusta el primer número (ej: `0 15 * * *` = 3 PM UTC / 9 AM México)

### 🔒 Seguridad (Opcional pero Recomendado)

Para evitar que cualquiera llame al endpoint del CRON:

1. **Agrega a `.env.local` (desarrollo):**
```env
CRON_SECRET=tu_secreto_super_seguro_aqui_123456
```

2. **Agrega en Vercel Dashboard (producción):**
   - Ve a tu proyecto → Settings → Environment Variables
   - Agrega: `CRON_SECRET` = `tu_secreto_super_seguro_aqui_123456`

3. **Vercel automáticamente enviará este header:**
```
Authorization: Bearer tu_secreto_super_seguro_aqui_123456
```

### 📅 Cambiar el Horario de Ejecución

Ejemplos de diferentes schedules (formato cron):

```json
// Todos los días a las 8:00 AM UTC (2 AM México)
"schedule": "0 8 * * *"

// Todos los días a las 12:00 PM UTC (6 AM México)  
"schedule": "0 12 * * *"

// Todos los días a las 3:00 PM UTC (9 AM México) - RECOMENDADO
"schedule": "0 15 * * *"

// Lunes a Viernes a las 9:00 AM UTC
"schedule": "0 9 * * 1-5"

// Solo Lunes a las 9:00 AM UTC
"schedule": "0 9 * * 1"
```

**🌍 Conversión de Zonas Horarias:**
- UTC → México (GMT-6): resta 6 horas
- Ejemplo: Si quieres 9 AM en México, usa `15` en el schedule (15 - 6 = 9)

### 🚀 Activación

1. **Commit y Push:**
```bash
git add vercel.json src/app/api/cron/send-membership-reminders/route.ts
git commit -m "feat: Add automatic membership reminders CRON job"
git push origin main
```

2. **Deploy en Vercel:**
   - Automático si tienes integración con GitHub
   - O manual: `vercel --prod`

3. **Verificar en Vercel Dashboard:**
   - Ve a tu proyecto → Cron Jobs
   - Deberías ver: `send-membership-reminders` con schedule `0 9 * * *`

### 📊 Ver Logs del CRON

**En Vercel Dashboard:**
1. Ve a tu proyecto
2. Click en **Logs**
3. Filtra por `/api/cron/send-membership-reminders`
4. Verás logs como:
```
🕒 [CRON] Iniciando envío automático de recordatorios...
✅ [CRON] Recordatorios enviados exitosamente: { sent: 5, failed: 0, skipped: 2, total: 7 }
```

---

## 3. Configuración Inicial

### 🔑 Variables de Entorno Requeridas

Asegúrate de tener todas estas en `.env.local` y en Vercel:

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886
TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID=HX0b562b1d0c0dcd9eb2b4808a192bd99e

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Para CRON Job (opcional pero recomendado)
CRON_SECRET=tu_secreto_super_seguro
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### 📱 Template de Twilio

El template debe estar aprobado en Twilio con estos parámetros:

**Template Name:** `membership_expiration_reminder`
**Template SID:** `HX0b562b1d0c0dcd9eb2b4808a192bd99e`
**Categoría:** `UTILITY` (importante!)

**Variables:**
1. {{1}} = Nombre del cliente
2. {{2}} = Nombre del plan
3. {{3}} = Modalidad (Mensual, Trimestral, etc)
4. {{4}} = Fecha de vencimiento

**Texto del mensaje:**
```
Hola {{1}}, te recordamos que tu plan {{2}} ({{3}}) vence el {{4}}.

Para renovar tu membresía, visita nuestras instalaciones o contáctanos. 

¡No dejes que tu entrenamiento se detenga! 💪
```

---

## 4. Testing

### 🧪 Opción 1: Testing Manual (UI)

1. **Abre tu aplicación**
2. Ve a la página de **Historial de Membresías**
3. Haz clic en **"Próximos a Vencer (3 días)"**
4. Verifica que aparezcan usuarios con membresías que vencen en 3 días
5. Haz clic en **"Enviar Recordatorios"**
6. Revisa los resultados

### 🧪 Opción 2: Testing del CRON (Local)

**Nota:** El CRON de Vercel **solo funciona en producción**. Para testear localmente:

```bash
# PowerShell
$body = @{} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/send-expiration-reminders?daysBeforeExpiration=3" -Method POST -Body $body -ContentType "application/json"
```

### 🧪 Opción 3: Testing del CRON (Producción)

Una vez deployado, puedes forzar la ejecución manualmente:

```bash
# PowerShell (reemplaza con tu URL y secret)
$headers = @{
    "Authorization" = "Bearer tu_secreto_super_seguro"
}
Invoke-RestMethod -Uri "https://tu-app.vercel.app/api/cron/send-membership-reminders" -Method GET -Headers $headers
```

### 🧪 Opción 4: Testing con Fecha Específica

Para testear sin esperar 3 días:

```bash
# PowerShell - Envía a usuarios que vencen el 15 de octubre
$body = @{
    targetDate = "2025-10-15"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/send-expiration-reminders?daysBeforeExpiration=3" -Method POST -Body $body -ContentType "application/json"
```

---

## 5. Monitoring

### 📊 Queries SQL para Estadísticas

**Ver membresías que vencen en 3 días:**
```sql
SELECT 
  um.id,
  u."firstName",
  u."lastName",
  u.whatsapp,
  mp.name AS plan,
  um.end_date,
  um.status
FROM user_memberships um
JOIN "Users" u ON um.user_id = u.id
JOIN membership_plans mp ON um.plan_id = mp.id
WHERE um.status = 'active'
  AND um.end_date = CURRENT_DATE + INTERVAL '3 days'
  AND um.payment_type != 'visit'
ORDER BY u."firstName";
```

**Ver estadísticas de recordatorios (si agregaste los campos opcionales):**
```sql
SELECT 
  DATE(reminder_sent_at) AS fecha,
  COUNT(*) AS recordatorios_enviados,
  COUNT(DISTINCT user_id) AS usuarios_únicos
FROM user_memberships
WHERE reminder_sent = true
  AND reminder_sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(reminder_sent_at)
ORDER BY fecha DESC;
```

### 📧 Logs en Twilio

1. Ve a [Twilio Console](https://console.twilio.com/)
2. Monitor → Logs → Messaging
3. Filtra por `ContentSid: HX0b562b1d0c0dcd9eb2b4808a192bd99e`
4. Verás todos los mensajes enviados con este template

---

## 6. FAQ

### ❓ ¿Cuándo usar cada opción?

| Escenario | Recomendación |
|-----------|---------------|
| Gym pequeño con pocos clientes | **Manual** (más control) |
| Gym grande con muchos clientes | **Automático** (escalable) |
| Testing inicial | **Manual** (para validar) |
| Operación diaria | **Automático** (consistencia) |
| Campañas especiales | **Manual** (flexibilidad) |

### ❓ ¿Puedo usar ambas opciones al mismo tiempo?

**Sí**, son complementarias:
- **CRON automático**: Para envíos diarios rutinarios
- **Botón manual**: Para casos especiales (ej: enviar con 1 día de anticipación)

### ❓ ¿Qué pasa si un usuario no tiene WhatsApp?

El sistema lo **omite automáticamente** y lo reporta como "skipped". No genera error.

### ❓ ¿Cuántos mensajes puedo enviar a la vez?

- **Twilio Free**: ~200 mensajes/día
- **Twilio Paid**: Miles (depende de tu plan)
- **Rate Limiting**: El sistema espera 300ms entre mensajes para evitar bloqueos

### ❓ ¿Por qué 300ms de delay entre mensajes?

Para respetar los límites de Twilio y evitar:
- Error 429 (Too Many Requests)
- Bloqueo temporal de tu cuenta
- Penalizaciones de Meta/WhatsApp

### ❓ ¿Cómo cambio el texto del mensaje?

Debes editar el **template en Twilio Console**:
1. Ve a Messaging → Content Templates
2. Busca `membership_expiration_reminder`
3. Edita el texto
4. Espera aprobación de Meta (puede tardar 24-48 horas)

### ❓ ¿El CRON funciona en desarrollo local?

**No**, el CRON de Vercel solo funciona en producción (deployments). Para desarrollo:
- Usa el botón manual en la UI
- O llama directamente a `/api/send-expiration-reminders`

### ❓ ¿Cómo desactivo el CRON automático?

1. **Temporal**: En Vercel Dashboard → Cron Jobs → Disable
2. **Permanente**: Elimina la sección `"crons"` de `vercel.json` y redeploy

### ❓ ¿Se puede enviar a una fecha específica?

Sí, usa el parámetro `targetDate`:

```bash
# PowerShell
$body = @{
    targetDate = "2025-10-25"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://tu-app.vercel.app/api/send-expiration-reminders" -Method POST -Body $body -ContentType "application/json"
```

### ❓ ¿Qué pasa si el envío falla para algunos usuarios?

El sistema es **resiliente**:
- Continúa enviando a los demás usuarios
- Registra los errores individualmente
- Retorna un reporte detallado con éxitos y fallos

### ❓ ¿Cómo evito enviar duplicados?

**Opción 1 (Recomendada):** Agrega campos de tracking a la base de datos:

```sql
ALTER TABLE user_memberships
ADD COLUMN reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN reminder_sent_at TIMESTAMPTZ;
```

El API ya intenta actualizar estos campos automáticamente.

**Opción 2:** Usa el CRON automático (solo ejecuta 1 vez al día)

---

## 🎉 ¡Sistema Completo!

Ahora tienes un sistema robusto con:

✅ **Opción Manual**: Botón en UI para control total  
✅ **Opción Automática**: CRON job para envíos diarios  
✅ **Preview**: Ver lista antes de enviar  
✅ **Feedback**: Resultados detallados  
✅ **Seguridad**: Autenticación del CRON  
✅ **Monitoring**: Logs y estadísticas  
✅ **Resiliente**: Manejo robusto de errores  

---

## 📚 Archivos del Sistema

```
muscleup-gym/
├── src/
│   ├── app/
│   │   └── api/
│   │       ├── send-expiration-reminders/
│   │       │   └── route.ts                    # API principal
│   │       ├── user-memberships/
│   │       │   └── route.ts                    # API para obtener lista
│   │       └── cron/
│   │           └── send-membership-reminders/
│   │               └── route.ts                # CRON job automático
│   └── components/
│       └── admin/
│           └── MembershipExpirationReminder.tsx  # Componente UI
├── vercel.json                                  # Configuración del CRON
└── GUIA_COMPLETA_RECORDATORIOS.md              # Esta guía
```

---

## 🚀 Próximos Pasos Recomendados

1. **Testear localmente** con el botón manual
2. **Validar** que los mensajes lleguen correctamente
3. **Deployar a producción** (Vercel)
4. **Configurar CRON_SECRET** en Vercel Dashboard
5. **Monitorear los primeros días** en Vercel Logs
6. **(Opcional)** Agregar campos de tracking a la BD
7. **(Opcional)** Crear dashboard de estadísticas

---

**¿Necesitas ayuda?** Revisa los logs en:
- Vercel Dashboard → Logs
- Twilio Console → Messaging Logs
- Browser DevTools → Network (para testing UI)
