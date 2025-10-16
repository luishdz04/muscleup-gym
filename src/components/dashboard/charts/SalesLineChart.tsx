// components/dashboard/charts/SalesLineChart.tsx
'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, useMediaQuery, useTheme } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
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
            height: chartHeight,
            position: 'relative'
          }}>
            <LineChart
              xAxis={[{
                scaleType: 'point',
                data: xAxisData,
                label: 'Día',
                labelStyle: {
                  fontSize: isMobile ? 10 : 12,
                  fill: colorTokens.neutral900
                },
                tickLabelStyle: {
                  fontSize: isMobile ? 9 : 11,
                  fill: colorTokens.neutral800
                }
              }]}
              yAxis={[{
                label: 'Monto ($)',
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
                left: isMobile ? 50 : 70,
                right: isMobile ? 20 : 30,
                top: isMobile ? 20 : 30,
                bottom: isMobile ? 60 : 70
              }}
              grid={{ vertical: true, horizontal: true }}
              sx={{
                '& .MuiLineElement-root': {
                  strokeWidth: 3
                },
                '& .MuiAreaElement-root': {
                  fillOpacity: 0.1
                },
                '& .MuiMarkElement-root': {
                  scale: '1',
                  strokeWidth: 2,
                  r: isMobile ? 4 : 5
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
                  itemMarkHeight: isMobile ? 2 : 3,
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
