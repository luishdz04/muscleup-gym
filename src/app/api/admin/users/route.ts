import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/admin/users - Obtener todos los usuarios con datos relacionados
export async function GET(request: NextRequest) {
  try {
    console.log('📊 [API-USERS] Obteniendo usuarios con datos relacionados...');

    const { data: users, error } = await supabaseAdmin
      .from('Users')
      .select(`
        *,
        addresses(*),
        emergency_contacts(*),
        membership_info(*)
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ [API-USERS] Error en query:', error);
      return NextResponse.json(
        { message: 'Error al obtener usuarios: ' + error.message },
        { status: 500 }
      );
    }

    console.log(`✅ [API-USERS] ${users?.length || 0} usuarios obtenidos exitosamente`);

    return NextResponse.json(users);

  } catch (error: any) {
    console.error('❌ [API-USERS] Error en API:', error);
    return NextResponse.json(
      { message: 'Error interno: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Crear un nuevo usuario
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Validaciones básicas
    if (!userData.firstName || !userData.lastName || !userData.email) {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }
    
    // Verificar si el email ya existe
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('Users')
      .select('id')
      .eq('email', userData.email)
      .single();
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'El email ya está registrado' },
        { status: 400 }
      );
    }
    
    // Generar contraseña aleatoria si no se proporciona
    if (!userData.password) {
      userData.password = Math.random().toString(36).slice(-8);
    }
    
    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    });
    
    if (authError) {
      return NextResponse.json(
        { message: 'Error al crear usuario en Auth: ' + authError.message },
        { status: 500 }
      );
    }
    
    // Extraer datos de las tablas relacionadas
    const { address, emergency, membership, ...userMainData } = userData;
    
    // Asignar el ID generado por Auth
    userMainData.id = authUser.user.id;
    
    // Crear el registro en la tabla Users
    const { data: newUser, error } = await supabaseAdmin
      .from('Users')
      .insert([userMainData])
      .select()
      .single();
    
    if (error) {
      // Si hay error, intentar eliminar el usuario de Auth para mantener consistencia
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return NextResponse.json(
        { message: 'Error al crear usuario en la base de datos: ' + error.message },
        { status: 500 }
      );
    }
    
    // Si es cliente, guardar datos adicionales en las tablas relacionadas
    if (newUser.rol === 'cliente') {
      // ✅ UPSERT dirección (previene duplicados si se ejecuta múltiples veces)
      if (address) {
        const addressData = {
          ...address,
          userId: newUser.id
        };
        
        const { error: addressError } = await supabaseAdmin
          .from('addresses')
          .upsert([addressData], { 
            onConflict: 'userId',
            ignoreDuplicates: false
          });
        
        if (addressError) {
          console.error("Error al guardar dirección:", addressError);
        }
      }
      
      // ✅ UPSERT contacto de emergencia
      if (emergency) {
        const emergencyData = {
          ...emergency,
          userId: newUser.id
        };
        
        const { error: emergencyError } = await supabaseAdmin
          .from('emergency_contacts')
          .upsert([emergencyData], { 
            onConflict: 'userId',
            ignoreDuplicates: false
          });
        
        if (emergencyError) {
          console.error("Error al guardar contacto de emergencia:", emergencyError);
        }
      }
      
      // ✅ UPSERT información de membresía
      if (membership) {
        const membershipData = {
          ...membership,
          userId: newUser.id
        };
        
        const { error: membershipError } = await supabaseAdmin
          .from('membership_info')
          .upsert([membershipData], { 
            onConflict: 'userId',
            ignoreDuplicates: false
          });
        
        if (membershipError) {
          console.error("Error al guardar información de membresía:", membershipError);
        }
      }
    }
    
    return NextResponse.json(newUser, { status: 201 });
    
  } catch (error: any) {
    console.error('Error en API:', error);
    return NextResponse.json(
      { message: 'Error interno: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    );
  }
}