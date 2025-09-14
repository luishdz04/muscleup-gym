// Server Component - PROTECCIÓN PRINCIPAL
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';

// Forzar renderizado dinámico en el servidor
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProtectedDashboardLayout({ children }: { children: React.ReactNode }) {
  // ✅ AGREGAR AWAIT AQUÍ
  const cookieStore = await cookies();
  
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay usuario, redirige ANTES de renderizar cualquier layout hijo.
  if (!user) {
    redirect('/');
  }

  // Si hay usuario, permite que el siguiente layout se renderice.
  return <>{children}</>;
}