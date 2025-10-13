/**
 * Script para sincronizar roles desde tabla Users a user_metadata
 * 
 * Ejecutar con: npx tsx scripts/sync-roles-to-metadata.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente con rol de servicio (necesario para actualizar auth.users)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncRolesToMetadata() {
  console.log('🔄 Iniciando sincronización de roles...\n');

  try {
    // 1. Obtener TODOS los usuarios de la tabla Users (con o sin rol)
    console.log('📋 Obteniendo usuarios de tabla Users...');
    const { data: users, error: usersError } = await supabase
      .from('Users')
      .select('id, email, firstName, lastName, rol, status');

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
      return;
    }

    console.log(`✅ Encontrados ${users?.length || 0} usuarios totales\n`);
    
    // Separar usuarios con y sin rol
    const usersWithRole = users?.filter(u => u.rol) || [];
    const usersWithoutRole = users?.filter(u => !u.rol) || [];
    
    console.log(`   📊 Con rol definido: ${usersWithRole.length}`);
    console.log(`   ⚠️  Sin rol (se asignará 'cliente'): ${usersWithoutRole.length}\n`);

    if (!users || users.length === 0) {
      console.log('⚠️  No hay usuarios para sincronizar');
      return;
    }

    // 2. Actualizar metadata de cada usuario
    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Asignar rol por defecto si no tiene
        const userRole = user.rol || 'cliente';
        const hasCustomRole = user.rol ? '✓' : '(default)';
        
        console.log(`🔧 Actualizando: ${user.email}`);
        console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
        console.log(`   Rol: ${userRole} ${hasCustomRole}`);
        console.log(`   Estado: ${user.status || 'N/A'}`);

        // Actualizar user_metadata en auth.users
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          {
            user_metadata: {
              role: userRole,
              firstName: user.firstName,
              lastName: user.lastName,
              status: user.status
            }
          }
        );

        if (updateError) {
          console.error(`   ❌ Error: ${updateError.message}\n`);
          errorCount++;
        } else {
          console.log('   ✅ Metadata actualizada correctamente\n');
          successCount++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error inesperado: ${error.message}\n`);
        errorCount++;
      }
    }

    // 3. Resumen
    console.log('\n📊 RESUMEN DE SINCRONIZACIÓN:');
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   📝 Total: ${users.length}`);

    // 4. Usuarios específicos solicitados
    console.log('\n🎯 VERIFICANDO USUARIOS ESPECÍFICOS:');
    const specificEmails = [
      'ing.luisdeluna@outlook.com',
      'administracion@muscleupgym.fitness',
      'luisdeluna04@hotmail.com'
    ];

    for (const email of specificEmails) {
      const user = users.find(u => u.email === email);
      if (user) {
        console.log(`\n   📧 ${email}`);
        console.log(`      Rol: ${user.rol}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Estado: ${successCount > 0 ? '✅ Sincronizado' : '⚠️  Revisar'}`);
      } else {
        console.log(`\n   ⚠️  ${email} - No encontrado en tabla Users`);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error general:', error.message);
    process.exit(1);
  }
}

// Ejecutar script
syncRolesToMetadata()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
