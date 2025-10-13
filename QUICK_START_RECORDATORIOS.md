# ⚡ QUICK START: Sistema de Recordatorios

## 🚀 Paso 1: Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# Ya las tienes (verificar):
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=+14155238886

# NUEVA - Template de recordatorio de vencimiento:
TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID=HX0b562b1d0c0dcd9eb2b4808a192bd99e

# Ya las tienes (verificar):
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NUEVA - Para CRON automático (opcional pero recomendado):
CRON_SECRET=tu_secreto_super_seguro_aqui_123456
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

---

## 🧪 Paso 2: Testing Local (Opción Manual)

1. **Reinicia el servidor de desarrollo:**
```powershell
# Detén npm run dev (Ctrl+C) y reinicia
npm run dev
```

2. **Abre tu aplicación:**
   - Ve a: `http://localhost:3000/dashboard/admin/membresias/historial`

3. **Verifica el botón:**
   - Deberías ver un botón amarillo: **"Próximos a Vencer (3 días)"**
   - Está ubicado junto al botón "Actualizar"

4. **Prueba el flujo:**
   - Click en el botón → Se abre un dialog
   - Verás la lista de usuarios cuyas membresías vencen en 3 días
   - Click en **"Enviar Recordatorios"** → Se envían los WhatsApp
   - Verás resultados detallados (enviados/fallidos/omitidos)

---

## 🌐 Paso 3: Deploy a Producción (Para CRON Automático)

### 3.1 Commit y Push

```powershell
git add .
git commit -m "feat: Add membership expiration reminder system (manual + auto CRON)"
git push origin main
```

### 3.2 Configurar Variables en Vercel

1. **Ve a Vercel Dashboard:**
   - https://vercel.com/[tu-usuario]/[tu-proyecto]

2. **Settings → Environment Variables**

3. **Agrega estas variables:**
   - `TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID` = `HX0b562b1d0c0dcd9eb2b4808a192bd99e`
   - `CRON_SECRET` = `tu_secreto_super_seguro_aqui_123456`
   - `NEXT_PUBLIC_APP_URL` = `https://tu-app.vercel.app`

4. **Guarda los cambios**

### 3.3 Redeploy

```powershell
# Si no se desplegó automáticamente:
vercel --prod
```

### 3.4 Verificar el CRON

1. **Ve a tu proyecto en Vercel Dashboard**
2. **Cron Jobs** (en el menú lateral)
3. Deberías ver:
   - **Path**: `/api/cron/send-membership-reminders`
   - **Schedule**: `0 15 * * *` (Diario a las 9 AM hora de México) ✅
   - **Status**: `Active`

---

## 📊 Paso 4: Monitoreo

### Ver Logs del CRON (Vercel)

1. **Vercel Dashboard → Tu Proyecto → Logs**
2. **Filtra por**: `/api/cron/send-membership-reminders`
3. Verás logs como:
```
🕒 [CRON] Iniciando envío automático de recordatorios...
✅ [CRON] Recordatorios enviados exitosamente: { sent: 5, failed: 0, skipped: 2 }
```

### Ver Mensajes Enviados (Twilio)

1. **Twilio Console**: https://console.twilio.com/
2. **Monitor → Logs → Messaging**
3. **Filtra por ContentSid**: `HX0b562b1d0c0dcd9eb2b4808a192bd99e`

---

## ⏰ Paso 5: Ajustar Horario del CRON (Opcional)

El CRON está configurado para **9:00 AM UTC** (3:00 AM México).

Para cambiar a **9:00 AM hora de México** (15:00 UTC):

**Edita `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/send-membership-reminders",
      "schedule": "0 15 * * *"  // ← Cambia de "0 9" a "0 15"
    }
  ]
}
```

**Commit y redeploy:**
```powershell
git add vercel.json
git commit -m "chore: Change CRON schedule to 9 AM Mexico time"
git push origin main
```

---

## 🎯 ¿Qué Tienes Ahora?

### ✅ Opción 1: Manual (Botón en UI)
- Ubicación: `/dashboard/admin/membresias/historial`
- Botón: **"Próximos a Vencer (3 días)"**
- Funcionalidad:
  1. Click → Abre dialog con lista de usuarios
  2. Muestra: Nombre, plan, fecha de vencimiento, WhatsApp
  3. Click "Enviar Recordatorios" → Envía mensajes
  4. Muestra resultados detallados

### ✅ Opción 2: Automático (CRON Job)
- Ejecuta: **Diario a las 9:00 AM UTC** (ajustable)
- Envía: A todos los usuarios con membresías que vencen en 3 días
- Logs: Disponibles en Vercel Dashboard
- Sin intervención humana necesaria

---

## 🧪 Testing Rápido

### Test 1: Ver Usuarios (Sin Enviar)

```powershell
# Ver qué usuarios recibirán recordatorio mañana
curl "http://localhost:3000/api/user-memberships?status=active&end_date=2025-10-13&exclude_payment_type=visit"
```

### Test 2: Enviar Recordatorios (Local)

```powershell
# PowerShell
$body = @{} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/send-expiration-reminders?daysBeforeExpiration=3" -Method POST -Body $body -ContentType "application/json"
```

### Test 3: Verificar CRON (Producción)

```powershell
# PowerShell (reemplaza con tus valores)
$headers = @{ "Authorization" = "Bearer tu_secreto_super_seguro_aqui_123456" }
Invoke-RestMethod -Uri "https://tu-app.vercel.app/api/cron/send-membership-reminders" -Headers $headers
```

---

## 🆘 Troubleshooting

### ❌ "No veo el botón en la UI"

**Solución:**
```powershell
# 1. Limpia la caché
Remove-Item -Recurse -Force .next

# 2. Reinstala dependencias
npm install

# 3. Reinicia el servidor
npm run dev
```

### ❌ "Error: Template not found"

**Solución:**
1. Verifica que `TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID` esté en `.env.local`
2. Verifica que el valor sea: `HX0b562b1d0c0dcd9eb2b4808a192bd99e`
3. Reinicia el servidor

### ❌ "El CRON no se ejecuta"

**Posibles causas:**
1. **No está en producción** - El CRON solo funciona en Vercel deployments
2. **Variables no configuradas** - Revisa Environment Variables en Vercel
3. **Schedule incorrecto** - Verifica la sintaxis en `vercel.json`

**Solución:**
```powershell
# Forzar ejecución manual para testear
$headers = @{ "Authorization" = "Bearer tu_secreto" }
Invoke-RestMethod -Uri "https://tu-app.vercel.app/api/cron/send-membership-reminders" -Headers $headers
```

### ❌ "Los mensajes no llegan"

**Checklist:**
1. ✅ Usuario tiene WhatsApp registrado en la BD
2. ✅ Formato correcto: `+52XXXXXXXXXX` (10 dígitos)
3. ✅ Template aprobado en Twilio (categoría UTILITY)
4. ✅ Balance suficiente en Twilio
5. ✅ Verifica logs en Twilio Console

---

## 📚 Más Información

- **Guía Completa**: `GUIA_COMPLETA_RECORDATORIOS.md`
- **Documentación Técnica**: `SISTEMA_RECORDATORIOS_MASIVOS.md`

---

## 🎉 ¡Todo Listo!

Tu sistema de recordatorios está configurado y listo para usar. Tienes:

1. ✅ **Botón manual** en el historial de membresías
2. ✅ **CRON automático** que ejecuta diariamente
3. ✅ **Monitoring** completo en Vercel y Twilio
4. ✅ **Logs detallados** para troubleshooting

**Siguiente paso recomendado:**  
Testea el botón manual primero antes de confiar en el CRON automático.
