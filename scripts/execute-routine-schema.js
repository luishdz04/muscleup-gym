const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://tyuuyqypgwvdtpfvumxx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dXV5cXlwZ3d2ZHRwZnZ1bXh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODkwMDE1MywiZXhwIjoyMDY0NDc2MTUzfQ.sp2fdKF-onXcVqIlJjpeHkTO5kn5rskvVWysQvHIjBg';

async function executeSQL() {
  console.log('🚀 [SCHEMA] Ejecutando schema de rutinas...\n');

  // Read SQL file
  const sqlPath = path.join(__dirname, '../prisma/migrations/create_workout_routines.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  console.log(`📝 [SCHEMA] Encontradas ${statements.length} sentencias SQL\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.trim().startsWith('--')) continue;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ query: statement })
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`❌ [${i + 1}/${statements.length}] Error:`, error.substring(0, 100));
        errorCount++;
      } else {
        // Extract table name from CREATE TABLE statement
        const match = statement.match(/CREATE TABLE.*?IF NOT EXISTS\s+(\w+)/i);
        const tableName = match ? match[1] : `Statement ${i + 1}`;
        console.log(`✅ [${i + 1}/${statements.length}] Ejecutado: ${tableName}`);
        successCount++;
      }
    } catch (error) {
      console.log(`❌ [${i + 1}/${statements.length}] Error:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 RESUMEN:`);
  console.log(`   ✅ Exitosas: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  if (errorCount === 0) {
    console.log('🎉 Schema ejecutado exitosamente!\n');
    console.log('📋 Tablas creadas:');
    console.log('   1. workout_routines');
    console.log('   2. routine_exercises');
    console.log('   3. user_routines');
    console.log('   4. routine_progress');
    console.log('\n✨ El sistema de rutinas está listo para usar!');
  } else {
    console.log('⚠️  Hubo algunos errores. Revisa los mensajes arriba.');
  }
}

// Alternative: Direct database execution using pg
async function executeWithPg() {
  console.log('🔄 [SCHEMA] Método alternativo: Ejecución directa con pg...\n');

  const { Client } = require('pg');

  // Extract connection string from .env.local
  const envPath = path.join(__dirname, '../.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="(.+?)"/);

  if (!dbUrlMatch) {
    console.log('❌ No se encontró DATABASE_URL en .env.local');
    return;
  }

  const client = new Client({ connectionString: dbUrlMatch[1] });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL\n');

    // Read and execute SQL
    const sqlPath = path.join(__dirname, '../prisma/migrations/create_workout_routines.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query(sql);

    console.log('✅ Schema ejecutado exitosamente!\n');
    console.log('📋 Tablas creadas:');
    console.log('   1. workout_routines');
    console.log('   2. routine_exercises');
    console.log('   3. user_routines');
    console.log('   4. routine_progress');
    console.log('\n✨ El sistema de rutinas está listo para usar!');

  } catch (error) {
    console.log('❌ Error ejecutando schema:', error.message);
    console.log('\n💡 Esto puede ocurrir si las tablas ya existen o hay problemas de permisos.');
  } finally {
    await client.end();
  }
}

// Check if pg is available
try {
  require('pg');
  executeWithPg();
} catch (error) {
  console.log('⚠️  Paquete pg no instalado, usando método alternativo...\n');
  executeSQL();
}
