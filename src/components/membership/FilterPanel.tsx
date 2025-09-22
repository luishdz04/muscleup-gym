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
import { darkProTokens } from '@/constants/tokens';
import { Filters, Plan } from '@/types/membership';

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
      background: `linear-gradient(135deg, ${darkProTokens.surfaceLevel2}95, ${darkProTokens.surfaceLevel3}90)`,
      border: `1px solid ${darkProTokens.primary}20`,
      borderRadius: 4
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ 
          color: darkProTokens.primary, 
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
            color: darkProTokens.primary,
            borderColor: `${darkProTokens.primary}60`,
            px: 3,
            py: 1,
            fontWeight: 600,
            '&:hover': {
              borderColor: darkProTokens.primary,
              backgroundColor: `${darkProTokens.primary}10`
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
              <SearchIcon sx={{ color: darkProTokens.primary }} />
            </InputAdornment>
          ),
          sx: {
            color: darkProTokens.textPrimary,
            backgroundColor: `${darkProTokens.grayDark}20`,
            fontSize: '1.1rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: `${darkProTokens.primary}30`,
              borderWidth: 2
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: darkProTokens.primary
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: darkProTokens.primary
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
                    color: darkProTokens.textSecondary,
                    '&.Mui-focused': { color: darkProTokens.primary }
                  }}>
                    Estado
                  </InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => onFilterChange('status', e.target.value)}
                    sx={{
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
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
                    color: darkProTokens.textSecondary,
                    '&.Mui-focused': { color: darkProTokens.primary }
                  }}>
                    Método de Pago
                  </InputLabel>
                  <Select
                    value={filters.paymentMethod}
                    onChange={(e) => onFilterChange('paymentMethod', e.target.value)}
                    sx={{
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
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
                    color: darkProTokens.textSecondary,
                    '&.Mui-focused': { color: darkProTokens.primary }
                  }}>
                    Plan
                  </InputLabel>
                  <Select
                    value={filters.planId}
                    onChange={(e) => onFilterChange('planId', e.target.value)}
                    sx={{
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
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
                    color: darkProTokens.textSecondary,
                    '&.Mui-focused': { color: darkProTokens.primary }
                  }}>
                    Tipo de Venta
                  </InputLabel>
                  <Select
                    value={filters.isRenewal}
                    onChange={(e) => onFilterChange('isRenewal', e.target.value)}
                    sx={{
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
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
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                  InputProps={{
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
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
                      color: darkProTokens.textSecondary,
                      '&.Mui-focused': { color: darkProTokens.primary }
                    }
                  }}
                  InputProps={{
                    sx: {
                      color: darkProTokens.textPrimary,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: `${darkProTokens.primary}30`
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: darkProTokens.primary
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>

            {/* Botón limpiar filtros */}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ 
                color: darkProTokens.textSecondary,
                fontStyle: 'italic'
              }}>
                {hasActiveFilters ? 'Filtros aplicados' : 'Sin filtros activos'}
              </Typography>
              
              <Button
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
                sx={{ 
                  color: darkProTokens.textSecondary,
                  '&:hover': {
                    backgroundColor: `${darkProTokens.textSecondary}10`
                  },
                  '&.Mui-disabled': {
                    color: darkProTokens.textDisabled
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
