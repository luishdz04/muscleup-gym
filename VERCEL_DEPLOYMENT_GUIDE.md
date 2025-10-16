# 🚀 GUÍA DE DEPLOYMENT A VERCEL - MuscleUp Gym

## 📋 VARIABLES DE ENTORNO PARA VERCEL

Todas estas variables deben agregarse en: **Vercel Dashboard → Tu Proyecto → Settings → Environment Variables**

---

## ✅ VARIABLES OBLIGATORIAS (SIN ESTAS NO FUNCIONA)

### 1. Supabase (Auth, Database, Storage)

**⚠️ Obtén estos valores de tu archivo `.env.local` local:**

```bash
NEXT_PUBLIC_SUPABASE_URL=[Tu URL de Supabase]

NEXT_PUBLIC_SUPABASE_ANON_KEY=[Tu Supabase Anon Key]

SUPABASE_SERVICE_ROLE_KEY=[Tu Supabase Service Role Key]
```

**Por qué son necesarias:**
- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Key pública para autenticación y queries desde el cliente
- `SUPABASE_SERVICE_ROLE_KEY`: Key privada para operaciones administrativas del servidor

---

### 2. Business Logic
```bash
NEXT_PUBLIC_DEFAULT_WAREHOUSE_ID=[Tu Warehouse UUID desde .env.local]
```

**Por qué es necesaria:**
- Tu sistema de inventario/almacén necesita este ID

---

## ⚠️ VARIABLES OPCIONALES (Funcionalidades específicas)

### 3. Email (Hostinger)

**⚠️ Obtén estos valores de tu `.env.local`:**

```bash
EMAIL_USER=[Tu email]
EMAIL_PASSWORD=[Tu password]
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
```

**Función:** Envío de emails de bienvenida, recordatorios, contratos
**Si no las agregas:** No se enviarán emails, pero la app seguirá funcionando

---

### 4. Resend (Email alternativo)
```bash
RESEND_API_KEY=[Tu Resend API Key desde .env.local]
```

**Función:** Sistema de email alternativo (más moderno que SMTP)
**Si no la agregas:** Usa el sistema SMTP de arriba

---

### 5. Twilio (WhatsApp)

**⚠️ Obtén estos valores de tu `.env.local`:**

```bash
TWILIO_ACCOUNT_SID=[Tu Account SID]
TWILIO_AUTH_TOKEN=[Tu Auth Token]
TWILIO_WHATSAPP_NUMBER=[Tu número WhatsApp]
TWILIO_TEMPLATE_ID=[Tu Template ID]
TWILIO_MEMBERSHIP_NEW_TEMPLATE_ID=[Tu Template ID]
TWILIO_MEMBERSHIP_RENEWAL_TEMPLATE_ID=[Tu Template ID]
TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID=[Tu Template ID]
```

**Función:** Notificaciones por WhatsApp (bienvenida, renovaciones, vencimientos)
**Si no las agregas:** No se enviarán WhatsApps, pero la app funcionará normal

---

### 6. Cloudflare Turnstile (Anti-bot)
```bash
TURNSTILE_SECRET_KEY=[Tu Turnstile Secret desde .env.local]
```

**Función:** Protección contra bots en formularios de registro/login
**Si no la agregas:** Los formularios funcionan, pero sin protección anti-bot

---

### 7. Testing
```bash
RUN_DEVICE_TESTS=true
```

**Función:** Habilitar tests de dispositivos biométricos
**Recomendación:** Dejar en `false` para producción

---

## ❌ VARIABLES QUE **NO** DEBES AGREGAR A VERCEL

### Biometric WebSocket
```bash
# ❌ NO AGREGAR ESTA:
NEXT_PUBLIC_F22_WEBSOCKET_URL=ws://192.168.1.100:8085/ws/
```

**Por qué NO:**
- Esta es una **IP de red local** (`192.168.1.100`)
- Vercel corre en **servidores en la nube**, no puede conectarse a dispositivos físicos en tu gimnasio
- Los dispositivos biométricos solo funcionan en **desarrollo local**

**Solución para producción:**
1. **Opción A (Recomendada):** Usa la app en modo local en el gimnasio para funciones biométricas
2. **Opción B:** Deploy en un VPS con IP pública (DigitalOcean, AWS EC2, etc.)
3. **Opción C:** Deshabilita las funciones biométricas en producción

---

## 🔧 CÓMO AGREGAR VARIABLES EN VERCEL

### Método 1: Por la Web (Recomendado)

1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto **muscleup-gym**
3. Haz clic en **Settings**
4. Ve a **Environment Variables**
5. Agrega cada variable:
   - **Key:** Nombre de la variable (ej: `DATABASE_URL`)
   - **Value:** Valor de la variable
   - **Environment:** Selecciona `Production`, `Preview`, y `Development` (las 3)
6. Haz clic en **Save**
7. Repite para todas las variables

---

### Método 2: Por CLI (Avanzado)

```bash
# Instalar Vercel CLI si no la tienes
npm i -g vercel

# Login
vercel login

# Agregar variables (ejemplo)
vercel env add DATABASE_URL production
# Luego pega el valor cuando te lo pida

# O desde archivo
vercel env pull .env.production
```

---

## 🚀 PASOS PARA DEPLOY COMPLETO

### 1. Preparación local
```bash
# Asegurarte que todo funciona localmente
npm run build
npm start

# Si todo funciona, continúa
```

### 2. Commit y push a GitHub
```bash
git add .
git commit -m "feat: Configuración de variables de entorno para Vercel"
git push origin main
```

### 3. Agregar variables en Vercel
- Sigue la sección "Cómo agregar variables en Vercel" arriba
- Agrega TODAS las variables obligatorias
- Agrega las opcionales que necesites

### 4. Deploy
- Vercel hace auto-deploy cuando haces push a `main`
- O manualmente:
  ```bash
  vercel --prod
  ```

### 5. Verificación
1. Abre tu sitio en producción: `https://tu-dominio.vercel.app`
2. Prueba el login
3. Prueba crear un usuario
4. Verifica que no haya errores en los logs de Vercel

---

## 📊 CHECKLIST DE VARIABLES

Copia esto y marca lo que ya agregaste:

**Obligatorias:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_DEFAULT_WAREHOUSE_ID`

**Opcionales (Email):**
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASSWORD`
- [ ] `EMAIL_HOST`
- [ ] `EMAIL_PORT`
- [ ] `RESEND_API_KEY`

**Opcionales (WhatsApp):**
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_WHATSAPP_NUMBER`
- [ ] `TWILIO_TEMPLATE_ID`
- [ ] `TWILIO_MEMBERSHIP_NEW_TEMPLATE_ID`
- [ ] `TWILIO_MEMBERSHIP_RENEWAL_TEMPLATE_ID`
- [ ] `TWILIO_EXPIRATION_REMINDER_TEMPLATE_ID`

**Opcionales (Seguridad):**
- [ ] `TURNSTILE_SECRET_KEY`

**Testing:**
- [ ] `RUN_DEVICE_TESTS` (dejar en `false` para producción)

---

## ⚠️ NOTAS IMPORTANTES

### 1. Seguridad de credenciales
- **NUNCA** hagas commit del archivo `.env` o `.env.local` a Git
- Asegúrate que `.gitignore` incluya:
  ```
  .env
  .env.local
  .env*.local
  ```

### 2. Diferencia entre archivos

| Archivo | Uso | Se hace commit? |
|---------|-----|----------------|
| `.env` | Plantilla con todas las variables | ❌ NO |
| `.env.local` | Desarrollo local (sobrescribe .env) | ❌ NO |
| `.env.example` | Ejemplo sin valores reales | ✅ SÍ |

### 3. Variables públicas vs privadas

**Variables públicas** (empiezan con `NEXT_PUBLIC_`):
- Se exponen al navegador
- Ejemplo: `NEXT_PUBLIC_SUPABASE_URL`
- Son visibles en el código del cliente

**Variables privadas** (sin prefijo):
- Solo disponibles en el servidor
- Ejemplo: `SUPABASE_SERVICE_ROLE_KEY`
- Nunca se exponen al navegador

### 4. Cambios en variables
- Si cambias una variable en Vercel, debes hacer **Redeploy** para que tome efecto
- Vercel → Deployments → Click en los 3 puntos → Redeploy

---

## 🆘 TROUBLESHOOTING

### Error: "Database connection failed"
**Causa:** Faltan las variables de Supabase o están mal configuradas
**Solución:** Verifica que `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` estén correctas en Vercel

### Error: "Supabase client error"
**Causa:** Faltan las keys de Supabase
**Solución:** Agrega `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Error: "SMTP connection timeout"
**Causa:** Variables de email incorrectas o Hostinger bloqueando Vercel
**Solución:**
1. Verifica `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`
2. Considera usar `RESEND_API_KEY` en su lugar (más confiable en cloud)

### Los emails no se envían
**Causa:** SMTP de Hostinger puede bloquear IPs de Vercel
**Solución:** Usa Resend en lugar de SMTP para producción

---

## 📞 SOPORTE

Si tienes problemas con el deployment:

1. **Logs de Vercel:**
   - Vercel Dashboard → Tu Proyecto → Deployments → Click en el deployment → Functions logs

2. **Variables de entorno:**
   - Vercel Dashboard → Settings → Environment Variables
   - Verifica que todas estén correctas

3. **Build logs:**
   - Si falla el build, revisa los logs de compilación
   - Usualmente son errores de TypeScript o dependencias faltantes

---

✅ **¡Listo para deploy!** Sigue esta guía paso a paso y tu app estará en producción sin problemas.
