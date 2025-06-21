# 📁 tests/dll_basic_test.py
# EJECUTAR CON: C:/Python311-32/python.exe dll_basic_test.py

import ctypes
import sys
import os
from pathlib import Path

def test_dll_loading():
    """Prueba 1: Cargar DLL"""
    print("🧪 PRUEBA 1: CARGA DE DLL")
    print("-" * 40)
    
    try:
        # Verificar que existe la DLL
        dll_path = "../zkemkeeper.dll"
        if not Path(dll_path).exists():
            print(f"❌ DLL no encontrada en: {dll_path}")
            return False
        
        print(f"✅ DLL encontrada: {dll_path}")
        
        # Intentar cargar
        print("🔄 Cargando DLL...")
        dll = ctypes.WinDLL(dll_path)
        print("✅ DLL cargada exitosamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error cargando DLL: {e}")
        return False

def test_basic_functions():
    """Prueba 2: Funciones básicas"""
    print("\n🧪 PRUEBA 2: FUNCIONES BÁSICAS")
    print("-" * 40)
    
    try:
        dll = ctypes.WinDLL("../zkemkeeper.dll")
        
        # Configurar función Connect_Net
        print("🔧 Configurando Connect_Net...")
        dll.Connect_Net.argtypes = [ctypes.c_char_p, ctypes.c_int]
        dll.Connect_Net.restype = ctypes.c_bool
        print("✅ Connect_Net configurada")
        
        # Configurar función Disconnect
        print("🔧 Configurando Disconnect...")
        dll.Disconnect.argtypes = []
        dll.Disconnect.restype = ctypes.c_bool
        print("✅ Disconnect configurada")
        
        print("✅ Funciones básicas configuradas")
        return True
        
    except Exception as e:
        print(f"❌ Error configurando funciones: {e}")
        return False

def test_f22_connection():
    """Prueba 3: Conexión al F22"""
    print("\n🧪 PRUEBA 3: CONEXIÓN AL F22")
    print("-" * 40)
    
    try:
        dll = ctypes.WinDLL("../zkemkeeper.dll")
        
        # Configurar funciones
        dll.Connect_Net.argtypes = [ctypes.c_char_p, ctypes.c_int]
        dll.Connect_Net.restype = ctypes.c_bool
        dll.Disconnect.argtypes = []
        dll.Disconnect.restype = ctypes.c_bool
        
        # Intentar conexión
        ip = "192.168.1.201"
        port = 4370
        
        print(f"🔌 Conectando a {ip}:{port}...")
        ip_bytes = ip.encode('utf-8')
        connected = dll.Connect_Net(ip_bytes, port)
        
        if connected:
            print("✅ CONEXIÓN EXITOSA al F22")
            
            # Desconectar
            print("🔌 Desconectando...")
            dll.Disconnect()
            print("✅ Desconectado")
            
            return True
        else:
            print("❌ CONEXIÓN FALLÓ")
            print("📋 Verificar:")
            print("   • F22 encendido")
            print("   • IP correcta (192.168.1.201)")
            print("   • Puerto 4370 abierto")
            print("   • Red accesible")
            return False
            
    except Exception as e:
        print(f"❌ Error en conexión: {e}")
        return False

def test_device_info():
    """Prueba 4: Información del dispositivo"""
    print("\n🧪 PRUEBA 4: INFORMACIÓN DEL DISPOSITIVO")
    print("-" * 40)
    
    try:
        dll = ctypes.WinDLL("../zkemkeeper.dll")
        
        # Configurar funciones
        dll.Connect_Net.argtypes = [ctypes.c_char_p, ctypes.c_int]
        dll.Connect_Net.restype = ctypes.c_bool
        
        dll.GetFirmwareVersion.argtypes = [ctypes.c_char_p]
        dll.GetFirmwareVersion.restype = ctypes.c_bool
        
        dll.Disconnect.argtypes = []
        dll.Disconnect.restype = ctypes.c_bool
        
        # Conectar
        ip_bytes = "192.168.1.201".encode('utf-8')
        connected = dll.Connect_Net(ip_bytes, 4370)
        
        if not connected:
            print("❌ No se pudo conectar para obtener info")
            return False
        
        print("✅ Conectado - obteniendo información...")
        
        # Obtener firmware
        firmware_buffer = ctypes.create_string_buffer(100)
        firmware_success = dll.GetFirmwareVersion(firmware_buffer)
        
        if firmware_success:
            firmware = firmware_buffer.value.decode('utf-8')
            print(f"📱 Firmware: {firmware}")
        else:
            print("⚠️ No se pudo obtener firmware")
        
        # Desconectar
        dll.Disconnect()
        
        return True
        
    except Exception as e:
        print(f"❌ Error obteniendo info: {e}")
        return False

def check_python_version():
    """Verificar versión de Python"""
    print("🐍 VERIFICACIÓN DE PYTHON")
    print("-" * 40)
    print(f"Versión: {sys.version}")
    print(f"Arquitectura: {sys.maxsize > 2**32 and '64-bit' or '32-bit'}")
    
    if sys.maxsize > 2**32:
        print("⚠️ ADVERTENCIA: Usando Python 64-bit")
        print("📋 Para DLL 32-bit usar: C:/Python311-32/python.exe")
        return False
    else:
        print("✅ Python 32-bit - Compatible con DLL")
        return True

def main():
    """Función principal de pruebas"""
    print("=" * 60)
    print("🧪 PRUEBA BÁSICA DE DLL ZKTECO")
    print("=" * 60)
    print(f"📅 Fecha: 2025-06-19 01:23:56 UTC")
    print(f"👤 Usuario: luishdz04")
    print(f"🎯 Objetivo: Verificar DLL funcional")
    print("=" * 60)
    
    # Verificar Python
    if not check_python_version():
        print("\n💥 ERROR: Usar Python 32-bit para esta prueba")
        return
    
    # Cambiar al directorio correcto
    try:
        os.chdir(Path(__file__).parent)
        print(f"📁 Directorio actual: {os.getcwd()}")
    except:
        print("⚠️ No se pudo cambiar directorio")
    
    # Ejecutar pruebas
    tests = [
        ("Carga de DLL", test_dll_loading),
        ("Funciones básicas", test_basic_functions), 
        ("Conexión F22", test_f22_connection),
        ("Info dispositivo", test_device_info)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"💥 Error en {test_name}: {e}")
            results.append((test_name, False))
    
    # Resumen
    print("\n" + "=" * 60)
    print("📋 RESUMEN DE PRUEBAS")
    print("=" * 60)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASÓ" if result else "❌ FALLÓ"
        print(f"   {status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🏆 RESULTADO: {passed}/{len(results)} pruebas exitosas")
    
    if passed == len(results):
        print("🎉 ¡TODAS LAS PRUEBAS EXITOSAS!")
        print("🚀 DLL OFICIAL FUNCIONAL - LISTO PARA CONTROL REAL")
    elif passed >= 2:
        print("⚠️ DLL funcional pero con algunos problemas")
        print("🔧 Revisar configuración de red/F22")
    else:
        print("💥 PROBLEMAS CRÍTICOS con la DLL")
        print("🔧 Verificar instalación y archivos")
    
    input("\n📋 Presiona ENTER para salir...")

if __name__ == "__main__":
    main()