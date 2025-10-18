'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import { toast } from 'react-hot-toast';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import PaymentIcon from '@mui/icons-material/Payment';

interface TabPanelProps {
  children?: React.Node;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface GymSettings {
  id: string;
  gym_name: string;
  gym_address: string;
  gym_phone: string;
  gym_email: string | null;
  gym_logo_url: string | null;
  gym_facebook_url: string;
  gym_maps_url: string;
  gym_hours: Record<string, { open: string; close: string; enabled: boolean }>;
}

interface PaymentCommission {
  id: string;
  payment_method: string;
  commission_type: string;
  commission_value: number;
  min_amount: number;
  is_active: boolean;
}

export default function ConfiguracionGeneralPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para Gym Settings
  const [gymSettings, setGymSettings] = useState<GymSettings | null>(null);
  const [gymForm, setGymForm] = useState({
    gym_name: '',
    gym_address: '',
    gym_phone: '',
    gym_email: '',
    gym_logo_url: '',
    gym_facebook_url: '',
    gym_maps_url: '',
    gym_hours: {}
  });

  // Estados para Payment Commissions
  const [commissions, setCommissions] = useState<PaymentCommission[]>([]);
  const [commissionDialog, setCommissionDialog] = useState(false);
  const [editingCommission, setEditingCommission] = useState<PaymentCommission | null>(null);
  const [commissionForm, setCommissionForm] = useState({
    payment_method: '',
    commission_type: 'percentage',
    commission_value: 0,
    min_amount: 0,
    is_active: true
  });

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  useEffect(() => {
    loadGymSettings();
    loadCommissions();
  }, []);

  const loadGymSettings = async () => {
    try {
      const res = await fetch('/api/gym-settings');
      if (res.ok) {
        const data = await res.json();
        setGymSettings(data);
        setGymForm({
          gym_name: data.gym_name || '',
          gym_address: data.gym_address || '',
          gym_phone: data.gym_phone || '',
          gym_email: data.gym_email || '',
          gym_logo_url: data.gym_logo_url || '',
          gym_facebook_url: data.gym_facebook_url || '',
          gym_maps_url: data.gym_maps_url || '',
          gym_hours: data.gym_hours || {}
        });
      }
    } catch (error) {
      console.error('Error loading gym settings:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const loadCommissions = async () => {
    try {
      const res = await fetch('/api/payment-commissions');
      if (res.ok) {
        const data = await res.json();
        setCommissions(data);
      }
    } catch (error) {
      console.error('Error loading commissions:', error);
    }
  };

  const handleSaveGymSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/gym-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gymForm)
      });

      if (res.ok) {
        toast.success('Configuración guardada exitosamente');
        loadGymSettings();
      } else {
        toast.error('Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving gym settings:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCommission = async () => {
    try {
      const url = editingCommission
        ? `/api/payment-commissions/${editingCommission.id}`
        : '/api/payment-commissions';

      const method = editingCommission ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commissionForm)
      });

      if (res.ok) {
        toast.success(
          editingCommission
            ? 'Comisión actualizada exitosamente'
            : 'Comisión creada exitosamente'
        );
        loadCommissions();
        setCommissionDialog(false);
        resetCommissionForm();
      } else {
        toast.error('Error al guardar comisión');
      }
    } catch (error) {
      console.error('Error saving commission:', error);
      toast.error('Error al guardar comisión');
    }
  };

  const handleDeleteCommission = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta comisión?')) return;

    try {
      const res = await fetch(`/api/payment-commissions/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Comisión eliminada exitosamente');
        loadCommissions();
      } else {
        toast.error('Error al eliminar comisión');
      }
    } catch (error) {
      console.error('Error deleting commission:', error);
      toast.error('Error al eliminar comisión');
    }
  };

  const openCommissionDialog = (commission?: PaymentCommission) => {
    if (commission) {
      setEditingCommission(commission);
      setCommissionForm({
        payment_method: commission.payment_method,
        commission_type: commission.commission_type,
        commission_value: commission.commission_value,
        min_amount: commission.min_amount,
        is_active: commission.is_active
      });
    }
    setCommissionDialog(true);
  };

  const resetCommissionForm = () => {
    setEditingCommission(null);
    setCommissionForm({
      payment_method: '',
      commission_type: 'percentage',
      commission_value: 0,
      min_amount: 0,
      is_active: true
    });
  };

  const handleHourChange = (day: string, field: 'open' | 'close' | 'enabled', value: string | boolean) => {
    setGymForm(prev => ({
      ...prev,
      gym_hours: {
        ...prev.gym_hours,
        [day]: {
          ...(prev.gym_hours[day] || { open: '06:00', close: '23:00', enabled: true }),
          [field]: value
        }
      }
    }));
  };

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
        ⚙️ Configuración General
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          aria-label="configuracion-tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<SettingsIcon />} label="Datos del Gimnasio" />
          <Tab icon={<PaymentIcon />} label="Comisiones de Pago" />
        </Tabs>

        {/* TAB 1: Datos del Gimnasio */}
        <TabPanel value={tabValue} index={0}>
          <Box component="form" noValidate>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Información Básica
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre del Gimnasio"
                  value={gymForm.gym_name}
                  onChange={(e) => setGymForm({ ...gymForm, gym_name: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  value={gymForm.gym_phone}
                  onChange={(e) => setGymForm({ ...gymForm, gym_phone: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dirección"
                  value={gymForm.gym_address}
                  onChange={(e) => setGymForm({ ...gymForm, gym_address: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email (opcional)"
                  type="email"
                  value={gymForm.gym_email}
                  onChange={(e) => setGymForm({ ...gymForm, gym_email: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="URL del Logo (opcional)"
                  value={gymForm.gym_logo_url}
                  onChange={(e) => setGymForm({ ...gymForm, gym_logo_url: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="URL de Facebook"
                  value={gymForm.gym_facebook_url}
                  onChange={(e) => setGymForm({ ...gymForm, gym_facebook_url: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="URL de Google Maps"
                  value={gymForm.gym_maps_url}
                  onChange={(e) => setGymForm({ ...gymForm, gym_maps_url: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
                  Horarios de Operación
                </Typography>
              </Grid>

              {daysOfWeek.map(day => (
                <Grid item xs={12} key={day.key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 100 }}>{day.label}</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={gymForm.gym_hours[day.key]?.enabled || false}
                          onChange={(e) => handleHourChange(day.key, 'enabled', e.target.checked)}
                        />
                      }
                      label="Abierto"
                    />
                    {gymForm.gym_hours[day.key]?.enabled && (
                      <>
                        <TextField
                          type="time"
                          label="Apertura"
                          value={gymForm.gym_hours[day.key]?.open || '06:00'}
                          onChange={(e) => handleHourChange(day.key, 'open', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          size="small"
                        />
                        <TextField
                          type="time"
                          label="Cierre"
                          value={gymForm.gym_hours[day.key]?.close || '23:00'}
                          onChange={(e) => handleHourChange(day.key, 'close', e.target.value)}
                          InputLabelProps={{ shrink: true }}
                          size="small"
                        />
                      </>
                    )}
                  </Box>
                </Grid>
              ))}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSaveGymSettings}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* TAB 2: Comisiones de Pago */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Configuración de Comisiones
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openCommissionDialog()}
            >
              Nueva Comisión
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Método de Pago</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Valor</TableCell>
                  <TableCell align="right">Monto Mínimo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>{commission.payment_method}</TableCell>
                    <TableCell>
                      {commission.commission_type === 'percentage' ? 'Porcentaje' : 'Fijo'}
                    </TableCell>
                    <TableCell align="right">
                      {commission.commission_type === 'percentage'
                        ? `${commission.commission_value}%`
                        : `$${commission.commission_value.toFixed(2)}`}
                    </TableCell>
                    <TableCell align="right">
                      ${commission.min_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={commission.is_active ? 'Activo' : 'Inactivo'}
                        color={commission.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => openCommissionDialog(commission)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCommission(commission.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {commissions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary" sx={{ py: 3 }}>
                        No hay comisiones configuradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Dialog para Comisiones */}
      <Dialog
        open={commissionDialog}
        onClose={() => {
          setCommissionDialog(false);
          resetCommissionForm();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingCommission ? 'Editar Comisión' : 'Nueva Comisión'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Método de Pago"
              value={commissionForm.payment_method}
              onChange={(e) => setCommissionForm({ ...commissionForm, payment_method: e.target.value })}
              placeholder="ej: Tarjeta, Efectivo, Transferencia"
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Comisión</InputLabel>
              <Select
                value={commissionForm.commission_type}
                label="Tipo de Comisión"
                onChange={(e) => setCommissionForm({ ...commissionForm, commission_type: e.target.value })}
              >
                <MenuItem value="percentage">Porcentaje</MenuItem>
                <MenuItem value="fixed">Monto Fijo</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label={commissionForm.commission_type === 'percentage' ? 'Porcentaje (%)' : 'Monto Fijo ($)'}
              type="number"
              value={commissionForm.commission_value}
              onChange={(e) => setCommissionForm({ ...commissionForm, commission_value: parseFloat(e.target.value) || 0 })}
              inputProps={{ step: '0.01', min: '0' }}
            />

            <TextField
              fullWidth
              label="Monto Mínimo ($)"
              type="number"
              value={commissionForm.min_amount}
              onChange={(e) => setCommissionForm({ ...commissionForm, min_amount: parseFloat(e.target.value) || 0 })}
              inputProps={{ step: '0.01', min: '0' }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={commissionForm.is_active}
                  onChange={(e) => setCommissionForm({ ...commissionForm, is_active: e.target.checked })}
                />
              }
              label="Activo"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCommissionDialog(false);
            resetCommissionForm();
          }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCommission}
            disabled={!commissionForm.payment_method}
          >
            {editingCommission ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
