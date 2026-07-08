import type { Rol } from './roles';
import { puedeVer, type Modulo, type PermisosMap } from './permisos';

export interface NavItem {
  href: string;
  label: string;
  icon: string; // nombre de icono lucide
  roles: Rol[];
  modulo?: Modulo; // si está definido, la visibilidad se resuelve por permiso de módulo
}

// Navegación del ERP (web, sidebar)
export const ERP_NAV: { grupo: string; items: NavItem[] }[] = [
  {
    grupo: 'General',
    items: [
      { href: '/inicio', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['gerencia', 'jefe_proyectos', 'presupuestos', 'administrador', 'comercial', 'logistico'] },
      { href: '/alertas', label: 'Alertas', icon: 'BellRing', roles: ['gerencia', 'jefe_proyectos', 'administrador'] },
    ],
  },
  {
    grupo: 'Operación',
    items: [
      { href: '/comercial', label: 'Comercial', icon: 'FileText', roles: ['gerencia', 'comercial', 'presupuestos'], modulo: 'comercial' },
      { href: '/proyectos', label: 'Proyectos', icon: 'HardHat', roles: ['gerencia', 'jefe_proyectos', 'presupuestos'], modulo: 'proyectos' },
      { href: '/finanzas', label: 'Finanzas', icon: 'Wallet', roles: ['gerencia', 'jefe_proyectos', 'administrador'], modulo: 'finanzas' },
      { href: '/inventario', label: 'Almacén', icon: 'Package', roles: ['gerencia', 'logistico', 'administrador'], modulo: 'inventario' },
    ],
  },
  {
    grupo: 'Análisis',
    items: [
      { href: '/reportes', label: 'Reportes', icon: 'BarChart3', roles: ['gerencia', 'jefe_proyectos', 'administrador', 'presupuestos'], modulo: 'reportes' },
    ],
  },
  {
    grupo: 'Maestros',
    items: [
      { href: '/clientes', label: 'Clientes', icon: 'Contact', roles: ['gerencia', 'presupuestos', 'comercial', 'administrador'], modulo: 'clientes' },
      { href: '/catalogos', label: 'Catálogos', icon: 'Database', roles: ['gerencia', 'presupuestos', 'comercial', 'administrador'], modulo: 'catalogos' },
      { href: '/usuarios', label: 'Usuarios', icon: 'Users', roles: ['gerencia', 'administrador'], modulo: 'usuarios' },
    ],
  },
];

// Navegación de la PWA (campo, bottom-nav)
export const PWA_NAV: NavItem[] = [
  { href: '/campo', label: 'Inicio', icon: 'Home', roles: ['gerencia', 'jefe_proyectos', 'residente', 'prevencionista', 'logistico'] },
  { href: '/campo/rdo', label: 'Parte', icon: 'ClipboardList', roles: ['gerencia', 'jefe_proyectos', 'residente'] },
  { href: '/campo/solicitudes', label: 'Pagos', icon: 'Receipt', roles: ['gerencia', 'jefe_proyectos', 'residente', 'logistico'] },
  { href: '/campo/sst', label: 'SST', icon: 'ShieldCheck', roles: ['gerencia', 'jefe_proyectos', 'prevencionista', 'residente'] },
  { href: '/campo/almacen', label: 'Almacén', icon: 'Package', roles: ['gerencia', 'logistico', 'residente'] },
];

export function navForRol(rol: Rol) {
  return ERP_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.roles.includes(rol)),
  })).filter((g) => g.items.length > 0);
}

/** Navegación resuelta por permisos efectivos: items con `modulo` se muestran
 *  si el permiso lo permite ver; los demás (inicio/alertas) por rol base. */
export function navForPermisos(rol: Rol, permisos: PermisosMap) {
  return ERP_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => (i.modulo ? puedeVer(permisos, i.modulo) : i.roles.includes(rol))),
  })).filter((g) => g.items.length > 0);
}

export function pwaNavForRol(rol: Rol) {
  return PWA_NAV.filter((i) => i.roles.includes(rol));
}
