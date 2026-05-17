'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from './sidebar';
import { CommandPalette } from './command-palette';
import { Topbar } from './topbar';
import type { RolSistema } from '@/lib/auth/roles';

type ErpShellProps = {
  children: React.ReactNode;
  fullName: string;
  email: string;
  rol: RolSistema;
  cargo: string | null;
};

export function ErpShell({ children, fullName, email, rol, cargo }: ErpShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-white to-azur-coral/10">
      <Sidebar
        rol={rol}
        fullName={fullName}
        email={email}
        cargo={cargo}
        onOpenCommand={() => setPaletteOpen(true)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar (sidebar oculto en lg-) */}
        <div className="lg:hidden">
          <Topbar fullName={fullName} email={email} rol={rol} cargo={cargo} surface="erp" />
        </div>

        <main className="container py-8">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} rol={rol} />
    </div>
  );
}
