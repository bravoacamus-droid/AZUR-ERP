import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deja solo dígitos (para teléfonos, RUC/DNI, N° de operación, etc.). */
export const soloDigitos = (s: string) => s.replace(/\D/g, '');

/** Valida formato de email simple. */
export const esEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
