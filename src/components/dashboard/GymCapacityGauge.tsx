"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import { alpha } from '@mui/material/styles';
import { colorTokens } from '@/theme';
import {
  People as PeopleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface CapacityData {
  currentCount: number;
  maxCapacity: number;
  percentage: number;
  status: 'optimal' | 'moderate' | 'full';
  statusColor: string;
  statusMessage: string;
  lastUpdated: string;
}

export default function GymCapacityGauge() {
  const [data, setData] = useState<CapacityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchCapacity = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gym/capacity');

      if (!response.ok) {
        throw new Error('Error al cargar capacidad del gimnasio');
      }

      const result = await response.json();
      setData(result);
      setLastRefresh(new Date());
      setError(null);
      console.log('✅ [GYM-CAPACITY-GAUGE] Data refreshed:', result);
    } catch (err) {
      console.error('❌ [GYM-CAPACITY-GAUGE] Error fetching capacity:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchCapacity();

    // Auto-refresh every 2 minutes (120 seconds = 120,000 milliseconds)
    const intervalId = setInterval(() => {
      console.log('🔄 [GYM-CAPACITY-GAUGE] Auto-refreshing...');
      fetchCapacity();
    }, 2 * 60 * 1000); // 2 minutes

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading && !data) {
    return (
      <Paper sx={{
        p: 3,
        background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
        borderRadius: 3,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 300
      }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Paper>
    );
  }

  if (error && !data) {
    return (
      <Paper sx={{
        p: 3,
        background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
        borderRadius: 3
      }}>
        <Alert severity="error">{error}</Alert>
      </Paper>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Paper sx={{
      p: { xs: 2, sm: 3 },
      background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
      borderRadius: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 8px 24px ${alpha(colorTokens.black, 0.4)}`
      }
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ color: colorTokens.brand, fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>
            Ocupación del Gimnasio
          </Typography>
        </Box>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          bgcolor: alpha(colorTokens.info, 0.1),
          border: `1px solid ${alpha(colorTokens.info, 0.2)}`
        }}>
          <RefreshIcon sx={{ fontSize: 16, color: colorTokens.info }} />
          <Typography variant="caption" sx={{ color: colorTokens.info, fontWeight: 600 }}>
            Actualizado hace {Math.floor((Date.now() - lastRefresh.getTime()) / 60000)} min
          </Typography>
        </Box>
      </Box>

      {/* Gauge Chart */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        mt: 2
      }}>
        <Gauge
          width={280}
          height={280}
          value={data.percentage}
          valueMin={0}
          valueMax={100}
          startAngle={-110}
          endAngle={110}
          sx={{
            [`& .${gaugeClasses.valueText}`]: {
              fontSize: 40,
              fontWeight: 800,
              fill: data.statusColor
            },
            [`& .${gaugeClasses.valueArc}`]: {
              fill: data.statusColor
            },
            [`& .${gaugeClasses.referenceArc}`]: {
              fill: alpha(colorTokens.textSecondary, 0.2)
            }
          }}
          text={({ value }) => `${value}%`}
        />

        {/* Status Message */}
        <Box sx={{
          textAlign: 'center',
          p: 2,
          borderRadius: 2,
          bgcolor: alpha(data.statusColor, 0.1),
          border: `1px solid ${alpha(data.statusColor, 0.2)}`,
          width: '100%'
        }}>
          <Typography variant="body1" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
            {data.statusMessage}
          </Typography>
        </Box>

        {/* Legend */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          mt: 1,
          flexWrap: 'wrap',
          gap: { xs: 1, sm: 2 }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#22C55E' }} />
            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
              Óptimo (0-60%)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFCC00' }} />
            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
              Moderado (61-85%)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#EF4444' }} />
            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
              Lleno (86-100%)
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
