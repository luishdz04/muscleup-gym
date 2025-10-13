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
      // ✅ MÉTODO MODERNO: getAll (reemplaza get)
      getAll() {
        return cookieStore.getAll();
      },
      // ✅ MÉTODO MODERNO: setAll
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
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
    .select('rol, firstName, lastName, id')
    .eq('id', user.id)
    .single();

  const userRole = userData?.rol;
  if (userRole !== 'admin' && userRole !== 'empleado') {
    redirect('/dashboard/cliente');
  }

  // ✅ OBTENER DATOS DESDE EMPLOYEES PARA ADMIN/EMPLEADO
  let profilePictureUrl = null;
  let firstName = userData?.firstName;
  let lastName = userData?.lastName;

  if (userRole === 'admin' || userRole === 'empleado') {
    const { data: employeeData } = await supabase
      .from('employees')
      .select('profile_picture_url')
      .eq('user_id', user.id)
      .single();

    if (employeeData) {
      profilePictureUrl = employeeData.profile_picture_url;
    }
  }

  // Pasar datos del usuario al client component
  const userWithRole = {
    id: user.id,
    email: user.email,
    rol: userData?.rol,
    firstName: firstName,
    lastName: lastName,
    profilePictureUrl: profilePictureUrl
  };

  return (
    <AdminLayoutClient user={userWithRole}>
      {children}
    </AdminLayoutClient>
  );
}