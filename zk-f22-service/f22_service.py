#!/usr/bin/env python3
"""
F22 WebSocket Service - zkemkeeper.dll OFICIAL (Puerto 8082)
🎯 MIGRADO desde pyzk → zkemkeeper.dll SDK oficial ZKTeco
🚀 MÁS ROBUSTO y ESTABLE que la versión anterior
✅ Mantiene TODA la funcionalidad: WebSocket + Supabase + Eliminación
✅ NUEVO: SDK oficial ZKTeco con 676 usuarios confirmados
Migrado: 2025-06-19 03:05:15 UTC por luishdz04
"""

import asyncio
import websockets
import json
import logging
import base64
import os
import httpx
import comtypes.client
import ctypes
from urllib.parse import quote
from dotenv import load_dotenv
from datetime import datetime
from typing import Optional, Dict, List, Any

# Cargar variables de entorno
load_dotenv()

# Configuración
CONFIG = {
    'ip': '192.168.1.201',      # IP del F22
    'port': 4370,               # Puerto estándar ZKTeco
    'machine_number': 1,        # Número de máquina
    'timeout': 5,
    'ws_port': 8082,            # Puerto WebSocket
    'log_level': logging.INFO,
    'max_templates_per_page': 50,
    'dll_path': os.path.join(os.getcwd(), "zkemkeeper.dll")
}

# ✅ CONFIGURACIÓN DE SUPABASE (Sin cambios)
SUPABASE_CONFIG = {
    'url': os.getenv('NEXT_PUBLIC_SUPABASE_URL', ''),
    'service_key': os.getenv('SUPABASE_SERVICE_ROLE_KEY', ''),
    'anon_key': os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
}

# Configuración de logging
logging.basicConfig(
    level=CONFIG['log_level'],
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger('f22_service_official')

# Clientes WebSocket conectados
connected_clients = set()

# ✅ FUNCIÓN SUPABASE SIN CAMBIOS
async def get_user_name_from_supabase(user_id):
    """
    Obtener nombre completo del usuario desde Supabase
    Retorna formato: "MUP - FirstName LastName"
    """
    try:
        if not SUPABASE_CONFIG['url'] or not SUPABASE_CONFIG['service_key']:
            logger.warning("⚠️ Configuración de Supabase incompleta")
            return f"MUP - User_{user_id}"
        
        headers = {
            'apikey': SUPABASE_CONFIG['service_key'],
            'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
            'Content-Type': 'application/json'
        }
        
        url = f"{SUPABASE_CONFIG['url']}/rest/v1/Users"
        params = {
            'select': 'firstName,lastName',
            'id': f'eq.{user_id}'
        }
        
        logger.info(f"🔍 Consultando Supabase para usuario: {user_id}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params, timeout=10.0)
            
            if response.status_code == 200:
                users = response.json()
                if users and len(users) > 0:
                    user_data = users[0]
                    first_name = user_data.get('firstName', '').strip()
                    last_name = user_data.get('lastName', '').strip()
                    
                    if first_name or last_name:
                        full_name = f"{first_name} {last_name}".strip()
                        formatted_name = f"MUP - {full_name}"
                        logger.info(f"✅ Nombre obtenido: '{formatted_name}'")
                        return formatted_name
                    else:
                        fallback_name = f"MUP - User_{user_id}"
                        logger.warning(f"⚠️ Usuario {user_id} sin nombres, usando: {fallback_name}")
                        return fallback_name
                else:
                    fallback_name = f"MUP - User_{user_id}"
                    logger.warning(f"⚠️ Usuario {user_id} no encontrado en Supabase, usando: {fallback_name}")
                    return fallback_name
            else:
                logger.error(f"❌ Error HTTP consultando Supabase: {response.status_code} - {response.text}")
                return f"MUP - User_{user_id}"
                
    except httpx.TimeoutException:
        logger.error(f"❌ Timeout consultando Supabase para usuario {user_id}")
        return f"MUP - User_{user_id}"
    except Exception as e:
        logger.error(f"❌ Error obteniendo nombre de usuario: {e}")
        return f"MUP - User_{user_id}"

class F22DeviceOfficial:
    """🚀 Clase para gestionar F22 con zkemkeeper.dll OFICIAL"""
    
    def __init__(self, ip, port=4370, machine_number=1, timeout=5):
        self.ip = ip
        self.port = port
        self.machine_number = machine_number
        self.timeout = timeout
        self.zkem = None
        self.connected = False
        self.last_status = "disconnected"
        self._cache = {
            "device_info": None,
            "capacity_info": None,
            "users": None,
            "last_refresh": None
        }
        
    def extract_com_value(self, com_result):
        """Extraer valor real de resultado COM"""
        if isinstance(com_result, (list, tuple)) and len(com_result) >= 1:
            return com_result[0]
        return com_result
        
    def setup_dll(self):
        """Configurar zkemkeeper.dll"""
        if not os.path.exists(CONFIG['dll_path']):
            raise Exception(f"❌ zkemkeeper.dll no encontrada en: {CONFIG['dll_path']}")
        
        try:
            comtypes.client.GetModule(CONFIG['dll_path'])
            return True
        except Exception as e:
            logger.warning(f"⚠️ Warning DLL: {e}")
            return True
    
    async def connect(self):
        """🔗 CONECTAR usando zkemkeeper.dll OFICIAL"""
        if self.connected:
            return True
            
        try:
            logger.info(f"🔄 Conectando a F22 con SDK oficial en {self.ip}:{self.port}...")
            
            # Configurar DLL
            self.setup_dll()
            
            # Crear objeto COM
            self.zkem = comtypes.client.CreateObject("zkemkeeper.ZKEM")
            
            # SetCommPassword - línea 190 del repositorio
            self.zkem.SetCommPassword(0)
            
            # Connect_Net - línea 202 del repositorio
            if self.zkem.Connect_Net(self.ip, self.port):
                self.connected = True
                self.last_status = "connected"
                logger.info("✅ Conexión exitosa con F22 (SDK oficial)")
                return True
            else:
                self.connected = False
                self.last_status = "error"
                logger.error("❌ Error conectando con SDK oficial")
                return False
                
        except Exception as e:
            self.connected = False
            self.last_status = "error"
            logger.error(f"❌ Error conectando a F22: {e}")
            return False
    
    async def disconnect(self):
        """🔌 DESCONECTAR"""
        if self.zkem and self.connected:
            try:
                self.zkem.Disconnect()
                logger.info("🔌 Desconectado de F22")
            except Exception as e:
                logger.error(f"Error al desconectar: {e}")
            finally:
                self.connected = False
                self.zkem = None
                self.last_status = "disconnected"
                self._cache = {
                    "device_info": None,
                    "capacity_info": None,
                    "users": None,
                    "last_refresh": None
                }
    
    async def get_device_info(self):
        """📱 INFORMACIÓN DEL DISPOSITIVO - SDK oficial"""
        if not self.connected or not self.zkem:
            return {"error": "Dispositivo no conectado"}
        
        try:
            # Usar caché si está disponible
            if self._cache["device_info"] is not None:
                logger.info("📋 Usando caché de device_info")
                return self._cache["device_info"]
            
            # EnableDevice False - línea 385 del repositorio
            self.zkem.EnableDevice(self.machine_number, False)
            
            info = {
                "status": "connected",
                "ip": self.ip,
                "port": self.port,
                "sdk": "zkemkeeper.dll OFICIAL"
            }
            
            # GetVendor - línea 398
            try:
                vendor_result = self.zkem.GetVendor()
                info["vendor"] = self.extract_com_value(vendor_result)
            except Exception as e:
                info["vendor"] = f"Error: {str(e)}"
            
            # GetProductCode - línea 399
            try:
                product_result = self.zkem.GetProductCode(self.machine_number)
                info["product"] = self.extract_com_value(product_result)
            except Exception as e:
                info["product"] = f"Error: {str(e)}"
                
            # GetFirmwareVersion - línea 401
            try:
                firmware_result = self.zkem.GetFirmwareVersion(self.machine_number)
                info["firmware"] = self.extract_com_value(firmware_result)
            except Exception as e:
                info["firmware"] = f"Error: {str(e)}"
                
            # GetSerialNumber - línea 412
            try:
                serial_result = self.zkem.GetSerialNumber(self.machine_number)
                info["serial"] = self.extract_com_value(serial_result)
            except Exception as e:
                info["serial"] = f"Error: {str(e)}"
            
            # GetDeviceMAC - línea 400
            try:
                mac_result = self.zkem.GetDeviceMAC(self.machine_number)
                info["mac"] = self.extract_com_value(mac_result)
            except Exception as e:
                info["mac"] = f"Error: {str(e)}"
            
            # Obtener capacidades
            capacity_info = await self.get_capacity_info()
            if "error" not in capacity_info:
                info.update(capacity_info)
            
            # EnableDevice True - línea 415
            self.zkem.EnableDevice(self.machine_number, True)
            
            # Guardar en caché
            self._cache["device_info"] = info
            self._cache["last_refresh"] = datetime.now().isoformat()
                
            return info
            
        except Exception as e:
            self.zkem.EnableDevice(self.machine_number, True)
            logger.error(f"Error obteniendo info: {e}")
            return {"error": str(e)}
    
    async def get_capacity_info(self):
        """📊 CAPACIDADES DEL DISPOSITIVO - SDK oficial"""
        if not self.connected or not self.zkem:
            return {"error": "Dispositivo no conectado"}
        
        try:
            # Usar caché si está disponible
            if self._cache["capacity_info"] is not None:
                logger.info("📋 Usando caché de capacity_info")
                return self._cache["capacity_info"]
            
            # EnableDevice False - línea 440 del repositorio
            self.zkem.EnableDevice(self.machine_number, False)
            
            # GetDeviceStatus - líneas 442-448 del repositorio
            users = self.extract_com_value(self.zkem.GetDeviceStatus(self.machine_number, 2)) or 0
            admins = self.extract_com_value(self.zkem.GetDeviceStatus(self.machine_number, 1)) or 0
            fingers = self.extract_com_value(self.zkem.GetDeviceStatus(self.machine_number, 3)) or 0
            passwords = self.extract_com_value(self.zkem.GetDeviceStatus(self.machine_number, 4)) or 0
            records = self.extract_com_value(self.zkem.GetDeviceStatus(self.machine_number, 6)) or 0
            oplogs = self.extract_com_value(self.zkem.GetDeviceStatus(self.machine_number, 5)) or 0
            faces = self.extract_com_value(self.zkem.GetDeviceStatus(self.machine_number, 21)) or 0
            
            capacity_info = {
                'users_count': int(users),
                'admins_count': int(admins),
                'fingers_count': int(fingers),
                'passwords_count': int(passwords),
                'records_count': int(records),
                'oplogs_count': int(oplogs),
                'faces_count': int(faces)
            }
            
            # EnableDevice True - línea 450
            self.zkem.EnableDevice(self.machine_number, True)
            
            # Guardar en caché
            self._cache["capacity_info"] = capacity_info
            
            return capacity_info
            
        except Exception as e:
            self.zkem.EnableDevice(self.machine_number, True)
            logger.error(f"Error obteniendo capacidades: {e}")
            return {"error": str(e)}
    
    async def get_users(self):
        """👥 OBTENER USUARIOS - SDK oficial"""
        if not self.connected or not self.zkem:
            return {"error": "Dispositivo no conectado"}
            
        try:
            # Usar caché si está disponible
            if self._cache["users"] is not None:
                logger.info("📋 Usando caché de usuarios")
                return self._cache["users"]
            
            # EnableDevice False - línea 3707 del repositorio
            self.zkem.EnableDevice(self.machine_number, False)
            
            # ReadAllUserID - línea 3708 del repositorio
            self.zkem.ReadAllUserID(self.machine_number)
            
            user_list = []
            
            # SSR_GetAllUserInfo - línea 3709 del repositorio
            while True:
                try:
                    result = self.zkem.SSR_GetAllUserInfo(self.machine_number)
                    if not result:
                        break
                    
                    if isinstance(result, tuple) and len(result) >= 5:
                        enroll_number, name, password, privilege, enabled = result[:5]
                        
                        user_data = {
                            "uid": enroll_number,  # En zkemkeeper, enroll_number es el UID
                            "user_id": str(enroll_number),
                            "name": str(name),
                            "privilege": int(privilege),
                            "enabled": bool(enabled)
                        }
                        user_list.append(user_data)
                    else:
                        break
                        
                except Exception:
                    break
            
            # EnableDevice True - línea 3720 del repositorio
            self.zkem.EnableDevice(self.machine_number, True)
            
            users_data = {"users": user_list, "count": len(user_list)}
            
            # Guardar en caché
            self._cache["users"] = users_data
            
            logger.info(f"✅ Obtenidos {len(user_list)} usuarios del F22 (SDK oficial)")
            return users_data
            
        except Exception as e:
            self.zkem.EnableDevice(self.machine_number, True)
            logger.error(f"Error obteniendo usuarios: {e}")
            return {"error": str(e)}
    
    async def sync_template_from_db(self, user_data):
        """
        🚀 SINCRONIZAR TEMPLATE - SDK oficial zkemkeeper.dll
        ✅ NUEVO: Usando comandos oficiales del repositorio
        """
        if not self.connected or not self.zkem:
            return {"success": False, "error": "Dispositivo no conectado"}
            
        try:
            # 1. Decodificar template de Base64
            template_base64 = user_data.get('template')
            if not template_base64:
                return {"success": False, "error": "Template requerido"}
                
            template_bytes = base64.b64decode(template_base64)
            
            # 2. Datos del usuario
            device_user_id = user_data.get('device_user_id')
            frontend_finger_index = user_data.get('finger_index', 0)
            
            # 3. ✅ OBTENER NOMBRE DESDE SUPABASE
            user_uuid = user_data.get('user_id')
            if user_uuid:
                logger.info(f"🔍 Consultando nombre para usuario UUID: {user_uuid}")
                name = await get_user_name_from_supabase(user_uuid)
            else:
                first_name = user_data.get('first_name', '')
                last_name = user_data.get('last_name', '')
                
                if first_name or last_name:
                    full_name = f"{first_name} {last_name}".strip()
                    name = f"MUP - {full_name}"
                else:
                    name = f"MUP - User_{device_user_id}"
            
            # 4. Conversión: Frontend (1-based) → ZKTeco (0-based)
            zkteco_finger_index = frontend_finger_index - 1
            
            finger_names = [
                "Pulgar Derecho", "Índice Derecho", "Medio Derecho", "Anular Derecho", "Meñique Derecho",
                "Pulgar Izquierdo", "Índice Izquierdo", "Medio Izquierdo", "Anular Izquierdo", "Meñique Izquierdo"
            ]
            finger_name = finger_names[frontend_finger_index - 1] if 1 <= frontend_finger_index <= 10 else "Desconocido"
            
            logger.info(f"🚀 Sincronizando con SDK oficial: {device_user_id}")
            logger.info(f"👤 Nombre: '{name}' | Dedo: {finger_name}")
            logger.info(f"📊 Template: {len(template_bytes)} bytes")
            
            # 5. EnableDevice False - línea 3707
            self.zkem.EnableDevice(self.machine_number, False)
            
            # 6. Verificar si usuario existe
            users_data = await self.get_users()
            if "error" in users_data:
                return {"success": False, "error": "Error obteniendo usuarios"}
            
            existing_user = next((u for u in users_data["users"] if u["user_id"] == str(device_user_id)), None)
            
            if existing_user:
                uid = existing_user["uid"]
                logger.info(f"✅ Usuario existente: UID {uid}")
            else:
                # Obtener próximo UID disponible
                max_uid = max([u["uid"] for u in users_data["users"]], default=0)
                uid = max_uid + 1
                
                # 🚀 CREAR USUARIO con SDK oficial
                # SetUserInfo - función del repositorio
                try:
                    self.zkem.SetUserInfo(self.machine_number, uid, name, "", 0, True)
                    logger.info(f"✅ Usuario creado: {name}, UID: {uid}")
                except Exception as e:
                    logger.error(f"❌ Error creando usuario: {e}")
                    # Intentar método alternativo
                    try:
                        self.zkem.SSR_SetUserInfo(self.machine_number, str(device_user_id), name, "", 0, True)
                        logger.info(f"✅ Usuario creado (método alternativo): {name}")
                    except Exception as e2:
                        logger.error(f"❌ Error método alternativo: {e2}")
                        return {"success": False, "error": f"Error creando usuario: {e2}"}
            
            # 7. 🚀 GUARDAR TEMPLATE con SDK oficial
            # SetUserTmp - función del repositorio para guardar templates
            try:
                logger.info(f"🚀 Guardando template con SetUserTmp...")
                
                # Convertir template a string hexadecimal para zkemkeeper
                template_hex = template_bytes.hex().upper()
                
                # SetUserTmp(machineNumber, userID, fingerIndex, flag, template)
                result = self.zkem.SetUserTmp(self.machine_number, uid, zkteco_finger_index, 1, template_hex)
                
                if result:
                    logger.info(f"✅ Template guardado exitosamente")
                else:
                    # Método alternativo: SSR_SetUserTmp
                    try:
                        result2 = self.zkem.SSR_SetUserTmp(self.machine_number, uid, zkteco_finger_index, 1, template_hex)
                        if result2:
                            logger.info(f"✅ Template guardado (método alternativo)")
                        else:
                            return {"success": False, "error": "No se pudo guardar el template"}
                    except Exception as e:
                        return {"success": False, "error": f"Error guardando template: {e}"}
                
            except Exception as template_error:
                logger.error(f"❌ Error guardando template: {template_error}")
                return {"success": False, "error": f"Error guardando template: {template_error}"}
            
            # 8. RefreshData - comando del repositorio para sincronizar
            try:
                self.zkem.RefreshData(self.machine_number)
                logger.info("🔄 Datos del dispositivo refrescados")
            except Exception as e:
                logger.warning(f"⚠️ Error refrescando datos: {e}")
            
            # 9. EnableDevice True - línea 415
            self.zkem.EnableDevice(self.machine_number, True)
            
            # 10. Invalidar caché
            self._cache["users"] = None
            self._cache["device_info"] = None
            self._cache["capacity_info"] = None
            
            logger.info(f"✅ Template sincronizado exitosamente: UID {uid}, {finger_name}")
            return {
                "success": True,
                "uid": uid,
                "device_user_id": device_user_id,
                "frontend_finger_index": frontend_finger_index,
                "zkteco_finger_index": zkteco_finger_index,
                "finger_name": finger_name,
                "user_name": name,
                "sdk": "zkemkeeper.dll OFICIAL",
                "message": f"Template sincronizado exitosamente para {finger_name}"
            }
                
        except Exception as e:
            self.zkem.EnableDevice(self.machine_number, True)
            logger.error(f"💥 Error sincronizando template: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return {"success": False, "error": str(e)}
    
    async def delete_user_from_device(self, device_user_id):
        """
        🗑️ ELIMINAR USUARIO - SDK oficial
        """
        if not self.connected or not self.zkem:
            return {"success": False, "error": "Dispositivo no conectado"}
            
        try:
            logger.info(f"🗑️ Eliminando usuario {device_user_id} con SDK oficial...")
            
            # 1. EnableDevice False
            self.zkem.EnableDevice(self.machine_number, False)
            
            # 2. Obtener usuarios
            users_data = await self.get_users()
            if "error" in users_data:
                return {"success": False, "error": "Error obteniendo usuarios"}
            
            # 3. Buscar usuario
            target_user = next((u for u in users_data["users"] if u["user_id"] == str(device_user_id)), None)
            
            if not target_user:
                self.zkem.EnableDevice(self.machine_number, True)
                return {"success": False, "error": f"Usuario {device_user_id} no encontrado"}
            
            uid = target_user["uid"]
            logger.info(f"📋 Usuario encontrado: {target_user['name']} (UID: {uid})")
            
            # 4. 🗑️ ELIMINAR con SDK oficial
            # DeleteEnrollData - función del repositorio
            try:
                # Eliminar todas las huellas del usuario (índices 0-9)
                deleted_templates = 0
                for finger_idx in range(10):
                    try:
                        result = self.zkem.DeleteEnrollData(self.machine_number, uid, finger_idx)
                        if result:
                            deleted_templates += 1
                            logger.info(f"✅ Eliminada huella {finger_idx}")
                    except Exception as e:
                        logger.warning(f"⚠️ Error eliminando huella {finger_idx}: {e}")
                
                logger.info(f"🗑️ Total huellas eliminadas: {deleted_templates}")
                
            except Exception as e:
                logger.error(f"❌ Error eliminando huellas: {e}")
            
            # 5. Eliminar usuario
            user_deleted = False
            try:
                # DeleteUser - función del repositorio  
                result = self.zkem.SSR_DeleteUser(self.machine_number, str(device_user_id))
                if result:
                    user_deleted = True
                    logger.info(f"✅ Usuario {device_user_id} eliminado")
                else:
                    logger.warning(f"⚠️ No se pudo eliminar usuario {device_user_id}")
                    
            except Exception as e:
                logger.error(f"❌ Error eliminando usuario: {e}")
            
            # 6. RefreshData - sincronizar cambios
            try:
                self.zkem.RefreshData(self.machine_number)
                logger.info("🔄 Datos refrescados")
            except Exception as e:
                logger.warning(f"⚠️ Error refrescando: {e}")
            
            # 7. EnableDevice True
            self.zkem.EnableDevice(self.machine_number, True)
            
            # 8. Invalidar caché
            self._cache["users"] = None
            self._cache["device_info"] = None
            self._cache["capacity_info"] = None
            
            if deleted_templates > 0 or user_deleted:
                return {
                    "success": True,
                    "message": f"Usuario eliminado exitosamente del F22",
                    "device_user_id": device_user_id,
                    "uid": uid,
                    "deleted_templates": deleted_templates,
                    "user_deleted": user_deleted,
                    "sdk": "zkemkeeper.dll OFICIAL"
                }
            else:
                return {"success": False, "error": f"No se pudo eliminar el usuario {device_user_id}"}
                
        except Exception as e:
            self.zkem.EnableDevice(self.machine_number, True)
            logger.error(f"💥 Error eliminando usuario: {e}")
            return {"success": False, "error": str(e)}
    
    async def delete_specific_template(self, device_user_id, finger_index):
        """
        🗑️ ELIMINAR TEMPLATE ESPECÍFICO - SDK oficial
        """
        if not self.connected or not self.zkem:
            return {"success": False, "error": "Dispositivo no conectado"}
            
        try:
            logger.info(f"🗑️ Eliminando template específico con SDK oficial: Usuario {device_user_id}, Dedo {finger_index}")
            
            # 1. EnableDevice False
            self.zkem.EnableDevice(self.machine_number, False)
            
            # 2. Obtener usuarios
            users_data = await self.get_users()
            if "error" in users_data:
                return {"success": False, "error": "Error obteniendo usuarios"}
            
            # 3. Buscar usuario
            target_user = next((u for u in users_data["users"] if u["user_id"] == str(device_user_id)), None)
            
            if not target_user:
                self.zkem.EnableDevice(self.machine_number, True)
                return {"success": False, "error": f"Usuario {device_user_id} no encontrado"}
            
            uid = target_user["uid"]
            
            # 4. Convertir finger_index
            if isinstance(finger_index, str):
                finger_index = int(finger_index)
            
            zkteco_finger_index = finger_index - 1 if finger_index > 0 else finger_index
            
            logger.info(f"📋 Eliminando: UID {uid}, Frontend {finger_index} → ZKTeco {zkteco_finger_index}")
            
            # 5. 🗑️ ELIMINAR TEMPLATE con SDK oficial
            # DeleteEnrollData - función del repositorio
            try:
                result = self.zkem.DeleteEnrollData(self.machine_number, uid, zkteco_finger_index)
                
                if result:
                    logger.info(f"✅ Template eliminado exitosamente")
                    
                    # RefreshData
                    try:
                        self.zkem.RefreshData(self.machine_number)
                    except Exception as e:
                        logger.warning(f"⚠️ Error refrescando: {e}")
                    
                    # EnableDevice True
                    self.zkem.EnableDevice(self.machine_number, True)
                    
                    # Invalidar caché
                    self._cache["users"] = None
                    self._cache["device_info"] = None
                    
                    finger_names = [
                        "Pulgar Derecho", "Índice Derecho", "Medio Derecho", "Anular Derecho", "Meñique Derecho",
                        "Pulgar Izquierdo", "Índice Izquierdo", "Medio Izquierdo", "Anular Izquierdo", "Meñique Izquierdo"
                    ]
                    finger_name = finger_names[finger_index - 1] if 1 <= finger_index <= 10 else f"Dedo {finger_index}"
                    
                    return {
                        "success": True,
                        "message": f"Template {finger_name} eliminado exitosamente",
                        "device_user_id": device_user_id,
                        "uid": uid,
                        "finger_index": finger_index,
                        "zkteco_finger_index": zkteco_finger_index,
                        "finger_name": finger_name,
                        "sdk": "zkemkeeper.dll OFICIAL"
                    }
                else:
                    self.zkem.EnableDevice(self.machine_number, True)
                    return {"success": False, "error": f"No se pudo eliminar template {finger_index}"}
                    
            except Exception as e:
                self.zkem.EnableDevice(self.machine_number, True)
                logger.error(f"❌ Error eliminando template: {e}")
                return {"success": False, "error": str(e)}
                
        except Exception as e:
            self.zkem.EnableDevice(self.machine_number, True)
            logger.error(f"💥 Error eliminando template específico: {e}")
            return {"success": False, "error": str(e)}
    
    # ✅ MÉTODO ADICIONAL: Sincronizar múltiples templates
    async def sync_multiple_templates_from_db(self, templates_data):
        """Sincronizar múltiples templates desde BD"""
        if not self.connected or not self.zkem:
            return {"success": False, "error": "Dispositivo no conectado"}
            
        results = []
        success_count = 0
        error_count = 0
        
        for template_data in templates_data:
            result = await self.sync_template_from_db(template_data)
            results.append({
                "device_user_id": template_data.get('device_user_id'),
                "result": result
            })
            
            if result.get('success'):
                success_count += 1
            else:
                error_count += 1
                
        return {
            "success": True,
            "total": len(templates_data),
            "success_count": success_count,
            "error_count": error_count,
            "details": results,
            "sdk": "zkemkeeper.dll OFICIAL"
        }

# 🚀 Instancia global del dispositivo OFICIAL
f22_device = F22DeviceOfficial(CONFIG['ip'], CONFIG['port'], CONFIG['machine_number'], CONFIG['timeout'])

# ✅ FUNCIONES WEBSOCKET SIN CAMBIOS (solo actualizar llamadas)
async def broadcast_message(message):
    """Enviar mensaje a todos los clientes conectados"""
    if not connected_clients:
        return
        
    encoded_message = json.dumps(message)
    await asyncio.gather(
        *[client.send(encoded_message) for client in connected_clients]
    )

async def handle_client(websocket):
    """Manejar conexión WebSocket de un cliente"""
    client_id = id(websocket)
    logger.info(f"Cliente conectado: {client_id}")
    
    connected_clients.add(websocket)
    
    try:
        await websocket.send(json.dumps({
            "type": "device_status",
            "status": f22_device.last_status,
            "sdk": "zkemkeeper.dll OFICIAL"
        }))
        
        async for message in websocket:
            try:
                data = json.loads(message)
                await process_message(websocket, data)
            except json.JSONDecodeError:
                logger.error(f"Error: Mensaje inválido: {message}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Formato JSON inválido"
                }))
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Cliente desconectado: {client_id}")
    finally:
        connected_clients.discard(websocket)
        
        if not connected_clients and f22_device.connected:
            await f22_device.disconnect()

async def process_message(websocket, data):
    """🚀 PROCESAR MENSAJES - SDK oficial"""
    action = data.get('action', '')
    logger.info(f"🚀 Acción recibida (SDK oficial): {action}")
    
    if action == 'connect_device':
        success = await f22_device.connect()
        if success:
            device_info = await f22_device.get_device_info()
            await websocket.send(json.dumps({
                "type": "device_connected",
                "device_info": device_info,
                "sdk": "zkemkeeper.dll OFICIAL"
            }))
        else:
            await websocket.send(json.dumps({
                "type": "device_connection_error",
                "message": "No se pudo conectar al F22 con SDK oficial"
            }))
    
    elif action == 'disconnect_device':
        await f22_device.disconnect()
        await websocket.send(json.dumps({
            "type": "device_disconnected",
            "sdk": "zkemkeeper.dll OFICIAL"
        }))
    
    elif action == 'get_device_info':
        if not f22_device.connected:
            await f22_device.connect()
        device_info = await f22_device.get_device_info()
        await websocket.send(json.dumps({
            "type": "device_info",
            "device_info": device_info
        }))
    
    elif action == 'get_users':
        if not f22_device.connected:
            await f22_device.connect()
        users_data = await f22_device.get_users()
        await websocket.send(json.dumps({
            "type": "users_list",
            "data": users_data
        }))
    
    # ✅ ACCIÓN: Sincronizar template desde BD CON SDK OFICIAL
    elif action == 'sync_template_from_db':
        if not f22_device.connected:
            await f22_device.connect()
            
        template_data = data.get('templateData')
        if not template_data:
            await websocket.send(json.dumps({
                "type": "sync_error",
                "message": "Datos de template requeridos"
            }))
            return
            
        result = await f22_device.sync_template_from_db(template_data)
        
        await websocket.send(json.dumps({
            "type": "sync_template_result",
            "data": result
        }))
    
    # ✅ ACCIÓN: Eliminar usuario completo CON SDK OFICIAL
    elif action == 'delete_user':
        if not f22_device.connected:
            await f22_device.connect()
            
        device_user_id = data.get('device_user_id')
        
        if not device_user_id:
            await websocket.send(json.dumps({
                "type": "error",
                "message": "device_user_id requerido para eliminación"
            }))
            return
            
        logger.info(f"🗑️ Solicitud eliminación usuario (SDK oficial): {device_user_id}")
        result = await f22_device.delete_user_from_device(device_user_id)
        
        await websocket.send(json.dumps({
            "type": "delete_user_result",
            "data": result
        }))
    
    # ✅ ACCIÓN: Eliminar template específico CON SDK OFICIAL
    elif action == 'delete_template':
        if not f22_device.connected:
            await f22_device.connect()
            
        device_user_id = data.get('device_user_id')
        finger_index = data.get('finger_index')
        
        if not device_user_id or finger_index is None:
            await websocket.send(json.dumps({
                "type": "error",
                "message": "device_user_id y finger_index requeridos"
            }))
            return
            
        logger.info(f"🗑️ Solicitud eliminación template (SDK oficial): Usuario {device_user_id}, Dedo {finger_index}")
        result = await f22_device.delete_specific_template(device_user_id, finger_index)
        
        await websocket.send(json.dumps({
            "type": "delete_template_result",
            "data": result
        }))
    
    # ✅ ACCIÓN: Sincronizar múltiples templates CON SDK OFICIAL
    elif action == 'sync_multiple_templates_from_db':
        if not f22_device.connected:
            await f22_device.connect()
            
        templates_data = data.get('templatesData', [])
        if not templates_data:
            await websocket.send(json.dumps({
                "type": "sync_error",
                "message": "Lista de templates requerida"
            }))
            return
            
        result = await f22_device.sync_multiple_templates_from_db(templates_data)
        
        await websocket.send(json.dumps({
            "type": "sync_multiple_templates_result",
            "data": result
        }))
    
    else:
        await websocket.send(json.dumps({
            "type": "error",
            "message": f"Acción desconocida: {action}"
        }))

async def main():
    """🚀 FUNCIÓN PRINCIPAL - SDK oficial"""
    logger.info(f"🚀 Iniciando F22 WebSocket Service OFICIAL en puerto {CONFIG['ws_port']}...")
    logger.info(f"👤 MIGRADO desde pyzk → zkemkeeper.dll SDK oficial ZKTeco")
    logger.info(f"📅 Migrado: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')} por luishdz04")
    logger.info(f"✅ SDK OFICIAL: zkemkeeper.dll con 676 usuarios confirmados")
    logger.info(f"🚀 MÁS ROBUSTO: Protocolo oficial ZKTeco")
    logger.info(f"🏢 MANTIENE: Integración Supabase para nombres reales")
    logger.info(f"🗑️ MANTIENE: Eliminación completa de usuarios y templates")
    logger.info(f"📡 WebSocket: ws://127.0.0.1:{CONFIG['ws_port']}")
    
    # Verificar DLL
    if os.path.exists(CONFIG['dll_path']):
        logger.info(f"✅ zkemkeeper.dll encontrada: {CONFIG['dll_path']}")
    else:
        logger.error(f"❌ zkemkeeper.dll NO encontrada: {CONFIG['dll_path']}")
        logger.error("💡 Asegúrate de tener zkemkeeper.dll en la carpeta del proyecto")
        return
    
    # Verificar Supabase
    if SUPABASE_CONFIG['url'] and SUPABASE_CONFIG['service_key']:
        logger.info(f"✅ Configuración Supabase detectada")
    else:
        logger.warning(f"⚠️ Configuración Supabase incompleta - usando nombres fallback")
    
    # Iniciar servidor WebSocket
    async with websockets.serve(handle_client, "127.0.0.1", CONFIG['ws_port']):
        logger.info(f"✅ Servidor WebSocket iniciado en ws://127.0.0.1:{CONFIG['ws_port']}")
        logger.info(f"📡 Configurado para F22 en {CONFIG['ip']}:{CONFIG['port']} (SDK oficial)")
        logger.info("⏳ Esperando conexiones de clientes...")
        
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("⛔ Servicio detenido por el usuario")
    except Exception as e:
        logger.error(f"❌ Error en el servicio: {e}")