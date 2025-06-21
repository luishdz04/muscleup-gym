# test_monitor.py
import websockets
import asyncio
import json

async def test():
    ws = await websockets.connect("ws://localhost:8083")
    
    # Conectar
    await ws.send(json.dumps({"action": "connect"}))
    print(await ws.recv())
    
    # Iniciar monitoreo
    await ws.send(json.dumps({"action": "start_monitoring"}))
    print(await ws.recv())
    
    # Escuchar eventos
    print("Escuchando eventos... Pon tu huella en el lector")
    while True:
        print(await ws.recv())

asyncio.run(test())