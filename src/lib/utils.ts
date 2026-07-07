import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deja solo dígitos (para teléfonos, RUC/DNI, N° de operación, etc.). */
export const soloDigitos = (s: string) => s.replace(/\D/g, '');

/** Dígitos y guiones (para números de cuenta / CCI que se muestran agrupados, p.ej. 200-3002318715). */
export const digitosGuiones = (s: string) => s.replace(/[^\d-]/g, '');

/** Valida formato de email simple. */
export const esEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
