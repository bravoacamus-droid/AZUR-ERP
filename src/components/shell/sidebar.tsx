'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon';
import { Logo } from '@/components/brand/logo';
import type { navForRol } from '@/lib/nav';

type Nav = ReturnType<typeof navForRol>;

function NavLinks({ nav, onNavigate }: { nav: Nav; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 no-scrollbar">
      {nav.map((grupo) => (
        <div key={grupo.grupo}>
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            {grupo.grupo}
          </p>
          <div className="space-y-0.5">
            {grupo.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-azur-50 text-azur-700'
                      : 'text-foreground/70 hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon name={item.icon} className={cn('size-[18px]', active && 'text-azur-600')} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ nav }: { nav: Nav }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-white lg:flex">
        <div className="flex h-16 items-center border-b px-5">
          <Logo size={36} />
        </div>
        <NavLinks nav={nav} />
        <div className="border-t p-3 text-[10px] text-muted-foreground">
          AZUR ERP · v1.0
        </div>
      </aside>

      {/* Mobile trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-30 rounded-lg border bg-white p-2 shadow-sm lg:hidden"
        aria-label="Menú"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl animate-fade-in">
            <div className="flex h-16 items-center justify-between border-b px-5">
              <Logo size={36} />
              <button onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <NavLinks nav={nav} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
