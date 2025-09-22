// components/dashboard/admin/UserFilters.tsx
'use client';

import React from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  IconButton, 
  Tooltip,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { colorTokens } from '@/theme';

interface UserFiltersProps {
  searchTerm: string;
  filterRole: string;
  sortBy: 'name' | 'email' | 'createdAt' | 'lastActivity';
  sortOrder: 'asc' | 'desc';
  loading: boolean;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onSortByChange: (value: 'name' | 'email' | 'createdAt' | 'lastActivity') => void;
  onSortOrderToggle: () => void;
  onRefresh: () => void;
}

const UserFilters = React.memo(({
  searchTerm,
  filterRole,
  sortBy,
  sortOrder,
  loading,
  onSearchChange,
  onRoleFilterChange,
  onSortByChange,
  onSortOrderToggle,
  onRefresh
}: UserFiltersProps) => {
  return (
    <Grid container spacing={3} sx={{ mb: 2 }}>
      {/* BÚSQUEDA */}
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          fullWidth
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: colorTokens.neutral800 }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onSearchChange('')}
                  edge="end"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: colorTokens.neutral1200,
              bgcolor: colorTokens.neutral100,
              borderRadius: 2,
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: colorTokens.neutral400,
              },
              '&:hover fieldset': {
                borderColor: colorTokens.brand,
              },
              '&.Mui-focused fieldset': {
                borderColor: colorTokens.brand,
              },
            },
          }}
        />
      </Grid>

      {/* FILTRO POR ROL */}
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ color: colorTokens.neutral1000 }}>Filtrar por Rol</InputLabel>
          <Select
            value={filterRole}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            label="Filtrar por Rol"
            sx={{
              color: colorTokens.neutral1200,
              bgcolor: colorTokens.neutral100,
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colorTokens.neutral400,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: colorTokens.brand,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: colorTokens.brand,
              },
            }}
          >
            <MenuItem value="todos">Todos los roles</MenuItem>
            <MenuItem value="admin">Administradores</MenuItem>
            <MenuItem value="empleado">Empleados</MenuItem>
            <MenuItem value="cliente">Clientes</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      {/* ORDENAR POR */}
      <Grid size={{ xs: 12, md: 3 }}>
        <FormControl fullWidth>
          <InputLabel sx={{ color: colorTokens.neutral1000 }}>Ordenar por</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            label="Ordenar por"
            sx={{
              color: colorTokens.neutral1200,
              bgcolor: colorTokens.neutral100,
              borderRadius: 2,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colorTokens.neutral400,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: colorTokens.brand,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: colorTokens.brand,
              },
            }}
          >
            <MenuItem value="createdAt">Fecha creación</MenuItem>
            <MenuItem value="name">Nombre A-Z</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="lastActivity">Última actividad</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* CONTROLES */}
      <Grid size={{ xs: 12, md: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
          <Tooltip title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}>
            <IconButton 
              onClick={onSortOrderToggle}
              sx={{ 
                color: colorTokens.brand,
                border: `2px solid ${colorTokens.brand}40`,
                '&:hover': { bgcolor: `${colorTokens.brand}10` }
              }}
            >
              <SortIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Actualizar lista">
            <IconButton 
              onClick={onRefresh}
              disabled={loading}
              sx={{ 
                color: colorTokens.brand,
                border: `2px solid ${colorTokens.brand}40`,
                '&:hover': { bgcolor: `${colorTokens.brand}10` }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
    </Grid>
  );
});

UserFilters.displayName = 'UserFilters';

export default UserFilters;