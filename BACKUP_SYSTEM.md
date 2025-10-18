# 💾 Sistema de Respaldos - MuscleUp Gym

## 📋 Resumen

MuscleUp Gym cuenta con un **sistema de respaldos de 3 niveles** que garantiza la seguridad de tus datos:

### **Nivel 1: Backups Automáticos de Supabase PRO** 🏆
- **Estado**: ✅ Activo
- **Frecuencia**: Diario
- **Retención**: 7 días
- **Features**:
  - Point-in-Time Recovery (PITR)
  - Restauración con 1 clic
  - Almacenamiento en la nube de Supabase
- **Acceso**: [Dashboard de Supabase](https://supabase.com/dashboard/project/tyuuyqypgwvdtpfvumxx/settings/backups)

### **Nivel 2: Backups Manuales Locales** 📦
- **Ubicación**: `/workspaces/muscleup-gym/backups/`
- **Formato**: JSON
- **Método**: Supabase API
- **Tablas incluidas**: 24 tablas (ver lista completa abajo)
- **Acceso**: Dashboard → Herramientas → Respaldo de Datos

### **Nivel 3: Exportación a Excel** 📊
- **Propósito**: Análisis y reportes
- **Formato**: XLSX (ExcelJS)
- **Personalizable**: Selección de tablas a exportar
- **Acceso**: Dashboard → Herramientas → Respaldo de Datos → Exportar a Excel

---

## 🔧 Uso del Sistema

### **Crear Backup Manual**

1. Ve a: **Dashboard → Herramientas → Respaldo de Datos**
2. Haz clic en **"Crear Respaldo Ahora"**
3. Espera a que se complete el proceso
4. El archivo se guardará en `/backups/` con formato: `backup_manual_YYYY-MM-DD_HH-MM-SS.json`

### **Descargar Backup**

1. En la tabla de **Respaldos Disponibles**
2. Haz clic en el ícono de **descarga** 📥
3. El archivo se descargará a tu computadora

### **Eliminar Backup**

1. En la tabla de **Respaldos Disponibles**
2. Haz clic en el ícono de **eliminar** 🗑️
3. Confirma la eliminación

### **Exportar a Excel**

1. Haz clic en **"Exportar a Excel"**
2. Selecciona las tablas que deseas exportar:
   - ✅ Usuarios y Clientes
   - ✅ Membresías
   - ✅ Historial de Pagos
   - ✅ Planes y Servicios
   - ✅ Inventario y Productos
   - ✅ Configuración del Gimnasio
3. Haz clic en **"Exportar a Excel"**
4. El archivo `.xlsx` se descargará automáticamente

---

## 📊 Tablas Respaldadas

El backup manual incluye las siguientes 24 tablas:

### **Configuración**
- `gym_settings` - Configuración del gimnasio
- `holidays` - Días festivos
- `payment_commissions` - Comisiones de pago

### **Planes y Membresías**
- `plans` - Planes de membresía
- `user_memberships` - Membresías activas
- `payments` - Historial de pagos

### **Usuarios**
- `Users` - Información de usuarios
- `addresses` - Direcciones
- `emergency_contacts` - Contactos de emergencia
- `membership_info` - Info adicional de membresía

### **Acceso Biométrico**
- `biometric_devices` - Dispositivos registrados
- `fingerprint_templates` - Templates de huellas
- `access_logs` - Logs de acceso

### **Inventario**
- `products` - Productos
- `warehouses` - Almacenes
- `inventory_movements` - Movimientos de inventario
- `suppliers` - Proveedores

### **Ventas**
- `sales` - Ventas realizadas
- `sale_items` - Items de ventas
- `layaway_status_history` - Historial de apartados

### **Administración**
- `expenses` - Egresos
- `expense_categories` - Categorías de egresos
- `cuts` - Cortes de caja
- `system_logs` - Logs del sistema

---

## 🔐 Formato del Backup JSON

```json
{
  "metadata": {
    "createdAt": "2025-10-18T14:30:00.000Z",
    "version": "1.0",
    "type": "manual",
    "source": "Supabase",
    "totalRecords": 1234,
    "tables": [
      {
        "name": "Users",
        "rows": 150,
        "status": "success"
      },
      // ...
    ]
  },
  "data": {
    "Users": [ /* array de registros */ ],
    "plans": [ /* array de registros */ ],
    // ...
  }
}
```

---

## 🔄 Restauración de Backups

### **Desde Supabase PRO (Recomendado)**

1. Ve al [Dashboard de Backups](https://supabase.com/dashboard/project/tyuuyqypgwvdtpfvumxx/settings/backups)
2. Selecciona el backup o punto en el tiempo
3. Haz clic en **"Restore"**
4. Confirma la restauración

### **Desde Backup Manual JSON**

⚠️ **Advertencia**: Este proceso debe hacerse con cuidado.

```javascript
// Ejemplo de código para restaurar (ejecutar con precaución)
const backupData = JSON.parse(fs.readFileSync('backup.json', 'utf-8'));

for (const [tableName, records] of Object.entries(backupData.data)) {
  await supabase.from(tableName).upsert(records);
}
```

---

## 📈 Mejores Prácticas

### ✅ **Recomendaciones**

1. **Crear backups manuales antes de**:
   - Actualizar el sistema
   - Migrar datos
   - Realizar cambios importantes en configuración
   - Eliminar datos en masa

2. **Frecuencia sugerida**:
   - Backups manuales: Semanalmente
   - Excel exports: Mensualmente (para análisis)

3. **Almacenamiento**:
   - Guardar backups importantes en múltiples ubicaciones
   - Descargar backups críticos a tu computadora
   - Considerar almacenamiento en la nube (Google Drive, Dropbox)

### ⚠️ **Precauciones**

1. **No eliminar backups automáticos de Supabase** (son tu red de seguridad principal)
2. **Verificar el tamaño** de los backups antes de descargar
3. **No compartir backups** (contienen datos sensibles)
4. **Probar la restauración** de vez en cuando en un ambiente de prueba

---

## 🛠️ API Endpoints

### **GET /api/backups**
Lista todos los backups disponibles
```json
{
  "success": true,
  "backups": [...],
  "total": 10,
  "totalSize": 12345678,
  "totalSizeFormatted": "11.77 MB"
}
```

### **POST /api/backups/create**
Crea un nuevo backup manual
```json
{
  "success": true,
  "message": "Backup creado exitosamente con 1234 registros",
  "backup": {
    "filename": "backup_manual_2025-10-18_14-30-00.json",
    "size": 1234567,
    "sizeFormatted": "1.18 MB",
    "totalRecords": 1234,
    "tables": 24
  }
}
```

### **GET /api/backups/[id]**
Descarga un backup específico

### **DELETE /api/backups/[id]**
Elimina un backup específico

### **POST /api/export/excel**
Exporta datos seleccionados a Excel
```json
{
  "includeUsers": true,
  "includeMemberships": true,
  "includePayments": true,
  "includePlans": true,
  "includeInventory": false,
  "includeSettings": false
}
```

---

## 🚀 Roadmap Futuro

### **Próximas Features**

- [ ] Backups automáticos programados (cron jobs)
- [ ] Compresión de archivos JSON (gzip)
- [ ] Restauración desde UI
- [ ] Notificaciones por email al completar backups
- [ ] Backup incremental (solo cambios)
- [ ] Integración con cloud storage (S3, Google Cloud)
- [ ] Cifrado de backups

---

## 📞 Soporte

Si tienes problemas con el sistema de respaldos:

1. Revisa los logs en la consola del navegador
2. Verifica la conexión con Supabase
3. Asegúrate de tener espacio disponible en disco
4. Contacta al administrador del sistema

---

**Última actualización**: Octubre 2025
**Versión del sistema**: 1.0
**Desarrollado para**: MuscleUp Gym
