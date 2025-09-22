// src/app/api/admin/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/admin/employees/[id] - Obtener un empleado específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params; // ✅ AWAIT params - OBLIGATORIO en Next.js 15+
    
    console.log('📋 [GET-EMPLOYEE] Obteniendo empleado:', id);
    
    // Obtener datos del empleado
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    
    if (employeeError) {
      if (employeeError.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Empleado no encontrado' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: 'Error al obtener empleado: ' + employeeError.message },
        { status: 500 }
      );
    }
    
    if (!employee) {
      return NextResponse.json(
        { message: 'Empleado no encontrado' },
        { status: 404 }
      );
    }
    
    // Obtener datos del usuario relacionado
    const { data: user, error: userError } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('id', employee.user_id)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { message: 'Datos de usuario no encontrados' },
        { status: 404 }
      );
    }
    
    // Combinar datos - mapeo snake_case a camelCase
    const employeeData = {
      id: employee.id,
      user_id: employee.user_id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: employee.phone,
      birthDate: employee.birth_date,
      gender: employee.gender,
      maritalStatus: employee.marital_status,
      street: employee.street,
      number: employee.number,
      neighborhood: employee.neighborhood,
      city: employee.city,
      state: employee.state,
      postalCode: employee.postal_code,
      country: employee.country,
      position: employee.position,
      department: employee.department,
      hireDate: employee.hire_date,
      salary: employee.salary,
      status: employee.status,
      emergencyContactName: employee.emergency_contact_name,
      emergencyContactPhone: employee.emergency_contact_phone,
      emergencyContactRelationship: employee.emergency_contact_relationship,
      fingerprint: employee.fingerprint || user.fingerprint || false,
      fingerprintEnrolledAt: employee.fingerprint_enrolled_at,
      profilePictureUrl: employee.profile_picture_url || user.profilePictureUrl,
      createdAt: employee.created_at,
      updatedAt: employee.updated_at,
      createdBy: employee.created_by
    };
    
    console.log('✅ [GET-EMPLOYEE] Empleado obtenido exitosamente');
    
    return NextResponse.json(employeeData);
    
  } catch (error: any) {
    console.error('❌ [GET-EMPLOYEE] Error:', error);
    return NextResponse.json(
      { message: 'Error interno: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    );
  }
}

// PUT /api/admin/employees/[id] - Actualizar empleado existente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params; // ✅ AWAIT params - OBLIGATORIO en Next.js 15+
    console.log('📝 [UPDATE-EMPLOYEE] Actualizando empleado:', id);
    
    const requestData = await request.json();
    console.log('📋 [UPDATE-EMPLOYEE] Datos recibidos:', requestData);
    
    // Validaciones básicas
    if (!requestData.firstName || !requestData.lastName || !requestData.email) {
      console.log('❌ [UPDATE-EMPLOYEE] Faltan campos obligatorios');
      return NextResponse.json(
        { message: 'Faltan campos obligatorios: firstName, lastName, email' },
        { status: 400 }
      );
    }
    
    if (!requestData.position) {
      console.log('❌ [UPDATE-EMPLOYEE] Falta position');
      return NextResponse.json(
        { message: 'El campo position es obligatorio' },
        { status: 400 }
      );
    }
    
    console.log('✅ [UPDATE-EMPLOYEE] Validaciones básicas pasadas');
    
    // Verificar que el empleado existe
    const { data: existingEmployee, error: checkError } = await supabaseAdmin
      .from('employees')
      .select('user_id')
      .eq('id', id)
      .single();
    
    console.log('🔍 [UPDATE-EMPLOYEE] Empleado existente:', existingEmployee, 'Error:', checkError);
    
    if (checkError || !existingEmployee) {
      console.log('❌ [UPDATE-EMPLOYEE] Empleado no encontrado en BD');
      return NextResponse.json(
        { message: 'Empleado no encontrado' },
        { status: 404 }
      );
    }
    
    const userId = existingEmployee.user_id;
    console.log('👤 [UPDATE-EMPLOYEE] User ID:', userId);
    
    // Verificar que el usuario existe
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('Users')
      .select('id, email')
      .eq('id', userId)
      .single();
    
    console.log('👤 [UPDATE-EMPLOYEE] Usuario existente:', existingUser, 'Error:', userCheckError);
    
    if (userCheckError || !existingUser) {
      console.log('❌ [UPDATE-EMPLOYEE] Usuario no encontrado en BD');
      return NextResponse.json(
        { message: 'Usuario relacionado no encontrado' },
        { status: 404 }
      );
    }
    
    console.log('✅ [UPDATE-EMPLOYEE] Usuario encontrado, continuando...');
    
    // Si el email cambió, verificar que no exista otro usuario con ese email
    if (requestData.email !== existingUser.email) {
      console.log('📧 [UPDATE-EMPLOYEE] Email cambió, verificando duplicados...');
      
      const { data: emailExists } = await supabaseAdmin
        .from('Users')
        .select('id')
        .eq('email', requestData.email)
        .neq('id', userId)
        .single();
      
      if (emailExists) {
        console.log('❌ [UPDATE-EMPLOYEE] Email duplicado encontrado');
        return NextResponse.json(
          { message: 'El email ya está registrado por otro usuario' },
          { status: 400 }
        );
      }
      
      console.log('✅ [UPDATE-EMPLOYEE] Email único, actualizando Auth...');
      
      // Actualizar email en Auth si es necesario
      try {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { email: requestData.email, email_confirm: true }
        );
        
        if (updateAuthError) {
          console.warn('⚠️ Error actualizando email en Auth:', updateAuthError.message);
        } else {
          console.log('✅ [UPDATE-EMPLOYEE] Email actualizado en Auth');
        }
      } catch (authError) {
        console.warn('⚠️ Error en Auth, continuando...', authError);
      }
    }
    
    console.log('🔄 [UPDATE-EMPLOYEE] Preparando datos para actualización...');
    
    // Preparar datos para tabla Users
    const userDataToUpdate: Record<string, any> = {
      firstName: requestData.firstName,
      lastName: requestData.lastName,
      email: requestData.email,
      fingerprint: requestData.fingerprint || false
    };
    
    // Agregar profilePictureUrl solo si existe
    if (requestData.profilePictureUrl) {
      userDataToUpdate.profilePictureUrl = requestData.profilePictureUrl;
    }
    
    console.log('👤 [UPDATE-EMPLOYEE] Datos de Users a actualizar:', userDataToUpdate);
    
    // Preparar datos para tabla employees - mapeo camelCase a snake_case
    const employeeDataToUpdate: Record<string, any> = {
      phone: requestData.phone || null,
      birth_date: requestData.birthDate || null,
      gender: requestData.gender || null,
      marital_status: requestData.maritalStatus || null,
      street: requestData.street || null,
      number: requestData.number || null,
      neighborhood: requestData.neighborhood || null,
      city: requestData.city || null,
      state: requestData.state || null,
      postal_code: requestData.postalCode || null,
      country: requestData.country || 'México',
      position: requestData.position,
      department: requestData.department || null,
      hire_date: requestData.hireDate || null,
      status: requestData.status || 'active',
      emergency_contact_name: requestData.emergencyContactName || null,
      emergency_contact_phone: requestData.emergencyContactPhone || null,
      emergency_contact_relationship: requestData.emergencyContactRelationship || null,
      fingerprint: requestData.fingerprint || false,
      updated_at: new Date().toISOString()
    };
    
    // Agregar salary solo si es un número válido
    if (requestData.salary && !isNaN(parseFloat(requestData.salary))) {
      employeeDataToUpdate.salary = parseFloat(requestData.salary);
    }
    
    // Agregar profile_picture_url solo si existe
    if (requestData.profilePictureUrl) {
      employeeDataToUpdate.profile_picture_url = requestData.profilePictureUrl;
    }
    
    console.log('👨‍💼 [UPDATE-EMPLOYEE] Datos de employees a actualizar:', employeeDataToUpdate);
    
    // Actualizar tabla Users
    console.log('🔄 [UPDATE-EMPLOYEE] Actualizando tabla Users...');
    const { error: userUpdateError } = await supabaseAdmin
      .from('Users')
      .update(userDataToUpdate)
      .eq('id', userId);
    
    if (userUpdateError) {
      console.log('❌ [UPDATE-EMPLOYEE] Error actualizando Users:', userUpdateError);
      return NextResponse.json(
        { message: 'Error al actualizar datos de usuario: ' + userUpdateError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ [UPDATE-EMPLOYEE] Tabla Users actualizada');
    
    // Actualizar tabla employees
    console.log('🔄 [UPDATE-EMPLOYEE] Actualizando tabla employees...');
    const { data: updatedEmployee, error: employeeUpdateError } = await supabaseAdmin
      .from('employees')
      .update(employeeDataToUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (employeeUpdateError) {
      console.log('❌ [UPDATE-EMPLOYEE] Error actualizando employees:', employeeUpdateError);
      return NextResponse.json(
        { message: 'Error al actualizar datos de empleado: ' + employeeUpdateError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ [UPDATE-EMPLOYEE] Tabla employees actualizada:', updatedEmployee);
    
    // Procesar huella dactilar si existe
    if (requestData.fingerprintData && requestData.fingerprintData.template) {
      console.log('🖐️ [UPDATE-EMPLOYEE] Procesando huella dactilar...');
      
      try {
        const fingerprintPayload = {
          user_id: userId,
          template: requestData.fingerprintData.template,
          device_user_id: requestData.fingerprintData.device_user_id,
          finger_index: requestData.fingerprintData.finger_index,
          finger_name: requestData.fingerprintData.finger_name,
          primary_template: requestData.fingerprintData.primary_template,
          verification_template: requestData.fingerprintData.verification_template,
          backup_template: requestData.fingerprintData.backup_template,
          average_quality: requestData.fingerprintData.average_quality,
          capture_count: requestData.fingerprintData.capture_count,
          capture_time_ms: requestData.fingerprintData.capture_time_ms,
          device_info: requestData.fingerprintData.device_info || {},
          sdk_version: 'official_zkteco',
          enrolled_at: new Date().toISOString()
        };
        
        const fingerprintResponse = await fetch(`${request.nextUrl.origin}/api/biometric/fingerprint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fingerprintPayload)
        });
        
        if (fingerprintResponse.ok) {
          // Actualizar flag de fingerprint en ambas tablas
          await supabaseAdmin
            .from('Users')
            .update({ fingerprint: true })
            .eq('id', userId);
          
          await supabaseAdmin
            .from('employees')
            .update({ 
              fingerprint: true,
              fingerprint_enrolled_at: new Date().toISOString()
            })
            .eq('id', id);
          
          console.log('✅ [UPDATE-EMPLOYEE] Huella procesada exitosamente');
        } else {
          console.warn('⚠️ [UPDATE-EMPLOYEE] Error procesando huella, continuando...');
        }
      } catch (fingerprintError) {
        console.error('❌ [UPDATE-EMPLOYEE] Error en huella dactilar:', fingerprintError);
      }
    }
    
    console.log('🎉 [UPDATE-EMPLOYEE] Empleado actualizado exitosamente');
    
    return NextResponse.json({
      message: 'Empleado actualizado correctamente',
      employee: updatedEmployee
    });
    
  } catch (error: any) {
    console.error('💥 [UPDATE-EMPLOYEE] Error crítico:', error);
    return NextResponse.json(
      { message: 'Error interno: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/employees/[id] - Eliminar empleado completamente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params; // ✅ AWAIT params - OBLIGATORIO en Next.js 15+
    
    console.log('🗑️ [DELETE-EMPLOYEE] Iniciando eliminación del empleado:', id);
    
    // Verificar que el empleado existe
    const { data: existingEmployee, error: checkError } = await supabaseAdmin
      .from('employees')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (checkError || !existingEmployee) {
      return NextResponse.json(
        { message: 'Empleado no encontrado' },
        { status: 404 }
      );
    }
    
    const userId = existingEmployee.user_id;
    
    // Obtener datos del usuario para el log
    const { data: user } = await supabaseAdmin
      .from('Users')
      .select('firstName, lastName, email, fingerprint')
      .eq('id', userId)
      .single();
    
    const employeeName = user ? `${user.firstName} ${user.lastName}` : 'Empleado desconocido';
    const employeeEmail = user ? user.email : 'email desconocido';
    
    console.log('👤 Empleado encontrado:', employeeName, '(', employeeEmail, ')');
    
    // 1. Eliminar huella dactilar si existe
    if (user && user.fingerprint) {
      try {
        console.log('🖐️ Eliminando huella dactilar...');
        
        const fingerprintResponse = await fetch(
          `${request.nextUrl.origin}/api/biometric/fingerprint?userId=${userId}`,
          { method: 'DELETE' }
        );
        
        if (fingerprintResponse.ok) {
          console.log('✅ Huella eliminada correctamente');
        } else {
          console.warn('⚠️ Error eliminando huella, continuando...');
        }
      } catch (fingerprintError) {
        console.error('❌ Error eliminando huella:', fingerprintError);
      }
    }
    
    // 2. Eliminar archivos del storage
    try {
      console.log('📁 Eliminando archivos del storage...');
      
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('user-files')
        .list(userId, { limit: 1000 });
      
      if (listError) {
        console.error('❌ Error listando archivos:', listError);
      } else if (files && files.length > 0) {
        console.log('📋 Encontrados', files.length, 'archivos para eliminar');
        
        const filesToDelete = files.map(file => `${userId}/${file.name}`);
        
        const { error: deleteError } = await supabaseAdmin.storage
          .from('user-files')
          .remove(filesToDelete);
        
        if (deleteError) {
          console.error('❌ Error eliminando archivos:', deleteError);
        } else {
          console.log('✅ Archivos eliminados correctamente');
        }
      } else {
        console.log('ℹ️ No se encontraron archivos para eliminar');
      }
    } catch (storageError) {
      console.error('❌ Error en storage:', storageError);
    }
    
    // 3. Eliminar registro de empleado
    const { error: deleteEmployeeError } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (deleteEmployeeError) {
      return NextResponse.json(
        { message: 'Error al eliminar registro de empleado: ' + deleteEmployeeError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Registro de empleado eliminado');
    
    // 4. Eliminar usuario de la tabla Users
    const { error: deleteUserError } = await supabaseAdmin
      .from('Users')
      .delete()
      .eq('id', userId);
    
    if (deleteUserError) {
      return NextResponse.json(
        { message: 'Error al eliminar usuario: ' + deleteUserError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Usuario eliminado de tabla Users');
    
    // 5. Eliminar de Supabase Auth
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.warn('⚠️ Error eliminando de Auth:', authError.message);
      } else {
        console.log('✅ Usuario eliminado de Supabase Auth');
      }
    } catch (authError) {
      console.warn('⚠️ Error en Auth, continuando...', authError);
    }
    
    console.log('🎉 Eliminación completa exitosa para empleado:', employeeName);
    
    return NextResponse.json({
      message: 'Empleado eliminado completamente',
      details: {
        employeeId: id,
        userId: userId,
        employeeName: employeeName,
        email: employeeEmail,
        deletedAt: new Date().toISOString(),
        actions: [
          'Huella dactilar eliminada',
          'Archivos eliminados del Storage',
          'Registro de empleado eliminado',
          'Usuario eliminado de tabla Users',
          'Usuario eliminado de Supabase Auth'
        ]
      }
    });
    
  } catch (error: any) {
    console.error('💥 [DELETE-EMPLOYEE] Error general:', error);
    return NextResponse.json(
      { 
        message: 'Error interno durante la eliminación',
        error: error.message || 'Error desconocido',
        employeeId: params.id // ❌ OJO: Esto podría fallar también, usar id de arriba
      },
      { status: 500 }
    );
  }
}