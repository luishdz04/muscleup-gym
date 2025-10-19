# Sistema de Encuestas - MuscleUp Gym

## 📋 Resumen

Sistema completo de encuestas para capturar feedback de los clientes. Los administradores pueden crear encuestas configurables con múltiples tipos de preguntas, y los clientes pueden responderlas durante períodos específicos.

---

## ✅ Características Implementadas

### Frontend Completado

#### Cliente
- ✅ Página de encuestas en `/dashboard/cliente/encuestas`
- ✅ Vista de lista de encuestas disponibles
- ✅ Formulario de respuesta con barra de progreso
- ✅ 4 tipos de preguntas soportados:
  - Calificación (1-5 estrellas)
  - Opción múltiple (radio buttons)
  - Sí/No (radio buttons)
  - Texto libre (textarea)
- ✅ Validación de campos obligatorios
- ✅ Prevención de respuestas duplicadas
- ✅ Diálogo de confirmación al completar
- ✅ Ítem de menú "Encuestas" en navegación del cliente

#### Administración
- ✅ Página de gestión en `/dashboard/admin/encuestas`
- ✅ Tabla con todas las encuestas (activas e inactivas)
- ✅ CRUD completo de encuestas:
  - Crear encuesta con configuración completa
  - Editar encuesta existente
  - Eliminar encuesta
  - Activar/desactivar encuesta
- ✅ Gestión de preguntas:
  - Agregar preguntas con 4 tipos diferentes
  - Opciones configurables para opción múltiple
  - Marcar preguntas como obligatorias
  - Eliminar preguntas
  - Orden automático de preguntas
- ✅ Visualización de resultados:
  - Gráficos de barras para preguntas con opciones
  - Lista de respuestas para preguntas de texto
  - Total de respuestas por pregunta
- ✅ Conteo de respuestas totales por encuesta
- ✅ Ítem de menú "Encuestas" en Herramientas (admin)

### API Endpoints Completados

**Encuestas**:
- ✅ `GET /api/surveys` - Lista de encuestas (filtrado por rol)
- ✅ `POST /api/surveys` - Crear encuesta (admin/empleado)
- ✅ `GET /api/surveys/[id]` - Obtener encuesta individual
- ✅ `PUT /api/surveys/[id]` - Actualizar encuesta
- ✅ `DELETE /api/surveys/[id]` - Eliminar encuesta (admin)

**Preguntas**:
- ✅ `GET /api/surveys/[id]/questions` - Lista de preguntas
- ✅ `POST /api/surveys/[id]/questions` - Crear pregunta
- ✅ `DELETE /api/surveys/[id]/questions/[questionId]` - Eliminar pregunta

**Respuestas**:
- ✅ `POST /api/surveys/[id]/respond` - Enviar respuestas
- ✅ `GET /api/surveys/[id]/respond` - Verificar si ya respondió

**Resultados**:
- ✅ `GET /api/surveys/[id]/results` - Obtener resultados agregados (admin/empleado)

---

## 🗄️ Estructura de Base de Datos

### Tabla: `surveys`

```sql
CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_responses_per_user INTEGER DEFAULT 1,
  created_by UUID REFERENCES "Users"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos**:
- `id`: UUID único de la encuesta
- `title`: Título de la encuesta
- `description`: Descripción opcional
- `start_date`: Fecha/hora de inicio (solo visible después de esta fecha)
- `end_date`: Fecha/hora de fin (solo visible hasta esta fecha)
- `is_active`: Switch para activar/desactivar manualmente
- `max_responses_per_user`: Número máximo de veces que un usuario puede responder
- `created_by`: Usuario que creó la encuesta
- `created_at`, `updated_at`: Timestamps de auditoría

### Tabla: `survey_questions`

```sql
CREATE TABLE IF NOT EXISTS survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (
    question_type IN ('multiple_choice', 'text', 'rating', 'yes_no')
  ),
  question_order INTEGER NOT NULL DEFAULT 1,
  is_required BOOLEAN NOT NULL DEFAULT true,
  options JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos**:
- `id`: UUID único de la pregunta
- `survey_id`: Relación con la encuesta (CASCADE delete)
- `question_text`: Texto de la pregunta
- `question_type`: Tipo de pregunta (múltiple opción, texto, calificación, sí/no)
- `question_order`: Orden de la pregunta en la encuesta
- `is_required`: Si la respuesta es obligatoria
- `options`: Array JSON con opciones (solo para multiple_choice)
- `created_at`: Timestamp de creación

**Tipos de Preguntas**:
1. `multiple_choice`: Radio buttons con opciones configurables
2. `text`: Campo de texto libre (textarea)
3. `rating`: Calificación de 1 a 5 estrellas
4. `yes_no`: Radio buttons Sí/No

### Tabla: `survey_responses`

```sql
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_option VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Campos**:
- `id`: UUID único de la respuesta
- `survey_id`: Relación con la encuesta
- `question_id`: Relación con la pregunta
- `user_id`: Usuario que respondió
- `answer_text`: Respuesta de texto (para tipo `text`)
- `answer_option`: Respuesta de opción (para `multiple_choice`, `rating`, `yes_no`)
- `created_at`: Timestamp de la respuesta

**Índices**:
```sql
CREATE INDEX idx_survey_responses_survey_user ON survey_responses(survey_id, user_id);
CREATE INDEX idx_survey_responses_question ON survey_responses(question_id);
```

---

## 🔐 Permisos y Seguridad (RLS)

### Política: Lectura de Encuestas

**Clientes**:
- Solo ven encuestas donde `is_active = true`
- Solo ven encuestas donde `NOW() BETWEEN start_date AND end_date`

**Admin/Empleados**:
- Ven todas las encuestas sin restricciones

```sql
CREATE POLICY "Anyone can view active surveys"
ON surveys FOR SELECT
TO authenticated
USING (
  is_active = true
  AND NOW() >= start_date
  AND NOW() <= end_date
);

CREATE POLICY "Admins can view all surveys"
ON surveys FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Users"
    WHERE id = auth.uid()
    AND rol IN ('admin', 'empleado')
  )
);
```

### Política: Creación de Encuestas

Solo admin y empleados pueden crear encuestas:

```sql
CREATE POLICY "Admins can insert surveys"
ON surveys FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "Users"
    WHERE id = auth.uid()
    AND rol IN ('admin', 'empleado')
  )
);
```

### Política: Actualización de Encuestas

Solo admin y empleados pueden actualizar encuestas:

```sql
CREATE POLICY "Admins can update surveys"
ON surveys FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Users"
    WHERE id = auth.uid()
    AND rol IN ('admin', 'empleado')
  )
);
```

### Política: Eliminación de Encuestas

Solo admin puede eliminar encuestas:

```sql
CREATE POLICY "Only admins can delete surveys"
ON surveys FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Users"
    WHERE id = auth.uid()
    AND rol = 'admin'
  )
);
```

### Políticas de Preguntas

Las preguntas heredan las mismas políticas que las encuestas (cualquiera puede leer preguntas de encuestas activas, solo admin/empleado puede crear/editar/eliminar).

### Políticas de Respuestas

**Inserción**:
- Cualquier usuario autenticado puede responder encuestas activas
- Solo puede enviar respuestas con su propio `user_id`

**Lectura**:
- Admin/empleado pueden ver todas las respuestas
- Los usuarios solo pueden ver sus propias respuestas

```sql
CREATE POLICY "Users can submit responses"
ON survey_responses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all responses"
ON survey_responses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "Users"
    WHERE id = auth.uid()
    AND rol IN ('admin', 'empleado')
  )
);

CREATE POLICY "Users can view own responses"
ON survey_responses FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

---

## 📊 Flujo de Uso

### Administrador

1. **Crear Encuesta**:
   - Va a `/dashboard/admin/encuestas`
   - Click en "Nueva Encuesta"
   - Completa el formulario:
     - Título (obligatorio)
     - Descripción (opcional)
     - Fecha de inicio (obligatorio)
     - Fecha de fin (obligatorio)
     - Máximo de respuestas por usuario (default: 1)
     - Switch de activación
   - Click en "Crear"

2. **Agregar Preguntas**:
   - Click en ícono de "Ver" (👁️) en la encuesta
   - En el diálogo de preguntas:
     - Escribir texto de la pregunta
     - Seleccionar tipo de pregunta:
       - **Opción Múltiple**: Agregar opciones (mínimo 2)
       - **Texto Libre**: Sin configuración adicional
       - **Calificación**: 1-5 estrellas automáticas
       - **Sí/No**: Sí/No automáticos
     - Marcar si es obligatoria
     - Click en "Agregar Pregunta"
   - Repetir para todas las preguntas
   - Las preguntas se ordenan automáticamente

3. **Ver Resultados**:
   - Click en ícono de gráfica (📊) en la encuesta
   - Se muestran:
     - Cada pregunta con su texto
     - Total de respuestas recibidas
     - **Gráficos de barras** para preguntas con opciones
     - **Lista de respuestas** para preguntas de texto

4. **Editar/Eliminar**:
   - Click en ícono de editar (✏️) para modificar la encuesta
   - Click en ícono de eliminar (🗑️) para borrar (requiere confirmación)

### Cliente

1. **Ver Encuestas Disponibles**:
   - Va a `/dashboard/cliente/encuestas`
   - Ve lista de encuestas activas en el período actual
   - Indicador si ya respondió la encuesta

2. **Responder Encuesta**:
   - Click en "Responder" en una encuesta
   - Completa todas las preguntas:
     - **Calificación**: Click en las estrellas (1-5)
     - **Opción Múltiple**: Click en una opción
     - **Sí/No**: Click en Sí o No
     - **Texto Libre**: Escribir respuesta
   - Barra de progreso muestra avance
   - Click en "Enviar Respuestas"
   - Diálogo de confirmación al completar

3. **Validación**:
   - No puede enviar si hay preguntas obligatorias sin responder
   - No puede responder la misma encuesta más veces que `max_responses_per_user`
   - Solo ve encuestas en período válido

---

## 🎨 Diseño y UX

### Patrones Utilizados

**Tema Centralizado**:
```typescript
import { colorTokens } from '@/theme';
```

**Glassmorphism**:
```typescript
background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
backdropFilter: 'blur(20px)',
border: `1px solid ${alpha(colorTokens.brand, 0.1)}`
```

**SSR Safety**:
```typescript
const hydrated = useHydrated();
if (!hydrated) return <LoadingState />;
```

**Formateo de Fechas**:
```typescript
import { formatDateForDisplay } from '@/utils/dateUtils';
formatDateForDisplay(survey.end_date) // "19 de octubre de 2025"
```

### Componentes Clave

**Admin Page**: [/src/app/(protected)/dashboard/admin/encuestas/page.tsx](src/app/(protected)/dashboard/admin/encuestas/page.tsx)
- Material-UI Table para lista de encuestas
- Diálogos modales para CRUD
- MUI X Charts (BarChart) para visualización de resultados
- Chips para estados (activa/inactiva)
- Tooltips en botones de acción

**Client Page**: [/src/app/(protected)/dashboard/cliente/encuestas/page.tsx](src/app/(protected)/dashboard/cliente/encuestas/page.tsx)
- Cards para lista de encuestas
- LinearProgress para barra de progreso
- Rating component (MUI) para calificaciones
- RadioGroup para opciones
- TextField multiline para texto libre

---

## 🧪 Testing

### Paso 1: Ejecutar SQL

Ejecuta el archivo SQL en Supabase SQL Editor:
```sql
-- /sql/create_surveys_system.sql
```

Esto creará:
- 3 tablas: `surveys`, `survey_questions`, `survey_responses`
- Políticas RLS completas
- Índices para performance
- 1 encuesta de ejemplo con 4 preguntas

### Paso 2: Verificar Instalación

```sql
-- Verificar tablas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'survey%';

-- Verificar encuesta de ejemplo
SELECT id, title, start_date, end_date, is_active
FROM surveys;

-- Verificar preguntas de ejemplo
SELECT id, question_text, question_type, question_order
FROM survey_questions
ORDER BY question_order;
```

### Paso 3: Testing en UI

**Como Admin**:
1. Login como admin
2. Ve a `/dashboard/admin/encuestas`
3. Deberías ver la encuesta de ejemplo
4. Click en "Nueva Encuesta" y crea una encuesta de prueba
5. Agrega preguntas de todos los tipos
6. Verifica que puedas editar y eliminar

**Como Cliente**:
1. Login como cliente
2. Ve a `/dashboard/cliente/encuestas`
3. Deberías ver la encuesta activa
4. Responde la encuesta
5. Verifica que no puedas responder de nuevo
6. Verifica que la encuesta muestre "Ya completada"

**Como Admin (verificar resultados)**:
1. Después de que el cliente responda
2. Ve a `/dashboard/admin/encuestas`
3. Click en ícono de gráfica (📊)
4. Verifica que veas las respuestas del cliente en los gráficos

---

## 📁 Archivos Creados

### SQL
- `/sql/create_surveys_system.sql` - Esquema completo de base de datos

### API Routes
- `/src/app/api/surveys/route.ts` - GET/POST encuestas
- `/src/app/api/surveys/[id]/route.ts` - GET/PUT/DELETE encuesta individual
- `/src/app/api/surveys/[id]/questions/route.ts` - GET/POST preguntas
- `/src/app/api/surveys/[id]/questions/[questionId]/route.ts` - DELETE pregunta
- `/src/app/api/surveys/[id]/respond/route.ts` - POST/GET respuestas
- `/src/app/api/surveys/[id]/results/route.ts` - GET resultados agregados

### Páginas
- `/src/app/(protected)/dashboard/admin/encuestas/page.tsx` - Página de administración
- `/src/app/(protected)/dashboard/cliente/encuestas/page.tsx` - Página de cliente

### Modificaciones
- `/src/app/(protected)/dashboard/admin/AdminLayoutClient.tsx` - Agregado ítem "Encuestas" en menú
- `/src/app/(protected)/dashboard/cliente/layout.tsx` - Agregado ítem "Encuestas" en menú

---

## 🚀 Próximas Mejoras (Opcionales)

1. **Programación Recurrente**: Encuestas que se repiten automáticamente (mensual, trimestral)
2. **Plantillas de Encuestas**: Templates predefinidos (satisfacción, NPS, etc.)
3. **Lógica Condicional**: Mostrar preguntas basadas en respuestas anteriores
4. **Exportación de Resultados**: Descargar resultados en Excel/CSV
5. **Notificaciones**: Enviar email/WhatsApp cuando hay nueva encuesta disponible
6. **Análisis Avanzado**: Gráficos de tendencias, comparación entre períodos
7. **Preguntas con Imágenes**: Soporte para subir imágenes en preguntas y respuestas
8. **Límite de Respuestas**: Cerrar encuesta automáticamente después de X respuestas totales

---

## 🐛 Troubleshooting

### No se muestran encuestas en el cliente

**Causa**: Fechas fuera del rango válido o encuesta no activa

**Solución**:
```sql
-- Verificar encuestas activas
SELECT id, title, start_date, end_date, is_active
FROM surveys
WHERE is_active = true
  AND NOW() >= start_date
  AND NOW() <= end_date;

-- Ajustar fechas si es necesario
UPDATE surveys
SET end_date = NOW() + INTERVAL '30 days'
WHERE id = 'tu-encuesta-id';
```

### Error al crear pregunta de opción múltiple

**Causa**: Menos de 2 opciones agregadas

**Solución**: Asegúrate de agregar al menos 2 opciones antes de crear la pregunta.

### No se pueden ver resultados

**Causa**: No hay respuestas aún

**Solución**: Espera a que al menos un cliente responda la encuesta.

### Usuario puede responder múltiples veces

**Causa**: `max_responses_per_user` muy alto

**Solución**:
```sql
UPDATE surveys
SET max_responses_per_user = 1
WHERE id = 'tu-encuesta-id';
```

---

## 📖 Documentación Relacionada

- Ver [CAPACITY_AND_ANNOUNCEMENTS.md](CAPACITY_AND_ANNOUNCEMENTS.md) para sistema de capacidad y avisos
- Ver [BACKUP_SYSTEM.md](BACKUP_SYSTEM.md) para sistema de respaldos
- Ver [CLAUDE.md](CLAUDE.md) para guía general del proyecto

---

**Última actualización**: Octubre 2025
**Versión**: 1.0.0
