import { format } from 'date-fns-tz';

const MEXICO_TZ = 'America/Mexico_City';

// ✅ Para campos TIMESTAMP WITH TIME ZONE (layaway_expires_at, payment_date)
export const toMexicoTimestamp = (date: Date): string => {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: MEXICO_TZ });
  // Resultado: "2025-06-13T18:03:40-06:00" (hora México con offset)
};

// ✅ Para campos DATE (expiration_date)
export const toMexicoDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd', { timeZone: MEXICO_TZ });
  // Resultado: "2025-06-13" (fecha México sin desfase)
};

// ✅ Para mostrar fechas en la UI
export const formatMexicoDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('es-MX', {
    timeZone: MEXICO_TZ,
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  // Resultado: "13/06/2025 18:03"
};
