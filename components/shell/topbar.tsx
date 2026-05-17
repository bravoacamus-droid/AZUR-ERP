'use client';

import { LogOut, User } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { ROL_LABEL, type RolSistema } from '@/lib/auth/roles';
import { logoutAction } from '@/lib/auth/actions';
import { initials } from '@/lib/utils';

type TopbarProps = {
  fullName: string;
  email: string;
  rol: RolSistema;
  cargo: string | null;
  surface?: 'erp' | 'pwa';
};

export function Topbar({ fullName, email, rol, cargo, surface = 'erp' }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-white/85 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo variant="mark" className="h-9 w-auto" priority />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-sm font-bold text-azur-ink">AZUR ERP</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {surface === 'pwa' ? 'App de campo' : 'Plataforma central'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end leading-tight md:flex">
            <span className="text-sm font-semibold text-azur-ink">{fullName}</span>
            <span className="text-[11px] text-muted-foreground">
              {cargo ?? ROL_LABEL[rol]} · {email}
            </span>
          </div>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-azur-gradient text-sm font-bold text-white shadow-azur-md">
            {initials(fullName)}
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="ghost" size="icon" title="Salir">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesión</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
