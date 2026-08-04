'use client';

import * as React from 'react';
import { FileStack } from 'lucide-react';

// Junta los reportes diarios de un rango (por defecto la semana actual) en un
// solo PDF consolidado. Se usa en el ERP (proyecto fijo) y en la PWA (con selector).
function lunesActual(): string {
  const d = new Date();
  const g = d.getDay();
  d.setDate(d.getDate() + (g === 0 ? -6 : 1 - g));
  return d.toISOString().slice(0, 10);
}
const hoyISO = () => new Date().toISOString().slice(0, 10);

export function ReporteConsolidado({
  proyectoId,
  proyectos,
  compact,
}: {
  proyectoId?: string;
  proyectos?: { id: string; nombre: string }[];
  compact?: boolean;
}) {
  const [proy, setProy] = React.useState(proyectoId ?? proyectos?.[0]?.id ?? '');
  const [desde, setDesde] = React.useState(lunesActual());
  const [hasta, setHasta] = React.useState(hoyISO());
  const [estado, setEstado] = React.useState('');
  const [resumen, setResumen] = React.useState(false);
  const pid = proyectoId ?? proy;
  const url = pid ? `/proyectos/${pid}/rdo/consolidado/pdf?desde=${desde}&hasta=${hasta}${estado ? `&estado=${estado}` : ''}${resumen ? '&resumen=1' : ''}` : '';

  const setSemana = (offset: number) => {
    const base = new Date();
    base.setDate(base.getDate() + offset * 7);
    const g = base.getDay();
    const lun = new Date(base); lun.setDate(base.getDate() + (g === 0 ? -6 : 1 - g));
    const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
    setDesde(lun.toISOString().slice(0, 10));
    setHasta(dom.toISOString().slice(0, 10));
  };

  return (
    <div className={`rounded-xl border bg-white p-3 ${compact ? '' : 'shadow-sm'}`}>
      <div className="mb-2 flex items-center gap-2">
        <FileStack className="size-4 text-azur-600" />
        <p className="text-sm font-semibold">Reporte consolidado</p>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">Junta todos los reportes diarios del rango en un solo PDF.</p>
      <div className="flex flex-wrap items-end gap-2">
        {proyectos && !proyectoId && (
          <label className="text-xs">
            <span className="mb-0.5 block text-muted-foreground">Proyecto</span>
            <select value={proy} onChange={(e) => setProy(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-sm">
              {proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </label>
        )}
        <label className="text-xs">
          <span className="mb-0.5 block text-muted-foreground">Desde</span>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs">
          <span className="mb-0.5 block text-muted-foreground">Hasta</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-sm" />
        </label>
        <label className="text-xs">
          <span className="mb-0.5 block text-muted-foreground">Estado</span>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-sm">
            <option value="">Todos</option>
            <option value="aprobado">Solo aprobados</option>
          </select>
        </label>
        <a
          href={url || undefined}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-lg bg-azur-gradient px-3 py-2 text-sm font-medium text-white ${!url ? 'pointer-events-none opacity-50' : ''}`}
        >
          <FileStack className="size-4" /> Generar
        </a>
      </div>
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={resumen} onChange={(e) => setResumen(e.target.checked)} />
        Incluir resumen diario (uso interno · no mostrar al cliente)
      </label>
      <div className="mt-2 flex gap-2 text-[11px]">
        <button type="button" onClick={() => setSemana(0)} className="rounded-full border px-2 py-0.5 text-muted-foreground hover:bg-secondary">Esta semana</button>
        <button type="button" onClick={() => setSemana(-1)} className="rounded-full border px-2 py-0.5 text-muted-foreground hover:bg-secondary">Semana pasada</button>
      </div>
    </div>
  );
}
