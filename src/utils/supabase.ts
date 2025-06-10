import { createClient } from '@supabase/supabase-js';

// Cliente público para operaciones del navegador
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variables de entorno de Supabase no configuradas correctamente');
}

export const supabase = createClient(supabaseUrl, supabaseKey);