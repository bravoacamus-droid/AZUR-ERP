import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPEN(value: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    ...opts,
  }).format(value);
}

export function formatNumber(value: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2, ...opts }).format(value);
}

export function formatPercent(value: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat('es-PE', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...opts,
  }).format(value);
}

export function initials(name: string | null | undefined) {
  if (!name) return '·';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '·';
}
