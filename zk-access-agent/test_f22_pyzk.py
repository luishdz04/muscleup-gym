from zk import ZK, const

zk = ZK('192.168.1.201', port=4370)

try:
    conn = zk.connect()
    conn.disable_device()
    
    print("✅ Firmware:", conn.get_firmware_version())
    print("🧾 Serial:", conn.get_serialnumber())
    print("👥 Usuarios:")
    for user in conn.get_users():
        print(f"  • {user.uid} - {user.name}")
    
    conn.enable_device()
    conn.disconnect()
except Exception as e:
    print("❌ Error:", e)
