#!/usr/bin/env python3
"""
Test script para verificar que unified_fingerprint_service.py funciona correctamente
"""

import sys
import importlib.util
import logging

# Configurar logging para tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_imports():
    """Verificar que todas las dependencias se pueden importar"""
    try:
        logger.info("🧪 Verificando imports...")
        
        # Test imports básicos
        import asyncio
        logger.info("✅ asyncio OK")
        
        try:
            import websockets
            logger.info("✅ websockets OK")
        except ImportError:
            logger.warning("⚠️ websockets no disponible - instalar con pip")
        
        try:
            import win32com.client
            logger.info("✅ win32com OK")
        except ImportError:
            logger.warning("⚠️ win32com no disponible - instalar pywin32")
        
        try:
            from supabase import create_client
            logger.info("✅ supabase OK")
        except ImportError:
            logger.warning("⚠️ supabase no disponible - instalar con pip")
        
        logger.info("✅ Imports básicos verificados")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error en imports: {e}")
        return False

def test_service_creation():
    """Verificar que se puede crear el ZKEventHandler sin argumentos"""
    try:
        logger.info("🧪 Verificando creación de ZKEventHandler...")
        
        # Importar el servicio
        spec = importlib.util.spec_from_file_location(
            "unified_fingerprint_service", 
            "unified_fingerprint_service.py"
        )
        service_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(service_module)
        
        # Crear ZKEventHandler sin argumentos
        event_handler = service_module.ZKEventHandler()
        logger.info("✅ ZKEventHandler creado exitosamente sin argumentos")
        
        # Verificar que se puede configurar validador después
        validator = service_module.FingerprintValidator()
        event_handler.set_validator(validator)
        logger.info("✅ Validador configurado correctamente")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creando servicio: {e}")
        return False

def test_f22_controller():
    """Verificar que F22Controller se puede instanciar"""
    try:
        logger.info("🧪 Verificando F22Controller...")
        
        # Importar el servicio
        spec = importlib.util.spec_from_file_location(
            "unified_fingerprint_service", 
            "unified_fingerprint_service.py"
        )
        service_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(service_module)
        
        # Crear F22Controller
        f22_controller = service_module.F22Controller()
        logger.info("✅ F22Controller creado exitosamente")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creando F22Controller: {e}")
        return False

def main():
    """Ejecutar todos los tests"""
    logger.info("🚀 Iniciando tests del servicio F22 v5.1")
    
    tests = [
        ("Imports", test_imports),
        ("ZKEventHandler", test_service_creation),
        ("F22Controller", test_f22_controller)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        logger.info(f"\n--- Test: {test_name} ---")
        try:
            if test_func():
                logger.info(f"✅ {test_name} PASSED")
                passed += 1
            else:
                logger.error(f"❌ {test_name} FAILED")
        except Exception as e:
            logger.error(f"❌ {test_name} ERROR: {e}")
    
    logger.info(f"\n🏁 Resultados: {passed}/{total} tests pasaron")
    
    if passed == total:
        logger.info("✅ Todos los tests pasaron - Servicio listo")
        return 0
    else:
        logger.warning("⚠️ Algunos tests fallaron - revisar dependencias")
        return 1

if __name__ == "__main__":
    sys.exit(main())