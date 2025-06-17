const koffi = require('koffi');

console.log('🔍 Probando funciones ZKFPM_...\n');

const zkfpmFunctions = [
    'ZKFPM_Init',
    'ZKFPM_Terminate', 
    'ZKFPM_GetDeviceCount',
    'ZKFPM_OpenDevice',
    'ZKFPM_CloseDevice',
    'ZKFPM_AcquireFingerprint'
];

const dlls = ['./dll/libzkfp.dll', './dll/zkfinger10.dll', './dll/ZKFPCap.dll'];

for (const dllPath of dlls) {
    console.log(`\n📂 === PROBANDO: ${dllPath} ===`);
    
    try {
        const lib = koffi.load(dllPath);
        console.log('✅ DLL cargada');
        
        for (const funcName of zkfpmFunctions) {
            try {
                const func = lib.func(funcName, 'int', []);
                console.log(`✅ ENCONTRADA: ${funcName}`);
            } catch (error) {
                console.log(`❌ No existe: ${funcName}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}