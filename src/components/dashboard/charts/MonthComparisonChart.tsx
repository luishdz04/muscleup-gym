// components/dashboard/charts/MonthComparisonChart.tsx
'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, useMediaQuery, useTheme, Chip } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { ChartsReferenceLine } from '@mui/x-charts/ChartsReferenceLine';
import { motion } from 'framer-motion';
import { colorTokens } from '@/theme';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface MonthComparisonData {
  currentMonth: {
    name: string;
    total: number;
    sales: number;
    memberships: number;
  };
  previousMonth: {
    name: string;
    total: number;
    sales: number;
    memberships: number;
  };
}

interface MonthComparisonChartProps {
  data: MonthComparisonData;
  loading?: boolean;
  title?: string;
  height?: number;
}

export const MonthComparisonChart: React.FC<MonthComparisonChartProps> = ({
  data,
  loading = false,
  title = 'Comparativa: Mes Actual vs Mes Anterior',
  height = 350
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const chartHeight = isMobile ? 280 : height;

  // Calculate growth percentage
  const growthPercentage = data.previousMonth.total > 0
    ? ((data.currentMonth.total - data.previousMonth.total) / data.previousMonth.total) * 100
    : 0;

  const isPositiveGrowth = growthPercentage >= 0;

  if (loading) {
    return (
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        width: '100%',
        maxWidth: '100%'
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={chartHeight} sx={{ borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  // Prepare data for chart
  const xAxisData = [data.previousMonth.name, data.currentMonth.name];
  const salesData = [data.previousMonth.sales, data.currentMonth.sales];
  const membershipsData = [data.previousMonth.memberships, data.currentMonth.memberships];

  // Calcular valor máximo
  const maxValue = Math.max(data.previousMonth.total, data.currentMonth.total);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
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
          boxShadow: `0 8px 24px ${isPositiveGrowth ? colorTokens.success : colorTokens.danger}20`,
          borderColor: isPositiveGrowth ? colorTokens.success : colorTokens.danger,
        }
      }}>
        {/* Accent bar */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${colorTokens.brand}, ${isPositiveGrowth ? colorTokens.success : colorTokens.danger})`,
        }} />

        <CardContent sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 2, sm: 2.5, md: 3 },
          '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
        }}>
          {/* Header with title and growth indicator */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 2, sm: 2.5, md: 3 },
            flexWrap: 'wrap',
            gap: 1.5
          }}>
            <Typography
              variant="h6"
              sx={{
                color: colorTokens.textPrimary,
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
              }}
            >
              {title}
            </Typography>

            <Chip
              icon={isPositiveGrowth ? <TrendingUpIcon /> : <TrendingDownIcon />}
              label={`${isPositiveGrowth ? '+' : ''}${growthPercentage.toFixed(1)}%`}
              sx={{
                bgcolor: isPositiveGrowth ? `${colorTokens.success}20` : `${colorTokens.danger}20`,
                color: isPositiveGrowth ? colorTokens.success : colorTokens.danger,
                fontWeight: 700,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                height: { xs: 28, sm: 32 },
                '& .MuiChip-icon': {
                  color: isPositiveGrowth ? colorTokens.success : colorTokens.danger
                }
              }}
            />
          </Box>

          {/* Chart */}
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
                tickLabelStyle: {
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
                }
              ]}
              height={chartHeight}
              margin={{
                left: isMobile ? 60 : 90,
                right: isMobile ? 10 : 30,
                top: isMobile ? 30 : 40,
                bottom: isMobile ? 45 : 50
              }}
              grid={{ horizontal: true }}
              sx={{
                // Grid styling
                '& .MuiChartsGrid-line': {
                  strokeDasharray: '4 4',
                  strokeWidth: 1,
                  stroke: colorTokens.neutral300,
                  opacity: 0.6
                },
                // Bar styling with gradient and shadows
                '& .MuiBarElement-root': {
                  rx: 6,
                  ry: 6,
                  filter: 'drop-shadow(0px 3px 8px rgba(0,0,0,0.15))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.25))',
                    opacity: 0.9
                  }
                },
                // Axis styling
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
                },
                // Legend styling
                '& .MuiChartsLegend-series': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  fontWeight: 600
                },
                '& .MuiChartsLegend-mark': {
                  rx: 2,
                  width: isMobile ? 16 : 20,
                  height: isMobile ? 16 : 20,
                  filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))'
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

          {/* Summary Cards */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: { xs: 1.5, sm: 2 },
            mt: { xs: 2, sm: 2.5, md: 3 }
          }}>
            {/* Previous Month */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: `${colorTokens.neutral300}`,
                border: `1px solid ${colorTokens.neutral400}`,
                textAlign: 'center'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: colorTokens.textSecondary,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: 'block',
                  mb: 0.5
                }}
              >
                {data.previousMonth.name}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: colorTokens.textPrimary,
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                ${data.previousMonth.total.toLocaleString('es-MX')}
              </Typography>
            </Box>

            {/* Current Month */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: isPositiveGrowth ? `${colorTokens.success}15` : `${colorTokens.danger}15`,
                border: `2px solid ${isPositiveGrowth ? colorTokens.success : colorTokens.danger}40`,
                textAlign: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${isPositiveGrowth ? colorTokens.success : colorTokens.danger}40, transparent)`,
                  zIndex: -1,
                  opacity: 0.3
                }
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: colorTokens.textPrimary,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: 'block',
                  mb: 0.5,
                  fontWeight: 600
                }}
              >
                {data.currentMonth.name}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: isPositiveGrowth ? colorTokens.success : colorTokens.danger,
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                ${data.currentMonth.total.toLocaleString('es-MX')}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};
