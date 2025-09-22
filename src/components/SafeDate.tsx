// components/SafeDate.tsx
'use client';
import { useState, useEffect } from 'react';
import { formatDateForDisplay, formatDateLong } from '@/utils/dateUtils';

interface SafeDateProps {
  dateString: string;
  fallback?: string;
}

export const SafeDate = ({ dateString, fallback = 'Cargando...' }: SafeDateProps) => {
  const [formatted, setFormatted] = useState(fallback);
  
  useEffect(() => {
    if (dateString) {
      setFormatted(formatDateForDisplay(dateString));
    }
  }, [dateString]);
  
  return <span>{formatted}</span>;
};

interface SafeDateLongProps {
  dateString: string;
  fallback?: string;
}

export const SafeDateLong = ({ dateString, fallback = 'Calculando...' }: SafeDateLongProps) => {
  const [formatted, setFormatted] = useState(fallback);
  
  useEffect(() => {
    if (dateString) {
      setFormatted(formatDateLong(dateString));
    }
  }, [dateString]);
  
  return <span>{formatted}</span>;
};