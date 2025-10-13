// src/components/pos/CustomerSelector.tsx

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  InputAdornment,
  CircularProgress,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AccountBalance as AccountBalanceIcon,
  Star as StarIcon
} from '@mui/icons-material';

// ✅ IMPORTS ENTERPRISE OBLIGATORIOS v7.0
import { colorTokens } from '@/theme';
import { useHydrated } from '@/hooks/useHydrated';
import { useEntityCRUD } from '@/hooks/useEntityCRUD';
import { notify } from '@/utils/notifications';

// ✅ IMPORTS TIPOS CENTRALIZADOS v7.0 - SIN INTERFACE LOCAL DUPLICADA
import { Customer } from '@/types/pos';

interface CustomerSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
}

export default function CustomerSelector({ open, onClose, onSelect }: CustomerSelectorProps) {
  // ✅ ORDEN ESTABLE DE HOOKS - TODOS AL INICIO ANTES DE CUALQUIER LÓGICA v7.0
  const hydrated = useHydrated();
  const [searchTerm, setSearchTerm] = useState('');
  
  // ✅ CALLBACK ESTABLE PARA CRUD - ANTES DE USEENTITYCRUD v7.0
  const handleError = useCallback((error: string) => {
    notify.error(`Error al cargar clientes: ${error}`);
  }, []);

  // ✅ CRUD ENTERPRISE v7.0 - ESQUEMA BD USERS (CAMELCASE)
  const {
    data: customers,
    loading,
    searchItems,
    stats
  } = useEntityCRUD<Customer>({
    tableName: 'Users', // Detecta camelCase automáticamente
    selectQuery: `
      id,
      firstName,
      lastName,
      email,
      whatsapp,
      rol,
      membership_type,
      points_balance,
      total_purchases,
      createdAt
    `,
    onError: handleError
  });

  // ✅ FILTRAR SOLO CLIENTES (ROL "cliente") v7.0
  const onlyClients = useMemo(() => {
    const clients = customers.filter(user => user.rol === 'cliente');
    console.log('👥 Filtrado de clientes:', {
      total_usuarios: customers.length,
      solo_clientes: clients.length,
      filtrados: customers.length - clients.length
    });
    return clients;
  }, [customers]);

  // ✅ FORMATEAR PRECIO ESTABLE v7.0 - ANTES DEL CONDITIONAL RETURN
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  }, []);

  // ✅ MANEJAR SELECCIÓN v7.0 - ANTES DEL CONDITIONAL RETURN
  const handleSelect = useCallback((customer: Customer) => {
    onSelect(customer);
    notify.success(`Cliente seleccionado: ${customer.firstName} ${customer.lastName || ''}`);
  }, [onSelect]);

  // ✅ LIMPIAR BÚSQUEDA AL CERRAR v7.0 - ANTES DEL CONDITIONAL RETURN
  const handleClose = useCallback(() => {
    setSearchTerm('');
    onClose();
  }, [onClose]);

  // ✅ FILTRAR CLIENTES OPTIMIZADO v7.0 - ANTES DEL CONDITIONAL RETURN
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return onlyClients;
    
    const searchLower = searchTerm.toLowerCase();
    return onlyClients.filter(customer => 
      customer.firstName.toLowerCase().includes(searchLower) ||
      (customer.lastName && customer.lastName.toLowerCase().includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower)) ||
      (customer.whatsapp && customer.whatsapp.includes(searchTerm))
    );
  }, [onlyClients, searchTerm]);

  // ✅ SSR SAFETY v7.0 - DESPUÉS DE TODOS LOS HOOKS
  if (!hydrated) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress sx={{ color: colorTokens.brand }} />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: `linear-gradient(135deg, ${colorTokens.surfaceLevel2}, ${colorTokens.surfaceLevel3})`,
          color: colorTokens.textPrimary,
          borderRadius: 3,
          border: `1px solid ${colorTokens.border}`
        }
      }}
    >
      {/* ✅ HEADER CON BRANDING MUSCLEUP v7.0 */}
      <DialogTitle sx={{ 
        background: `linear-gradient(135deg, ${colorTokens.brand}, ${colorTokens.brandHover})`,
        color: colorTokens.textOnBrand,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <PersonIcon sx={{ fontSize: 28 }} />
        Seleccionar Cliente
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`${onlyClients.length} clientes`}
            size="small"
            sx={{
              backgroundColor: 'rgba(0,0,0,0.2)',
              color: colorTokens.textOnBrand,
              fontWeight: 600
            }}
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ✅ BÚSQUEDA CON COLORTOKENS v7.0 */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: colorTokens.brand }} />
                </InputAdornment>
              ),
              sx: {
                color: colorTokens.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.border
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.brand
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.brand
                }
              }
            }}
          />
        </Box>

        {/* ✅ LISTA DE CLIENTES CON CARGA v7.0 */}
        <Paper
          sx={{
            maxHeight: 400,
            overflow: 'auto',
            background: colorTokens.surfaceLevel1,
            border: `1px solid ${colorTokens.border}`,
            borderRadius: 2
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress sx={{ color: colorTokens.brand }} />
            </Box>
          ) : filteredCustomers.length === 0 ? (
            <Box textAlign="center" py={4}>
              <PersonIcon sx={{ fontSize: 60, color: colorTokens.textSecondary, mb: 2 }} />
              <Typography variant="h6" sx={{ color: colorTokens.textSecondary }} gutterBottom>
                {customers.length === 0
                  ? 'No hay clientes registrados'
                  : 'No se encontraron clientes'
                }
              </Typography>
              <Typography variant="body2" sx={{ color: colorTokens.textMuted }}>
                {customers.length === 0
                  ? 'Los clientes aparecerán aquí cuando se registren'
                  : 'Intenta con otros términos de búsqueda'
                }
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredCustomers.map((customer, index) => (
                <React.Fragment key={customer.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleSelect(customer)}
                      sx={{
                        p: 2,
                        '&:hover': {
                          backgroundColor: colorTokens.hoverOverlay,
                          borderLeft: `4px solid ${colorTokens.brand}`
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: colorTokens.brand,
                            color: colorTokens.textOnBrand,
                            fontWeight: 'bold'
                          }}
                        >
                          {customer.firstName.charAt(0)}{customer.lastName?.charAt(0) || ''}
                        </Avatar>
                      </ListItemAvatar>

                      <ListItemText
                        primary={
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              sx={{ color: colorTokens.textPrimary }}
                              component="span"
                            >
                              {customer.firstName} {customer.lastName || ''}
                            </Typography>
                            {customer.membership_type && (
                              <Chip
                                label={customer.membership_type}
                                size="small"
                                sx={{
                                  backgroundColor: `${colorTokens.success}20`,
                                  color: colorTokens.success,
                                  fontWeight: 600,
                                  fontSize: '0.75rem'
                                }}
                              />
                            )}
                          </span>
                        }
                        secondary={
                          <span style={{ display: 'block', marginTop: '4px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                              {customer.email && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <EmailIcon sx={{ fontSize: 14, color: colorTokens.textMuted }} />
                                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }} component="span">
                                    {customer.email}
                                  </Typography>
                                </span>
                              )}
                              
                              {customer.whatsapp && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <PhoneIcon sx={{ fontSize: 14, color: colorTokens.textMuted }} />
                                  <Typography variant="caption" sx={{ color: colorTokens.textSecondary }} component="span">
                                    {customer.whatsapp}
                                  </Typography>
                                </span>
                              )}
                            </span>

                            {(customer.total_purchases || customer.points_balance) && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                                {customer.total_purchases && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <AccountBalanceIcon sx={{ fontSize: 14, color: colorTokens.info }} />
                                    <Typography
                                      variant="caption"
                                      sx={{ color: colorTokens.info, fontWeight: 600 }}
                                      component="span"
                                    >
                                      {formatPrice(customer.total_purchases)}
                                    </Typography>
                                  </span>
                                )}

                                {customer.points_balance && customer.points_balance > 0 && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <StarIcon sx={{ fontSize: 14, color: colorTokens.warning }} />
                                    <Typography
                                      variant="caption"
                                      sx={{ color: colorTokens.warning, fontWeight: 600 }}
                                      component="span"
                                    >
                                      {customer.points_balance} pts
                                    </Typography>
                                  </span>
                                )}
                              </span>
                            )}
                          </span>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < filteredCustomers.length - 1 && (
                    <Divider sx={{ borderColor: colorTokens.divider }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* ✅ INFO ADICIONAL v7.0 */}
        {filteredCustomers.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: colorTokens.textMuted }}>
              💡 Haz clic en un cliente para seleccionarlo
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          startIcon={<CloseIcon />}
          sx={{
            color: colorTokens.textSecondary,
            '&:hover': {
              backgroundColor: colorTokens.hoverOverlay,
              color: colorTokens.textPrimary
            }
          }}
        >
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}