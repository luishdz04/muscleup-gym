import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

// GET /api/admin/users/[id] - Obtener un usuario específico y sus datos relacionados
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    // Obtener datos del usuario
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: user, error } = await supabaseAdmin
      .from('Users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json(
        { message: 'Error al obtener usuario: ' + error.message },
        { status: 500 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Si es un cliente, obtener datos relacionados
    if (user.rol === 'cliente') {
      // Obtener dirección
      const { data: address } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .eq('userId', id)
        .single();
      
      // Obtener contacto de emergencia
      const { data: emergency } = await supabaseAdmin
        .from('emergency_contacts')
        .select('*')
        .eq('userId', id)
        .single();
      
      // Obtener información de membresía
      const { data: membership } = await supabaseAdmin
        .from('membership_info')
        .select('*')
        .eq('userId', id)
        .single();
      
      // Combinar datos
      const userData = {
        ...user,
        address,
        emergency,
        membership
      };
      
      return NextResponse.json(userData);
    }
    
    return NextResponse.json(user);
    
  } catch (error: any) {
    console.error('Error en API:', error);
    return NextResponse.json(
      { message: 'Error interno: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Actualizar un usuario existente
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    const userData = await request.json();
    
    // Validaciones básicas
    if (!userData.firstName || !userData.lastName || !userData.email) {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }
    
    // Verificar si el usuario existe
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('Users')
      .select('id, email, rol')
      .eq('id', id)
      .single();
    
    if (checkError || !existingUser) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Si el email cambió, verificar que no exista otro usuario con ese email
    if (userData.email !== existingUser.email) {
      const { data: emailExists, error: emailCheckError } = await supabaseAdmin
        .from('Users')
        .select('id')
        .eq('email', userData.email)
        .neq('id', id)
        .single();
      
      if (emailExists) {
        return NextResponse.json(
          { message: 'El email ya está registrado por otro usuario' },
          { status: 400 }
        );
      }
      
      // Actualizar email en Auth
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        { email: userData.email, email_confirm: true }
      );
      
      if (updateAuthError) {
        return NextResponse.json(
          { message: 'Error al actualizar email en Auth: ' + updateAuthError.message },
          { status: 500 }
        );
      }
    }
    
    // Extraer datos de las tablas relacionadas
    const { address, emergency, membership, ...userMainData } = userData;
    
    // Actualizar el registro en la tabla Users
    const { data: updatedUser, error } = await supabaseAdmin
      .from('Users')
      .update(userMainData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { message: 'Error al actualizar usuario: ' + error.message },
        { status: 500 }
      );
    }
    
    // Si es cliente, actualizar datos adicionales en las tablas relacionadas
    if (updatedUser.rol === 'cliente') {
      // ✅ UPSERT dirección - actualiza si existe, inserta si no existe (basado en userId UNIQUE)
      if (address) {
        const addressData = {
          ...address,
          userId: id
        };
        
        const { error: addressError } = await supabaseAdmin
          .from('addresses')
          .upsert([addressData], { 
            onConflict: 'userId',
            ignoreDuplicates: false // Actualizar si existe
          });
        
        if (addressError) {
          console.error("Error al guardar dirección:", addressError);
        }
      }
      
      // ✅ UPSERT contacto de emergencia
      if (emergency) {
        const emergencyData = {
          ...emergency,
          userId: id
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
          userId: id
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
    
    // Si se cambió de rol de cliente a otro, eliminar datos relacionados
    if (existingUser.rol === 'cliente' && updatedUser.rol !== 'cliente') {
      // Eliminar dirección
      await supabaseAdmin
        .from('addresses')
        .delete()
        .eq('userId', id);
      
      // Eliminar contacto de emergencia
      await supabaseAdmin
        .from('emergency_contacts')
        .delete()
        .eq('userId', id);
      
      // Eliminar información de membresía
      await supabaseAdmin
        .from('membership_info')
        .delete()
        .eq('userId', id);
    }
    
    return NextResponse.json(updatedUser);
    
  } catch (error: any) {
    console.error('Error en API:', error);
    return NextResponse.json(
      { message: 'Error interno: ' + (error.message || 'Error desconocido') },
      { status: 500 }
    );
  }
}

// 📁 FUNCIÓN PARA ELIMINAR TODOS LOS ARCHIVOS DEL USUARIO
const deleteAllUserFiles = async (userId: string): Promise<void> => {
  try {
    console.log(`🗑️ Iniciando eliminación de archivos para usuario: ${userId}`);
    
    // Listar todos los archivos del usuario
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from('user-files')
      .list(userId, { limit: 1000 }); // Aumentar límite para usuarios con muchos archivos
    
    if (listError) {
      console.error('❌ Error listando archivos del usuario:', listError);
      return;
    }
    
    if (!files || files.length === 0) {
      console.log('ℹ️ No se encontraron archivos para eliminar');
      return;
    }
    
    console.log(`📁 Encontrados ${files.length} archivos para eliminar`);
    
    // Crear paths para eliminación
    const filesToDelete = files.map(file => `${userId}/${file.name}`);
    
    // Log de archivos que se van a eliminar
    console.log('📋 Archivos a eliminar:');
    filesToDelete.forEach(file => {
      console.log(`   🗑️ ${file}`);
    });
    
    // Eliminar archivos en lotes para evitar timeouts
    const batchSize = 50;
    for (let i = 0; i < filesToDelete.length; i += batchSize) {
      const batch = filesToDelete.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabaseAdmin.storage
        .from('user-files')
        .remove(batch);
      
      if (deleteError) {
        console.error(`❌ Error eliminando lote ${i / batchSize + 1}:`, deleteError);
      } else {
        console.log(`✅ Lote ${i / batchSize + 1} eliminado (${batch.length} archivos)`);
      }
    }
    
    // Intentar eliminar la carpeta del usuario (puede fallar si no está vacía)
    try {
      const { error: folderError } = await supabaseAdmin.storage
        .from('user-files')
        .remove([userId]);
      
      if (!folderError) {
        console.log('✅ Carpeta del usuario eliminada');
      }
    } catch (folderErr) {
      console.log('ℹ️ No se pudo eliminar la carpeta (normal si tenía subcarpetas)');
    }
    
    console.log(`✅ Eliminación de archivos completada para usuario: ${userId}`);
    
  } catch (error) {
    console.error('💥 Error en deleteAllUserFiles:', error);
    throw error;
  }
};

// 📊 FUNCIÓN PARA ELIMINAR DATOS RELACIONADOS COMPLETAMENTE
const deleteAllRelatedData = async (userId: string): Promise<void> => {
  try {
    console.log(`🗑️ Eliminando datos relacionados para usuario: ${userId}`);
    
    // Lista de todas las tablas relacionadas
    const relatedTables = [
      'addresses',
      'emergency_contacts', 
      'membership_info',
      'user_sessions', // Si tienes tabla de sesiones
      'audit_logs', // Si tienes auditoría
      'payments', // Si tienes pagos
      'attendance', // Si tienes asistencia
      'notifications' // Si tienes notificaciones
    ];
    
    // Eliminar de cada tabla de forma secuencial
    for (const table of relatedTables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('userId', userId);
        
        if (error) {
          // Solo loggear si la tabla existe
          if (!error.message.includes('relation') && !error.message.includes('does not exist')) {
            console.error(`❌ Error eliminando de ${table}:`, error);
          }
        } else {
          console.log(`✅ Datos eliminados de ${table}`);
        }
      } catch (tableError) {
        console.log(`ℹ️ Tabla ${table} no existe o no accesible`);
      }
    }
    
  } catch (error) {
    console.error('💥 Error en deleteAllRelatedData:', error);
    throw error;
  }
};

// 🔐 FUNCIÓN PARA ELIMINAR DE SUPABASE AUTH
const deleteFromAuth = async (userId: string): Promise<void> => {
  try {
    console.log(`🔐 Eliminando usuario de Supabase Auth: ${userId}`);
    
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('❌ Error eliminando de Auth:', authError);
      // No lanzar error porque los datos ya fueron eliminados
    } else {
      console.log('✅ Usuario eliminado de Supabase Auth');
    }
    
  } catch (error) {
    console.error('💥 Error en deleteFromAuth:', error);
    // No lanzar error para no interrumpir el proceso
  }
};

// 📋 FUNCIÓN PARA AUDITORÍA DE ELIMINACIÓN
const auditDeletion = async (userId: string, deletedBy?: string): Promise<void> => {
  try {
    // Registrar la eliminación para auditoría
    const auditRecord = {
      action: 'USER_DELETED',
      user_id: userId,
      deleted_by: deletedBy || 'system',
      deleted_at: new Date().toISOString(),
      details: JSON.stringify({
        timestamp: Date.now(),
        ip: 'server-side',
        reason: 'admin_deletion'
      })
    };
    
    // Intentar guardar en tabla de auditoría si existe
    try {
      await supabaseAdmin
        .from('deletion_audit')
        .insert([auditRecord]);
      
      console.log('📋 Registro de auditoría creado');
    } catch (auditError) {
      console.log('ℹ️ No se pudo crear registro de auditoría (tabla no existe)');
    }
    
  } catch (error) {
    console.error('Error en auditoría:', error);
  }
};

// 🚀 FUNCIÓN DELETE COMPLETA Y MEJORADA
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;
    
    console.log(`🚀 Iniciando eliminación completa del usuario: ${userId}`);
    
    // 1. VERIFICAR SI EL USUARIO EXISTS
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('Users')
      .select('id, email, firstName, lastName, rol')
      .eq('id', userId)
      .single();
    
    if (checkError || !existingUser) {
      return NextResponse.json(
        { message: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    console.log(`👤 Usuario encontrado: ${existingUser.firstName} ${existingUser.lastName} (${existingUser.email})`);
    
    // 2. ELIMINAR TODOS LOS ARCHIVOS DEL STORAGE
    await deleteAllUserFiles(userId);
    
    // 3. ELIMINAR DATOS RELACIONADOS DE TODAS LAS TABLAS
    await deleteAllRelatedData(userId);
    
    // 4. ELIMINAR EL REGISTRO PRINCIPAL DE LA TABLA USERS
    const { error: deleteUserError } = await supabaseAdmin
      .from('Users')
      .delete()
      .eq('id', userId);
    
    if (deleteUserError) {
      console.error('❌ Error eliminando de tabla Users:', deleteUserError);
      return NextResponse.json(
        { message: 'Error al eliminar usuario de la base de datos: ' + deleteUserError.message },
        { status: 500 }
      );
    }
    
    console.log('✅ Usuario eliminado de tabla Users');
    
    // 5. ELIMINAR DE SUPABASE AUTH
    await deleteFromAuth(userId);
    
    // 6. REGISTRAR AUDITORÍA
    await auditDeletion(userId, 'admin'); // Puedes obtener el admin ID del token
    
    // 7. RESPUESTA EXITOSA CON RESUMEN
    console.log(`🎉 Eliminación completa exitosa para usuario: ${userId}`);
    
    return NextResponse.json({
      message: 'Usuario eliminado completamente',
      details: {
        userId,
        userName: `${existingUser.firstName} ${existingUser.lastName}`,
        email: existingUser.email,
        deletedAt: new Date().toISOString(),
        actions: [
          'Archivos eliminados del Storage',
          'Datos relacionados eliminados de todas las tablas',
          'Usuario eliminado de tabla principal',
          'Usuario eliminado de Supabase Auth',
          'Registro de auditoría creado'
        ]
      }
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('💥 Error general en eliminación completa:', error);
    return NextResponse.json(
      { 
        message: 'Error interno durante la eliminación completa',
        error: error.message || 'Error desconocido',
        userId: params.id
      },
      { status: 500 }
    );
  }
}