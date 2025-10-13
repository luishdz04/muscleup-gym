import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Alias cx para Tremor (mismo comportamiento que cn)
export function cx(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// TREMOR UTILITIES - Estilos consistentes según la guía oficial
// ============================================================================

// Focus ring para inputs y elementos interactivos
export const focusRing = [
  'outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-tremor-brand',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-tremor-background',
];

// Estilos de error para inputs
export const hasErrorInput = [
  'border-danger',
  'focus:border-danger',
  'focus:ring-danger',
];

// Estilos de enfoque para inputs
export const focusInput = [
  'outline-none',
  'focus:ring-2',
  'focus:ring-tremor-brand',
  'focus:border-tremor-brand',
];