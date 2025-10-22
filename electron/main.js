const { app, BrowserWindow } = require('electron/main');
const path = require('path');
const { spawn } = require('child_process');

// Determinar si estamos en modo desarrollo o producción
// No podemos usar app.isPackaged aquí porque causa el mismo error
const isDev = process.env.NODE_ENV !== 'production';

let nextServer = null;

// Iniciar servidor Next.js en producción
function startNextServer() {
  return new Promise((resolve, reject) => {
    const nextScript = path.join(__dirname, '../node_modules/next/dist/bin/next');

    nextServer = spawn('node', [nextScript, 'start', '-p', '3000'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, NODE_ENV: 'production' }
    });

    nextServer.stdout.on('data', (data) => {
      console.log(`Next.js: ${data}`);
      if (data.toString().includes('Ready') || data.toString().includes('started')) {
        resolve();
      }
    });

    nextServer.stderr.on('data', (data) => {
      console.error(`Next.js Error: ${data}`);
    });

    nextServer.on('error', (error) => {
      console.error('Failed to start Next.js:', error);
      reject(error);
    });

    // Timeout después de 30 segundos
    setTimeout(() => {
      resolve(); // Intentar de todas formas
    }, 30000);
  });
}

async function createWindow() {
  // En producción, iniciar el servidor Next.js primero
  if (!isDev) {
    console.log('Starting Next.js server...');
    try {
      await startNextServer();
      console.log('Next.js server started');
    } catch (error) {
      console.error('Failed to start Next.js server:', error);
    }
  }

  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
    show: false,
  });

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Cargar la aplicación desde localhost en ambos modos
  const startUrl = 'http://localhost:3000/dashboard/admin';

  // Intentar cargar con reintentos
  let attempts = 0;
  const maxAttempts = 10;

  const tryLoad = async () => {
    try {
      await mainWindow.loadURL(startUrl);
      if (isDev) {
        mainWindow.webContents.openDevTools();
      }
    } catch (error) {
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`Failed to load, retrying... (${attempts}/${maxAttempts})`);
        setTimeout(tryLoad, 2000);
      } else {
        console.error('Failed to load application after multiple attempts');
      }
    }
  };

  tryLoad();

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorDescription);
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Cerrar servidor Next.js si está corriendo
  if (nextServer) {
    nextServer.kill();
    nextServer = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Cerrar servidor Next.js al salir
app.on('before-quit', () => {
  if (nextServer) {
    nextServer.kill();
    nextServer = null;
  }
});
