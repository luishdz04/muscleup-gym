// components/dashboard/admin/UserTable.tsx
'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Button
} from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { colorTokens } from '@/theme';
import { User } from '@/types/user';
import UserTableRow from './UserTableRow';

interface UserTableProps {
  users: User[];
  loading: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onView: (user: User) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}

const UserTable = React.memo(({
  users,
  loading,
  onEdit,
  onDelete,
  onView,
  onClearFilters,
  hasFilters
}: UserTableProps) => {
  return (
    <TableContainer 
      component={Paper} 
      sx={{
        background: `linear-gradient(135deg, ${colorTokens.neutral200}, ${colorTokens.neutral300})`,
        border: `1px solid ${colorTokens.neutral400}`,
        borderRadius: 3,
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        '& .MuiTableCell-root': {
          bgcolor: 'transparent !important',
          color: `${colorTokens.neutral1200} !important`,
          borderColor: `${colorTokens.neutral400} !important`
        }
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ 
              bgcolor: `${colorTokens.neutral400} !important`, 
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              fontSize: '1rem'
            }}>
              Usuario
            </TableCell>
            <TableCell sx={{ 
              bgcolor: `${colorTokens.neutral400} !important`, 
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              fontSize: '1rem'
            }}>
              Contacto
            </TableCell>
            <TableCell sx={{ 
              bgcolor: `${colorTokens.neutral400} !important`, 
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              fontSize: '1rem'
            }}>
              Rol
            </TableCell>
            <TableCell sx={{ 
              bgcolor: `${colorTokens.neutral400} !important`, 
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              fontSize: '1rem'
            }}>
              Estado
            </TableCell>
            <TableCell sx={{ 
              bgcolor: `${colorTokens.neutral400} !important`, 
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              textAlign: 'center',
              fontSize: '1rem'
            }}>
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress sx={{ color: colorTokens.brand, mb: 2 }} />
                <Typography sx={{ color: colorTokens.neutral1000 }}>
                  Cargando usuarios...
                </Typography>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: 3 
                }}>
                  <SearchIcon sx={{ fontSize: 64, color: colorTokens.neutral700 }} />
                  <Typography variant="h6" sx={{ color: colorTokens.neutral1000 }}>
                    No se encontraron usuarios
                  </Typography>
                  <Typography variant="body2" sx={{ color: colorTokens.neutral800 }}>
                    {hasFilters 
                      ? 'Intenta cambiar los filtros de búsqueda'
                      : 'No hay usuarios registrados en el sistema'
                    }
                  </Typography>
                  {hasFilters && (
                    <Button
                      variant="outlined"
                      startIcon={<ClearIcon />}
                      onClick={onClearFilters}
                      sx={{
                        color: colorTokens.warning,
                        borderColor: colorTokens.warning,
                        '&:hover': {
                          borderColor: colorTokens.warning,
                          bgcolor: `${colorTokens.warning}10`
                        }
                      }}
                    >
                      Limpiar Filtros
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

UserTable.displayName = 'UserTable';

export default UserTable;