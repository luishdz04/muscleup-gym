// components/dashboard/charts/RevenueBarChart.tsx
'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, useMediaQuery, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { motion } from 'framer-motion';
import { colorTokens } from '@/theme';

interface MonthlyDataPoint {
  month: string;
  monthName: string;
  sales: number;
  memberships: number;
  layaways: number;
  total: number;
}

interface RevenueBarChartProps {
  data: MonthlyDataPoint[];
  loading?: boolean;
  title?: string;
  height?: number;
}

export const RevenueBarChart: React.FC<RevenueBarChartProps> = ({
  data = [],
  loading = false,
  title = 'Ingresos Mensuales - Últimos 6 Meses',
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
          <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={chartHeight} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para MUI Charts
  const xAxisData = data.map(d => d.monthName);
  const salesData = data.map(d => d.sales);
  const membershipsData = data.map(d => d.memberships);
  const layawaysData = data.map(d => d.layaways);

  // Calcular valor máximo total (suma de todas las categorías apiladas)
  const totalData = data.map(d => d.total);
  const maxValue = Math.max(...totalData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
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
          boxShadow: `0 8px 24px ${colorTokens.success}20`,
          borderColor: colorTokens.success,
        }
      }}>
        {/* Accent bar */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${colorTokens.success}, ${colorTokens.brand})`,
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
            <BarChart
              xAxis={[{
                scaleType: 'band',
                data: xAxisData,
                label: 'Mes',
                labelStyle: {
                  fontSize: isMobile ? 12 : 14,
                  fill: colorTokens.textPrimary,
                  fontWeight: 600
                },
                tickLabelStyle: {
                  angle: isMobile ? -45 : 0,
                  textAnchor: isMobile ? 'end' : 'middle',
                  fontSize: isMobile ? 11 : 13,
                  fill: colorTokens.textSecondary,
                  fontWeight: 600
                }
              }]}
              yAxis={[{
                label: 'Ingresos ($)',
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
                  id: 'sales',
                  stack: 'total',
                  color: colorTokens.brand,
                  valueFormatter: (value) => `$${value?.toLocaleString('es-MX') || 0}`
                },
                {
                  data: membershipsData,
                  label: 'Membresías',
                  id: 'memberships',
                  stack: 'total',
                  color: colorTokens.success,
                  valueFormatter: (value) => `$${value?.toLocaleString('es-MX') || 0}`
                },
                {
                  data: layawaysData,
                  label: 'Apartados',
                  id: 'layaways',
                  stack: 'total',
                  color: colorTokens.info,
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
              grid={{ horizontal: true }}
              sx={{
                // Grid styling profesional
                '& .MuiChartsGrid-line': {
                  strokeDasharray: '4 4',
                  strokeWidth: 1,
                  stroke: colorTokens.neutral300,
                  opacity: 0.6
                },
                // Bar styling avanzado con gradientes y sombras
                '& .MuiBarElement-root': {
                  rx: 6,
                  ry: 6,
                  filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.12))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.2))',
                    opacity: 0.9,
                    transform: 'translateY(-2px)'
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
                // Axis styling profesional
                '& .MuiChartsAxis-line': {
                  stroke: colorTokens.neutral700,
                  strokeWidth: 2
                },
                '& .MuiChartsAxis-tick': {
                  stroke: colorTokens.neutral700,
                  strokeWidth: 1.5
                },
                '& .MuiChartsAxis-tickLabel': {
                  fontWeight: 500,
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
                  trigger: 'item',
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
                      rx: 2,
                      width: 14,
                      height: 14
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
            </BarChart>
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
