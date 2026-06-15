'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut, User as UserIcon, ChevronDown, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/misc';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { rolLabel } from '@/lib/roles';
import { createClient } from '@/lib/supabase/client';

export function UserMenu({
  nombre,
  email,
  rol,
  avatarUrl,
}: {
  nombre: string;
  email: string;
  rol: string;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function cerrarSesion() {
    setSaliendo(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    // limpia la sesión en el servidor también y redirige
    window.location.href = '/auth/logout';
  }

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-2.5 transition-colors hover:bg-secondary">
          <Avatar nombre={nombre} src={avatarUrl} className="size-8" />
          <div className="hidden text-left leading-tight sm:block">
            <p className="text-xs font-semibold">{nombre}</p>
            <p className="text-[10px] text-muted-foreground">{rolLabel(rol)}</p>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      }
    >
      <div className="border-b px-2.5 py-2">
        <p className="text-sm font-medium">{nombre}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
      <DropdownItem onClick={() => router.push('/perfil')}>
        <UserIcon /> Mi perfil
      </DropdownItem>
      <DropdownItem
        onClick={cerrarSesion}
        className="text-azur-700 hover:bg-azur-50"
      >
        {saliendo ? <Loader2 className="animate-spin" /> : <LogOut />} Cerrar sesión
      </DropdownItem>
    </Dropdown>
  );
}
