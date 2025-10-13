import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    console.log('� Nueva lógica de API: Iniciando consulta de usuarios y empleados...');
    
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const positionFilter = searchParams.get('position');
    const departmentFilter = searchParams.get('department');
    const roleFilter = searchParams.get('role');

    // 1. Obtener solo usuarios que son 'admin' o 'empleado'.
    let usersQuery = supabaseAdmin
      .from('Users')
      .select('id, firstName, lastName, email, createdAt, rol')
      .in('rol', ['admin', 'empleado']) // <-- FILTRO CLAVE: Solo roles de equipo
      .order('createdAt', { ascending: false });

    // Si el frontend envía un filtro de rol específico ('admin' o 'empleado'), lo aplicamos.
    if (roleFilter) {
      usersQuery = usersQuery.eq('rol', roleFilter);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('❌ Error en query Users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    if (!users || users.length === 0) {
      console.log('🤷 No se encontraron usuarios con los filtros aplicados.');
      return NextResponse.json({ employees: [], total: 0 });
    }
    
    console.log(`👤 Encontrados ${users.length} usuarios en la tabla 'Users'.`);
    
    // DEBUG: Ver qué usuarios y roles se están trayendo
    console.log('🔍 DEBUG - Usuarios obtenidos:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} - Email: ${user.email} - Rol: "${user.rol}" (tipo: ${typeof user.rol})`);
    });

    // 2. Obtener todos los registros de empleados correspondientes a esos usuarios.
    const userIds = users.map(u => u.id);
    const { data: employees, error: employeesError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .in('user_id', userIds);

    if (employeesError) {
      console.error('❌ Error en query employees:', employeesError);
      return NextResponse.json({ error: employeesError.message }, { status: 400 });
    }
    
    console.log(`� Encontrados ${employees?.length || 0} registros en la tabla 'employees'.`);

    // 3. Crear un mapa de empleados para una búsqueda eficiente.
    const employeesMap = new Map(employees?.map(emp => [emp.user_id, emp]));

    // 4. Combinar datos de usuarios y empleados.
    let combinedData = users.map(user => {
      const employeeData = employeesMap.get(user.id);
      
      return {
        id: employeeData?.id ?? null, // ID de la tabla 'employees', puede ser null
        user_id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        rol: user.rol as 'admin' | 'empleado',
        phone: employeeData?.phone ?? null,
        position: employeeData?.position ?? null,
        department: employeeData?.department ?? null,
        status: employeeData?.status ?? 'active', // Default a 'active' si no hay ficha
        salary: employeeData?.salary ?? null,
        hireDate: employeeData?.hire_date ?? null,
        profilePictureUrl: employeeData?.profile_picture_url ?? null,
        fingerprint: employeeData?.fingerprint ?? false,
        emergencyContact: {
          name: employeeData?.emergency_contact_name ?? null,
          phone: employeeData?.emergency_contact_phone ?? null,
          relationship: employeeData?.emergency_contact_relationship ?? null,
        },
        address: {
          street: employeeData?.street ?? null,
          number: employeeData?.number ?? null,
          neighborhood: employeeData?.neighborhood ?? null,
          city: employeeData?.city ?? null,
          state: employeeData?.state ?? null,
          postalCode: employeeData?.postal_code ?? null,
        },
        birthDate: employeeData?.birth_date ?? null,
        gender: employeeData?.gender ?? null,
        maritalStatus: employeeData?.marital_status ?? null,
        createdAt: user.createdAt,
        updatedAt: employeeData?.updated_at ?? null,
        createdBy: employeeData?.created_by ?? null,
        hasEmployeeRecord: !!employeeData, // Booleano que indica si existe la ficha
      };
    });

    // 5. Aplicar filtros de estado, puesto y departamento en memoria.
    if (statusFilter) {
      combinedData = combinedData.filter(e => e.status === statusFilter);
    }
    if (positionFilter) {
      combinedData = combinedData.filter(e => e.position === positionFilter);
    }
    if (departmentFilter) {
      combinedData = combinedData.filter(e => e.department === departmentFilter);
    }

    console.log(`✅ Final: ${combinedData.length} registros después de combinar y filtrar.`);

    return NextResponse.json({ 
      employees: combinedData,
      total: combinedData.length,
    });

  } catch (error) {
    console.error('💥 Error general en la API de empleados:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    return NextResponse.json(
      { error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    );
  }
}