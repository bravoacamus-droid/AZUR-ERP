// Estado comercial unificado de una cotización (informe AZ-TDR-SIS-002):
// combina el estado comercial (borrador/enviada/negociación/aceptada…) con la
// revisión de Costos y Presupuestos (en revisión / aprobada / observada).
//   Borrador → En revisión → Aprobada | Observada → En negociación → Aceptada | Rechazada
// "Enviada" y "Vencida" existen en el sistema aunque el informe no las nombra;
// se muestran solo si hay cotizaciones en ese estado.

export type EstadoComercial =
  | 'borrador' | 'en_revision' | 'aprobada' | 'observada' | 'enviada'
  | 'en_negociacion' | 'aceptada' | 'rechazada' | 'vencida';

export const ESTADOS_COMERCIALES: { k: EstadoComercial; label: string; variant: 'muted' | 'warning' | 'success' | 'danger' | 'info' | 'secondary'; color: string; extra?: boolean }[] = [
  { k: 'borrador', label: 'Borrador', variant: 'muted', color: '#898781' },
  { k: 'en_revision', label: 'En revisión', variant: 'warning', color: '#eda100' },
  { k: 'aprobada', label: 'Aprobada', variant: 'info', color: '#2a78d6' },
  { k: 'observada', label: 'Observada', variant: 'danger', color: '#ec835a' },
  { k: 'enviada', label: 'Enviada', variant: 'info', color: '#86b6ef', extra: true },
  { k: 'en_negociacion', label: 'En negociación', variant: 'warning', color: '#6250d6' },
  { k: 'aceptada', label: 'Aceptada', variant: 'success', color: '#0ca30c' },
  { k: 'rechazada', label: 'Rechazada', variant: 'danger', color: '#d03b3b' },
  { k: 'vencida', label: 'Vencida', variant: 'secondary', color: '#52514e', extra: true },
];
export const ESTADO_COMERCIAL_META = Object.fromEntries(ESTADOS_COMERCIALES.map((e) => [e.k, e])) as Record<EstadoComercial, (typeof ESTADOS_COMERCIALES)[number]>;

export function estadoComercial(c: { estado: string; revision_estado?: string | null }): EstadoComercial {
  if (c.estado === 'aceptada' || c.estado === 'rechazada' || c.estado === 'vencida' || c.estado === 'en_negociacion') return c.estado;
  if (c.revision_estado === 'pendiente') return 'en_revision';
  if (c.revision_estado === 'aprobada') return 'aprobada';
  if (c.revision_estado === 'observada') return 'observada';
  return c.estado === 'enviada' ? 'enviada' : 'borrador';
}

export const esEstadoComercial = (k: string | null | undefined): k is EstadoComercial => !!k && k in ESTADO_COMERCIAL_META;

/** Aplica el filtro de estado comercial a una consulta de Supabase sobre cotizaciones. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filtrarEstadoComercial<Q extends { eq: any; in: any; or: any }>(q: Q, k: EstadoComercial): Q {
  const sinRevision = 'revision_estado.is.null,revision_estado.not.in.(pendiente,aprobada,observada)';
  switch (k) {
    case 'aceptada': case 'rechazada': case 'vencida': case 'en_negociacion':
      return q.eq('estado', k);
    case 'en_revision': return q.in('estado', ['borrador', 'enviada']).eq('revision_estado', 'pendiente');
    case 'aprobada': return q.in('estado', ['borrador', 'enviada']).eq('revision_estado', 'aprobada');
    case 'observada': return q.in('estado', ['borrador', 'enviada']).eq('revision_estado', 'observada');
    case 'enviada': return q.eq('estado', 'enviada').or(sinRevision);
    default: return q.eq('estado', 'borrador').or(sinRevision);
  }
}
