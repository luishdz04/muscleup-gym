const koffi = require('koffi');
const fs = require('fs');

console.log('🔍 Inspeccionando DLL ZKTeco...\n');

try {
    // Cargar la DLL
    const dllPath = './dll/libzkfp.dll';
    console.log(`📂 Cargando: ${dllPath}`);
    
    const zkLib = koffi.load(dllPath);
    console.log('✅ DLL cargada exitosamente\n');
    
    // Intentar funciones comunes ZK
    const possibleFunctions = [
        // ZKFinger SDK comunes
        'ZKFP2_Init',
        'ZKFP2_Terminate', 
        'ZKFP2_GetDeviceCount',
        'ZKFP2_OpenDevice',
        'ZKFP2_CloseDevice',
        'ZKFP2_AcquireFingerprint',
        
        // Alternativas sin ZKFP2_
        'ZKFPInit',
        'ZKFPTerminate',
        'ZKFPGetDeviceCount', 
        'ZKFPOpenDevice',
        'ZKFPCloseDevice',
        'ZKFPAcquireFingerprint',
        
        // Nombres simples
        'Init',
        'Terminate',
        'GetDeviceCount',
        'OpenDevice', 
        'CloseDevice',
        'AcquireFingerprint',
        
        // Otras variantes
        'zkfp_init',
        'zkfp_terminate',
        'zkfp_get_device_count',
        'zkfp_open_device',
        'zkfp_close_device',
        'zkfp_acquire_fingerprint'
    ];
    
    console.log('🔍 Probando funciones posibles:\n');
    
    const foundFunctions = [];
    
    for (const funcName of possibleFunctions) {
        try {
            const func = zkLib.func(funcName, 'int', []);
            foundFunctions.push(funcName);
            console.log(`✅ ENCONTRADA: ${funcName}`);
        } catch (error) {
            console.log(`❌ No existe: ${funcName}`);
        }
    }
    
    console.log(`\n📊 RESUMEN: ${foundFunctions.length} funciones encontradas`);
    
    if (foundFunctions.length > 0) {
        console.log('\n🎯 FUNCIONES DISPONIBLES:');
        foundFunctions.forEach(func => console.log(`   - ${func}`));
    } else {
        console.log('\n⚠️ No se encontraron funciones conocidas');
        console.log('💡 Esta DLL podría usar nombres diferentes o ser incompatible');
    }
    
} catch (error) {
    console.error('❌ Error:', error.message);
}