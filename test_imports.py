try:
    import websockets
    print("✅ websockets instalado")
except ImportError:
    print("❌ websockets NO instalado")

try:
    import httpx
    print("✅ httpx instalado")
except ImportError:
    print("❌ httpx NO instalado")

try:
    import win32com.client
    print("✅ win32com instalado")
except ImportError:
    print("❌ win32com NO instalado")

try:
    import pythoncom
    print("✅ pythoncom instalado")
except ImportError:
    print("❌ pythoncom NO instalado")

try:
    from dotenv import load_dotenv
    print("✅ python-dotenv instalado")
except ImportError:
    print("❌ python-dotenv NO instalado")

try:
    import pytz
    print("✅ pytz instalado")
except ImportError:
    print("❌ pytz NO instalado")