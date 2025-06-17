const koffi = require('koffi');

console.log('🔍 Inspeccionando TODAS las DLLs ZKTeco...\n');

const dlls = [
    './dll/libzkfp.dll',
    './dll/zkfinger10.dll', 
    './dll/ZKFPCap.dll'
];

const commonFunctions = [
    // ZKFinger SDK
    'ZKFP2_Init',
    'ZKFP2_Terminate',
    'ZKFP2_GetDeviceCount',
    'ZKFP2_OpenDevice',
    'ZKFP2_CloseDevice', 
    'ZKFP2_AcquireFingerprint',
    
    // ZKFinger10 específicas
    'ZKFinger_Init',
    'ZKFinger_Terminate',
    'ZKFinger_GetDeviceCount',
    'ZKFinger_OpenDevice',
    'ZKFinger_CloseDevice',
    'ZKFinger_AcquireFingerprint',
    
    // Variantes simples
    'Init',
    'Terminate', 
    'GetDeviceCount',
    'OpenDevice',
    'CloseDevice',
    'AcquireFingerprint',
    
    // Específicas de ZK9500
    'ZK_Init',
    'ZK_Terminate',
    'ZK_GetDeviceCount',
    'ZK_OpenDevice',
    'ZK_CloseDevice',
    'ZK_Capture'
];

for (const dllPath of dlls) {
    console.log(`\n📂 === INSPECCIONANDO: ${dllPath} ===`);
    
    try {
        const lib = koffi.load(dllPath);
        console.log('✅ DLL cargada exitosamente');
        
        const foundFunctions = [];
        
        for (const funcName of commonFunctions) {
            try {
                const func = lib.func(funcName, 'int', []);
                foundFunctions.push(funcName);
                console.log(`✅ ENCONTRADA: ${funcName}`);
            } catch (error) {
                // Función no existe - silencioso
            }
        }
        
        if (foundFunctions.length === 0) {
            console.log('❌ No se encontraron funciones conocidas');
        } else {
            console.log(`\n🎯 ${foundFunctions.length} funciones encontradas en ${dllPath}:`);
            foundFunctions.forEach(func => console.log(`   - ${func}`));
        }
        
    } catch (error) {
        console.log(`❌ Error cargando DLL: ${error.message}`);
    }
}

console.log('\n🏁 Inspección completada');