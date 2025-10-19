-- Create client_announcements table for displaying messages to gym clients

CREATE TABLE IF NOT EXISTS client_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
          priority INTEGER NOT NULL DEFAULT 0, -- Higher number = higher priority
            is_active BOOLEAN NOT NULL DEFAULT true,
              start_date TIMESTAMPTZ,
                end_date TIMESTAMPTZ,
                  created_by UUID REFERENCES "Users"(id) ON DELETE SET NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                      );

                      -- Create index for active announcements queries
                      CREATE INDEX IF NOT EXISTS idx_client_announcements_active
                        ON client_announcements(is_active, priority DESC, created_at DESC);

                        -- Create index for date range queries
                        CREATE INDEX IF NOT EXISTS idx_client_announcements_dates
                          ON client_announcements(start_date, end_date);

                          -- Add RLS (Row Level Security) policies
                          ALTER TABLE client_announcements ENABLE ROW LEVEL SECURITY;

                          -- Policy: Anyone can read active announcements
                          CREATE POLICY "Anyone can view active announcements"
                            ON client_announcements
                              FOR SELECT
                                USING (is_active = true);

                                -- Policy: Only admins and employees can insert
                                CREATE POLICY "Admins and employees can insert announcements"
                                  ON client_announcements
                                    FOR INSERT
                                      WITH CHECK (
                                          EXISTS (
                                                SELECT 1 FROM "Users"
                                                      WHERE "Users".id = auth.uid()
                                                            AND "Users".rol IN ('admin', 'empleado')
                                                                )
                                                                  );

                                                                  -- Policy: Only admins and employees can update
                                                                  CREATE POLICY "Admins and employees can update announcements"
                                                                    ON client_announcements
                                                                      FOR UPDATE
                                                                        USING (
                                                                            EXISTS (
                                                                                  SELECT 1 FROM "Users"
                                                                                        WHERE "Users".id = auth.uid()
                                                                                              AND "Users".rol IN ('admin', 'empleado')
                                                                                                  )
                                                                                                    );

                                                                                                    -- Policy: Only admins can delete
                                                                                                    CREATE POLICY "Admins can delete announcements"
                                                                                                      ON client_announcements
                                                                                                        FOR DELETE
                                                                                                          USING (
                                                                                                              EXISTS (
                                                                                                                    SELECT 1 FROM "Users"
                                                                                                                          WHERE "Users".id = auth.uid()
                                                                                                                                AND "Users".rol = 'admin'
                                                                                                                                    )
                                                                                                                                      );

                                                                                                                                      -- Create trigger for updated_at
                                                                                                                                      CREATE OR REPLACE FUNCTION update_client_announcements_updated_at()
                                                                                                                                      RETURNS TRIGGER AS $$
                                                                                                                                      BEGIN
                                                                                                                                        NEW.updated_at = NOW();
                                                                                                                                          RETURN NEW;
                                                                                                                                          END;
                                                                                                                                          $$ LANGUAGE plpgsql;

                                                                                                                                          CREATE TRIGGER trigger_update_client_announcements_updated_at
                                                                                                                                            BEFORE UPDATE ON client_announcements
                                                                                                                                              FOR EACH ROW
                                                                                                                                                EXECUTE FUNCTION update_client_announcements_updated_at();

                                                                                                                                                -- Insert sample announcements
                                                                                                                                                INSERT INTO client_announcements (title, message, type, priority, is_active)
                                                                                                                                                VALUES
                                                                                                                                                  ('¡Bienvenido a Muscle Up GYM!', 'Estamos felices de tenerte aquí. Recuerda mantener tu membresía activa para disfrutar de todas nuestras instalaciones.', 'success', 10, true),
                                                                                                                                                    ('Horario Especial', 'Recuerda que los días festivos el gimnasio tiene horario especial. Verifica en la sección de configuración.', 'info', 5, true);

                                                                                                                                                    COMMENT ON TABLE client_announcements IS 'Mensajes y anuncios para mostrar a los clientes en el dashboard';
                                                                                                                                                    COMMENT ON COLUMN client_announcements.type IS 'Tipo de mensaje: info, warning, success, error';
                                                                                                                                                    COMMENT ON COLUMN client_announcements.priority IS 'Prioridad de visualización (mayor número = mayor prioridad)';
                                                                                                                                                    COMMENT ON COLUMN client_announcements.is_active IS 'Si el anuncio está activo y visible';
                                                                                                                                                    COMMENT ON COLUMN client_announcements.start_date IS 'Fecha de inicio de visualización (opcional)';
                                                                                                                                                    COMMENT ON COLUMN client_announcements.end_date IS 'Fecha de fin de visualización (opcional)';
                                                                                                                                                    