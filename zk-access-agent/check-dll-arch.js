const fs = require('fs');
const path = require('path');

function checkDLLArchitecture(dllPath) {
    try {
        const buffer = fs.readFileSync(dllPath);
        
        // Leer header PE
        const peOffset = buffer.readUInt32LE(0x3C);
        const machine = buffer.readUInt16LE(peOffset + 4);
        
        switch(machine) {
            case 0x014c:
                return 'Intel 386+ (32-bit)';
            case 0x8664:
                return 'AMD x64 (64-bit)';
            case 0x01c0:
                return 'ARM (32-bit)';
            case 0xaa64:
                return 'ARM64 (64-bit)';
            default:
                return `Unknown (${machine.toString(16)})`;
        }
    } catch (error) {
        return `Error: ${error.message}`;
    }
}

const dllPath = path.join(__dirname, 'dll', 'zkemkeeper.dll');
console.log(`📁 DLL Path: ${dllPath}`);
console.log(`🏗️ DLL Architecture: ${checkDLLArchitecture(dllPath)}`);
console.log(`🖥️ Node.js Architecture: ${process.arch}`);
console.log(`🖥️ Node.js Platform: ${process.platform}`);
console.log('');

if (fs.existsSync(dllPath)) {
    const stats = fs.statSync(dllPath);
    console.log(`📊 DLL Size: ${Math.round(stats.size / 1024)} KB`);
    console.log(`📅 DLL Date: ${stats.mtime}`);
}

// Verificar directorio dll/
const dllDir = path.join(__dirname, 'dll');
if (fs.existsSync(dllDir)) {
    console.log('\n📂 Archivos en dll/:');
    fs.readdirSync(dllDir).forEach(file => {
        const filePath = path.join(dllDir, file);
        const stat = fs.statSync(filePath);
        console.log(`   ${file} (${Math.round(stat.size / 1024)} KB)`);
    });
}