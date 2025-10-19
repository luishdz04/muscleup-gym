# Sistema de Capacidad y Avisos - Guía de Implementación

## 📋 Resumen

Este sistema agrega dos funcionalidades clave al dashboard del cliente:
1. **Capacidad en Tiempo Real**: Muestra cuántas personas hay actualmente en el gimnasio
2. **Avisos para Clientes**: Sistema de mensajes/anuncios configurables desde el admin

---

## ✅ Lo que ya está hecho

### Frontend Completado
- ✅ Componente `GymCapacityGauge` con auto-refresh cada 90 minutos
- ✅ Componente `AnnouncementsSection` con expand/collapse
- ✅ Integrados en `/dashboard/cliente` (página principal del cliente)
- ✅ Página admin en `/dashboard/admin/herramientas/avisos` para gestionar anuncios
- ✅ Menú actualizado con opción "Avisos para Clientes"
- ✅ Error de hidratación corregido en layout del cliente

### API Endpoints Completados
- ✅ `GET /api/gym/capacity` - Capacidad en tiempo real
- ✅ `GET /api/announcements` - Lista de anuncios activos
- ✅ `POST /api/announcements` - Crear anuncio (admin/empleado)
- ✅ `PUT /api/announcements/[id]` - Actualizar anuncio
- ✅ `DELETE /api/announcements/[id]` - Eliminar anuncio (admin)
- ✅ Todos los endpoints son robustos y manejan tablas faltantes

---

## 🔧 Pasos para Completar la Implementación

### Paso 1: Ejecutar la Migración SQL

Tienes dos opciones:

#### Opción A: Migración Consolidada (RECOMENDADO)
Ejecuta el archivo todo-en-uno: `/sql/add_capacity_and_announcements.sql`

```bash
# En Supabase SQL Editor, copia y pega el contenido de:
# /workspaces/muscleup-gym/sql/add_capacity_and_announcements.sql
```

Este archivo:
- Agrega columna `max_capacity` a `gym_settings`
- Crea tabla `client_announcements`
- Configura RLS policies
- Inserta 3 anuncios de ejemplo

#### Opción B: Solo la tabla de anuncios
Si prefieres usar el archivo original: `/sql/create_client_announcements.sql`

Pero también necesitarás agregar `max_capacity`:
```sql
ALTER TABLE gym_settings ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 100;
```

---

### Paso 2: Verificar la Instalación

Después de ejecutar el SQL, verifica que todo esté funcionando:

1. **Verificar gym_settings:**
   ```sql
   SELECT id, gym_name, max_capacity FROM gym_settings;
   ```
   Deberías ver la columna `max_capacity` con valor 100

2. **Verificar client_announcements:**
   ```sql
   SELECT id, title, type, priority, is_active FROM client_announcements;
   ```
   Deberías ver 3 anuncios de ejemplo

---

### Paso 3: Configurar Capacidad Máxima

1. Ve a `/dashboard/admin/herramientas/configuracion`
2. En el Tab 1 (Datos del Gimnasio), deberías ver un campo nuevo: **Capacidad Máxima**
3. Ajusta el número según la capacidad real de tu gimnasio (default: 100)
4. Guarda los cambios

---

### Paso 4: Crear Avisos para Clientes

1. Ve a `/dashboard/admin/herramientas/avisos`
2. Haz clic en **"Nuevo Aviso"**
3. Llena el formulario:
   - **Título**: Título del mensaje
   - **Mensaje**: Contenido completo
   - **Tipo**: info | success | warning | error
   - **Prioridad**: Número (mayor = se muestra primero)
   - **Fecha inicio/fin** (opcional): Para mensajes temporales
   - **Aviso activo**: Toggle para activar/desactivar
4. Guarda

---

## 📊 Cómo Funciona

### Capacidad en Tiempo Real

**Lógica de Conteo:**
1. Se consulta la tabla `access_logs` del día actual
2. Se rastrea el último estado de cada usuario (entry/exit)
3. Se cuentan solo los usuarios con estado "inside"
4. Se calcula el porcentaje vs `max_capacity`

**Estados:**
- 🟢 **Óptimo** (0-60%): "Capacidad óptima - Ven cuando quieras"
- 🟡 **Moderado** (61-85%): "Moderadamente lleno - Buen momento para entrenar"
- 🔴 **Lleno** (86-100%): "Capacidad alta - Considera venir más tarde"

**Auto-refresh:**
- Se actualiza automáticamente cada **90 minutos** (1.5 horas)
- Muestra el tiempo desde última actualización

### Sistema de Avisos

**Prioridad:**
- Los avisos se ordenan por `priority` (descendente) y luego por `created_at`
- Mayor número = mayor prioridad

**Visibilidad:**
- Solo se muestran avisos con `is_active = true`
- Si tiene `start_date`, solo se muestra si la fecha actual >= start_date
- Si tiene `end_date`, solo se muestra si la fecha actual <= end_date

**Expand/Collapse:**
- Mensajes largos (>150 caracteres) se muestran truncados con "Ver más"
- Click en "Ver más" expande el mensaje completo

---

## 🎨 Ubicación en el Dashboard

Los dos componentes están integrados en la **página principal del cliente**:

`/dashboard/cliente` (Mi Información)

```
┌─────────────────────────────────────────────┐
│  Gym Capacity Gauge  │  Announcements       │
│  (50% ocupado)       │  (2 avisos activos)  │
├─────────────────────────────────────────────┤
│  User Profile Card                          │
│  (Avatar, nombre, datos personales)         │
├─────────────────────────────────────────────┤
│  Membership Card                            │
│  (Plan activo, días restantes)              │
└─────────────────────────────────────────────┘
```

---

## 🔐 Permisos

### Capacidad
- **Lectura**: Todos los usuarios autenticados
- **Configuración**: Solo admin (via herramientas/configuracion)

### Avisos
- **Lectura**: Todos los clientes autenticados (solo activos)
- **Crear/Editar**: Admin y Empleados
- **Eliminar**: Solo Admin

---

## 🧪 Testing del Sistema de Capacidad

Para probar que el gauge funciona correctamente, puedes insertar registros de prueba:

### Opción 1: Un solo usuario
Ejecuta: `/sql/test_capacity_insert.sql`

Esto insertará 1 entrada con la hora actual para el usuario que mostraste.

### Opción 2: Múltiples usuarios (mejor prueba)
Ejecuta: `/sql/test_capacity_multiple_users.sql`

Pasos:
1. **PASO 1**: El query te muestra usuarios disponibles
2. **Edita el PASO 2**: Agrega los UUIDs de varios usuarios en el array
3. **Ejecuta PASO 2**: Inserta las entradas
4. **Ejecuta PASO 3**: Verifica quién está dentro
5. **Ejecuta PASO 4**: Ver resumen con porcentaje

### Verificar en la UI
1. Ve a `/dashboard/cliente`
2. Deberías ver el gauge actualizado
3. Si insertaste 5 usuarios con max_capacity=100, verás 5%
4. El color debería ser verde (optimal)

### Simular diferentes capacidades
```sql
-- 70 personas = Amarillo (moderate)
-- Ejecuta el INSERT 70 veces con diferentes user_ids

-- 90 personas = Rojo (full)
-- Ejecuta el INSERT 90 veces con diferentes user_ids
```

---

## 🐛 Troubleshooting

### "Error al cargar capacidad del gimnasio"
- Verifica que ejecutaste el SQL: `ALTER TABLE gym_settings ADD COLUMN max_capacity...`
- Si la columna no existe, el sistema usa 100 por defecto (no debería dar error)

### No se muestran los avisos
- Verifica que ejecutaste el SQL para crear `client_announcements`
- Si la tabla no existe, el componente se oculta automáticamente (no da error)
- Verifica que los avisos tengan `is_active = true`

### El gauge muestra 0 personas siempre
- **Normal**: Si no hay accesos registrados hoy en `access_logs`
- **Solución**: Usa los scripts de testing en `/sql/` para insertar datos de prueba
- Ver sección "Testing del Sistema de Capacidad" arriba

### La capacidad no se actualiza
- El componente auto-refresh cada 90 minutos
- Para forzar actualización: recarga la página (F5)
- Para desarrollo: Puedes cambiar el intervalo en `GymCapacityGauge.tsx:70` a 30 segundos:
  ```typescript
  }, 30 * 1000); // 30 segundos en lugar de 90 * 60 * 1000
  ```

---

## 📁 Archivos Creados

### Componentes
- `/src/components/dashboard/GymCapacityGauge.tsx`
- `/src/components/dashboard/AnnouncementsSection.tsx`

### API Routes
- `/src/app/api/gym/capacity/route.ts`
- `/src/app/api/announcements/route.ts`
- `/src/app/api/announcements/[id]/route.ts`

### Admin Pages
- `/src/app/(protected)/dashboard/admin/herramientas/avisos/page.tsx`

### SQL
- `/sql/create_client_announcements.sql` (original detallado)
- `/sql/add_capacity_and_announcements.sql` (consolidado todo-en-uno)

### Modificaciones
- `/src/app/(protected)/dashboard/cliente/page.tsx` - Integración de componentes
- `/src/app/(protected)/dashboard/cliente/layout.tsx` - Fix hidratación
- `/src/app/(protected)/dashboard/admin/AdminLayoutClient.tsx` - Menú avisos
- `/src/app/api/gym-settings/route.ts` - Soporte max_capacity

---

## ✨ Features Destacadas

1. **Auto-refresh inteligente**: Evita requests innecesarios, actualiza cada 90 min
2. **Graceful degradation**: Si faltan tablas/columnas, no rompe la UI
3. **RLS completo**: Seguridad a nivel base de datos
4. **Responsive design**: Funciona perfecto en mobile, tablet, desktop
5. **Glassmorphism**: Diseño moderno con blur effects
6. **Color-coded**: Verde/Amarillo/Rojo para capacidad, tipos para avisos
7. **Priority system**: Control total del orden de los avisos
8. **Date ranges**: Programar avisos con fecha inicio/fin

---

## 🚀 Próximos Pasos (Opcionales)

1. **Notificaciones push**: Enviar notificación cuando capacidad > 85%
2. **Histórico de capacidad**: Gráfica de ocupación por hora/día
3. **Avisos con imágenes**: Agregar soporte para imágenes en anuncios
4. **Templates de avisos**: Plantillas predefinidas (festivos, mantenimiento, etc.)
5. **Programación automática**: Avisos recurrentes (ej: todos los domingos)

---

¿Preguntas? Revisa el código o consulta la documentación principal en `CLAUDE.md`
