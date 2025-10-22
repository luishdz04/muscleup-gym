'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  Chip,
  Stack,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { colorTokens } from '@/theme';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { CheckCircle, Error, Warning, Info } from '@mui/icons-material';

interface RealtimeStatus {
  table: string;
  enabled: boolean;
  message: string;
}

export default function VerificarNotificacionesPage() {
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus[]>([]);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    checkRealtimeConfiguration();
  }, []);

  const checkRealtimeConfiguration = async () => {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();

    // Verificar tablas críticas para notificaciones (las que realmente existen)
    const tablesToCheck = [
      'sales',
      'sale_items',
      'sale_payment_details',
      'user_memberships',
      'membership_payment_details'
    ];

    const statuses: RealtimeStatus[] = [];

    // Verificar conexión con Supabase
    try {
      const { data: testData, error } = await supabase
        .from('sales')
        .select('id')
        .limit(1);

      if (error) {
        setConnectionStatus('error');
        console.error('❌ Error conectando con Supabase:', error);
      } else {
        setConnectionStatus('connected');
        console.log('✅ Conexión con Supabase exitosa');
      }
    } catch (err) {
      setConnectionStatus('error');
      console.error('❌ Error de conexión:', err);
    }

    // Probar suscripción en tiempo real para cada tabla
    for (const table of tablesToCheck) {
      console.log(`🔍 Verificando Realtime para tabla: ${table}`);

      const channel = supabase
        .channel(`test-${table}-channel`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table
          },
          (payload) => {
            console.log(`✅ Realtime funciona para ${table}:`, payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            statuses.push({
              table,
              enabled: true,
              message: 'Realtime habilitado y funcionando'
            });
          } else if (status === 'CHANNEL_ERROR') {
            statuses.push({
              table,
              enabled: false,
              message: 'Error en el canal - Verificar configuración'
            });
          } else if (status === 'TIMED_OUT') {
            statuses.push({
              table,
              enabled: false,
              message: 'Timeout - Posiblemente Realtime no está habilitado'
            });
          }
        });

      // Dar tiempo para que se establezca la conexión
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Limpiar canal de prueba
      supabase.removeChannel(channel);
    }

    setRealtimeStatus(statuses);
    setLoading(false);
  };

  const testRealtimeInsert = async () => {
    setTestResult('Probando inserción en tabla sales...');
    const supabase = createBrowserSupabaseClient();
    let notificationReceived = false;

    // Obtener el usuario actual para usarlo como cashier
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setTestResult('❌ No hay usuario autenticado');
      return;
    }

    // Crear canal de escucha temporal
    const channel = supabase
      .channel('test-sales-insert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          notificationReceived = true;
          setTestResult(`✅ ¡Notificación recibida! Nueva venta con ID: ${payload.new.id} y total: $${payload.new.total_amount}`);
          console.log('📨 Payload recibido:', payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado del canal de prueba:', status);
      });

    // Esperar a que se suscriba
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Crear número de venta único
    const saleNumber = `TEST-${Date.now()}`;

    // Insertar una venta de prueba
    const { data, error } = await supabase
      .from('sales')
      .insert({
        sale_number: saleNumber,
        cashier_id: user.id,
        sale_type: 'sale',
        subtotal: 100,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 100,
        paid_amount: 100,
        pending_amount: 0,
        status: 'completed',
        payment_status: 'paid',
        payment_received: 100,
        change_amount: 0,
        notes: 'Venta de prueba para Realtime'
      })
      .select()
      .single();

    if (error) {
      setTestResult(`❌ Error insertando venta: ${error.message}`);
      console.error('Error completo:', error);
    } else {
      console.log('✅ Venta de prueba insertada:', data);

      // Esperar para ver si llega la notificación
      setTimeout(() => {
        if (!notificationReceived) {
          setTestResult('⚠️ Venta insertada pero no se recibió notificación en tiempo real. Las tablas están habilitadas pero puede haber un problema de conexión.');
        }
      }, 3000);

      // Limpiar la venta de prueba después de 5 segundos
      setTimeout(async () => {
        await supabase
          .from('sales')
          .delete()
          .eq('id', data.id);
        console.log('🗑️ Venta de prueba eliminada');
      }, 5000);
    }

    // Limpiar canal después de 6 segundos
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 6000);
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant="h4" gutterBottom sx={{
        color: colorTokens.textPrimary,
        fontWeight: 'bold',
        mb: 4
      }}>
        🔍 Verificación del Sistema de Notificaciones
      </Typography>

      <Grid container spacing={3}>
        {/* Estado de Conexión */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{
            backgroundColor: colorTokens.neutral200,
            border: `1px solid ${colorTokens.border}`
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{
                color: colorTokens.textPrimary,
                mb: 3
              }}>
                Estado de Conexión
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ color: colorTokens.textSecondary }}>
                    Supabase:
                  </Typography>
                  {connectionStatus === 'connecting' && <CircularProgress size={20} />}
                  {connectionStatus === 'connected' && (
                    <Chip
                      icon={<CheckCircle />}
                      label="Conectado"
                      color="success"
                      size="small"
                    />
                  )}
                  {connectionStatus === 'error' && (
                    <Chip
                      icon={<Error />}
                      label="Error de conexión"
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Test de Inserción */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{
            backgroundColor: colorTokens.neutral200,
            border: `1px solid ${colorTokens.border}`
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{
                color: colorTokens.textPrimary,
                mb: 3
              }}>
                Prueba de Realtime
              </Typography>

              <Button
                variant="contained"
                onClick={testRealtimeInsert}
                fullWidth
                sx={{
                  backgroundColor: colorTokens.brand,
                  color: colorTokens.black,
                  '&:hover': {
                    backgroundColor: colorTokens.brandHover
                  },
                  mb: 2
                }}
              >
                🚀 Probar Inserción en Tiempo Real
              </Button>

              {testResult && (
                <Alert
                  severity={testResult.includes('✅') ? 'success' : testResult.includes('❌') ? 'error' : 'warning'}
                  sx={{ mt: 2 }}
                >
                  {testResult}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estado de Tablas */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{
            backgroundColor: colorTokens.neutral200,
            border: `1px solid ${colorTokens.border}`
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{
                color: colorTokens.textPrimary,
                mb: 3
              }}>
                Estado de Realtime por Tabla
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Stack spacing={2}>
                  {realtimeStatus.map((status) => (
                    <Box
                      key={status.table}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        backgroundColor: colorTokens.neutral300,
                        borderRadius: 1
                      }}
                    >
                      {status.enabled ? (
                        <CheckCircle sx={{ color: colorTokens.success }} />
                      ) : (
                        <Warning sx={{ color: colorTokens.warning }} />
                      )}
                      <Typography sx={{
                        color: colorTokens.textPrimary,
                        fontWeight: 'medium',
                        flex: 1
                      }}>
                        {status.table}
                      </Typography>
                      <Typography variant="body2" sx={{
                        color: status.enabled ? colorTokens.success : colorTokens.warning
                      }}>
                        {status.message}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Instrucciones */}
        <Grid size={{ xs: 12 }}>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              📚 Cómo habilitar Realtime en Supabase:
            </Typography>
            <ol style={{ marginTop: 8, marginBottom: 0 }}>
              <li>Ve a tu Dashboard de Supabase</li>
              <li>En el menú lateral, selecciona <strong>"Database"</strong></li>
              <li>Luego selecciona <strong>"Replication"</strong></li>
              <li>En la sección <strong>"Source"</strong>, haz clic en <strong>"0 tables"</strong> (o el número que aparezca)</li>
              <li>Busca y activa el switch para estas tablas (YA LAS TIENES ACTIVAS ✅):
                <ul>
                  <li><code>sales</code> ✅ - Para notificaciones de ventas</li>
                  <li><code>sale_items</code> ✅ - Detalles de ventas</li>
                  <li><code>sale_payment_details</code> ✅ - Pagos de ventas</li>
                  <li><code>user_memberships</code> ✅ - Para nuevas membresías</li>
                  <li><code>membership_payment_details</code> ✅ - Pagos de membresías</li>
                </ul>
              </li>
              <li>Guarda los cambios</li>
              <li>Espera unos segundos y recarga esta página para verificar</li>
            </ol>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}