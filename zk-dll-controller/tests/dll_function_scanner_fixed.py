# 📁 tests/dll_function_scanner_fixed.py
# EJECUTAR CON: "C:\Python 32\python.exe" tests\dll_function_scanner_fixed.py

import ctypes
import ctypes.wintypes
import sys
import os
from pathlib import Path

def find_dll_location():
    """Encontrar la ubicación correcta de la DLL"""
    print("🔍 BUSCANDO zkemkeeper.dll...")
    
    # Posibles ubicaciones
    possible_locations = [
        # En el directorio del script
        "zkemkeeper.dll",
        "./zkemkeeper.dll",
        
        # En el directorio padre
        "../zkemkeeper.dll",
        
        # Rutas absolutas
        r"C:\Users\Muscle Up GYM\Desktop\muscleup-gym\zk-dll-controller\zkemkeeper.dll",
        r"C:\Users\Muscle Up GYM\Desktop\muscleup-gym\zk-access-agent\dll\zkemkeeper.dll",
        
        # En directorio actual
        os.path.join(os.getcwd(), "zkemkeeper.dll"),
        os.path.join(os.path.dirname(os.getcwd()), "zkemkeeper.dll"),
    ]
    
    print(f"📁 Directorio actual del script: {os.getcwd()}")
    print(f"📁 Directorio padre: {os.path.dirname(os.getcwd())}")
    
    for location in possible_locations:
        print(f"   🔍 Probando: {location}")
        
        if os.path.exists(location):
            abs_path = os.path.abspath(location)
            print(f"   ✅ ENCONTRADA: {abs_path}")
            return abs_path
        else:
            print(f"   ❌ No existe")
    
    print("💥 zkemkeeper.dll NO ENCONTRADA en ninguna ubicación")
    return None

def scan_dll_functions():
    """Escanear funciones disponibles en la DLL"""
    print("\n🔍 ESCANEANDO FUNCIONES EN zkemkeeper.dll")
    print("=" * 60)
    
    # Encontrar DLL
    dll_path = find_dll_location()
    
    if not dll_path:
        print("❌ No se puede continuar sin la DLL")
        return []
    
    try:
        print(f"📁 Cargando: {dll_path}")
        
        # Usar ruta absoluta
        dll = ctypes.WinDLL(dll_path)
        print("✅ DLL cargada exitosamente")
        
        # Lista de funciones comunes de ZKTeco
        common_functions = [
            # Conexión básica (variantes)
            "Connect_Net",
            "Connect_Com", 
            "Disconnect",
            "Connect",
            "ConnectNet",
            "ConnectTCP",
            "TCP_Connect_Net",
            
            # Control de dispositivo
            "ControlDevice",
            "SetDeviceInfo",
            "GetDeviceInfo",
            "EnableDevice",
            "DisableDevice",
            
            # Parámetros
            "SetDeviceParam",
            "GetDeviceParam",
            "SetDeviceInfo2",
            "GetDeviceInfo2",
            
            # Información
            "GetFirmwareVersion",
            "GetDeviceStatus",
            "GetSerialNumber",
            "GetSDKVersion",
            "About",
            
            # Control de puerta
            "UnlockDoor",
            "LockDoor", 
            "OpenDoor",
            "CloseDoor",
            
            # Datos y registros
            "GetAllUserID",
            "GetGeneralLogData",
            "GetAttendanceData",
            "ClearGLog",
            
            # Funciones alternativas comunes
            "PowerOnAllDevice",
            "PowerOffDevice",
            "RestartDevice",
            "GetDeviceTime",
            "SetDeviceTime",
            
            # Funciones específicas según versión
            "ReadGeneralLogData",
            "GetUserInfo",
            "SetUserInfo",
            "DeleteUser",
            
            # Funciones de red
            "SetCommPassword",
            "SetDeviceCommPwd",
            "GetPlatform",
            "GetDeviceName",
            "SetDeviceName"
        ]
        
        print(f"\n🧪 PROBANDO {len(common_functions)} FUNCIONES COMUNES:")
        print("-" * 60)
        
        found_functions = []
        missing_functions = []
        
        for func_name in common_functions:
            try:
                # Intentar acceder a la función
                func = getattr(dll, func_name)
                found_functions.append(func_name)
                print(f"✅ {func_name}")
            except AttributeError:
                missing_functions.append(func_name)
                print(f"❌ {func_name}")
        
        print(f"\n📊 RESUMEN:")
        print(f"✅ Funciones encontradas: {len(found_functions)}")
        print(f"❌ Funciones faltantes: {len(missing_functions)}")
        
        if found_functions:
            print(f"\n🎯 FUNCIONES DISPONIBLES:")
            for i, func in enumerate(found_functions):
                print(f"   {i+1:2d}. {func}")
                if i >= 19:  # Mostrar máximo 20
                    remaining = len(found_functions) - 20
                    if remaining > 0:
                        print(f"       ... y {remaining} más")
                    break
        
        return found_functions, dll_path
        
    except Exception as e:
        print(f"❌ Error escaneando DLL: {e}")
        print(f"💡 Posibles causas:")
        print(f"   • DLL corrupta o incompleta")
        print(f"   • DLL de arquitectura incorrecta")
        print(f"   • Dependencias faltantes")
        return [], None

def test_working_connection(found_functions, dll_path):
    """Probar conexión con funciones encontradas"""
    if not found_functions:
        return None
    
    print(f"\n🔧 PROBANDO CONEXIONES REALES")
    print("-" * 60)
    
    # Funciones de conexión a probar
    connection_functions = [
        "Connect_Net",
        "ConnectNet", 
        "Connect",
        "ConnectTCP",
        "TCP_Connect_Net"
    ]
    
    available_connections = [f for f in connection_functions if f in found_functions]
    
    if not available_connections:
        print("❌ No hay funciones de conexión disponibles")
        return None
    
    print(f"🎯 Funciones de conexión disponibles: {available_connections}")
    
    dll = ctypes.WinDLL(dll_path)
    
    for func_name in available_connections:
        print(f"\n🧪 Probando {func_name}...")
        
        try:
            func = getattr(dll, func_name)
            
            # Configurar tipos según función
            if func_name == "Connect_Net":
                func.argtypes = [ctypes.c_char_p, ctypes.c_int]
                func.restype = ctypes.c_bool
            elif func_name in ["ConnectNet", "ConnectTCP", "TCP_Connect_Net"]:
                func.argtypes = [ctypes.c_char_p, ctypes.c_int]
                func.restype = ctypes.c_bool
            elif func_name == "Connect":
                # Puede tener diferentes firmas
                func.argtypes = [ctypes.c_char_p, ctypes.c_int, ctypes.c_int]
                func.restype = ctypes.c_bool
            
            print(f"   ✅ {func_name} configurada")
            
            # Probar conexión real
            print(f"   🔌 Conectando a F22...")
            
            if func_name == "Connect":
                # Connect a veces necesita 3 parámetros
                connected = func(b"192.168.1.201", 4370, 0)
            else:
                connected = func(b"192.168.1.201", 4370)
            
            if connected:
                print(f"   🎉 ¡CONEXIÓN EXITOSA CON {func_name}!")
                
                # Intentar desconectar
                if "Disconnect" in found_functions:
                    disconnect_func = getattr(dll, "Disconnect")
                    disconnect_func.argtypes = []
                    disconnect_func.restype = ctypes.c_bool
                    result = disconnect_func()
                    print(f"   ✅ Desconectado: {result}")
                
                return func_name
            else:
                print(f"   ❌ {func_name} no pudo conectar")
                
        except Exception as e:
            print(f"   💥 Error con {func_name}: {e}")
    
    return None

def main():
    """Función principal"""
    print("=" * 70)
    print("🔍 EXPLORADOR DE FUNCIONES DLL (VERSIÓN CORREGIDA)")
    print("=" * 70)
    print(f"📅 {sys.argv[0] if len(sys.argv) > 0 else 'Script'}")
    print(f"👤 Usuario: luishdz04")
    print("=" * 70)
    
    # Escanear funciones
    found_functions, dll_path = scan_dll_functions()
    
    if not found_functions:
        print("\n💥 ERROR CRÍTICO: No se pudieron escanear funciones")
        print("📋 VERIFICACIONES NECESARIAS:")
        print("   1. ¿Está zkemkeeper.dll en el directorio correcto?")
        print("   2. ¿Es la DLL correcta (32-bit)?")
        print("   3. ¿Están las dependencias instaladas?")
        
        input("\n📋 Presiona ENTER para salir...")
        return
    
    # Probar conexiones
    working_function = test_working_connection(found_functions, dll_path)
    
    print(f"\n" + "=" * 70)
    print("🎯 RESULTADOS FINALES")
    print("=" * 70)
    
    print(f"📁 DLL encontrada en: {dll_path}")
    print(f"✅ Funciones totales: {len(found_functions)}")
    
    if working_function:
        print(f"🎉 FUNCIÓN DE CONEXIÓN FUNCIONAL: {working_function}")
        print(f"🚀 ¡DLL COMPLETAMENTE OPERATIVA!")
        print(f"🔧 Usar '{working_function}' en lugar de 'Connect_Net'")
    else:
        print(f"⚠️ DLL carga pero las conexiones fallan")
        print(f"🔧 Revisar configuración de red F22")
    
    print(f"\n📋 Próximo paso: Adaptar código con función que funciona")
    
    input("\n📋 Presiona ENTER para salir...")

if __name__ == "__main__":
    main()