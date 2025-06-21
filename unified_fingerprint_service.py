#!/usr/bin/env python3
"""
Servicio F22 v10.1.1 - LA SOLUCIÓN FINAL (Corrección de Typo)
==============================================================
Autor: Gemini (para mupai555)
Fecha: 2025-06-20 10:20:38 UTC

Descripción:
Versión definitiva que corrige un simple 'NameError' en la última línea
del script anterior. La lógica permanece idéntica a la v10.1, que
implementa el "Ataque de Doble Pinza" para solucionar el problema de
"Combinación no válida".
"""

import asyncio
import logging
import os
import signal
import sys
import threading
import time
import queue
from datetime import datetime

import httpx
import pythoncom
import win32com.client
from dotenv import load_dotenv

# --- 1. CONFIGURACIÓN ---
load_dotenv('.env.local')

CONFIG = {
    'ip': os.getenv('F22_IP', '192.168.1.201'),
    'port': int(os.getenv('F22_PORT', 4370)),
    'comm_key': int(os.getenv('F22_COMM_KEY', 0)),
    'machine_number': 1,
    'log_level': logging.INFO,
    'sync_interval': 300,
    'allowed_group_id': 2,
    'denied_group_id': 3,
    'allowed_timezone_id': 1,
    'denied_timezone_id': 2,
}

VALID_START_DATE = "2024-01-01 00:00:00"
VALID_END_DATE_ACTIVE = "2099-12-31 23:59:59"
VALID_END_DATE_INACTIVE = "2000-01-01 23:59:59"
VERIFY_STYLE_FP_ONLY = 1 # Constante para "Solo Huella"

SUPABASE_CONFIG = {
    'url': os.getenv('NEXT_PUBLIC_SUPABASE_URL', ''),
    'service_key': os.getenv('SUPABASE_SERVICE_ROLE_KEY', ''),
}

logging.basicConfig(level=CONFIG['log_level'], format='%(asctime)s [%(levelname)s] (%(threadName)s) %(message)s')
logger = logging.getLogger('F22_FinalSolution_v10.1.1')

service_shutdown = False
sta_thread_ready = threading.Event()

class FinalSyncThread(threading.Thread):
    def __init__(self, loop):
        super().__init__(name="F22-COM-Thread")
        self.daemon = True
        self.zkem = None
        self.running = False
        self.main_loop = loop
        self.is_connected = False
        logger.info("🧵 Thread de Sincronización Final v10.1.1 inicializado.")

    def run(self):
        try:
            pythoncom.CoInitialize()
            self.running = True
            sta_thread_ready.set()
            if not self._connect_to_f22(): return
            logger.info("🔄 Realizando sincronización INICIAL...")
            asyncio.run_coroutine_threadsafe(self.perform_full_sync(), self.main_loop).result()
            last_sync_time = time.time()
            while self.running and not service_shutdown:
                pythoncom.PumpWaitingMessages()
                if time.time() - last_sync_time > CONFIG['sync_interval']:
                    logger.info("🔄 Realizando sincronización PERIÓDICA...")
                    asyncio.run_coroutine_threadsafe(self.perform_full_sync(), self.main_loop)
                    last_sync_time = time.time()
                time.sleep(0.05)
        except Exception as e:
            logger.critical(f"🚨 Error crítico en el thread: {e}", exc_info=True)
        finally:
            self._cleanup()
            pythoncom.CoUninitialize()
            logger.info("🧵 Thread de comunicación finalizado.")

    def _connect_to_f22(self):
        try:
            logger.info(f"🔗 Intentando conectar a F22 en {CONFIG['ip']}:{CONFIG['port']}...")
            self.zkem = win32com.client.Dispatch("zkemkeeper.ZKEM")
            logger.info(f"🔑 Usando CommKey: {CONFIG['comm_key']}")
            self.zkem.SetCommPassword(CONFIG['comm_key'])
            if not self.zkem.Connect_Net(CONFIG['ip'], CONFIG['port']):
                logger.error("❌ Conexión falló. Verifique IP y CommKey.")
                return False
            self.is_connected = True
            logger.info("✅ Conectado y autenticado exitosamente al F22.")
            self._setup_access_control_system()
            return True
        except Exception as e:
            logger.error(f"💥 Falló la conexión inicial: {e}")
            return False

    def _setup_access_control_system(self):
        try:
            self.zkem.EnableDevice(CONFIG['machine_number'], False)
            logger.info("🔧 Configurando sistema de control de acceso (Ataque de Doble Pinza)...")
            
            self.zkem.SetTZInfo(CONFIG['machine_number'], CONFIG['allowed_timezone_id'], "00002359" * 7)
            self.zkem.SSR_SetGroupTZ(CONFIG['machine_number'], CONFIG['allowed_group_id'], CONFIG['allowed_timezone_id'], CONFIG['allowed_timezone_id'], CONFIG['allowed_timezone_id'], 1, 0)
            logger.info(f"  - Grupo {CONFIG['allowed_group_id']} ('Permitido') configurado.")

            self.zkem.SetTZInfo(CONFIG['machine_number'], CONFIG['denied_timezone_id'], "")
            self.zkem.SSR_SetGroupTZ(CONFIG['machine_number'], CONFIG['denied_group_id'], CONFIG['denied_timezone_id'], CONFIG['denied_timezone_id'], CONFIG['denied_timezone_id'], 1, 0)
            logger.info(f"  - Grupo {CONFIG['denied_group_id']} ('Denegado') configurado.")

            unlock_combination = f"{CONFIG['allowed_group_id']},0,0,0,0"
            if self.zkem.SetUnlockGroups(CONFIG['machine_number'], unlock_combination):
                logger.info(f"  - ✅ Combinación de Desbloqueo forzada a modo simple (Solo Grupo {CONFIG['allowed_group_id']}).")
            else:
                logger.warning("  - ⚠️ No se pudo forzar la Combinación de Desbloqueo.")
            
            self.zkem.RefreshData(CONFIG['machine_number'])
        except Exception as e:
            logger.error(f"💥 Error fatal configurando el sistema de acceso: {e}", exc_info=True)
        finally:
            self.zkem.EnableDevice(CONFIG['machine_number'], True)

    async def perform_full_sync(self):
        logger.info("🔄 === INICIANDO SINCRONIZACIÓN FINAL v10.1.1 ===")
        if not self.is_connected: return
        try:
            self.zkem.EnableDevice(CONFIG['machine_number'], False)
            
            logger.info("1. Obteniendo lista de usuarios en el F22...")
            users_in_device = set()
            self.zkem.ReadAllUserID(CONFIG['machine_number'])
            while True:
                result = self.zkem.SSR_GetAllUserInfo(CONFIG['machine_number'], "", "", "", 0, False)
                if not result[0]: break
                users_in_device.add(str(result[1]))
            logger.info(f"  - {len(users_in_device)} usuarios encontrados en el dispositivo.")

            logger.info("2. Obteniendo estado de membresías desde Supabase...")
            headers = {'apikey': SUPABASE_CONFIG['service_key'], 'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}"}
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/fingerprint_templates"
            params = {'select': 'device_user_id,template,finger_index,Users!inner(id,firstName,lastName,user_memberships!user_memberships_userid_fkey(status))'}
            async with httpx.AsyncClient(timeout=45.0) as client:
                response = await client.get(url, headers=headers, params=params)
            db_users = {str(u['device_user_id']): u for u in response.json()}
            logger.info(f"  - {len(db_users)} usuarios con huella encontrados en la base de datos.")

            logger.info("3. Sincronizando Grupo, Validez y Modo de Verificación...")
            created, activated, deactivated = 0, 0, 0
            for uid_str, u_data in db_users.items():
                is_active = any(m.get('status') == 'active' for m in u_data['Users']['user_memberships'])
                user_exists = uid_str in users_in_device
                if not user_exists and is_active:
                    logger.info(f"    - CREANDO usuario activo {uid_str}...")
                    uname = f"{u_data['Users']['firstName']} {u_data['Users']['lastName']}".strip()
                    self.zkem.SetUserTmpExStr(CONFIG['machine_number'], uid_str, u_data.get('finger_index', 0), 1, u_data['template'])
                    self.zkem.SSR_SetUserInfo(CONFIG['machine_number'], uid_str, uname, "", 0, True)
                    created += 1
                
                self.zkem.SetUserVerifyStyle(CONFIG['machine_number'], uid_str, VERIFY_STYLE_FP_ONLY, 0)
                
                target_group = CONFIG['allowed_group_id'] if is_active else CONFIG['denied_group_id']
                target_end_date = VALID_END_DATE_ACTIVE if is_active else VALID_END_DATE_INACTIVE
                
                group_ok = self.zkem.SetUserGroup(CONFIG['machine_number'], int(uid_str), target_group)
                validity_ok = self.zkem.SetUserValidDate(CONFIG['machine_number'], uid_str, 1, 0, VALID_START_DATE, target_end_date)

                if group_ok and validity_ok:
                    if is_active:
                        logger.info(f"    - ACTIVANDO usuario {uid_str} (Grupo Permitido, Válido hasta 2099, Solo Huella).")
                        activated += 1
                    else:
                        logger.info(f"    - DESACTIVANDO usuario {uid_str} (Grupo Denegado, Venció en 2000).")
                        deactivated += 1
                else:
                    logger.warning(f"    - Falló Doble Factor para {uid_str}: GrupoOK={group_ok}, ValidezOK={validity_ok}")

            logger.info("4. Guardando cambios en el dispositivo...")
            self.zkem.RefreshData(CONFIG['machine_number'])
            logger.info(f"✅ === SINCRONIZACIÓN COMPLETADA: {created} creados, {activated} activados, {deactivated} desactivados ===")
        except Exception as e:
            logger.error(f"🚨 Error crítico durante sincronización: {e}", exc_info=True)
        finally:
            if self.is_connected:
                self.zkem.EnableDevice(CONFIG['machine_number'], True)

    def stop(self): self.running = False
    def _cleanup(self):
        if self.zkem and self.is_connected: self.zkem.Disconnect()
        self.is_connected = False
        logger.info("🧹 Recursos del thread liberados.")

async def main():
    logger.info("="*70); logger.info("    Servicio F22 v10.1.1 - La Solución Final"); logger.info("="*70)
    loop = asyncio.get_running_loop()
    service_instance = FinalSyncThread(loop)
    service_instance.start()
    if not sta_thread_ready.wait(timeout=10):
        logger.critical("❌ El thread de comunicación no se pudo inicializar."); return
    await asyncio.sleep(2)
    if not service_instance.is_connected:
        logger.critical("❌ No se pudo iniciar el servicio. Verifique la IP y la CommKey."); return
    logger.info("✅ Sistema listo. Sincronizando membresías con control de acceso completo.")
    while not service_shutdown: await asyncio.sleep(1)
    if service_instance.is_alive(): service_instance.stop(); service_instance.join()

def signal_handler(sig, frame):
    global service_shutdown
    if not service_shutdown: service_shutdown = True; logger.info(f"🚨 Señal de apagado ({sig}) recibida...")

if __name__ == "__main__":
    # --- LA CORRECCIÓN ESTÁ AQUÍ ---
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    # ---------------------------------
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
    finally:
        logger.info("🏁 Servicio finalizado.")