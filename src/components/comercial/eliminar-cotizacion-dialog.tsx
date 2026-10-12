'use client';

import * as React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { eliminarCotizacion, aprobarEliminacion, infoEliminacionCotizacion } from '@/app/(erp)/comercial/actions';

// Diálogo para eliminar una cotización (incluso aprobada). Si generó un
// proyecto, este se conserva desvinculado; solo si no tiene movimientos se
// ofrece eliminarlo también.
export function EliminarCotizacionDialog({
  id, codigo, open, onClose, onDone, aprobando = false,
}: {
  id: string;
  codigo?: string | null;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  aprobando?: boolean; // Gerencia aprobando una solicitud de eliminación
}) {
  const [info, setInfo] = React.useState<Awaited<ReturnType<typeof infoEliminacionCotizacion>> | null>(null);
  const [borrarProyecto, setBorrarProyecto] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setInfo(null); setBorrarProyecto(false); setError(null);
    infoEliminacionCotizacion(id).then(setInfo).catch(() => setInfo({ ok: false, error: 'No se pudo consultar la cotización.' }));
  }, [open, id]);

  async function confirmar() {
    setBusy(true); setError(null);
    const r = aprobando ? await aprobarEliminacion(id, { borrarProyecto }) : await eliminarCotizacion(id, { borrarProyecto });
    setBusy(false);
    if (!r.ok) { setError(r.error ?? 'No se pudo eliminar'); return; }
    onDone();
  }

  const proy = info?.proyecto ?? null;
  const movs = info?.movimientos ?? [];
  return (
    <Modal open={open} onClose={onClose} title={`Eliminar cotización${codigo ? ` ${codigo}` : ''}`}
      footer={<>
        <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button variant="destructive" onClick={confirmar} disabled={busy || !info?.ok}>{busy ? <Loader2 className="animate-spin" /> : <Trash2 />} Eliminar</Button>
      </>}>
      <div className="space-y-3 text-sm">
        {!info ? (
          <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Revisando la cotización…</p>
        ) : !info.ok ? (
          <p className="text-azur-700">{info.error}</p>
        ) : proy ? (
          <>
            <p>Esta cotización fue <strong>aprobada</strong> y generó el proyecto <strong>{proy.codigo} · {proy.nombre}</strong>. La cotización se eliminará y no se puede deshacer.</p>
            <div className="rounded-lg border bg-muted/30 p-3">
              <label className={`flex items-start gap-2 ${movs.length ? 'opacity-60' : ''}`}>
                <input type="checkbox" className="mt-0.5 size-4 accent-azur-600" checked={borrarProyecto} disabled={movs.length > 0}
                  onChange={(e) => setBorrarProyecto(e.target.checked)} />
                <span>Eliminar también el proyecto {proy.codigo} (con su itemizado, cronograma y caja chica).</span>
              </label>
              {movs.length > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">El proyecto tiene {movs.join(', ')}; por eso se conserva y solo se desvincula de la cotización.</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">Si no lo marcas, el proyecto se conserva sin vínculo con la cotización.</p>
              )}
            </div>
          </>
        ) : (
          <p>¿Eliminar esta cotización? Esta acción no se puede deshacer.</p>
        )}
        {error && <p className="rounded-lg bg-azur-50 px-3 py-2 text-azur-700">{error}</p>}
      </div>
    </Modal>
  );
}
