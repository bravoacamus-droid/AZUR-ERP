'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Eye, Trash2, Loader2, Copy, BookmarkPlus, FilePlus2 } from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { eliminarCotizacion, duplicarCotizacion } from './actions';

export function CotizacionRowActions({ id, estado, esPlantilla }: { id: string; estado: string; esPlantilla?: boolean }) {
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
  async function duplicar(comoPlantilla: boolean) {
    setBusy(true);
    const res = await duplicarCotizacion(id, { comoPlantilla });
    setBusy(false);
    if (!res.ok) { alert(res.error); return; }
    if (comoPlantilla) router.refresh();
    else if (res.id) router.push(`/comercial/${res.id}`);
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
      {esPlantilla ? (
        <DropdownItem onClick={() => duplicar(false)}><FilePlus2 /> Usar plantilla (crear cotización)</DropdownItem>
      ) : (
        <>
          <DropdownItem onClick={() => duplicar(false)}><Copy /> Duplicar</DropdownItem>
          <DropdownItem onClick={() => duplicar(true)}><BookmarkPlus /> Guardar como plantilla</DropdownItem>
        </>
      )}
      {puedeEliminar && (
        <DropdownItem onClick={borrar} className="text-azur-700 hover:bg-azur-50">
          <Trash2 /> Eliminar
        </DropdownItem>
      )}
    </Dropdown>
  );
}
