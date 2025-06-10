import { createClient } from '@supabase/supabase-js';

// Crear cliente de Supabase con la SERVICE_ROLE_KEY para bypass de RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);