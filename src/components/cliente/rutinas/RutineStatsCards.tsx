'use client';

import React from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { Grid } from '@mui/material';
import {
  FitnessCenter as FitnessIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { motion } from 'framer-motion';

interface StatsData {
  totalRoutines: number;
  activeRoutines: number;
  completedRoutines: number;
  totalExercises: number;
}

interface RutineStatsCardsProps {
  stats: StatsData | null;
  loading: boolean;
}

const MotionBox = motion(Box);

export default function RutineStatsCards({ stats, loading }: RutineStatsCardsProps) {
  const cards = [
    {
      title: 'Rutinas Totales',
      value: stats?.totalRoutines || 0,
      icon: <FitnessIcon sx={{ fontSize: 32 }} />,
      color: colorTokens.brand,
      bgGradient: 'linear-gradient(135deg, rgba(255, 204, 0, 0.15) 0%, rgba(255, 204, 0, 0.05) 100%)'
    },
    {
      title: 'Rutinas Activas',
      value: stats?.activeRoutines || 0,
      icon: <TrendingUpIcon sx={{ fontSize: 32 }} />,
      color: colorTokens.success,
      bgGradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)'
    },
    {
      title: 'Completadas',
      value: stats?.completedRoutines || 0,
      icon: <CheckCircleIcon sx={{ fontSize: 32 }} />,
      color: colorTokens.info,
      bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0.05) 100%)'
    },
    {
      title: 'Total Ejercicios',
      value: stats?.totalExercises || 0,
      icon: <ScheduleIcon sx={{ fontSize: 32 }} />,
      color: '#9C27B0',
      bgGradient: 'linear-gradient(135deg, rgba(156, 39, 176, 0.15) 0%, rgba(156, 39, 176, 0.05) 100%)'
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <Skeleton
              variant="rectangular"
              height={130}
              sx={{
                bgcolor: colorTokens.neutral300,
                borderRadius: 2
              }}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: 3 }}>
      {cards.map((card, index) => (
        <Grid key={card.title} size={{ xs: 12, sm: 6, md: 3 }}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            sx={{
              position: 'relative',
              overflow: 'hidden',
              bgcolor: colorTokens.neutral300,
              border: `1px solid ${colorTokens.border}`,
              borderRadius: 2,
              p: { xs: 2, sm: 2.5, md: 3 },
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: card.color,
                boxShadow: `0 8px 24px ${card.color}20`
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: card.bgGradient,
                opacity: 1,
                zIndex: 0
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Icon */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: { xs: 48, sm: 56, md: 64 },
                  height: { xs: 48, sm: 56, md: 64 },
                  borderRadius: 2,
                  bgcolor: card.color + '20',
                  color: card.color,
                  mb: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'rotate(5deg) scale(1.05)',
                    bgcolor: card.color + '30'
                  }
                }}
              >
                {card.icon}
              </Box>

              {/* Value */}
              <Typography
                variant="h3"
                sx={{
                  fontSize: { xs: '2rem', sm: '2.25rem', md: '2.5rem' },
                  fontWeight: 700,
                  color: colorTokens.textPrimary,
                  mb: 0.5,
                  lineHeight: 1
                }}
              >
                {card.value.toLocaleString()}
              </Typography>

              {/* Title */}
              <Typography
                variant="body2"
                sx={{
                  color: colorTokens.textSecondary,
                  fontSize: { xs: '0.813rem', sm: '0.875rem' },
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {card.title}
              </Typography>
            </Box>

            {/* Decorative element */}
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: card.color,
                opacity: 0.05,
                zIndex: 0
              }}
            />
          </MotionBox>
        </Grid>
      ))}
    </Grid>
  );
}
