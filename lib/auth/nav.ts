/**
 * Árbol de navegación por rol — single source of truth.
 * Usado por sidebar ERP, bottom-nav PWA y command palette.
 */
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calculator,
  Camera,
  ClipboardCheck,
  ClipboardList,
  ClipboardSignature,
  FileText,
  FolderOpen,
  HardHat,
  History,
  LayoutDashboard,
  LineChart,
  Mailbox,
  MapPin,
  Package,
  Receipt,
  ShieldAlert,
  Smartphone,
  Truck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { RolSistema } from './roles';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  description?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

// =====================================================================
// ERP — sidebar
// =====================================================================

const ERP_NAV_BY_ROLE: Record<RolSistema, NavGroup[]> = {
  gerencia_general: [
    {
      label: 'General',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, description: 'KPIs ejecutivos cruzados' },
      ],
    },
    {
      label: 'Operación',
      items: [
        { label: 'Proyectos', href: '/proyectos', icon: Building2, description: 'Avance físico vs financiero' },
        { label: 'Cotizaciones', href: '/comercial/cotizaciones', icon: ClipboardCheck, description: 'Pipeline comercial' },
        { label: 'Catálogo & APU', href: '/comercial/catalogo', icon: Calculator, description: 'Partidas e insumos' },
        { label: 'Almacén', href: '/inventario', icon: Package, description: 'Salidas y devoluciones por proyecto' },
      ],
    },
    {
      label: 'Finanzas',
      items: [
        { label: 'Aprobaciones', href: '/finanzas/aprobaciones', icon: Mailbox },
        { label: 'Solicitudes', href: '/finanzas/solicitudes', icon: ClipboardList },
        { label: 'Pagos', href: '/finanzas/pagos', icon: Receipt },
        { label: 'Cajas', href: '/finanzas/cajas', icon: Wallet },
        { label: 'Reportes', href: '/finanzas/reportes', icon: FileText },
      ],
    },
    {
      label: 'Administración',
      items: [
        { label: 'Usuarios', href: '/usuarios', icon: UserCog },
        { label: 'Auditoría', href: '/auditoria', icon: History },
      ],
    },
  ],
  jefe_proyectos: [
    {
      label: 'Mis proyectos',
      items: [
        { label: 'Proyectos', href: '/proyectos', icon: Building2 },
        { label: 'Almacén', href: '/inventario', icon: Package, description: 'Salidas y devoluciones por proyecto' },
      ],
    },
    {
      label: 'Finanzas',
      items: [
        { label: 'Aprobaciones', href: '/finanzas/aprobaciones', icon: Mailbox },
        { label: 'Solicitudes', href: '/finanzas/solicitudes', icon: ClipboardList },
        { label: 'Pagos', href: '/finanzas/pagos', icon: Receipt },
        { label: 'Reportes', href: '/finanzas/reportes', icon: FileText },
      ],
    },
  ],
  jefe_presupuestos: [
    {
      label: 'Comercial',
      items: [
        { label: 'Cotizaciones', href: '/comercial/cotizaciones', icon: ClipboardCheck },
        { label: 'Catálogo', href: '/comercial/catalogo', icon: Calculator },
        { label: 'APU', href: '/comercial/apu', icon: Briefcase },
      ],
    },
    {
      label: 'Proyectos',
      items: [
        { label: 'Proyectos', href: '/proyectos', icon: Building2 },
      ],
    },
  ],
  administrador: [
    {
      label: 'Finanzas',
      items: [
        { label: 'Aprobaciones', href: '/finanzas/aprobaciones', icon: Mailbox },
        { label: 'Solicitudes', href: '/finanzas/solicitudes', icon: ClipboardList },
        { label: 'Pagos', href: '/finanzas/pagos', icon: Receipt },
        { label: 'Cajas', href: '/finanzas/cajas', icon: Wallet },
        { label: 'Reportes', href: '/finanzas/reportes', icon: FileText },
      ],
    },
    {
      label: 'Operación',
      items: [
        { label: 'Almacén', href: '/inventario', icon: Package, description: 'Salidas y devoluciones por proyecto' },
      ],
    },
  ],
  comercial: [
    {
      label: 'Comercial',
      items: [
        { label: 'Cotizaciones', href: '/comercial/cotizaciones', icon: ClipboardCheck },
        { label: 'Catálogo', href: '/comercial/catalogo', icon: Calculator },
        { label: 'APU', href: '/comercial/apu', icon: Briefcase },
      ],
    },
  ],
  residente: [],
};

export function getErpNav(rol: RolSistema): NavGroup[] {
  return ERP_NAV_BY_ROLE[rol] ?? [];
}

// =====================================================================
// PWA — bottom navigation (máximo 4 items + "Más")
// =====================================================================

const PWA_NAV_PRIMARY: Record<RolSistema, NavItem[]> = {
  residente: [
    { label: 'Inicio', href: '/inicio', icon: Smartphone },
    { label: 'Check-in', href: '/checkin', icon: MapPin },
    { label: 'RDO', href: '/rdo', icon: ClipboardSignature },
    { label: 'Pagos', href: '/solicitudes', icon: Wallet },
  ],
  gerencia_general: [
    { label: 'Inicio', href: '/inicio', icon: Smartphone },
    { label: 'RDO', href: '/rdo', icon: ClipboardSignature },
    { label: 'Fotos', href: '/evidencias', icon: Camera },
    { label: 'SST', href: '/sst', icon: ShieldAlert },
  ],
  jefe_proyectos: [
    { label: 'Inicio', href: '/inicio', icon: Smartphone },
    { label: 'RDO', href: '/rdo', icon: ClipboardSignature },
    { label: 'Fotos', href: '/evidencias', icon: Camera },
    { label: 'SST', href: '/sst', icon: ShieldAlert },
  ],
  jefe_presupuestos: [
    { label: 'Inicio', href: '/inicio', icon: Smartphone },
    { label: 'RDO', href: '/rdo', icon: ClipboardSignature },
    { label: 'Fotos', href: '/evidencias', icon: Camera },
    { label: 'Docs', href: '/docs', icon: FolderOpen },
  ],
  administrador: [],
  comercial: [],
};

const PWA_NAV_MORE: Record<RolSistema, NavItem[]> = {
  residente: [
    { label: 'Evidencias', href: '/evidencias', icon: Camera, description: 'Fotos georreferenciadas por partida' },
    { label: 'SST', href: '/sst', icon: ShieldAlert, description: 'Charla 5min, observaciones, incidentes' },
    { label: 'Almacén', href: '/almacen', icon: Package, description: 'Salidas y devoluciones' },
    { label: 'Documentos', href: '/docs', icon: FolderOpen, description: 'Planos, contratos, cotizaciones' },
  ],
  gerencia_general: [
    { label: 'Almacén', href: '/almacen', icon: Package },
    { label: 'Documentos', href: '/docs', icon: FolderOpen },
  ],
  jefe_proyectos: [
    { label: 'Almacén', href: '/almacen', icon: Package },
    { label: 'Documentos', href: '/docs', icon: FolderOpen },
  ],
  jefe_presupuestos: [
    { label: 'SST', href: '/sst', icon: ShieldAlert },
  ],
  administrador: [],
  comercial: [],
};

export function getPwaPrimaryNav(rol: RolSistema): NavItem[] {
  return PWA_NAV_PRIMARY[rol] ?? [];
}

export function getPwaMoreNav(rol: RolSistema): NavItem[] {
  return PWA_NAV_MORE[rol] ?? [];
}

// =====================================================================
// Command palette — agregado plano de todo lo accesible al rol
// =====================================================================

export function getCommandPaletteItems(rol: RolSistema): NavItem[] {
  const erpFlat = ERP_NAV_BY_ROLE[rol]?.flatMap((g) => g.items) ?? [];
  const pwaFlat = [...(PWA_NAV_PRIMARY[rol] ?? []), ...(PWA_NAV_MORE[rol] ?? [])];
  // dedup por href
  const seen = new Set<string>();
  return [...erpFlat, ...pwaFlat].filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

// =====================================================================
// Icon map exportado para componentes que pintan el rol o el módulo
// =====================================================================

export const MODULE_ICON: Record<string, LucideIcon> = {
  dashboard: BarChart3,
  finanzas: Wallet,
  proyectos: Building2,
  comercial: Briefcase,
  usuarios: Users,
  auditoria: History,
  inicio: Smartphone,
  checkin: MapPin,
  rdo: ClipboardSignature,
  solicitudes: Wallet,
  evidencias: Camera,
  sst: HardHat,
  almacen: Truck,
  docs: FolderOpen,
  notificaciones: Bell,
  curva: LineChart,
};
