import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';

export type ProyectoEstado = 'planificado' | 'en_curso' | 'pausado' | 'cerrado' | 'cancelado';

export const PROYECTO_ESTADO_LABEL: Record<ProyectoEstado, string> = {
  planificado: 'Planificado',
  en_curso: 'En curso',
  pausado: 'Pausado',
  cerrado: 'Cerrado',
  cancelado: 'Cancelado',
};

export const PROYECTO_ESTADO_VARIANT: Record<
  ProyectoEstado,
  NonNullable<ComponentProps<typeof Badge>['variant']>
> = {
  planificado: 'coral',
  en_curso: 'default',
  pausado: 'warning',
  cerrado: 'success',
  cancelado: 'destructive',
};
