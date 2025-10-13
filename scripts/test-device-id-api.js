/**
 * Script de Prueba: API get-next-device-id
 * 
 * Ejecutar con:
 * node scripts/test-device-id-api.js
 * 
 * O directamente en el navegador (consola):
 * - Abrir http://localhost:3000
 * - Copiar y pegar este código en la consola
 */

async function testGetNextDeviceId() {
  console.log('🧪 Iniciando pruebas de API get-next-device-id...\n');
  
  const baseUrl = 'http://localhost:3000/api/biometric/get-next-device-id';
  const userTypes = ['cliente', 'empleado', 'administrador'];
  
  for (const userType of userTypes) {
    console.log(`\n📋 Probando tipo: ${userType}`);
    console.log('─'.repeat(50));
    
    try {
      const response = await fetch(`${baseUrl}?userType=${userType}`);
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('✅ Respuesta exitosa:');
        console.log(`   - Next ID: ${data.nextId}`);
        console.log(`   - Current Max: ${data.currentMax}`);
        console.log(`   - User Type: ${data.userType}`);
        console.log(`   - Range: ${data.range.min} - ${data.range.max}`);
        
        // Validaciones
        if (data.success !== true) {
          console.warn('⚠️ Warning: success no es true');
        }
        
        if (userType === 'cliente' && (data.nextId < 1 || data.nextId > 6999)) {
          console.error('❌ Error: nextId fuera de rango para cliente');
        }
        
        if (userType === 'empleado' && (data.nextId < 7000 || data.nextId > 7999)) {
          console.error('❌ Error: nextId fuera de rango para empleado');
        }
        
        if (userType === 'administrador' && (data.nextId < 8000 || data.nextId > 8999)) {
          console.error('❌ Error: nextId fuera de rango para administrador');
        }
        
      } else {
        const errorData = await response.text();
        console.error(`❌ Error ${response.status}:`, errorData);
      }
      
    } catch (error) {
      console.error(`💥 Error de red/fetch:`, error.message);
    }
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log('✅ Pruebas completadas\n');
}

// Ejecutar pruebas
testGetNextDeviceId();
