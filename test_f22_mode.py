import win32com.client
import pythoncom

pythoncom.CoInitialize()
zkem = win32com.client.Dispatch("zkemkeeper.ZKEM")

if zkem.Connect_Net('192.168.1.201', 4370):
    print("✅ Conectado al F22")
    
    # Verificar modo de acceso
    machine_number = 1
    
    # Intentar obtener configuración actual
    try:
        # Verificar si el control de acceso está activo
        value = 0
        if zkem.GetDeviceInfo(machine_number, 24, value):
            print(f"📊 Control de acceso del dispositivo (24): {value}")
        
        if zkem.GetDeviceInfo(machine_number, 79, value):
            print(f"📊 Modo de verificación (79): {value}")
            
        # Intentar desactivar control interno
        print("\n🔧 Desactivando control interno...")
        zkem.SetDeviceInfo(machine_number, 24, 0)
        zkem.SetDeviceInfo(machine_number, 79, 0)
        
        print("✅ Control interno desactivado")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    zkem.Disconnect()
else:
    print("❌ No se pudo conectar")

pythoncom.CoUninitialize()