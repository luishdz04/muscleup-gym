# 📊 RESUMEN DE VARIABLES DE ENTORNO

## ✅ TOTAL: 19 VARIABLES

---

## 🔑 GRUPO 1: SUPABASE (OBLIGATORIO - 3 variables)

| Variable | Descripción | Vercel | Local |
|----------|-------------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | ✅ Sí | ✅ Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Key pública para auth y queries | ✅ Sí | ✅ Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Key privada para operaciones admin | ✅ Sí | ✅ Sí |

**Sin estas 3, la app NO funciona** ❌

---

## 🏢 GRUPO 2: BUSINESS LOGIC (OBLIGATORIO - 1 variable)

| Variable | Descripción | Vercel | Local |
|----------|-------------|--------|-------|
| `NEXT_PUBLIC_DEFAULT_WAREHOUSE_ID` | ID del almacén por defecto | ✅ Sí | ✅ Sí |

---

## 📧 GRUPO 3: EMAIL HOSTINGER (OPCIONAL - 4 variables)

| Variable | Descripción | Vercel | Local |
|----------|-------------|--------|-------|
| `EMAIL_USER` | Usuario SMTP Hostinger | ⚠️ Opcional | ✅ Sí |
| `EMAIL_PASSWORD` | Password SMTP | ⚠️ Opcional | ✅ Sí |
| `EMAIL_HOST` | Host SMTP (smtp.hostinger.com) | ⚠️ Opcional | ✅ Sí |
| `EMAIL_PORT` | Puerto SMTP (465) | ⚠️ Opcional | ✅ Sí |

**Función:** Envío de emails de bienvenida, recordatorios, contratos
**Si no están:** La app funciona, pero no envía emails

---

## 📬 GRUPO 4: RESEND EMAIL (OPCIONAL - 1 variable)

| Variable | Descripción | Vercel | Local |
|----------|-------------|--------|-------|
| `RESEND_API_KEY` | API Key de Resend (email moderno) | ⚠️ Opcional | ✅ Sí |

**Función:** Sistema de email alternativo (más confiable que SMTP en cloud)
**Recomendación:** Usar este en producción en lugar de Hostinger SMTP

---

## 💬 GRUPO 5: TWILIO WHATSAPP (OPCIONAL - 7 variables)

| Variable | Descripción | Vercel | Local |
|----------|-------------|--------|-------|
| `TWILIO_ACCOUNT_SID` | Account SID de Twilio | ⚠️ Opcional | ✅ Sí |
| `TWILIO_AUTH_TOKEN` | Auth token de Twilio | ⚠️ Opcional | ✅ Sí |
| `TWILIO_WHATSAPP_NUMBER` | Número WhatsApp (formato: whatsapp:+52...) | ⚠️ Opcional | ✅ Sí |
| `TWILIO_TEMPLATE_ID` | Template general | ⚠️ Opcional | ✅ Sí |
| `TWILIO_MEMBERSHIP_NEW_TEMPLATE_ID` | Template nueva membresía | ⚠️ Opcional | ✅ Sí |
| `TWILIO_MEMBERSHIP_RENEWAL_TEMPLATE_ID` | Template renovación | ⚠️ Opcional | ✅ Sí |
| `TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID` | Template recordatorio vencimiento | ⚠️ Opcional | ✅ Sí |

**Función:** Notificaciones automáticas por WhatsApp
**Si no están:** La app funciona, pero no envía WhatsApps

---

## 🔒 GRUPO 6: SEGURIDAD (OPCIONAL - 1 variable)

| Variable | Descripción | Vercel | Local |
|----------|-------------|--------|-------|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (anti-bot) | ⚠️ Opcional | ✅ Sí |

**Función:** Protección anti-bots en formularios
**Si no está:** Los formularios funcionan sin protección

---

## 🖐️ GRUPO 7: BIOMÉTRICOS (SOLO LOCAL - 1 variable)

| Variable | Descripción | Vercel | Local |
|----------|-------------|--------|-------|
| `NEXT_PUBLIC_F22_WEBSOCKET_URL` | URL del access-agent WebSocket | ❌ NO | ✅ Sí |

**Por qué NO va a Vercel:**
- Es una IP de red local (ej: `ws://192.168.1.100:8085/ws/`)
- Vercel corre en la nube, no puede acceder a redes locales
- Los dispositivos biométricos solo funcionan en desarrollo local

---

## 🧪 GRUPO 8: TESTING (OPCIONAL - 1 variable)

| Variable | Descripción | Vercel | Local |
|----------|-------------|--------|-------|
| `RUN_DEVICE_TESTS` | Habilitar tests de dispositivos | ⚠️ false | ✅ true |

**Recomendación:** `false` en producción

---

## 📈 RESUMEN POR PRIORIDAD

### 🔴 CRÍTICAS (4 variables)
**Sin estas NO funciona:**
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXT_PUBLIC_DEFAULT_WAREHOUSE_ID`

### 🟡 IMPORTANTES (12 variables)
**Funcionalidades específicas:**
- 4 variables de Email (Hostinger SMTP)
- 1 variable de Resend
- 7 variables de Twilio WhatsApp

### 🟢 OPCIONALES (3 variables)
**Nice to have:**
- 1 variable de Turnstile (seguridad)
- 1 variable de Testing
- 1 variable de Biométricos (solo local)

---

## 🚀 PARA VERCEL: 18 VARIABLES

**Agregar a Vercel:**
- ✅ 4 variables CRÍTICAS
- ✅ 12 variables IMPORTANTES (si quieres esas funcionalidades)
- ✅ 1 variable de Turnstile (opcional)
- ✅ 1 variable de Testing (dejar en `false`)

**NO agregar a Vercel:**
- ❌ `NEXT_PUBLIC_F22_WEBSOCKET_URL` (IP local, no funciona en cloud)

---

## 💾 PARA DESARROLLO LOCAL: 19 VARIABLES

**En tu `.env.local`:**
- ✅ TODAS las 19 variables
- ✅ Incluye `NEXT_PUBLIC_F22_WEBSOCKET_URL` con la IP de tu gimnasio

---

## 🎯 QUICK START

### Para deploy rápido a Vercel:
1. Abre [QUICK_VERCEL_SETUP.md](QUICK_VERCEL_SETUP.md)
2. Copia y pega las variables (grupos 1-4)
3. Haz redeploy

### Para setup completo:
1. Lee [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md)
2. Sigue el checklist paso a paso
3. Verifica troubleshooting si hay errores

---

✅ **Actualizado:** Se removió `DATABASE_URL` (no se usa, solo Supabase directo)
