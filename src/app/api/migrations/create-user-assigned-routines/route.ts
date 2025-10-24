import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();

    // Verificar autenticación y rol admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que sea admin
    const { data: userData } = await supabase
      .from('Users')
      .select('rol')
      .eq('id', user.id)
      .single();

    if (userData?.rol !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado. Solo administradores pueden ejecutar migraciones.' },
        { status: 403 }
      );
    }

    // Crear tabla user_assigned_routines
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Crear tabla si no existe
        CREATE TABLE IF NOT EXISTS user_assigned_routines (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
          routine_id UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
          assigned_by UUID NOT NULL REFERENCES "Users"(id),
          assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          start_date DATE,
          end_date DATE,
          notes TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, routine_id)
        );

        -- Crear índices
        CREATE INDEX IF NOT EXISTS idx_user_assigned_routines_user ON user_assigned_routines(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_assigned_routines_routine ON user_assigned_routines(routine_id);
        CREATE INDEX IF NOT EXISTS idx_user_assigned_routines_active ON user_assigned_routines(is_active);

        -- Trigger para updated_at
        CREATE OR REPLACE FUNCTION update_user_assigned_routines_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS trigger_update_user_assigned_routines_updated_at ON user_assigned_routines;

        CREATE TRIGGER trigger_update_user_assigned_routines_updated_at
        BEFORE UPDATE ON user_assigned_routines
        FOR EACH ROW
        EXECUTE FUNCTION update_user_assigned_routines_updated_at();
      `
    });

    if (createError) {
      console.error('❌ [MIGRATION] Error creating table:', createError);

      // Si falla con exec_sql, intentar crear directamente (Supabase puede no tener esta función)
      return NextResponse.json({
        error: 'Error al crear tabla. Por favor, ejecuta el siguiente SQL manualmente en Supabase SQL Editor:',
        sql: `
CREATE TABLE IF NOT EXISTS user_assigned_routines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES "Users"(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, routine_id)
);

CREATE INDEX IF NOT EXISTS idx_user_assigned_routines_user ON user_assigned_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_routines_routine ON user_assigned_routines(routine_id);
CREATE INDEX IF NOT EXISTS idx_user_assigned_routines_active ON user_assigned_routines(is_active);
        `,
        details: createError
      }, { status: 500 });
    }

    console.log('✅ [MIGRATION] Tabla user_assigned_routines creada exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Tabla user_assigned_routines creada exitosamente'
    });

  } catch (error) {
    console.error('❌ [MIGRATION] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
