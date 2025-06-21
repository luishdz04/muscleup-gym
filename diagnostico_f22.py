#!/usr/bin/env python3
"""
Servicio F22 v5.3 DIAGNÓSTICO SIN APERTURA DE PUERTA
DESACTIVA el control automático del dispositivo
"""

import asyncio
import json
import logging
import os
import win32com.client
import pythoncom
from dotenv import load_dotenv
from datetime import datetime
import threading
import time

# Cargar variables de entorno
load_dotenv('.env.local')

# Configuración mínima
CONFIG = {
    'ip': '192.168.1.201',
    'port': 4370,
    'machine_number': 1,
    'timeout': 10,
    'unlock_delay': 3,
    'door_control_enabled': False,  # 🔴 DESHABILITADO PARA PRUEBAS
}

# Logging simple
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('f22_diagnostico')

class DiagnosticThread(threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
        self.daemon = True
        self.running = False
        self.connected = False
        self.zkem = None
        self.zkem_control = None
        self.event_count = 0

    def disable_auto_access_control(self):
        """DESACTIVA el control de acceso automático del dispositivo"""
        try:
            logger.info("[CONFIG] 🔧 Desactivando control automático...")
            
            # Intentar desactivar el control de acceso automático
            try:
                # Opción 1: Desactivar función AC
                if hasattr(self.zkem_control, 'SetACFun'):
                    result = self.zkem_control.SetACFun(CONFIG['machine_number'], 0)
                    logger.info(f"[CONFIG] SetACFun(0): {result}")
            except Exception as e:
                logger.warning(f"[CONFIG] ⚠️ SetACFun falló: {e}")

            # Intentar configurar modo manual
            try:
                # Opción 2: Configurar opciones del sistema
                if hasattr(self.zkem_control, 'SetSysOption'):
                    # Desactivar verificación automática
                    result1 = self.zkem_control.SetSysOption(CONFIG['machine_number'], "~ExtendFmt", "0")
                    result2 = self.zkem_control.SetSysOption(CONFIG['machine_number'], "~IsABCFmt", "0")
                    result3 = self.zkem_control.SetSysOption(CONFIG['machine_number'], "AccGroup", "0")
                    logger.info(f"[CONFIG] SysOptions: {result1}, {result2}, {result3}")
            except Exception as e:
                logger.warning(f"[CONFIG] ⚠️ SetSysOption falló: {e}")

            # Intentar desactivar alarmas y sonidos automáticos
            try:
                if hasattr(self.zkem_control, 'SetDoorSensorState'):
                    result = self.zkem_control.SetDoorSensorState(CONFIG['machine_number'], 0, 0, 0)
                    logger.info(f"[CONFIG] SetDoorSensorState: {result}")
            except Exception as e:
                logger.warning(f"[CONFIG] ⚠️ SetDoorSensorState falló: {e}")

            logger.info("[CONFIG] ✅ Configuración de desactivación completada")

        except Exception as e:
            logger.error(f"[CONFIG] ❌ Error desactivando control automático: {e}")

    def simulate_door_open(self):
        """SIMULA la apertura de puerta - NO ejecuta ACUnlock"""
        try:
            if CONFIG['door_control_enabled']:
                success = self.zkem_control.ACUnlock(CONFIG['machine_number'], CONFIG['unlock_delay'])
                if success:
                    logger.info(f"[ACCESS] ✅ ¡PUERTA ABIERTA! (Delay: {CONFIG['unlock_delay']}s)")
                    return True
                else:
                    error_code = 0
                    try:
                        self.zkem_control.GetLastError(error_code)
                        logger.error(f"[ACCESS] ❌ ACUnlock falló - Error: {error_code}")
                    except:
                        logger.error("[ACCESS] ❌ ACUnlock falló - Error desconocido")
                    return False
            else:
                # 🔴 MODO SIMULACIÓN - NO ABRE LA PUERTA
                logger.info(f"[SIMULACIÓN] 🚪 PUERTA NO ABIERTA (Control deshabilitado)")
                logger.info(f"[SIMULACIÓN] 🔧 ACUnlock estaría disponible con delay: {CONFIG['unlock_delay']}s")
                return True
                
        except Exception as e:
            logger.error(f"[ACCESS] ❌ Error ejecutando ACUnlock: {e}")
            return False

    def test_door_functions(self):
        """Prueba funciones adicionales de control de acceso (MODO SIMULACIÓN)"""
        try:
            if CONFIG['door_control_enabled']:
                try:
                    self.zkem_control.CloseAlarm(CONFIG['machine_number'])
                    logger.info("[ACCESS] 🔔 CloseAlarm ejecutado")
                except Exception as e:
                    logger.warning(f"[ACCESS] ⚠️ CloseAlarm no disponible: {e}")

                try:
                    self.zkem_control.PlayVoice(CONFIG['machine_number'], 0)
                    logger.info("[ACCESS] 🔊 Sonido de acceso reproducido")
                except Exception as e:
                    logger.warning(f"[ACCESS] ⚠️ PlayVoice no disponible: {e}")
            else:
                # 🔴 MODO SIMULACIÓN
                logger.info("[SIMULACIÓN] 🔔 CloseAlarm disponible (no ejecutado)")
                logger.info("[SIMULACIÓN] 🔊 PlayVoice disponible (no ejecutado)")

        except Exception as e:
            logger.warning(f"[ACCESS] ⚠️ Error en funciones adicionales: {e}")

    def run(self):
        try:
            pythoncom.CoInitialize()
            logger.info("[DIAG] ✅ COM inicializado")

            parent_thread = self

            class SimpleEventHandler:
                def OnAttTransactionEx(self, *args):
                    parent_thread.event_count += 1
                    logger.info(f"[EVENT] 🎯 EVENTO {parent_thread.event_count} RECIBIDO!")
                    if args:
                        logger.info(f"[EVENT] Usuario: {args[0]}")
                        logger.info(f"[EVENT] Válido: {not args[1] if len(args) > 1 else 'N/A'}")
                        logger.info(f"[EVENT] Método: {args[3] if len(args) > 3 else 'N/A'}")

                    # 🔴 MODO SIMULACIÓN - NO ABRE LA PUERTA
                    logger.info("[ACCESS] 🔓 Simulando control de acceso...")
                    success = parent_thread.simulate_door_open()
                    
                    if success:
                        parent_thread.test_door_functions()
                        logger.info("[ACCESS] 🎉 ¡DETECCIÓN EXITOSA! (Sin apertura de puerta)")
                    else:
                        logger.error("[ACCESS] ❌ Error en simulación")

                def OnVerify(self, *args):
                    logger.info(f"[EVENT] 🔍 OnVerify: {args}")

                def OnFinger(self):
                    logger.info(f"[EVENT] 👏 Dedo detectado!")

                def OnEnrollFinger(self, *args):
                    logger.info(f"[EVENT] 📝 OnEnrollFinger: {args}")

                def OnDoor(self, EventType):
                    logger.info(f"[EVENT] 🚪 Evento de puerta: {EventType}")
                    # 🚨 DETECTAR SI LA PUERTA SE ABRE AUTOMÁTICAMENTE
                    if EventType == 53:  # Puerta abierta
                        logger.warning("[ALERT] 🚨 ¡PUERTA ABIERTA AUTOMÁTICAMENTE!")
                        logger.warning("[ALERT] 🔧 El dispositivo tiene control automático activado")

            # ============ CREAR OBJETOS ============
            logger.info("[DIAG] 🔧 Creando objetos COM...")
            self.zkem_control = win32com.client.Dispatch("zkemkeeper.ZKEM")
            self.zkem = win32com.client.DispatchWithEvents("zkemkeeper.ZKEM", SimpleEventHandler)

            # ============ CONFIGURAR TIMEOUTS ============
            try:
                if hasattr(self.zkem, 'SetCommTimeOut'):
                    self.zkem.SetCommTimeOut(CONFIG['timeout'] * 1000)
                if hasattr(self.zkem_control, 'SetCommTimeOut'):
                    self.zkem_control.SetCommTimeOut(CONFIG['timeout'] * 1000)
                logger.info("[DIAG] ✅ Timeouts configurados")
            except Exception as e:
                logger.warning(f"[DIAG] ⚠️ Error configurando timeout: {e}")

            logger.info(f"[DIAG] 🔗 Conectando a {CONFIG['ip']}:{CONFIG['port']}...")

            # ============ CONECTAR OBJETOS ============
            try:
                if self.zkem.Connect_Net(CONFIG['ip'], CONFIG['port']):
                    self.connected = True
                    logger.info("[DIAG] ✅ Objeto de eventos conectado")
                else:
                    logger.error("[DIAG] ❌ Error conectando eventos")
                    return
            except Exception as e:
                logger.error(f"[DIAG] ❌ Excepción conectando eventos: {e}")
                return

            try:
                if self.zkem_control.Connect_Net(CONFIG['ip'], CONFIG['port']):
                    logger.info("[DIAG] ✅ Objeto de control conectado")
                else:
                    logger.warning("[DIAG] ⚠️ Error conectando control")
            except Exception as e:
                logger.warning(f"[DIAG] ⚠️ Error conectando control: {e}")

            # ============ CONFIGURACIÓN ============
            try:
                logger.info("[DIAG] 🔧 Configurando sistema...")

                # Habilitar eventos en tiempo real
                if self.zkem.SetSysOption(CONFIG['machine_number'], "Realtime", "1"):
                    logger.info("[DIAG] ✅ Realtime habilitado")

                if self.zkem.RegEvent(CONFIG['machine_number'], 65535):
                    logger.info("[DIAG] ✅ Eventos registrados")

                # Habilitar dispositivo para recibir comandos
                if self.zkem_control.EnableDevice(CONFIG['machine_number'], True):
                    logger.info("[DIAG] ✅ Dispositivo habilitado para comandos")
                else:
                    logger.warning("[DIAG] ⚠️ Error habilitando dispositivo")

                # 🔧 NUEVO: DESACTIVAR CONTROL AUTOMÁTICO
                self.disable_auto_access_control()

            except Exception as e:
                logger.error(f"[DIAG] Error en configuración: {e}")

            # ============ INFORMACIÓN DEL DISPOSITIVO ============
            try:
                serial = self.zkem.GetSerialNumber(CONFIG['machine_number'])
                if serial and isinstance(serial, tuple) and serial[0]:
                    logger.info(f"[DIAG] 📋 Serial: {serial[1]}")
                else:
                    logger.info(f"[DIAG] 📋 Serial: {serial}")
            except Exception as e:
                logger.warning(f"[DIAG] ⚠️ Error obteniendo serial: {e}")

            # Verificar capacidades
            try:
                has_access_control = self.zkem_control.GetACFun(CONFIG['machine_number'])
                logger.info(f"[DIAG] 🔐 Control de acceso: {has_access_control}")
            except Exception as e:
                logger.warning(f"[DIAG] ⚠️ Error verificando AC: {e}")

            # ============ PRUEBA INICIAL (SIMULACIÓN) ============
            logger.info("[DIAG] 🧪 Probando simulación de ACUnlock...")
            test_result = self.simulate_door_open()
            if test_result:
                logger.info("[DIAG] ✅ Simulación funciona correctamente")
            else:
                logger.warning("[DIAG] ⚠️ Error en simulación, pero continuando...")

            # ============ LOOP PRINCIPAL ============
            self.running = True
            logger.info("[DIAG] 🔄 Loop iniciado - PON TU DEDO EN EL F22")
            logger.info("[DIAG] 🔴 MODO SIMULACIÓN: NO SE DEBE ABRIR LA PUERTA")
            logger.info("[DIAG] 🚨 Monitoreando si el dispositivo abre automáticamente...")
            logger.info("[DIAG] 👏 Esperando eventos COM...")

            heartbeat_count = 0
            start_time = time.time()

            while self.running and (time.time() - start_time) < 60:
                try:
                    pythoncom.PumpWaitingMessages()

                    if heartbeat_count % 500 == 0:
                        elapsed = int(time.time() - start_time)
                        if self.zkem and self.connected:
                            logger.info(f"[DIAG] 💓 Heartbeat OK ({elapsed}s) - Eventos: {self.event_count}")

                    heartbeat_count += 1
                    time.sleep(0.01)

                except Exception as e:
                    logger.error(f"[DIAG] Error en loop: {e}")
                    time.sleep(1)

            if self.event_count > 0:
                logger.info(f"[RESULTADO] 🎉 ¡ÉXITO! {self.event_count} eventos procesados")
            else:
                logger.warning(f"[RESULTADO] ❌ No se recibieron eventos en 60 segundos")

        except Exception as e:
            logger.error(f"[DIAG] Error crítico: {e}")
        finally:
            try:
                if self.zkem and self.connected:
                    self.zkem.Disconnect()
                    logger.info("[DIAG] 🔌 Eventos desconectados")
                
                if self.zkem_control:
                    self.zkem_control.Disconnect()
                    logger.info("[DIAG] 🔌 Control desconectado")
                    
                pythoncom.CoUninitialize()
            except:
                pass
            logger.info("[DIAG] 🔺 Thread finalizado")

    def stop(self):
        self.running = False

async def main_diagnostic():
    logger.info("[STARTUP] F22 DIAGNÓSTICO - DESACTIVANDO CONTROL AUTOMÁTICO")
    logger.info(f"[INFO] Dispositivo: {CONFIG['ip']}:{CONFIG['port']}")
    logger.info(f"[INFO] Control de puerta: {'HABILITADO' if CONFIG['door_control_enabled'] else '🔴 DESHABILITADO'}")
    logger.info(f"[INFO] Objetivo: DETECTAR huellas SIN abrir puerta")

    diag_thread = DiagnosticThread()
    diag_thread.start()

    for i in range(10):
        if diag_thread.connected:
            break
        await asyncio.sleep(1)
        if i < 5:
            logger.info(f"[WAIT] Esperando conexión... {i+1}/10")

    if not diag_thread.connected:
        logger.error("[ERROR] ❌ No se pudo conectar en 10 segundos")
        diag_thread.stop()
        return

    logger.info("[READY] ✅ Sistema listo y conectado")
    logger.info("[TEST] 🚨 VERIFICANDO: ¿Se abre la puerta automáticamente?")
    logger.info("[TEST] 👏 PON TU DEDO EN EL F22")
    logger.info("[TEST] 🔍 Monitoreando por 60 segundos...")

    start_time = time.time()
    last_event_count = 0

    for i in range(12):
        await asyncio.sleep(5)

        current_events = diag_thread.event_count
        elapsed = int(time.time() - start_time)

        if current_events > last_event_count:
            new_events = current_events - last_event_count
            logger.info(f"[SUCCESS] 🎉 ¡{new_events} NUEVOS EVENTOS! (Total: {current_events})")
            last_event_count = current_events
        else:
            logger.info(f"[STATUS] Esperando eventos... ({elapsed}s/60s) - Total: {current_events}")

        if current_events >= 3:
            logger.info(f"[EARLY_SUCCESS] ✅ Suficientes eventos recibidos ({current_events})")
            break

    diag_thread.stop()

    for i in range(3):
        if not diag_thread.is_alive():
            break
        await asyncio.sleep(1)

    total_events = diag_thread.event_count
    if total_events > 0:
        logger.info(f"[RESULTADO FINAL] ✅ EVENTOS DETECTADOS: {total_events}")
        logger.info(f"[RESULTADO FINAL] 🔧 ¿Se abrió la puerta automáticamente?")
    else:
        logger.info("[RESULTADO FINAL] ❌ NO SE RECIBIERON EVENTOS")

if __name__ == "__main__":
    try:
        asyncio.run(main_diagnostic())
    except KeyboardInterrupt:
        print("\n[INTERRUPT] Diagnóstico interrumpido")
    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        print("\n[FIN] Diagnóstico finalizado")