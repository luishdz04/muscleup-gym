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
        overflow: { xs: 'auto', md: 'hidden' }, // Scroll horizontal en móvil
        backdropFilter: 'blur(10px)',
        maxWidth: '100%', // Prevenir overflow
        '& .MuiTableCell-root': {
          bgcolor: 'transparent !important',
          color: `${colorTokens.neutral1200} !important`,
          borderColor: `${colorTokens.neutral400} !important`,
          fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' },
          padding: { xs: '8px', sm: '12px', md: '16px' }
        }
      }}
    >
      <Table stickyHeader sx={{ minWidth: { xs: 650, md: 'auto' } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{
              bgcolor: `${colorTokens.neutral400} !important`,
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }
            }}>
              Usuario
            </TableCell>
            <TableCell sx={{
              bgcolor: `${colorTokens.neutral400} !important`,
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }
            }}>
              Contacto
            </TableCell>
            <TableCell sx={{
              bgcolor: `${colorTokens.neutral400} !important`,
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
              display: { xs: 'none', md: 'table-cell' } // Ocultar en móvil
            }}>
              Rol
            </TableCell>
            <TableCell sx={{
              bgcolor: `${colorTokens.neutral400} !important`,
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }
            }}>
              Estado
            </TableCell>
            <TableCell sx={{
              bgcolor: `${colorTokens.neutral400} !important`,
              fontWeight: 700,
              borderBottom: `3px solid ${colorTokens.brand}`,
              textAlign: 'center',
              fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }
            }}>
              Acciones
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: 'center', py: { xs: 4, sm: 6, md: 8 } }}>
                <CircularProgress sx={{ color: colorTokens.brand, mb: 2 }} />
                <Typography sx={{
                  color: colorTokens.neutral1000,
                  fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' }
                }}>
                  Cargando usuarios...
                </Typography>
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} sx={{ textAlign: 'center', py: { xs: 4, sm: 6, md: 8 } }}>
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: { xs: 2, sm: 2.5, md: 3 }
                }}>
                  <SearchIcon sx={{
                    fontSize: { xs: 48, sm: 56, md: 64 },
                    color: colorTokens.neutral700
                  }} />
                  <Typography variant="h6" sx={{
                    color: colorTokens.neutral1000,
                    fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
                  }}>
                    No se encontraron usuarios
                  </Typography>
                  <Typography variant="body2" sx={{
                    color: colorTokens.neutral800,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                  }}>
                    {hasFilters
                      ? 'Intenta cambiar los filtros de búsqueda'
                      : 'No hay usuarios registrados en el sistema'
                    }
                  </Typography>
                  {hasFilters && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ClearIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                      onClick={onClearFilters}
                      sx={{
                        color: colorTokens.warning,
                        borderColor: colorTokens.warning,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        px: { xs: 1.5, sm: 2 },
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
