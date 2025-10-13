'use client';

import React, { useState, useEffect } from 'react';
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
  Switch,
  FormControlLabel,
  InputAdornment,
  Typography,
  Stack,
  CircularProgress,
  Divider,
  Box
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
  BusinessCenter as BusinessIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Warning as WarningIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';

type WarehouseType = 'store' | 'central' | 'warehouse' | 'temporary';

interface WarehouseFormData {
  code: string;
  name: string;
  warehouse_type: WarehouseType;
  description: string;
  address: string;
  is_default: boolean;
  max_capacity?: number;
  auto_restock_enabled: boolean;
  min_stock_threshold: number;
}

interface WarehouseFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: WarehouseFormData) => Promise<void>;
  warehouse?: any;
  loading?: boolean;
}

const WAREHOUSE_TYPES = [
  { value: 'store', label: 'Tienda', description: 'Punto de venta directo al cliente', icon: <StoreIcon /> },
  { value: 'central', label: 'Almacén Central', description: 'Distribución y almacenamiento principal', icon: <BusinessIcon /> },
  { value: 'warehouse', label: 'Bodega', description: 'Almacenamiento general', icon: <WarehouseIcon /> },
  { value: 'temporary', label: 'Temporal', description: 'Ubicación temporal o móvil', icon: <LocationIcon /> }
] as const;

export default function WarehouseFormDialog({
  open,
  onClose,
  onSave,
  warehouse,
  loading = false
}: WarehouseFormDialogProps) {
  const isEditing = Boolean(warehouse);

  const [formData, setFormData] = useState<WarehouseFormData>({
    code: '',
    name: '',
    warehouse_type: 'store',
    description: '',
    address: '',
    is_default: false,
    max_capacity: undefined,
    auto_restock_enabled: false,
    min_stock_threshold: 10
  });

  // Cargar datos del almacén al editar
  useEffect(() => {
    if (warehouse) {
      // Convertir address JSONB a string
      let addressStr = '';
      if (warehouse.address) {
        if (typeof warehouse.address === 'string') {
          addressStr = warehouse.address;
        } else if (warehouse.address.street || warehouse.address.city) {
          const parts = [];
          if (warehouse.address.street) parts.push(warehouse.address.street);
          if (warehouse.address.city) parts.push(warehouse.address.city);
          addressStr = parts.join(', ');
        }
      }

      setFormData({
        code: warehouse.code || '',
        name: warehouse.name || '',
        warehouse_type: warehouse.warehouse_type || 'store',
        description: warehouse.description || '',
        address: addressStr,
        is_default: warehouse.is_default || false,
        max_capacity: warehouse.max_capacity,
        auto_restock_enabled: warehouse.auto_restock_enabled || false,
        min_stock_threshold: warehouse.min_stock_threshold || 0.2
      });
    } else {
      // Reset form cuando no es edición
      setFormData({
        code: '',
        name: '',
        warehouse_type: 'store',
        description: '',
        address: '',
        is_default: false,
        max_capacity: undefined,
        auto_restock_enabled: false,
        min_stock_threshold: 0.2
      });
    }
  }, [warehouse, open]);

  const handleChange = (field: keyof WarehouseFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) return;
    
    // Convertir address string a JSONB
    let addressJson: any = {};
    if (formData.address && formData.address.trim()) {
      const addressParts = formData.address.split(',').map(p => p.trim());
      addressJson = {
        street: addressParts[0] || '',
        city: addressParts[1] || ''
      };
    }
    
    const dataToSave = {
      code: formData.code,
      name: formData.name,
      warehouse_type: formData.warehouse_type,
      description: formData.description,
      address: addressJson,
      is_default: formData.is_default,
      max_capacity: formData.max_capacity,
      auto_restock_enabled: formData.auto_restock_enabled,
      min_stock_threshold: formData.min_stock_threshold
    };
    
    console.log('📦 Datos a guardar:', dataToSave);
    
    await onSave(dataToSave as any);
  };

  const selectedType = WAREHOUSE_TYPES.find(t => t.value === formData.warehouse_type);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: colorTokens.neutral50,
          borderRadius: 4,
          boxShadow: `0 20px 60px ${colorTokens.neutral900}40`
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 3, 
        background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.info}10)`,
        borderBottom: `2px solid ${colorTokens.brand}30`
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          {isEditing ? <EditIcon sx={{ color: colorTokens.brand, fontSize: 32 }} /> : <AddIcon sx={{ color: colorTokens.brand, fontSize: 32 }} />}
          <Box>
            <Typography variant="h5" sx={{ color: colorTokens.textPrimary, fontWeight: 700 }}>
              {isEditing ? 'Editar Almacén' : 'Crear Nuevo Almacén'}
            </Typography>
            <Typography variant="body2" sx={{ color: colorTokens.textSecondary, mt: 0.5 }}>
              {isEditing ? 'Actualiza la información del almacén' : 'Completa los datos del nuevo almacén'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Grid container spacing={3}>
          {/* Código */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={{ color: colorTokens.textPrimary, mb: 1, fontWeight: 600 }}>
              Código *
            </Typography>
            <TextField
              fullWidth
              required
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder="Ej: MUP01"
              disabled={isEditing} // No permitir cambiar código al editar
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <InventoryIcon sx={{ color: colorTokens.brand, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colorTokens.neutral100,
                  '& fieldset': { borderColor: colorTokens.neutral400 },
                  '&:hover fieldset': { borderColor: colorTokens.brand },
                  '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
                },
                '& .MuiInputBase-input': { color: colorTokens.textPrimary }
              }}
            />
          </Grid>

          {/* Nombre */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={{ color: colorTokens.textPrimary, mb: 1, fontWeight: 600 }}>
              Nombre *
            </Typography>
            <TextField
              fullWidth
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ej: ALMACÉN PRINCIPAL"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WarehouseIcon sx={{ color: colorTokens.info, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colorTokens.neutral100,
                  '& fieldset': { borderColor: colorTokens.neutral400 },
                  '&:hover fieldset': { borderColor: colorTokens.info },
                  '&.Mui-focused fieldset': { borderColor: colorTokens.info }
                },
                '& .MuiInputBase-input': { color: colorTokens.textPrimary }
              }}
            />
          </Grid>

          {/* Tipo de Almacén */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ color: colorTokens.textPrimary, mb: 1, fontWeight: 600 }}>
              Tipo de Almacén *
            </Typography>
            <FormControl fullWidth>
              <Select
                value={formData.warehouse_type}
                onChange={(e) => handleChange('warehouse_type', e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    {selectedType?.icon}
                  </InputAdornment>
                }
                sx={{
                  backgroundColor: colorTokens.neutral100,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.neutral400 },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colorTokens.brand },
                  '& .MuiSelect-select': { color: colorTokens.textPrimary }
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: colorTokens.neutral200,
                      border: `1px solid ${colorTokens.neutral400}`,
                      mt: 1
                    }
                  }
                }}
              >
                {WAREHOUSE_TYPES.map((type) => (
                  <MenuItem 
                    key={type.value} 
                    value={type.value}
                    sx={{
                      '&:hover': { backgroundColor: colorTokens.neutral300 },
                      '&.Mui-selected': { 
                        backgroundColor: `${colorTokens.brand}15`,
                        '&:hover': { backgroundColor: `${colorTokens.brand}25` }
                      }
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      {type.icon}
                      <Box>
                        <Typography variant="body1" fontWeight={600} sx={{ color: colorTokens.textPrimary }}>
                          {type.label}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                          {type.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Descripción */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ color: colorTokens.textPrimary, mb: 1, fontWeight: 600 }}>
              Descripción
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Ej: ALMACÉN PRINCIPAL MUP"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                    <DescriptionIcon sx={{ color: colorTokens.textSecondary, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colorTokens.neutral100,
                  '& fieldset': { borderColor: colorTokens.neutral400 },
                  '&:hover fieldset': { borderColor: colorTokens.textSecondary },
                  '&.Mui-focused fieldset': { borderColor: colorTokens.textSecondary }
                },
                '& .MuiInputBase-input': { color: colorTokens.textPrimary }
              }}
            />
          </Grid>

          {/* Dirección */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="body2" sx={{ color: colorTokens.textPrimary, mb: 1, fontWeight: 600 }}>
              Dirección
            </Typography>
            <TextField
              fullWidth
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Ej: Calle, número, colonia, ciudad..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon sx={{ color: colorTokens.info, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colorTokens.neutral100,
                  '& fieldset': { borderColor: colorTokens.neutral400 },
                  '&:hover fieldset': { borderColor: colorTokens.info },
                  '&.Mui-focused fieldset': { borderColor: colorTokens.info }
                },
                '& .MuiInputBase-input': { color: colorTokens.textPrimary }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* Capacidad Máxima */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={{ color: colorTokens.textPrimary, mb: 1, fontWeight: 600 }}>
              Capacidad Máxima (opcional)
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={formData.max_capacity || ''}
              onChange={(e) => handleChange('max_capacity', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Ej: 1000"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <InventoryIcon sx={{ color: colorTokens.warning, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colorTokens.neutral100,
                  '& fieldset': { borderColor: colorTokens.neutral400 },
                  '&:hover fieldset': { borderColor: colorTokens.warning },
                  '&.Mui-focused fieldset': { borderColor: colorTokens.warning }
                },
                '& .MuiInputBase-input': { color: colorTokens.textPrimary }
              }}
            />
          </Grid>

          {/* Umbral de Stock Mínimo */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body2" sx={{ color: colorTokens.textPrimary, mb: 1, fontWeight: 600 }}>
              Umbral de Stock Mínimo
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={formData.min_stock_threshold}
              onChange={(e) => handleChange('min_stock_threshold', parseFloat(e.target.value) || 0.2)}
              placeholder="Ej: 0.2"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WarningIcon sx={{ color: colorTokens.warning, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colorTokens.neutral100,
                  '& fieldset': { borderColor: colorTokens.neutral400 },
                  '&:hover fieldset': { borderColor: colorTokens.warning },
                  '&.Mui-focused fieldset': { borderColor: colorTokens.warning }
                },
                '& .MuiInputBase-input': { color: colorTokens.textPrimary }
              }}
            />
          </Grid>

          {/* Switches */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ 
              p: 2, 
              border: `1px solid ${colorTokens.neutral400}`, 
              borderRadius: 2,
              backgroundColor: colorTokens.neutral100
            }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.is_default}
                    onChange={(e) => handleChange('is_default', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.brand },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.brand },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    Almacén por defecto
                  </Typography>
                }
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ 
              p: 2, 
              border: `1px solid ${colorTokens.neutral400}`, 
              borderRadius: 2,
              backgroundColor: colorTokens.neutral100
            }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={formData.auto_restock_enabled}
                    onChange={(e) => handleChange('auto_restock_enabled', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: colorTokens.success },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colorTokens.success },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: colorTokens.textPrimary, fontWeight: 600 }}>
                    Reabastecimiento automático
                  </Typography>
                }
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${colorTokens.border}`, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{ 
            color: colorTokens.textSecondary,
            px: 4, py: 1.5, borderRadius: 3, fontWeight: 600,
            '&:hover': { backgroundColor: `${colorTokens.textSecondary}10` }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!formData.code || !formData.name || loading}
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 4, py: 1.5, borderRadius: 3,
            boxShadow: `0 4px 20px ${colorTokens.brand}40`,
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
              transform: 'translateY(-2px)',
              boxShadow: `0 6px 25px ${colorTokens.brand}50`
            },
            '&:disabled': {
              background: colorTokens.neutral400,
              color: colorTokens.textMuted,
              transform: 'none',
              boxShadow: 'none'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {loading ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={20} sx={{ color: colorTokens.textOnBrand }} />
              <Typography>{isEditing ? 'Actualizando...' : 'Creando...'}</Typography>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="center" spacing={1}>
              {isEditing ? <EditIcon /> : <AddIcon />}
              <Typography>{isEditing ? 'Actualizar Almacén' : 'Crear Almacén'}</Typography>
            </Stack>
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


