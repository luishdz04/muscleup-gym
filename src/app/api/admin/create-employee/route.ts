import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 Iniciando creación de usuario...');
    
    // Cambiar de JSON a FormData
    const formData = await req.formData();
    
    // Extraer datos del formulario
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phone = formData.get('phone') as string;
    const birthDate = formData.get('birthDate') as string;
    const gender = formData.get('gender') as string;
    const maritalStatus = formData.get('maritalStatus') as string;
    const rol = formData.get('rol') as string || 'empleado'; // Campo de rol agregado
    
    // Dirección
    const street = formData.get('street') as string;
    const number = formData.get('number') as string;
    const neighborhood = formData.get('neighborhood') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const postalCode = formData.get('postalCode') as string;
    
    // Datos laborales
    const position = formData.get('position') as string;
    const department = formData.get('department') as string;
    const salary = formData.get('salary') as string;
    
    // Contacto emergencia
    const emergencyContactName = formData.get('emergencyContactName') as string;
    const emergencyContactPhone = formData.get('emergencyContactPhone') as string;
    const emergencyContactRelationship = formData.get('emergencyContactRelationship') as string;
    
    const createdBy = formData.get('createdBy') as string;
    
    // Archivo de foto
    const profilePicture = formData.get('profilePicture') as File | null;

    console.log('📋 Datos recibidos:', {
      firstName,
      lastName,
      email,
      rol,
      position,
      department,
      hasPhoto: !!profilePicture
    });

    // Validaciones básicas
    if (!firstName || !lastName || !email || !password || !position) {
      return NextResponse.json({ 
        error: 'Faltan campos obligatorios: nombre, apellidos, email, contraseña y puesto son requeridos' 
      }, { status: 400 });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // 🔐 Validar permisos para asignar rol admin
    if (rol === 'admin' && createdBy) {
      const { data: creatorUser } = await supabaseAdmin
        .from('Users')
        .select('rol')
        .eq('id', createdBy)
        .single();
      
      if (creatorUser?.rol !== 'admin') {
        return NextResponse.json({ 
          error: 'No tienes permisos para crear administradores' 
        }, { status: 403 });
      }
    }

    // 1. Verificar si el email ya existe
    const { data: existingUser } = await supabaseAdmin
      .from('Users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 400 });
    }

    // 2. Crear usuario en Supabase Auth
    console.log('🔐 Creando usuario en Supabase Auth...');
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip confirmación para empleados/admins
      user_metadata: {
        firstName,
        lastName,
        rol: rol // Usar el rol recibido del formulario
      }
    });

    if (authError) {
      console.error('❌ Error en Auth:', authError);
      return NextResponse.json({ error: `Error al crear usuario: ${authError.message}` }, { status: 400 });
    }

    const userId = authUser.user.id;
    console.log('✅ Usuario creado en Auth:', userId);

    let profilePictureUrl = null;
    let uploadedFilePath = null;

    // 3. Subir foto si existe
    if (profilePicture && profilePicture.size > 0) {
      try {
        console.log('📸 Subiendo foto de perfil...');
        
        // Validar tamaño (máximo 5MB)
        if (profilePicture.size > 5 * 1024 * 1024) {
          throw new Error('La imagen debe ser menor a 5MB');
        }

        // Validar tipo
        if (!profilePicture.type.startsWith('image/')) {
          throw new Error('Solo se permiten archivos de imagen');
        }

        const fileExtension = profilePicture.name.split('.').pop() || 'jpg';
        const fileName = `profile.${fileExtension}`;
        const filePath = `${userId}/${fileName}`;
        uploadedFilePath = filePath;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('user-files')
          .upload(filePath, profilePicture, {
            cacheControl: '3600',
            upsert: true // Permite sobreescribir si existe
          });

        if (uploadError) {
          console.error('❌ Error subiendo foto:', uploadError);
          throw new Error(`Error al subir imagen: ${uploadError.message}`);
        }

        // Obtener URL pública
        const { data: urlData } = supabaseAdmin.storage
          .from('user-files')
          .getPublicUrl(filePath);
        
        profilePictureUrl = urlData.publicUrl;
        console.log('✅ Foto subida correctamente:', profilePictureUrl);

      } catch (uploadError) {
        console.error('❌ Error en upload de foto:', uploadError);
        // Rollback: eliminar usuario de Auth
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ 
          error: uploadError instanceof Error ? uploadError.message : 'Error al subir imagen' 
        }, { status: 400 });
      }
    }

    // 4. Insertar en tabla Users (SOLO DATOS BÁSICOS - SIN FOTO)
    console.log('👤 Insertando en tabla Users (sin foto)...');
    const { error: userError } = await supabaseAdmin
      .from('Users')
      .insert({
        id: userId,
        firstName,
        lastName,
        email,
        rol: rol, // Usar el rol recibido del formulario
        // SIN profilePictureUrl - la foto va en employees
        emailConfirmed: true,
        registrationCompleted: true,
        registrationCompletedAt: new Date().toISOString()
      });

    if (userError) {
      console.error('❌ Error insertando Usuario:', userError);
      // Rollback: eliminar usuario de Auth y archivo
      await supabaseAdmin.auth.admin.deleteUser(userId);
      if (uploadedFilePath) {
        await supabaseAdmin.storage
          .from('user-files')
          .remove([uploadedFilePath]);
      }
      return NextResponse.json({ 
        error: `Error al crear usuario en base de datos: ${userError.message}` 
      }, { status: 400 });
    }

    console.log('✅ Usuario insertado en tabla Users');

    // 5. Insertar en tabla employees (CON TODOS LOS DATOS + FOTO)
    console.log('👨‍💼 Insertando en tabla employees (con foto):', profilePictureUrl);
    const { error: employeeError } = await supabaseAdmin
      .from('employees')
      .insert({
        user_id: userId,
        birth_date: birthDate || null,
        gender: gender || null,
        marital_status: maritalStatus || null,
        phone: phone || null,
        street: street || null,
        number: number || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        postal_code: postalCode || null,
        country: 'México',
        position,
        department: department || null,
        salary: salary ? parseFloat(salary) : null,
        status: 'active',
        emergency_contact_name: emergencyContactName || null,
        emergency_contact_phone: emergencyContactPhone || null,
        emergency_contact_relationship: emergencyContactRelationship || null,
        profile_picture_url: profilePictureUrl, // LA FOTO VA AQUÍ EN EMPLOYEES
        created_by: createdBy || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (employeeError) {
      console.error('❌ Error insertando empleado:', employeeError);
      // Rollback completo
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin
        .from('Users')
        .delete()
        .eq('id', userId);
      if (uploadedFilePath) {
        await supabaseAdmin.storage
          .from('user-files')
          .remove([uploadedFilePath]);
      }
      return NextResponse.json({ 
        error: `Error al crear empleado: ${employeeError.message}` 
      }, { status: 400 });
    }

    console.log('✅ Usuario insertado correctamente en employees');

    // 6. Respuesta exitosa
    const response = { 
      success: true, 
      message: `${rol === 'admin' ? 'Administrador' : 'Empleado'} creado exitosamente`,
      data: {
        employeeId: userId,
        firstName,
        lastName,
        email,
        rol,
        position,
        department,
        profilePictureUrl,
        createdAt: new Date().toISOString()
      }
    };

    console.log(`🎉 ${rol === 'admin' ? 'Administrador' : 'Empleado'} creado exitosamente:`, response.data);
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Error general creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { 
        error: 'Error interno del servidor', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}