# ✅ SISTEMA DE RECORDATORIOS MASIVOS DE VENCIMIENTO

## 🎯 OBJETIVO
Sistema automático para enviar recordatorios masivos de WhatsApp a clientes cuyas membresías están próximas a vencer.

---

## 📋 COMPONENTES IMPLEMENTADOS

### 1. ✅ API Endpoint
**Archivo**: `src/app/api/send-expiration-reminders/route.ts`

**Funcionalidad**:
- Busca membresías activas que vencen en una fecha específica
- Obtiene datos del usuario y plan
- Envía recordatorio masivo por WhatsApp
- Maneja errores individuales sin detener el proceso
- Retorna resumen detallado del envío

**Endpoint**: `POST /api/send-expiration-reminders`

**Query Parameters**:
- `daysBeforeExpiration`: Días de anticipación (default: 3)

**Body** (opcional):
```json
{
  "targetDate": "2025-10-13"  // Fecha específica YYYY-MM-DD
}
```

**Response**:
```json
{
  "success": true,
  "message": "Recordatorios procesados: 5 enviados, 0 fallidos, 2 omitidos",
  "expirationDate": "2025-10-13",
  "daysBeforeExpiration": 3,
  "sent": 5,
  "failed": 0,
  "skipped": 2,
  "total": 7,
  "details": [
    {
      "membershipId": "abc-123",
      "userId": "user-456",
      "userName": "Juan Pérez",
      "phone": "whatsapp:+528661234567",
      "status": "sent",
      "messageSid": "SMxxxxxxxx",
      "twilioStatus": "queued"
    }
  ]
}
```

---

### 2. ✅ Template de Twilio
**Template ID**: `HX0b562b1d0c0dcd9eb2b4808a192bd99e`  
**Name**: `membership_expiration_reminder`  
**Category**: UTILITY  
**Language**: Spanish (es)

**Variables**:
- {{1}} → Nombre del cliente
- {{2}} → Nombre del plan
- {{3}} → Modalidad de pago
- {{4}} → Fecha de vencimiento

**Contenido**:
```
Hola {{1}}! 👋

Tu membresía en Muscle Up GYM vence pronto.
¡Renueva ahora y sigue entrenando sin interrupciones! 💪

📋 Detalles de tu membresía actual:
• Plan: {{2}}
• Modalidad: {{3}}
• Vence el: {{4}}

✅ Entrenamientos respaldados por ciencias del ejercicio
✅ Atención cercana, profesional y proactiva
✅ Ambiente de bienestar, orden y respeto
✅ Apoyo constante para mantener tu progreso

🕒 Horarios de entrenamiento:
Lunes a Viernes: 6:00 a.m. – 10:00 p.m.
Sábados: 9:00 a.m. – 5:00 p.m.
Domingos: Cerrado

📍 Ubicación:
Francisco I. Madero #708, Col. Lindavista
San Buenaventura, Coahuila, México

🌐 Más información: www.muscleupgym.fitness

📲 ¿Dudas o apoyo personalizado?
https://wa.me/528661127905

Gracias por confiar en nosotros.
Administración Muscle Up GYM
Tu salud y bienestar son nuestra misión.
```

---

### 3. ✅ Variables de Entorno
**Archivo**: `.env.local`

```env
TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID=HX0b562b1d0c0dcd9eb2b4808a192bd99e
```

---

## 🚀 FORMAS DE USO

### Opción 1: Desde Postman / Thunder Client

**Request**:
```
POST http://localhost:3000/api/send-expiration-reminders?daysBeforeExpiration=3
Content-Type: application/json

{}
```

**Con fecha específica**:
```json
{
  "targetDate": "2025-10-15"
}
```

---

### Opción 2: Desde Frontend (Botón en Historial)

Voy a crear un componente con botón que podrás agregar en tu página de historial de membresías.

---

## 📊 LÓGICA DE FUNCIONAMIENTO

### Cálculo de Fecha Objetivo:

1. **Sin targetDate**:
   ```
   Hoy: 2025-10-10
   daysBeforeExpiration: 3
   Fecha objetivo: 2025-10-13
   ```

2. **Con targetDate**:
   ```
   targetDate: "2025-10-15"
   Busca membresías que vencen el 2025-10-15
   ```

### Query a Base de Datos:

```sql
SELECT * FROM user_memberships
WHERE status = 'active'
  AND end_date = '2025-10-13'
  AND payment_type != 'visit'
ORDER BY end_date ASC;
```

### Proceso por Membresía:

```
1. Obtener usuario → Validar WhatsApp
2. Obtener plan → Validar datos
3. Formatear variables
4. Enviar WhatsApp vía Twilio
5. Registrar resultado (sent/failed/skipped)
6. Pausa de 300ms (evitar saturación)
7. Siguiente membresía
```

---

## 🧪 TESTING

### Test Manual:

1. **Crear membresía de prueba que venza en 3 días**:
   ```sql
   -- En Supabase SQL Editor
   UPDATE user_memberships
   SET end_date = CURRENT_DATE + INTERVAL '3 days'
   WHERE userid = 'ID_DE_USUARIO_PRUEBA'
     AND status = 'active';
   ```

2. **Ejecutar API**:
   ```bash
   curl -X POST "http://localhost:3000/api/send-expiration-reminders?daysBeforeExpiration=3" \
   -H "Content-Type: application/json" \
   -d '{}'
   ```

3. **Verificar**:
   - Console del servidor: Logs de envío
   - Twilio Logs: Status del mensaje
   - WhatsApp del cliente: Recepción del mensaje

---

### Test con Fecha Específica:

```bash
curl -X POST "http://localhost:3000/api/send-expiration-reminders" \
-H "Content-Type: application/json" \
-d '{
  "targetDate": "2025-10-13"
}'
```

---

## 📱 EJEMPLO DE MENSAJE ENVIADO

**Datos**:
- Cliente: Juan Pérez García
- Plan: Plan Premium
- Modalidad: Mensual
- Vence: 13 de octubre de 2025

**Mensaje**:
```
Hola Juan Pérez García! 👋

Tu membresía en Muscle Up GYM vence pronto.
¡Renueva ahora y sigue entrenando sin interrupciones! 💪

📋 Detalles de tu membresía actual:
• Plan: Plan Premium
• Modalidad: Mensual
• Vence el: 13 de octubre de 2025

✅ Entrenamientos respaldados por ciencias del ejercicio
✅ Atención cercana, profesional y proactiva
✅ Ambiente de bienestar, orden y respeto
✅ Apoyo constante para mantener tu progreso

🕒 Horarios de entrenamiento:
Lunes a Viernes: 6:00 a.m. – 10:00 p.m.
Sábados: 9:00 a.m. – 5:00 p.m.
Domingos: Cerrado

📍 Ubicación:
Francisco I. Madero #708, Col. Lindavista
San Buenaventura, Coahuila, México

🌐 Más información: www.muscleupgym.fitness

📲 ¿Dudas o apoyo personalizado?
https://wa.me/528661127905

Gracias por confiar en nosotros.
Administración Muscle Up GYM
Tu salud y bienestar son nuestra misión.
```

---

## 🔍 LOGS DE DEBUGGING

### Console del Servidor:

```
🚀 API send-expiration-reminders iniciada
📅 Buscando membresías que vencen el: 2025-10-13
⏰ Días de anticipación: 3
📊 Membresías encontradas: 7
📤 Enviando recordatorio a Juan Pérez (whatsapp:+528661234567)
✅ Recordatorio enviado: SMxxxxxxxx
📤 Enviando recordatorio a María García (whatsapp:+528661234568)
✅ Recordatorio enviado: SMxxxxxxxx
⚠️ Usuario Pedro López sin WhatsApp
📊 RESUMEN DE ENVÍO:
   ✅ Enviados: 5
   ❌ Fallidos: 0
   ⏭️ Omitidos: 2
   📊 Total: 7
```

---

## ⚙️ CONFIGURACIÓN DE CRON JOB (Opcional)

Si quieres automatizar el envío diario, puedes usar:

### Opción A: Vercel Cron Jobs

**Archivo**: `vercel.json`
```json
{
  "crons": [{
    "path": "/api/send-expiration-reminders?daysBeforeExpiration=3",
    "schedule": "0 9 * * *"
  }]
}
```

Esto ejecutará el endpoint todos los días a las 9:00 AM.

### Opción B: GitHub Actions

**Archivo**: `.github/workflows/send-reminders.yml`
```yaml
name: Send Expiration Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # 9 AM diario
  workflow_dispatch:      # Manual trigger
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send Reminders
        run: |
          curl -X POST "${{ secrets.APP_URL }}/api/send-expiration-reminders?daysBeforeExpiration=3"
```

---

## 🎨 COMPONENTE DE FRONTEND (Próximo paso)

Voy a crear un botón que puedes agregar en tu página de historial de membresías para enviar recordatorios manualmente.

**Características**:
- Selector de días de anticipación (1, 3, 5, 7)
- Selector de fecha específica
- Vista previa de cuántas membresías se enviarán
- Confirmación antes de enviar
- Progress bar durante envío
- Resumen de resultados

---

## 🆘 TROUBLESHOOTING

### Error: "No hay membresías próximas a vencer"
**Solución**: Verificar que existan membresías activas con end_date en la fecha calculada.

### Error: "Usuario sin WhatsApp"
**Solución**: Asegurarse de que los usuarios tengan el campo `whatsapp` lleno en la tabla Users.

### Error: Template 63030
**Solución**: Verificar que el template esté aprobado por Meta en Twilio Console.

### Algunos mensajes no se envían
**Solución**: Revisar `details` en la respuesta para ver qué falló específicamente.

---

## ✅ CAMPOS OPCIONALES EN BD

Si quieres rastrear qué membresías han recibido recordatorios:

```sql
ALTER TABLE user_memberships 
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN user_memberships.reminder_sent 
IS 'Indica si se envió recordatorio de vencimiento';

COMMENT ON COLUMN user_memberships.reminder_sent_at 
IS 'Fecha y hora del envío del recordatorio';
```

---

## 📊 ESTADÍSTICAS Y REPORTES

### Consulta: Membresías que vencen en los próximos X días

```sql
SELECT 
  um.id,
  u.firstName || ' ' || u.lastName as cliente,
  u.whatsapp,
  mp.name as plan,
  um.payment_type as modalidad,
  um.end_date as vence,
  um.reminder_sent,
  um.reminder_sent_at
FROM user_memberships um
JOIN "Users" u ON u.id = um.userid
JOIN membership_plans mp ON mp.id = um.plan_id
WHERE um.status = 'active'
  AND um.payment_type != 'visit'
  AND um.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY um.end_date ASC;
```

### Consulta: Tasa de envío de recordatorios

```sql
SELECT 
  DATE(end_date) as fecha_vencimiento,
  COUNT(*) as total_vencen,
  COUNT(*) FILTER (WHERE reminder_sent = true) as recordatorios_enviados,
  COUNT(*) FILTER (WHERE reminder_sent = false OR reminder_sent IS NULL) as sin_recordatorio,
  ROUND(100.0 * COUNT(*) FILTER (WHERE reminder_sent = true) / COUNT(*), 2) as porcentaje_envio
FROM user_memberships
WHERE end_date BETWEEN CURRENT_DATE - INTERVAL '30 days' AND CURRENT_DATE + INTERVAL '30 days'
  AND status = 'active'
  AND payment_type != 'visit'
GROUP BY DATE(end_date)
ORDER BY fecha_vencimiento ASC;
```

---

**Fecha de Implementación**: 10 de octubre de 2025  
**Status**: ✅ API COMPLETA - LISTO PARA USAR  
**Próximo paso**: Crear componente de frontend con botón para historial
