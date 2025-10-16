// components/dashboard/charts/PaymentMethodsPieChart.tsx
'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, useMediaQuery, useTheme, Chip } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { motion } from 'framer-motion';
import { colorTokens } from '@/theme';

interface PaymentMethod {
  efectivo: number;
  transferencia: number;
  debito: number;
  credito: number;
}

interface PaymentMethodsPieChartProps {
  data: PaymentMethod;
  loading?: boolean;
  title?: string;
  height?: number;
}

export const PaymentMethodsPieChart: React.FC<PaymentMethodsPieChartProps> = ({
  data = { efectivo: 0, transferencia: 0, debito: 0, credito: 0 },
  loading = false,
  title = 'Distribución de Métodos de Pago',
  height = 350
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const chartHeight = isMobile ? 300 : isTablet ? 320 : height;

  if (loading) {
    return (
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
          <Skeleton variant="circular" width={chartHeight} height={chartHeight} sx={{ margin: '0 auto' }} />
        </CardContent>
      </Card>
    );
  }

  // Preparar datos para MUI Charts
  const total = data.efectivo + data.transferencia + data.debito + data.credito;

  const pieData = [
    {
      id: 0,
      value: data.efectivo,
      label: 'Efectivo',
      color: colorTokens.success
    },
    {
      id: 1,
      value: data.transferencia,
      label: 'Transferencia',
      color: colorTokens.brand
    },
    {
      id: 2,
      value: data.debito,
      label: 'Débito',
      color: colorTokens.info
    },
    {
      id: 3,
      value: data.credito,
      label: 'Crédito',
      color: colorTokens.warning
    }
  ].filter(item => item.value > 0); // Solo mostrar métodos con valores

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 8px 24px ${colorTokens.info}20`,
          borderColor: colorTokens.info,
        }
      }}>
        {/* Accent bar */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${colorTokens.info}, ${colorTokens.warning})`,
        }} />

        <CardContent sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 2, sm: 2.5, md: 3 },
          '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
        }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: { xs: 2, sm: 2.5, md: 3 },
            flexWrap: 'wrap',
            gap: 1
          }}>
            <Typography
              variant="h6"
              sx={{
                color: colorTokens.neutral1200,
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
              }}
            >
              {title}
            </Typography>
            <Chip
              label={`Total: $${total.toLocaleString('es-MX')}`}
              sx={{
                bgcolor: `${colorTokens.brand}20`,
                color: colorTokens.brand,
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            />
          </Box>

          <Box sx={{
            width: '100%',
            height: chartHeight,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            {pieData.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: pieData,
                    highlightScope: { faded: 'global', highlighted: 'item' },
                    faded: {
                      innerRadius: 30,
                      additionalRadius: -15,
                      color: 'gray',
                      opacity: 0.3
                    },
                    valueFormatter: (item) => `$${item.value.toLocaleString('es-MX')}`,
                    arcLabel: (item) => {
                      const percentage = ((item.value / total) * 100).toFixed(1);
                      return `${percentage}%`;
                    },
                    arcLabelMinAngle: 20,
                    innerRadius: isMobile ? 45 : 60,
                    outerRadius: isMobile ? 85 : 110,
                    paddingAngle: 3,
                    cornerRadius: 8,
                  }
                ]}
                height={chartHeight}
                margin={{
                  top: isMobile ? 10 : 20,
                  bottom: isMobile ? 60 : 80,
                  left: isMobile ? 10 : 20,
                  right: isMobile ? 10 : 20
                }}
                slotProps={{
                  legend: {
                    direction: isMobile ? 'column' : 'row',
                    position: {
                      vertical: 'bottom',
                      horizontal: 'middle'
                    },
                    padding: isMobile ? 5 : 10
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
                sx={{
                  // Arc styling profesional con sombras y animaciones
                  '& .MuiPieArc-root': {
                    stroke: '#ffffff',
                    strokeWidth: 3,
                    filter: 'drop-shadow(0px 3px 8px rgba(0,0,0,0.15))',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.25))',
                      transform: 'scale(1.05)',
                      strokeWidth: 4
                    }
                  },
                  // Arc labels mejorados
                  '& .MuiPieArcLabel-root': {
                    fill: '#ffffff',
                    fontWeight: 700,
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    textShadow: '0px 1px 3px rgba(0,0,0,0.4)',
                    pointerEvents: 'none'
                  },
                  // Legend mejorada
                  '& .MuiChartsLegend-series': {
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    fontWeight: 600
                  },
                  '& .MuiChartsLegend-mark': {
                    rx: 3,
                    width: isMobile ? 18 : 22,
                    height: isMobile ? 18 : 22,
                    filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))'
                  }
                }}
              />
            ) : (
              <Box sx={{
                textAlign: 'center'
              }}>
                <Typography
                  variant="body2"
                  sx={{ color: colorTokens.neutral700, fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  No hay datos de pagos disponibles
                </Typography>
              </Box>
            )}
          </Box>

          {/* Summary cards */}
          {pieData.length > 0 && (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
              gap: { xs: 1, sm: 1.5 },
              mt: { xs: 2, sm: 2.5, md: 3 }
            }}>
              {pieData.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: { xs: 1, sm: 1.5 },
                    borderRadius: 2,
                    bgcolor: `${item.color}10`,
                    border: `1px solid ${item.color}30`,
                    textAlign: 'center'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: colorTokens.neutral900,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      display: 'block',
                      mb: 0.5
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: item.color,
                      fontWeight: 700,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    ${item.value.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
