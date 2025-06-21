import win32com.client
import pythoncom
import time

pythoncom.CoInitialize()
zkem = win32com.client.Dispatch("zkemkeeper.ZKEM")

if zkem.Connect_Net('192.168.1.201', 4370):
    print("✅ Conectado al F22")
    
    # Probar diferentes métodos de control
    print("\n1️⃣ Probando EnableDevice...")
    try:
        result = zkem.EnableDevice(1, False)
        print(f"   EnableDevice(False): {result}")
        time.sleep(1)
        result = zkem.EnableDevice(1, True)
        print(f"   EnableDevice(True): {result}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n2️⃣ Probando ClearKeeperData...")
    try:
        result = zkem.ClearKeeperData(1)
        print(f"   ClearKeeperData: {result}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n3️⃣ Probando GetDeviceStatus...")
    try:
        for status in [1, 2, 3, 6, 21, 22]:
            value = 0
            if zkem.GetDeviceStatus(1, status, value):
                print(f"   Status {status}: {value}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n4️⃣ Verificando usuarios con acceso...")
    try:
        if zkem.ReadAllUserID(1):
            count = 0
            while True:
                user_id = ""
                name = ""
                password = ""
                privilege = 0
                enabled = False
                
                if zkem.GetAllUserInfo(1, user_id, name, password, privilege, enabled):
                    if enabled and user_id:
                        count += 1
                        print(f"   Usuario activo: {user_id} - {name}")
                        if count > 10:  # Limitar output
                            print("   ... (más usuarios)")
                            break
                else:
                    break
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n5️⃣ Probando lectura de logs en tiempo real...")
    try:
        if zkem.ReadRTLog(1):
            print("   ReadRTLog: OK")
            
            # Leer algunos logs
            count = 0
            while count < 5:
                dwEnrollNumber = 0
                dwVerifyMode = 0
                dwInOutMode = 0
                dwYear = 0
                dwMonth = 0
                dwDay = 0
                dwHour = 0
                dwMinute = 0
                dwSecond = 0
                dwWorkcode = 0
                
                if zkem.GetRTLog(1, dwEnrollNumber, dwVerifyMode, dwInOutMode, 
                                dwYear, dwMonth, dwDay, dwHour, dwMinute, dwSecond, dwWorkcode):
                    print(f"   Log: Usuario {dwEnrollNumber} - {dwYear}/{dwMonth}/{dwDay} {dwHour}:{dwMinute}:{dwSecond}")
                    count += 1
                else:
                    break
    except Exception as e:
        print(f"   ReadRTLog error: {e}")
    
    zkem.Disconnect()
    print("\n✅ Pruebas completadas")
else:
    print("❌ No se pudo conectar")

pythoncom.CoUninitialize()