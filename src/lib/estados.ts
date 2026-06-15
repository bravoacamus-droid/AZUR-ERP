import type { BadgeProps } from '@/components/ui/badge';

type V = BadgeProps['variant'];

export const ESTADO_COTIZACION: Record<string, { label: string; variant: V }> = {
  borrador: { label: 'Borrador', variant: 'muted' },
  enviada: { label: 'Enviada', variant: 'info' },
  en_negociacion: { label: 'En negociación', variant: 'warning' },
  aceptada: { label: 'Aceptada', variant: 'success' },
  vencida: { label: 'Vencida', variant: 'secondary' },
  rechazada: { label: 'Rechazada', variant: 'danger' },
};

export const ESTADO_PROYECTO: Record<string, { label: string; variant: V }> = {
  planeacion: { label: 'Planeación', variant: 'info' },
  en_ejecucion: { label: 'En ejecución', variant: 'success' },
  pausado: { label: 'Pausado', variant: 'warning' },
  cerrado: { label: 'Cerrado', variant: 'secondary' },
  liquidado: { label: 'Liquidado', variant: 'muted' },
};

export const STATUS_SOLICITUD: Record<string, { label: string; variant: V }> = {
  solicitada: { label: 'Solicitada', variant: 'info' },
  aprobada: { label: 'Aprobada', variant: 'warning' },
  programada: { label: 'Programada', variant: 'warning' },
  pagada: { label: 'Pagada', variant: 'success' },
  conciliada: { label: 'Conciliada', variant: 'success' },
  rechazada: { label: 'Rechazada', variant: 'danger' },
  devuelta: { label: 'Devuelta', variant: 'secondary' },
};

export const TIPO_SOLICITUD_LABEL: Record<string, string> = {
  contratistas: 'Contratistas',
  proveedores: 'Proveedores',
  caja_chica: 'Caja chica',
  servicios: 'Servicios',
  honorarios: 'Honorarios',
};

export const ESTADO_TAREA: Record<string, { label: string; variant: V }> = {
  completado: { label: 'Completado', variant: 'success' },
  en_progreso: { label: 'En progreso', variant: 'info' },
  detenido: { label: 'Detenido', variant: 'warning' },
  en_espera: { label: 'En espera', variant: 'secondary' },
  pendiente: { label: 'Pendiente', variant: 'muted' },
  retrasado: { label: 'Retrasado', variant: 'danger' },
  cancelado: { label: 'Cancelado', variant: 'muted' },
};

export const PRIORIDAD: Record<string, { label: string; variant: V }> = {
  muy_baja: { label: 'Muy baja', variant: 'muted' },
  baja: { label: 'Baja', variant: 'secondary' },
  media: { label: 'Media', variant: 'info' },
  alta: { label: 'Alta', variant: 'warning' },
  muy_alta: { label: 'Muy alta', variant: 'danger' },
};
