#!/usr/bin/env python3
"""
🔍 Test de Instalación - F22 WebSocket Service
Verifica que todas las dependencias estén correctamente instaladas
"""

def test_installation():
    print("🔍 Verificando instalación F22 WebSocket Service...")
    print("=" * 50)
    
    # Test imports
    tests = [
        ("websockets", lambda: __import__("websockets")),
        ("comtypes", lambda: __import__("comtypes.client")),
        ("httpx", lambda: __import__("httpx")),
        ("dotenv", lambda: __import__("dotenv")),
        ("asyncio", lambda: __import__("asyncio")),
        ("json", lambda: __import__("json")),
        ("base64", lambda: __import__("base64")),
        ("datetime", lambda: __import__("datetime")),
        ("os", lambda: __import__("os")),
        ("logging", lambda: __import__("logging"))
    ]
    
    passed = 0
    for name, test_func in tests:
        try:
            test_func()
            print(f"✅ {name}")
            passed += 1
        except Exception as e:
            print(f"❌ {name}: {e}")
    
    print(f"\n📊 Resultado: {passed}/{len(tests)} módulos disponibles")
    
    # Test COM object
    try:
        import comtypes.client
        zkem = comtypes.client.CreateObject("zkemkeeper.ZKEM")
        print("✅ Objeto COM zkemkeeper.ZKEM creado")
    except Exception as e:
        print(f"⚠️ Error COM: {e}")
    
    # Test DLL
    import os
    if os.path.exists("zkemkeeper.dll"):
        print("✅ zkemkeeper.dll encontrada")
    else:
        print("❌ zkemkeeper.dll NO encontrada")
    
    print("\n🎯 ¡Listo para ejecutar el servicio!")

if __name__ == "__main__":
    test_installation()