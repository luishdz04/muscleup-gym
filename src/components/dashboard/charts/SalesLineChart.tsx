// components/dashboard/charts/SalesLineChart.tsx
'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, useMediaQuery, useTheme } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { motion } from 'framer-motion';
import { colorTokens } from '@/theme';

interface ChartDataPoint {
  name: string;
  sales: number;
  memberships: number;
  date: string;
}

interface SalesLineChartProps {
  data: ChartDataPoint[];
  loading?: boolean;
  title?: string;
  height?: number;
}

export const SalesLineChart: React.FC<SalesLineChartProps> = ({
  data = [],
  loading = false,
  title = 'Tendencia de Ventas - Últimos 7 Días',
  height = 400
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const chartHeight = isMobile ? 300 : isTablet ? 350 : height;

  if (loading) {
    return (
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={chartHeight} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para MUI Charts
  const xAxisData = data.map(d => d.name);
  const salesData = data.map(d => d.sales);
  const membershipsData = data.map(d => d.memberships);

  // Calcular valor máximo para la línea de referencia
  const maxValue = Math.max(...salesData, ...membershipsData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 8px 24px ${colorTokens.brand}20`,
          borderColor: colorTokens.brand,
        }
      }}>
        {/* Accent bar */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.info})`,
        }} />

        <CardContent sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 2, sm: 2.5, md: 3 },
          '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
        }}>
          <Typography
            variant="h6"
            sx={{
              color: colorTokens.neutral1200,
              fontWeight: 700,
              mb: { xs: 2, sm: 2.5, md: 3 },
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
            }}
          >
            {title}
          </Typography>

          <Box sx={{
            width: '100%',
            minWidth: 0,
            maxWidth: '100%',
            height: chartHeight,
            position: 'relative'
          }}>
            <LineChart
              xAxis={[{
                scaleType: 'point',
                data: xAxisData,
                label: 'Día',
                labelStyle: {
                  fontSize: isMobile ? 12 : 14,
                  fill: colorTokens.textPrimary,
                  fontWeight: 600
                },
                tickLabelStyle: {
                  fontSize: isMobile ? 11 : 13,
                  fill: colorTokens.textSecondary,
                  fontWeight: 600
                }
              }]}
              yAxis={[{
                label: 'Monto ($)',
                labelStyle: {
                  fontSize: isMobile ? 12 : 14,
                  fill: colorTokens.textPrimary,
                  fontWeight: 600
                },
                tickLabelStyle: {
                  fontSize: isMobile ? 11 : 13,
                  fill: colorTokens.textSecondary,
                  fontWeight: 600
                }
              }]}
              series={[
                {
                  data: salesData,
                  label: 'Ventas',
                  color: colorTokens.brand,
                  curve: 'natural',
                  showMark: true,
                  area: true,
                  valueFormatter: (value) => `$${value?.toLocaleString('es-MX') || 0}`
                },
                {
                  data: membershipsData,
                  label: 'Membresías',
                  color: colorTokens.success,
                  curve: 'natural',
                  showMark: true,
                  area: true,
                  valueFormatter: (value) => `$${value?.toLocaleString('es-MX') || 0}`
                }
              ]}
              height={chartHeight}
              margin={{
                left: isMobile ? 50 : 90,
                right: isMobile ? 10 : 30,
                top: isMobile ? 35 : 45,
                bottom: isMobile ? 50 : 60
              }}
              grid={{ vertical: true, horizontal: true }}
              sx={{
                // Grid styling profesional
                '& .MuiChartsGrid-line': {
                  strokeDasharray: '4 4',
                  strokeWidth: 1,
                  stroke: colorTokens.neutral300,
                  opacity: 0.6
                },
                // Line styling mejorado
                '& .MuiLineElement-root': {
                  strokeWidth: 3,
                  filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))'
                },
                // Area con gradiente
                '& .MuiAreaElement-root': {
                  fillOpacity: 0.15,
                  filter: 'url(#area-gradient)'
                },
                // Marks más prominentes
                '& .MuiMarkElement-root': {
                  scale: '1',
                  strokeWidth: 3,
                  r: isMobile ? 5 : 6,
                  filter: 'drop-shadow(0px 1px 3px rgba(0,0,0,0.2))',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    r: isMobile ? 7 : 8,
                    scale: '1.2'
                  }
                },
                // Legend mejorada
                '& .MuiChartsLegend-series': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: 600
                },
                '& .MuiChartsLegend-mark': {
                  rx: 2,
                  width: isMobile ? 16 : 20,
                  height: isMobile ? 16 : 20
                },
                // Axis styling mejorado
                '& .MuiChartsAxis-line': {
                  stroke: colorTokens.neutral700,
                  strokeWidth: 2
                },
                '& .MuiChartsAxis-tick': {
                  stroke: colorTokens.neutral700,
                  strokeWidth: 1.5
                },
                '& .MuiChartsAxis-tickLabel': {
                  fill: `${colorTokens.textSecondary} !important`
                },
                '& .MuiChartsAxis-label': {
                  fill: `${colorTokens.textPrimary} !important`
                }
              }}
              slotProps={{
                legend: {
                  direction: 'row',
                  position: {
                    vertical: 'top',
                    horizontal: 'middle'
                  },
                  padding: isMobile ? 5 : 8
                },
                // Tooltip personalizado profesional
                tooltip: {
                  trigger: 'axis',
                  sx: {
                    '& .MuiChartsTooltip-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: 2,
                      border: `1px solid ${colorTokens.neutral300}`,
                      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
                      padding: 2
                    },
                    '& .MuiChartsTooltip-mark': {
                      rx: 1,
                      width: 12,
                      height: 12
                    },
                    '& .MuiChartsTooltip-labelCell': {
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: colorTokens.neutral1000
                    },
                    '& .MuiChartsTooltip-valueCell': {
                      fontWeight: 700,
                      fontSize: '0.9375rem',
                      color: colorTokens.brand
                    }
                  }
                }
              }}
            >
              {/* Línea de referencia MAX */}
              {maxValue > 0 && (
                <ChartsReferenceLine
                  y={maxValue}
                  label={`Máx: $${maxValue.toLocaleString('es-MX')}`}
                  labelAlign="end"
                  lineStyle={{
                    stroke: colorTokens.danger,
                    strokeDasharray: '5 5',
                    strokeWidth: 2
                  }}
                  labelStyle={{
                    fontSize: isMobile ? 11 : 13,
                    fontWeight: 700,
                    fill: colorTokens.danger
                  }}
                />
              )}
            </LineChart>
          </Box>

          {data.length === 0 && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <Typography
                variant="body2"
                sx={{ color: colorTokens.neutral700, fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                No hay datos disponibles
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
