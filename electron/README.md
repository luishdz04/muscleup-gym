# Electron App - MuscleUp Gym Admin

Esta carpeta contiene los archivos del proceso principal de Electron para la aplicación de escritorio.

## Archivos

- **main.js** - Proceso principal de Electron
  - Crea y maneja la ventana de la aplicación
  - Configura menú personalizado
  - Handlers IPC para comunicación con renderer
  - Configuración de seguridad (context isolation, etc.)

- **preload.js** - Script de preload
  - Context bridge para exponer APIs al renderer
  - Comunicación segura entre procesos
  - Expone `window.electron` al navegador

- **entitlements.mac.plist** - Permisos para macOS
  - Requerido para firma de código en macOS
  - Define permisos de la app (network, JIT, etc.)

- **assets/** - Recursos de la aplicación
  - Iconos de la app (Windows, macOS, Linux)
  - Ver `assets/README.md` para generar iconos

## Modo Desarrollo

El script `electron:dev` en package.json ejecuta:
1. Next.js dev server en puerto 3000
2. Electron en modo desarrollo apuntando a localhost:3000

## Modo Producción

El proceso de build genera ejecutables para:
- Windows (NSIS + Portable)
- macOS (DMG + ZIP)
- Linux (AppImage + deb + rpm)

Los archivos empaquetados se crean en `/dist/`

## Variables de Entorno

Electron lee las mismas variables de `.env.local` que Next.js automáticamente.

## Seguridad

- ✅ Context Isolation habilitado
- ❌ Node Integration deshabilitado
- ❌ Remote Module deshabilitado
- ✅ Preload script configurado

Nunca deshabilites estas configuraciones de seguridad.

## Modificar la App

**Cambiar ventana inicial:**
```javascript
// En main.js, modificar startURL
const startURL = isDev
  ? 'http://localhost:3000/tu-ruta'
  : `file://${path.join(__dirname, '../out/index.html')}`;
```

**Agregar IPC handlers:**
```javascript
// En main.js
ipcMain.handle('nombre-handler', async (event, args) => {
  // Tu lógica
  return resultado;
});

// En preload.js
contextBridge.exposeInMainWorld('electron', {
  tuMetodo: (args) => ipcRenderer.invoke('nombre-handler', args)
});
```

**Usar en React:**
```typescript
const resultado = await window.electron.tuMetodo(args);
```

## Ver Documentación Completa

Para más información, ver [../ELECTRON_APP.md](../ELECTRON_APP.md)
