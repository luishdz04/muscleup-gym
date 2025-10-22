# Inicio Rápido - Aplicación Electron

Guía rápida para ejecutar y construir la aplicación de escritorio MuscleUp Gym Admin.

## 🚀 Ejecutar en Desarrollo

### Opción 1: Comando Único (Recomendado)

```bash
npm run electron:dev
```

Este comando automáticamente:
1. Inicia Next.js en puerto 3000
2. Espera a que el servidor esté listo
3. Abre la aplicación Electron

### Opción 2: Manual (Dos Terminales)

**Terminal 1 - Next.js:**
```bash
npm run dev
```

**Terminal 2 - Electron (espera a que Next.js cargue):**
```bash
cross-env NODE_ENV=development electron .
```

## 📦 Construir para Distribución

### Windows (Recomendado en Windows)

```bash
npm run electron:build:win
```

**Genera:**
- `dist/MuscleUp Gym Admin-0.1.0-x64.exe` - Instalador NSIS
- `dist/MuscleUp Gym Admin-0.1.0-portable.exe` - Versión portable

**Tiempo estimado:** 2-5 minutos

### macOS (Solo en macOS)

```bash
npm run electron:build:mac
```

**Genera:**
- `dist/MuscleUp Gym Admin-0.1.0.dmg`
- `dist/MuscleUp Gym Admin-0.1.0-mac.zip`

### Linux

```bash
npm run electron:build:linux
```

**Genera:**
- `dist/MuscleUp Gym Admin-0.1.0.AppImage`
- `dist/MuscleUp Gym Admin-0.1.0.deb`
- `dist/MuscleUp Gym Admin-0.1.0.rpm`

### Todas las Plataformas

```bash
npm run electron:build
```

⚠️ **Nota:** macOS solo puede construirse en macOS

## 🎨 Agregar Iconos

**Antes de construir para producción**, agrega iconos personalizados:

1. Crea un PNG de 1024x1024 con el logo de MuscleUp Gym
2. Ve a https://www.electron.build/icons
3. Sube el PNG y descarga los iconos generados
4. Colócalos en:
   - `electron/assets/icon.ico` (Windows)
   - `electron/assets/icon.icns` (macOS)
   - `electron/assets/icons/*.png` (Linux)

Ver `electron/assets/README.md` para más detalles.

## 🔧 Solución de Problemas Comunes

### Error: "wait-on timeout"

**Problema:** Next.js no está corriendo o puerto 3000 ocupado

**Solución:**
```bash
# Verificar si puerto 3000 está en uso
netstat -ano | findstr :3000    # Windows
lsof -i :3000                    # macOS/Linux

# Matar proceso en puerto 3000 (Windows)
taskkill /PID <PID> /F

# Luego intenta de nuevo
npm run electron:dev
```

### Error: "Electron failed to install"

**Solución:**
```bash
npm install --save-dev electron --force
npm run postinstall
```

### Build falla en Windows

**Problema:** Antivirus bloquea electron-builder

**Solución:**
1. Agregar excepción en Windows Defender para la carpeta del proyecto
2. O ejecutar como administrador:
```bash
# PowerShell como Admin
npm run electron:build:win
```

### Ventana en Blanco

**Problema:** URL incorrecta o Next.js no está corriendo

**Solución:**
1. Abre DevTools con F12
2. Revisa errores en consola
3. Verifica que Next.js esté en http://localhost:3000
4. Recarga con Ctrl+R o Cmd+R

## 🎯 Uso en Producción

### Instalador Windows (NSIS)

**Instalación:**
- Doble click en `.exe`
- Sigue el asistente
- Se crea shortcut en Desktop y Start Menu

**Instalación Silenciosa:**
```cmd
"MuscleUp Gym Admin-0.1.0-x64.exe" /S
```

**Desinstalación:**
- Panel de Control → Programas → Desinstalar
- O ejecutar `uninstall.exe` en carpeta de instalación

### Portable Windows

**Uso:**
- No requiere instalación
- Ejecuta directamente el `.exe`
- Configuración se guarda en carpeta local
- Ideal para USB o múltiples computadoras

### macOS DMG

**Instalación:**
1. Abre el `.dmg`
2. Arrastra la app a `/Applications`
3. Listo!

### Linux AppImage

**Uso:**
```bash
chmod +x MuscleUp\ Gym\ Admin-0.1.0.AppImage
./MuscleUp\ Gym\ Admin-0.1.0.AppImage
```

### Linux DEB (Ubuntu/Debian)

```bash
sudo dpkg -i muscleup-gym-admin_0.1.0_amd64.deb
```

### Linux RPM (Fedora/RedHat)

```bash
sudo rpm -i muscleup-gym-admin-0.1.0.x86_64.rpm
```

## 📱 Detectar Electron en Código

### Hook Personalizado

```typescript
import { useIsElectron } from '@/components/ElectronDetector';

function MyComponent() {
  const isElectron = useIsElectron();

  if (isElectron) {
    // Código específico para Electron
  }
}
```

### Directo

```typescript
if (typeof window !== 'undefined' && window.electron?.isElectron) {
  const version = await window.electron.getAppVersion();
  const platform = window.electron.platform;
}
```

## 🔐 Actualizaciones

### Cambiar Versión

Edita `package.json`:
```json
{
  "version": "0.2.0"
}
```

Luego rebuild:
```bash
npm run electron:build
```

### Auto-Updates (Futuro)

Para implementar auto-updates:
1. Instalar `electron-updater`
2. Configurar servidor de updates (GitHub Releases, S3, etc.)
3. Ver `ELECTRON_APP.md` para guía completa

## 📊 Tamaños de Build

**Aproximados:**
- Windows Instalador: ~150-200 MB
- Windows Portable: ~150-200 MB
- macOS DMG: ~150-200 MB
- Linux AppImage: ~150-200 MB

**Nota:** El tamaño incluye Electron runtime y todas las dependencias de Node.js

## 🎓 Recursos

- [ELECTRON_APP.md](ELECTRON_APP.md) - Documentación completa
- [CLAUDE.md](CLAUDE.md) - Ver sección "Aplicación de Escritorio"
- [electron/README.md](electron/README.md) - Detalles técnicos
- [Electron Docs](https://www.electronjs.org/docs/latest/)
- [Electron Builder Docs](https://www.electron.build/)

## ✅ Checklist Pre-Release

Antes de distribuir a usuarios:

- [ ] Agregar iconos personalizados en `electron/assets/`
- [ ] Actualizar versión en `package.json`
- [ ] Probar en modo desarrollo
- [ ] Build para plataforma objetivo
- [ ] Probar instalador/portable
- [ ] Verificar que carga correctamente
- [ ] Probar funcionalidades principales
- [ ] Verificar integración con hardware (biométricos, etc.)
- [ ] Documentar cambios en changelog

## 🚨 IMPORTANTE

### NO Distribuir Sin Iconos

Los iconos actuales son placeholders. Antes de release:
1. Diseña ícono oficial
2. Genera todos los formatos
3. Reemplaza en `electron/assets/`
4. Rebuild la app

### NO Olvidar .env

La app Electron necesita las mismas variables de entorno que Next.js. Asegúrate de tener `.env.local` configurado con:
- Database credentials
- Supabase keys
- API keys necesarias

---

**¿Necesitas más ayuda?**

Ver documentación completa en [ELECTRON_APP.md](ELECTRON_APP.md)
