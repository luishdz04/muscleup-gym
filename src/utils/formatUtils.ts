// Función para formatear precio en pesos mexicanos
export const formatPrice = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };
  
  // Función para formatear fecha
  export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Función para formatear fecha y hora completa
  export const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Función para formatear números
  export const formatNumber = (num: number, decimals: number = 0): string => {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };
  
  // Función para formatear porcentaje
  export const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };
  
  // Función para formatear peso (kg, g)
  export const formatWeight = (amount: number, unit: string = 'kg'): string => {
    return `${formatNumber(amount, 2)} ${unit}`;
  };
  
  // Función para formatear volumen (L, ml)
  export const formatVolume = (amount: number, unit: string = 'L'): string => {
    return `${formatNumber(amount, 2)} ${unit}`;
  };
  
  // Función para formatear cantidad con unidad
  export const formatQuantity = (amount: number, unit: string): string => {
    return `${formatNumber(amount)} ${unit}`;
  };
  
  // Función para capitalizar texto
  export const capitalize = (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };
  
  // Función para formatear nombre completo
  export const formatFullName = (firstName: string, lastName?: string): string => {
    if (!lastName) return capitalize(firstName);
    return `${capitalize(firstName)} ${capitalize(lastName)}`;
  };
  
  // Función para formatear teléfono mexicano
  export const formatPhoneNumber = (phone: string): string => {
    // Remover todo excepto números
    const cleaned = phone.replace(/\D/g, '');
    
    // Si tiene 10 dígitos, formatear como: (55) 1234-5678
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    // Si tiene 12 dígitos con código de país, formatear como: +52 (55) 1234-5678
    if (cleaned.length === 12 && cleaned.startsWith('52')) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    
    return phone; // Devolver sin formato si no coincide
  };
  
  // Función para formatear SKU
  export const formatSKU = (sku: string): string => {
    return sku.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  };
  
  // Función para formatear código de barras
  export const formatBarcode = (barcode: string): string => {
    return barcode.replace(/\D/g, '');
  };
  
  // Función para truncar texto
  export const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Función para formatear tiempo transcurrido
  export const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    
    return formatDate(dateString);
  };