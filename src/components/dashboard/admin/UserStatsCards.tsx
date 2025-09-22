// components/dashboard/admin/UserStatsCards.tsx
'use client';

import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { 
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Cake as CakeIcon,
  Verified as VerifiedIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { UserStats } from '@/types/user';

interface UserStatsCardsProps {
  userStats: UserStats;
  totalUsers: number;
  verifiedCount: number;
}

const UserStatsCards = React.memo(({ 
  userStats, 
  totalUsers, 
  verifiedCount 
}: UserStatsCardsProps) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* TOTAL USUARIOS */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `1px solid ${colorTokens.success}40`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colorTokens.success}, ${colorTokens.success}80)`
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" sx={{ 
                color: colorTokens.success, 
                fontWeight: 700,
                lineHeight: 1
              }}>
                {totalUsers.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: colorTokens.neutral1000,
                mt: 0.5,
                fontWeight: 500
              }}>
                Total Usuarios
              </Typography>
              <Typography variant="caption" sx={{ 
                color: colorTokens.neutral800,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 1
              }}>
                <TrendingUpIcon sx={{ fontSize: '1rem' }} />
                {userStats.newUsersThisMonth} este mes
              </Typography>
            </Box>
            <Box sx={{
              p: 2,
              borderRadius: '50%',
              bgcolor: `${colorTokens.success}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PeopleIcon sx={{ fontSize: 32, color: colorTokens.success }} />
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* EDAD PROMEDIO */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `1px solid ${colorTokens.info}40`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colorTokens.info}, ${colorTokens.info}80)`
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" sx={{ 
                color: colorTokens.info, 
                fontWeight: 700,
                lineHeight: 1
              }}>
                {userStats.averageAge || 0}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: colorTokens.neutral1000,
                mt: 0.5,
                fontWeight: 500
              }}>
                Edad Promedio
              </Typography>
              <Typography variant="caption" sx={{ 
                color: colorTokens.neutral800,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 1
              }}>
                <CakeIcon sx={{ fontSize: '1rem' }} />
                años estimados
              </Typography>
            </Box>
            <Box sx={{
              p: 2,
              borderRadius: '50%',
              bgcolor: `${colorTokens.info}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CakeIcon sx={{ fontSize: 32, color: colorTokens.info }} />
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* PERFILES COMPLETOS */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `1px solid ${colorTokens.brand}40`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.brand}80)`
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" sx={{ 
                color: colorTokens.brand, 
                fontWeight: 700,
                lineHeight: 1
              }}>
                {userStats.completionRate.allComplete}%
              </Typography>
              <Typography variant="body2" sx={{ 
                color: colorTokens.neutral1000,
                mt: 0.5,
                fontWeight: 500
              }}>
                Perfiles Completos
              </Typography>
              <Typography variant="caption" sx={{ 
                color: colorTokens.neutral800,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 1
              }}>
                <CheckCircleIcon sx={{ fontSize: '1rem' }} />
                con todo listo
              </Typography>
            </Box>
            <Box sx={{
              p: 2,
              borderRadius: '50%',
              bgcolor: `${colorTokens.brand}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <VerifiedIcon sx={{ fontSize: 32, color: colorTokens.brand }} />
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* VERIFICADOS */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Paper sx={{
          p: 3,
          background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
          border: `1px solid ${colorTokens.warning}40`,
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${colorTokens.warning}, ${colorTokens.warning}80)`
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h3" sx={{ 
                color: colorTokens.warning, 
                fontWeight: 700,
                lineHeight: 1
              }}>
                {verifiedCount}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: colorTokens.neutral1000,
                mt: 0.5,
                fontWeight: 500
              }}>
                Verificados
              </Typography>
              <Typography variant="caption" sx={{ 
                color: colorTokens.neutral800,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 1
              }}>
                <VerifiedIcon sx={{ fontSize: '1rem' }} />
                con huella dactilar
              </Typography>
            </Box>
            <Box sx={{
              p: 2,
              borderRadius: '50%',
              bgcolor: `${colorTokens.warning}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <VerifiedIcon sx={{ fontSize: 32, color: colorTokens.warning }} />
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
});

UserStatsCards.displayName = 'UserStatsCards';

export default UserStatsCards;