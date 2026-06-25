// Helpers de formato. Bug #2 (Anexo A): Vercel corre en UTC; SIEMPRE pasar
// timeZone: 'America/Lima' a los formatters de fecha. NumberFormatOptions NO
// acepta timeZone (rompe TS) → al formatear números, omitirlo.

export const TZ = 'America/Lima';

// "Ahora" en hora de Perú (para lógica de fechas en servidor — Vercel corre en UTC).
export const nowLima = (): Date => new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
export const todayLimaISO = (): string => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)?.value;
  return `${g('year')}-${g('month')}-${g('day')}`;
};

// ¿Es una fecha pura "yyyy-mm-dd" (sin hora)? Esas NO deben convertirse de TZ:
// new Date('2026-06-13') se interpreta como UTC y en Lima retrocede 1 día.
const esFechaPura = (d: unknown): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);

export const fmtDate = (d: Date | string | null | undefined) => {
  if (!d) return '—';
  if (esFechaPura(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return new Date(d).toLocaleDateString('es-PE', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const fmtDateTime = (d: Date | string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-PE', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const fmtDateInput = (d: Date | string | null | undefined) => {
  if (!d) return '';
  // Fecha pura: ya está en yyyy-mm-dd; devolver tal cual (sin TZ, evita el -1 día).
  if (esFechaPura(d)) return d;
  // Timestamp: convertir a yyyy-mm-dd en TZ Lima.
  const date = new Date(d);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${day}`;
};

// Moneda — NO pasar timeZone aquí (rompe TS en NumberFormatOptions).
export const fmtMoney = (n: number | null | undefined, currency = 'PEN') => {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
};

export const fmtNumber = (n: number | null | undefined, decimals = 2) => {
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(n ?? 0));
};

export const fmtPct = (n: number | null | undefined, decimals = 1) => {
  // recibe fracción (0.25) → "25,0 %"
  return `${fmtNumber(Number(n ?? 0) * 100, decimals)} %`;
};
