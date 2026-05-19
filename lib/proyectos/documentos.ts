import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';
import type { RolSistema } from '@/lib/auth/roles';

export type DocCarpeta = 'general' | 'planos' | 'contratos' | 'cotizaciones' | 'fichas' | 'permisos';
export type DocVisibilidad = 'publica' | 'mando' | 'gerencia';

export const CARPETA_LABEL: Record<DocCarpeta, string> = {
  general: 'General',
  planos: 'Planos',
  contratos: 'Contratos',
  cotizaciones: 'Cotizaciones',
  fichas: 'Fichas técnicas',
  permisos: 'Permisos',
};

export const CARPETA_VARIANT: Record<
  DocCarpeta,
  NonNullable<ComponentProps<typeof Badge>['variant']>
> = {
  general: 'outline',
  planos: 'default',
  contratos: 'coral',
  cotizaciones: 'success',
  fichas: 'ink',
  permisos: 'warning',
};

export const VISIBILIDAD_LABEL: Record<DocVisibilidad, string> = {
  publica: 'Pública',
  mando: 'Solo mando',
  gerencia: 'Solo gerencia',
};

export const VISIBILIDAD_VARIANT: Record<
  DocVisibilidad,
  NonNullable<ComponentProps<typeof Badge>['variant']>
> = {
  publica: 'success',
  mando: 'warning',
  gerencia: 'destructive',
};

export const VISIBILIDAD_HINT: Record<DocVisibilidad, string> = {
  publica: 'Visible para todos los que tienen acceso al proyecto (incluye residentes y campo).',
  mando: 'Solo gerencia, jefes y administrador. Residentes NO ven este documento.',
  gerencia: 'Solo gerencia general. Documento confidencial.',
};

/** Qué niveles de visibilidad puede asignar cada rol al subir un documento. */
export function visibilidadesPermitidas(rol: RolSistema): DocVisibilidad[] {
  if (rol === 'gerencia_general') return ['publica', 'mando', 'gerencia'];
  if (rol === 'jefe_proyectos' || rol === 'jefe_presupuestos' || rol === 'administrador') {
    return ['publica', 'mando'];
  }
  // comercial, residente
  return ['publica'];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
