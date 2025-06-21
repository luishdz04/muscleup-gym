import win32com.client
import pythoncom

pythoncom.CoInitialize()
zkem = win32com.client.Dispatch("zkemkeeper.ZKEM")

if zkem.Connect_Net('192.168.1.201', 4370):
    print("✅ Conectado al F22\n")
    
    # Lista de parámetros importantes
    params = {
        1: "Administradores",
        2: "Algoritmo huella",
        3: "Tamaño huella",
        4: "Nivel seguridad",
        6: "Logs de asistencia",
        7: "Logs de operación",
        8: "Logs de usuarios",
        20: "Opciones de trabajo",
        23: "Control de puerta",
        24: "Control de acceso",
        25: "Tiempo de apertura",
        27: "Sensor de puerta",
        28: "Duración apertura",
        29: "Tipo de cerradura",
        30: "Multi-verificación",
        31: "Estado de emergencia",
        57: "Modo anti-passback",
        66: "Reverificar minutos",
        67: "Timezone 1",
        68: "Timezone 2", 
        69: "Timezone 3",
        79: "Modo verificación",
        87: "Wiegand formato",
        88: "Wiegand pulso"
    }
    
    print("📊 CONFIGURACIÓN ACTUAL DEL F22:")
    print("-" * 50)
    
    for param_id, param_name in params.items():
        try:
            value = 0
            if zkem.GetDeviceInfo(1, param_id, value):
                print(f"{param_id:3d} | {param_name:20s} | {value}")
        except:
            pass
    
    # Verificar funciones de control
    print("\n🔧 FUNCIONES DE CONTROL:")
    print("-" * 50)
    
    # Intentar métodos alternativos
    try:
        # Obtener modo de trabajo
        work_code = zkem.GetWorkCode()
        print(f"Código de trabajo: {work_code}")
    except:
        print("GetWorkCode no disponible")
    
    try:
        # Verificar ACUnlock
        print("\n🚪 Probando ACUnlock (NO debería abrir)...")
        result = zkem.ACUnlock(1, 1)  # 1 segundo
        print(f"ACUnlock resultado: {result}")
    except Exception as e:
        print(f"ACUnlock error: {e}")
    
    zkem.Disconnect()
    print("\n✅ Desconectado")
else:
    print("❌ No se pudo conectar")

pythoncom.CoUninitialize()