'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { colorTokens } from '@/theme';
import { motion } from 'framer-motion';

interface AnalyticsData {
  totalRoutines: number;
  generalCount: number;
  personalizedCount: number;
  levelDistribution: Record<string, number>;
  durationDistribution: Record<string, number>;
  avgExercisesPerRoutine: number;
  topUsedRoutines: Array<{ name: string; usage_count: number }>;
  unusedRoutinesCount: number;
  activeAssignments: number;
  totalExercisesInRoutines: number;
}

interface Props {
  data: AnalyticsData;
}

const chartColors = [
  colorTokens.brand,      // Amarillo
  colorTokens.success,    // Verde
  colorTokens.info,       // Azul
  colorTokens.warning,    // Naranja
  colorTokens.danger,     // Rojo
  '#9b59b6',              // Púrpura
  '#3498db',              // Azul claro
  '#e67e22',              // Naranja
  '#16a085',              // Verde azulado
];

export default function RutineAnalyticsCharts({ data }: Props) {
  // Datos para gráfico de tipo
  const typeData = [
    {
      id: 0,
      label: 'Generales',
      value: data.generalCount,
      color: colorTokens.success
    },
    {
      id: 1,
      label: 'Personalizadas',
      value: data.personalizedCount,
      color: colorTokens.warning
    }
  ].filter(item => item.value > 0);

  // Datos para gráfico de nivel
  const levelData = Object.entries(data.levelDistribution).map(
    ([name, value], index) => ({
      id: index,
      label: name,
      value,
      color: chartColors[index % chartColors.length]
    })
  );

  // Datos para gráfico de duración
  const durationData = Object.entries(data.durationDistribution).map(
    ([name, value], index) => ({
      id: index,
      label: name,
      value,
      color: chartColors[index % chartColors.length]
    })
  ).filter(item => item.value > 0);

  // Datos para top rutinas
  const topRoutinesLabels = data.topUsedRoutines.slice(0, 5).map(r =>
    r.name.length > 25 ? r.name.substring(0, 25) + '...' : r.name
  );
  const topRoutinesValues = data.topUsedRoutines.slice(0, 5).map(r => r.usage_count);

  return (
    <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
      {/* Distribución General vs Personalizada */}
      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            sx={{
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              height: '100%'
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  color: colorTokens.textPrimary,
                  fontWeight: 700,
                  mb: 3,
                  textAlign: 'center'
                }}
              >
                Distribución por Tipo
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                {typeData.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: typeData,
                        innerRadius: 50,
                        outerRadius: 100,
                        paddingAngle: 3,
                        cornerRadius: 8,
                      },
                    ]}
                    width={500}
                    height={300}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                    No hay datos disponibles
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Distribución por Nivel */}
      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card
            sx={{
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              height: '100%'
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  color: colorTokens.textPrimary,
                  fontWeight: 700,
                  mb: 3,
                  textAlign: 'center'
                }}
              >
                Distribución por Nivel de Dificultad
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                {levelData.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: levelData,
                        innerRadius: 50,
                        outerRadius: 100,
                        paddingAngle: 2,
                        cornerRadius: 5,
                      },
                    ]}
                    width={500}
                    height={300}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                    No hay datos disponibles
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Distribución por Duración */}
      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card
            sx={{
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              height: '100%'
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  color: colorTokens.textPrimary,
                  fontWeight: 700,
                  mb: 3,
                  textAlign: 'center'
                }}
              >
                Distribución por Duración
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                {durationData.length > 0 ? (
                  <PieChart
                    series={[
                      {
                        data: durationData,
                        innerRadius: 40,
                        outerRadius: 100,
                        paddingAngle: 2,
                        cornerRadius: 5,
                      },
                    ]}
                    width={500}
                    height={300}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                    No hay datos disponibles
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      {/* Top 5 Rutinas Más Asignadas */}
      <Grid size={{ xs: 12, md: 6 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card
            sx={{
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              height: '100%'
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  color: colorTokens.textPrimary,
                  fontWeight: 700,
                  mb: 3,
                  textAlign: 'center'
                }}
              >
                Top 5 Rutinas Más Asignadas
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
                {topRoutinesValues.length > 0 ? (
                  <BarChart
                    xAxis={[
                      {
                        scaleType: 'band',
                        data: topRoutinesLabels,
                        tickLabelStyle: {
                          angle: -45,
                          textAnchor: 'end',
                          fontSize: 10,
                          fill: colorTokens.textSecondary,
                          fontWeight: 600
                        }
                      }
                    ]}
                    yAxis={[
                      {
                        label: 'Asignaciones',
                        labelStyle: {
                          fill: colorTokens.textPrimary,
                          fontSize: 14,
                          fontWeight: 600
                        },
                        tickLabelStyle: {
                          fill: colorTokens.textSecondary,
                          fontSize: 12,
                          fontWeight: 600
                        }
                      }
                    ]}
                    series={[
                      {
                        data: topRoutinesValues,
                        color: colorTokens.brand,
                        label: 'Asignaciones',
                        valueFormatter: (value) => `${value} asignaciones`
                      }
                    ]}
                    height={300}
                    margin={{ left: 70, right: 20, top: 20, bottom: 100 }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                    No hay rutinas asignadas
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );
}
