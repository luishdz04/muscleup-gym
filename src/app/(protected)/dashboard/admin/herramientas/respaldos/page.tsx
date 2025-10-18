'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { Grid } from '@mui/material';
import { toast } from 'react-hot-toast';
import { colorTokens } from '@/theme';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import BackupIcon from '@mui/icons-material/Backup';
import StorageIcon from '@mui/icons-material/Storage';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface BackupFile {
  id: string;
  filename: string;
  type: 'manual' | 'automatic';
  size: number;
  sizeFormatted: string;
  createdAt: string;
  status: 'ok' | 'error';
}

interface BackupsResponse {
  success: boolean;
  backups: BackupFile[];
  total: number;
  totalSize: number;
  totalSizeFormatted: string;
}

export default function RespaldosPage() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [totalSize, setTotalSize] = useState('0 Bytes');
  const [exportDialog, setExportDialog] = useState(false);

  // Estados para exportación
  const [exportOptions, setExportOptions] = useState({
    includeUsers: true,
    includeMemberships: true,
    includePayments: true,
    includePlans: true,
    includeInventory: false,
    includeSettings: false
  });

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const res = await fetch('/api/backups');
      if (res.ok) {
        const data: BackupsResponse = await res.json();
        setBackups(data.backups);
        setTotalSize(data.totalSizeFormatted);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      toast.error('Error al cargar backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/backups/create', {
        method: 'POST'
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success('Backup creado exitosamente');
        loadBackups();
      } else {
        toast.error(data.message || 'Error al crear backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error al crear backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      toast.loading('Descargando backup...', { id: 'download' });

      const res = await fetch(`/api/backups/${filename}`);
      if (!res.ok) throw new Error('Error al descargar');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Backup descargado exitosamente', { id: 'download' });
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Error al descargar backup', { id: 'download' });
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`¿Estás seguro de eliminar el backup "${filename}"?`)) return;

    try {
      const res = await fetch(`/api/backups/${filename}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Backup eliminado exitosamente');
        loadBackups();
      } else {
        toast.error('Error al eliminar backup');
      }
    } catch (error) {
      console.error('Error deleting backup:', error);
      toast.error('Error al eliminar backup');
    }
  };

  const handleExportToExcel = async () => {
    setExporting(true);
    try {
      toast.loading('Generando archivo Excel...', { id: 'export' });

      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportOptions)
      });

      if (!res.ok) throw new Error('Error al exportar');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `muscleup_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Datos exportados exitosamente', { id: 'export' });
      setExportDialog(false);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error al exportar datos', { id: 'export' });
    } finally {
      setExporting(false);
    }
  };

  const lastBackup = backups.length > 0 ? backups[0] : null;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        💾 Respaldo de Datos
      </Typography>

      {/* Información sobre Supabase PRO Backups */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          🏆 Backups Automáticos de Supabase PRO Activos
        </Typography>
        <Typography variant="body2">
          Tu plan Supabase PRO incluye backups automáticos diarios con retención de 7 días y Point-in-Time Recovery.
          Los backups manuales que crees aquí son complementarios y se guardan localmente en formato JSON para mayor control.
        </Typography>
        <Button
          size="small"
          variant="outlined"
          sx={{ mt: 1.5 }}
          href="https://supabase.com/dashboard/project/tyuuyqypgwvdtpfvumxx/settings/backups"
          target="_blank"
        >
          Ver Backups Automáticos en Supabase →
        </Button>
      </Alert>

      {/* Sección 1: Estado del Sistema */}
      <Card elevation={3} sx={{ mb: 3, bgcolor: colorTokens.neutral300, border: `1px solid ${colorTokens.border}` }}>
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <StorageIcon sx={{ fontSize: 40, color: colorTokens.brand }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: colorTokens.textPrimary }}>
                Estado del Sistema de Respaldo
              </Typography>
            </Box>

            <Divider sx={{ borderColor: colorTokens.divider }} />

            <Grid container spacing={{ xs: 2, sm: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: colorTokens.neutral400, borderRadius: 2, border: `1px solid ${colorTokens.border}` }}>
                  <CheckCircleIcon sx={{ fontSize: 30, color: colorTokens.success, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Último Respaldo
                  </Typography>
                  <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    {lastBackup ? new Date(lastBackup.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: colorTokens.neutral400, borderRadius: 2, border: `1px solid ${colorTokens.border}` }}>
                  <BackupIcon sx={{ fontSize: 30, color: colorTokens.info, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Total de Respaldos
                  </Typography>
                  <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    {backups.length}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: colorTokens.neutral400, borderRadius: 2, border: `1px solid ${colorTokens.border}` }}>
                  <StorageIcon sx={{ fontSize: 30, color: colorTokens.warning, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Espacio Usado
                  </Typography>
                  <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    {totalSize}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ textAlign: 'center', p: 2, bgcolor: colorTokens.neutral400, borderRadius: 2, border: `1px solid ${colorTokens.border}` }}>
                  <ScheduleIcon sx={{ fontSize: 30, color: colorTokens.info, mb: 1 }} />
                  <Typography variant="body2" sx={{ color: colorTokens.textSecondary }}>
                    Tipo
                  </Typography>
                  <Typography variant="h6" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    Manual
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                color="primary"
                startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <BackupIcon />}
                onClick={handleCreateBackup}
                disabled={creating}
              >
                {creating ? 'Creando Respaldo...' : 'Crear Respaldo Ahora'}
              </Button>

              <Button
                variant="outlined"
                size="large"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={() => setExportDialog(true)}
              >
                Exportar a Excel
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Sección 2: Respaldos Disponibles */}
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📦 Respaldos Disponibles
          </Typography>
        </Box>

        {backups.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <BackupIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No hay respaldos disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Crea tu primer respaldo haciendo clic en el botón de arriba
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha/Hora</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Nombre del Archivo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Tamaño</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id} hover>
                    <TableCell>
                      {new Date(backup.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DescriptionIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {backup.filename}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={backup.type === 'manual' ? 'Manual' : 'Automático'}
                        color={backup.type === 'manual' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {backup.sizeFormatted}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={backup.status === 'ok' ? 'OK' : 'Error'}
                        color={backup.status === 'ok' ? 'success' : 'error'}
                        size="small"
                        icon={<CheckCircleIcon />}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownloadBackup(backup.filename)}
                          title="Descargar"
                        >
                          <DownloadIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteBackup(backup.filename)}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Dialog de Exportación a Excel */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FileDownloadIcon color="primary" />
            <Typography variant="h6">Exportar Datos a Excel</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Selecciona qué datos deseas exportar. Se generará un archivo Excel con pestañas separadas para cada categoría.
          </Typography>

          <Stack spacing={1.5}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.includeUsers}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeUsers: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Usuarios y Clientes</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Información completa de todos los usuarios registrados
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.includeMemberships}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeMemberships: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Membresías</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Historial completo de membresías activas e inactivas
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.includePayments}
                  onChange={(e) => setExportOptions({ ...exportOptions, includePayments: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Historial de Pagos</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Registro completo de todos los pagos realizados
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.includePlans}
                  onChange={(e) => setExportOptions({ ...exportOptions, includePlans: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Planes y Servicios</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Catálogo de planes de membresía disponibles
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.includeInventory}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeInventory: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Inventario y Productos</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Stock y precios de productos en inventario
                  </Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={exportOptions.includeSettings}
                  onChange={(e) => setExportOptions({ ...exportOptions, includeSettings: e.target.checked })}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Configuración del Gimnasio</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Configuración general del sistema
                  </Typography>
                </Box>
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setExportDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
            onClick={handleExportToExcel}
            disabled={exporting || Object.values(exportOptions).every(v => !v)}
          >
            {exporting ? 'Exportando...' : 'Exportar a Excel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
