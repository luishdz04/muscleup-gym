// Test simple de Electron
console.log('Iniciando test de Electron...');

try {
  const electron = require('electron');
  console.log('Electron cargado:', typeof electron);
  console.log('electron.app:', typeof electron.app);

  if (electron.app) {
    console.log('✅ electron.app está disponible');
    electron.app.whenReady().then(() => {
      console.log('✅ Electron app está listo!');
      electron.app.quit();
    });
  } else {
    console.log('❌ electron.app es undefined');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error al cargar Electron:', error.message);
  process.exit(1);
}
