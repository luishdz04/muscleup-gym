"""
Script de un solo uso para crear un Super Administrador remoto en el F22.
Úsalo si has perdido el acceso al menú del dispositivo.
"""
import pythoncom
import win32com.client
import os
from dotenv import load_dotenv

# --- CONFIGURACIÓN DEL NUEVO ADMINISTRADOR ---
# Puedes cambiar estos valores si lo deseas
ADMIN_ID = "9999"
ADMIN_PASSWORD = "123456"
ADMIN_NAME = "Admin Temp"
PRIVILEGE_ADMIN = 3  # 3 es el nivel para Super Administrador

# --- Cargar configuración del dispositivo ---
load_dotenv('.env.local')

F22_IP = os.getenv('F22_IP', '192.168.1.201')
F22_PORT = int(os.getenv('F22_PORT', 4370))
F22_COMM_KEY = int(os.getenv('F22_COMM_KEY', 0))
MACHINE_NUMBER = 1

print("="*50)
print("--- SCRIPT PARA CREAR ADMINISTRADOR REMOTO ---")
print(f"Dispositivo: {F22_IP}:{F22_PORT}")
print(f"Nuevo Admin ID: {ADMIN_ID}")
print(f"Nuevo Admin Pass: {ADMIN_PASSWORD}")
print("="*50)

zkem = None
try:
    pythoncom.CoInitialize()
    zkem = win32com.client.Dispatch("zkemkeeper.ZKEM")

    print(f"🔑 Autenticando con CommKey: {F22_COMM_KEY}...")
    zkem.SetCommPassword(F22_COMM_KEY)

    print(f"🔗 Conectando al dispositivo...")
    if zkem.Connect_Net(F22_IP, F22_PORT):
        print("✅ Conexión exitosa.")
        
        # Deshabilitar dispositivo para escritura segura
        zkem.EnableDevice(MACHINE_NUMBER, False)
        
        print(f"✨ Creando usuario '{ADMIN_NAME}' con ID {ADMIN_ID}...")
        
        # Usamos SSR_SetUserInfo para crear/modificar el usuario
        if zkem.SSR_SetUserInfo(MACHINE_NUMBER, ADMIN_ID, ADMIN_NAME, ADMIN_PASSWORD, PRIVILEGE_ADMIN, True):
            print("✅ ¡Usuario administrador creado/actualizado exitosamente!")
            
            # Refrescar los datos en el dispositivo para que los cambios surtan efecto
            zkem.RefreshData(MACHINE_NUMBER)
            print("🔄 Datos guardados en el dispositivo.")
            
        else:
            error_code = 0
            zkem.GetLastError(error_code)
            print(f"❌ ERROR: No se pudo crear el usuario. Código de error: {error_code}")
            
        # Rehabilitar el dispositivo
        zkem.EnableDevice(MACHINE_NUMBER, True)
        
    else:
        error_code = 0
        zkem.GetLastError(error_code)
        print(f"❌ ERROR: No se pudo conectar al dispositivo. Código de error: {error_code}")
        print("   Asegúrate de que la IP y la CommKey en tu archivo .env.local son correctas.")

except Exception as e:
    print(f"🚨 Ocurrió un error inesperado: {e}")

finally:
    if zkem:
        zkem.Disconnect()
        print("🔌 Desconectado.")
    pythoncom.CoUninitialize()
    print("--- Script finalizado ---")
