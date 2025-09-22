import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Iniciando consulta de empleados...');
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // active, inactive, suspended
    const position = searchParams.get('position');
    const department = searchParams.get('department');

    // PRIMERA CONSULTA: Obtener empleados con filtros
    let employeesQuery = supabaseAdmin
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros opcionales
    if (status) {
      employeesQuery = employeesQuery.eq('status', status);
    }
    if (position) {
      employeesQuery = employeesQuery.eq('position', position);
    }
    if (department) {
      employeesQuery = employeesQuery.eq('department', department);
    }

    const { data: employees, error } = await employeesQuery;

    if (error) {
      console.error('❌ Error en query employees:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('📊 Empleados encontrados:', employees?.length || 0);
    
    if (!employees || employees.length === 0) {
      return NextResponse.json({ 
        employees: [], 
        total: 0,
        debug: 'No hay empleados en la tabla'
      });
    }

    // SEGUNDA CONSULTA: Obtener datos básicos de Users por separado
    const userIds = employees.map(emp => emp.user_id);
    console.log('👥 User IDs a buscar:', userIds);

    const { data: users, error: usersError } = await supabaseAdmin
      .from('Users')
      .select('id, firstName, lastName, email, createdAt')
      .in('id', userIds);

    if (usersError) {
      console.error('❌ Error en query Users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    console.log('👤 Users encontrados:', users?.length || 0);

    // TERCERA PASO: Combinar datos manualmente
    const formattedEmployees = employees.map(emp => {
      const user = users?.find(u => u.id === emp.user_id);
      
      if (!user) {
        console.warn(`⚠️ No se encontró usuario para employee: ${emp.user_id}`);
        return null;
      }

      return {
        id: emp.id,        // ✅ CORREGIDO: Usar el ID real del empleado
        user_id: emp.user_id, // ✅ Mantener user_id como referencia separada
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: emp.phone,
        position: emp.position,
        department: emp.department,
        status: emp.status,
        salary: emp.salary,
        hireDate: emp.hire_date,
        profilePictureUrl: emp.profile_picture_url, // ✅ CORREGIDO: Tomamos de employees, no de Users
        fingerprint: emp.fingerprint,
        emergencyContact: {
          name: emp.emergency_contact_name,
          phone: emp.emergency_contact_phone,
          relationship: emp.emergency_contact_relationship
        },
        address: {
          street: emp.street,
          number: emp.number,
          neighborhood: emp.neighborhood,
          city: emp.city,
          state: emp.state,
          postalCode: emp.postal_code
        },
        birthDate: emp.birth_date,
        gender: emp.gender,
        maritalStatus: emp.marital_status,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at,
        createdBy: emp.created_by
      };
    }).filter(Boolean);

    console.log('✅ Empleados formateados:', formattedEmployees.length);

    return NextResponse.json({ 
      employees: formattedEmployees,
      total: formattedEmployees.length,
      debug: `${employees.length} empleados, ${users?.length} usuarios, foto desde employees.profile_picture_url`
    });

  } catch (error) {
    console.error('💥 Error general:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    );
  }
}