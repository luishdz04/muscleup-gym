# MuscleUp Gym Admin - Aplicación de Escritorio (Electron)

Esta guía documenta la implementación de la aplicación de escritorio del sistema de administración de MuscleUp Gym utilizando Electron.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Empaquetado](#empaquetado)
- [Estructura de Archivos](#estructura-de-archivos)
- [Configuración](#configuración)
- [Troubleshooting](#troubleshooting)

---

## ✨ Características

La aplicación de escritorio de MuscleUp Gym Admin ofrece:

- **Aplicación Nativa**: App de escritorio para Windows, macOS y Linux
- **Interfaz Optimizada**: Dashboard de administración en ventana nativa
- **Mejor Rendimiento**: Sin overhead del navegador
- **Integración de Hardware**: Mejor soporte para dispositivos biométricos y periféricos
- **Offline Ready**: Preparada para funcionalidad sin conexión (futuro)
- **Auto-Updates**: Sistema de actualizaciones automáticas (opcional)
- **Seguridad Mejorada**: Context isolation y preload scripts seguros

---

## 🔧 Requisitos

### Desarrollo
- Node.js 18+
- npm 9+
- Sistema operativo: Windows 10+, macOS 10.13+, o Linux

### Construcción Multi-plataforma
- **Windows**: Cualquier plataforma con Wine configurado (para firmar)
- **macOS**: Solo puede construirse en macOS (requiere Xcode)
- **Linux**: Puede construirse en cualquier plataforma

---

## 📦 Instalación

Las dependencias ya están instaladas. Si necesitas reinstalar:

```bash
npm install
```

Esto instalará:
- `electron` - Framework principal
- `electron-builder` - Empaquetador
- `concurrently` - Ejecutar múltiples comandos
- `cross-env` - Variables de entorno multiplataforma
- `wait-on` - Esperar a que el servidor esté listo

---

## 💻 Desarrollo

### Modo Desarrollo

Ejecutar la app en modo desarrollo (requiere servidor Next.js corriendo):

```bash
npm run electron:dev
```

Este comando:
1. Inicia el servidor Next.js en `http://localhost:3000`
2. Espera a que el servidor esté listo
3. Lanza Electron apuntando al servidor local
4. Abre DevTools automáticamente

**Características en modo desarrollo:**
- Hot reload del contenido web
- DevTools abierto por defecto
- Recarga con `Ctrl/Cmd + R`
- Variables de entorno de desarrollo

### Debugging

**DevTools del Renderer Process:**
- Se abren automáticamente en desarrollo
- Acceso manual: Menú → Ayuda → Herramientas de Desarrollo (F12)

**DevTools del Main Process:**
```bash
# En una terminal separada
node --inspect-brk electron/main.js
```

Luego abre `chrome://inspect` en Chrome.

---

## 📦 Empaquetado

### Construcción para Todas las Plataformas

```bash
npm run electron:build
```

### Construcción Específica por Plataforma

**Windows:**
```bash
npm run electron:build:win
```

Genera:
- `MuscleUp Gym Admin-0.1.0-x64.exe` - Instalador NSIS
- `MuscleUp Gym Admin-0.1.0-portable.exe` - Versión portable

**macOS:**
```bash
npm run electron:build:mac
```

Genera:
- `MuscleUp Gym Admin-0.1.0.dmg` - Imagen de disco
- `MuscleUp Gym Admin-0.1.0-mac.zip` - Archivo comprimido

**Linux:**
```bash
npm run electron:build:linux
```

Genera:
- `MuscleUp Gym Admin-0.1.0.AppImage` - AppImage universal
- `MuscleUp Gym Admin-0.1.0.deb` - Paquete Debian/Ubuntu
- `MuscleUp Gym Admin-0.1.0.rpm` - Paquete RedHat/Fedora

### Ubicación de Builds

Todos los archivos empaquetados se generan en:
```
/dist/
```

---

## 📁 Estructura de Archivos

```
muscleup-gym/
├── electron/
│   ├── main.js              # Proceso principal de Electron
│   ├── preload.js           # Script preload (context bridge)
│   ├── entitlements.mac.plist  # Permisos para macOS
│   └── assets/
│       ├── icon.ico         # Ícono Windows (agregar)
│       ├── icon.icns        # Ícono macOS (agregar)
│       ├── icons/           # Íconos Linux PNG (agregar)
│       └── README.md        # Guía de íconos
│
├── electron-builder.json    # Configuración de empaquetado
├── package.json            # Scripts y dependencias
└── ELECTRON_APP.md         # Esta documentación
```

---

## ⚙️ Configuración

### electron/main.js

Proceso principal de Electron. Características:

- **Ventana Principal**: 1400x900, mínimo 1024x768
- **Security**: Context isolation, no remote module, no node integration
- **Menú Personalizado**: Archivo, Ver, Ayuda
- **DevTools**: Solo en desarrollo
- **IPC Handlers**: Comunicación segura con renderer

**Variables importantes:**
```javascript
const isDev = process.env.NODE_ENV === 'development';
const startURL = isDev
  ? 'http://localhost:3000/dashboard/admin'
  : `file://${path.join(__dirname, '../out/index.html')}`;
```

### electron/preload.js

Script de preload para exponer APIs seguras al renderer:

```javascript
window.electron = {
  getAppVersion: () => ...,
  getAppPath: () => ...,
  platform: process.platform,
  isElectron: true
}
```

**Detección en el código web:**
```typescript
// En cualquier componente React
if (typeof window !== 'undefined' && window.electron?.isElectron) {
  // Código específico para Electron
}
```

### electron-builder.json

Configuración de empaquetado. Puntos clave:

- **appId**: `com.muscleupgym.admin`
- **productName**: `MuscleUp Gym Admin`
- **Archivos incluidos**: electron/, .next/, public/, node_modules/
- **Targets**: NSIS + Portable (Win), DMG + ZIP (Mac), AppImage + deb + rpm (Linux)

**Personalización:**
- Cambiar versión en `package.json`
- Modificar nombre en `productName`
- Ajustar íconos en `electron/assets/`

---

## 🎨 Iconos de la Aplicación

### Requerimientos

**Windows:**
- `icon.ico` - 256x256 píxeles, multi-resolución

**macOS:**
- `icon.icns` - Hasta 1024x1024, multi-resolución

**Linux:**
- Carpeta `icons/` con PNG: 16, 32, 48, 64, 128, 256, 512

### Generar Iconos

**Opción 1: Herramienta Online**
1. Ir a https://www.electron.build/icons
2. Subir PNG 1024x1024
3. Descargar y colocar en `electron/assets/`

**Opción 2: electron-icon-builder**
```bash
npm install -g electron-icon-builder
electron-icon-builder --input=./logo.png --output=./electron/assets
```

**Imagen fuente recomendada:**
- Formato: PNG transparente
- Resolución: 1024x1024 mínimo
- Diseño: Logo de MuscleUp Gym (amarillo #FFCC00 + negro)

Ver `electron/assets/README.md` para más detalles.

---

## 🔌 Integración con Next.js

La app Electron carga la aplicación Next.js de dos formas:

### Modo Desarrollo
- Conecta a `http://localhost:3000/dashboard/admin`
- Next.js debe estar corriendo
- Hot reload disponible

### Modo Producción
- Carga archivos estáticos de `/out/`
- No requiere servidor Node.js
- **IMPORTANTE**: Next.js debe exportar estático:

```javascript
// next.config.js (futuro)
module.exports = {
  output: 'export',
  // ... otras configs
}
```

**Nota:** Actualmente la app apunta al servidor Next.js. Para producción offline, necesitarás configurar exportación estática.

---

## 🚀 Distribución

### Instalador Windows (NSIS)

**Características:**
- Instalación en Program Files
- Carpeta personalizable
- Shortcuts en Desktop y Start Menu
- Desinstalador incluido
- Ejecución automática al finalizar

**Instalación silenciosa:**
```cmd
"MuscleUp Gym Admin-0.1.0-x64.exe" /S
```

### Portable Windows

**Características:**
- No requiere instalación
- Ejecutable único
- Configuración en carpeta local
- Ideal para USB o pruebas

### macOS DMG

**Características:**
- Arrastrar a /Applications
- Firmado (requiere certificado Apple Developer)
- Notarizado (requiere proceso adicional)

### Linux Packages

**AppImage:**
- Universal, funciona en todas las distros
- No requiere instalación
- Ejecutar con `chmod +x` y `./archivo.AppImage`

**DEB (Debian/Ubuntu):**
```bash
sudo dpkg -i muscleup-gym-admin_0.1.0_amd64.deb
```

**RPM (RedHat/Fedora):**
```bash
sudo rpm -i muscleup-gym-admin-0.1.0.x86_64.rpm
```

---

## 🔐 Seguridad

### Context Isolation

Activado por defecto. Previene:
- Acceso directo a Node.js desde renderer
- Contaminación del contexto global
- Vulnerabilidades XSS

### Preload Script

- Única comunicación entre main y renderer
- APIs explícitamente expuestas
- No exponer funciones sensibles

### Content Security Policy

Agregar en desarrollo:
```javascript
// En electron/main.js
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': ["script-src 'self'"]
    }
  });
});
```

---

## 🐛 Troubleshooting

### La app no inicia en desarrollo

**Problema:** `wait-on` timeout
**Solución:**
```bash
# Terminal 1
npm run dev

# Esperar a que cargue, luego Terminal 2
npm run electron:dev
```

### Error: "Electron failed to install correctly"

**Solución:**
```bash
npm install --save-dev electron --force
npm run postinstall
```

### Build falla en Windows

**Problema:** Permisos o antivirus bloqueando
**Solución:**
- Ejecutar como administrador
- Agregar excepción en antivirus para carpeta del proyecto
- Deshabilitar Windows Defender temporalmente

### Build falla en macOS

**Problema:** Firma de código
**Solución:**
```bash
# Sin firma (desarrollo)
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build:mac
```

### Ventana en blanco

**Problema:** URL incorrecta o Next.js no corriendo
**Solución:**
1. Verificar que Next.js esté en `http://localhost:3000`
2. Abrir DevTools (F12) y revisar errores de consola
3. Verificar `startURL` en `main.js`

### Hot reload no funciona

**Problema:** Electron cachea archivos
**Solución:**
- Cerrar y reabrir Electron
- Usar `Ctrl/Cmd + Shift + R` (hard reload)
- Limpiar caché: Menú → Ver → Recargar

---

## 📚 Recursos Adicionales

### Documentación Oficial
- [Electron](https://www.electronjs.org/docs/latest/)
- [Electron Builder](https://www.electron.build/)
- [Next.js Static Export](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)

### Herramientas Útiles
- [electron-devtools-installer](https://github.com/MarshallOfSound/electron-devtools-installer) - React DevTools
- [electron-updater](https://www.electron.build/auto-update) - Auto-updates
- [electron-log](https://github.com/megahertz/electron-log) - Logging mejorado

### Ejemplos
```bash
# Logs detallados del build
DEBUG=electron-builder npm run electron:build

# Build sin empaquetar (más rápido para pruebas)
electron-builder --dir
```

---

## 🎯 Próximos Pasos

### Funcionalidades Recomendadas

1. **Auto-Updates**
   - Configurar electron-updater
   - Servidor de actualizaciones (GitHub Releases, S3, etc.)
   - Notificaciones de actualización

2. **Exportación Estática**
   - Configurar `output: 'export'` en Next.js
   - Optimizar rutas para SSG
   - Manejar API routes con IPC

3. **Notificaciones Nativas**
   ```javascript
   new Notification('MuscleUp Gym', {
     body: 'Nueva membresía registrada'
   });
   ```

4. **Menú de Contexto**
   - Click derecho personalizado
   - Opciones específicas de admin

5. **Shortcuts Globales**
   ```javascript
   const { globalShortcut } = require('electron');
   globalShortcut.register('CommandOrControl+Shift+M', () => {
     // Acción rápida
   });
   ```

6. **Tray Icon**
   - App en bandeja del sistema
   - Menú contextual rápido
   - Notificaciones persistentes

7. **Base de Datos Local**
   - SQLite para caché offline
   - Sincronización con Supabase
   - Modo offline completo

---

## 📝 Notas de Desarrollo

### Variables de Entorno

La app Electron necesita acceso a las mismas variables de entorno que Next.js:

**Opción 1: Compartir .env.local** (actual)
- Electron lee `.env.local` automáticamente
- Next.js también lo usa
- Sin configuración adicional

**Opción 2: electron-dotenv** (futuro)
```bash
npm install electron-dotenv
```

```javascript
// En main.js
require('electron-dotenv').load();
```

### Performance

**Optimizaciones aplicadas:**
- Context isolation para seguridad sin overhead
- Preload script mínimo
- DevTools solo en desarrollo
- Lazy loading de módulos pesados

**Mejoras futuras:**
- V8 snapshots para inicio más rápido
- Webpack/Rollup para bundling de main process
- Code splitting en renderer

### Compatibilidad

**Versiones probadas:**
- Electron 38.x
- Node.js 18.x / 20.x
- Next.js 15.x

**Plataformas soportadas:**
- Windows 10/11 (x64)
- macOS 10.13+ (x64, arm64)
- Linux (Ubuntu 18.04+, Fedora 32+)

---

## 🤝 Contribución

Al agregar nuevas funcionalidades a Electron:

1. **Documentar en este archivo** cualquier cambio importante
2. **Actualizar `electron/main.js`** con comentarios claros
3. **Agregar IPC handlers** en main.js y exponerlos en preload.js
4. **Probar en las 3 plataformas** si es posible
5. **Actualizar versión** en package.json antes de release

---

## 📄 Licencia

Este proyecto es parte del sistema MuscleUp Gym Admin.
Copyright © 2025 MuscleUp Gym. Todos los derechos reservados.

---

## 📞 Soporte

Para problemas con la aplicación de escritorio:

1. Revisar esta documentación
2. Verificar logs en `%APPDATA%/MuscleUp Gym Admin/logs` (Windows)
3. Abrir DevTools y revisar consola
4. Reportar issue con detalles de plataforma y logs

---

**Última actualización:** Enero 2025
**Versión de la app:** 0.1.0
**Electron:** 38.x
