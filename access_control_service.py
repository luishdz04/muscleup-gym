#!/usr/bin/env python3
"""
F22 Access Control Service - Puerto 8083 (VERSIÓN CORREGIDA)
Servicio de control de acceso en tiempo real para dispositivos ZKTeco F22
Usa polling activo para detectar eventos de acceso
Integrado con Supabase para validaciones de membresía y restricciones
Versión: 2.0.0 - 2025-01-19
Autor: luishdz04
"""

import asyncio
import websockets
import json
import logging
import os
import httpx
import win32com.client
import pythoncom
from dotenv import load_dotenv
from datetime import datetime, time, date, timedelta
import sys
import traceback
from typing import Dict, List, Optional, Tuple
import pytz
import threading

# Cargar variables de entorno
load_dotenv('.env.local')

# Configuración
CONFIG = {
    'ip': '192.168.1.201',  # IP del F22
    'port': 4370,           # Puerto estándar ZKTeco
    'timeout': 5,
    'ws_port': 8083,        # Puerto WebSocket para control de acceso
    'log_level': logging.INFO,
    'machine_number': 1,
    'timezone': 'America/Mexico_City',
    'cache_ttl': 300,       # Cache de 5 minutos
    'polling_interval': 0.5, # Intervalo de polling en segundos
}

# Configuración de Supabase
SUPABASE_CONFIG = {
    'url': os.getenv('NEXT_PUBLIC_SUPABASE_URL', ''),
    'service_key': os.getenv('SUPABASE_SERVICE_ROLE_KEY', ''),
}

# Configuración de logging
logging.basicConfig(
    level=CONFIG['log_level'],
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('f22_access_control_fixed.log', encoding='utf-8')
    ]
)
logger = logging.getLogger('f22_access_control')

# Cache de validaciones
validation_cache = {}

# Clientes WebSocket conectados
connected_clients = set()

# Almacenar últimos eventos procesados para evitar duplicados
processed_events = set()
MAX_PROCESSED_EVENTS = 1000

class AccessControlManager:
    """
    Gestor de control de acceso con validaciones en tiempo real
    Versión corregida usando polling activo
    """
    
    def __init__(self):
        self.zkem = None
        self.connected = False
        self.monitoring_active = False
        self._com_initialized = False
        self.access_config = None
        self.last_config_update = None
        self.polling_thread = None
        self.last_log_count = 0
        
    async def connect(self):
        """Conectar al dispositivo F22"""
        if self.connected and self.zkem:
            try:
                self.zkem.GetLastError()
                logger.info("✅ Conexión existente válida")
                return True
            except:
                logger.warning("⚠️ Conexión existente inválida, reconectando...")
                self.connected = False
                self.zkem = None
        
        try:
            logger.info(f"🔌 Conectando a F22 para control de acceso...")
            
            if not self._com_initialized:
                pythoncom.CoInitialize()
                self._com_initialized = True
            
            self.zkem = win32com.client.Dispatch("zkemkeeper.ZKEM")
            self.zkem.SetCommPassword(0)
            
            if self.zkem.Connect_Net(CONFIG['ip'], CONFIG['port']):
                self.connected = True
                self.zkem.EnableDevice(CONFIG['machine_number'], True)
                logger.info("✅ Conexión exitosa para control de acceso")
                
                # Obtener conteo inicial de logs
                try:
                    self.last_log_count = self._get_attendance_count()
                    logger.info(f"📊 Logs iniciales en dispositivo: {self.last_log_count}")
                except:
                    self.last_log_count = 0
                
                # Cargar configuración inicial
                await self.load_access_config()
                
                return True
            else:
                logger.error("❌ Error conectando al dispositivo")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error crítico en conexión: {e}")
            return False
    
    def _get_attendance_count(self):
        """Obtener cantidad de registros de asistencia/acceso"""
        try:
            # Status 6 = Attendance record count
            count = 0
            if self.zkem.GetDeviceStatus(CONFIG['machine_number'], 6, count):
                return count
            return 0
        except:
            return 0
    
    async def load_access_config(self):
        """Cargar configuración de control de acceso desde Supabase"""
        try:
            headers = {
                'apikey': SUPABASE_CONFIG['service_key'],
                'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
                'Content-Type': 'application/json'
            }
            
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/access_control_config"
            params = {'select': '*', 'limit': '1'}
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    configs = response.json()
                    if configs:
                        self.access_config = configs[0]
                        self.last_config_update = datetime.now()
                        logger.info("✅ Configuración de acceso cargada")
                        return True
                        
        except Exception as e:
            logger.error(f"❌ Error cargando configuración: {e}")
            
        # Configuración por defecto
        self.access_config = {
            'enable_biometric': True,
            'require_active_membership': True,
            'allow_guest_access': False,
            'access_schedule_enabled': True,
            'access_start_time': '06:00:00',
            'access_end_time': '23:00:00',
            'access_days_of_week': ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
            'notification_enabled': True
        }
        return False
    
    async def start_monitoring(self):
        """Iniciar monitoreo de eventos usando polling activo"""
        if not self.connected:
            return False
            
        try:
            logger.info("🔄 Iniciando monitoreo de accesos (modo polling)...")
            
            # Poner dispositivo en modo de captura de eventos
            self.zkem.EnableDevice(CONFIG['machine_number'], False)
            
            self.monitoring_active = True
            
            # Iniciar thread de polling
            self.polling_thread = threading.Thread(target=self._polling_worker)
            self.polling_thread.daemon = True
            self.polling_thread.start()
            
            logger.info("✅ Monitoreo de accesos iniciado correctamente")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error iniciando monitoreo: {e}")
            logger.error(traceback.format_exc())
            return False
    
    def _polling_worker(self):
        """Worker thread para polling de eventos"""
        pythoncom.CoInitialize()
        
        try:
            logger.info("🔄 Thread de polling iniciado")
            
            while self.monitoring_active and self.connected:
                try:
                    # Método 1: Leer eventos en tiempo real
                    if self._read_realtime_events():
                        continue
                    
                    # Método 2: Verificar nuevos logs de asistencia
                    self._check_new_attendance_logs()
                    
                    # Pequeña pausa para no sobrecargar CPU
                    pythoncom.PumpWaitingMessages()
                    threading.Event().wait(CONFIG['polling_interval'])
                    
                except Exception as e:
                    logger.error(f"❌ Error en polling: {e}")
                    threading.Event().wait(1)
                    
        except Exception as e:
            logger.error(f"❌ Error crítico en polling worker: {e}")
        finally:
            pythoncom.CoUninitialize()
            logger.info("🔄 Thread de polling finalizado")
    
    def _read_realtime_events(self):
        """Leer eventos en tiempo real del buffer"""
        try:
            # Habilitar la lectura de eventos RT
            if self.zkem.ReadRTLog(CONFIG['machine_number']):
                events_found = False
                
                while True:
                    # Variables para el evento
                    dw_enroll_number = ""
                    dw_verify_mode = 0
                    dw_in_out_mode = 0
                    dw_year = 0
                    dw_month = 0
                    dw_day = 0
                    dw_hour = 0
                    dw_minute = 0
                    dw_second = 0
                    dw_workcode = 0
                    
                    # Obtener evento
                    if self.zkem.SSR_GetRTLog(
                        CONFIG['machine_number'],
                        dw_enroll_number,
                        dw_verify_mode,
                        dw_in_out_mode,
                        dw_year,
                        dw_month,
                        dw_day,
                        dw_hour,
                        dw_minute,
                        dw_second,
                        dw_workcode
                    ):
                        events_found = True
                        
                        # Crear ID único del evento
                        event_id = f"{dw_enroll_number}_{dw_year}{dw_month:02d}{dw_day:02d}_{dw_hour:02d}{dw_minute:02d}{dw_second:02d}"
                        
                        # Evitar procesar eventos duplicados
                        if event_id not in processed_events:
                            processed_events.add(event_id)
                            
                            # Limpiar eventos antiguos si hay demasiados
                            if len(processed_events) > MAX_PROCESSED_EVENTS:
                                processed_events.clear()
                            
                            logger.info(f"🎯 EVENTO RT DETECTADO: Usuario {dw_enroll_number} - {dw_hour:02d}:{dw_minute:02d}:{dw_second:02d}")
                            
                            # Procesar evento asíncronamente
                            event_data = {
                                'user_id': dw_enroll_number,
                                'verify_mode': dw_verify_mode,
                                'in_out_mode': dw_in_out_mode,
                                'timestamp': f"{dw_year}-{dw_month:02d}-{dw_day:02d} {dw_hour:02d}:{dw_minute:02d}:{dw_second:02d}"
                            }
                            
                            # Ejecutar validación en el loop principal
                            asyncio.run_coroutine_threadsafe(
                                self._process_access_event(event_data),
                                asyncio.get_event_loop()
                            )
                    else:
                        break
                
                return events_found
                
        except Exception as e:
            logger.error(f"❌ Error leyendo eventos RT: {e}")
            return False
    
    def _check_new_attendance_logs(self):
        """Verificar si hay nuevos logs de asistencia"""
        try:
            current_count = self._get_attendance_count()
            
            if current_count > self.last_log_count:
                logger.info(f"📊 Nuevos logs detectados: {current_count - self.last_log_count}")
                
                # Leer los logs generales
                if self.zkem.ReadGeneralLogData(CONFIG['machine_number']):
                    # Procesar solo los nuevos logs
                    logs_to_skip = self.last_log_count
                    logs_processed = 0
                    
                    while True:
                        dw_enroll_number = ""
                        dw_verify_mode = 0
                        dw_in_out_mode = 0
                        dw_year = 0
                        dw_month = 0
                        dw_day = 0
                        dw_hour = 0
                        dw_minute = 0
                        dw_second = 0
                        dw_workcode = 0
                        
                        if self.zkem.SSR_GetGeneralLogData(
                            CONFIG['machine_number'],
                            dw_enroll_number,
                            dw_verify_mode,
                            dw_in_out_mode,
                            dw_year,
                            dw_month,
                            dw_day,
                            dw_hour,
                            dw_minute,
                            dw_second,
                            dw_workcode
                        ):
                            logs_processed += 1
                            
                            # Skip logs antiguos
                            if logs_processed <= logs_to_skip:
                                continue
                            
                            # Procesar log nuevo
                            event_id = f"{dw_enroll_number}_{dw_year}{dw_month:02d}{dw_day:02d}_{dw_hour:02d}{dw_minute:02d}{dw_second:02d}"
                            
                            if event_id not in processed_events:
                                processed_events.add(event_id)
                                
                                logger.info(f"📝 LOG NUEVO: Usuario {dw_enroll_number}")
                                
                                event_data = {
                                    'user_id': dw_enroll_number,
                                    'verify_mode': dw_verify_mode,
                                    'in_out_mode': dw_in_out_mode,
                                    'timestamp': f"{dw_year}-{dw_month:02d}-{dw_day:02d} {dw_hour:02d}:{dw_minute:02d}:{dw_second:02d}"
                                }
                                
                                asyncio.run_coroutine_threadsafe(
                                    self._process_access_event(event_data),
                                    asyncio.get_event_loop()
                                )
                        else:
                            break
                
                self.last_log_count = current_count
                
        except Exception as e:
            logger.error(f"❌ Error verificando logs: {e}")
    
    async def _process_access_event(self, event_data):
        """Procesar evento de acceso con validaciones"""
        try:
            user_id = event_data['user_id']
            logger.info(f"🔍 === PROCESANDO ACCESO ===")
            logger.info(f"👤 Usuario: {user_id}")
            logger.info(f"🕐 Timestamp: {event_data['timestamp']}")
            
            # Validar acceso
            validation_result = await self.validate_user_access(user_id)
            
            if validation_result['granted']:
                # ACCESO PERMITIDO
                logger.info(f"✅ ACCESO PERMITIDO - {validation_result.get('user_name', f'Usuario {user_id}')}")
                
                # Abrir puerta
                try:
                    self.zkem.ACUnlock(CONFIG['machine_number'], 5)  # 5 segundos
                    logger.info("🚪 Puerta abierta por 5 segundos")
                except Exception as e:
                    logger.error(f"❌ Error abriendo puerta: {e}")
                
                # Registrar en BD
                await self.log_access(user_id, 'entry', True, validation_result.get('reason'))
                
                # Notificar WebSocket
                await self._broadcast_access_event({
                    'type': 'access_granted',
                    'user_id': user_id,
                    'user_name': validation_result.get('user_name'),
                    'timestamp': datetime.now().isoformat(),
                    'event_timestamp': event_data['timestamp'],
                    'details': validation_result
                })
                
            else:
                # ACCESO DENEGADO
                logger.warning(f"❌ ACCESO DENEGADO - Usuario {user_id}")
                logger.warning(f"❌ Razón: {validation_result.get('reason')}")
                
                # Registrar intento fallido
                await self.log_access(user_id, 'denied', False, validation_result.get('reason'))
                
                # Notificar WebSocket
                await self._broadcast_access_event({
                    'type': 'access_denied',
                    'user_id': user_id,
                    'reason': validation_result.get('reason'),
                    'timestamp': datetime.now().isoformat(),
                    'event_timestamp': event_data['timestamp']
                })
            
            logger.info(f"🔍 === FIN PROCESAMIENTO ===\n")
                
        except Exception as e:
            logger.error(f"❌ Error procesando evento de acceso: {e}")
            logger.error(traceback.format_exc())
    
    async def validate_user_access(self, device_user_id) -> Dict:
        """
        Validar si un usuario tiene acceso permitido
        Retorna: {granted: bool, reason: str, user_name: str, details: dict}
        """
        try:
            # Verificar cache
            cache_key = f"access_{device_user_id}"
            if cache_key in validation_cache:
                cache_data = validation_cache[cache_key]
                if (datetime.now() - cache_data['timestamp']).seconds < CONFIG['cache_ttl']:
                    logger.info(f"📋 Usando validación en cache para usuario {device_user_id}")
                    return cache_data['result']
            
            # 1. Verificar si el control biométrico está habilitado
            if not self.access_config.get('enable_biometric', True):
                return {
                    'granted': False,
                    'reason': 'Control biométrico deshabilitado',
                    'user_name': f'Usuario {device_user_id}'
                }
            
            # 2. Obtener información del usuario desde Supabase
            user_info = await self._get_user_info(device_user_id)
            if not user_info:
                return {
                    'granted': False,
                    'reason': 'Usuario no encontrado en base de datos',
                    'user_name': f'Usuario {device_user_id}'
                }
            
            user_name = f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip()
            user_uuid = user_info.get('id')
            
            logger.info(f"👤 Usuario identificado: {user_name} (UUID: {user_uuid})")
            
            # 3. Verificar si el usuario tiene huella registrada
            if not user_info.get('fingerprint', False):
                return {
                    'granted': False,
                    'reason': 'Usuario sin huella registrada',
                    'user_name': user_name
                }
            
            # 4. Verificar membresía activa si es requerida
            if self.access_config.get('require_active_membership', True):
                membership_validation = await self._validate_membership(user_uuid)
                if not membership_validation['valid']:
                    return {
                        'granted': False,
                        'reason': membership_validation['reason'],
                        'user_name': user_name,
                        'membership_details': membership_validation
                    }
                logger.info(f"✅ Membresía válida: {membership_validation.get('plan_name')}")
            
            # 5. Verificar restricciones de horario global
            if self.access_config.get('access_schedule_enabled', True):
                schedule_validation = self._validate_schedule()
                if not schedule_validation['valid']:
                    return {
                        'granted': False,
                        'reason': schedule_validation['reason'],
                        'user_name': user_name
                    }
            
            # 6. Verificar restricciones del plan de membresía
            if membership_validation.get('plan_id'):
                plan_validation = await self._validate_plan_restrictions(
                    membership_validation['plan_id'],
                    user_uuid
                )
                if not plan_validation['valid']:
                    return {
                        'granted': False,
                        'reason': plan_validation['reason'],
                        'user_name': user_name,
                        'plan_details': plan_validation
                    }
            
            # 7. Verificar accesos temporales
            temp_access = await self._check_temporary_access(user_uuid)
            if temp_access and temp_access['valid']:
                result = {
                    'granted': True,
                    'reason': f"Acceso temporal: {temp_access['type']}",
                    'user_name': user_name,
                    'access_type': 'temporary',
                    'temp_details': temp_access
                }
            else:
                # Todo validado, acceso permitido
                result = {
                    'granted': True,
                    'reason': 'Todas las validaciones pasadas',
                    'user_name': user_name,
                    'membership_type': membership_validation.get('type'),
                    'plan_name': membership_validation.get('plan_name')
                }
            
            # Guardar en cache
            validation_cache[cache_key] = {
                'result': result,
                'timestamp': datetime.now()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Error validando acceso: {e}")
            logger.error(traceback.format_exc())
            return {
                'granted': False,
                'reason': f'Error en validación: {str(e)}',
                'user_name': f'Usuario {device_user_id}'
            }
    
    async def _get_user_info(self, device_user_id) -> Optional[Dict]:
        """Obtener información del usuario desde Supabase por device_user_id"""
        try:
            headers = {
                'apikey': SUPABASE_CONFIG['service_key'],
                'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
            }
            
            # Buscar en fingerprint_templates
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/fingerprint_templates"
            params = {
                'select': 'user_id',
                'device_user_id': f'eq.{device_user_id}',
                'limit': '1'
            }
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    templates = response.json()
                    if templates and templates[0].get('user_id'):
                        user_id = templates[0]['user_id']
                        
                        # Obtener info del usuario
                        user_url = f"{SUPABASE_CONFIG['url']}/rest/v1/Users"
                        user_params = {
                            'select': '*',
                            'id': f'eq.{user_id}'
                        }
                        
                        user_response = await client.get(user_url, headers=headers, params=user_params)
                        if user_response.status_code == 200:
                            users = user_response.json()
                            if users:
                                return users[0]
                                
        except Exception as e:
            logger.error(f"❌ Error obteniendo info de usuario: {e}")
            
        return None
    
    async def _validate_membership(self, user_id) -> Dict:
        """Validar membresía activa del usuario"""
        try:
            headers = {
                'apikey': SUPABASE_CONFIG['service_key'],
                'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
            }
            
            # Obtener membresía activa
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/user_memberships"
            params = {
                'select': '*, membership_plans!inner(name, id)',
                'userid': f'eq.{user_id}',
                'status': 'eq.active',
                'order': 'created_at.desc',
                'limit': '1'
            }
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    memberships = response.json()
                    if memberships:
                        membership = memberships[0]
                        
                        # Verificar vigencia
                        end_date = membership.get('end_date')
                        if end_date:
                            end_datetime = datetime.strptime(end_date, '%Y-%m-%d').date()
                            if end_datetime < date.today():
                                return {
                                    'valid': False,
                                    'reason': f'Membresía vencida el {end_date}'
                                }
                        
                        # Verificar si está congelada
                        if membership.get('status') == 'frozen':
                            return {
                                'valid': False,
                                'reason': 'Membresía congelada'
                            }
                        
                        # Verificar visitas restantes si aplica
                        if membership.get('payment_type') == 'visit':
                            remaining = membership.get('remaining_visits', 0)
                            if remaining <= 0:
                                return {
                                    'valid': False,
                                    'reason': 'Sin visitas restantes'
                                }
                        
                        return {
                            'valid': True,
                            'type': membership.get('payment_type'),
                            'plan_id': membership['membership_plans']['id'],
                            'plan_name': membership['membership_plans']['name'],
                            'end_date': end_date,
                            'remaining_visits': membership.get('remaining_visits')
                        }
                    else:
                        return {
                            'valid': False,
                            'reason': 'Sin membresía activa'
                        }
                        
        except Exception as e:
            logger.error(f"❌ Error validando membresía: {e}")
            
        return {
            'valid': False,
            'reason': 'Error validando membresía'
        }
    
    def _validate_schedule(self) -> Dict:
        """Validar horario de acceso global"""
        try:
            now = datetime.now(pytz.timezone(CONFIG['timezone']))
            current_time = now.time()
            current_day = now.strftime('%A').lower()
            
            # Verificar día permitido
            allowed_days = self.access_config.get('access_days_of_week', [])
            if current_day not in allowed_days:
                return {
                    'valid': False,
                    'reason': f'Acceso no permitido los {current_day}'
                }
            
            # Verificar horario
            start_time = time.fromisoformat(self.access_config.get('access_start_time', '06:00:00'))
            end_time = time.fromisoformat(self.access_config.get('access_end_time', '23:00:00'))
            
            if not (start_time <= current_time <= end_time):
                return {
                    'valid': False,
                    'reason': f'Fuera de horario permitido ({start_time.strftime("%H:%M")} - {end_time.strftime("%H:%M")})'
                }
            
            return {'valid': True}
            
        except Exception as e:
            logger.error(f"❌ Error validando horario: {e}")
            return {'valid': True}  # En caso de error, permitir acceso
    
    async def _validate_plan_restrictions(self, plan_id, user_id) -> Dict:
        """Validar restricciones específicas del plan"""
        try:
            headers = {
                'apikey': SUPABASE_CONFIG['service_key'],
                'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
            }
            
            # Obtener restricciones del plan
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/plan_access_restrictions"
            params = {
                'select': '*',
                'plan_id': f'eq.{plan_id}'
            }
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    restrictions = response.json()
                    if restrictions:
                        restriction = restrictions[0]
                        
                        # Si no hay restricciones de tiempo, permitir
                        if not restriction.get('has_time_restrictions', False):
                            return {'valid': True}
                        
                        now = datetime.now(pytz.timezone(CONFIG['timezone']))
                        current_time = now.time()
                        current_day = now.strftime('%A').lower()
                        
                        # Verificar días permitidos del plan
                        allowed_days = restriction.get('allowed_days', [])
                        if current_day not in allowed_days:
                            return {
                                'valid': False,
                                'reason': f'Plan no permite acceso los {current_day}'
                            }
                        
                        # Verificar horario del plan
                        start_time = time.fromisoformat(restriction.get('access_start_time', '00:00:00'))
                        end_time = time.fromisoformat(restriction.get('access_end_time', '23:59:59'))
                        
                        if not (start_time <= current_time <= end_time):
                            return {
                                'valid': False,
                                'reason': f'Plan permite acceso solo de {start_time.strftime("%H:%M")} a {end_time.strftime("%H:%M")}'
                            }
                        
                        # Verificar límite de entradas diarias
                        max_daily = restriction.get('max_daily_entries', 999)
                        if max_daily < 999:
                            entries_today = await self._count_daily_entries(user_id)
                            if entries_today >= max_daily:
                                return {
                                    'valid': False,
                                    'reason': f'Límite diario alcanzado ({max_daily} entradas)'
                                }
                        
                        # Verificar fechas bloqueadas
                        blackout_dates = restriction.get('blackout_dates', [])
                        today_str = now.strftime('%Y-%m-%d')
                        if today_str in blackout_dates:
                            return {
                                'valid': False,
                                'reason': 'Fecha bloqueada para este plan'
                            }
                        
                        return {'valid': True}
                        
        except Exception as e:
            logger.error(f"❌ Error validando restricciones del plan: {e}")
            
        return {'valid': True}  # Si no hay restricciones o hay error, permitir
    
    async def _check_temporary_access(self, user_id) -> Optional[Dict]:
        """Verificar si el usuario tiene acceso temporal activo"""
        try:
            headers = {
                'apikey': SUPABASE_CONFIG['service_key'],
                'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
            }
            
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/temporary_access"
            now = datetime.now(pytz.timezone(CONFIG['timezone'])).isoformat()
            
            params = {
                'select': '*',
                'user_id': f'eq.{user_id}',
                'is_active': 'eq.true',
                'valid_from': f'lte.{now}',
                'valid_until': f'gte.{now}',
                'limit': '1'
            }
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    temp_accesses = response.json()
                    if temp_accesses:
                        temp_access = temp_accesses[0]
                        
                        # Verificar límite de entradas
                        if temp_access.get('current_entries', 0) >= temp_access.get('max_entries', 1):
                            return {'valid': False, 'reason': 'Límite de entradas temporales alcanzado'}
                        
                        # Incrementar contador de entradas
                        await self._increment_temp_access_counter(temp_access['id'])
                        
                        return {
                            'valid': True,
                            'type': temp_access.get('access_type'),
                            'expires': temp_access.get('valid_until'),
                            'remaining_entries': temp_access.get('max_entries', 1) - temp_access.get('current_entries', 0) - 1
                        }
                        
        except Exception as e:
            logger.error(f"❌ Error verificando acceso temporal: {e}")
            
        return None
    
    async def _count_daily_entries(self, user_id) -> int:
        """Contar entradas del día para un usuario"""
        try:
            headers = {
                'apikey': SUPABASE_CONFIG['service_key'],
                'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
            }
            
            today = date.today()
            start_of_day = datetime.combine(today, time.min).isoformat()
            end_of_day = datetime.combine(today, time.max).isoformat()
            
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/access_logs"
            params = {
                'select': 'id',
                'user_id': f'eq.{user_id}',
                'access_type': 'eq.entry',
                'success': 'eq.true',
                'created_at': f'gte.{start_of_day}',
                'created_at': f'lte.{end_of_day}'
            }
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    entries = response.json()
                    return len(entries)
                    
        except Exception as e:
            logger.error(f"❌ Error contando entradas diarias: {e}")
            
        return 0
    
    async def _increment_temp_access_counter(self, temp_access_id):
        """Incrementar contador de acceso temporal"""
        try:
            headers = {
                'apikey': SUPABASE_CONFIG['service_key'],
                'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
                'Content-Type': 'application/json'
            }
            
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/rpc/increment_temp_access_counter"
            data = {'access_id': temp_access_id}
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                await client.post(url, headers=headers, json=data)
                
        except Exception as e:
            logger.error(f"❌ Error incrementando contador temporal: {e}")
    
    async def log_access(self, device_user_id, access_type, success, denial_reason=None):
        """Registrar evento de acceso en base de datos"""
        try:
            # Obtener UUID del usuario
            user_info = await self._get_user_info(device_user_id)
            if not user_info:
                logger.warning(f"⚠️ No se pudo obtener UUID para device_user_id: {device_user_id}")
                return
            
            user_uuid = user_info.get('id')
            
            headers = {
                'apikey': SUPABASE_CONFIG['service_key'],
                'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
                'Content-Type': 'application/json'
            }
            
            # Obtener ID del dispositivo
            device_id = await self._get_device_id()
            
            data = {
                'user_id': user_uuid,
                'device_id': device_id,
                'access_type': access_type,
                'access_method': 'fingerprint',
                'success': success,
                'denial_reason': denial_reason,
                'device_timestamp': datetime.now(pytz.timezone(CONFIG['timezone'])).isoformat()
            }
            
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/access_logs"
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.post(url, headers=headers, json=data)
                
                if response.status_code in [200, 201]:
                    logger.info(f"✅ Acceso registrado en BD: {access_type} - Usuario {user_uuid}")
                else:
                    logger.error(f"❌ Error registrando acceso: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"❌ Error registrando acceso en BD: {e}")
    
    async def _get_device_id(self) -> Optional[str]:
        """Obtener ID del dispositivo desde la BD"""
        try:
            headers = {
                'apikey': SUPABASE_CONFIG['service_key'],
                'Authorization': f"Bearer {SUPABASE_CONFIG['service_key']}",
            }
            
            url = f"{SUPABASE_CONFIG['url']}/rest/v1/biometric_devices"
            params = {
                'select': 'id',
                'ip_address': f'eq.{CONFIG["ip"]}',
                'is_active': 'eq.true',
                'limit': '1'
            }
            
            async with httpx.AsyncClient(timeout=httpx.Timeout(10.0)) as client:
                response = await client.get(url, headers=headers, params=params)
                
                if response.status_code == 200:
                    devices = response.json()
                    if devices:
                        return devices[0]['id']
                        
        except Exception as e:
            logger.error(f"❌ Error obteniendo device_id: {e}")
            
        return None
    
    async def _broadcast_access_event(self, event_data):
        """Enviar evento a todos los clientes WebSocket conectados"""
        if not connected_clients:
            return
            
        message = json.dumps(event_data, ensure_ascii=False)
        disconnected = set()
        
        for client in connected_clients:
            try:
                await client.send(message)
            except:
                disconnected.add(client)
        
        connected_clients.difference_update(disconnected)
    
    async def stop_monitoring(self):
        """Detener el monitoreo"""
        try:
            logger.info("🛑 Deteniendo monitoreo...")
            self.monitoring_active = False
            
            if self.polling_thread and self.polling_thread.is_alive():
                self.polling_thread.join(timeout=5)
            
            # Re-habilitar el dispositivo
            if self.zkem and self.connected:
                self.zkem.EnableDevice(CONFIG['machine_number'], True)
            
            logger.info("✅ Monitoreo detenido")
            
        except Exception as e:
            logger.error(f"❌ Error deteniendo monitoreo: {e}")
    
    async def disconnect(self):
        """Desconectar del dispositivo"""
        try:
            await self.stop_monitoring()
            
            if self.zkem and self.connected:
                self.zkem.EnableDevice(CONFIG['machine_number'], True)
                self.zkem.Disconnect()
                
            self.connected = False
            self.zkem = None
            
            if self._com_initialized:
                pythoncom.CoUninitialize()
                self._com_initialized = False
                
            logger.info("✅ Desconectado del dispositivo")
            
        except Exception as e:
            logger.error(f"❌ Error al desconectar: {e}")

# Instancia global del gestor
access_manager = AccessControlManager()

async def handle_websocket_client(websocket):
    """Manejar conexión WebSocket de un cliente"""
    client_id = id(websocket)
    logger.info(f"🔌 Cliente WebSocket conectado: {client_id}")
    
    connected_clients.add(websocket)
    
    try:
        # Enviar estado inicial
        await websocket.send(json.dumps({
            "type": "connection_status",
            "connected": access_manager.connected,
            "monitoring": access_manager.monitoring_active,
            "timestamp": datetime.now().isoformat()
        }))
        
        # Procesar mensajes
        async for message in websocket:
            try:
                data = json.loads(message)
                await process_client_message(websocket, data)
            except json.JSONDecodeError:
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Formato JSON inválido"
                }))
            except Exception as e:
                logger.error(f"❌ Error procesando mensaje: {e}")
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"🔌 Cliente WebSocket desconectado: {client_id}")
    finally:
        connected_clients.discard(websocket)

async def process_client_message(websocket, data):
    """Procesar mensaje del cliente"""
    action = data.get('action', '')
    logger.info(f"📨 Acción recibida: {action}")
    
    if action == 'connect':
        success = await access_manager.connect()
        await websocket.send(json.dumps({
            "type": "connect_result",
            "success": success,
            "timestamp": datetime.now().isoformat()
        }))
        
    elif action == 'disconnect':
        await access_manager.disconnect()
        await websocket.send(json.dumps({
            "type": "disconnect_result",
            "success": True,
            "timestamp": datetime.now().isoformat()
        }))
        
    elif action == 'start_monitoring':
        if not access_manager.connected:
            await access_manager.connect()
            
        success = await access_manager.start_monitoring()
        await websocket.send(json.dumps({
            "type": "monitoring_status",
            "active": success,
            "timestamp": datetime.now().isoformat()
        }))
        
    elif action == 'stop_monitoring':
        await access_manager.stop_monitoring()
        await websocket.send(json.dumps({
            "type": "monitoring_status",
            "active": False,
            "timestamp": datetime.now().isoformat()
        }))
        
    elif action == 'validate_access':
        # Validación manual de acceso
        user_id = data.get('user_id')
        if user_id:
            result = await access_manager.validate_user_access(user_id)
            await websocket.send(json.dumps({
                "type": "validation_result",
                "user_id": user_id,
                "result": result,
                "timestamp": datetime.now().isoformat()
            }))
        
    elif action == 'reload_config':
        # Recargar configuración
        await access_manager.load_access_config()
        await websocket.send(json.dumps({
            "type": "config_reloaded",
            "config": access_manager.access_config,
            "timestamp": datetime.now().isoformat()
        }))
        
    elif action == 'get_status':
        # Obtener estado actual
        await websocket.send(json.dumps({
            "type": "status",
            "connected": access_manager.connected,
            "monitoring": access_manager.monitoring_active,
            "config": access_manager.access_config,
            "timestamp": datetime.now().isoformat()
        }))
        
    else:
        await websocket.send(json.dumps({
            "type": "error",
            "message": f"Acción desconocida: {action}"
        }))

async def main():
    """Función principal del servicio"""
    logger.info("="*80)
    logger.info("🚀 F22 ACCESS CONTROL SERVICE - VERSIÓN CORREGIDA")
    logger.info("="*80)
    logger.info(f"📅 Versión: 2.0.0 - {datetime.now()}")
    logger.info(f"👤 Autor: luishdz04")
    logger.info(f"🌐 Puerto WebSocket: {CONFIG['ws_port']}")
    logger.info(f"🏢 Dispositivo: {CONFIG['ip']}:{CONFIG['port']}")
    logger.info(f"🌍 Zona horaria: {CONFIG['timezone']}")
    logger.info(f"🔄 Intervalo de polling: {CONFIG['polling_interval']}s")
    logger.info("")
    logger.info("✅ CARACTERÍSTICAS:")
    logger.info("   🔐 Control de acceso en tiempo real (polling activo)")
    logger.info("   📊 Validación de membresías activas")
    logger.info("   ⏰ Restricciones de horarios globales y por plan")
    logger.info("   🎫 Soporte para accesos temporales")
    logger.info("   📝 Registro completo de eventos en BD")
    logger.info("   🔄 Cache inteligente de validaciones")
    logger.info("   📡 Notificaciones en tiempo real vía WebSocket")
    logger.info("   🔧 Polling robusto para captura de eventos")
    logger.info("="*80)
    
    # Verificar configuración
    if not SUPABASE_CONFIG['url'] or not SUPABASE_CONFIG['service_key']:
        logger.error("❌ Configuración de Supabase incompleta. Verifique .env.local")
        return
    
    try:
        # Iniciar servidor WebSocket
        async with websockets.serve(
            handle_websocket_client,
            "127.0.0.1",
            CONFIG['ws_port'],
            ping_interval=20,
            ping_timeout=10
        ):
            logger.info(f"✅ Servidor WebSocket activo en ws://127.0.0.1:{CONFIG['ws_port']}")
            logger.info("⏳ Esperando conexiones...")
            logger.info("💡 Use un cliente WebSocket para conectar y comenzar el monitoreo")
            
            # Mantener el servicio corriendo
            await asyncio.Future()
            
    except Exception as e:
        logger.error(f"❌ Error iniciando servidor: {e}")
        logger.error(traceback.format_exc())
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("⛔ Servicio detenido por el usuario")
        if access_manager.connected:
            asyncio.run(access_manager.disconnect())
    except Exception as e:
        logger.error(f"❌ Error crítico: {e}")
        sys.exit(1)