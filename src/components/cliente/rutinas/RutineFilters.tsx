'use client';

import React from 'react';
import {
  Box,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  InputAdornment,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';

export interface RutineFiltersState {
  search: string;
  difficultyLevel: string;
  status: string;
  muscleGroup: string;
}

interface RutineFiltersProps {
  filters: RutineFiltersState;
  onFilterChange: (filters: RutineFiltersState) => void;
  onClearFilters: () => void;
}

export default function RutineFilters({
  filters,
  onFilterChange,
  onClearFilters
}: RutineFiltersProps) {
  const handleChange = (field: keyof RutineFiltersState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.difficultyLevel ||
    filters.status ||
    filters.muscleGroup;

  return (
    <Box
      sx={{
        bgcolor: colorTokens.neutral300,
        border: `1px solid ${colorTokens.border}`,
        borderRadius: 2,
        p: { xs: 2, sm: 2.5, md: 3 },
        mb: 3
      }}
    >
      <Stack spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {/* Search */}
        <TextField
          fullWidth
          placeholder="Buscar rutinas por nombre o descripción..."
          value={filters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colorTokens.textSecondary }} />
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: colorTokens.neutral200,
              color: colorTokens.textPrimary,
              '& fieldset': { borderColor: colorTokens.border },
              '&:hover fieldset': { borderColor: colorTokens.brand },
              '&.Mui-focused fieldset': { borderColor: colorTokens.brand }
            },
            '& .MuiInputBase-input::placeholder': {
              color: colorTokens.textMuted,
              opacity: 1
            }
          }}
        />

        {/* Filters Row */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 2, md: 2.5 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          {/* Difficulty Level */}
          <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel
              sx={{
                color: colorTokens.textSecondary,
                '&.Mui-focused': { color: colorTokens.brand }
              }}
            >
              Nivel de Dificultad
            </InputLabel>
            <Select
              value={filters.difficultyLevel}
              onChange={(e) => handleChange('difficultyLevel', e.target.value)}
              label="Nivel de Dificultad"
              sx={{
                bgcolor: colorTokens.neutral200,
                color: colorTokens.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.border
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.brand
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.brand
                },
                '& .MuiSvgIcon-root': { color: colorTokens.textSecondary }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: colorTokens.neutral300,
                    border: `1px solid ${colorTokens.border}`,
                    '& .MuiMenuItem-root': {
                      color: colorTokens.textPrimary,
                      '&:hover': { bgcolor: colorTokens.neutral200 },
                      '&.Mui-selected': {
                        bgcolor: colorTokens.brand + '20',
                        '&:hover': { bgcolor: colorTokens.brand + '30' }
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Principiante">Principiante</MenuItem>
              <MenuItem value="Intermedio">Intermedio</MenuItem>
              <MenuItem value="Avanzado">Avanzado</MenuItem>
            </Select>
          </FormControl>

          {/* Status */}
          <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel
              sx={{
                color: colorTokens.textSecondary,
                '&.Mui-focused': { color: colorTokens.brand }
              }}
            >
              Estado
            </InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => handleChange('status', e.target.value)}
              label="Estado"
              sx={{
                bgcolor: colorTokens.neutral200,
                color: colorTokens.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.border
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.brand
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.brand
                },
                '& .MuiSvgIcon-root': { color: colorTokens.textSecondary }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: colorTokens.neutral300,
                    border: `1px solid ${colorTokens.border}`,
                    '& .MuiMenuItem-root': {
                      color: colorTokens.textPrimary,
                      '&:hover': { bgcolor: colorTokens.neutral200 },
                      '&.Mui-selected': {
                        bgcolor: colorTokens.brand + '20',
                        '&:hover': { bgcolor: colorTokens.brand + '30' }
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="active">Activa</MenuItem>
              <MenuItem value="completed">Completada</MenuItem>
              <MenuItem value="paused">Pausada</MenuItem>
            </Select>
          </FormControl>

          {/* Muscle Group */}
          <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel
              sx={{
                color: colorTokens.textSecondary,
                '&.Mui-focused': { color: colorTokens.brand }
              }}
            >
              Grupo Muscular
            </InputLabel>
            <Select
              value={filters.muscleGroup}
              onChange={(e) => handleChange('muscleGroup', e.target.value)}
              label="Grupo Muscular"
              sx={{
                bgcolor: colorTokens.neutral200,
                color: colorTokens.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.border
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.brand
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colorTokens.brand
                },
                '& .MuiSvgIcon-root': { color: colorTokens.textSecondary }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    bgcolor: colorTokens.neutral300,
                    border: `1px solid ${colorTokens.border}`,
                    '& .MuiMenuItem-root': {
                      color: colorTokens.textPrimary,
                      '&:hover': { bgcolor: colorTokens.neutral200 },
                      '&.Mui-selected': {
                        bgcolor: colorTokens.brand + '20',
                        '&:hover': { bgcolor: colorTokens.brand + '30' }
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Pecho">Pecho</MenuItem>
              <MenuItem value="Espalda">Espalda</MenuItem>
              <MenuItem value="Hombros">Hombros</MenuItem>
              <MenuItem value="Brazos">Brazos</MenuItem>
              <MenuItem value="Piernas">Piernas</MenuItem>
              <MenuItem value="Core">Core</MenuItem>
              <MenuItem value="Full Body">Full Body</MenuItem>
            </Select>
          </FormControl>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              onClick={onClearFilters}
              startIcon={<ClearIcon />}
              sx={{
                minWidth: { xs: '100%', sm: 150 },
                height: 56,
                color: colorTokens.textSecondary,
                borderColor: colorTokens.border,
                '&:hover': {
                  bgcolor: colorTokens.neutral200,
                  borderColor: colorTokens.brand
                }
              }}
              variant="outlined"
            >
              Limpiar
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
