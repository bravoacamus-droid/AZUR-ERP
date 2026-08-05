'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { fmtDate } from '@/lib/format';
import { enviarTareo } from './actions';

export type TareoRow = {
  id: string; proyecto_id: string; fecha: string; trabajador_nombre: string;
  presente: boolean; horas: number | null; horas_extra: number | null; estado: string;
  proyecto?: { nombre?: string } | null;
};

const EST: Record<string, { label: string; cls: string }> = {
  registrado: { label: 'Registrado', cls: 'bg-slate-100 text-slate-600' },
  enviado: { label: 'Enviado a revisión', cls: 'bg-sky-100 text-sky-700' },
  aprobado: { label: 'Aprobado', cls: 'bg-emerald-100 text-emerald-700' },
  pagado: { label: 'Pagado', cls: 'bg-violet-100 text-violet-700' },
};
const lunes = () => { const d = new Date(); d.setDate(d.getDate() + (d.getDay() === 0 ? -6 : 1 - d.getDay())); return d.toISOString().slice(0, 10); };
const hoy = () => new Date().toISOString().slice(0, 10);

export function TareoList({ rows, proyectos }: { rows: TareoRow[]; proyectos: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [proy, setProy] = useState('');
  const [desde, setDesde] = useState(lunes());
  const [hasta, setHasta] = useState(hoy());
  const [abierto, setAbierto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const filtradas = useMemo(() => rows.filter((r) => (!proy || r.proyecto_id === proy) && r.fecha >= desde && r.fecha <= hasta), [rows, proy, desde, hasta]);

  // Agrupa por día (clave fecha+proyecto)
  const dias = useMemo(() => {
    const m = new Map<string, { fecha: string; proyecto_id: string; nombre: string; filas: TareoRow[] }>();
    filtradas.forEach((r) => {
      const k = `${r.fecha}__${r.proyecto_id}`;
      const g = m.get(k) ?? { fecha: r.fecha, proyecto_id: r.proyecto_id, nombre: r.proyecto?.nombre ?? 'Proyecto', filas: [] };
      g.filas.push(r); m.set(k, g);
    });
    return [...m.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [filtradas]);

  async function onEnviar() {
    if (!proy) { setMsg('Elige un proyecto para enviar el tareo a revisión.'); return; }
    setBusy(true); setMsg(null);
    const r = await enviarTareo(proy, desde, hasta);
    setBusy(false);
    if (!r.ok) setMsg(r.error ?? 'Error'); else { setMsg('Tareo enviado a revisión ✅'); router.refresh(); }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border bg-white p-3">
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Registros del tareo</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="col-span-2 text-xs"><span className="mb-0.5 block text-muted-foreground">Proyecto</span>
            <Select value={proy} onChange={(e) => setProy(e.target.value)}><option value="">Todos</option>{proyectos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Select></label>
          <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">Desde</span><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
          <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">Hasta</span><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
        </div>
        <Button variant="outline" size="sm" className="mt-2 w-full" disabled={busy || !proy} onClick={onEnviar}>{busy ? <Loader2 className="animate-spin" /> : <Send className="size-4" />} Enviar a revisión (rango)</Button>
        {msg && <p className="mt-1 text-center text-xs text-muted-foreground">{msg}</p>}
      </div>

      {dias.length === 0 ? (
        <p className="rounded-xl border bg-white p-4 text-center text-sm text-muted-foreground">Sin tareo en el rango.</p>
      ) : dias.map((d) => {
        const k = `${d.fecha}__${d.proyecto_id}`;
        const abiertoK = abierto === k;
        const est = d.filas[0]?.estado ?? 'registrado';
        const meta = EST[est] ?? EST.registrado;
        const extras = d.filas.filter((f) => Number(f.horas_extra) > 0).length;
        return (
          <div key={k} className="overflow-hidden rounded-xl border bg-white">
            <button type="button" onClick={() => setAbierto(abiertoK ? null : k)} className="flex w-full items-center justify-between gap-2 p-3 text-left">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{fmtDate(d.fecha)}</p>
                <p className="truncate text-xs text-muted-foreground">{d.nombre} · {d.filas.length} trabajadores{extras ? ` · ${extras} c/extra` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}>{meta.label}</span>
                {abiertoK ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
              </div>
            </button>
            {abiertoK && (
              <div className="border-t px-3 py-2">
                {d.filas.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-1 text-sm">
                    <span className={f.presente ? '' : 'text-azur-600 line-through'}>{f.trabajador_nombre}</span>
                    <span className="text-xs text-muted-foreground">{f.horas ?? 0} h{Number(f.horas_extra) > 0 ? ` + ${f.horas_extra} extra` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
