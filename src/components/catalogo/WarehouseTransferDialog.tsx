// 📁 src/components/catalogo/WarehouseTransferDialog.tsx - TRANSFERENCIAS REALES
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  Warehouse as WarehouseIcon,
  ArrowForward as ArrowIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { useUserTracking } from '@/hooks/useUserTracking';
import { notify } from '@/utils/notifications';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface ProductStock {
  id: string;
  name: string;
  sku?: string;
  current_stock: number;
  unit?: string;
}

// Tipos locales para evitar conflictos
interface WarehouseStock {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  current_stock: number;
  available_stock: number;
}

interface WarehouseBasicLocal {
  id: string;
  code: string;
  name: string;
  description?: string;
  warehouse_type?: string;
  is_active: boolean;
  is_default?: boolean;
}

interface TransferFormData {
  sourceWarehouseId: string;
  targetWarehouseId: string;
  quantity: number;
  reason: string;
  notes: string;
}

interface WarehouseTransferDialogProps {
  open: boolean;
  onClose: () => void;
  product?: ProductStock | null;
  onSave: () => void;
}

export default function WarehouseTransferDialog({
  open,
  onClose,
  product,
  onSave
}: WarehouseTransferDialogProps) {
  const [formData, setFormData] = useState<TransferFormData>({
    sourceWarehouseId: '',
    targetWarehouseId: '',
    quantity: 0,
    reason: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const supabase = createBrowserSupabaseClient();

  // Cargar almacenes - QUERY CORREGIDO
  const { data: warehouses } = useEntityCRUD({
    tableName: 'warehouses',
    selectQuery: `
      id, code, name, description, warehouse_type, 
      is_active, is_default, manager_user_id,
      created_at, updated_at
    `
  });

  // Cargar stocks por almacén del producto - QUERY CORREGIDO
  const loadWarehouseStocks = useCallback(async () => {
    if (!product?.id) return;

    try {
      // Primero obtener stocks
      const { data: stockData, error: stockError } = await supabase
        .from('product_warehouse_stock')
        .select(`
          warehouse_id,
          current_stock,
          reserved_stock,
          available_stock
        `)
        .eq('product_id', product.id);

      if (stockError) throw stockError;

      // Luego obtener información de warehouses
      const { data: warehouseData, error: warehouseError } = await supabase
        .from('warehouses')
        .select('id, name, code, is_active')
        .eq('is_active', true);

      if (warehouseError) throw warehouseError;

      // Combinar datos
      const stocks: WarehouseStock[] = (stockData || []).map(stockItem => {
        const warehouse = warehouseData?.find(w => w.id === stockItem.warehouse_id);
        return {
          warehouse_id: stockItem.warehouse_id,
          warehouse_name: warehouse?.name || 'Almacén Desconocido',
          warehouse_code: warehouse?.code || 'N/A',
          current_stock: stockItem.current_stock || 0,
          available_stock: stockItem.available_stock || stockItem.current_stock || 0
        };
      });

      setWarehouseStocks(stocks);
    } catch (error) {
      console.error('Error cargando stocks por almacén:', error);
      notify.error('Error cargando información de almacenes');
    }
  }, [product?.id, supabase]);

  useEffect(() => {
    if (open && product) {
      loadWarehouseStocks();
      setFormData({
        sourceWarehouseId: '',
        targetWarehouseId: '',
        quantity: 0,
        reason: '',
        notes: ''
      });
      setErrors({});
    }
  }, [open, product, loadWarehouseStocks]);

  // Calcular preview de transferencia
  const transferPreview = useMemo(() => {
    const sourceStock = warehouseStocks.find(ws => ws.warehouse_id === formData.sourceWarehouseId);
    const targetStock = warehouseStocks.find(ws => ws.warehouse_id === formData.targetWarehouseId);

    if (!sourceStock || !targetStock || formData.quantity <= 0) {
      return null;
    }

    return {
      source: {
        ...sourceStock,
        newStock: sourceStock.current_stock - formData.quantity
      },
      target: {
        ...targetStock,
        newStock: targetStock.current_stock + formData.quantity
      }
    };
  }, [warehouseStocks, formData]);

  // Validación
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.sourceWarehouseId) {
      newErrors.sourceWarehouseId = 'Seleccione almacén de origen';
    }

    if (!formData.targetWarehouseId) {
      newErrors.targetWarehouseId = 'Seleccione almacén de destino';
    }

    if (formData.sourceWarehouseId === formData.targetWarehouseId) {
      newErrors.targetWarehouseId = 'Origen y destino deben ser diferentes';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Cantidad debe ser mayor a 0';
    }

    const sourceStock = warehouseStocks.find(ws => ws.warehouse_id === formData.sourceWarehouseId);
    if (sourceStock && formData.quantity > sourceStock.available_stock) {
      newErrors.quantity = `Stock insuficiente. Disponible: ${sourceStock.available_stock}`;
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Razón es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, warehouseStocks]);

  // Ejecutar transferencia
  const executeTransfer = useCallback(async () => {
    if (!validateForm() || !product) return;

    setLoading(true);
    try {
      // Crear movimiento de salida
      const exitMovementData = await addAuditFieldsFor('inventory_movements', {
        product_id: product.id,
        movement_type: 'transferencia_directa',
        quantity: -formData.quantity, // Negativo para salida
        previous_stock: transferPreview?.source.current_stock || 0,
        new_stock: transferPreview?.source.newStock || 0,
        source_warehouse_id: formData.sourceWarehouseId,
        target_warehouse_id: formData.targetWarehouseId,
        unit_cost: 0,
        total_cost: 0,
        reason: formData.reason,
        notes: formData.notes,
        created_at: getCurrentTimestamp()
      }, false);

      const { error } = await supabase
        .from('inventory_movements')
        .insert([exitMovementData]);

      if (error) throw error;

      notify.success(`Transferencia completada: ${formData.quantity} ${product.unit || 'u'}`);
      onSave();
      onClose();
    } catch (error: any) {
      notify.error(`Error en transferencia: ${error.message}`);
      console.error('Error en transferencia:', error);
    } finally {
      setLoading(false);
    }
  }, [validateForm, product, formData, transferPreview, addAuditFieldsFor, supabase, onSave, onClose]);

  if (!hydrated) {
    return (
      <Dialog open={open} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!product) return null;

  // Filtrar almacenes activos - NULL SAFE
  const availableWarehouses = (warehouses as WarehouseBasicLocal[])?.filter(w => w.is_active === true) || [];
  const sourceOptions = warehouseStocks.filter(ws => ws.current_stock > 0);
  const targetOptions = warehouseStocks.filter(ws => ws.warehouse_id !== formData.sourceWarehouseId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}30`,
          borderRadius: 4
        }
      }}
    >
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
        borderBottom: `1px solid ${colorTokens.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <TransferIcon sx={{ color: colorTokens.brand }} />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Transferencia Entre Almacenes
          </Typography>
          <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
            {product.name} - Stock total: {product.current_stock} {product.unit || 'u'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {/* Almacén de Origen */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: `${colorTokens.warning}10`,
              border: `2px solid ${colorTokens.warning}30`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.warning, mb: 2 }}>
                  Almacén de Origen
                </Typography>
                
                <FormControl fullWidth error={!!errors.sourceWarehouseId}>
                  <InputLabel>Desde *</InputLabel>
                  <Select
                    value={formData.sourceWarehouseId}
                    label="Desde *"
                    onChange={(e) => setFormData(prev => ({ ...prev, sourceWarehouseId: e.target.value }))}
                  >
                    {sourceOptions.map((stock) => (
                      <MenuItem key={stock.warehouse_id} value={stock.warehouse_id}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ backgroundColor: `${colorTokens.warning}20`, color: colorTokens.warning, width: 32, height: 32 }}>
                            <WarehouseIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {stock.warehouse_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                              {stock.warehouse_code} | Stock: {stock.current_stock}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.sourceWarehouseId && (
                    <Typography variant="caption" color="error">
                      {errors.sourceWarehouseId}
                    </Typography>
                  )}
                </FormControl>

                {transferPreview && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: `${colorTokens.warning}05`, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight="bold">Stock después:</Typography>
                    <Typography variant="h4" color={transferPreview.source.newStock >= 0 ? colorTokens.success : colorTokens.danger}>
                      {transferPreview.source.current_stock} → {transferPreview.source.newStock}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Flecha de transferencia */}
          <Grid size={{ xs: 12, md: 0 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowIcon sx={{ color: colorTokens.brand, fontSize: 40 }} />
          </Grid>

          {/* Almacén de Destino */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ 
              background: `${colorTokens.success}10`,
              border: `2px solid ${colorTokens.success}30`,
              borderRadius: 3
            }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.success, mb: 2 }}>
                  Almacén de Destino
                </Typography>
                
                <FormControl fullWidth error={!!errors.targetWarehouseId}>
                  <InputLabel>Hacia *</InputLabel>
                  <Select
                    value={formData.targetWarehouseId}
                    label="Hacia *"
                    onChange={(e) => setFormData(prev => ({ ...prev, targetWarehouseId: e.target.value }))}
                  >
                    {targetOptions.map((stock) => (
                      <MenuItem key={stock.warehouse_id} value={stock.warehouse_id}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ backgroundColor: `${colorTokens.success}20`, color: colorTokens.success, width: 32, height: 32 }}>
                            <WarehouseIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {stock.warehouse_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                              {stock.warehouse_code} | Stock: {stock.current_stock}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.targetWarehouseId && (
                    <Typography variant="caption" color="error">
                      {errors.targetWarehouseId}
                    </Typography>
                  )}
                </FormControl>

                {transferPreview && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: `${colorTokens.success}05`, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight="bold">Stock después:</Typography>
                    <Typography variant="h4" color={colorTokens.success}>
                      {transferPreview.target.current_stock} → {transferPreview.target.newStock}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Formulario de transferencia */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ 
              background: `${colorTokens.brand}10`,
              border: `2px solid ${colorTokens.brand}30`,
              borderRadius: 3
            }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad a Transferir *"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      error={!!errors.quantity}
                      helperText={errors.quantity}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 8 }}>
                    <TextField
                      fullWidth
                      label="Razón de la Transferencia *"
                      value={formData.reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                      error={!!errors.reason}
                      helperText={errors.reason}
                      placeholder="Ej: Reabastecimiento de tienda, redistribución de inventario..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Notas Adicionales"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      multiline
                      rows={2}
                      placeholder="Detalles adicionales de la transferencia..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Preview final */}
          {transferPreview && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">
                <Typography variant="body2" fontWeight="bold">
                  Resumen de Transferencia:
                </Typography>
                <Typography variant="body2">
                  {formData.quantity} {product.unit || 'u'} de "{product.name}" 
                  desde {transferPreview.source.warehouse_name} 
                  hacia {transferPreview.target.warehouse_name}
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
          startIcon={<CloseIcon />}
        >
          Cancelar
        </Button>
        <Button
          onClick={executeTransfer}
          disabled={loading || !transferPreview}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          variant="contained"
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brand}CC)`,
            '&:disabled': { background: colorTokens.neutral600 }
          }}
        >
          {loading ? 'Transfiriendo...' : 'Ejecutar Transferencia'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}