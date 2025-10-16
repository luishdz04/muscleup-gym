// components/dashboard/charts/RevenueBarChart.tsx
'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, useMediaQuery, useTheme } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
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
            height: chartHeight,
            position: 'relative'
          }}>
            <BarChart
              xAxis={[{
                scaleType: 'band',
                data: xAxisData,
                label: 'Mes',
                labelStyle: {
                  fontSize: isMobile ? 10 : 12,
                  fill: colorTokens.neutral900
                },
                tickLabelStyle: {
                  angle: isMobile ? -45 : 0,
                  textAnchor: isMobile ? 'end' : 'middle',
                  fontSize: isMobile ? 9 : 11,
                  fill: colorTokens.neutral800
                }
              }]}
              yAxis={[{
                label: 'Ingresos ($)',
                labelStyle: {
                  fontSize: isMobile ? 10 : 12,
                  fill: colorTokens.neutral900
                },
                tickLabelStyle: {
                  fontSize: isMobile ? 9 : 11,
                  fill: colorTokens.neutral800
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
                left: isMobile ? 55 : 75,
                right: isMobile ? 20 : 30,
                top: isMobile ? 20 : 30,
                bottom: isMobile ? 80 : 70
              }}
              grid={{ horizontal: true }}
              sx={{
                '& .MuiBarElement-root': {
                  rx: 4,
                  ry: 4
                },
                '& .MuiChartsLegend-series': {
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }
              }}
              slotProps={{
                legend: {
                  direction: 'row',
                  position: {
                    vertical: 'bottom',
                    horizontal: 'middle'
                  },
                  padding: isMobile ? 0 : 10,
                  itemMarkWidth: isMobile ? 15 : 20,
                  itemMarkHeight: isMobile ? 15 : 20,
                  markGap: isMobile ? 5 : 8,
                  itemGap: isMobile ? 15 : 20,
                  labelStyle: {
                    fontSize: isMobile ? 11 : 13,
                    fill: colorTokens.neutral1000
                  }
                }
              }}
            />
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
