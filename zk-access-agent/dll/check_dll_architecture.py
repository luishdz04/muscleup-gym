# 📁 check_dll_architecture.py - VERIFICAR SI LA DLL ES 64-BIT

import os
import struct
import sys

def check_dll_architecture(dll_path):
    """Verificar si la DLL es 32-bit o 64-bit"""
    try:
        print(f"🔍 Analizando: {dll_path}")
        
        if not os.path.exists(dll_path):
            print(f"❌ Archivo no encontrado: {dll_path}")
            return None
        
        with open(dll_path, 'rb') as f:
            # Leer DOS header
            dos_header = f.read(64)
            if len(dos_header) < 64:
                print("❌ Archivo demasiado pequeño")
                return None
            
            # Obtener offset del PE header
            pe_offset = struct.unpack('<L', dos_header[60:64])[0]
            
            # Ir al PE header
            f.seek(pe_offset)
            pe_header = f.read(24)
            
            if len(pe_header) < 24:
                print("❌ PE header inválido")
                return None
            
            # Verificar firma PE
            if pe_header[:4] != b'PE\x00\x00':
                print("❌ No es un archivo PE válido")
                return None
            
            # Obtener machine type
            machine = struct.unpack('<H', pe_header[4:6])[0]
            
            if machine == 0x014c:  # IMAGE_FILE_MACHINE_I386
                print("📋 Arquitectura: 32-bit (x86)")
                return 32
            elif machine == 0x8664:  # IMAGE_FILE_MACHINE_AMD64
                print("📋 Arquitectura: 64-bit (x64)")
                return 64
            else:
                print(f"❓ Arquitectura desconocida: {hex(machine)}")
                return None
                
    except Exception as e:
        print(f"❌ Error analizando DLL: {e}")
        return None

def check_python_architecture():
    """Verificar arquitectura de Python"""
    print(f"🐍 Python: {sys.version}")
    print(f"📋 Arquitectura Python: {struct.calcsize('P') * 8}-bit")
    return struct.calcsize('P') * 8

def find_dll_locations():
    """Buscar posibles ubicaciones de zkemkeeper.dll"""
    possible_locations = [
        "zkemkeeper.dll",
        "./zkemkeeper.dll",
        "C:/Program Files/ZKAccess/zkemkeeper.dll",
        "C:/Program Files (x86)/ZKAccess/zkemkeeper.dll",
        "C:/Windows/System32/zkemkeeper.dll",
        "C:/Windows/SysWOW64/zkemkeeper.dll"
    ]
    
    found_dlls = []
    
    print("🔍 Buscando zkemkeeper.dll...")
    for location in possible_locations:
        if os.path.exists(location):
            arch = check_dll_architecture(location)
            found_dlls.append((location, arch))
            print(f"✅ Encontrada: {location} ({arch}-bit)")
        else:
            print(f"❌ No encontrada: {location}")
    
    return found_dlls

# 🚀 MAIN
def main():
    print("=" * 70)
    print("🔍 VERIFICADOR DE ARQUITECTURA DLL")
    print("=" * 70)
    
    # Verificar Python
    python_arch = check_python_architecture()
    
    print("\n" + "=" * 70)
    
    # Buscar DLLs
    found_dlls = find_dll_locations()
    
    print("\n" + "=" * 70)
    print("📋 RESUMEN:")
    print(f"   🐍 Python: {python_arch}-bit")
    
    if found_dlls:
        for dll_path, dll_arch in found_dlls:
            compatibility = "✅ COMPATIBLE" if dll_arch == python_arch else "❌ INCOMPATIBLE"
            print(f"   📁 {dll_path}: {dll_arch}-bit {compatibility}")
    else:
        print("   ❌ No se encontraron DLLs")
    
    print("=" * 70)

if __name__ == "__main__":
    main()