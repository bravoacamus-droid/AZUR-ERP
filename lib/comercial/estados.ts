import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';

export type CotizacionEstado =
  | 'borrador'
  | 'enviada'
  | 'en_negociacion'
  | 'aprobada'
  | 'rechazada';

export const COTIZACION_ESTADO_LABEL: Record<CotizacionEstado, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  en_negociacion: 'En negociación',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

export const COTIZACION_ESTADO_VARIANT: Record<
  CotizacionEstado,
  NonNullable<ComponentProps<typeof Badge>['variant']>
> = {
  borrador: 'secondary',
  enviada: 'coral',
  en_negociacion: 'warning',
  aprobada: 'success',
  rechazada: 'destructive',
};

export const INSUMO_CATEGORIA_LABEL: Record<string, string> = {
  mano_obra: 'Mano de obra',
  material: 'Material',
  equipo: 'Equipo',
  subcontrato: 'Subcontrato',
  transporte: 'Transporte',
  gasto_general: 'Gasto general',
};

export const INSUMO_CATEGORIA_VARIANT: Record<
  string,
  NonNullable<ComponentProps<typeof Badge>['variant']>
> = {
  mano_obra: 'coral',
  material: 'default',
  equipo: 'ink',
  subcontrato: 'warning',
  transporte: 'outline',
  gasto_general: 'secondary',
};
