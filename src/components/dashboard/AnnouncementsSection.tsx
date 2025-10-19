"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Collapse
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { colorTokens } from '@/theme';
import {
  Campaign as CampaignIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/announcements');

      if (!response.ok) {
        throw new Error('Error al cargar anuncios');
      }

      const result = await response.json();
      setAnnouncements(result);
      setError(null);
      console.log('✅ [ANNOUNCEMENTS-SECTION] Loaded', result.length, 'announcements');
    } catch (err) {
      console.error('❌ [ANNOUNCEMENTS-SECTION] Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ color: colorTokens.success }} />;
      case 'warning':
        return <WarningIcon sx={{ color: colorTokens.warning }} />;
      case 'error':
        return <ErrorIcon sx={{ color: colorTokens.danger }} />;
      default:
        return <InfoIcon sx={{ color: colorTokens.info }} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return colorTokens.success;
      case 'warning':
        return colorTokens.warning;
      case 'error':
        return colorTokens.danger;
      default:
        return colorTokens.info;
    }
  };

  if (loading) {
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
        minHeight: 150
      }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Paper>
    );
  }

  if (error) {
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

  if (announcements.length === 0) {
    return null; // Don't show anything if no announcements
  }

  return (
    <Paper sx={{
      p: { xs: 2, sm: 3 },
      background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
      borderRadius: 3
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <CampaignIcon sx={{ color: colorTokens.brand, fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: colorTokens.textPrimary }}>
          Anuncios Importantes
        </Typography>
      </Box>

      {/* Announcements List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {announcements.map((announcement) => {
          const isExpanded = expandedIds.has(announcement.id);
          const typeColor = getTypeColor(announcement.type);
          const isLongMessage = announcement.message.length > 150;

          return (
            <Paper
              key={announcement.id}
              sx={{
                p: 2,
                background: alpha(typeColor, 0.05),
                border: `1px solid ${alpha(typeColor, 0.2)}`,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: `0 4px 12px ${alpha(typeColor, 0.2)}`
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {/* Icon */}
                <Box sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: alpha(typeColor, 0.1),
                  border: `1px solid ${alpha(typeColor, 0.2)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {getTypeIcon(announcement.type)}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{
                    fontWeight: 700,
                    color: colorTokens.textPrimary,
                    mb: 1
                  }}>
                    {announcement.title}
                  </Typography>

                  {isLongMessage ? (
                    <>
                      <Typography variant="body2" sx={{
                        color: colorTokens.textSecondary,
                        mb: 1
                      }}>
                        {isExpanded ? announcement.message : `${announcement.message.substring(0, 150)}...`}
                      </Typography>
                      <Box
                        onClick={() => toggleExpand(announcement.id)}
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          cursor: 'pointer',
                          color: typeColor,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {isExpanded ? 'Ver menos' : 'Ver más'}
                        <ExpandMoreIcon sx={{
                          fontSize: 20,
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s ease'
                        }} />
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{
                      color: colorTokens.textSecondary
                    }}>
                      {announcement.message}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Paper>
  );
}
