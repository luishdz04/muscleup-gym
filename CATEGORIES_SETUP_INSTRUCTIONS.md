# INSTRUCCIONES PARA CONFIGURAR CATEGORÍAS

## 1. Ejecutar SQL en Supabase

Ve a tu proyecto de Supabase → SQL Editor y ejecuta el siguiente script:

```sql
-- Crear tabla categories para gestión centralizada de categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(255) NOT NULL UNIQUE,
  subcategories jsonb DEFAULT '[]'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON categories(created_at);

-- Insertar algunas categorías de ejemplo si no existen
INSERT INTO categories (name, subcategories) VALUES 
  ('Suplementos', '["Proteínas", "Creatina", "Vitaminas", "Pre-entreno"]'),
  ('Ropa Deportiva', '["Camisetas", "Pantalones", "Zapatos", "Accesorios"]'),
  ('Equipamiento', '["Pesas", "Máquinas", "Accesorios", "Cardio"]')
ON CONFLICT (name) DO NOTHING;

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Categories are insertable by authenticated users" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Categories are updatable by authenticated users" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Categories are deletable by authenticated users" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');
```

## 2. Verificar la creación

Después de ejecutar el script, verifica que:

1. La tabla `categories` se creó correctamente
2. Se insertaron las 3 categorías de ejemplo
3. Las políticas RLS están activas

## 3. Probar la funcionalidad

Una vez ejecutado el script:

1. Ve a la página de productos
2. Haz clic en "Gestionar Categorías"
3. Deberías ver las categorías de ejemplo
4. Prueba agregar una nueva categoría
5. Prueba agregar subcategorías
6. Verifica que se guarden correctamente

## 4. Conectar con productos

Una vez que las categorías funcionen, necesitaremos:

1. Actualizar el formulario de productos para usar las categorías de la tabla
2. Sincronizar las categorías existentes en productos con la nueva tabla
3. Implementar validación para evitar categorías huérfanas

## Notas importantes

- El script es idempotente (se puede ejecutar múltiples veces sin problemas)
- Las categorías de ejemplo se insertan solo si no existen
- Las políticas RLS permiten acceso completo a usuarios autenticados
- El trigger actualiza automáticamente el campo `updated_at`
