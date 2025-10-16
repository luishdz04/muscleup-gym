// components/dashboard/charts/DashboardMetricsCard.tsx
'use client';

import React from 'react';
import { Box, Card, CardContent, Typography, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { colorTokens } from '@/theme';

interface DashboardMetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  color?: string;
  iconBgColor?: string;
  accentColor?: string;
}

export const DashboardMetricsCard: React.FC<DashboardMetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  loading = false,
  color = colorTokens.brand,
  iconBgColor,
  accentColor
}) => {
  const bgColor = iconBgColor || `${color}15`;
  const accent = accentColor || color;

  if (loading) {
    return (
      <Card sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Skeleton variant="circular" width={48} height={48} sx={{ mb: 2 }} />
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="40%" height={36} />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 }
      }}
      style={{ height: '100%' }}
    >
      <Card sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: `0 8px 24px ${accent}30`,
          borderColor: accent,
        }
      }}>
        {/* Accent bar */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${accent}, ${accent}80)`,
        }} />

        <CardContent sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          pb: { xs: 2, sm: 2.5, md: 3 },
          '&:last-child': { pb: { xs: 2, sm: 2.5, md: 3 } }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: colorTokens.neutral900,
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  mb: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {title}
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  color: colorTokens.neutral1200,
                  fontWeight: 700,
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  lineHeight: 1.2,
                  mb: 0.5
                }}
              >
                {value}
              </Typography>

              {subtitle && (
                <Typography
                  variant="caption"
                  sx={{
                    color: colorTokens.neutral800,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    display: 'block'
                  }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>

            {icon && (
              <Box sx={{
                width: { xs: 48, sm: 56, md: 64 },
                height: { xs: 48, sm: 56, md: 64 },
                borderRadius: 2,
                background: bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accent,
                flexShrink: 0,
                ml: 2,
                '& svg': {
                  fontSize: { xs: 28, sm: 32, md: 36 }
                }
              }}>
                {icon}
              </Box>
            )}
          </Box>

          {trend !== undefined && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${colorTokens.neutral400}`
            }}>
              {trend >= 0 ? (
                <TrendingUpIcon sx={{
                  fontSize: { xs: 16, sm: 18 },
                  color: colorTokens.success
                }} />
              ) : (
                <TrendingDownIcon sx={{
                  fontSize: { xs: 16, sm: 18 },
                  color: colorTokens.danger
                }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: trend >= 0 ? colorTokens.success : colorTokens.danger,
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {Math.abs(trend).toFixed(1)}%
              </Typography>
              {trendLabel && (
                <Typography
                  variant="caption"
                  sx={{
                    color: colorTokens.neutral800,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                  }}
                >
                  {trendLabel}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
