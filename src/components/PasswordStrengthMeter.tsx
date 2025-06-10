'use client';

import { useEffect, useState } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState(0);
  const [label, setLabel] = useState('');
  
  useEffect(() => {
    // Si no hay contraseña, no mostrar medidor
    if (!password) {
      setStrength(0);
      setLabel('');
      return;
    }
    
    // Calcular puntaje basado en criterios
    let score = 0;
    
    // Longitud
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Contiene números
    if (/\d/.test(password)) score += 1;
    
    // Contiene mayúsculas y minúsculas
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    
    // Contiene caracteres especiales
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    // Normalizar puntaje entre 1-4
    const normalizedScore = Math.min(Math.max(Math.floor(score * 0.8), 1), 4);
    setStrength(normalizedScore);
    
    // Definir etiquetas según puntaje
    const labels = ['', 'Débil', 'Moderada', 'Fuerte', 'Muy fuerte'];
    setLabel(labels[normalizedScore]);
    
  }, [password]);
  
  // No mostrar nada si no hay contraseña
  if (!password) return null;
  
  // Colores para niveles de seguridad
  const colors = [
    '', 
    'bg-red-500', 
    'bg-orange-500', 
    'bg-yellow-500', 
    'bg-green-500'
  ];
  
  return (
    <div className="mt-1">
      <div className="flex h-1 rounded-full bg-gray-700 overflow-hidden">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`w-1/4 ${index <= strength ? colors[strength] : 'bg-gray-700'}`}
          ></div>
        ))}
      </div>
      <p className={`text-xs mt-1 ${colors[strength].replace('bg-', 'text-')}`}>
        {label}
      </p>
    </div>
  );
}