import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ✅ FUNCIÓN PARA TIMESTAMP MÉXICO (IGUAL QUE CORTES)
function toMexicoTimestamp(date: Date): string {
  const mexicoTime = new Date(date.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
  const year = mexicoTime.getFullYear();
  const month = String(mexicoTime.getMonth() + 1).padStart(2, '0');
  const day = String(mexicoTime.getDate()).padStart(2, '0');
  const hours = String(mexicoTime.getHours()).padStart(2, '0');
  const minutes = String(mexicoTime.getMinutes()).padStart(2, '0');
  const seconds = String(mexicoTime.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-06:00`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      expense_date,
      expense_type,
      description,
      amount,
      receipt_number,
      notes,
      created_at_mexico
    } = body;
    
    console.log('📊 Creando egreso con sincronización directa:', {
      expense_date,
      expense_type,
      description,
      amount,
      receipt_number,
      usuario: 'luishdz04',
      timestamp: '2025-06-14 23:32:06'
    });
    
    // ✅ VALIDACIONES CON TIPOS REALES DE TABLA
    if (!expense_date || !expense_type || !description || !amount) {
      return NextResponse.json(
        { error: 'Campos requeridos: fecha, tipo, descripción y monto', success: false },
        { status: 400 }
      );
    }
    
    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0', success: false },
        { status: 400 }
      );
    }
    
    // ✅ VALIDAR TIPO DE EGRESO SEGÚN CONSTRAINT
    const validTypes = [
      'nomina', 'suplementos', 'servicios', 'mantenimiento', 
      'limpieza', 'marketing', 'equipamiento', 'otros'
    ];
    
    if (!validTypes.includes(expense_type)) {
      return NextResponse.json(
        { error: `Tipo de egreso no válido. Tipos permitidos: ${validTypes.join(', ')}`, success: false },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    // ✅ OBTENER USUARIO (usando luishdz04 como fallback)
    let userId;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('⚠️ No se pudo obtener usuario autenticado, buscando luishdz04...');
        const { data: hardcodedUser, error: userError } = await supabase
          .from('Users')
          .select('id')
          .ilike('email', '%luis%')
          .limit(1)
          .single();
        
        if (userError || !hardcodedUser) {
          const { data: anyAdmin, error: adminError } = await supabase
            .from('Users')
            .select('id')
            .eq('rol', 'admin')
            .limit(1)
            .single();
          
          if (adminError || !anyAdmin) {
            return NextResponse.json(
              { error: 'No se pudo determinar el usuario para crear el egreso', success: false },
              { status: 401 }
            );
          }
          userId = anyAdmin.id;
        } else {
          userId = hardcodedUser.id;
        }
      } else {
        userId = user.id;
      }
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return NextResponse.json(
        { error: 'Error de autenticación', success: false },
        { status: 401 }
      );
    }
    
    const now = new Date();
    const mexicoTimestamp = created_at_mexico || toMexicoTimestamp(now);
    
    // ✅ CREAR TIMESTAMP PARA expense_time (timestamp sin timezone)
    const mexicoTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
    
    console.log('🇲🇽 Insertando egreso con estructura correcta de tabla...');
    
    // ✅ INSERTAR EGRESO CON ESTRUCTURA REAL DE TABLA
    const { data: newExpense, error: insertError } = await supabase
      .from('expenses')
      .insert([{
        expense_date,
        expense_time: mexicoTime.toISOString(), // timestamp without time zone
        expense_type,
        description: description.trim(),
        amount: parseFloat(amount),
        receipt_number: receipt_number?.trim() || null,
        notes: notes?.trim() || null,
        status: 'active',
        created_by: userId,
        created_at: mexicoTime.toISOString(),
        updated_at: mexicoTime.toISOString()
      }])
      .select()
      .single();
    
    if (insertError) {
      console.error('💥 Error insertando egreso:', insertError);
      
      if (insertError.code === '23503') {
        console.error('❌ Error de foreign key - Usuario no válido:', userId);
        return NextResponse.json(
          { error: 'Usuario no válido para crear egreso', success: false },
          { status: 400 }
        );
      }
      
      if (insertError.code === '23514') {
        console.error('❌ Error de constraint - Datos no válidos:', insertError.message);
        return NextResponse.json(
          { error: 'Datos no válidos: ' + insertError.message, success: false },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error insertando egreso: ' + insertError.message, success: false },
        { status: 500 }
      );
    }
    
    console.log('✅ Egreso creado exitosamente:', {
      egreso_id: newExpense.id,
      timestamp_guardado: mexicoTimestamp,
      hora_utc_actual: now.toISOString()
    });
    
    // 🔄 SINCRONIZACIÓN DIRECTA CON CORTE (SIN FETCH INTERNO)
    console.log('🔄 Iniciando sincronización DIRECTA con corte para fecha:', expense_date);
    
    let syncInfo = null;
    
    try {
      // 1️⃣ CALCULAR TOTAL DE EGRESOS ACTIVOS DEL DÍA (INCLUYENDO EL RECIÉN CREADO)
      console.log('📊 Calculando total de egresos para fecha:', expense_date);
      
      const { data: dayExpenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, description, expense_type')
        .eq('expense_date', expense_date)
        .eq('status', 'active');
      
      if (expensesError) {
        console.error('❌ Error consultando egresos para sincronización:', expensesError);
        throw expensesError;
      }
      
      const totalExpenses = dayExpenses?.reduce((sum: number, exp: any) => {
        return sum + parseFloat(exp.amount.toString());
      }, 0) || 0;
      
      const expenseCount = dayExpenses?.length || 0;
      
      console.log('📊 Egresos calculados para sincronización:', {
        total_count: expenseCount,
        total_amount: totalExpenses,
        expenses_detail: dayExpenses
      });
      
      // 2️⃣ BUSCAR CORTE EXISTENTE DEL MISMO DÍA
      console.log('🔍 Buscando corte existente para fecha:', expense_date);
      
      const { data: existingCut, error: cutError } = await supabase
        .from('cash_cuts')
        .select('id, cut_number, expenses_amount, grand_total, final_balance')
        .eq('cut_date', expense_date)
        .single();
      
      if (cutError && cutError.code !== 'PGRST116') {
        console.error('❌ Error buscando corte:', cutError);
        throw cutError;
      }
      
      if (existingCut) {
        console.log('📋 Corte encontrado para sincronización:', {
          cut_id: existingCut.id,
          cut_number: existingCut.cut_number,
          old_expenses: existingCut.expenses_amount,
          new_expenses: totalExpenses,
          grand_total: existingCut.grand_total
        });
        
        // 3️⃣ ACTUALIZAR CORTE CON SINCRONIZACIÓN DIRECTA
        const newFinalBalance = parseFloat(existingCut.grand_total.toString()) - totalExpenses;
        
        const { data: updatedCut, error: updateError } = await supabase
          .from('cash_cuts')
          .update({
            expenses_amount: totalExpenses,
            final_balance: newFinalBalance,
            updated_at: mexicoTimestamp,
            updated_by: userId
          })
          .eq('id', existingCut.id)
          .select()
          .single();
        
        if (updateError) {
          console.error('💥 Error actualizando corte en sincronización directa:', updateError);
          throw updateError;
        }
        
        console.log('✅ Sincronización DIRECTA completada exitosamente:', {
          cut_number: existingCut.cut_number,
          old_expenses: existingCut.expenses_amount,
          new_expenses: totalExpenses,
          old_final_balance: existingCut.final_balance,
          new_final_balance: newFinalBalance,
          expense_count: expenseCount,
          difference: totalExpenses - parseFloat(existingCut.expenses_amount.toString())
        });
        
        syncInfo = {
          synchronized: true,
          cut_number: existingCut.cut_number,
          old_expenses_amount: existingCut.expenses_amount,
          new_expenses_amount: totalExpenses,
          expense_count: expenseCount,
          old_final_balance: existingCut.final_balance,
          new_final_balance: newFinalBalance,
          difference: totalExpenses - parseFloat(existingCut.expenses_amount.toString())
        };
        
      } else {
        console.log('ℹ️ No hay corte para sincronizar en fecha:', expense_date);
        syncInfo = {
          synchronized: false,
          reason: 'No existe corte para esta fecha',
          total_expenses: totalExpenses,
          expense_count: expenseCount
        };
      }
      
    } catch (syncError: any) {
      console.error('⚠️ Error en sincronización directa (no crítico):', syncError);
      syncInfo = {
        synchronized: false,
        error: syncError.message,
        reason: 'Error en sincronización pero egreso creado exitosamente'
      };
    }
    
    return NextResponse.json({
      success: true,
      message: `Egreso creado exitosamente: ${formatPrice(parseFloat(amount))}`,
      expense_id: newExpense.id,
      expense: newExpense,
      sync_info: syncInfo, // ✅ INFORMACIÓN DETALLADA DE SINCRONIZACIÓN
      mexico_time: mexicoTimestamp,
      utc_time: now.toISOString()
    });
    
  } catch (error: any) {
    console.error('💥 Error en API create expense:', error);
    return NextResponse.json(
      { 
        error: 'Error al crear el egreso', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        success: false 
      },
      { status: 500 }
    );
  }
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  }).format(amount);
}
