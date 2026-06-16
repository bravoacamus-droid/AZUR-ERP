'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Eye, Trash2, Loader2 } from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { eliminarCotizacion } from './actions';

export function CotizacionRowActions({ id, estado }: { id: string; estado: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const puedeEliminar = estado !== 'aceptada';

  async function borrar() {
    if (!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return;
    setBusy(true);
    const res = await eliminarCotizacion(id);
    setBusy(false);
    if (res.ok) router.refresh();
    else alert(res.error);
  }

  return (
    <Dropdown
      trigger={
        <button className="rounded-md p-1.5 hover:bg-secondary" onClick={(e) => e.stopPropagation()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4 text-muted-foreground" />}
        </button>
      }
    >
      <Link href={`/comercial/${id}`}>
        <DropdownItem><Eye /> Abrir / Editar</DropdownItem>
      </Link>
      {puedeEliminar && (
        <DropdownItem onClick={borrar} className="text-azur-700 hover:bg-azur-50">
          <Trash2 /> Eliminar
        </DropdownItem>
      )}
    </Dropdown>
  );
}
