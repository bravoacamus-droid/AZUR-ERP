'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Eye, Trash2, Loader2, Copy, BookmarkPlus, FilePlus2, FileDown, Link2, ClipboardCheck } from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { eliminarCotizacion, duplicarCotizacion, solicitarRevision, solicitarEliminacion } from './actions';
import { EliminarCotizacionDialog } from '@/components/comercial/eliminar-cotizacion-dialog';

export function CotizacionRowActions({ id, estado, esPlantilla, puedeEliminarDirecto = false, codigo }: { id: string; estado: string; esPlantilla?: boolean; puedeEliminarDirecto?: boolean; codigo?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [dlg, setDlg] = useState(false);
  // Gerencia elimina cualquier cotización (también aprobadas); el resto solicita.
  const puedeEliminar = true;

  function copiarLink() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/comercial/${id}`);
    }
  }
  async function enviarRevision() {
    setBusy(true);
    const r = await solicitarRevision(id);
    setBusy(false);
    if (r.ok) { router.refresh(); alert('Enviada a revisión ✓ Se notificó a Presupuestos y Gerencia.'); }
    else alert(r.error);
  }
  async function solicitarBorrado() {
    if (!confirm('¿Solicitar la eliminación de esta cotización? Gerencia debe aprobarla.')) return;
    setBusy(true);
    const r = await solicitarEliminacion(id);
    setBusy(false);
    if (r.ok) { router.refresh(); alert('Solicitud enviada ✓ Gerencia fue notificada para aprobar.'); }
    else alert(r.error);
  }

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
    <>
    <Dropdown
      trigger={
        <button type="button" className="rounded-md p-1.5 hover:bg-secondary">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4 text-muted-foreground" />}
        </button>
      }
    >
      <Link href={`/comercial/${id}`}>
        <DropdownItem><Eye /> Abrir / Editar</DropdownItem>
      </Link>
      {!esPlantilla && (
        <>
          <a href={`/comercial/${id}/pdf`} target="_blank" rel="noreferrer">
            <DropdownItem><FileDown /> Descargar PDF</DropdownItem>
          </a>
          <DropdownItem onClick={copiarLink}><Link2 /> Copiar link</DropdownItem>
          {estado !== 'aceptada' && (
            <DropdownItem onClick={enviarRevision}><ClipboardCheck /> Enviar a revisión</DropdownItem>
          )}
        </>
      )}
      {esPlantilla ? (
        <DropdownItem onClick={() => duplicar(false)}><FilePlus2 /> Usar plantilla (crear cotización)</DropdownItem>
      ) : (
        <>
          <DropdownItem onClick={() => duplicar(false)}><Copy /> Duplicar</DropdownItem>
          <DropdownItem onClick={() => duplicar(true)}><BookmarkPlus /> Guardar como plantilla</DropdownItem>
        </>
      )}
      {puedeEliminar && !esPlantilla && (
        puedeEliminarDirecto ? (
          <DropdownItem onClick={() => setDlg(true)} className="text-azur-700 hover:bg-azur-50">
            <Trash2 /> Eliminar
          </DropdownItem>
        ) : (
          <DropdownItem onClick={solicitarBorrado} className="text-azur-700 hover:bg-azur-50">
            <Trash2 /> Solicitar eliminación
          </DropdownItem>
        )
      )}
      {puedeEliminar && esPlantilla && (
        <DropdownItem onClick={borrar} className="text-azur-700 hover:bg-azur-50">
          <Trash2 /> Eliminar
        </DropdownItem>
      )}
    </Dropdown>
    {dlg && <EliminarCotizacionDialog id={id} codigo={codigo} open={dlg} onClose={() => setDlg(false)} onDone={() => { setDlg(false); router.refresh(); }} />}
    </>
  );
}
