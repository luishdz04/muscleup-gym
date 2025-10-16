/**
 * Script para encontrar la IP del access-agent en tu red local
 * Uso: node find-access-agent.js
 */

const http = require('http');
const { exec } = require('child_process');

// Obtener la IP local
exec('ipconfig', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error obteniendo IP:', error);
    return;
  }

  // Buscar la IP local
  const ipMatch = stdout.match(/IPv4[\s\S]*?:\s*(\d+\.\d+\.\d+\.\d+)/);

  if (!ipMatch) {
    console.error('❌ No se pudo encontrar tu IP local');
    return;
  }

  const localIP = ipMatch[1];
  console.log('📍 Tu IP local es:', localIP);
  console.log('');

  // Obtener la red base (ejemplo: 192.168.1)
  const baseIP = localIP.split('.').slice(0, 3).join('.');
  console.log(`🔍 Buscando access-agent en la red ${baseIP}.x...`);
  console.log('⏳ Esto puede tomar 1-2 minutos...\n');

  let foundServers = [];
  let pending = 0;

  // Probar IPs del 1 al 255
  for (let i = 1; i <= 255; i++) {
    const testIP = `${baseIP}.${i}`;
    pending++;

    // Intentar conectar al puerto 8085 (WebSocket del access-agent)
    const socket = require('net').connect({
      host: testIP,
      port: 8085,
      timeout: 1000
    });

    socket.on('connect', () => {
      foundServers.push(testIP);
      console.log(`✅ ¡Encontrado! access-agent en: ${testIP}:8085`);
      socket.end();
      checkComplete();
    });

    socket.on('error', () => {
      // Ignorar errores (IP no disponible)
      checkComplete();
    });

    socket.on('timeout', () => {
      socket.destroy();
      checkComplete();
    });
  }

  function checkComplete() {
    pending--;
    if (pending === 0) {
      console.log('\n' + '='.repeat(60));
      if (foundServers.length > 0) {
        console.log('🎉 Servidores encontrados:');
        foundServers.forEach(ip => {
          console.log(`   📍 ws://${ip}:8085/ws/`);
        });
        console.log('\n💡 Usa esta IP en tu .env.local:');
        console.log(`   NEXT_PUBLIC_F22_WEBSOCKET_URL=ws://${foundServers[0]}:8085/ws/`);
      } else {
        console.log('❌ No se encontró ningún access-agent corriendo en el puerto 8085');
        console.log('');
        console.log('📋 Verifica que:');
        console.log('   1. El access-agent esté corriendo');
        console.log('   2. No haya firewall bloqueando el puerto 8085');
        console.log('   3. Estés en la misma red local');
      }
      console.log('='.repeat(60));
    }
  }
});
