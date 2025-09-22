// components/membership/MembershipTable.tsx
'use client';

import React, { memo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Typography,
  Box,
  Stack,
  Tooltip,
  Checkbox
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { MembershipHistory } from '@/types/membership';

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
  memberships: MembershipHistory[];
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (membership: MembershipHistory) => void;
  onEdit: (membership: MembershipHistory) => void;
  onMoreActions: (event: React.MouseEvent<HTMLElement>, membership: MembershipHistory) => void;
  // Props para modo bulk
  bulkMode: boolean;
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  // Opciones de configuración
  statusOptions: Array<{ value: string; label: string; color: string; icon: string }>;
  paymentMethodOptions: Array<{ value: string; label: string; icon: string }>;
  // Funciones de formato
  formatPrice: (price: number) => string;
  formatDisplayDate: (date: string | null) => string;
  calculateDaysRemaining: (endDate: string | null) => number | null;
  getCurrentFrozenDays: (freezeDate: string | null) => number;
}

const MembershipTable = memo<Props>(({
  memberships,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onViewDetails,
  onEdit,
  onMoreActions,
  bulkMode,
  selectedIds,
  onToggleSelection,
  onSelectAll,
  statusOptions,
  paymentMethodOptions,
  formatPrice,
  formatDisplayDate,
  calculateDaysRemaining,
  getCurrentFrozenDays
}) => {
  // Funciones memoizadas para optimización
  const getStatusColor = useCallback((status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.color || colorTokens.neutral800;
  }, [statusOptions]);

  const getStatusIcon = useCallback((status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption?.icon || '📋';
  }, [statusOptions]);

  const getPaymentIcon = useCallback((paymentMethod: string) => {
    const option = paymentMethodOptions.find(p => p.value === paymentMethod);
    return option?.icon || '💳';
  }, [paymentMethodOptions]);

  // Estado de selección para checkbox principal
  const allEligibleIds = memberships
    .filter(m => m.status === 'active' || m.status === 'frozen')
    .map(m => m.id);
  
  const isAllSelected = selectedIds.length === allEligibleIds.length && selectedIds.length > 0;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < allEligibleIds.length;

  const handleSelectAllChange = useCallback(() => {
    onSelectAll();
  }, [onSelectAll]);

  const paginatedMemberships = memberships.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: `${colorTokens.neutral400}30` }}>
              {bulkMode && (
                <TableCell sx={{ color: colorTokens.neutral1200, fontWeight: 700, width: 50 }}>
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAllChange}
                    sx={{
                      color: colorTokens.brand,
                      '&.Mui-checked': { color: colorTokens.brand },
                      '&.MuiCheckbox-indeterminate': { color: colorTokens.warning }
                    }}
                  />
                </TableCell>
              )}
              <TableCell sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>Cliente</TableCell>
              <TableCell sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>Plan</TableCell>
              <TableCell sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>Vigencia</TableCell>
              <TableCell sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>Pago</TableCell>
              <TableCell sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>Congelamiento</TableCell>
              <TableCell sx={{ color: colorTokens.neutral1200, fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMemberships.map((membership) => (
              <TableRow 
                key={membership.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: `${colorTokens.brand}05` 
                  },
                  backgroundColor: selectedIds.includes(membership.id) ? 
                    `${colorTokens.info}10` : 'transparent'
                }}
              >
                {bulkMode && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(membership.id)}
                      onChange={() => onToggleSelection(membership.id)}
                      disabled={membership.status !== 'active' && membership.status !== 'frozen'}
                      sx={{
                        color: colorTokens.brand,
                        '&.Mui-checked': { color: colorTokens.brand },
                        '&.Mui-disabled': { color: colorTokens.neutral600 }
                      }}
                    />
                  </TableCell>
                )}
                
                <TableCell>
                  <Box>
                    <Typography variant="body1" sx={{ 
                      color: colorTokens.neutral1200,
                      fontWeight: 600
                    }}>
                      {membership.user_name}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: colorTokens.neutral800
                    }}>
                      {membership.user_email}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: colorTokens.neutral1200,
                      fontWeight: 500
                    }}>
                      {membership.plan_name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={membership.payment_type.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: `${colorTokens.info}20`,
                          color: colorTokens.info,
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      />
                      {membership.is_renewal && (
                        <Chip 
                          label="🔄 RENO"
                          size="small"
                          sx={{
                            backgroundColor: `${colorTokens.warning}20`,
                            color: colorTokens.warning,
                            fontSize: '0.7rem',
                            fontWeight: 600
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </TableCell>

                <TableCell>
                  <Chip 
                    label={`${getStatusIcon(membership.status)} ${membership.status.toUpperCase()}`}
                    sx={{
                      backgroundColor: getStatusColor(membership.status),
                      color: colorTokens.neutral1200,
                      fontWeight: 600,
                      minWidth: 100
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: colorTokens.neutral1200,
                      fontWeight: 500
                    }}>
                      📅 Inicio: {formatDisplayDate(membership.start_date)}
                    </Typography>
                    {membership.end_date ? (
                      <>
                        <Typography variant="body2" sx={{ 
                          color: colorTokens.neutral1200,
                          fontWeight: 600,
                          mb: 0.5
                        }}>
                          🏁 Vence: {formatDisplayDate(membership.end_date)}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: (() => {
                            const daysRemaining = calculateDaysRemaining(membership.end_date);
                            if (daysRemaining === null) return colorTokens.neutral800;
                            if (daysRemaining < 0) return colorTokens.danger;
                            if (daysRemaining < 7) return colorTokens.warning;
                            return colorTokens.success;
                          })()
                        }}>
                          ⏰ {(() => {
                            const daysRemaining = calculateDaysRemaining(membership.end_date!);
                            if (daysRemaining === null) return 'Sin límite';
                            if (daysRemaining < 0) return `Vencida hace ${Math.abs(daysRemaining)} días`;
                            if (daysRemaining === 0) return 'Vence hoy';
                            return `${daysRemaining} días restantes`;
                          })()}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" sx={{ 
                        color: colorTokens.success
                      }}>
                        ♾️ Sin vencimiento
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body1" sx={{ 
                      color: colorTokens.brand,
                      fontWeight: 700
                    }}>
                      {formatPrice(membership.amount_paid)}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: colorTokens.neutral800
                    }}>
                      {getPaymentIcon(membership.payment_method)} {membership.payment_method}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    {membership.status === 'frozen' ? (
                      <Box>
                        <Chip 
                          label={`🧊 ${getCurrentFrozenDays(membership.freeze_date)} días`}
                          size="small"
                          sx={{
                            backgroundColor: `${colorTokens.info}20`,
                            color: colorTokens.info,
                            fontWeight: 600,
                            mb: 0.5
                          }}
                        />
                        <Typography variant="caption" sx={{ 
                          color: colorTokens.neutral800,
                          display: 'block'
                        }}>
                          Total: {membership.total_frozen_days} días
                        </Typography>
                      </Box>
                    ) : membership.total_frozen_days > 0 ? (
                      <Chip 
                        label={`🧊 ${membership.total_frozen_days} días`}
                        size="small"
                        sx={{
                          backgroundColor: `${colorTokens.success}20`,
                          color: colorTokens.success,
                          fontWeight: 600
                        }}
                      />
                    ) : (
                      <Typography variant="caption" sx={{ 
                        color: colorTokens.neutral800
                      }}>
                        Sin historial
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        onClick={() => onViewDetails(membership)}
                        sx={{ 
                          color: colorTokens.info,
                          '&:hover': { 
                            backgroundColor: `${colorTokens.info}15` 
                          }
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Editar">
                      <IconButton
                        onClick={() => onEdit(membership)}
                        sx={{ 
                          color: colorTokens.warning,
                          '&:hover': { 
                            backgroundColor: `${colorTokens.warning}15` 
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Más acciones">
                      <IconButton
                        onClick={(event) => onMoreActions(event, membership)}
                        sx={{ 
                          color: colorTokens.neutral800,
                          '&:hover': { 
                            backgroundColor: `${colorTokens.neutral800}15` 
                          }
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={memberships.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        sx={{
          color: colorTokens.neutral1200,
          borderTop: `1px solid ${colorTokens.neutral400}`,
          '& .MuiTablePagination-actions button': {
            color: colorTokens.brand
          },
          '& .MuiTablePagination-select': {
            color: colorTokens.neutral1200
          }
        }}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => 
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </>
  );
});

MembershipTable.displayName = 'MembershipTable';

export default MembershipTable;
