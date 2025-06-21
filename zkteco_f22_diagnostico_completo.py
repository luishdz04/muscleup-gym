import win32com.client
import pythoncom
import time
from datetime import datetime
import sys
import win32event

# Constantes
MACHINE_NUMBER = 1

# Implementación correcta de eventos COM para Python
class ZKTecoEvents:
    def __init__(self):
        self.log_count = 0
        
    # Los eventos deben tener la firma correcta según la definición COM
    def OnAttTransaction(self, enrollNumber, isInValid, attState, verifyMethod, year, month, day, hour, minute, second):
        """Evento antiguo de marcajes (mejor compatibilidad)"""
        self.log_count += 1
        timestamp = f"{year}-{month:02d}-{day:02d} {hour:02d}:{minute:02d}:{second:02d}"
        
        print(f"\n⏱️ MARCAJE DETECTADO #{self.log_count} (OnAttTransaction)")
        print(f"   Usuario: {enrollNumber}")
        print(f"   Tiempo: {timestamp}")
        print(f"   Estado: {attState}")
        print(f"   Método: {verifyMethod}")
        print(f"   Válido: {'No' if isInValid else 'Sí'}")
        
    def OnAlarm(self, alarmType, enrollNumber, verified):
        """Evento de alarma"""
        print(f"\n🚨 ALARMA: Tipo={alarmType}, Usuario={enrollNumber}, Verificado={verified}")
        
    def OnDoor(self, eventType):
        """Evento de puerta"""
        door_events = {1: "Abierta", 2: "Cerrada", 3: "Forzada", 4: "Alarma"}
        event_name = door_events.get(eventType, f"Evento {eventType}")
        print(f"\n🚪 PUERTA: {event_name}")
        
    def OnHIDNum(self, cardNumber):
        """Evento de tarjeta"""
        print(f"\n💳 TARJETA: {cardNumber}")
        
    def OnEnrollFinger(self, enrollNumber, fingerIndex, actionResult, templateLength):
        """Evento de enrolamiento de huella"""
        print(f"\n👆 HUELLA: Usuario={enrollNumber}, Dedo={fingerIndex}, Resultado={actionResult}")
        
    def OnVerify(self, userId):
        """Evento de verificación de usuario"""
        print(f"\n✅ VERIFICACIÓN: Usuario={userId}")
        
    def OnFingerFeature(self, score):
        """Evento de calidad de huella"""
        print(f"\n👆 CALIDAD DE HUELLA: {score}")
        
    def OnNewUser(self, enrollNumber):
        """Evento de nuevo usuario"""
        print(f"\n👤 NUEVO USUARIO: {enrollNumber}")
        
    def OnConnected(self):
        """Evento cuando se conecta el dispositivo"""
        print("\n🔌 DISPOSITIVO CONECTADO")
        
    def OnDisConnected(self):
        """Evento cuando se desconecta el dispositivo"""
        print("\n🔌 DISPOSITIVO DESCONECTADO")
        
    def OnEMData(self, dataType, dataLen, dataBuffer):
        """Evento de datos EM"""
        print(f"\n📊 DATOS EM: Tipo={dataType}, Longitud={dataLen}")

def main():
    """Función principal"""
    print("\n" + "="*70)
    print(" 🔍 ZKTeco F22 - Monitoreo de Eventos (Implementación correcta)")
    print(" Basado en: github.com/hmojicag/NetFrameworkZKTecoAttLogsDemo")
    print("="*70)
    
    # IMPORTANTE: Inicializar COM
    pythoncom.CoInitialize()
    
    try:
        # Crear objeto COM CON soporte de eventos (esta es la forma correcta)
        print("\n⚙️ Inicializando SDK con soporte de eventos...")
        # Esta es la técnica correcta para eventos COM en Python
        handler = ZKTecoEvents()
        zk = win32com.client.DispatchWithEvents("zkemkeeper.ZKEM", ZKTecoEvents)
        
        # Conectar al dispositivo
        ip = "192.168.1.201"
        port = 4370
        print(f"📡 Conectando a {ip}:{port}...")
        
        connected = zk.Connect_Net(ip, port)
        if not connected:
            print("❌ Falló la conexión")
            return
            
        print("✅ Conectado exitosamente")
        
        # Información básica
        print("\n📱 INFORMACIÓN DEL DISPOSITIVO")
        print("-" * 50)
        
        # Firmware
        tmp = ""
        if zk.GetFirmwareVersion(MACHINE_NUMBER, tmp):
            firmware = zk.GetFirmwareVersion(MACHINE_NUMBER, "")[1]
            print(f"   Firmware: {firmware}")
        
        # Número de serie
        tmp = ""
        if zk.GetSerialNumber(MACHINE_NUMBER, tmp):
            serial = zk.GetSerialNumber(MACHINE_NUMBER, "")[1]
            print(f"   Número de Serie: {serial}")
        
        # Configurar eventos en tiempo real
        print("\n⏰ CONFIGURANDO EVENTOS EN TIEMPO REAL")
        print("-" * 50)
        
        # Paso 1: Deshabilitar dispositivo
        print("   Deshabilitando dispositivo...")
        if not zk.EnableDevice(MACHINE_NUMBER, False):
            print("❌ No se pudo deshabilitar el dispositivo")
            zk.Disconnect()
            return
        
        # Paso 2: Registrar para recibir eventos - CRÍTICO
        print("   Registrando eventos en el dispositivo...")
        if not zk.RegEvent(MACHINE_NUMBER, 65535):  # 65535 = todos los eventos
            print("⚠️ RegEvent retornó False (pero continuamos)")
        
        # Paso 3: Habilitar el dispositivo nuevamente
        print("   Habilitando dispositivo...")
        if not zk.EnableDevice(MACHINE_NUMBER, True):
            print("❌ No se pudo habilitar el dispositivo")
            zk.Disconnect()
            return
        
        # Paso 4: Monitorear eventos
        print("\n🔍 MONITOREO DE EVENTOS EN TIEMPO REAL INICIADO")
        print("   Marcaje en el dispositivo ahora para ver eventos...")
        print("   Presiona Ctrl+C para detener")
        
        # Crear mensaje de espera
        event_message = """
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ESPERANDO EVENTOS DEL DISPOSITIVO ZKTECO F22...          ║
║                                                            ║
║   1. Acércate al dispositivo                               ║
║   2. Coloca tu huella/tarjeta/rostro                       ║
║   3. El evento aparecerá en esta ventana                   ║
║                                                            ║
║   PRESIONA CTRL+C PARA DETENER                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
"""
        print(event_message)
        
        try:
            start_time = time.time()
            while True:
                # Esta línea es CRÍTICA para procesar eventos COM
                pythoncom.PumpWaitingMessages()
                
                # Mostrar tiempo transcurrido
                elapsed = int(time.time() - start_time)
                sys.stdout.write(f"\rTiempo de monitoreo: {elapsed} segundos   ")
                sys.stdout.flush()
                
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print("\n\n⏹️ Monitoreo detenido por el usuario")
        
        # Desconectar
        print("\n🔌 Desconectando dispositivo...")
        zk.Disconnect()
        print("✅ Desconectado correctamente")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        pythoncom.CoUninitialize()

if __name__ == "__main__":
    main()