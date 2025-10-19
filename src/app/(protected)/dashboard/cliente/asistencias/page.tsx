"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  Block as BlockIcon,
  LocationOn as LocationIcon,
  Fingerprint as FingerprintIcon
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { colorTokens } from '@/theme';
import { alpha } from '@mui/material/styles';
import { formatTimestampForDisplay, formatTimestampDateOnly } from '@/utils/dateUtils';

interface Device {
  id: string;
  name: string;
  location_description: string | null;
}

interface AccessLog {
  id: string;
  access_type: string;
  access_method: string;
  success: boolean;
  denial_reason: string | null;
  membership_status: string | null;
  device_timestamp: string | null;
  created_at: string;
  device: Device | null;
}

interface AccessLogsData {
  accessLogs: AccessLog[];
  stats: {
    successfulAccessesThisMonth: number;
    successfulAccessesLastMonth: number;
    totalAccesses: number;
    successfulAccesses: number;
    deniedAccesses: number;
    lastAccessDate: string | null;
  };
}

export default function AsistenciasPage() {
  const [data, setData] = useState<AccessLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccessLogs();
  }, []);

  const fetchAccessLogs = async () => {
    try {
      setLoading(true);
      console.log('🔍 [ASISTENCIAS] Fetching access logs...');
      const response = await fetch('/api/users/access-logs');

      console.log('📡 [ASISTENCIAS] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [ASISTENCIAS] Error response:', errorData);
        throw new Error(errorData.error || 'Error al cargar historial de asistencias');
      }

      const result = await response.json();
      console.log('✅ [ASISTENCIAS] Data received:', result);
      setData(result);
    } catch (err) {
      console.error('❌ [ASISTENCIAS] Error fetching access logs:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const translateAccessType = (type: string) => {
    const translations: Record<string, string> = {
      'entry': 'Entrada',
      'exit': 'Salida',
      'denied': 'Denegado'
    };
    return translations[type.toLowerCase()] || type;
  };

  const translateAccessMethod = (method: string) => {
    const translations: Record<string, string> = {
      'fingerprint': 'Huella Digital',
      'card': 'Tarjeta',
      'manual': 'Manual',
      'qr': 'Código QR'
    };
    return translations[method.toLowerCase()] || method;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No se encontraron datos de asistencias</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: { xs: 10, lg: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{
          fontWeight: 800,
          color: colorTokens.textPrimary,
          mb: 1,
          fontSize: { xs: '1.75rem', sm: '2.5rem' }
        }}>
          Historial de <Box component="span" sx={{ color: colorTokens.brand }}>Asistencias</Box>
        </Typography>
        <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
          Revisa tu historial de accesos al gimnasio
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        {/* Asistencias este mes */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px ${alpha(colorTokens.black, 0.4)}`
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Asistencias este mes
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {data.stats.successfulAccessesThisMonth}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.brand, 0.1),
                border: `1px solid ${alpha(colorTokens.brand, 0.2)}`
              }}>
                <CalendarIcon sx={{ fontSize: 32, color: colorTokens.brand }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Total de accesos */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px ${alpha(colorTokens.black, 0.4)}`
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Total de accesos
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {data.stats.totalAccesses}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.info, 0.1),
                border: `1px solid ${alpha(colorTokens.info, 0.2)}`
              }}>
                <TrendingUpIcon sx={{ fontSize: 32, color: colorTokens.info }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Accesos exitosos */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px ${alpha(colorTokens.black, 0.4)}`
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Accesos exitosos
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {data.stats.successfulAccesses}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.success, 0.1),
                border: `1px solid ${alpha(colorTokens.success, 0.2)}`
              }}>
                <CheckCircleIcon sx={{ fontSize: 32, color: colorTokens.success }} />
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Accesos denegados */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{
            p: 3,
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 8px 24px ${alpha(colorTokens.black, 0.4)}`
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mb: 1 }}>
                  Accesos denegados
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: colorTokens.textPrimary }}>
                  {data.stats.deniedAccesses}
                </Typography>
              </Box>
              <Box sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(colorTokens.danger, 0.1),
                border: `1px solid ${alpha(colorTokens.danger, 0.2)}`
              }}>
                <BlockIcon sx={{ fontSize: 32, color: colorTokens.danger }} />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Comparison Chart */}
      <Paper sx={{
        p: 3,
        mb: 4,
        background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
        borderRadius: 3
      }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            color: colorTokens.brand,
            mb: 1
          }}>
            Comparación Mensual
          </Typography>
          <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
            Asistencias del mes actual vs mes anterior
          </Typography>
        </Box>
        <Box sx={{ width: '100%', height: 300 }}>
          <BarChart
            series={[
              {
                data: [data.stats.successfulAccessesLastMonth, data.stats.successfulAccessesThisMonth],
                label: 'Asistencias',
                color: colorTokens.brand
              }
            ]}
            xAxis={[{
              data: ['Mes Anterior', 'Mes Actual'],
              scaleType: 'band'
            }]}
            margin={{ top: 30, right: 80, bottom: 40, left: 60 }}
            slotProps={{
              legend: {
                direction: 'row',
                position: { vertical: 'top', horizontal: 'middle' },
                padding: 0
              }
            }}
            sx={{
              '& .MuiChartsAxis-line': {
                stroke: alpha(colorTokens.textSecondary, 0.2)
              },
              '& .MuiChartsAxis-tick': {
                stroke: alpha(colorTokens.textSecondary, 0.2)
              },
              '& .MuiChartsAxis-tickLabel': {
                fill: colorTokens.textSecondary,
                fontSize: '0.875rem'
              },
              '& .MuiChartsLegend-label': {
                fill: `${colorTokens.textPrimary} !important`,
                fontSize: '14px !important',
                fontWeight: '600 !important'
              }
            }}
          >
            <ChartsReferenceLine
              y={Math.max(data.stats.successfulAccessesLastMonth, data.stats.successfulAccessesThisMonth)}
              label={`Máx: ${Math.max(data.stats.successfulAccessesLastMonth, data.stats.successfulAccessesThisMonth)}`}
              labelAlign="start"
              lineStyle={{
                stroke: colorTokens.danger,
                strokeDasharray: '5 5'
              }}
            />
          </BarChart>
        </Box>
        {data.stats.successfulAccessesThisMonth > data.stats.successfulAccessesLastMonth ? (
          <Box sx={{
            mt: 2,
            p: 2,
            bgcolor: alpha(colorTokens.success, 0.1),
            borderRadius: 1,
            border: `1px solid ${alpha(colorTokens.success, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <TrendingUpIcon sx={{ color: colorTokens.success }} />
            <Typography sx={{ color: colorTokens.success, fontWeight: 600, fontSize: '0.9rem' }}>
              ¡Excelente! Has aumentado tus asistencias en{' '}
              {data.stats.successfulAccessesThisMonth - data.stats.successfulAccessesLastMonth} este mes
            </Typography>
          </Box>
        ) : data.stats.successfulAccessesThisMonth < data.stats.successfulAccessesLastMonth ? (
          <Box sx={{
            mt: 2,
            p: 2,
            bgcolor: alpha(colorTokens.warning, 0.1),
            borderRadius: 1,
            border: `1px solid ${alpha(colorTokens.warning, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <EventIcon sx={{ color: colorTokens.warning }} />
            <Typography sx={{ color: colorTokens.warning, fontWeight: 600, fontSize: '0.9rem' }}>
              Tus asistencias han disminuido en{' '}
              {data.stats.successfulAccessesLastMonth - data.stats.successfulAccessesThisMonth}. ¡Vamos, puedes mejorar!
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            mt: 2,
            p: 2,
            bgcolor: alpha(colorTokens.info, 0.1),
            borderRadius: 1,
            border: `1px solid ${alpha(colorTokens.info, 0.2)}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <EventIcon sx={{ color: colorTokens.info }} />
            <Typography sx={{ color: colorTokens.info, fontWeight: 600, fontSize: '0.9rem' }}>
              Mantienes la misma consistencia que el mes pasado
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Last Access Info */}
      {data.stats.lastAccessDate && (
        <Paper sx={{
          p: 2.5,
          mb: 4,
          background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(colorTokens.success, 0.2)}`,
          borderRadius: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventIcon sx={{ color: colorTokens.success, fontSize: 28 }} />
            <Box>
              <Typography variant="body2" sx={{ color: colorTokens.textSecondary, fontSize: '0.875rem' }}>
                Última asistencia registrada
              </Typography>
              <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                {formatTimestampForDisplay(data.stats.lastAccessDate)}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Tabla de Asistencias */}
      <Paper sx={{
        background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <Box sx={{
          p: 3,
          borderBottom: `1px solid ${alpha(colorTokens.border, 0.1)}`
        }}>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            color: colorTokens.brand
          }}>
            Historial Completo
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{
                '& th': {
                  bgcolor: alpha(colorTokens.black, 0.2),
                  color: colorTokens.textSecondary,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 2
                }
              }}>
                <TableCell>Fecha y Hora</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.accessLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                      No se encontraron registros de asistencias
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.accessLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(colorTokens.brand, 0.05)
                      },
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <TableCell sx={{ color: colorTokens.textPrimary, fontWeight: 500 }}>
                      {formatTimestampForDisplay(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={translateAccessType(log.access_type)}
                        size="small"
                        sx={{
                          bgcolor: log.access_type === 'entry'
                            ? alpha(colorTokens.success, 0.1)
                            : log.access_type === 'exit'
                            ? alpha(colorTokens.info, 0.1)
                            : alpha(colorTokens.danger, 0.1),
                          color: log.access_type === 'entry'
                            ? colorTokens.success
                            : log.access_type === 'exit'
                            ? colorTokens.info
                            : colorTokens.danger,
                          border: `1px solid ${alpha(
                            log.access_type === 'entry'
                              ? colorTokens.success
                              : log.access_type === 'exit'
                              ? colorTokens.info
                              : colorTokens.danger,
                            0.2
                          )}`,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FingerprintIcon sx={{ fontSize: 18, color: colorTokens.textSecondary }} />
                        <Typography sx={{ color: colorTokens.textPrimary, fontSize: '0.875rem' }}>
                          {translateAccessMethod(log.access_method)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={log.success ? <CheckCircleIcon /> : <CancelIcon />}
                        label={log.success ? 'Exitoso' : 'Denegado'}
                        size="small"
                        sx={{
                          bgcolor: log.success
                            ? alpha(colorTokens.success, 0.1)
                            : alpha(colorTokens.danger, 0.1),
                          color: log.success ? colorTokens.success : colorTokens.danger,
                          border: `1px solid ${alpha(
                            log.success ? colorTokens.success : colorTokens.danger,
                            0.2
                          )}`,
                          fontWeight: 600,
                          '& .MuiChip-icon': {
                            color: log.success ? colorTokens.success : colorTokens.danger
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
