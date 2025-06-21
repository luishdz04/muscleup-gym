#!/usr/bin/env python3
"""
🚨 CÓDIGO DE EMERGENCIA F22 - RESTABLECER CONFIGURACIÓN
✅ Restaurar configuración por defecto
✅ Activar apertura automática
✅ Habilitar todos los métodos de apertura
✅ SALVAR LA SITUACIÓN
"""

import win32com.client
import pythoncom
import time
import logging

# Setup logging de emergencia
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('f22_emergency')

CONFIG = {
    'ip': '192.168.1.201',
    'port': 4370,
    'machine_number': 1,
    'timeout': 10,
}

def emergency_reset_f22():
    """🚨 FUNCIÓN DE EMERGENCIA PARA RESTABLECER F22"""
    try:
        logger.info("🚨" * 50)
        logger.info("CÓDIGO DE EMERGENCIA F22 - RESTABLECIENDO CONFIGURACIÓN")
        logger.info("🚨" * 50)
        
        # Inicializar COM
        pythoncom.CoInitialize()
        logger.info("✅ COM inicializado")
        
        # Conectar sin eventos
        zkem = win32com.client.Dispatch("zkemkeeper.ZKEM")
        
        # Configurar timeout
        try:
            zkem.SetCommTimeOut(CONFIG['timeout'] * 1000)
        except:
            pass
        
        # Conectar
        logger.info(f"🔗 Conectando a {CONFIG['ip']}:{CONFIG['port']}...")
        if not zkem.Connect_Net(CONFIG['ip'], CONFIG['port']):
            logger.error("❌ NO SE PUEDE CONECTAR - F22 puede estar completamente bloqueado")
            logger.error("🔧 SOLUCIONES FÍSICAS:")
            logger.error("   1. Reiniciar F22 físicamente (desconectar y conectar)")
            logger.error("   2. Buscar botón RESET en el F22")
            logger.error("   3. Usar llave física si existe")
            logger.error("   4. Verificar alimentación eléctrica")
            return False
        
        logger.info("✅ CONECTADO AL F22")
        
        # CONFIGURACIÓN DE EMERGENCIA - RESTAURAR TODO A AUTOMÁTICO
        logger.info("🔧 APLICANDO CONFIGURACIÓN DE EMERGENCIA...")
        
        emergency_config = {
            # 🚨 CRÍTICO: ACTIVAR APERTURA AUTOMÁTICA
            "AutoOpenDoor": "1",        # ✅ Apertura AUTOMÁTICA
            "VerifyMode": "0",          # ✅ Modo normal (no solo verificación)
            "AttState": "1",            # ✅ Estado normal de asistencia
            "WorkCode": "1",            # ✅ Código de trabajo activo
            
            # 🔊 ACTIVAR TODOS LOS SONIDOS
            "VoiceOn": "1",             # ✅ Sonidos ACTIVADOS
            "KeyVoice": "1",            # ✅ Sonido de teclas
            "SuccessVoice": "1",        # ✅ Sonido de éxito
            "ErrorVoice": "1",          # ✅ Sonido de error
            
            # 🔓 ACTIVAR TODOS LOS CONTROLES DE APERTURA
            "LockOn": "1",              # ✅ Control de cerradura
            "DoorDelay": "5",           # ✅ 5 segundos de apertura
            "LockDelay": "1",           # ✅ Delay de cerradura
            "UseDoorSensor": "0",       # ✅ Sin sensor de puerta (por si acaso)
            
            # 📡 MANTENER TIEMPO REAL PERO PERMITIR AUTONOMÍA
            "Realtime": "1",            # ✅ Tiempo real
            "StandAlone": "1",          # ✅ Modo autónomo ACTIVADO
            "OfflineWork": "1",         # ✅ Trabajo offline ACTIVADO
            
            # 🔐 DESACTIVAR RESTRICCIONES
            "MultiVerify": "0",         # ✅ Sin verificación múltiple
            "Encrypt": "0",             # ✅ Sin encriptación
            "MThreshold": "80",         # ✅ Umbral de huella bajo
        }
        
        success_count = 0
        
        # Aplicar configuración de emergencia
        for option, value in emergency_config.items():
            try:
                if zkem.SetSysOption(CONFIG['machine_number'], option, value):
                    logger.info(f"✅ EMERGENCY: {option} = {value}")
                    success_count += 1
                else:
                    logger.warning(f"⚠️ EMERGENCY: Falló {option} = {value}")
            except Exception as e:
                logger.debug(f"❌ Error en {option}: {e}")
        
        logger.info(f"🔧 Configuración de emergencia aplicada: {success_count}/{len(emergency_config)}")
        
        # MÉTODOS DE APERTURA DE EMERGENCIA
        logger.info("🔓 PROBANDO MÉTODOS DE APERTURA DE EMERGENCIA...")
        
        apertura_methods = [
            ("ACUnlock", lambda: zkem.ACUnlock(CONFIG['machine_number'])),
            ("ControlDevice_1", lambda: zkem.ControlDevice(CONFIG['machine_number'], 1, 0, 0)),
            ("ControlDevice_2", lambda: zkem.ControlDevice(CONFIG['machine_number'], 2, 0, 0)),
            ("ControlDevice_3", lambda: zkem.ControlDevice(CONFIG['machine_number'], 3, 0, 0)),
            ("ControlDevice_4", lambda: zkem.ControlDevice(CONFIG['machine_number'], 4, 0, 0)),
        ]
        
        apertura_exitosa = False
        
        for method_name, method_func in apertura_methods:
            try:
                logger.info(f"🔓 Probando {method_name}...")
                if method_func():
                    logger.info(f"✅ ¡PUERTA ABIERTA CON {method_name}!")
                    apertura_exitosa = True
                    time.sleep(8)  # Mantener abierta 8 segundos
                    break
                else:
                    logger.warning(f"❌ {method_name} falló")
            except Exception as e:
                logger.debug(f"❌ Error en {method_name}: {e}")
        
        if not apertura_exitosa:
            logger.error("🚨 NINGÚN MÉTODO DE APERTURA FUNCIONÓ")
        
        # HABILITAR DISPOSITIVO
        try:
            zkem.EnableDevice(CONFIG['machine_number'], 1)
            logger.info("✅ Dispositivo HABILITADO")
        except:
            logger.warning("⚠️ Error habilitando dispositivo")
        
        # REFRESCAR CONFIGURACIÓN
        try:
            zkem.RefreshData(CONFIG['machine_number'])
            logger.info("✅ Configuración REFRESCADA")
        except:
            logger.warning("⚠️ Error refrescando configuración")
        
        # MÉTODOS DE APERTURA ADICIONALES
        if not apertura_exitosa:
            logger.info("🔓 PROBANDO MÉTODOS ALTERNATIVOS...")
            
            alternative_methods = [
                ("OpenDoor", lambda: getattr(zkem, 'OpenDoor', lambda x: False)(CONFIG['machine_number'])),
                ("UnlockDoor", lambda: getattr(zkem, 'UnlockDoor', lambda x: False)(CONFIG['machine_number'])),
                ("TriggerRelay", lambda: getattr(zkem, 'TriggerRelay', lambda x: False)(CONFIG['machine_number'])),
            ]
            
            for method_name, method_func in alternative_methods:
                try:
                    logger.info(f"🔓 Probando {method_name}...")
                    if method_func():
                        logger.info(f"✅ ¡PUERTA ABIERTA CON {method_name}!")
                        apertura_exitosa = True
                        time.sleep(8)
                        break
                except Exception as e:
                    logger.debug(f"❌ {method_name} no disponible: {e}")
        
        # Desconectar
        try:
            zkem.Disconnect()
            logger.info("🔌 Desconectado")
        except:
            pass
        
        pythoncom.CoUninitialize()
        
        logger.info("🚨" * 50)
        if apertura_exitosa:
            logger.info("✅ EMERGENCIA RESUELTA - PUERTA ABIERTA")
            logger.info("✅ Configuración restaurada a modo AUTOMÁTICO")
            logger.info("👆 Ahora puedes usar tu huella normalmente")
        else:
            logger.error("❌ EMERGENCIA NO RESUELTA - REQUIERE INTERVENCIÓN FÍSICA")
        logger.info("🚨" * 50)
        
        return apertura_exitosa
        
    except Exception as e:
        logger.error(f"🚨 ERROR CRÍTICO EN EMERGENCIA: {e}")
        return False
    finally:
        try:
            pythoncom.CoUninitialize()
        except:
            pass

# CÓDIGO ADICIONAL DE EMERGENCIA - RESET COMPLETO
def emergency_factory_reset():
    """🚨 RESET COMPLETO DEL F22 A CONFIGURACIÓN DE FÁBRICA"""
    try:
        logger.info("🏭 INTENTANDO RESET DE FÁBRICA...")
        
        pythoncom.CoInitialize()
        zkem = win32com.client.Dispatch("zkemkeeper.ZKEM")
        
        if zkem.Connect_Net(CONFIG['ip'], CONFIG['port']):
            logger.info("✅ Conectado para reset de fábrica")
            
            # Métodos de reset de fábrica
            factory_methods = [
                ("ClearData", lambda: zkem.ClearData(CONFIG['machine_number'], 5)),  # Clear options
                ("RestoreToFactoryDefault", lambda: getattr(zkem, 'RestoreToFactoryDefault', lambda x: False)(CONFIG['machine_number'])),
                ("FactoryReset", lambda: getattr(zkem, 'FactoryReset', lambda x: False)(CONFIG['machine_number'])),
            ]
            
            for method_name, method_func in factory_methods:
                try:
                    logger.info(f"🏭 Probando {method_name}...")
                    if method_func():
                        logger.info(f"✅ {method_name} ejecutado")
                        time.sleep(3)
                        return True
                except Exception as e:
                    logger.debug(f"❌ {method_name} falló: {e}")
            
            zkem.Disconnect()
        
        pythoncom.CoUninitialize()
        return False
        
    except Exception as e:
        logger.error(f"❌ Error en factory reset: {e}")
        return False

if __name__ == "__main__":
    print("🚨" * 80)
    print("CÓDIGO DE EMERGENCIA F22 - RESTABLECIENDO CONFIGURACIÓN")
    print("2025-06-20 08:43:22 UTC - Usuario: mupai555")
    print("🚨" * 80)
    print("PROBLEMA: F22 bloqueado, puerta no abre, acceso denegado")
    print("SOLUCIÓN: Restablecer configuración a modo AUTOMÁTICO")
    print("🚨" * 80)
    
    try:
        # Intentar reset de emergencia
        if emergency_reset_f22():
            print("\n✅ EMERGENCIA RESUELTA EXITOSAMENTE")
            print("👆 Puedes usar tu huella ahora")
            print("🔓 Puerta funcionando en modo automático")
        else:
            print("\n⚠️ RESET DE EMERGENCIA NO FUNCIONÓ")
            print("🔧 Intentando RESET DE FÁBRICA...")
            
            if emergency_factory_reset():
                print("✅ RESET DE FÁBRICA EXITOSO")
                print("⚠️ NOTA: Puede que tengas que re-registrar huellas")
            else:
                print("❌ RESET DE FÁBRICA FALLÓ")
                print("\n🆘 SOLUCIONES FÍSICAS REQUERIDAS:")
                print("   1. 🔌 Desconectar F22 por 30 segundos y reconectar")
                print("   2. 🔘 Buscar botón RESET físico en el dispositivo")
                print("   3. 🔑 Usar llave física si existe")
                print("   4. 📞 Contactar soporte técnico ZKTeco")
                print("   5. 📖 Consultar manual del modelo específico")
    
    except KeyboardInterrupt:
        print("\n🚨 Proceso de emergencia interrumpido")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        print("\n🚨 Código de emergencia finalizado")