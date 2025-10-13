# 🔍 ANÁLISIS: Problema de Usuarios No Visibles + Sincronización F22

**Fecha:** 13 de Octubre de 2025  
**Problema Reportado:**
1. Template de huella SÍ se guardó en BD ✅
2. Mapping en device_user_mappings SÍ se creó ✅
3. Pero NO se sincronizó con dispositivo F22 ❌
4. Usuarios NO aparecen en la página de gestión ❌

---

## 🎯 PROBLEMA 1: Usuarios No Visibles en Página

### Causa Probable:

El problema está en el **selectQuery** de `useEntityCRUD` que usa relaciones de FK:

```typescript
selectQuery: `
  ...
  address: addresses!userId(*),
  emergency: emergency_contacts!userId(*),
  membership: membership_info!userId(*)
`
```

### Posibles Causas:

1. **Foreign Keys con nombres incorrectos**: Las FK pueden estar usando `userId` (camelCase) pero Supabase espera `user_id` (snake_case) o viceversa

2. **Políticas RLS bloqueando las relaciones**: Si `addresses`, `emergency_contacts` o `membership_info` tienen RLS activo pero sin políticas correctas, la query falla silenciosamente

3. **Query sin filtro inicial**: `useEntityCRUD` intenta cargar TODOS los usuarios sin filtrar por `rol='cliente'` primero

### ✅ Correcciones Aplicadas:

1. **Especificación explícita de FK en query:**
   ```typescript
   address: addresses!userId(*),
   emergency: emergency_contacts!userId(*),
   membership: membership_info!userId(*)
   ```

2. **Logs de debug agregados:**
   ```typescript
   console.log('🔄 [USUARIOS] Cargando clientes...');
   console.log('✅ [USUARIOS] Clientes cargados exitosamente');
   ```

3. **Panel de debug temporal:**
   ```tsx
   {process.env.NODE_ENV === 'development' && (
     <Paper>
       Total users raw: {users.length}
       Normalized users: {normalizedUsers.length}
       Client users: {clientUsers.length}
       ...
     </Paper>
   )}
   ```

4. **Error handler mejorado:**
   ```typescript
   onError: (errorMsg) => {
     console.error('❌ [USUARIOS] Error en useEntityCRUD:', errorMsg);
     toast.error(`Error cargando usuarios: ${errorMsg}`);
   }
   ```

---

## 🎯 PROBLEMA 2: Template Guardado pero NO Sincronizado con F22

### Logs Esperados vs Reales:

**✅ ESPERADO (flujo completo):**
```
🖐️ [PROCESS] Procesando huella pendiente...
💾 [PROCESS] Guardando huella en BD...
✅ [PROCESS] Huella guardada en BD
✅ [PROCESS] Mapping creado en device_user_mappings tabla
📤 [PROCESS] Datos para F22: { userName: 'Citlalli Rodriguez', device_user_id: 18 }
🔄 [F22-SYNC] Iniciando sincronización con F22...
✅ [F22-SYNC] WebSocket conectado
✅ [F22-SYNC] F22 conectado exitosamente
✅ [F22-SYNC] Template sincronizado exitosamente
```

**❌ REAL (según logs del usuario):**
```
✅ [PROCESS] Huella guardada en BD
✅ [PROCESS] Mapping creado en device_user_mappings tabla
📤 [PROCESS] Datos para F22: { userName: 'Citlalli Rodriguez', device_user_id: 18 }
🔄 [F22-SYNC] Iniciando sincronización con F22...
✅ [F22-SYNC] WebSocket conectado
⚠️ [PROCESS] Error F22: Timeout en conexión con F22 (15s) ❌ AQUÍ FALLÓ
```

### Análisis de Causa Raíz:

El WebSocket **SÍ se conecta** pero después **hace timeout**. Esto significa que:

1. ✅ ZK Access Agent está corriendo
2. ✅ WebSocket se conecta (puerto 8085 abierto)
3. ❌ Pero no recibe respuesta del dispositivo F22 en 30 segundos

### Posibles Causas del Timeout:

#### A) **Dispositivo F22 no conectado físicamente**
- El servicio ZK Access Agent está activo
- Pero el dispositivo biométrico F22 NO está conectado vía USB/Red
- Solución: Verificar conexión física del F22

#### B) **Mensaje `welcome` no incluye `deviceConnected: true`**
Revisando el código de `FingerprintRegistration.tsx`:

```typescript
case 'welcome':
  const isDeviceConnected = message.data?.deviceConnected === true;
  
  setDeviceConnected(isDeviceConnected);
  
  if (isDeviceConnected) {
    setWsError(null);
  } else {
    setWsError('Dispositivo ZKTeco no conectado al servidor'); // ⚠️ ESTE ERROR
  }
```

Si el servidor responde con `welcome` pero **sin** `deviceConnected: true`, entonces el flujo continúa pero **sin dispositivo activo**, causando el timeout.

#### C) **Timeout de 30s insuficiente para hardware lento**
Aunque incrementamos a 30s, puede no ser suficiente si:
- El dispositivo F22 está ocupado procesando otra operación
- Hay latencia de red (si F22 está conectado vía IP)
- El firmware del F22 está lento

---

## 🛠️ SOLUCIONES PROPUESTAS

### Solución 1: Verificar Estado del Dispositivo ANTES de Guardar

Modificar `useFingerprintManagement.ts` para **verificar conexión F22** antes de procesar:

```typescript
const processPendingFingerprint = useCallback(async (userName: string) => {
  // ... código existente ...
  
  // ✅ NUEVO: Verificar F22 antes de sincronizar
  console.log('🔍 [PROCESS] Verificando disponibilidad de F22...');
  
  const f22Available = await checkF22Connection(); // Nueva función
  
  if (!f22Available) {
    console.warn('⚠️ [PROCESS] F22 no disponible, guardando solo en BD...');
    setFingerprintState(prev => ({
      ...prev,
      status: 'saved',
      syncStatus: 'error',
      error: '⚠️ Guardado en BD. F22 no disponible para sincronización.',
      pendingData: null
    }));
    
    onFingerprintChange?.(true);
    return { success: true, warning: 'F22 no disponible' };
  }
  
  // ... continuar con sincronización F22 ...
}, [...]);
```

### Solución 2: Agregar Reintentos con Backoff Exponencial

```typescript
const syncFingerprintToF22Service = useCallback(async (
  templateData: any,
  wsUrl: string = 'ws://127.0.0.1:8085/ws/',
  retries: number = 3 // ✅ NUEVO PARÁMETRO
): Promise<...> => {
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 [F22-SYNC] Intento ${attempt}/${retries}...`);
      
      // ... lógica existente ...
      
      return result; // Si tiene éxito, salir
      
    } catch (error) {
      if (attempt < retries) {
        const delay = attempt * 5000; // 5s, 10s, 15s
        console.log(`⏳ [F22-SYNC] Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Último intento falló
      }
    }
  }
}, []);
```

### Solución 3: Modo "Sincronización Diferida"

Si F22 no está disponible, **guardar en cola** para sincronizar después:

```typescript
// Nueva tabla en Supabase
CREATE TABLE public.fingerprint_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_user_id integer NOT NULL,
  template_data jsonb NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'syncing', 'completed', 'failed'
  retry_count integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  synced_at timestamp
);

// Hook para procesar cola
const processSyncQueue = async () => {
  const { data: pending } = await supabase
    .from('fingerprint_sync_queue')
    .select('*')
    .eq('status', 'pending')
    .lt('retry_count', 3);
  
  for (const item of pending) {
    try {
      await syncFingerprintToF22Service(item.template_data);
      // Marcar como completado
    } catch {
      // Incrementar retry_count
    }
  }
};
```

---

## 📋 PASOS PARA DIAGNOSTICAR

### 1. Ejecutar SQL de Diagnóstico

En Supabase SQL Editor, ejecutar:

```bash
database/DIAGNOSTICO_USUARIOS_HUELLAS.sql
```

Esto revelará:
- ✅ Cuántos usuarios existen en total
- ✅ Cuántos tienen templates guardados
- ✅ Cuántos tienen mappings creados
- ✅ Si hay discrepancias entre templates y mappings
- ✅ Usuarios con template pero sin flag `fingerprint=true`

### 2. Verificar Logs del Navegador

Abrir DevTools Console y buscar:

```
🔄 [USUARIOS] Cargando clientes...
```

Si NO aparece, el problema está en `useEntityCRUD`.

Si aparece pero muestra `Total users raw: 0`, entonces:
- Problema con el query de Supabase
- Problema con políticas RLS
- Problema con foreign keys

### 3. Verificar Estado de ZK Access Agent

```powershell
# Ver si el servicio está activo
netstat -ano | findstr :8085

# Si aparece, significa que está escuchando
# Verificar logs del servicio para ver mensajes de error
```

### 4. Verificar Conexión Física F22

- Abrir la interfaz del ZK Access Agent
- Buscar sección "Dispositivos Conectados"
- Debe mostrar: **F22_001 - Conectado ✅**
- Si muestra: **F22_001 - Desconectado ❌**, entonces el problema es físico/driver

---

## 🎯 RESUMEN DE ARCHIVOS MODIFICADOS

| Archivo | Cambio | Propósito |
|---------|--------|-----------|
| `page.tsx` (usuarios) | Agregado `!userId` en FK | Especificar relación correcta |
| `page.tsx` (usuarios) | Logs de debug | Ver qué datos se cargan |
| `page.tsx` (usuarios) | Panel debug temporal | Mostrar info en UI |
| `page.tsx` (usuarios) | Error handler | Capturar errores silenciosos |
| `DIAGNOSTICO_USUARIOS_HUELLAS.sql` | Creado | Script SQL para analizar BD |

---

## ✅ PRÓXIMOS PASOS RECOMENDADOS

1. **Reiniciar servidor Next.js**
   ```powershell
   npm run dev
   ```

2. **Abrir página de usuarios y revisar panel de debug**
   - Ir a: `http://localhost:3000/dashboard/admin/usuarios`
   - Ver panel amarillo de debug
   - Compartir los valores mostrados

3. **Ejecutar SQL de diagnóstico**
   - Abrir Supabase Dashboard → SQL Editor
   - Ejecutar `DIAGNOSTICO_USUARIOS_HUELLAS.sql`
   - Revisar resultados de cada query

4. **Verificar ZK Access Agent**
   - Abrir la app del servicio
   - Verificar que F22 esté conectado
   - Si no está, reconectar dispositivo USB

5. **Si usuarios aparecen PERO sin datos de huella:**
   - Ejecutar reparación SQL (descomentar en el script)
   - Actualizar flag `fingerprint=true` manualmente

---

**Estado Actual:** 🟡 Parcial  
- ✅ Template guardado en BD  
- ✅ Mapping creado  
- ❌ Sincronización F22 fallando  
- ❌ Usuarios no visibles en UI  

**Siguiente Acción:** Revisar panel de debug y ejecutar SQL de diagnóstico
