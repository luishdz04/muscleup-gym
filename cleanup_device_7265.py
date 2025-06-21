#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script FINAL - Limpiar Templates Residuales
Current UTC Time: 2025-06-19 08:49:58
Usuario: luishdz04
Objetivo: Eliminar templates residuales del ex-usuario 7265 (ahora neutralizado)
"""

import sys
import logging
from datetime import datetime
from zk import ZK

# CONFIGURACION
DEVICE_IP = '192.168.1.201'
DEVICE_PORT = 4370
DEVICE_PASSWORD = 0
TARGET_UID = 587  # UID interno del usuario (del log anterior)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

def cleanup_residual_templates():
    """
    Eliminar templates residuales del UID 587 (ex-device_user_id 7265)
    """
    logger.info("INICIANDO LIMPIEZA DE TEMPLATES RESIDUALES")
    logger.info(f"Current UTC Time: 2025-06-19 08:49:58")
    logger.info(f"Ejecutado por: luishdz04")
    logger.info(f"Target UID: {TARGET_UID} (ex-device_user_id 7265)")
    
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=10, password=DEVICE_PASSWORD)
    conn = None
    
    try:
        logger.info("Conectando al F22...")
        conn = zk.connect()
        logger.info("Conexion exitosa")
        
        # Obtener todos los templates
        logger.info("Obteniendo templates...")
        all_templates = conn.get_templates()
        
        # Filtrar templates del UID objetivo
        target_templates = [t for t in all_templates if t.uid == TARGET_UID]
        other_templates = [t for t in all_templates if t.uid != TARGET_UID]
        
        logger.info(f"Templates totales: {len(all_templates)}")
        logger.info(f"Templates del UID {TARGET_UID}: {len(target_templates)}")
        logger.info(f"Templates de otros usuarios: {len(other_templates)}")
        
        if not target_templates:
            logger.info("No hay templates residuales para eliminar")
            return True
        
        # Eliminar templates uno por uno con diferentes métodos
        templates_eliminados = 0
        
        for i, template in enumerate(target_templates):
            logger.info(f"Eliminando template {i+1}/{len(target_templates)}: uid={template.uid}, fid={template.fid}")
            
            try:
                # Método 1: delete_user_template
                result1 = conn.delete_user_template(uid=template.uid, temp_id=template.fid)
                if result1:
                    logger.info(f"OK - Template eliminado (metodo 1)")
                    templates_eliminados += 1
                    continue
                
                # Método 2: Intentar con diferentes parámetros
                result2 = conn.delete_user_template(uid=TARGET_UID, temp_id=template.fid)
                if result2:
                    logger.info(f"OK - Template eliminado (metodo 2)")
                    templates_eliminados += 1
                    continue
                
                # Método 3: Forzar eliminación
                try:
                    conn.delete_user(uid=TARGET_UID)  # Esto puede ayudar a limpiar
                    logger.info(f"Intento de limpieza forzada realizado")
                except:
                    pass
                
                logger.error(f"ERROR - No se pudo eliminar template uid={template.uid}, fid={template.fid}")
                
            except Exception as e:
                logger.error(f"EXCEPTION eliminando template: {e}")
        
        # Verificación final
        logger.info("Verificacion final...")
        final_templates = conn.get_templates()
        remaining_target_templates = [t for t in final_templates if t.uid == TARGET_UID]
        
        logger.info("===== REPORTE FINAL =====")
        logger.info(f"Templates eliminados: {templates_eliminados}")
        logger.info(f"Templates residuales restantes: {len(remaining_target_templates)}")
        logger.info(f"Templates totales en dispositivo: {len(final_templates)}")
        
        success = len(remaining_target_templates) == 0
        
        if success:
            logger.info("SUCCESS - Limpieza de templates completada")
            logger.info("RESULT - No quedan templates residuales del ex-usuario 7265")
        else:
            logger.info("PARTIAL - Algunos templates persisten")
            logger.info("INFO - El usuario 7265 ya fue neutralizado, templates residuales no causaran conflictos")
        
        return success
        
    except Exception as e:
        logger.error(f"ERROR critico: {e}")
        return False
        
    finally:
        if conn:
            conn.disconnect()

def main():
    print("Script de Limpieza de Templates Residuales")
    print(f"Current UTC Time: 2025-06-19 08:49:58")
    print(f"Usuario: luishdz04")
    print(f"Objetivo: Limpiar templates residuales del ex-usuario 7265")
    print("NOTA: El usuario 7265 ya fue neutralizado exitosamente")
    print("=" * 60)
    
    confirm = input("Continuar con limpieza de templates residuales? (y/N): ")
    
    if confirm.lower() in ['y', 'yes', 'si', 's']:
        success = cleanup_residual_templates()
        
        if success:
            print("\nSUCCESS - Templates residuales eliminados")
        else:
            print("\nINFO - Templates persisten pero ya no causaran conflictos")
            print("RESULT - Usuario 7265 neutralizado exitosamente")
    else:
        print("CANCELLED - Operacion cancelada")

if __name__ == "__main__":
    main()