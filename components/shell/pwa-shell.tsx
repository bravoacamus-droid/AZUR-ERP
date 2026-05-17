'use client';

import { Topbar } from './topbar';
import { BottomNav } from './bottom-nav';
import { InstallPwaPrompt } from './install-pwa-prompt';
import { getPwaPrimaryNav, getPwaMoreNav } from '@/lib/auth/nav';
import type { RolSistema } from '@/lib/auth/roles';

type PwaShellProps = {
  children: React.ReactNode;
  fullName: string;
  email: string;
  rol: RolSistema;
  cargo: string | null;
};

export function PwaShell({ children, fullName, email, rol, cargo }: PwaShellProps) {
  const primary = getPwaPrimaryNav(rol);
  const more = getPwaMoreNav(rol);

  return (
    <div className="min-h-screen bg-gradient-to-b from-azur-coral/15 via-white to-white safe-top">
      <Topbar fullName={fullName} email={email} rol={rol} cargo={cargo} surface="pwa" />

      <main className="px-4 pb-40 pt-6 safe-bottom">{children}</main>

      <BottomNav primary={primary} more={more} />
      <InstallPwaPrompt />
    </div>
  );
}
