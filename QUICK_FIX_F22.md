# 🚀 GUÍA RÁPIDA - CORRECCIÓN SINCRONIZACIÓN F22

## ⚡ Pasos de Implementación (5 minutos)

### 1️⃣ Verificar API Route (Ya creado)
```bash
# Verificar que existe el archivo:
ls src/app/api/biometric/get-next-device-id/route.ts
```

✅ **Estado:** Archivo creado automáticamente

---

### 2️⃣ Aplicar Políticas RLS en Supabase

**Ir a:** Supabase Dashboard → SQL Editor

**Ejecutar:** `database/BIOMETRIC_RLS_POLICIES.sql`

```sql
-- Copiar y pegar todo el contenido del archivo
-- O ejecutar línea por línea las secciones 1 y 2
ALTER TABLE public.fingerprint_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_user_mappings ENABLE ROW LEVEL SECURITY;
-- ... (resto de políticas)
```

---

### 3️⃣ Reiniciar Servidor de Desarrollo

```powershell
# Detener servidor (Ctrl+C en terminal)
# Reiniciar servidor
npm run dev
```

---

### 4️⃣ Verificar ZK Access Agent

**Verificar que esté corriendo:**
```powershell
# Verificar servicio en segundo plano
netstat -ano | findstr :8085
```

**Si no está activo:**
- Iniciar el servicio ZK Access Agent
- Verificar que dispositivo F22 esté conectado

---

### 5️⃣ Probar Flujo Completo

1. **Abrir aplicación:** `http://localhost:3000`
2. **Ir a:** Dashboard → Usuarios
3. **Seleccionar usuario** o crear uno nuevo
4. **Click en:** "🖐️ Huella" o "Agregar Huella"
5. **Realizar captura:** 3 lecturas
6. **Verificar logs en consola:**

```
✅ Captura 1/3 exitosa - Calidad: 98%
✅ Captura 2/3 exitosa - Calidad: 98%
✅ Captura 3/3 exitosa - Calidad: 98%
✅ Siguiente ID secuencial: X
✅ Template guardado en BD
✅ Mapping creado en device_user_mappings
✅ WebSocket conectado (timeout: 30s)
✅ F22 conectado exitosamente
✅ Template sincronizado en dispositivo F22
```

---

## 🔍 Checklist de Verificación

- [ ] ✅ API Route responde correctamente
- [ ] ✅ No hay error 404 en `/api/biometric/get-next-device-id`
- [ ] ✅ No hay error 406 en `device_user_mappings`
- [ ] ✅ Timeout es de 30 segundos
- [ ] ✅ WebSocket mantiene conexión (sin código 1006)
- [ ] ✅ Logs muestran: "F22 conectado exitosamente"
- [ ] ✅ Logs muestran: "Template sincronizado exitosamente"
- [ ] ✅ Usuario aparece en dispositivo F22

---

## ❌ Troubleshooting Rápido

### Problema: API 404
```bash
# Verificar estructura de carpetas
ls src/app/api/biometric/get-next-device-id/
# Debe contener: route.ts
```

### Problema: Error 406 persiste
```sql
-- En Supabase SQL Editor, verificar RLS:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('fingerprint_templates', 'device_user_mappings');
```

### Problema: Timeout F22
```javascript
// Verificar en useFingerprintManagement.ts línea ~58:
const WS_TIMEOUT = 30000; // Debe ser 30000
```

### Problema: WebSocket código 1006
- Verificar que ZK Access Agent esté corriendo
- Reiniciar ZK Access Agent
- Verificar conexión del dispositivo F22

---

## 📞 Comandos Útiles

```powershell
# Ver logs en tiempo real
npm run dev | Select-String "F22-SYNC"

# Verificar puerto WebSocket
Test-NetConnection -ComputerName localhost -Port 8085

# Ver procesos de Node
Get-Process node
```

---

## 🎯 Resultado Esperado

Al completar una captura exitosa, debes ver en la consola del navegador:

```
🚀 Iniciando captura 1/3
✅ Captura 1/3 exitosa - Calidad: 98%
🚀 Iniciando captura 2/3
✅ Captura 2/3 exitosa - Calidad: 98%
🚀 Iniciando captura 3/3
✅ Captura 3/3 exitosa - Calidad: 98%
🔢 Device User ID secuencial asignado: 18
💾 [DB-SAVE] Huella guardada exitosamente
📍 [MAPPING] Mapping creado exitosamente
🔄 [F22-SYNC] Iniciando sincronización con F22...
✅ [F22-SYNC] WebSocket conectado
✅ [F22-SYNC] F22 conectado exitosamente
✅ [F22-SYNC] Template sincronizado exitosamente
```

---

**Tiempo estimado:** 5 minutos  
**Dificultad:** Fácil  
**Requiere reinicio:** Sí (servidor dev)
