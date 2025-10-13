// 📁 src/components/catalogo/WarehouseTransferDialog.tsx - v10.1 COMPLETO ENHANCED + ARIA FIXED
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid as Grid,
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
  Avatar,
  Autocomplete,
  Chip,
  InputAdornment,
  Switch,
  Stepper,
  Step,
  StepLabel,
  Fade,
  Slide,
  Zoom,
  LinearProgress
} from '@mui/material';
import {
  SwapHoriz as TransferIcon,
  Warehouse as WarehouseIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Inventory as InventoryIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  Store as StoreIcon,
  BusinessCenter as BusinessIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CompareArrows as CompareIcon,
  TrendingDown as TrendingDownIcon
} from '@mui/icons-material';

import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { useUserTracking } from '@/hooks/useUserTracking';
import { useProductStock } from '@/hooks/useProductStock';
import { notify } from '@/utils/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { getCurrentTimestamp } from '@/utils/dateUtils';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface ProductStock {
  id: string;
  name: string;
  sku?: string;
  current_stock: number;
    total_system_stock?: number; // ✅ NUEVO - Campo del sistema multi-almacén v10.1

  unit?: string;
  category?: string;
  cost_price?: number;
  sale_price?: number;
  min_stock?: number;
  max_stock?: number;
  reserved_stock?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface WarehouseStock {
  warehouse_id: string;
  warehouse_name: string;
  warehouse_code: string;
  warehouse_type: 'central' | 'store' | 'temporary';
  current_stock: number;
    total_system_stock?: number; // ✅ NUEVO - Campo del sistema multi-almacén v10.1
  available_stock: number;
  reserved_stock: number;
  last_movement_at?: string;
}

interface WarehouseComplete {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: any;
  warehouse_type: 'central' | 'store' | 'temporary';
  is_active: boolean;
  is_default: boolean;
  manager_user_id?: string;
  auto_restock_enabled?: boolean;
  min_stock_threshold?: number;
  max_capacity?: number;
  current_capacity?: number;
  operating_hours?: any;
  time_zone?: string;
  created_at: string;
  updated_at: string;
  createdBy?: string;
  updatedBy?: string;
}

interface TransferFormData {
  productId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  quantity: number;
  reason: string;
  notes: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  autoApprove: boolean;
}

interface WarehouseTransferDialogProps {
  open: boolean;
  onClose: () => void;
  product?: ProductStock | null;
  onSave: () => void;
}

const getWarehouseIcon = (warehouseType: 'central' | 'store' | 'temporary'): React.ReactElement => {
  const WAREHOUSE_TYPE_ICONS = {
    'central': <BusinessIcon />,
    'store': <StoreIcon />,
    'temporary': <WarehouseIcon />
  };
  return WAREHOUSE_TYPE_ICONS[warehouseType] || <WarehouseIcon />;
};

const TRANSFER_REASONS = [
  'Reabastecimiento de tienda',
  'Redistribución de inventario', 
  'Optimización de stock',
  'Demanda específica de cliente',
  'Consolidación de almacén',
  'Prevención de caducidad',
  'Mantenimiento de almacén',
  'Emergencia operativa',
  'Transferencia automática',
  'Optimización de costos',
  'Otro (especificar en notas)'
] as const;

const TRANSFER_PRIORITIES = [
  { value: 'low' as const, label: 'Baja', color: colorTokens.textSecondary, icon: <ScheduleIcon /> },
  { value: 'normal' as const, label: 'Normal', color: colorTokens.info, icon: <InfoIcon /> },
  { value: 'high' as const, label: 'Alta', color: colorTokens.warning, icon: <WarningIcon /> },
  { value: 'urgent' as const, label: 'Urgente', color: colorTokens.danger, icon: <ErrorIcon /> }
] as const;

const TRANSFER_STEPS = [
  { label: 'Crear Traspaso', icon: <ScheduleIcon />, color: colorTokens.warning },
  { label: 'Registrar Items', icon: <CheckCircleIcon />, color: colorTokens.info },
  { label: 'Procesar', icon: <ShippingIcon />, color: colorTokens.brand },
  { label: 'Completado', icon: <AssignmentIcon />, color: colorTokens.success }
];

export default function WarehouseTransferDialog({
  open,
  onClose,
  product: preSelectedProduct,
  onSave
}: WarehouseTransferDialogProps) {
  const dialogContentRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState<TransferFormData>({
    productId: '',
    sourceWarehouseId: '',
    targetWarehouseId: '',
    quantity: 0,
    reason: '',
    notes: '',
    priority: 'normal',
    autoApprove: false
  });
  const [loading, setLoading] = useState(false);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductStock | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [transferNumber, setTransferNumber] = useState<string>('');

  const hydrated = useHydrated();
  const { addAuditFieldsFor } = useUserTracking();
  const { toast } = useNotifications();
  const supabase = createBrowserSupabaseClient();

  const { data: warehouses, loading: warehousesLoading } = useEntityCRUD<WarehouseComplete>({
    tableName: 'warehouses',
    selectQuery: `
      id, code, name, description, warehouse_type, 
      is_active, is_default, created_at, updated_at
    `
  });

  const { products: allProducts, loading: productsLoading } = useProductStock();

  const availableProducts = useMemo(() => {
    return allProducts.filter((p: ProductStock) => {
      const hasStock = (p.current_stock || 0) > 0;
      const isActive = p.is_active !== false;
      return hasStock && isActive;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  const activeWarehouses = useMemo(() => {
    return (warehouses || [])
      .filter((w: WarehouseComplete) => w.is_active === true)
      .sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [warehouses]);

  const loadWarehouseStocks = useCallback(async (productId: string) => {
    if (!productId) {
      setWarehouseStocks([]);
      return;
    }

    setLoadingStocks(true);
    try {
      const { data: stockData, error: stockError } = await supabase
        .from('product_warehouse_stock')
        .select('warehouse_id, current_stock, reserved_stock, available_stock, last_movement_at')
        .eq('product_id', productId)
        .gt('current_stock', 0)
        .order('current_stock', { ascending: false });

      if (stockError) throw stockError;

      const warehouseIds = stockData?.map(s => s.warehouse_id) || [];
      if (warehouseIds.length === 0) {
        setWarehouseStocks([]);
        return;
      }

      const { data: warehouseData, error: warehouseError } = await supabase
        .from('warehouses')
        .select('id, name, code, warehouse_type, is_active')
        .in('id', warehouseIds)
        .eq('is_active', true);

      if (warehouseError) throw warehouseError;

      const stocks: WarehouseStock[] = (stockData || [])
        .map(stockItem => {
          const warehouse = warehouseData?.find(w => w.id === stockItem.warehouse_id);
          if (!warehouse) return null;
          
          return {
            warehouse_id: stockItem.warehouse_id,
            warehouse_name: warehouse.name,
            warehouse_code: warehouse.code,
            warehouse_type: warehouse.warehouse_type as 'central' | 'store' | 'temporary',
            current_stock: stockItem.current_stock || 0,
            available_stock: stockItem.available_stock || stockItem.current_stock || 0,
            reserved_stock: stockItem.reserved_stock || 0,
            last_movement_at: stockItem.last_movement_at
          };
        })
        .filter(Boolean) as WarehouseStock[];

      setWarehouseStocks(stocks);
      
      if (stocks.length === 0) {
        notify.warning('No hay almacenes con stock para este producto');
      }
      
    } catch (error: any) {
      console.error('❌ Error cargando stocks:', error);
      notify.error('Error cargando información de almacenes: ' + error.message);
      setWarehouseStocks([]);
    } finally {
      setLoadingStocks(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (open) {
      setFormData({
        productId: preSelectedProduct?.id || '',
        sourceWarehouseId: '',
        targetWarehouseId: '',
        quantity: 0,
        reason: '',
        notes: '',
        priority: 'normal',
        autoApprove: false
      });
      setErrors({});
      setCurrentStep(0);
      setTransferNumber('');
      
      if (preSelectedProduct) {
        setSelectedProduct(preSelectedProduct);
        loadWarehouseStocks(preSelectedProduct.id);
      } else {
        setSelectedProduct(null);
        setWarehouseStocks([]);
      }
    }
  }, [open, preSelectedProduct, loadWarehouseStocks]);

  useEffect(() => {
    if (formData.productId && formData.productId !== selectedProduct?.id) {
      const product = availableProducts.find(p => p.id === formData.productId);
      if (product) {
        setSelectedProduct(product);
        loadWarehouseStocks(formData.productId);
        setFormData(prev => ({
          ...prev,
          sourceWarehouseId: '',
          targetWarehouseId: '',
          quantity: 0
        }));
      }
    }
  }, [formData.productId, availableProducts, selectedProduct?.id, loadWarehouseStocks]);

  useEffect(() => {
    if (open && dialogContentRef.current && !loading && !loadingStocks && !productsLoading && !warehousesLoading) {
      const timer = setTimeout(() => {
        const firstFocusableElement = dialogContentRef.current?.querySelector(
          'input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;
        
        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [open, loading, loadingStocks, productsLoading, warehousesLoading]);

  const transferPreview = useMemo(() => {
    const sourceStock = warehouseStocks.find(ws => ws.warehouse_id === formData.sourceWarehouseId);
    
    if (!sourceStock || !formData.quantity || formData.quantity <= 0) {
      return null;
    }

    const targetStock = warehouseStocks.find(ws => ws.warehouse_id === formData.targetWarehouseId);
    const targetCurrentStock = targetStock?.current_stock || 0;
    const targetWarehouse = activeWarehouses.find(w => w.id === formData.targetWarehouseId);
    
    if (!targetWarehouse) return null;
    
    return {
      source: {
        ...sourceStock,
        newStock: sourceStock.current_stock - formData.quantity,
        isValid: (sourceStock.current_stock - formData.quantity) >= 0
      },
      target: {
        warehouse_id: formData.targetWarehouseId,
        warehouse_name: targetWarehouse.name,
        warehouse_code: targetWarehouse.code,
        warehouse_type: targetWarehouse.warehouse_type,
        current_stock: targetCurrentStock,
        newStock: targetCurrentStock + formData.quantity,
        available_stock: targetCurrentStock,
        reserved_stock: 0
      },
      totalValue: (selectedProduct?.cost_price || 0) * formData.quantity,
      isValid: (sourceStock.current_stock - formData.quantity) >= 0
    };
  }, [warehouseStocks, formData, activeWarehouses, selectedProduct]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.productId) {
      newErrors.productId = 'Seleccione un producto';
    }

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
      newErrors.quantity = `Stock insuficiente. Disponible: ${sourceStock.available_stock} ${selectedProduct?.unit || 'u'}`;
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Razón es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, warehouseStocks, selectedProduct]);

  const generateTransferNumber = useCallback(async (): Promise<string> => {
    const prefix = 'TR';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    try {
      const { data, error } = await supabase
        .from('warehouse_transfers')
        .select('transfer_number')
        .like('transfer_number', `${prefix}${date}%`)
        .order('transfer_number', { ascending: false })
        .limit(1);
      
      if (error) throw error;

      let sequence = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].transfer_number;
        const lastSequence = parseInt(lastNumber.split('-')[1] || '0');
        sequence = lastSequence + 1;
      }

      return `${prefix}${date}-${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generando número de traspaso:', error);
      return `${prefix}${date}-${Date.now().toString().slice(-4)}`;
    }
  }, [supabase]);

  const executeTransfer = useCallback(async () => {
    if (!validateForm() || !selectedProduct || !transferPreview || !transferPreview.isValid) return;

    setLoading(true);
    setCurrentStep(1);
    let transferId: string | null = null;

    try {
      const generatedTransferNumber = await generateTransferNumber();
      setTransferNumber(generatedTransferNumber);

      const baseTransferData = {
        transfer_number: generatedTransferNumber,
        source_warehouse_id: formData.sourceWarehouseId,
        target_warehouse_id: formData.targetWarehouseId,
        status: 'pending',
        transfer_type: 'manual',
        priority: formData.priority,
        reason: formData.reason,
        notes: formData.notes || undefined,
        total_items: 1,
        total_quantity: formData.quantity,
        total_value: transferPreview.totalValue,
        requested_at: getCurrentTimestamp()
      };

      const transferDataWithAudit = await addAuditFieldsFor('warehouse_transfers', baseTransferData, false);

      const { data: transfer, error: transferError } = await supabase
        .from('warehouse_transfers')
        .insert([transferDataWithAudit])
        .select('id, transfer_number')
        .single();

      if (transferError) {
        throw new Error(`Error creando traspaso: ${transferError.message}`);
      }
      
      transferId = transfer.id;
      setCurrentStep(2);

      const transferItem = {
        transfer_id: transferId,
        product_id: selectedProduct.id,
        requested_quantity: formData.quantity,
        approved_quantity: formData.autoApprove ? formData.quantity : 0,
        shipped_quantity: formData.autoApprove ? formData.quantity : 0,
        received_quantity: formData.autoApprove ? formData.quantity : 0,
        unit_cost: selectedProduct.cost_price || 0,
        notes: formData.notes || undefined
      };

      const { error: itemError } = await supabase
        .from('warehouse_transfer_items')
        .insert([transferItem]);

      if (itemError) {
        throw new Error(`Error creando item: ${itemError.message}`);
      }
      
      setCurrentStep(3);

      if (formData.autoApprove) {
        const { error: updateError } = await supabase
          .from('warehouse_transfers')
          .update({ 
            status: 'completed',
            approved_at: getCurrentTimestamp(),
            shipped_at: getCurrentTimestamp(),
            received_at: getCurrentTimestamp()
          })
          .eq('id', transferId);

        if (updateError) {
          throw new Error(`Error completando traspaso: ${updateError.message}`);
        }
        
        setCurrentStep(4);
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        setCurrentStep(4);
      }

      const successMessage = formData.autoApprove 
        ? `Traspaso ${transfer.transfer_number} completado\n` +
          `${formData.quantity} ${selectedProduct.unit || 'u'} de "${selectedProduct.name}"\n` +
          `Stock actualizado en ambos almacenes`
        : `Traspaso ${transfer.transfer_number} creado\n` +
          `${formData.quantity} ${selectedProduct.unit || 'u'} de "${selectedProduct.name}"\n` +
          `Pendiente de aprobación`;
      
      notify.success(successMessage);
      
      setTimeout(() => {
        onSave();
        onClose();
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ ERROR EN TRASPASO:', error);
      notify.error(`Error ejecutando traspaso: ${error.message}`);
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  }, [
    validateForm, 
    selectedProduct, 
    transferPreview, 
    formData, 
    addAuditFieldsFor, 
    supabase, 
    generateTransferNumber, 
    onSave, 
    onClose
  ]);

  const handlers = useMemo(() => ({
    productChange: (_: any, newValue: ProductStock | null) => {
      setFormData(prev => ({ 
        ...prev, 
        productId: newValue?.id || '',
        sourceWarehouseId: '',
        targetWarehouseId: '',
        quantity: 0
      }));
      setSelectedProduct(newValue);
      setErrors({});
      if (newValue) {
        loadWarehouseStocks(newValue.id);
      } else {
        setWarehouseStocks([]);
      }
    },
    sourceChange: (warehouseId: string) => {
      setFormData(prev => ({ ...prev, sourceWarehouseId: warehouseId }));
      if (errors.sourceWarehouseId) {
        setErrors(prev => ({ ...prev, sourceWarehouseId: '' }));
      }
    },
    targetChange: (warehouseId: string) => {
      setFormData(prev => ({ ...prev, targetWarehouseId: warehouseId }));
      if (errors.targetWarehouseId) {
        setErrors(prev => ({ ...prev, targetWarehouseId: '' }));
      }
    },
    quantityChange: (quantity: number) => {
      setFormData(prev => ({ ...prev, quantity: Math.max(0, quantity) }));
      if (errors.quantity) {
        setErrors(prev => ({ ...prev, quantity: '' }));
      }
    },
    reasonChange: (reason: string) => {
      setFormData(prev => ({ ...prev, reason }));
      if (errors.reason) {
        setErrors(prev => ({ ...prev, reason: '' }));
      }
    },
    notesChange: (notes: string) => {
      setFormData(prev => ({ ...prev, notes }));
    },
    priorityChange: (priority: 'low' | 'normal' | 'high' | 'urgent') => {
      setFormData(prev => ({ ...prev, priority }));
    },
    autoApproveChange: (autoApprove: boolean) => {
      setFormData(prev => ({ ...prev, autoApprove }));
    }
  }), [loadWarehouseStocks, errors]);

  if (!hydrated) {
    return (
      <Dialog 
        open={open} 
        maxWidth="lg" 
        fullWidth
        disableRestoreFocus={false}
        disableAutoFocus={false}
        disableEnforceFocus={false}
        aria-labelledby="loading-transfer-dialog-title"
      >
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            minHeight: 300,
            flexDirection: 'column',
            gap: 3
          }}>
            <CircularProgress size={80} sx={{ color: colorTokens.brand }} />
            <Typography 
              id="loading-transfer-dialog-title"
              variant="h5" 
              fontWeight="bold" 
              sx={{ color: colorTokens.brand }}
            >
              MuscleUp Gym
            </Typography>
            <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
              Cargando sistema de traspasos...
            </Typography>
            <LinearProgress 
              sx={{ 
                width: '200px',
                backgroundColor: colorTokens.neutral400,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: colorTokens.brand
                }
              }} 
            />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      disableRestoreFocus={false}
      disableAutoFocus={false}
      disableEnforceFocus={false}
      aria-labelledby="transfer-dialog-title"
      aria-describedby="transfer-dialog-description"
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          border: `2px solid ${colorTokens.brand}30`,
          borderRadius: 4,
          minHeight: '80vh',
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.4), 0 0 30px ${colorTokens.brand}20`
        }
      }}
    >
      <DialogTitle 
        id="transfer-dialog-title"
        sx={{ 
          background: `linear-gradient(135deg, ${colorTokens.brand}20, ${colorTokens.brand}10)`,
          borderBottom: `2px solid ${colorTokens.brand}30`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 3
        }}
      >
        <Avatar sx={{
          background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})`,
          width: 56,
          height: 56,
          boxShadow: `0 4px 12px ${colorTokens.brand}40`
        }}>
          <TransferIcon sx={{ fontSize: 32 }} />
        </Avatar>
        <Box flex={1}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
            Sistema de Traspasos
          </Typography>
          <Typography 
            id="transfer-dialog-description"
            variant="body2" 
            sx={{ color: colorTokens.textSecondary, mt: 0.5 }}
          >
            Transferencias de inventario entre almacenes
          </Typography>
        </Box>
        {selectedProduct && (
          <Chip 
            icon={<InventoryIcon />}
            label={`${selectedProduct.name} (${selectedProduct.current_stock} ${selectedProduct.unit || 'u'})`}
            sx={{
              background: `linear-gradient(135deg, ${colorTokens.brand}30, ${colorTokens.brand}20)`,
              color: colorTokens.brand,
              fontWeight: 700,
              fontSize: '0.9rem',
              border: `1px solid ${colorTokens.brand}40`,
              boxShadow: `0 2px 8px ${colorTokens.brand}20`
            }}
          />
        )}
        {transferNumber && (
          <Chip 
            icon={<AssignmentIcon />}
            label={transferNumber}
            sx={{
              background: `linear-gradient(135deg, ${colorTokens.success}30, ${colorTokens.success}20)`,
              color: colorTokens.success,
              fontWeight: 700,
              fontSize: '0.9rem',
              border: `1px solid ${colorTokens.success}40`,
              boxShadow: `0 2px 8px ${colorTokens.success}20`
            }}
          />
        )}
      </DialogTitle>

      <DialogContent 
        ref={dialogContentRef}
        sx={{ p: 4 }}
      >
        <Fade in timeout={500}>
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={currentStep} alternativeLabel>
              {TRANSFER_STEPS.map((step, index) => (
                <Step key={index} completed={index < currentStep}>
                  <StepLabel 
                    icon={
                      <Avatar sx={{
                        width: 40,
                        height: 40,
                        background: index <= currentStep ? 
                          `linear-gradient(135deg, ${step.color}, ${step.color}CC)` : 
                          colorTokens.neutral400,
                        color: colorTokens.textOnBrand,
                        boxShadow: index <= currentStep ? 
                          `0 4px 12px ${step.color}40` : 
                          'none',
                        transition: 'all 0.3s ease'
                      }}>
                        {step.icon}
                      </Avatar>
                    }
                    sx={{
                      '& .MuiStepLabel-label': {
                        color: index <= currentStep ? step.color : colorTokens.textSecondary,
                        fontWeight: index <= currentStep ? 700 : 400,
                        mt: 1
                      }
                    }}
                  >
                    {step.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
            {loading && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress 
                  sx={{
                    backgroundColor: `${colorTokens.neutral400}60`,
                    '& .MuiLinearProgress-bar': {
                      background: `linear-gradient(90deg, ${colorTokens.brand}, ${colorTokens.brandActive})`,
                      boxShadow: `0 0 10px ${colorTokens.brand}60`
                    },
                    borderRadius: 2,
                    height: 8
                  }}
                />
                <Typography variant="caption" sx={{ 
                  color: colorTokens.textSecondary, 
                  mt: 1.5, 
                  display: 'block', 
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  {currentStep === 1 && 'Creando traspaso...'}
                  {currentStep === 2 && 'Registrando productos...'}
                  {currentStep === 3 && 'Procesando movimientos...'}
                  {currentStep === 4 && 'Finalizando operación...'}
                </Typography>
              </Box>
            )}
          </Box>
        </Fade>

        <Grid container spacing={4}>
          {/* SELECCIÓN DE PRODUCTO */}
          <Grid size={{ xs: 12 }}>
            <Zoom in timeout={600}>
              <Card sx={{ 
                background: `linear-gradient(135deg, ${colorTokens.info}15, ${colorTokens.info}08)`,
                border: `2px solid ${colorTokens.info}40`,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                boxShadow: `0 4px 12px ${colorTokens.info}20`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 25px ${colorTokens.info}30`
                }
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ 
                    color: colorTokens.info, 
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5
                  }}>
                    <InventoryIcon sx={{ fontSize: 28 }} />
                    Producto para Traspaso
                    {availableProducts.length > 0 && (
                      <Chip 
                        label={`${availableProducts.length} disponibles`}
                        size="small"
                        sx={{
                          background: `linear-gradient(135deg, ${colorTokens.info}30, ${colorTokens.info}20)`,
                          color: colorTokens.info,
                          fontWeight: 600,
                          ml: 1
                        }}
                      />
                    )}
                  </Typography>
                  
                  <Autocomplete
                    value={selectedProduct}
                    onChange={handlers.productChange}
                    options={availableProducts}
                    getOptionLabel={(option: ProductStock) => `${option.name} (SKU: ${option.sku || 'N/A'})`}
                    loading={productsLoading}
                    disabled={!!preSelectedProduct || loading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Buscar producto con stock *"
                        placeholder="Escriba para buscar productos disponibles..."
                        error={!!errors.productId}
                        helperText={errors.productId || 'Solo productos activos con stock disponible'}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon sx={{ color: colorTokens.info }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {productsLoading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: colorTokens.surfaceLevel1,
                            '& fieldset': { borderColor: `${colorTokens.info}40` },
                            '&:hover fieldset': { borderColor: colorTokens.info },
                            '&.Mui-focused fieldset': { 
                              borderColor: colorTokens.info,
                              borderWidth: 2
                            }
                          }
                        }}
                      />
                    )}
                    renderOption={(props, option: ProductStock) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box display="flex" alignItems="center" gap={2} width="100%">
                            <Avatar sx={{ 
                              background: `linear-gradient(135deg, ${colorTokens.info}, ${colorTokens.info}CC)`,
                              color: colorTokens.textOnBrand,
                              width: 40, 
                              height: 40,
                              fontWeight: 'bold',
                              boxShadow: `0 2px 8px ${colorTokens.info}30`
                            }}>
                              {option.name.charAt(0)}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight="bold">
                                {option.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                SKU: {option.sku || 'N/A'} • Stock: {option.current_stock} {option.unit || 'u'} • ${(option.cost_price || 0).toFixed(2)}
                              </Typography>
                            </Box>
                            <Chip 
                              label={option.category || 'Sin categoría'} 
                              size="small"
                              sx={{ 
                                background: `linear-gradient(135deg, ${colorTokens.brand}30, ${colorTokens.brand}20)`,
                                color: colorTokens.brand,
                                fontWeight: 600
                              }}
                            />
                          </Box>
                        </Box>
                      );
                    }}
                  />
                  
                  {preSelectedProduct && (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        mt: 2.5,
                        backgroundColor: `${colorTokens.info}15`,
                        border: `1px solid ${colorTokens.info}30`
                      }}
                    >
                      <Typography variant="body2" fontWeight={500}>
                        <strong>Producto pre-seleccionado:</strong> {preSelectedProduct.name} 
    (Stock total: {preSelectedProduct.total_system_stock} {preSelectedProduct.unit || 'u'}) {/* ✅ CORREGIDO */}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Zoom>
          </Grid>

          {loadingStocks && (
            <Grid size={{ xs: 12 }}>
              <Fade in>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  py: 4,
                  gap: 2
                }}>
                  <CircularProgress sx={{ color: colorTokens.brand }} />
                  <Typography variant="body1" sx={{ color: colorTokens.textSecondary }}>
                    Cargando stock por almacén...
                  </Typography>
                </Box>
              </Fade>
            </Grid>
          )}

          {selectedProduct && warehouseStocks.length > 0 && !loadingStocks && (
            <>
              {/* ALMACÉN ORIGEN */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Slide direction="right" in timeout={700}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.warning}15, ${colorTokens.warning}08)`,
                    border: `2px solid ${colorTokens.warning}40`,
                    borderRadius: 3,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 12px ${colorTokens.warning}20`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${colorTokens.warning}30`
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ 
                        color: colorTokens.warning, 
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                      }}>
                        <TrendingDownIcon sx={{ fontSize: 28 }} />
                        Almacén de Origen
                        {warehouseStocks.filter(ws => ws.current_stock > 0).length > 0 && (
                          <Chip 
                            label={`${warehouseStocks.filter(ws => ws.current_stock > 0).length} con stock`}
                            size="small"
                            sx={{
                              background: `linear-gradient(135deg, ${colorTokens.warning}30, ${colorTokens.warning}20)`,
                              color: colorTokens.warning,
                              fontWeight: 600,
                              ml: 1
                            }}
                          />
                        )}
                      </Typography>
                      
                      <FormControl fullWidth error={!!errors.sourceWarehouseId}>
                        <InputLabel sx={{
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.warning }
                        }}>
                          Desde almacén *
                        </InputLabel>
                        <Select
                          value={formData.sourceWarehouseId}
                          label="Desde almacén *"
                          onChange={(e) => handlers.sourceChange(e.target.value)}
                          disabled={loading}
                          sx={{
                            backgroundColor: colorTokens.surfaceLevel1,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${colorTokens.warning}40`
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.warning
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.warning,
                              borderWidth: 2
                            }
                          }}
                        >
                          {warehouseStocks.filter(ws => ws.current_stock > 0).map((stock) => (
                            <MenuItem key={stock.warehouse_id} value={stock.warehouse_id}>
                              <Box display="flex" alignItems="center" gap={2} width="100%">
                                <Avatar sx={{ 
                                  background: `linear-gradient(135deg, ${colorTokens.warning}, ${colorTokens.warning}CC)`,
                                  color: colorTokens.textOnBrand,
                                  width: 36, 
                                  height: 36,
                                  boxShadow: `0 2px 8px ${colorTokens.warning}30`
                                }}>
                                  {getWarehouseIcon(stock.warehouse_type)}
                                </Avatar>
                                <Box flex={1}>
                                  <Typography variant="body2" fontWeight="bold">
                                    {stock.warehouse_name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                    {stock.warehouse_code} • Stock: {stock.current_stock} • Disponible: {stock.available_stock}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={stock.warehouse_type}
                                  size="small"
                                  sx={{
                                    backgroundColor: `${colorTokens.textSecondary}20`,
                                    color: colorTokens.textSecondary,
                                    fontSize: '0.7rem',
                                    fontWeight: 600
                                  }}
                                />
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.sourceWarehouseId && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, fontWeight: 500 }}>
                            {errors.sourceWarehouseId}
                          </Typography>
                        )}
                      </FormControl>

                      {transferPreview && (
                        <Box sx={{ 
                          mt: 3, 
                          p: 3, 
                          background: `linear-gradient(135deg, ${colorTokens.warning}10, ${colorTokens.warning}05)`,
                          borderRadius: 3,
                          border: `1px solid ${colorTokens.warning}30`
                        }}>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.warning, mb: 1.5 }}>
                            Stock después del traspaso:
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                              {transferPreview.source.current_stock}
                            </Typography>
                            <TrendingDownIcon sx={{ color: colorTokens.warning, fontSize: 32 }} />
                            <Typography variant="h3" fontWeight="bold" sx={{ 
                              color: transferPreview.source.isValid ? colorTokens.success : colorTokens.danger
                            }}>
                              {transferPreview.source.newStock}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block', mt: 1 }}>
                            {selectedProduct.unit || 'unidades'}
                          </Typography>
                          {!transferPreview.source.isValid && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                              Stock insuficiente para esta transferencia
                            </Alert>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>

              {/* FLECHA CENTRAL */}
              <Grid size={{ xs: 12, md: 2 }} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 2
              }}>
                <Zoom in timeout={1000}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <Avatar sx={{
                      width: 64,
                      height: 64,
                      background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandActive})`,
                      boxShadow: `0 8px 20px ${colorTokens.brand}40`,
                      animation: 'pulse 2s infinite'
                    }}>
                      <CompareIcon sx={{ fontSize: 36 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.brand }}>
                      Transferir
                    </Typography>
                    {transferPreview && (
                      <Chip 
                        label={`${formData.quantity} ${selectedProduct.unit || 'u'}`}
                        sx={{
                          background: `linear-gradient(135deg, ${colorTokens.brand}30, ${colorTokens.brand}20)`,
                          color: colorTokens.brand,
                          fontWeight: 700,
                          fontSize: '1rem',
                          px: 2,
                          py: 2.5,
                          boxShadow: `0 4px 12px ${colorTokens.brand}30`
                        }}
                      />
                    )}
                  </Box>
                </Zoom>
              </Grid>

              {/* ALMACÉN DESTINO */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Slide direction="left" in timeout={900}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.success}15, ${colorTokens.success}08)`,
                    border: `2px solid ${colorTokens.success}40`,
                    borderRadius: 3,
                    height: '100%',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 12px ${colorTokens.success}20`,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${colorTokens.success}30`
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ 
                        color: colorTokens.success, 
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                      }}>
                        <TrendingUpIcon sx={{ fontSize: 28 }} />
                        Almacén de Destino
                        {activeWarehouses.filter(w => w.id !== formData.sourceWarehouseId).length > 0 && (
                          <Chip 
                            label={`${activeWarehouses.filter(w => w.id !== formData.sourceWarehouseId).length} disponibles`}
                            size="small"
                            sx={{
                              background: `linear-gradient(135deg, ${colorTokens.success}30, ${colorTokens.success}20)`,
                              color: colorTokens.success,
                              fontWeight: 600,
                              ml: 1
                            }}
                          />
                        )}
                      </Typography>
                      
                      <FormControl fullWidth error={!!errors.targetWarehouseId}>
                        <InputLabel sx={{
                          color: colorTokens.textSecondary,
                          '&.Mui-focused': { color: colorTokens.success }
                        }}>
                          Hacia almacén *
                        </InputLabel>
                        <Select
                          value={formData.targetWarehouseId}
                          label="Hacia almacén *"
                          onChange={(e) => handlers.targetChange(e.target.value)}
                          disabled={loading}
                          sx={{
                            backgroundColor: colorTokens.surfaceLevel1,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: `${colorTokens.success}40`
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.success
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: colorTokens.success,
                              borderWidth: 2
                            }
                          }}
                        >
                          {activeWarehouses
                            .filter(w => w.id !== formData.sourceWarehouseId)
                            .map((warehouse) => (
                            <MenuItem key={warehouse.id} value={warehouse.id}>
                              <Box display="flex" alignItems="center" gap={2} width="100%">
                                <Avatar sx={{ 
                                  background: `linear-gradient(135deg, ${colorTokens.success}, ${colorTokens.success}CC)`,
                                  color: colorTokens.textOnBrand,
                                  width: 36, 
                                  height: 36,
                                  boxShadow: `0 2px 8px ${colorTokens.success}30`
                                }}>
                                  {getWarehouseIcon(warehouse.warehouse_type)}
                                </Avatar>
                                <Box flex={1}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {warehouse.name}
                                    </Typography>
                                    {warehouse.is_default && (
                                      <Chip 
                                        label="DEFAULT"
                                        size="small"
                                        sx={{
                                          background: `linear-gradient(135deg, ${colorTokens.brand}30, ${colorTokens.brand}20)`,
                                          color: colorTokens.brand,
                                          fontSize: '0.65rem',
                                          height: 18,
                                          fontWeight: 700
                                        }}
                                      />
                                    )}
                                  </Box>
                                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                    {warehouse.code} • {warehouse.warehouse_type}
                                  </Typography>
                                </Box>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.targetWarehouseId && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, fontWeight: 500 }}>
                            {errors.targetWarehouseId}
                          </Typography>
                        )}
                      </FormControl>

                      {transferPreview && (
                        <Box sx={{ 
                          mt: 3, 
                          p: 3, 
                          background: `linear-gradient(135deg, ${colorTokens.success}10, ${colorTokens.success}05)`,
                          borderRadius: 3,
                          border: `1px solid ${colorTokens.success}30`
                        }}>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: colorTokens.success, mb: 1.5 }}>
                            Stock después del traspaso:
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.textPrimary }}>
                              {transferPreview.target.current_stock}
                            </Typography>
                            <TrendingUpIcon sx={{ color: colorTokens.success, fontSize: 32 }} />
                            <Typography variant="h3" fontWeight="bold" sx={{ color: colorTokens.success }}>
                              {transferPreview.target.newStock}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: colorTokens.textSecondary, display: 'block', mt: 1 }}>
                            {selectedProduct.unit || 'unidades'}
                          </Typography>
                          {transferPreview.target.current_stock === 0 && (
                            <Alert severity="info" sx={{ mt: 2, backgroundColor: `${colorTokens.info}10` }}>
                              Primer stock en este almacén
                            </Alert>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Slide>
              </Grid>

              {/* CONFIGURACIÓN */}
              <Grid size={{ xs: 12 }}>
                <Fade in timeout={1200}>
                  <Card sx={{ 
                    background: `linear-gradient(135deg, ${colorTokens.brand}15, ${colorTokens.brand}08)`,
                    border: `2px solid ${colorTokens.brand}40`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 12px ${colorTokens.brand}20`,
                    '&:hover': {
                      boxShadow: `0 8px 25px ${colorTokens.brand}30`
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ 
                        color: colorTokens.brand, 
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5
                      }}>
                        <InfoIcon sx={{ fontSize: 28 }} />
                        Configuración del Traspaso
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 3 }}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Cantidad a Transferir *"
                            value={formData.quantity || ''}
                            onChange={(e) => handlers.quantityChange(parseInt(e.target.value) || 0)}
                            error={!!errors.quantity}
                            helperText={errors.quantity || `Máximo disponible: ${warehouseStocks.find(ws => ws.warehouse_id === formData.sourceWarehouseId)?.available_stock || 0}`}
                            disabled={loading}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  {selectedProduct.unit || 'u'}
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.surfaceLevel1,
                                '& fieldset': { borderColor: `${colorTokens.brand}40` },
                                '&:hover fieldset': { borderColor: colorTokens.brand },
                                '&.Mui-focused fieldset': { 
                                  borderColor: colorTokens.brand,
                                  borderWidth: 2
                                }
                              }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, md: 3 }}>
                          <FormControl fullWidth>
                            <InputLabel>Prioridad</InputLabel>
                            <Select
                              value={formData.priority}
                              label="Prioridad"
                              onChange={(e) => handlers.priorityChange(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
                              disabled={loading}
                              sx={{
                                backgroundColor: colorTokens.surfaceLevel1
                              }}
                            >
                              {TRANSFER_PRIORITIES.map((priority) => (
                                <MenuItem key={priority.value} value={priority.value}>
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Box sx={{ color: priority.color }}>
                                      {priority.icon}
                                    </Box>
                                    <Box
                                      sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        backgroundColor: priority.color,
                                        boxShadow: `0 2px 6px ${priority.color}40`
                                      }}
                                    />
                                    {priority.label}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                          <FormControl fullWidth error={!!errors.reason}>
                            <InputLabel>Razón del Traspaso *</InputLabel>
                            <Select
                              value={formData.reason}
                              label="Razón del Traspaso *"
                              onChange={(e) => handlers.reasonChange(e.target.value)}
                              disabled={loading}
                              sx={{
                                backgroundColor: colorTokens.surfaceLevel1
                              }}
                            >
                              {TRANSFER_REASONS.map((reason) => (
                                <MenuItem key={reason} value={reason}>
                                  {reason}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.reason && (
                              <Typography variant="caption" color="error" sx={{ mt: 1, fontWeight: 500 }}>
                                {errors.reason}
                              </Typography>
                            )}
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <TextField
                            fullWidth
                            label="Notas Adicionales"
                            value={formData.notes}
                            onChange={(e) => handlers.notesChange(e.target.value)}
                            multiline
                            rows={2}
                            placeholder="Detalles adicionales del traspaso, instrucciones especiales, contacto responsable..."
                            disabled={loading}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: colorTokens.surfaceLevel1
                              }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <Card sx={{
                            background: formData.autoApprove ? 
                              `linear-gradient(135deg, ${colorTokens.success}15, ${colorTokens.success}08)` :
                              `${colorTokens.neutral400}10`,
                            border: `2px solid ${formData.autoApprove ? colorTokens.success : colorTokens.neutral400}30`,
                            borderRadius: 3,
                            p: 2,
                            transition: 'all 0.3s ease'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Switch
                                checked={formData.autoApprove}
                                onChange={(e) => handlers.autoApproveChange(e.target.checked)}
                                disabled={loading}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: colorTokens.success,
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: colorTokens.success,
                                  },
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ 
                                  color: formData.autoApprove ? colorTokens.success : colorTokens.textPrimary,
                                  mb: 0.5
                                }}>
                                  Aprobar y Completar Automáticamente
                                </Typography>
                                <Typography variant="caption" sx={{ color: colorTokens.textSecondary }}>
                                  El traspaso será procesado instantáneamente y el inventario se actualizará en ambos almacenes
                                </Typography>
                              </Box>
                              {formData.autoApprove && (
                                <Chip 
                                  icon={<CheckCircleIcon />}
                                  label="ACTIVO"
                                  size="small"
                                  sx={{
                                    background: `linear-gradient(135deg, ${colorTokens.success}30, ${colorTokens.success}20)`,
                                    color: colorTokens.success,
                                    fontWeight: 700
                                  }}
                                />
                              )}
                            </Box>
                          </Card>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>

              {/* PREVIEW/RESUMEN */}
              {transferPreview && formData.quantity > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Fade in timeout={1400}>
                    <Alert 
                      severity={transferPreview.isValid ? "success" : "error"}
                      icon={transferPreview.isValid ? <CheckCircleIcon /> : <ErrorIcon />}
                      sx={{ 
                        backgroundColor: transferPreview.isValid ? `${colorTokens.success}15` : `${colorTokens.danger}15`,
                        border: `2px solid ${transferPreview.isValid ? colorTokens.success : colorTokens.danger}40`,
                        borderRadius: 3,
                        boxShadow: `0 4px 12px ${transferPreview.isValid ? colorTokens.success : colorTokens.danger}20`
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1.5 }}>
                        {transferPreview.isValid ? 'Resumen del Traspaso' : 'Error en Configuración'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 500 }}>
                        <strong>{formData.quantity} {selectedProduct.unit || 'u'}</strong> de "{selectedProduct.name}" 
                        desde <strong>{transferPreview.source.warehouse_name}</strong> 
                        hacia <strong>{transferPreview.target.warehouse_name}</strong>
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box sx={{ 
                            p: 2, 
                            background: colorTokens.surfaceLevel1, 
                            borderRadius: 2,
                            border: `1px solid ${colorTokens.border}`
                          }}>
                            <Typography variant="caption" fontWeight={600} sx={{ color: colorTokens.textSecondary }}>
                              Valor estimado
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mt: 0.5 }}>
                              {transferPreview.totalValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box sx={{ 
                            p: 2, 
                            background: colorTokens.surfaceLevel1, 
                            borderRadius: 2,
                            border: `1px solid ${colorTokens.border}`
                          }}>
                            <Typography variant="caption" fontWeight={600} sx={{ color: colorTokens.textSecondary }}>
                              Prioridad
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ 
                              color: TRANSFER_PRIORITIES.find(p => p.value === formData.priority)?.color,
                              mt: 0.5
                            }}>
                              {TRANSFER_PRIORITIES.find(p => p.value === formData.priority)?.label}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Box sx={{ 
                            p: 2, 
                            background: colorTokens.surfaceLevel1, 
                            borderRadius: 2,
                            border: `1px solid ${colorTokens.border}`
                          }}>
                            <Typography variant="caption" fontWeight={600} sx={{ color: colorTokens.textSecondary }}>
                              Estado
                            </Typography>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: colorTokens.textPrimary, mt: 0.5 }}>
                              {formData.autoApprove ? 'Automático' : 'Pendiente'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      {!transferPreview.isValid && (
                        <Typography variant="body2" sx={{ mt: 2, color: colorTokens.danger, fontWeight: 600 }}>
                          Corrija los errores antes de continuar.
                        </Typography>
                      )}
                    </Alert>
                  </Fade>
                </Grid>
              )}
            </>
          )}

          {selectedProduct && warehouseStocks.length === 0 && !loadingStocks && (
            <Grid size={{ xs: 12 }}>
              <Fade in>
                <Alert 
                  severity="warning" 
                  sx={{ 
                    backgroundColor: `${colorTokens.warning}15`,
                    border: `2px solid ${colorTokens.warning}40`,
                    borderRadius: 3
                  }}
                >
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                    Sin stock en almacenes activos
                  </Typography>
                  <Typography variant="body2">
                    El producto "{selectedProduct.name}" no tiene stock registrado en ningún almacén activo.
                    Registre stock inicial antes de crear traspasos.
                  </Typography>
                </Alert>
              </Fade>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        borderTop: `2px solid ${colorTokens.border}`,
        gap: 2,
        background: `linear-gradient(135deg, ${colorTokens.surfaceLevel1}, ${colorTokens.surfaceLevel2})`
      }}>
        <Button
          onClick={onClose}
          disabled={loading}
          startIcon={<CloseIcon />}
          sx={{ 
            color: colorTokens.textSecondary,
            borderColor: `${colorTokens.textSecondary}40`,
            border: '1px solid',
            px: 4, py: 1.5, borderRadius: 3, fontWeight: 600,
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: colorTokens.textSecondary,
              backgroundColor: `${colorTokens.textSecondary}10`
            }
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={executeTransfer}
          disabled={loading || !transferPreview || !transferPreview.isValid}
          startIcon={loading ? <CircularProgress size={20} sx={{ color: colorTokens.textOnBrand }} /> : <SaveIcon />}
          variant="contained"
          autoFocus={!loading && !loadingStocks && !productsLoading && !warehousesLoading}
          sx={{
            background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
            color: colorTokens.textOnBrand,
            fontWeight: 700,
            px: 5, py: 1.5, borderRadius: 3,
            boxShadow: `0 6px 20px ${colorTokens.brand}40`,
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${colorTokens.brandHover}, ${colorTokens.brand})`,
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 30px ${colorTokens.brand}50`
            },
            '&:disabled': {
              background: colorTokens.neutral400,
              color: colorTokens.textMuted,
              transform: 'none',
              boxShadow: 'none'
            }
          }}
        >
          {loading ? 
            (formData.autoApprove ? 'Completando...' : 'Creando...') : 
            (formData.autoApprove ? 'Completar Traspaso Automáticamente' : 'Crear Traspaso Pendiente')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}