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
import { darkProTokens } from '@/constants/tokens';
import { MembershipHistory } from '@/types/membership';

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
    return statusOption?.color || darkProTokens.textSecondary;
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
            <TableRow sx={{ backgroundColor: `${darkProTokens.grayDark}30` }}>
              {bulkMode && (
                <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700, width: 50 }}>
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isIndeterminate}
                    onChange={handleSelectAllChange}
                    sx={{
                      color: darkProTokens.primary,
                      '&.Mui-checked': { color: darkProTokens.primary },
                      '&.MuiCheckbox-indeterminate': { color: darkProTokens.warning }
                    }}
                  />
                </TableCell>
              )}
              <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Cliente</TableCell>
              <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Plan</TableCell>
              <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Vigencia</TableCell>
              <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Pago</TableCell>
              <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Congelamiento</TableCell>
              <TableCell sx={{ color: darkProTokens.textPrimary, fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedMemberships.map((membership) => (
              <TableRow 
                key={membership.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: `${darkProTokens.primary}05` 
                  },
                  backgroundColor: selectedIds.includes(membership.id) ? 
                    `${darkProTokens.info}10` : 'transparent'
                }}
              >
                {bulkMode && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(membership.id)}
                      onChange={() => onToggleSelection(membership.id)}
                      disabled={membership.status !== 'active' && membership.status !== 'frozen'}
                      sx={{
                        color: darkProTokens.primary,
                        '&.Mui-checked': { color: darkProTokens.primary },
                        '&.Mui-disabled': { color: darkProTokens.textDisabled }
                      }}
                    />
                  </TableCell>
                )}
                
                <TableCell>
                  <Box>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.textPrimary,
                      fontWeight: 600
                    }}>
                      {membership.user_name}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: darkProTokens.textSecondary
                    }}>
                      {membership.user_email}
                    </Typography>
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: darkProTokens.textPrimary,
                      fontWeight: 500
                    }}>
                      {membership.plan_name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={membership.payment_type.toUpperCase()}
                        size="small"
                        sx={{
                          backgroundColor: `${darkProTokens.info}20`,
                          color: darkProTokens.info,
                          fontSize: '0.7rem',
                          fontWeight: 600
                        }}
                      />
                      {membership.is_renewal && (
                        <Chip 
                          label="🔄 RENO"
                          size="small"
                          sx={{
                            backgroundColor: `${darkProTokens.warning}20`,
                            color: darkProTokens.warning,
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
                      color: darkProTokens.textPrimary,
                      fontWeight: 600,
                      minWidth: 100
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body2" sx={{ 
                      color: darkProTokens.textPrimary,
                      fontWeight: 500
                    }}>
                      📅 Inicio: {formatDisplayDate(membership.start_date)}
                    </Typography>
                    {membership.end_date ? (
                      <>
                        <Typography variant="body2" sx={{ 
                          color: darkProTokens.textPrimary,
                          fontWeight: 600,
                          mb: 0.5
                        }}>
                          🏁 Vence: {formatDisplayDate(membership.end_date)}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: (() => {
                            const daysRemaining = calculateDaysRemaining(membership.end_date);
                            if (daysRemaining === null) return darkProTokens.textSecondary;
                            if (daysRemaining < 0) return darkProTokens.error;
                            if (daysRemaining < 7) return darkProTokens.warning;
                            return darkProTokens.success;
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
                        color: darkProTokens.success
                      }}>
                        ♾️ Sin vencimiento
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                <TableCell>
                  <Box>
                    <Typography variant="body1" sx={{ 
                      color: darkProTokens.primary,
                      fontWeight: 700
                    }}>
                      {formatPrice(membership.amount_paid)}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      color: darkProTokens.textSecondary
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
                            backgroundColor: `${darkProTokens.info}20`,
                            color: darkProTokens.info,
                            fontWeight: 600,
                            mb: 0.5
                          }}
                        />
                        <Typography variant="caption" sx={{ 
                          color: darkProTokens.textSecondary,
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
                          backgroundColor: `${darkProTokens.success}20`,
                          color: darkProTokens.success,
                          fontWeight: 600
                        }}
                      />
                    ) : (
                      <Typography variant="caption" sx={{ 
                        color: darkProTokens.textSecondary
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
                          color: darkProTokens.info,
                          '&:hover': { 
                            backgroundColor: `${darkProTokens.info}15` 
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
                          color: darkProTokens.warning,
                          '&:hover': { 
                            backgroundColor: `${darkProTokens.warning}15` 
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
                          color: darkProTokens.textSecondary,
                          '&:hover': { 
                            backgroundColor: `${darkProTokens.textSecondary}15` 
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
          color: darkProTokens.textPrimary,
          borderTop: `1px solid ${darkProTokens.grayDark}`,
          '& .MuiTablePagination-actions button': {
            color: darkProTokens.primary
          },
          '& .MuiTablePagination-select': {
            color: darkProTokens.textPrimary
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
