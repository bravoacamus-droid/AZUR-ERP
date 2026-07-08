import type { Rol } from './roles';

// Módulos principales sobre los que se conceden permisos.
export const MODULOS = [
  'comercial',
  'proyectos',
  'finanzas',
  'inventario',
  'reportes',
  'clientes',
  'catalogos',
  'usuarios',
] as const;
export type Modulo = (typeof MODULOS)[number];

export type Nivel = 'none' | 'ver' | 'editar';

export const MODULO_LABEL: Record<Modulo, string> = {
  comercial: 'Comercial',
  proyectos: 'Proyectos',
  finanzas: 'Finanzas',
  inventario: 'Almacén',
  reportes: 'Reportes',
  clientes: 'Clientes',
  catalogos: 'Catálogos',
  usuarios: 'Usuarios',
};

export type PermisosMap = Partial<Record<Modulo, Nivel>>;

// Permisos de los roles base (réplica del comportamiento actual: acceso = editar,
// reportes = solo ver). Un módulo ausente equivale a 'none'.
export const BASE_ROLE_PERMISOS: Record<Rol, PermisosMap> = {
  gerencia: {
    comercial: 'editar', proyectos: 'editar', finanzas: 'editar', inventario: 'editar',
    reportes: 'ver', clientes: 'editar', catalogos: 'editar', usuarios: 'editar',
  },
  jefe_proyectos: { proyectos: 'editar', finanzas: 'editar', reportes: 'ver' },
  presupuestos: { comercial: 'editar', proyectos: 'editar', reportes: 'ver', clientes: 'editar', catalogos: 'editar' },
  administrador: { finanzas: 'editar', inventario: 'editar', reportes: 'ver', clientes: 'editar', catalogos: 'editar', usuarios: 'editar' },
  comercial: { comercial: 'editar', clientes: 'editar', catalogos: 'editar' },
  logistico: { inventario: 'editar' },
  residente: {},
  prevencionista: {},
};

const ORDEN: Record<Nivel, number> = { none: 0, ver: 1, editar: 2 };

/** Normaliza un permisos jsonb (de rol personalizado) a un mapa válido. */
export function normalizarPermisos(raw: unknown): PermisosMap {
  const out: PermisosMap = {};
  if (raw && typeof raw === 'object') {
    for (const m of MODULOS) {
      const v = (raw as Record<string, unknown>)[m];
      if (v === 'ver' || v === 'editar' || v === 'none') out[m] = v;
    }
  }
  return out;
}

/** Nivel efectivo de un módulo dado un mapa de permisos. */
export function nivelModulo(permisos: PermisosMap, modulo: Modulo): Nivel {
  return permisos[modulo] ?? 'none';
}

/** ¿Puede al menos ver el módulo? */
export function puedeVer(permisos: PermisosMap, modulo: Modulo): boolean {
  return ORDEN[nivelModulo(permisos, modulo)] >= ORDEN.ver;
}

/** ¿Puede editar (crear/editar/borrar) en el módulo? */
export function puedeEditar(permisos: PermisosMap, modulo: Modulo): boolean {
  return ORDEN[nivelModulo(permisos, modulo)] >= ORDEN.editar;
}
