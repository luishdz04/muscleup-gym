// src/components/dialogs/LayawayDetailsDialog.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Stack,
  Avatar,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
// ✅ CORREGIDO: Timeline importado desde @mui/lab
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent
} from '@mui/lab';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Inventory as InventoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatPrice, formatDate } from '@/utils/formatUtils';

interface LayawayDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  layaway: any;
}

export default function LayawayDetailsDialog({ open, onClose, layaway }: LayawayDetailsDialogProps) {
  if (!layaway) return null;

  const progressPercentage = (layaway.paid_amount / layaway.total_amount) * 100;
  const daysLeft = Math.ceil((new Date(layaway.expiration_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #4caf50, #388e3c)',
        color: '#FFFFFF'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CartIcon />
          <Typography variant="h6" fontWeight="bold">
            📦 Detalles del Apartado #{layaway.sale_number}
          </Typography>
        </Box>
        <Button onClick={onClose} sx={{ color: 'inherit', minWidth: 'auto' }}>
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* ✅ CORREGIDO: Grid v2 */}
        <Grid container spacing={3}>
          {/* Información del cliente */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  👤 Información del Cliente
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: '#4caf50' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="600">
                      {layaway.customer_name || 'Cliente General'}
                    </Typography>
                    {layaway.customer_email && (
                      <Typography variant="body2" color="textSecondary">
                        📧 {layaway.customer_email}
                      </Typography>
                    )}
                    {layaway.customer_phone && (
                      <Typography variant="body2" color="textSecondary">
                        📱 {layaway.customer_phone}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Fecha de Apartado:</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {formatDate(layaway.created_at)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" color="textSecondary">Fecha de Vencimiento:</Typography>
                    <Typography variant="body1" fontWeight="600" color={daysLeft < 0 ? 'error.main' : daysLeft < 7 ? 'warning.main' : 'success.main'}>
                      {formatDate(layaway.expiration_date)}
                    </Typography>
                    <Chip 
                      label={
                        daysLeft > 0 ? `${daysLeft} días restantes` : 
                        daysLeft === 0 ? 'Vence hoy' : 
                        `Vencido hace ${Math.abs(daysLeft)} días`
                      }
                      size="small"
                      color={daysLeft < 0 ? 'error' : daysLeft < 7 ? 'warning' : 'success'}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" color="textSecondary">Plan de Pagos:</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {layaway.payment_plan_days} días
                    </Typography>
                  </Box>

                  {layaway.notes && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Notas:</Typography>
                      <Typography variant="body1">
                        {layaway.notes}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Estado financiero */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  💰 Estado Financiero
                </Typography>

                {/* Progreso visual */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">Progreso de Pago</Typography>
                    <Typography variant="body2" fontWeight="600">{Math.round(progressPercentage)}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={progressPercentage} 
                    sx={{ 
                      height: 12, 
                      borderRadius: 6,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: progressPercentage >= 100 ? '#4caf50' : progressPercentage >= 50 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                </Box>

                <Stack spacing={3}>
                  <Box sx={{
                    p: 3,
                    background: 'rgba(33, 150, 243, 0.1)',
                    borderRadius: 3,
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" color="textSecondary">Total del Apartado</Typography>
                    <Typography variant="h4" fontWeight="800" color="primary">
                      {formatPrice(layaway.total_amount)}
                    </Typography>
                  </Box>

                  {/* ✅ CORREGIDO: Grid v2 anidado */}
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Box sx={{
                        p: 2,
                        background: 'rgba(76, 175, 80, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(76, 175, 80, 0.3)',
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" color="textSecondary">Pagado</Typography>
                        <Typography variant="h6" fontWeight="700" color="success.main">
                          {formatPrice(layaway.paid_amount)}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid size={6}>
                      <Box sx={{
                        p: 2,
                        background: 'rgba(255, 152, 0, 0.1)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 152, 0, 0.3)',
                        textAlign: 'center'
                      }}>
                        <Typography variant="body2" color="textSecondary">Pendiente</Typography>
                        <Typography variant="h6" fontWeight="700" color="warning.main">
                          {formatPrice(layaway.pending_amount)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {layaway.initial_payment > 0 && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Pago Inicial:</Typography>
                      <Typography variant="h6" fontWeight="600" color="info.main">
                        {formatPrice(layaway.initial_payment)}
                      </Typography>
                    </Box>
                  )}

                  {layaway.commission_amount > 0 && (
                    <Box>
                      <Typography variant="body2" color="textSecondary">Comisiones Acumuladas:</Typography>
                      <Typography variant="h6" fontWeight="600" color="warning.main">
                        {formatPrice(layaway.commission_amount)}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{
                    p: 2,
                    background: progressPercentage >= 100 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)',
                    borderRadius: 2,
                    border: progressPercentage >= 100 ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255, 193, 7, 0.3)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" color="textSecondary">Estado</Typography>
                    <Chip 
                      label={layaway.status === 'completed' ? 'Completado' : layaway.status === 'pending' ? 'Activo' : layaway.status}
                      color={layaway.status === 'completed' ? 'success' : layaway.status === 'pending' ? 'warning' : 'error'}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Historial de pagos */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  📋 Historial de Pagos
                </Typography>

                {layaway.payment_history && layaway.payment_history.length > 0 ? (
                  <Timeline sx={{ p: 0, m: 0 }}>
                    {layaway.payment_history
                      .sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime())
                      .map((payment: any, index: number) => (
                      <TimelineItem key={payment.id}>
                        <TimelineOppositeContent sx={{ flex: 0.3, px: 1 }}>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(payment.payment_date)}
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot sx={{ 
                            bgcolor: payment.payment_method === 'efectivo' ? '#4caf50' : '#2196f3',
                            width: 32,
                            height: 32
                          }}>
                            <PaymentIcon fontSize="small" />
                          </TimelineDot>
                          {index < layaway.payment_history.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent sx={{ px: 2, pb: 2 }}>
                          <Box>
                            <Typography variant="body1" fontWeight="600">
                              {formatPrice(payment.amount)}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {payment.payment_method === 'efectivo' && '💵 Efectivo'}
                              {payment.payment_method === 'debito' && '💳 Débito'}
                              {payment.payment_method === 'credito' && '💳 Crédito'}
                              {payment.payment_method === 'transferencia' && '🏦 Transferencia'}
                            </Typography>
                            {payment.commission_amount > 0 && (
                              <Typography variant="caption" color="warning.main">
                                Comisión: {formatPrice(payment.commission_amount)}
                              </Typography>
                            )}
                            {payment.payment_reference && (
                              <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                Ref: {payment.payment_reference}
                              </Typography>
                            )}
                            {payment.notes && (
                              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                                {payment.notes}
                              </Typography>
                            )}
                          </Box>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                ) : (
                  <Box sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <PaymentIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">
                      No hay pagos registrados
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Productos del apartado */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, color: '#4caf50', fontWeight: 700 }}>
                  🛍️ Productos en el Apartado
                </Typography>

                {layaway.items && layaway.items.length > 0 ? (
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                          <TableCell><strong>Producto</strong></TableCell>
                          <TableCell align="center"><strong>Cantidad</strong></TableCell>
                          <TableCell align="right"><strong>Precio Unit.</strong></TableCell>
                          <TableCell align="right"><strong>Descuento</strong></TableCell>
                          <TableCell align="right"><strong>Subtotal</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {layaway.items.map((item: any, index: number) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="body1" fontWeight="600">
                                  {item.product_name}
                                </Typography>
                                {item.product_code && (
                                  <Typography variant="caption" color="textSecondary">
                                    Código: {item.product_code}
                                  </Typography>
                                )}
                                {item.notes && (
                                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                                    {item.notes}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={item.quantity}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight="600">
                                {formatPrice(item.unit_price)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {item.discount_amount > 0 ? (
                                <Typography variant="body1" color="success.main" fontWeight="600">
                                  -{formatPrice(item.discount_amount)}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  Sin descuento
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body1" fontWeight="700" color="primary">
                                {formatPrice(item.subtotal)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Totales */}
                        <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                          <TableCell colSpan={4}>
                            <Typography variant="h6" fontWeight="700">
                              TOTAL APARTADO:
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="h6" fontWeight="800" color="primary">
                              {formatPrice(layaway.total_amount)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box sx={{
                    textAlign: 'center',
                    py: 4,
                    color: 'text.secondary'
                  }}>
                    <InventoryIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                    <Typography variant="body2">
                      No hay productos en este apartado
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Información adicional en accordions */}
          <Grid size={{ xs: 12 }}>
            <Stack spacing={2}>
              {/* Historial de cambios de estado */}
              {layaway.status_history && layaway.status_history.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon />
                      <Typography variant="h6" fontWeight="600">
                        📈 Historial de Estados
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Timeline sx={{ m: 0, p: 0 }}>
                      {layaway.status_history
                        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((history: any, index: number) => (
                        <TimelineItem key={history.id}>
                          <TimelineOppositeContent sx={{ flex: 0.3, px: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(history.created_at)}
                            </Typography>
                          </TimelineOppositeContent>
                          <TimelineSeparator>
                            <TimelineDot color="primary">
                              <InfoIcon fontSize="small" />
                            </TimelineDot>
                            {index < layaway.status_history.length - 1 && <TimelineConnector />}
                          </TimelineSeparator>
                          <TimelineContent sx={{ px: 2, pb: 2 }}>
                            <Typography variant="body1" fontWeight="600">
                              {history.previous_status} → {history.new_status}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {history.reason}
                            </Typography>
                            {history.previous_paid_amount !== history.new_paid_amount && (
                              <Typography variant="caption" color="success.main">
                                Pago: {formatPrice(history.previous_paid_amount)} → {formatPrice(history.new_paid_amount)}
                              </Typography>
                            )}
                          </TimelineContent>
                        </TimelineItem>
                      ))}
                    </Timeline>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Información del sistema */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon />
                    <Typography variant="h6" fontWeight="600">
                      ⚙️ Información del Sistema
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">ID del Apartado:</Typography>
                          <Typography variant="body1" fontFamily="monospace">
                            {layaway.id}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Creado:</Typography>
                          <Typography variant="body1">
                            {formatDate(layaway.created_at)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Última Actualización:</Typography>
                          <Typography variant="body1">
                            {formatDate(layaway.updated_at)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid size={6}>
                      <Stack spacing={1}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">Creado por:</Typography>
                          <Typography variant="body1">
                            {layaway.created_by_name || 'Sistema'}
                          </Typography>
                        </Box>
                        {layaway.updated_by_name && (
                          <Box>
                            <Typography variant="body2" color="textSecondary">Actualizado por:</Typography>
                            <Typography variant="body1">
                              {layaway.updated_by_name}
                            </Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="body2" color="textSecondary">Número de Pagos:</Typography>
                          <Typography variant="body1">
                            {layaway.payment_history?.length || 0} pagos realizados
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained" sx={{ 
          background: 'linear-gradient(135deg, #4caf50, #388e3c)',
          fontWeight: 'bold'
        }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}