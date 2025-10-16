'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton, useMediaQuery, useTheme, Chip } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { Male as MaleIcon, Female as FemaleIcon, Transgender as OtherIcon } from '@mui/icons-material';

// Color tokens del tema dark centralizado
const colorTokens = {
  brand: '#FFCC00',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#FFCC00',
  info: '#38BDF8',
  purple: '#8B5CF6',
  pink: '#EC4899',
  neutral0: '#0A0A0B',
  neutral100: '#14161A',
  neutral200: '#1B1E24',
  neutral300: '#23272F',
  neutral400: '#2C313B',
  neutral700: '#535B6E',
  neutral800: '#6A7389',
  neutral900: '#8B94AA',
  neutral1000: '#C9CFDB',
  neutral1200: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#C9CFDB',
  textMuted: '#8B94AA',
};

interface GenderData {
  male: number;
  female: number;
  other: number;
  total: number;
}

interface GenderDistributionChartProps {
  data: GenderData;
  loading?: boolean;
  title?: string;
  height?: number;
}

export const GenderDistributionChart: React.FC<GenderDistributionChartProps> = ({
  data,
  loading = false,
  title = 'Distribución por Género',
  height = 380
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartHeight = isMobile ? 280 : height;

  // Preparar datos para el BarChart horizontal
  const genderLabels = ['Masculino', 'Femenino', 'Otro'];
  const genderValues = [data.male, data.female, data.other];
  const genderColors = [colorTokens.info, colorTokens.pink, colorTokens.purple];

  const malePercentage = data.total > 0 ? ((data.male / data.total) * 100).toFixed(1) : '0.0';
  const femalePercentage = data.total > 0 ? ((data.female / data.total) * 100).toFixed(1) : '0.0';
  const otherPercentage = data.total > 0 ? ((data.other / data.total) * 100).toFixed(1) : '0.0';

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
          <Skeleton variant="rectangular" width="100%" height={chartHeight} sx={{ my: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rectangular" height={80} />
            <Skeleton variant="rectangular" height={80} />
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
        width: '100%',
        maxWidth: '100%',
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
        background: `linear-gradient(90deg, ${colorTokens.info}, ${colorTokens.pink}, ${colorTokens.purple})`,
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
          minWidth: 0,
          maxWidth: '100%',
          height: chartHeight,
          position: 'relative'
        }}>
          {data.total > 0 ? (
            <BarChart
              yAxis={[{
                scaleType: 'band',
                data: genderLabels,
                categoryGapRatio: 0.4,
                barGapRatio: 0.2,
                tickLabelStyle: {
                  fontSize: isMobile ? 11 : 13,
                  fill: colorTokens.textPrimary,
                  fontWeight: 600
                }
              }]}
              xAxis={[{
                label: 'Número de Clientes',
                labelStyle: {
                  fontSize: isMobile ? 10 : 12,
                  fill: colorTokens.textPrimary,
                  fontWeight: 600
                },
                tickLabelStyle: {
                  fontSize: isMobile ? 9 : 11,
                  fill: colorTokens.textSecondary,
                  fontWeight: 500
                }
              }]}
              series={[
                {
                  data: genderValues,
                  label: 'Clientes',
                  id: 'gender',
                  valueFormatter: (value) => `${value} clientes`
                }
              ]}
              layout="horizontal"
              height={chartHeight}
              margin={{
                left: isMobile ? 60 : 100,
                right: isMobile ? 10 : 30,
                top: isMobile ? 20 : 30,
                bottom: isMobile ? 50 : 60
              }}
              grid={{ vertical: true }}
              colors={genderColors}
              sx={{
                // Grid styling profesional
                '& .MuiChartsGrid-line': {
                  strokeDasharray: '4 4',
                  strokeWidth: 1,
                  stroke: colorTokens.neutral300,
                  opacity: 0.6
                },
                // Bar styling avanzado
                '& .MuiBarElement-root': {
                  rx: 6,
                  ry: 6,
                  filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.12))',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.2))',
                    opacity: 0.9,
                    transform: 'translateX(4px)'
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
                }
              }}
              slotProps={{
                legend: {
                  hidden: true
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
            />
          ) : (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}>
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
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: { xs: 1, sm: 1.5 },
            mt: { xs: 2, sm: 2.5, md: 3 }
          }}>
            {/* Male card */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: `${colorTokens.info}10`,
                border: `2px solid ${colorTokens.info}30`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: `${colorTokens.info}20`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0px 4px 12px ${colorTokens.info}30`
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <MaleIcon sx={{ color: colorTokens.info, fontSize: { xs: 16, sm: 18 } }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 600,
                    fontSize: { xs: '0.65rem', sm: '0.7rem' }
                  }}
                >
                  Masculino
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  color: colorTokens.info,
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                {data.male}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: colorTokens.textPrimary,
                  fontSize: { xs: '0.65rem', sm: '0.7rem' }
                }}
              >
                {malePercentage}%
              </Typography>
            </Box>

            {/* Female card */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: `${colorTokens.pink}10`,
                border: `2px solid ${colorTokens.pink}30`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: `${colorTokens.pink}20`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0px 4px 12px ${colorTokens.pink}30`
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <FemaleIcon sx={{ color: colorTokens.pink, fontSize: { xs: 16, sm: 18 } }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 600,
                    fontSize: { xs: '0.65rem', sm: '0.7rem' }
                  }}
                >
                  Femenino
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  color: colorTokens.pink,
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                {data.female}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: colorTokens.textPrimary,
                  fontSize: { xs: '0.65rem', sm: '0.7rem' }
                }}
              >
                {femalePercentage}%
              </Typography>
            </Box>

            {/* Other card */}
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                bgcolor: `${colorTokens.purple}10`,
                border: `2px solid ${colorTokens.purple}30`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: `${colorTokens.purple}20`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0px 4px 12px ${colorTokens.purple}30`
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <OtherIcon sx={{ color: colorTokens.purple, fontSize: { xs: 16, sm: 18 } }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: colorTokens.textPrimary,
                    fontWeight: 600,
                    fontSize: { xs: '0.65rem', sm: '0.7rem' }
                  }}
                >
                  Otro
                </Typography>
              </Box>
              <Typography
                variant="h5"
                sx={{
                  color: colorTokens.purple,
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                {data.other}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: colorTokens.textPrimary,
                  fontSize: { xs: '0.65rem', sm: '0.7rem' }
                }}
              >
                {otherPercentage}%
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
