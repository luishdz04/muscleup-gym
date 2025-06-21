#!/usr/bin/env python3
"""
🚀 Script de Instalación Automática - F22 WebSocket Service
Instala todas las dependencias necesarias para el servicio oficial
Creado: 2025-06-19 03:05:33 UTC por luishdz04
"""

import subprocess
import sys
import os
import platform
import ctypes
from pathlib import Path

def is_admin():
    """Verificar si se ejecuta como administrador"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

def run_command(command, description):
    """Ejecutar comando con manejo de errores"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, 
                              capture_output=True, text=True)
        print(f"✅ {description} - Completado")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Error: {e}")
        print(f"   Salida: {e.stdout}")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Verificar versión de Python"""
    version = sys.version_info
    print(f"🐍 Python detectado: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Error: Se requiere Python 3.8 o superior")
        return False
    
    print("✅ Versión de Python compatible")
    return True

def check_windows():
    """Verificar que sea Windows"""
    if platform.system() != "Windows":
        print("❌ Error: zkemkeeper.dll solo funciona en Windows")
        return False
    
    print(f"✅ Sistema operativo: {platform.system()} {platform.release()}")
    return True

def check_dll_exists():
    """Verificar que existe zkemkeeper.dll"""
    dll_path = Path("zkemkeeper.dll")
    if dll_path.exists():
        print(f"✅ zkemkeeper.dll encontrada: {dll_path.absolute()}")
        return True
    else:
        print(f"❌ zkemkeeper.dll NO encontrada en: {dll_path.absolute()}")
        print("💡 Asegúrate de tener zkemkeeper.dll en la carpeta del proyecto")
        return False

def register_dll():
    """Registrar zkemkeeper.dll"""
    if not is_admin():
        print("⚠️ Advertencia: Se recomienda ejecutar como administrador para registrar DLL")
        return True
    
    dll_path = Path("zkemkeeper.dll").absolute()
    command = f'regsvr32 /s "{dll_path}"'
    
    return run_command(command, "Registrando zkemkeeper.dll")

def install_core_dependencies():
    """Instalar dependencias principales"""
    core_deps = [
        "websockets>=12.0",
        "comtypes>=1.4.4", 
        "pywin32>=306",
        "httpx>=0.27.0",
        "python-dotenv>=1.0.1",
        "python-dateutil>=2.8.2"
    ]
    
    print("📦 Instalando dependencias principales...")
    
    for dep in core_deps:
        if not run_command(f"pip install {dep}", f"Instalando {dep}"):
            return False
    
    return True

def install_optional_dependencies():
    """Instalar dependencias opcionales"""
    optional_deps = [
        "colorlog>=6.8.2",
        "rich>=13.7.1", 
        "psutil>=6.0.0",
        "pytest>=8.2.2",
        "pytest-asyncio>=0.23.7"
    ]
    
    print("🔧 Instalando dependencias opcionales...")
    
    for dep in optional_deps:
        run_command(f"pip install {dep}", f"Instalando {dep} (opcional)")
    
    return True

def create_env_template():
    """Crear template de .env"""
    env_content = """# 🏢 CONFIGURACIÓN SUPABASE
# F22 WebSocket Service - Configuración
# Creado: 2025-06-19 03:05:33 UTC

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui

# F22 Device Configuration (opcional - se puede configurar en código)
F22_IP=192.168.1.201
F22_PORT=4370
F22_MACHINE_NUMBER=1

# WebSocket Configuration
WS_PORT=8082
WS_HOST=127.0.0.1

# Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=f22_service.log

# Security (opcional)
SECRET_KEY=tu_clave_secreta_aqui
"""
    
    env_path = Path(".env")
    if not env_path.exists():
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content)
        print(f"✅ Archivo .env creado: {env_path.absolute()}")
        print("💡 Edita .env con tus credenciales de Supabase")
    else:
        print("⚠️ Archivo .env ya existe - no sobrescrito")
    
    return True

def verify_installation():
    """Verificar que la instalación fue exitosa"""
    print("\n🔍 Verificando instalación...")
    
    # Verificar imports principales
    test_imports = [
        ("websockets", "WebSocket support"),
        ("comtypes.client", "COM Objects support"),
        ("httpx", "HTTP client"),
        ("dotenv", "Environment variables"),
        ("json", "JSON processing"),
        ("asyncio", "Async support"),
        ("base64", "Base64 encoding"),
        ("datetime", "Date/time handling")
    ]
    
    all_good = True
    
    for module, description in test_imports:
        try:
            __import__(module)
            print(f"✅ {description}")
        except ImportError as e:
            print(f"❌ {description} - Error: {e}")
            all_good = False
    
    # Verificar que se puede crear objeto COM
    try:
        import comtypes.client
        zkem = comtypes.client.CreateObject("zkemkeeper.ZKEM")
        print("✅ Objeto COM zkemkeeper.ZKEM creado exitosamente")
    except Exception as e:
        print(f"⚠️ Error creando objeto COM: {e}")
        print("💡 Puede requerir ejecutar como administrador o registrar DLL")
        all_good = False
    
    return all_good

def main():
    """Función principal de instalación"""
    print("🚀 F22 WebSocket Service - Instalación Automática")
    print("=" * 60)
    print("📅 2025-06-19 03:05:33 UTC | 👤 luishdz04")
    print("🎯 Instalando dependencias para zkemkeeper.dll oficial")
    print()
    
    # Verificaciones previas
    if not check_python_version():
        return False
    
    if not check_windows():
        return False
    
    if not check_dll_exists():
        return False
    
    # Registrar DLL
    register_dll()
    
    # Actualizar pip
    run_command("python -m pip install --upgrade pip", "Actualizando pip")
    
    # Instalar dependencias
    if not install_core_dependencies():
        print("❌ Error instalando dependencias principales")
        return False
    
    install_optional_dependencies()
    
    # Crear archivo .env
    create_env_template()
    
    # Verificar instalación
    if verify_installation():
        print("\n🎉 ¡Instalación completada exitosamente!")
        print()
        print("📋 Próximos pasos:")
        print("   1. Editar .env con tus credenciales de Supabase")
        print("   2. Ejecutar: py f22_websocket_service_official.py")
        print("   3. Conectar a WebSocket: ws://127.0.0.1:8082")
        print()
        print("🚀 ¡Listo para usar el servicio F22 con SDK oficial!")
        return True
    else:
        print("\n⚠️ Instalación completada con advertencias")
        print("💡 Revisa los errores arriba y ejecuta como administrador si es necesario")
        return False

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⛔ Instalación cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error durante la instalación: {e}")
        sys.exit(1)