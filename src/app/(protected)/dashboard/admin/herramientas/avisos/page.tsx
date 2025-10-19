"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import { Grid } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { colorTokens } from '@/theme';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Campaign as CampaignIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { formatTimestampDateOnly } from '@/utils/dateUtils';

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
  updated_at: string;
}

export default function AvisosPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    priority: 0,
    is_active: true,
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchAllAnnouncements();
  }, []);

  const fetchAllAnnouncements = async () => {
    try {
      setLoading(true);
      // Fetch all announcements (not just active ones) for admin
      const response = await fetch('/api/announcements/admin', {
        method: 'GET'
      });

      if (!response.ok) {
        // Fallback to regular endpoint if admin endpoint doesn't exist
        const regularResponse = await fetch('/api/announcements');
        if (!regularResponse.ok) {
          throw new Error('Error al cargar anuncios');
        }
        const result = await regularResponse.json();
        setAnnouncements(result);
      } else {
        const result = await response.json();
        setAnnouncements(result);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        priority: announcement.priority,
        is_active: announcement.is_active,
        start_date: announcement.start_date ? announcement.start_date.split('T')[0] : '',
        end_date: announcement.end_date ? announcement.end_date.split('T')[0] : ''
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        priority: 0,
        is_active: true,
        start_date: '',
        end_date: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      const url = editingId ? `/api/announcements/${editingId}` : '/api/announcements';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar anuncio');
      }

      await fetchAllAnnouncements();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving announcement:', err);
      alert(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar anuncio');
      }

      await fetchAllAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert(err instanceof Error ? err.message : 'Error al eliminar');
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      info: 'Información',
      warning: 'Advertencia',
      success: 'Éxito',
      error: 'Error'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colorTokens.brand }} />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: { xs: 10, lg: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" sx={{
            fontWeight: 800,
            color: colorTokens.textPrimary,
            mb: 1,
            fontSize: { xs: '1.75rem', sm: '2.5rem' }
          }}>
            Avisos para <Box component="span" sx={{ color: colorTokens.brand }}>Clientes</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
            Gestiona los mensajes y anuncios que ven los clientes en su dashboard
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: colorTokens.brand,
            color: colorTokens.black,
            fontWeight: 700,
            px: 3,
            py: 1.5,
            borderRadius: 2,
            '&:hover': {
              bgcolor: alpha(colorTokens.brand, 0.9)
            }
          }}
        >
          Nuevo Aviso
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {/* Table */}
      <Paper sx={{
        background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.9)}, ${alpha(colorTokens.surfaceLevel3, 0.85)})`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(colorTokens.brand, 0.1)}`,
        borderRadius: 3,
        overflow: 'hidden'
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{
                '& th': {
                  bgcolor: alpha(colorTokens.black, 0.2),
                  color: colorTokens.textSecondary,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  py: 2
                }
              }}>
                <TableCell>Título</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="center">Prioridad</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell>Vigencia</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <CampaignIcon sx={{ fontSize: 64, color: colorTokens.textSecondary, mb: 2 }} />
                    <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                      No hay avisos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((announcement) => (
                  <TableRow
                    key={announcement.id}
                    sx={{
                      '&:hover': {
                        bgcolor: alpha(colorTokens.brand, 0.05)
                      }
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: colorTokens.textPrimary }}>
                        {announcement.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mt: 0.5 }}>
                        {announcement.message.substring(0, 80)}
                        {announcement.message.length > 80 && '...'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getTypeLabel(announcement.type)}
                        size="small"
                        sx={{
                          bgcolor: alpha(getTypeColor(announcement.type), 0.1),
                          color: getTypeColor(announcement.type),
                          border: `1px solid ${alpha(getTypeColor(announcement.type), 0.2)}`,
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={announcement.priority}
                        size="small"
                        sx={{
                          bgcolor: alpha(colorTokens.brand, 0.1),
                          color: colorTokens.brand,
                          fontWeight: 700
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {announcement.is_active ? (
                        <Chip
                          icon={<VisibilityIcon />}
                          label="Activo"
                          size="small"
                          sx={{
                            bgcolor: alpha(colorTokens.success, 0.1),
                            color: colorTokens.success,
                            border: `1px solid ${alpha(colorTokens.success, 0.2)}`,
                            fontWeight: 600
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<VisibilityOffIcon />}
                          label="Inactivo"
                          size="small"
                          sx={{
                            bgcolor: alpha(colorTokens.textSecondary, 0.1),
                            color: colorTokens.textSecondary,
                            border: `1px solid ${alpha(colorTokens.textSecondary, 0.2)}`,
                            fontWeight: 600
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        {announcement.start_date
                          ? `Desde: ${formatTimestampDateOnly(announcement.start_date)}`
                          : 'Sin inicio'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                        {announcement.end_date
                          ? `Hasta: ${formatTimestampDateOnly(announcement.end_date)}`
                          : 'Sin fin'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          onClick={() => handleOpenDialog(announcement)}
                          sx={{ color: colorTokens.info }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          onClick={() => handleDelete(announcement.id)}
                          sx={{ color: colorTokens.danger }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: `linear-gradient(135deg, ${alpha(colorTokens.surfaceLevel2, 0.95)}, ${alpha(colorTokens.surfaceLevel3, 0.9)})`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${alpha(colorTokens.brand, 0.2)}`
          }
        }}
      >
        <DialogTitle sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
          {editingId ? 'Editar Aviso' : 'Nuevo Aviso'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Mensaje"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Tipo"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                <MenuItem value="info">Información</MenuItem>
                <MenuItem value="success">Éxito</MenuItem>
                <MenuItem value="warning">Advertencia</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Prioridad"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                helperText="Mayor número = mayor prioridad"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de inicio (opcional)"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de fin (opcional)"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: colorTokens.brand
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        bgcolor: colorTokens.brand
                      }
                    }}
                  />
                }
                label="Aviso activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} sx={{ color: colorTokens.textSecondary }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.title || !formData.message}
            sx={{
              bgcolor: colorTokens.brand,
              color: colorTokens.black,
              fontWeight: 700,
              '&:hover': {
                bgcolor: alpha(colorTokens.brand, 0.9)
              }
            }}
          >
            {editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
