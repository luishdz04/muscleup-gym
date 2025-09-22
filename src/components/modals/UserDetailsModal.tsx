// components/modals/UserFormModal.tsx - Modal para crear/editar usuarios
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Avatar,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PhotoCamera,
  Close as CloseIcon,
  Save as SaveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { User } from '@/types/user';
import { useUsers } from '@/hooks/useUsers';
import { useFileStorage } from '@/hooks/useFileStorage';
import { useNotifications } from '@/hooks/useNotifications';
import { CreateUserData } from '@/services/userService';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
  onSave: (user: User) => void;
}

export default function UserFormModal({ open, onClose, user, onSave }: UserFormModalProps) {
  const { toast } = useNotifications();
  const { saveUser } = useUsers();
  const { uploadFile, uploading } = useFileStorage({
    maxSizeKB: 2000,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateUserData>({
    firstName: '',
    lastName: '',
    email: '',
    rol: 'cliente',
    whatsapp: '',
    birthDate: '',
    gender: 'masculino',
    maritalStatus: '',
    isMinor: false,
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'México',
    },
    emergency: {
      name: '',
      phone: '',
      medicalCondition: '',
      bloodType: '',
    },
    membership: {
      referredBy: '',
      mainMotivation: '',
      receivePlans: false,
      trainingLevel: 'principiante',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🔄 CARGAR DATOS DEL USUARIO AL ABRIR MODAL DE EDICIÓN
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        rol: user.rol || 'cliente',
        whatsapp: user.whatsapp || '',
        birthDate: user.birthDate || '',
        gender: user.gender || 'masculino',
        maritalStatus: user.maritalStatus || '',
        isMinor: user.isMinor || false,
        address: user.address || {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'México',
        },
        emergency: user.emergency || {
          name: '',
          phone: '',
          medicalCondition: '',
          bloodType: '',
        },
        membership: user.membership || {
          referredBy: '',
          mainMotivation: '',
          receivePlans: false,
          trainingLevel: 'principiante',
        },
      });
      setProfileImage(user.profilePictureUrl || null);
    }
  }, [user]);

  // 📝 MANEJAR CAMBIOS EN FORMULARIO
  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CreateUserData],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }

    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 🖼️ SUBIR FOTO DE PERFIL
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user?.id && !formData.email) {
      toast.error('Guarda el usuario primero antes de subir la foto');
      return;
    }

    const userId = user?.id || `temp_${formData.email}`;
    const result = await uploadFile(file, userId, 'profile');

    if (result.success && result.url) {
      setProfileImage(result.url);
      toast.success('Foto de perfil subida correctamente');
    }
  };

  // ✅ VALIDAR FORMULARIO
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Nombre es requerido';
    if (!formData.lastName.trim()) newErrors.lastName = 'Apellido es requerido';
    if (!formData.email.trim()) newErrors.email = 'Email es requerido';
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'WhatsApp es requerido';
    if (!formData.birthDate) newErrors.birthDate = 'Fecha de nacimiento es requerida';

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email no válido';
    }

    // Validar WhatsApp
    const phoneRegex = /^\+?[\d\s-()]+$/;
    if (formData.whatsapp && !phoneRegex.test(formData.whatsapp)) {
      newErrors.whatsapp = 'WhatsApp no válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 💾 GUARDAR USUARIO
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        ...formData,
        ...(profileImage && { profilePictureUrl: profileImage }),
      };

      const success = await saveUser(user ? { ...userData, id: user.id } : userData);
      
      if (success) {
        onSave(userData as User);
        handleClose();
      }

    } catch (error) {
      toast.error('Error inesperado al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  // ❌ CERRAR MODAL
  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      rol: 'cliente',
      whatsapp: '',
      birthDate: '',
      gender: 'masculino',
      maritalStatus: '',
      isMinor: false,
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'México',
      },
      emergency: {
        name: '',
        phone: '',
        medicalCondition: '',
        bloodType: '',
      },
      membership: {
        referredBy: '',
        mainMotivation: '',
        receivePlans: false,
        trainingLevel: 'principiante',
      },
    });
    setErrors({});
    setProfileImage(null);
    onClose();
  };

  const isEditMode = !!user;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            {isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* FOTO DE PERFIL */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              src={profileImage || undefined}
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                fontSize: '2rem',
              }}
            >
              {!profileImage && <PersonIcon />}
            </Avatar>
            <Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
                disabled={uploading}
                sx={{ mb: 1 }}
              >
                {uploading ? 'Subiendo...' : 'Subir Foto'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              <Typography variant="caption" display="block" color="text.secondary">
                Máximo 2MB - JPG, PNG, WebP
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* INFORMACIÓN BÁSICA */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                Información Básica
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nombre *"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Apellido *"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={formData.rol}
                  onChange={(e) => handleChange('rol', e.target.value)}
                >
                  <MenuItem value="cliente">Cliente</MenuItem>
                  <MenuItem value="empleado">Empleado</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="WhatsApp *"
                value={formData.whatsapp}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                error={!!errors.whatsapp}
                helperText={errors.whatsapp}
                placeholder="+52 123 456 7890"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento *"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                error={!!errors.birthDate}
                helperText={errors.birthDate}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Género</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value)}
                >
                  <MenuItem value="masculino">Masculino</MenuItem>
                  <MenuItem value="femenino">Femenino</MenuItem>
                  <MenuItem value="otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Estado Civil"
                value={formData.maritalStatus}
                onChange={(e) => handleChange('maritalStatus', e.target.value)}
                placeholder="Soltero, Casado, etc."
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isMinor}
                    onChange={(e) => handleChange('isMinor', e.target.checked)}
                  />
                }
                label="Es menor de edad"
              />
            </Grid>

            {/* DIRECCIÓN */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" color="primary" gutterBottom>
                Dirección
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                label="Calle"
                value={formData.address?.street || ''}
                onChange={(e) => handleChange('address.street', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Número"
                value={formData.address?.number || ''}
                onChange={(e) => handleChange('address.number', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Colonia"
                value={formData.address?.neighborhood || ''}
                onChange={(e) => handleChange('address.neighborhood', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Ciudad"
                value={formData.address?.city || ''}
                onChange={(e) => handleChange('address.city', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Estado"
                value={formData.address?.state || ''}
                onChange={(e) => handleChange('address.state', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Código Postal"
                value={formData.address?.postalCode || ''}
                onChange={(e) => handleChange('address.postalCode', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="País"
                value={formData.address?.country || 'México'}
                onChange={(e) => handleChange('address.country', e.target.value)}
              />
            </Grid>

            {/* CONTACTO DE EMERGENCIA */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" color="primary" gutterBottom>
                Contacto de Emergencia
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Nombre del contacto"
                value={formData.emergency?.name || ''}
                onChange={(e) => handleChange('emergency.name', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Teléfono del contacto"
                value={formData.emergency?.phone || ''}
                onChange={(e) => handleChange('emergency.phone', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Condición médica"
                value={formData.emergency?.medicalCondition || ''}
                onChange={(e) => handleChange('emergency.medicalCondition', e.target.value)}
                placeholder="Alergias, medicamentos, etc."
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Tipo de sangre"
                value={formData.emergency?.bloodType || ''}
                onChange={(e) => handleChange('emergency.bloodType', e.target.value)}
                placeholder="O+, A-, etc."
              />
            </Grid>

            {/* INFORMACIÓN DE MEMBRESÍA */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" color="primary" gutterBottom>
                Información de Membresía
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Referido por"
                value={formData.membership?.referredBy || ''}
                onChange={(e) => handleChange('membership.referredBy', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Nivel de entrenamiento</InputLabel>
                <Select
                  value={formData.membership?.trainingLevel || 'principiante'}
                  onChange={(e) => handleChange('membership.trainingLevel', e.target.value)}
                >
                  <MenuItem value="principiante">Principiante</MenuItem>
                  <MenuItem value="intermedio">Intermedio</MenuItem>
                  <MenuItem value="avanzado">Avanzado</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Motivación principal"
                value={formData.membership?.mainMotivation || ''}
                onChange={(e) => handleChange('membership.mainMotivation', e.target.value)}
                placeholder="¿Por qué quiere entrenar?"
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.membership?.receivePlans || false}
                    onChange={(e) => handleChange('membership.receivePlans', e.target.checked)}
                  />
                }
                label="Recibir planes de entrenamiento por email"
              />
            </Grid>
          </Grid>

          {/* ERRORES GENERALES */}
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Por favor corrige los errores marcados en el formulario
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || uploading}
          startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
        >
          {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}