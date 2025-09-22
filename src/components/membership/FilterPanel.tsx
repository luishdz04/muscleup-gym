// components/membership/FilterPanel.tsx
'use client';

import React, { memo } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  InputAdornment,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { Filters, Plan } from '@/types/membership';

// ✅ PALETA DE COLORES UNIFICADA
const colorTokens = {
  // Colores base
  brand: '#FFCC00',
  black: '#000000',
  white: '#FFFFFF',
  
  // Escala neutra (Dark Theme)
  neutral0: '#0A0A0B',
  neutral50: '#0F1012',
  neutral100: '#14161A',
  neutral200: '#1B1E24',
  neutral300: '#23272F',
  neutral400: '#2C313B',
  neutral500: '#363C48',
  neutral600: '#424959',
  neutral700: '#535B6E',
  neutral800: '#6A7389',
  neutral900: '#8B94AA',
  neutral1000: '#C9CFDB',
  neutral1100: '#E8ECF5',
  neutral1200: '#FFFFFF',
  
  // Semánticos
  success: '#22C55E',
  danger: '#EF4444',
  info: '#38BDF8',
  warning: '#FFCC00', // Mismo que brand
};

interface Props {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  plans: Plan[];
  hasActiveFilters: boolean;
  statusOptions: Array<{ value: string; label: string; icon: string }>;
  paymentMethodOptions: Array<{ value: string; label: string; icon: string }>;
}

const FilterPanel = memo<Props>(({
  filters,
  onFilterChange,
  onClearFilters,
  showFilters,
  onToggleFilters,
  plans,
  hasActiveFilters,
  statusOptions,
  paymentMethodOptions
}) => {
  return (
    <Paper sx={{
      p: 3,
      mb: 3,
      background: `linear-gradient(135deg, ${colorTokens.neutral200}95, ${colorTokens.neutral300}90)`,
      border: `1px solid ${colorTokens.brand}20`,
      borderRadius: 4
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ 
          color: colorTokens.brand, 
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <SearchIcon />
          Búsqueda y Filtros Avanzados
        </Typography>

        <Button
          startIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={onToggleFilters}
          sx={{ 
            color: colorTokens.brand,
            borderColor: `${colorTokens.brand}60`,
            px: 3,
            py: 1,
            fontWeight: 600,
            '&:hover': {
              borderColor: colorTokens.brand,
              backgroundColor: `${colorTokens.brand}10`
            }
          }}
          variant="outlined"
        >
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </Button>
      </Box>

      {/* Búsqueda principal */}
      <TextField
        fullWidth
        placeholder="Buscar por nombre, email, plan o referencia de pago..."
        value={filters.searchTerm}
        onChange={(e) => onFilterChange('searchTerm', e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: colorTokens.brand }} />
            </InputAdornment>
          ),
          sx: {
            color: colorTokens.neutral1200,
            backgroundColor: `${colorTokens.neutral400}20`,
            fontSize: '1.1rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: `${colorTokens.brand}30`,
              borderWidth: 2
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colorTokens.brand
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colorTokens.brand
            }
          }
        }}
        sx={{ mb: 3 }}
      />

      {/* Filtros avanzados */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Grid container spacing={3}>
              {/* Estado */}
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    color: colorTokens.neutral800,
                    '&.Mui-focused': { color: colorTokens.brand }
                  }}>
                    Estado
                  </InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => onFilterChange('status', e.target.value)}
                    sx={{
                      color: colorTokens.neutral1200,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${colorTokens.brand}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colorTokens.brand
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colorTokens.brand
                      }
                    }}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Método de Pago */}
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    color: colorTokens.neutral800,
                    '&.Mui-focused': { color: colorTokens.brand }
                  }}>
                    Método de Pago
                  </InputLabel>
                  <Select
                    value={filters.paymentMethod}
                    onChange={(e) => onFilterChange('paymentMethod', e.target.value)}
                    sx={{
                      color: colorTokens.neutral1200,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${colorTokens.brand}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colorTokens.brand
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colorTokens.brand
                      }
                    }}
                  >
                    {paymentMethodOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Plan */}
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    color: colorTokens.neutral800,
                    '&.Mui-focused': { color: colorTokens.brand }
                  }}>
                    Plan
                  </InputLabel>
                  <Select
                    value={filters.planId}
                    onChange={(e) => onFilterChange('planId', e.target.value)}
                    sx={{
                      color: colorTokens.neutral1200,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${colorTokens.brand}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colorTokens.brand
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colorTokens.brand
                      }
                    }}
                  >
                    <MenuItem value="">Todos los planes</MenuItem>
                    {plans.map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Tipo de Venta */}
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ 
                    color: colorTokens.neutral800,
                    '&.Mui-focused': { color: colorTokens.brand }
                  }}>
                    Tipo de Venta
                  </InputLabel>
                  <Select
                    value={filters.isRenewal}
                    onChange={(e) => onFilterChange('isRenewal', e.target.value)}
                    sx={{
                      color: colorTokens.neutral1200,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${colorTokens.brand}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colorTokens.brand
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colorTokens.brand
                      }
                    }}
                  >
                    <MenuItem value="">Todos los tipos</MenuItem>
                    <MenuItem value="false">🆕 Primera vez</MenuItem>
                    <MenuItem value="true">🔄 Renovación</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Fecha desde */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha desde"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { 
                      color: colorTokens.neutral800,
                      '&.Mui-focused': { color: colorTokens.brand }
                    }
                  }}
                  InputProps={{
                    sx: {
                      color: colorTokens.neutral1200,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${colorTokens.brand}30`
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
              </Grid>

              {/* Fecha hasta */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Fecha hasta"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => onFilterChange('dateTo', e.target.value)}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { 
                      color: colorTokens.neutral800,
                      '&.Mui-focused': { color: colorTokens.brand }
                    }
                  }}
                  InputProps={{
                    sx: {
                      color: colorTokens.neutral1200,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${colorTokens.brand}30`
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
              </Grid>
            </Grid>

            {/* Botón limpiar filtros */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ 
                color: colorTokens.neutral800,
                fontStyle: 'italic'
              }}>
                {hasActiveFilters ? 'Filtros aplicados' : 'Sin filtros activos'}
              </Typography>
              
              <Button
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
                sx={{ 
                  color: colorTokens.neutral800,
                  '&:hover': {
                    backgroundColor: `${colorTokens.neutral800}10`
                  },
                  '&.Mui-disabled': {
                    color: colorTokens.neutral600
                  }
                }}
              >
                Limpiar Filtros
              </Button>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Paper>
  );
});

FilterPanel.displayName = 'FilterPanel';

export default FilterPanel;
