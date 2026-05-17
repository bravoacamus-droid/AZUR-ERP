'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronLeft, Command, Search, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { logoutAction } from '@/lib/auth/actions';
import { ROL_LABEL, type RolSistema } from '@/lib/auth/roles';
import { getErpNav } from '@/lib/auth/nav';
import { cn, initials } from '@/lib/utils';

type SidebarProps = {
  rol: RolSistema;
  fullName: string;
  email: string;
  cargo: string | null;
  onOpenCommand: () => void;
};

const STORAGE_KEY = 'azur:sidebar:collapsed';

export function Sidebar({ rol, fullName, email, cargo, onOpenCommand }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (stored === '1') setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }

  const groups = getErpNav(rol);

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'group/sidebar sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-white/80 backdrop-blur-xl transition-[width] duration-300 ease-out lg:flex',
        collapsed ? 'w-[76px]' : 'w-[260px]',
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <Logo variant="mark" className="h-9 w-auto shrink-0" priority />
          {!collapsed && (
            <span className="font-display text-base font-bold leading-tight text-azur-ink">AZUR</span>
          )}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={collapsed ? 'Expandir' : 'Colapsar'}
          className="h-8 w-8"
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
        </Button>
      </div>

      {/* Command palette trigger */}
      <div className="px-3 py-3">
        <button
          type="button"
          onClick={onOpenCommand}
          className={cn(
            'group flex w-full items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2 text-sm text-muted-foreground transition-all hover:border-azur-coral hover:text-azur-ink',
            collapsed && 'justify-center px-2',
          )}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Buscar…</span>
              <kbd className="hidden items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                <Command className="h-3 w-3" />K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-azur-red/10 text-azur-red'
                          : 'text-foreground/80 hover:bg-azur-coral/15 hover:text-azur-red',
                        collapsed && 'justify-center px-2',
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-azur-gradient"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.badge != null && (
                        <span className="rounded-full bg-azur-red px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-border/60 p-3">
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl px-2 py-2',
            collapsed && 'justify-center px-0',
          )}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-azur-gradient text-xs font-bold text-white shadow">
            {initials(fullName)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-azur-ink">{fullName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {cargo ?? ROL_LABEL[rol]}
              </p>
            </div>
          )}
        </div>

        {!collapsed && (
          <>
            <Link
              href="/inicio"
              className="mt-2 flex items-center justify-between rounded-xl border border-border/60 bg-white px-3 py-2 text-xs font-medium text-azur-ink transition-colors hover:border-azur-coral hover:text-azur-red"
            >
              Cambiar a app de campo
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <form action={logoutAction} className="mt-2">
              <Button type="submit" variant="ghost" className="w-full justify-start gap-2">
                Cerrar sesión
              </Button>
            </form>
          </>
        )}
      </div>
    </aside>
  );
}
