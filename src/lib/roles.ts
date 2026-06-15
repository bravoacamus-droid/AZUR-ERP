// Roles del sistema (Sección 2 del documento maestro).
export const ROLES = [
  'gerencia',
  'jefe_proyectos',
  'presupuestos',
  'administrador',
  'comercial',
  'residente',
  'prevencionista',
  'logistico',
] as const;

export type Rol = (typeof ROLES)[number];

export interface RolMeta {
  label: string;
  descripcion: string;
  /** Shell principal donde aterriza el rol */
  shell: 'erp' | 'pwa';
  /** Ruta de inicio */
  home: string;
}

export const ROL_META: Record<Rol, RolMeta> = {
  gerencia: {
    label: 'Gerencia General',
    descripcion: 'ERP completo · aprobación final · dashboards ejecutivos',
    shell: 'erp',
    home: '/inicio',
  },
  jefe_proyectos: {
    label: 'Jefe de Proyectos',
    descripcion: 'Proyectos + Finanzas · 1er nivel de aprobación',
    shell: 'erp',
    home: '/inicio',
  },
  presupuestos: {
    label: 'Jefe de Presupuestos y Costos',
    descripcion: 'Comercial + Proyectos · APU y catálogos',
    shell: 'erp',
    home: '/inicio',
  },
  administrador: {
    label: 'Administrador',
    descripcion: 'Finanzas · 2do nivel · programa pagos, CxC/CxP, cajas',
    shell: 'erp',
    home: '/inicio',
  },
  comercial: {
    label: 'Comercial',
    descripcion: 'Comercial · cotizaciones y estados',
    shell: 'erp',
    home: '/inicio',
  },
  residente: {
    label: 'Residente / Coordinador',
    descripcion: 'PWA campo · RDO, solicitudes, evidencias, valorización',
    shell: 'pwa',
    home: '/campo',
  },
  prevencionista: {
    label: 'Prevencionista (SOMA)',
    descripcion: 'PWA campo · seguridad, charlas, incidentes',
    shell: 'pwa',
    home: '/campo',
  },
  logistico: {
    label: 'Logístico',
    descripcion: 'Almacén y compras · web/PWA',
    shell: 'pwa',
    home: '/campo',
  },
};

// Roles con acceso al shell ERP (web con sidebar).
export const ROLES_ERP: Rol[] = [
  'gerencia',
  'jefe_proyectos',
  'presupuestos',
  'administrador',
  'comercial',
  'logistico',
];

// Roles con acceso al shell PWA (campo).
export const ROLES_PWA: Rol[] = [
  'gerencia',
  'jefe_proyectos',
  'residente',
  'prevencionista',
  'logistico',
];

// Quién ve márgenes / costos (NUNCA residente/prevencionista).
export const ROLES_VEN_MARGEN: Rol[] = ['gerencia', 'presupuestos', 'comercial'];

// Flujo de aprobación de solicitudes de pago.
export const ROL_APRUEBA_N1: Rol[] = ['jefe_proyectos', 'gerencia'];
export const ROL_APRUEBA_N2: Rol[] = ['administrador', 'gerencia'];
export const ROL_APRUEBA_FINAL: Rol[] = ['gerencia'];

export function rolLabel(rol: string): string {
  return ROL_META[rol as Rol]?.label ?? rol;
}
