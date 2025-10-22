'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ShoppingCart,
  FitnessCenter,
  Payment,
  Login,
  Assessment,
  NotificationsActive,
  CheckCircle,
  Error
} from '@mui/icons-material';
import { useToast } from '@/hooks/useToast';
import { colorTokens } from '@/theme';

export default function TestNotificationsPage() {
  const toast = useToast();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString('es-MX')}: ${message}`]);
  };

  // Función para simular venta
  const testSaleNotification = () => {
    toast.success(
      '🛒 Nueva venta: $450.00 MXN',
      {
        description: 'Cliente: Juan Pérez García',
        duration: 6000,
        action: {
          label: 'Ver detalles',
          onClick: () => {
            addTestResult('Clicked on sale details');
          }
        }
      }
    );
    addTestResult('Notification sent: New sale');
  };

  // Función para simular membresía
  const testMembershipNotification = () => {
    toast.info(
      '💪 Nueva membresía registrada',
      {
        description: 'Plan: Premium - 3 meses',
        duration: 5000,
        action: {
          label: 'Ver',
          onClick: () => {
            addTestResult('Clicked on membership');
          }
        }
      }
    );
    addTestResult('Notification sent: New membership');
  };

  // Función para simular acceso permitido
  const testAccessGranted = () => {
    toast.success(
      '✅ Acceso permitido',
      {
        description: 'Usuario: María López',
        duration: 3000,
      }
    );
    addTestResult('Notification sent: Access granted');
  };

  // Función para simular acceso denegado
  const testAccessDenied = () => {
    toast.error(
      '❌ Acceso denegado',
      {
        description: 'Membresía vencida',
        duration: 3000,
      }
    );
    addTestResult('Notification sent: Access denied');
  };

  // Función para simular pago
  const testPaymentNotification = () => {
    toast.success(
      '💰 Pago recibido: $1,200.00 MXN',
      {
        description: 'Método: Tarjeta de crédito',
        duration: 4000,
      }
    );
    addTestResult('Notification sent: Payment received');
  };

  // Función para simular corte
  const testCashCutNotification = () => {
    toast.info(
      '📊 Nuevo corte de caja generado',
      {
        description: 'Total: $15,450.00 MXN',
        duration: 6000,
        action: {
          label: 'Ver detalles',
          onClick: () => {
            addTestResult('Clicked on cash cut details');
          }
        }
      }
    );
    addTestResult('Notification sent: Cash cut');
  };

  // Función para probar múltiples notificaciones
  const testMultipleNotifications = () => {
    setTimeout(() => testSaleNotification(), 0);
    setTimeout(() => testMembershipNotification(), 500);
    setTimeout(() => testAccessGranted(), 1000);
    setTimeout(() => testPaymentNotification(), 1500);
    setTimeout(() => testCashCutNotification(), 2000);
    addTestResult('Sent 5 notifications with delays');
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant="h4" gutterBottom sx={{
        color: colorTokens.textPrimary,
        fontWeight: 'bold',
        mb: 4
      }}>
        🧪 Prueba de Notificaciones
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Ubicación:</strong> Las notificaciones aparecen en la <strong>esquina superior derecha</strong> de la pantalla.
        </Typography>
        <Typography variant="body2">
          <strong>Duración:</strong> Entre 3-6 segundos según el tipo.
        </Typography>
        <Typography variant="body2">
          <strong>Interactividad:</strong> Algunas tienen botones de acción. Puedes cerrarlas con la X o esperar a que desaparezcan.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Panel de botones de prueba */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{
            backgroundColor: colorTokens.neutral200,
            border: `1px solid ${colorTokens.border}`
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{
                color: colorTokens.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 3
              }}>
                <NotificationsActive /> Simular Notificaciones
              </Typography>

              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<ShoppingCart />}
                  onClick={testSaleNotification}
                  sx={{
                    backgroundColor: colorTokens.success,
                    '&:hover': { backgroundColor: colorTokens.successHover }
                  }}
                  fullWidth
                >
                  🛒 Nueva Venta ($450.00)
                </Button>

                <Button
                  variant="contained"
                  startIcon={<FitnessCenter />}
                  onClick={testMembershipNotification}
                  color="info"
                  fullWidth
                >
                  💪 Nueva Membresía
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle />}
                    onClick={testAccessGranted}
                    color="success"
                    fullWidth
                  >
                    ✅ Acceso Permitido
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<Error />}
                    onClick={testAccessDenied}
                    color="error"
                    fullWidth
                  >
                    ❌ Acceso Denegado
                  </Button>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<Payment />}
                  onClick={testPaymentNotification}
                  sx={{
                    backgroundColor: colorTokens.warning,
                    color: colorTokens.black,
                    '&:hover': { backgroundColor: colorTokens.brandHover }
                  }}
                  fullWidth
                >
                  💰 Pago Recibido
                </Button>

                <Button
                  variant="contained"
                  startIcon={<Assessment />}
                  onClick={testCashCutNotification}
                  sx={{
                    backgroundColor: colorTokens.info,
                    '&:hover': { backgroundColor: colorTokens.infoHover }
                  }}
                  fullWidth
                >
                  📊 Corte de Caja
                </Button>

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="outlined"
                  onClick={testMultipleNotifications}
                  color="primary"
                  fullWidth
                  sx={{ borderWidth: 2 }}
                >
                  🚀 Probar Múltiples (5 notificaciones)
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => setTestResults([])}
                  color="secondary"
                  fullWidth
                >
                  🗑️ Limpiar Historial
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Panel de historial */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{
            backgroundColor: colorTokens.neutral200,
            border: `1px solid ${colorTokens.border}`,
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{
                color: colorTokens.textPrimary,
                mb: 2
              }}>
                📋 Historial de Pruebas
              </Typography>

              {testResults.length === 0 ? (
                <Typography variant="body2" sx={{
                  color: colorTokens.textSecondary,
                  textAlign: 'center',
                  py: 4
                }}>
                  No hay pruebas realizadas aún
                </Typography>
              ) : (
                <Stack spacing={1} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {testResults.map((result, index) => (
                    <Chip
                      key={index}
                      label={result}
                      size="small"
                      sx={{
                        backgroundColor: colorTokens.neutral300,
                        color: colorTokens.textPrimary,
                        justifyContent: 'flex-start',
                        height: 'auto',
                        py: 0.5,
                        '& .MuiChip-label': {
                          whiteSpace: 'normal'
                        }
                      }}
                    />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Información adicional */}
        <Grid size={{ xs: 12 }}>
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              ✨ Características del Sistema de Notificaciones:
            </Typography>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              <li>🔄 <strong>Tiempo Real:</strong> Las notificaciones aparecen instantáneamente cuando ocurre un evento en la base de datos</li>
              <li>🎨 <strong>Diseño Premium:</strong> Fondo oscuro con degradado y borde amarillo de la marca</li>
              <li>💫 <strong>Animaciones Suaves:</strong> Entrada y salida con efectos visuales</li>
              <li>🔊 <strong>Sonido Opcional:</strong> Las ventas pueden reproducir un sonido de éxito (si agregas /public/sounds/success.mp3)</li>
              <li>👆 <strong>Interactivas:</strong> Botones de acción para navegar directamente a los detalles</li>
              <li>📚 <strong>Apilables:</strong> Hasta 5 notificaciones visibles simultáneamente</li>
              <li>❌ <strong>Cerrables:</strong> Botón X para cerrar manualmente o esperar el auto-cierre</li>
            </ul>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}