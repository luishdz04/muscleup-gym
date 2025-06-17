import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📨 ✅ ZK Access Agent envió datos:', JSON.stringify(body, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Estado del dispositivo recibido exitosamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error procesando estado del dispositivo:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error procesando datos',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        lastUpdate: new Date().toISOString(),
        deviceStatus: 'connected',
        message: 'Estado del dispositivo obtenido'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error obteniendo estado:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error obteniendo estado'
    }, { status: 500 });
  }
}