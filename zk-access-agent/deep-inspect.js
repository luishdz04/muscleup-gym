const koffi = require('koffi');

console.log('🔍 INSPECCIÓN PROFUNDA DE DLLs ZKTeco...\n');

// Función para intentar muchos tipos de declaración
function tryFunction(lib, funcName) {
    const returnTypes = ['int', 'void', 'bool', 'uint32', 'void*', 'char*'];
    const paramTypes = [
        [],
        ['int'],
        ['void*'],
        ['int', 'void*'],
        ['void*', 'void*'],
        ['int', 'int'],
        ['void*', 'uint8*', 'uint8*', 'uint8*']
    ];
    
    for (const retType of returnTypes) {
        for (const params of paramTypes) {
            try {
                const func = lib.func(funcName, retType, params);
                return { retType, params, success: true };
            } catch (error) {
                // Continuar probando
            }
        }
    }
    return null;
}

// Lista expandida de posibles nombres de funciones
const possibleFunctions = [
    // ZKFinger estándar
    'ZKFP2_Init', 'ZKFP2_Terminate', 'ZKFP2_GetDeviceCount',
    'ZKFP2_OpenDevice', 'ZKFP2_CloseDevice', 'ZKFP2_AcquireFingerprint',
    
    // Sin prefijo ZKFP2
    'Init', 'Terminate', 'GetDeviceCount', 'OpenDevice', 'CloseDevice', 'AcquireFingerprint',
    
    // Con diferentes prefijos
    'ZKFinger_Init', 'ZKFinger_Terminate', 'ZKFinger_GetDeviceCount',
    'ZK_Init', 'ZK_Terminate', 'ZK_GetDeviceCount',
    'ZKFP_Init', 'ZKFP_Terminate', 'ZKFP_GetDeviceCount',
    
    // Específicos para captura
    'CaptureFingerprint', 'GetFingerprint', 'AcquireFP', 'CaptureFP',
    'ZKFP2_AcquireFP', 'ZKFinger_Capture', 'ZK_Capture',
    
    // Funciones de dispositivo
    'GetDevice', 'FindDevice', 'ConnectDevice', 'DisconnectDevice',
    'ZKFP2_GetDevice', 'ZKFinger_GetDevice', 'ZK_GetDevice',
    
    // Funciones de inicialización alternativas
    'Initialize', 'Finalize', 'Startup', 'Shutdown',
    'ZKFP2_Initialize', 'ZKFinger_Initialize', 'ZK_Initialize',
    
    // Funciones específicas ZK9500
    'ZK9500_Init', 'ZK9500_Connect', 'ZK9500_Capture',
    
    // Nombres en minúsculas
    'init', 'terminate', 'getdevicecount', 'opendevice', 'closedevice',
    
    // Con guiones bajos
    'zk_fp_init', 'zk_fp_terminate', 'zk_fp_get_device_count',
    'zkfp_init', 'zkfp_terminate', 'zkfp_get_device_count'
];

const dlls = ['./dll/zkfinger10.dll', './dll/libzkfp.dll', './dll/ZKFPCap.dll'];

for (const dllPath of dlls) {
    console.log(`\n📂 === INSPECCIÓN PROFUNDA: ${dllPath} ===`);
    
    try {
        const lib = koffi.load(dllPath);
        console.log('✅ DLL cargada exitosamente');
        
        const foundFunctions = [];
        
        for (const funcName of possibleFunctions) {
            const result = tryFunction(lib, funcName);
            if (result) {
                foundFunctions.push({
                    name: funcName,
                    returnType: result.retType,
                    params: result.params
                });
                console.log(`✅ ENCONTRADA: ${funcName} -> ${result.retType}(${result.params.join(', ')})`);
            }
        }
        
        if (foundFunctions.length === 0) {
            console.log('❌ Aún no se encontraron funciones');
        } else {
            console.log(`\n🎯 FUNCIONES ENCONTRADAS EN ${dllPath}:`);
            foundFunctions.forEach(func => {
                console.log(`   ${func.name}: ${func.returnType}(${func.params.join(', ')})`);
            });
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}