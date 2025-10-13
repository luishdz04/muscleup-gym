import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Endpoint para migrar usuarios admin/empleado de la tabla Users a la tabla employees
 * Esto crea las fichas de empleado faltantes para usuarios que ya existen en el sistema
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Iniciando migración de usuarios a tabla employees...');

    // 1. Obtener todos los usuarios con rol admin o empleado
    const { data: users, error: usersError } = await supabaseAdmin
      .from('Users')
      .select('id, firstName, lastName, email, rol, createdAt')
      .in('rol', ['admin', 'empleado']);

    if (usersError) {
      console.error('❌ Error al obtener usuarios:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        message: 'No hay usuarios admin/empleado para migrar',
        migrated: 0
      });
    }

    console.log(`👥 Encontrados ${users.length} usuarios admin/empleado`);

    // 2. Obtener los IDs de usuarios que YA tienen registro en employees
    const userIds = users.map(u => u.id);
    const { data: existingEmployees, error: employeesError } = await supabaseAdmin
      .from('employees')
      .select('user_id')
      .in('user_id', userIds);

    if (employeesError) {
      console.error('❌ Error al obtener empleados existentes:', employeesError);
      return NextResponse.json({ error: employeesError.message }, { status: 400 });
    }

    const existingUserIds = new Set(existingEmployees?.map(emp => emp.user_id) || []);
    
    // 3. Filtrar usuarios que NO tienen ficha de empleado
    const usersToMigrate = users.filter(user => !existingUserIds.has(user.id));

    if (usersToMigrate.length === 0) {
      return NextResponse.json({ 
        message: 'Todos los usuarios ya tienen ficha de empleado',
        migrated: 0,
        total: users.length
      });
    }

    console.log(`📋 ${usersToMigrate.length} usuarios necesitan migración`);

    // 4. Crear registros en employees para cada usuario sin ficha
    const employeeRecords = usersToMigrate.map(user => ({
      user_id: user.id,
      // Datos básicos predeterminados
      position: user.rol === 'admin' ? 'Administrador' : 'Empleado',
      department: 'Administración',
      status: 'active',
      salary: null,
      hire_date: user.createdAt || new Date().toISOString(),
      
      // Datos personales (vacíos, se llenarán después)
      birth_date: null,
      gender: null,
      marital_status: null,
      phone: null,
      
      // Dirección (vacía)
      street: null,
      number: null,
      neighborhood: null,
      city: null,
      state: null,
      postal_code: null,
      country: 'México',
      
      // Contacto de emergencia (vacío)
      emergency_contact_name: null,
      emergency_contact_phone: null,
      emergency_contact_relationship: null,
      
      // Sin foto por ahora
      profile_picture_url: null,
      
      // Sin huella dactilar
      fingerprint: false,
      
      // Metadatos
      created_by: null, // Será null porque es migración automática
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // 5. Insertar todos los registros
    const { data: insertedEmployees, error: insertError } = await supabaseAdmin
      .from('employees')
      .insert(employeeRecords)
      .select();

    if (insertError) {
      console.error('❌ Error al insertar registros de empleados:', insertError);
      return NextResponse.json({ 
        error: `Error al migrar usuarios: ${insertError.message}`,
        details: insertError
      }, { status: 400 });
    }

    console.log(`✅ Migración completada: ${insertedEmployees?.length} registros creados`);

    // 6. Retornar resultado detallado
    return NextResponse.json({ 
      success: true,
      message: 'Migración completada exitosamente',
      migrated: insertedEmployees?.length || 0,
      total: users.length,
      details: {
        usersFound: users.length,
        alreadyMigrated: existingUserIds.size,
        newlyMigrated: insertedEmployees?.length || 0,
        migratedUsers: usersToMigrate.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          rol: u.rol
        }))
      }
    });

  } catch (error) {
    console.error('💥 Error general en migración:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    );
  }
}
