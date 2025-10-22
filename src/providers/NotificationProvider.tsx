'use client';

import { Toaster, toast } from 'sonner';
import { useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { colorTokens } from '@/theme';

export default function NotificationProvider({
  children
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Solo suscribirse a eventos si el usuario es admin o empleado
    const checkUserAndSubscribe = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !user.user_metadata?.role) return;

      const userRole = user.user_metadata.role;

      // Solo admin y empleado reciben notificaciones en tiempo real
      if (userRole === 'admin' || userRole === 'empleado') {
        console.log('🔔 Activando notificaciones en tiempo real para:', userRole);
        console.log('📡 Conectando a Supabase Realtime...');

        // Canal de notificaciones administrativas
        const channel = supabase
          .channel('admin-realtime-notifications')

          // 🛒 Nuevas ventas
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'sales'
            },
            (payload: any) => {
              const sale = payload.new;
              console.log('🛒 Nueva venta detectada:', sale);

              // Reproducir sonido opcional
              try {
                const audio = new Audio('/sounds/success.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {}); // Ignorar si falla
              } catch (e) {
                // Ignorar error de audio
              }

              toast.success(
                `🛒 Nueva venta: $${sale.total_amount?.toFixed(2) || '0.00'} MXN`,
                {
                  description: `Folio: ${sale.sale_number || 'N/A'}`,
                  duration: 6000,
                  action: {
                    label: 'Ver detalles',
                    onClick: () => {
                      window.location.href = '/dashboard/admin/sales/history';
                    }
                  }
                }
              );
            }
          )

          // 💪 Nuevas membresías
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'user_memberships'
            },
            async (payload: any) => {
              const membership = payload.new;
              console.log('💪 Nueva membresía detectada:', membership);

              // Obtener información del plan si existe
              let planName = 'Membresía';
              if (membership.plan_id) {
                const { data: plan } = await supabase
                  .from('membership_plans')
                  .select('name')
                  .eq('id', membership.plan_id)
                  .single();

                if (plan) {
                  planName = plan.name;
                }
              }

              // Determinar el tipo de pago basado en payment_type
              let paymentTypeText = membership.payment_type;
              const paymentTypeMap: any = {
                'visit': 'Por Visita',
                'weekly': 'Semanal',
                'biweekly': 'Quincenal',
                'monthly': 'Mensual',
                'bimonthly': 'Bimestral',
                'quarterly': 'Trimestral',
                'semester': 'Semestral',
                'annual': 'Anual'
              };
              paymentTypeText = paymentTypeMap[membership.payment_type] || membership.payment_type;

              toast.info(
                `💪 Nueva membresía: ${planName}`,
                {
                  description: `Tipo: ${paymentTypeText} - Total: $${membership.total_amount?.toFixed(2) || '0.00'}`,
                  duration: 5000,
                  action: {
                    label: 'Ver',
                    onClick: () => {
                      window.location.href = '/dashboard/admin/membresias';
                    }
                  }
                }
              );
            }
          )

          // 💰 Detalles de pago de membresías
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'membership_payment_details'
            },
            async (payload: any) => {
              const payment = payload.new;
              console.log('💰 Nuevo pago de membresía detectado:', payment);

              // Mapear métodos de pago a nombres más claros
              const paymentMethodMap: any = {
                'cash': 'Efectivo',
                'card': 'Tarjeta',
                'transfer': 'Transferencia',
                'debit': 'Débito',
                'credit': 'Crédito',
                'efectivo': 'Efectivo',
                'tarjeta': 'Tarjeta',
                'transferencia': 'Transferencia'
              };

              const methodDisplay = paymentMethodMap[payment.payment_method?.toLowerCase()] || payment.payment_method || 'Efectivo';

              // Si hay referencia de pago, agregarla a la descripción
              let description = `Método: ${methodDisplay}`;
              if (payment.payment_reference) {
                description += ` - Ref: ${payment.payment_reference}`;
              }

              toast.success(
                `💰 Pago de membresía: $${payment.amount?.toFixed(2) || '0.00'} MXN`,
                {
                  description: description,
                  duration: 4000,
                }
              );
            }
          )

          // 💳 Detalles de pago de ventas
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'sale_payment_details'
            },
            async (payload: any) => {
              const payment = payload.new;
              console.log('💳 Nuevo pago de venta detectado:', payment);

              // Mapear métodos de pago igual que en membresías
              const paymentMethodMap: any = {
                'cash': 'Efectivo',
                'card': 'Tarjeta',
                'transfer': 'Transferencia',
                'debit': 'Débito',
                'credit': 'Crédito',
                'efectivo': 'Efectivo',
                'tarjeta': 'Tarjeta',
                'transferencia': 'Transferencia'
              };

              const methodDisplay = paymentMethodMap[payment.payment_method?.toLowerCase()] || payment.payment_method || 'Efectivo';

              // Si hay referencia de pago, agregarla
              let description = `Método: ${methodDisplay}`;
              if (payment.payment_reference) {
                description += ` - Ref: ${payment.payment_reference}`;
              }

              toast.info(
                `💳 Pago de venta: $${payment.amount?.toFixed(2) || '0.00'} MXN`,
                {
                  description: description,
                  duration: 3000,
                }
              );
            }
          )

          .subscribe((status) => {
            console.log('📡 Estado de suscripción:', status);
          });

        // Cleanup al desmontar
        return () => {
          console.log('🔕 Desactivando notificaciones en tiempo real');
          supabase.removeChannel(channel);
        };
      }
    };

    checkUserAndSubscribe();
  }, []);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            color: '#ffffff',
            border: `2px solid ${colorTokens.brand}`,
            boxShadow: '0 10px 30px rgba(255, 204, 0, 0.3)',
            fontSize: '14px',
            fontWeight: '500',
            padding: '16px',
            borderRadius: '12px',
          },
          className: 'sonner-toast',
          descriptionClassName: 'sonner-toast-description',
          actionButtonStyle: {
            backgroundColor: colorTokens.brand,
            color: colorTokens.black,
            fontWeight: '600',
            padding: '6px 12px',
            borderRadius: '6px',
          },
          cancelButtonStyle: {
            backgroundColor: colorTokens.neutral300,
            color: colorTokens.textPrimary,
          },
        }}
        richColors
        closeButton
        expand={true}
        visibleToasts={5}
        gap={8}
      />
    </>
  );
}