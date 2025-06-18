// Crear archivo temporal para probar FFI
console.log('🔍 Probando módulos FFI...');

// Test 1: ffi-napi
try {
    const ffi = require('ffi-napi');
    const ref = require('ref-napi');
    console.log('✅ ffi-napi + ref-napi: DISPONIBLES');
} catch (error) {
    console.log('❌ ffi-napi:', error.message);
}

// Test 2: ffi clásico
try {
    const ffi = require('ffi');
    const ref = require('ref');
    console.log('✅ ffi + ref clásico: DISPONIBLES');
} catch (error) {
    console.log('❌ ffi clásico:', error.message);
}

// Test 3: Verificar DLL
const fs = require('fs');
const path = require('path');
const dllPath = path.join(__dirname, 'dll', 'zkemkeeper.dll');
console.log(`📁 DLL Path: ${dllPath}`);
console.log(`📁 DLL Exists: ${fs.existsSync(dllPath)}`);

if (fs.existsSync(dllPath)) {
    const stats = fs.statSync(dllPath);
    console.log(`📊 DLL Size: ${Math.round(stats.size / 1024)} KB`);
    console.log(`📅 DLL Modified: ${stats.mtime}`);
}