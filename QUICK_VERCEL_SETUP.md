# ⚡ SETUP RÁPIDO PARA VERCEL

## 🎯 SOLO COPIA Y PEGA ESTAS VARIABLES

Ve a: **Vercel → Settings → Environment Variables** y agrega:

---

### ✅ GRUPO 1: SUPABASE & AUTH (OBLIGATORIO)

**⚠️ IMPORTANTE:** Obtén estos valores de tu archivo `.env.local` (no los incluyo aquí por seguridad)

```
NEXT_PUBLIC_SUPABASE_URL
[Tu URL de Supabase - https://tu-proyecto.supabase.co]
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
[Tu Supabase Anon Key - JWT token largo]
```

```
SUPABASE_SERVICE_ROLE_KEY
[Tu Supabase Service Role Key - JWT token largo]
```

```
NEXT_PUBLIC_DEFAULT_WAREHOUSE_ID
[Tu Warehouse UUID]
```

---

### ✅ GRUPO 2: EMAIL (OPCIONAL PERO RECOMENDADO)

**⚠️ IMPORTANTE:** Obtén estos valores de tu archivo `.env.local`

```
EMAIL_USER
[Tu email de Hostinger]
```

```
EMAIL_PASSWORD
[Tu password de email]
```

```
EMAIL_HOST
smtp.hostinger.com
```

```
EMAIL_PORT
465
```

```
RESEND_API_KEY
[Tu Resend API Key - empieza con re_]
```

---

### ✅ GRUPO 3: WHATSAPP (OPCIONAL)

**⚠️ IMPORTANTE:** Obtén estos valores de tu archivo `.env.local` (no los incluyo aquí por seguridad)

```
TWILIO_ACCOUNT_SID
[Tu Twilio Account SID - empieza con AC...]
```

```
TWILIO_AUTH_TOKEN
[Tu Twilio Auth Token]
```

```
TWILIO_WHATSAPP_NUMBER
whatsapp:+52[tu-numero]
```

```
TWILIO_TEMPLATE_ID
[Tu Template ID - empieza con HX...]
```

```
TWILIO_MEMBERSHIP_NEW_TEMPLATE_ID
[Tu Template ID - empieza con HX...]
```

```
TWILIO_MEMBERSHIP_RENEWAL_TEMPLATE_ID
[Tu Template ID - empieza con HX...]
```

```
TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID
[Tu Template ID - empieza con HX...]
```

---

### ✅ GRUPO 4: SEGURIDAD (OPCIONAL)

```
TURNSTILE_SECRET_KEY
[Tu Cloudflare Turnstile Secret Key]
```

---

## 🚀 DESPUÉS DE AGREGAR LAS VARIABLES

1. **Redeploy** tu proyecto en Vercel
2. Espera que termine el deploy (2-3 minutos)
3. Abre tu sitio y prueba el login

---

## ❌ NO AGREGUES ESTA VARIABLE

```
# ❌ NO USAR EN VERCEL (solo local)
NEXT_PUBLIC_F22_WEBSOCKET_URL=ws://192.168.1.100:8085/ws/
```

**Razón:** Es una IP local que Vercel no puede alcanzar desde la nube.

---

## 📝 CHECKLIST

- [ ] Agregué las 4 variables del GRUPO 1 (Supabase - obligatorias)
- [ ] Agregué las 5 variables del GRUPO 2 (Email - opcionales)
- [ ] Agregué las 7 variables del GRUPO 3 (WhatsApp - opcionales)
- [ ] Agregué la variable del GRUPO 4 (Turnstile - opcional)
- [ ] Hice redeploy después de agregar variables
- [ ] Probé que el login funcione
- [ ] Probé que puedo crear usuarios

---

✅ ¡Listo! Tu app está en producción.
