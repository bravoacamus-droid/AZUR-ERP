import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';

export type SolicitudEstado =
  | 'pendiente'
  | 'aprobada_jefe'
  | 'rechazada'
  | 'programada'
  | 'pagada'
  | 'cancelada';

export const SOLICITUD_ESTADO_LABEL: Record<SolicitudEstado, string> = {
  pendiente: 'Pendiente',
  aprobada_jefe: 'Aprobada (jefe)',
  rechazada: 'Rechazada',
  programada: 'Programada',
  pagada: 'Pagada',
  cancelada: 'Cancelada',
};

export const SOLICITUD_ESTADO_VARIANT: Record<
  SolicitudEstado,
  NonNullable<ComponentProps<typeof Badge>['variant']>
> = {
  pendiente: 'warning',
  aprobada_jefe: 'coral',
  rechazada: 'destructive',
  programada: 'default',
  pagada: 'success',
  cancelada: 'secondary',
};

export const SOLICITUD_CATEGORIA_LABEL: Record<string, string> = {
  proveedor: 'Proveedor',
  contratista: 'Contratista',
  jornales: 'Jornales',
  caja_chica: 'Caja chica',
  agua: 'Agua',
  alquiler_equipo: 'Alquiler de equipo',
  flete: 'Flete',
  servicios: 'Servicios',
  otros: 'Otros',
};

export const URGENCIA_LABEL: Record<string, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  critica: 'Crítica',
};

export const URGENCIA_VARIANT: Record<
  string,
  NonNullable<ComponentProps<typeof Badge>['variant']>
> = {
  baja: 'secondary',
  normal: 'outline',
  alta: 'warning',
  critica: 'destructive',
};

/**
 * Genera link wa.me con mensaje pre-armado para compartir el voucher.
 */
export function buildWhatsAppShareLink(opts: {
  phone?: string;
  beneficiario: string;
  concepto: string;
  monto: string;
  fecha: string;
  voucherUrl: string;
}) {
  const text = [
    `📄 *Constancia de pago — AZUR*`,
    ``,
    `Beneficiario: ${opts.beneficiario}`,
    `Concepto: ${opts.concepto}`,
    `Monto: ${opts.monto}`,
    `Fecha: ${opts.fecha}`,
    ``,
    `Voucher: ${opts.voucherUrl}`,
  ].join('\n');
  const encoded = encodeURIComponent(text);
  const phone = (opts.phone || '').replace(/[^\d]/g, '');
  return phone
    ? `https://wa.me/${phone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}
