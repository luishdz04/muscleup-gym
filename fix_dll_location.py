#!/usr/bin/env python3
"""
🔧 Fix DLL Location - Solución para DLL movida
Ejecutar como administrador
"""
import os
import subprocess
import sys
from pathlib import Path

def fix_dll_location():
    print("🔧 Solucionando problema de DLL movida...")
    print("=" * 50)
    
    # Verificar ubicación actual
    current_dll = Path("zkemkeeper.dll")
    if not current_dll.exists():
        print("❌ zkemkeeper.dll no encontrada en ubicación actual")
        return False
    
    dll_path = current_dll.absolute()
    print(f"📁 DLL encontrada en: {dll_path}")
    
    # Paso 1: Desregistrar DLL anterior
    print("\n🗑️ Paso 1: Limpiando registro anterior...")
    try:
        result = subprocess.run(['regsvr32', '/u', '/s', str(dll_path)], 
                              capture_output=True, text=True)
        print("✅ Registro anterior limpiado")
    except Exception as e:
        print(f"⚠️ Error limpiando registro: {e}")
    
    # Paso 2: Registrar en ubicación actual
    print("\n📝 Paso 2: Registrando en ubicación actual...")
    try:
        result = subprocess.run(['regsvr32', '/s', str(dll_path)], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ DLL registrada exitosamente en nueva ubicación")
        else:
            print(f"❌ Error registrando: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error ejecutando regsvr32: {e}")
        return False
    
    # Paso 3: Probar objeto COM
    print("\n🔍 Paso 3: Probando objeto COM...")
    try:
        import comtypes.client
        # Limpiar caché de comtypes
        import comtypes._comtypes_cache
        comtypes._comtypes_cache.clear_cache()
        
        # Crear objeto
        zkem = comtypes.client.CreateObject("zkemkeeper.ZKEM")
        print("✅ ¡Objeto COM funcionando correctamente!")
        return True
        
    except Exception as e:
        print(f"❌ Error COM: {e}")
        
        # Intentar limpiar caché de COM más agresivo
        try:
            import comtypes
            comtypes.CoInitialize()
            zkem = comtypes.client.CreateObject("zkemkeeper.ZKEM")
            print("✅ ¡Objeto COM funcionando después de CoInitialize!")
            return True
        except Exception as e2:
            print(f"❌ Error persistente: {e2}")
            return False

def check_admin():
    """Verificar permisos de administrador"""
    try:
        import ctypes
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

if __name__ == "__main__":
    if not check_admin():
        print("⚠️ ADVERTENCIA: Este script debe ejecutarse como ADMINISTRADOR")
        print("💡 Haz clic derecho en CMD/PowerShell → 'Ejecutar como administrador'")
        input("Presiona ENTER para continuar de todos modos...")
    
    success = fix_dll_location()
    
    if success:
        print("\n🎉 ¡PROBLEMA SOLUCIONADO!")
        print("🚀 Ahora puedes ejecutar: py f22_websocket_service_official.py")
    else:
        print("\n⚠️ Problema no resuelto completamente")
        print("💡 Intenta ejecutar como administrador:")
        print("   regsvr32 /u zkemkeeper.dll")
        print("   regsvr32 zkemkeeper.dll")
    
    input("\nPresiona ENTER para salir...")