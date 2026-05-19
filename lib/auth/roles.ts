/**
 * Definiciones de roles, rutas y permisos para AZUR ERP.
 * Single source of truth para autorización en cliente y middleware.
 */

export const ROLES = [
  'gerencia_general',
  'jefe_proyectos',
  'jefe_presupuestos',
  'administrador',
  'comercial',
  'residente',
] as const;

export type RolSistema = (typeof ROLES)[number];

export const ROL_LABEL: Record<RolSistema, string> = {
  gerencia_general: 'Gerencia General',
  jefe_proyectos: 'Jefe de Proyectos',
  jefe_presupuestos: 'Jefe de Presupuestos',
  administrador: 'Administrador',
  comercial: 'Comercial',
  residente: 'Residente / Coordinador',
};

export const ROL_DESCRIPCION: Record<RolSistema, string> = {
  gerencia_general: 'Visión integral, aprobaciones finales, reportes ejecutivos.',
  jefe_proyectos: 'Aprobaciones, valorización, cronograma, curva S.',
  jefe_presupuestos: 'APU, control presupuesto vs ejecutado, adicionales/deductivos.',
  administrador: 'Programación de pagos, vouchers, detracciones, cajas.',
  comercial: 'Cotizaciones, catálogo de partidas e insumos.',
  residente: 'Check-in GPS, RDO, evidencias, solicitudes desde campo.',
};

export const ROL_COLOR: Record<RolSistema, string> = {
  gerencia_general: '#BE1723',
  jefe_proyectos: '#E20627',
  jefe_presupuestos: '#BE1723',
  administrador: '#E20627',
  comercial: '#ECA4A9',
  residente: '#0A0A0A',
};

/** Pantalla a la que se redirige al hacer login con cada rol */
export const ROL_DEFAULT_HOME: Record<RolSistema, string> = {
  gerencia_general: '/dashboard',
  jefe_proyectos: '/proyectos',
  jefe_presupuestos: '/proyectos',
  administrador: '/finanzas/aprobaciones',
  comercial: '/comercial/cotizaciones',
  residente: '/inicio',
};

// ----------------------- Route groups -----------------------

const ERP_ROUTES = [
  '/dashboard',
  '/finanzas',
  '/proyectos',
  '/comercial',
  '/clientes',
  '/usuarios',
  '/auditoria',
  '/inventario',
  '/manual',
] as const;

const PWA_ROUTES = [
  '/inicio',
  '/checkin',
  '/rdo',
  '/solicitudes',
  '/evidencias',
  '/sst',
  '/almacen',
  '/docs',
] as const;

const AUTH_ROUTES = ['/login', '/recuperar', '/registro'] as const;

export function isErpRoute(pathname: string) {
  return ERP_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function isPwaRoute(pathname: string) {
  return PWA_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

// ----------------------- Permisos por rol -----------------------

const ROL_ALLOWED_ERP: Record<RolSistema, string[]> = {
  gerencia_general: ['/dashboard', '/finanzas', '/proyectos', '/comercial', '/clientes', '/usuarios', '/auditoria', '/inventario', '/manual'],
  jefe_proyectos: ['/proyectos', '/finanzas', '/inventario', '/clientes', '/manual'],
  jefe_presupuestos: ['/comercial', '/proyectos', '/clientes', '/manual'],
  administrador: ['/finanzas', '/inventario', '/clientes', '/manual'],
  comercial: ['/comercial', '/clientes', '/manual'],
  residente: [], // residente no entra al ERP
};

const ROL_ALLOWED_PWA: Record<RolSistema, string[]> = {
  // gerencia/jefes pueden entrar a la PWA para revisar campo, pero su default es ERP
  gerencia_general: ['/inicio', '/rdo', '/evidencias', '/sst', '/docs'],
  jefe_proyectos: ['/inicio', '/rdo', '/evidencias', '/sst', '/docs'],
  jefe_presupuestos: ['/inicio', '/rdo', '/evidencias', '/docs'],
  administrador: [],
  comercial: [],
  residente: ['/inicio', '/checkin', '/rdo', '/solicitudes', '/evidencias', '/sst', '/almacen', '/docs'],
};

export function canAccessRoute(rol: RolSistema, pathname: string): boolean {
  if (isErpRoute(pathname)) {
    return ROL_ALLOWED_ERP[rol].some((r) => pathname === r || pathname.startsWith(`${r}/`));
  }
  if (isPwaRoute(pathname)) {
    return ROL_ALLOWED_PWA[rol].some((r) => pathname === r || pathname.startsWith(`${r}/`));
  }
  return true;
}
