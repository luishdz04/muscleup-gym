// Server Component para verificación de rol ADMIN
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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
  
  if (!user) {
    redirect('/');
  }

  // Verificar rol en servidor
  const { data: userData } = await supabase
    .from('Users')
    .select('rol, firstName, lastName, profilePictureUrl, id')
    .eq('id', user.id)
    .single();

  const userRole = userData?.rol;
  if (userRole !== 'admin' && userRole !== 'empleado') {
    redirect('/dashboard/cliente');
  }

  // Pasar datos del usuario al client component
  const userWithRole = {
    id: user.id,
    email: user.email,
    rol: userData?.rol,
    firstName: userData?.firstName,
    lastName: userData?.lastName,
    profilePictureUrl: userData?.profilePictureUrl
  };

  return (
    <AdminLayoutClient user={userWithRole}>
      {children}
    </AdminLayoutClient>
  );
}