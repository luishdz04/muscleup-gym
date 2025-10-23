# 🎨 Ejemplos de uso de SweetAlert2 en MuscleUp Gym

## 📦 Funciones disponibles en MySwal

### 1. ✅ Mensaje de éxito (`showSuccess`)
```typescript
import { alert } from '@/hooks/useNotifications';

// Uso simple
await alert.success('Operación completada exitosamente');

// Con título personalizado
await alert.success('El usuario fue creado correctamente', '✅ Usuario Creado');
```

### 2. ❌ Mensaje de error (`showError`)
```typescript
// Uso simple
await alert.error('Ocurrió un error al procesar la solicitud');

// Con título personalizado
await alert.error('No se pudo conectar con el servidor', '❌ Error de Conexión');
```

### 3. ❓ Confirmación general (`showConfirmation`)
```typescript
const result = await alert.confirm(
  '¿Deseas continuar con esta operación?',
  'Confirmar Acción',
  'Sí, continuar',
  'Cancelar'
);

if (result.isConfirmed) {
  // Usuario confirmó
  console.log('Confirmado');
}
```

### 4. 🗑️ Confirmación de eliminación (`showDeleteConfirmation`)
```typescript
const result = await alert.deleteConfirm('Usuario: Juan Pérez');

if (result.isConfirmed) {
  // Proceder con eliminación
  await deleteUser();
}
```

### 5. 💾 Confirmación de guardado con 3 opciones (`showSaveConfirmation`) **NUEVO**

#### Uso básico:
```typescript
const result = await alert.saveConfirm();

if (result.isConfirmed) {
  // Usuario eligió "Guardar"
  console.log('Guardar cambios');
} else if (result.isDenied) {
  // Usuario eligió "No guardar"
  console.log('Descartar cambios');
} else {
  // Usuario eligió "Cancelar" o cerró el diálogo
  console.log('Cancelado');
}
```

#### Uso con personalización:
```typescript
const result = await alert.saveConfirm(
  '¿Deseas guardar los cambios antes de salir?',  // título
  'Guardar y salir',                               // texto botón confirmar
  'Salir sin guardar',                             // texto botón denegar
  'Permanecer',                                    // texto botón cancelar
  'Hay cambios pendientes en el formulario'        // mensaje adicional
);
```

### 6. 🔄 Manejo automático de guardado (`handleSaveDialog`) **NUEVO**

Esta función maneja automáticamente las respuestas y muestra mensajes de feedback:

```typescript
// Ejemplo en un formulario
const handleCloseForm = async () => {
  if (hasUnsavedChanges) {
    await alert.handleSave(
      // Callback para "Guardar"
      async () => {
        await saveFormData();
        closeDialog();
      },
      // Callback para "No guardar"
      () => {
        discardChanges();
        closeDialog();
      },
      // Callback para "Cancelar" (opcional)
      () => {
        console.log('Usuario canceló');
        // El formulario permanece abierto
      },
      // Opciones personalizadas (opcional)
      {
        title: '¿Guardar cambios en el usuario?',
        message: 'Tienes cambios sin guardar en el formulario',
        confirmText: 'Guardar cambios',
        denyText: 'Descartar',
        cancelText: 'Seguir editando'
      }
    );
  } else {
    closeDialog();
  }
};
```

## 🎯 Casos de uso comunes

### Eliminar con doble confirmación (patrón actual)
```typescript
const handleDelete = async (item) => {
  // Primera confirmación
  const firstConfirm = await alert.deleteConfirm(`${item.name}`);
  if (!firstConfirm.isConfirmed) return;

  // Segunda confirmación
  const secondConfirm = await alert.confirm(
    `Esta acción es PERMANENTE e IRREVERSIBLE. ¿Realmente deseas continuar?`,
    '🔴 CONFIRMACIÓN FINAL',
    'Sí, eliminar definitivamente',
    'Cancelar'
  );
  if (!secondConfirm.isConfirmed) return;

  // Proceder con eliminación
  try {
    await deleteItem(item.id);
    await alert.success('Item eliminado exitosamente');
  } catch (error) {
    await alert.error(`Error al eliminar: ${error.message}`);
  }
};
```

### Cerrar formulario con cambios sin guardar
```typescript
const handleFormClose = async () => {
  if (formIsDirty) {
    const result = await alert.saveConfirm(
      '¿Qué deseas hacer con los cambios?',
      'Guardar y cerrar',
      'Cerrar sin guardar',
      'Continuar editando'
    );

    if (result.isConfirmed) {
      await saveForm();
      await alert.success('Cambios guardados');
      closeForm();
    } else if (result.isDenied) {
      // Simplemente cerrar sin guardar
      closeForm();
    }
    // Si es dismiss/cancel, no hacer nada (mantener formulario abierto)
  } else {
    closeForm();
  }
};
```

### Navegación con cambios pendientes
```typescript
const handleNavigation = async (nextRoute: string) => {
  if (hasUnsavedWork) {
    await alert.handleSave(
      async () => {
        // Guardar y navegar
        await saveWork();
        router.push(nextRoute);
      },
      () => {
        // No guardar y navegar
        router.push(nextRoute);
      },
      () => {
        // Permanecer en la página actual
        console.log('Navegación cancelada');
      },
      {
        title: '¿Guardar antes de salir?',
        message: 'Tienes trabajo sin guardar que se perderá'
      }
    );
  } else {
    router.push(nextRoute);
  }
};
```

## 🎨 Todas las funciones usan tema dark

Todas las funciones tienen aplicado el tema dark con:
- Fondo: `colorTokens.neutral200` (gris oscuro)
- Texto: `colorTokens.neutral1200` (blanco)
- Botones con colores del tema:
  - Confirmar/Guardar: Verde o amarillo (brand)
  - Denegar/No guardar: Amarillo warning
  - Cancelar: Gris neutral
  - Eliminar: Rojo danger

## 📝 Notas importantes

1. Todas las funciones retornan una Promise con el resultado
2. Usa `isConfirmed` para verificar confirmación
3. Usa `isDenied` para verificar negación (solo en saveConfirm)
4. Usa `isDismissed` para verificar cancelación o cierre
5. `handleSaveDialog` maneja automáticamente los mensajes de feedback
6. Todas las funciones están disponibles a través de `alert` desde `useNotifications()`

```typescript
// En tu componente
const { alert, toast } = useNotifications();

// Ahora puedes usar:
// - alert.success()
// - alert.error()
// - alert.confirm()
// - alert.deleteConfirm()
// - alert.saveConfirm()
// - alert.handleSave()
```