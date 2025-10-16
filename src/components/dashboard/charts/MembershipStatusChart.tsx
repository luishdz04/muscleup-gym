'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, useMediaQuery, useTheme, Chip } from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import { CheckCircle as ActiveIcon, Cancel as InactiveIcon } from '@mui/icons-material';

// Color tokens del tema dark centralizado
const colorTokens = {
  brand: '#FFCC00',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#FFCC00',
  info: '#38BDF8',
  neutral0: '#0A0A0B',
  neutral100: '#14161A',
  neutral200: '#1B1E24',
  neutral300: '#23272F',
  neutral700: '#535B6E',
  neutral800: '#6A7389',
  neutral900: '#8B94AA',
  neutral1000: '#C9CFDB',
  neutral1200: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#C9CFDB',
  textMuted: '#8B94AA',
};

interface MembershipStatusData {
  active: number;
  inactive: number;
  total: number;
}

interface MembershipStatusChartProps {
  data: MembershipStatusData;
  loading?: boolean;
  title?: string;
  height?: number;
}

export const MembershipStatusChart: React.FC<MembershipStatusChartProps> = ({
  data,
  loading = false,
  title = 'Estado de Membresías',
  height = 380
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartHeight = isMobile ? 300 : height;

  // Preparar datos para el PieChart
  const pieData = [
    {
      id: 'active',
      value: data.active,
      label: 'Activas',
      color: colorTokens.success
    },
    {
      id: 'inactive',
      value: data.inactive,
      label: 'Inactivas',
      color: colorTokens.danger
    }
  ];

  const activePercentage = data.total > 0 ? ((data.active / data.total) * 100).toFixed(1) : '0.0';
  const inactivePercentage = data.total > 0 ? ((data.inactive / data.total) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{
          border: `1px solid ${colorTokens.neutral200}`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          height: '100%'
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="circular" width={chartHeight - 100} height={chartHeight - 100} sx={{ mx: 'auto', my: 3 }} />
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Skeleton variant="rectangular" width={100} height={60} />
            <Skeleton variant="rectangular" width={100} height={60} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${colorTokens.neutral200}`,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          transform: 'translateY(-2px)'
        }
      }}
    >
      {/* Accent bar gradient */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        background: `linear-gradient(90deg, ${colorTokens.success}, ${colorTokens.danger})`,
      }} />

      <CardContent sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        pb: { xs: 2, sm: 2.5, md: 3 },
        '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
      }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 2, sm: 2.5, md: 3 }
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
            label={`Total: ${data.total}`}
            sx={{
              bgcolor: `${colorTokens.brand}20`,
              color: colorTokens.brand,
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          />
        </Box>

        {/* Chart */}
        <Box sx={{
          width: '100%',
          height: chartHeight,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative'
        }}>
          {data.total > 0 ? (
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
                  valueFormatter: (item) => `${item.value} clientes`,
                  arcLabel: (item) => {
                    const percentage = ((item.value / data.total) * 100).toFixed(1);
                    return `${percentage}%`;
                  },
                  arcLabelMinAngle: 15,
                  innerRadius: isMobile ? 50 : 70,
                  outerRadius: isMobile ? 90 : 120,
                  paddingAngle: 3,
                  cornerRadius: 8,
                }
              ]}
              height={chartHeight}
              margin={{
                top: isMobile ? 10 : 20,
                bottom: isMobile ? 50 : 60,
                left: isMobile ? 10 : 20,
                right: isMobile ? 10 : 20
              }}
              slotProps={{
                legend: {
                  hidden: true // Ocultamos la leyenda porque usaremos cards personalizadas
                },
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
                '& .MuiPieArc-root': {
                  stroke: '#ffffff',
                  strokeWidth: 4,
                  filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.15))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    filter: 'drop-shadow(0px 6px 16px rgba(0,0,0,0.25))',
                    transform: 'scale(1.05)',
                    strokeWidth: 5
                  }
                },
                '& .MuiPieArcLabel-root': {
                  fill: '#ffffff',
                  fontWeight: 700,
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  textShadow: '0px 2px 4px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }
              }}
            />
          ) : (
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="body2"
                sx={{ color: colorTokens.neutral700, fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                No hay datos disponibles
              </Typography>
            </Box>
          )}
        </Box>

        {/* Stats cards */}
        {data.total > 0 && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: { xs: 1.5, sm: 2 },
            mt: { xs: 2, sm: 2.5, md: 3 }
          }}>
            {/* Active card */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: `${colorTokens.success}10`,
                border: `2px solid ${colorTokens.success}30`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: `${colorTokens.success}20`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0px 4px 12px ${colorTokens.success}30`
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <ActiveIcon sx={{ color: colorTokens.success, fontSize: { xs: 18, sm: 20 } }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}
                >
                  Activas
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: colorTokens.success,
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                }}
              >
                {data.active}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: colorTokens.textPrimary,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                {activePercentage}% del total
              </Typography>
            </Box>

            {/* Inactive card */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: `${colorTokens.danger}10`,
                border: `2px solid ${colorTokens.danger}30`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: `${colorTokens.danger}20`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0px 4px 12px ${colorTokens.danger}30`
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <InactiveIcon sx={{ color: colorTokens.danger, fontSize: { xs: 18, sm: 20 } }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}
                >
                  Inactivas
                </Typography>
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: colorTokens.danger,
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                }}
              >
                {data.inactive}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: colorTokens.textPrimary,
                  fontSize: { xs: '0.7rem', sm: '0.75rem' }
                }}
              >
                {inactivePercentage}% del total
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
