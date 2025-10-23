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
