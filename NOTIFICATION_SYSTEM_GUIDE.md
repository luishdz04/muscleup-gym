# 📋 Sistema de Notificaciones - Guía de Implementación

## ✨ Nueva Arquitectura de Notificaciones

### 🎯 **Cambios Principales:**

1. **✅ Removida tabla de notificaciones** - Ya no almacenamos notificaciones en BD
2. **✅ Implementado Sonner** - Reemplaza react-hot-toast con una librería más moderna
3. **✅ Supabase Realtime** - Escucha eventos en tiempo real de las tablas importantes
4. **✅ Sin polling** - No más peticiones cada X segundos

## 🚀 Cómo Usar el Nuevo Sistema

### 1. **Notificaciones Simples (Sonner)**

```typescript
import { useToast } from '@/hooks/useToast';

function MyComponent() {
  const toast = useToast();

  // Notificación de éxito
  toast.success('Venta completada exitosamente');

  // Notificación de error
  toast.error('Error al procesar el pago');

  // Notificación informativa
  toast.info('Nuevo usuario registrado');

  // Notificación con descripción
  toast.success('Membresía activada', {
    description: 'Plan Premium - 30 días',
    duration: 5000
  });

  // Notificación con acción
  toast.action('Nueva venta realizada', {
    description: 'Total: $1,500',
    action: {
      label: 'Ver detalles',
      onClick: () => router.push('/dashboard/admin/sales')
    }
  });

  // Notificación con promesa
  const saveData = async () => {
    return fetch('/api/save', { method: 'POST' });
  };

  toast.promise(saveData(), {
    loading: 'Guardando datos...',
    success: 'Datos guardados correctamente',
    error: 'Error al guardar los datos'
  });
}
```

### 2. **Eventos en Tiempo Real (Automático)**

El sistema escucha automáticamente estos eventos para usuarios admin/empleado:

#### **🛒 Nueva Venta (POS)**
```
Evento: INSERT en tabla 'sales'
Notificación: "Nueva venta: $XXX"
```

#### **💪 Nueva Membresía**
```
Evento: INSERT en tabla 'user_memberships'
Notificación: "Nueva membresía registrada"
```

#### **🚪 Acceso Biométrico**
```
Evento: INSERT en tabla 'access_logs'
Notificación: "✅ Acceso permitido" o "❌ Acceso denegado"
```

#### **💰 Nuevo Pago**
```
Evento: INSERT en tabla 'payments'
Notificación: "Pago recibido: $XXX"
```

#### **📊 Corte de Caja**
```
Evento: INSERT en tabla 'cash_cuts'
Notificación: "Nuevo corte de caja generado"
```

## 🔧 Configuración Técnica

### **NotificationProvider** (`src/providers/NotificationProvider.tsx`)

- Se inicializa automáticamente en el layout principal
- Detecta el rol del usuario (admin/empleado)
- Crea canal de Supabase Realtime solo para usuarios autorizados
- Maneja la limpieza al desmontar componentes

### **Personalización de Estilos**

Los toasts usan los tokens de color del tema:

```typescript
toastOptions={{
  style: {
    background: colorTokens.neutral200,
    color: colorTokens.textPrimary,
    border: `1px solid ${colorTokens.border}`,
  }
}}
```

## 📝 Ejemplo de Implementación en Componente

```typescript
// src/app/(protected)/dashboard/admin/sales/page.tsx

'use client';

import { useToast } from '@/hooks/useToast';

export default function SalesPage() {
  const toast = useToast();

  const handleNewSale = async () => {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        body: JSON.stringify(saleData)
      });

      if (response.ok) {
        toast.success('Venta registrada exitosamente', {
          description: `Total: $${saleData.total}`
        });
      } else {
        toast.error('Error al registrar la venta');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  return (
    // ... tu componente
  );
}
```

## 🎨 Tipos de Notificaciones Disponibles

| Tipo | Uso | Color |
|------|-----|-------|
| `success` | Operaciones exitosas | Verde |
| `error` | Errores y fallos | Rojo |
| `info` | Información general | Azul |
| `warning` | Advertencias | Amarillo |
| `promise` | Operaciones asíncronas | Dinámico |
| `action` | Con botón de acción | Personalizable |
| `custom` | JSX personalizado | Personalizable |

## 🔄 Migración desde el Sistema Anterior

### **Antes (con react-hot-toast):**
```typescript
import toast from 'react-hot-toast';
toast.success('Mensaje');
```

### **Ahora (con Sonner):**
```typescript
import { useToast } from '@/hooks/useToast';
const toast = useToast();
toast.success('Mensaje');
```

## ⚙️ Ventajas del Nuevo Sistema

1. **Sin tabla de notificaciones** - Menos complejidad en BD
2. **Tiempo real** - Notificaciones instantáneas sin polling
3. **Mejor rendimiento** - Sin peticiones HTTP constantes
4. **API más simple** - Sonner tiene mejor DX
5. **Personalizable** - Estilos y animaciones más flexibles
6. **Sin estado global** - Las notificaciones son temporales

## 🚫 Qué NO Hacer

❌ No uses `react-hot-toast` directamente
❌ No crees tablas de notificaciones
❌ No hagas polling para verificar notificaciones
❌ No uses `useNotifications` antiguo (fue removido)

## ✅ Qué SÍ Hacer

✅ Usa `useToast()` para todas las notificaciones UI
✅ Confía en Supabase Realtime para eventos importantes
✅ Mantén las notificaciones simples y temporales
✅ Usa descripciones para dar contexto adicional

## 📚 Referencias

- [Documentación de Sonner](https://sonner.emilkowal.ski/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [MUI Theme Tokens](src/theme.ts)