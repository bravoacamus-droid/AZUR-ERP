'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Undo2, Pencil, X, ChevronLeft, ChevronRight, FileDown, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/misc';
import { fmtDate, fmtMoney } from '@/lib/format';
import { montoDia } from '@/lib/tareo';
import { useIsStandalone } from '@/lib/pwa';
import { revisarTareo, editarTareoFila, corregirTareo } from '@/app/(pwa)/campo/tareo/actions';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const lunesDe = (s: string) => { const d = new Date(s.slice(0, 10) + 'T00:00:00'); const g = d.getDay(); d.setDate(d.getDate() + (g === 0 ? -6 : 1 - g)); return d.toISOString().slice(0, 10); };
const idxDia = (s: string) => { const g = new Date(s.slice(0, 10) + 'T00:00:00').getDay(); return g === 0 ? 6 : g - 1; };
const sumaISO = (iso: string, dias: number) => new Date(new Date(iso + 'T00:00:00').getTime() + dias * 86400000).toISOString().slice(0, 10);
type FilaMatriz = { nombre: string; dias: (number | null)[]; extra: (number | null)[]; totalH: number; totalExtra: number; monto: number };

type Row = { id: string; fecha: string; trabajador_id: string | null; trabajador_nombre: string; presente: boolean; horas: number | null; horas_extra: number | null; jornal_semana: number | null; estado: string; es_correccion?: boolean; nota?: string | null };
const EST: Record<string, { label: string; variant: any }> = {
  registrado: { label: 'Registrado', variant: 'muted' },
  enviado: { label: 'Enviado · por aprobar', variant: 'info' },
  aprobado: { label: 'Aprobado', variant: 'success' },
  pagado: { label: 'Pagado', variant: 'secondary' },
};

export function TareoRevision({ tareo, proyectoId, userRol }: { tareo: Row[]; proyectoId: string; userRol: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<{ id: string; presente: boolean; horas: string; extra: string } | null>(null);
  const [savingFila, setSavingFila] = useState(false);
  const puedeAprobar = userRol === 'jefe_proyectos' || userRol === 'gerencia';

  async function guardarFila() {
    if (!edit) return;
    setSavingFila(true);
    const r = await editarTareoFila(edit.id, edit.presente, edit.horas === '' ? null : Number(edit.horas), edit.extra === '' ? null : Number(edit.extra));
    setSavingFila(false);
    if (!r.ok) { alert(r.error); return; }
    setEdit(null); router.refresh();
  }

  const dias = useMemo(() => {
    const m = new Map<string, Row[]>();
    tareo.forEach((r) => { const a = m.get(r.fecha) ?? []; a.push(r); m.set(r.fecha, a); });
    return [...m.entries()].map(([fecha, filas]) => ({ fecha, filas })).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [tareo]);

  // Matriz semana × trabajador (Lun–Dom) con totales y monto (jornal/48 × horas).
  const semanas = useMemo(() => {
    const m = new Map<string, Map<string, FilaMatriz>>();
    tareo.forEach((r) => {
      if (!r.presente) return;
      const lun = lunesDe(r.fecha);
      const di = idxDia(r.fecha);
      const key = `${r.trabajador_nombre}`;
      const trab = m.get(lun) ?? new Map<string, FilaMatriz>();
      const f = trab.get(key) ?? { nombre: r.trabajador_nombre, dias: Array(7).fill(null), extra: Array(7).fill(null), totalH: 0, totalExtra: 0, monto: 0 };
      const h = Number(r.horas ?? 0); const e = Number(r.horas_extra ?? 0);
      f.dias[di] = (f.dias[di] ?? 0) + h;
      if (e) f.extra[di] = (f.extra[di] ?? 0) + e;
      f.totalH += h; f.totalExtra += e; f.monto += montoDia(Number(r.jornal_semana ?? 0), h, e);
      trab.set(key, f); m.set(lun, trab);
    });
    return [...m.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([lun, trab]) => ({
      lun, filas: [...trab.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      totalMonto: [...trab.values()].reduce((s, f) => s + f.monto, 0),
    }));
  }, [tareo]);

  const [semSel, setSemSel] = useState(0); // 0 = semana más reciente
  const standalone = useIsStandalone();
  const semana = semanas[semSel];

  // Trabajadores que ya aparecen en el tareo del proyecto (para correcciones).
  const trabajadores = useMemo(() => {
    const m = new Map<string, { id: string | null; nombre: string }>();
    tareo.forEach((r) => { const k = r.trabajador_id || `n:${r.trabajador_nombre}`; if (!m.has(k)) m.set(k, { id: r.trabajador_id, nombre: r.trabajador_nombre }); });
    return [...m.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [tareo]);

  const [corrOpen, setCorrOpen] = useState(false);
  const [corr, setCorr] = useState({ fecha: '', trab: '', horas: '', extra: '', nota: '' });
  const [savingCorr, setSavingCorr] = useState(false);
  async function guardarCorreccion() {
    const t = trabajadores.find((x) => (x.id || `n:${x.nombre}`) === corr.trab);
    if (!corr.fecha || !t) { alert('Elige fecha y trabajador'); return; }
    if (!corr.horas && !corr.extra) { alert('Indica horas o horas extra de la corrección'); return; }
    setSavingCorr(true);
    const r = await corregirTareo({
      proyecto_id: proyectoId, nota: corr.nota || null,
      filas: [{ fecha: corr.fecha, trabajador_id: t.id, trabajador_nombre: t.nombre, horas: corr.horas === '' ? null : Number(corr.horas), horas_extra: corr.extra === '' ? null : Number(corr.extra) }],
    });
    setSavingCorr(false);
    if (!r.ok) { alert(r.error); return; }
    setCorr({ fecha: '', trab: '', horas: '', extra: '', nota: '' }); setCorrOpen(false); router.refresh();
  }

  const enviadas = tareo.filter((r) => r.estado === 'enviado');
  const rangoEnviado = enviadas.length ? { desde: enviadas.reduce((m, r) => (r.fecha < m ? r.fecha : m), enviadas[0].fecha), hasta: enviadas.reduce((m, r) => (r.fecha > m ? r.fecha : m), enviadas[0].fecha) } : null;

  async function aprobar(desde: string, hasta: string, aprobado: boolean) {
    setBusy(true);
    const r = await revisarTareo(proyectoId, desde, hasta, aprobado);
    setBusy(false);
    if (!r.ok) alert(r.error); else router.refresh();
  }

  if (tareo.length === 0) return <EmptyState titulo="Sin tareo registrado" descripcion="El residente registra el tareo desde la app de campo." />;

  return (
    <div className="space-y-3">
      {semana && (
        <Card>
          <CardContent className="p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" disabled={semSel >= semanas.length - 1} onClick={() => setSemSel((i) => Math.min(semanas.length - 1, i + 1))}><ChevronLeft className="size-4" /></Button>
                <p className="text-sm font-semibold">Semana del {fmtDate(semana.lun)} al {fmtDate(sumaISO(semana.lun, 6))}</p>
                <Button size="sm" variant="ghost" disabled={semSel <= 0} onClick={() => setSemSel((i) => Math.max(0, i - 1))}><ChevronRight className="size-4" /></Button>
              </div>
              <a href={`/proyectos/${proyectoId}/tareo/pdf?desde=${semana.lun}&hasta=${sumaISO(semana.lun, 6)}${standalone ? '&dl=1' : ''}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-azur-600">
                <FileDown className="size-3.5" /> PDF de la semana
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-1 pr-2 text-left font-medium">Trabajador</th>
                    {DIAS.map((d) => <th key={d} className="px-1 py-1 text-center font-medium">{d}</th>)}
                    <th className="px-1 py-1 text-right font-medium">Tot. h</th>
                    <th className="px-1 py-1 text-right font-medium">Extra</th>
                    <th className="pl-2 py-1 text-right font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {semana.filas.map((f, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1 pr-2 font-medium">{f.nombre}</td>
                      {f.dias.map((h, di) => (
                        <td key={di} className="px-1 py-1 text-center tabular-nums">
                          {h == null && !f.extra[di] ? <span className="text-muted-foreground/40">·</span> : <>{h ?? 0}{f.extra[di] ? <span className="text-amber-600">+{f.extra[di]}</span> : null}</>}
                        </td>
                      ))}
                      <td className="px-1 py-1 text-right tabular-nums">{f.totalH}</td>
                      <td className="px-1 py-1 text-right tabular-nums text-amber-600">{f.totalExtra || '—'}</td>
                      <td className="pl-2 py-1 text-right font-semibold tabular-nums">{fmtMoney(f.monto)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-azur-600/40">
                    <td className="py-1 pr-2 font-semibold" colSpan={8}>Total semana</td>
                    <td className="pl-2 py-1 text-right font-bold tabular-nums text-azur-600" colSpan={2}>{fmtMoney(semana.totalMonto)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Monto = jornal semanal ÷ 48 × horas; la hora extra vale 20% más. El "+" en cada celda son horas extra.</p>
          </CardContent>
        </Card>
      )}

      {/* Corrección post-pago: agrega un ajuste aditivo por fecha sin tocar lo pagado. */}
      {puedeAprobar && trabajadores.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <button type="button" onClick={() => setCorrOpen((v) => !v)} className="flex w-full items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5"><Wrench className="size-4 text-azur-600" /> Corrección post-pago</span>
              <span className="text-xs text-muted-foreground">{corrOpen ? 'Ocultar' : 'Agregar ajuste'}</span>
            </button>
            {corrOpen && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-muted-foreground">Suma un ajuste (horas u horas extra) a una fecha ya cerrada/pagada. Entra como corrección y pasa por aprobación; no modifica lo ya pagado.</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">Fecha</span><Input type="date" value={corr.fecha} onChange={(e) => setCorr({ ...corr, fecha: e.target.value })} /></label>
                  <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">Trabajador</span>
                    <Select value={corr.trab} onChange={(e) => setCorr({ ...corr, trab: e.target.value })}>
                      <option value="">Elegir…</option>
                      {trabajadores.map((t) => <option key={t.id || t.nombre} value={t.id || `n:${t.nombre}`}>{t.nombre}</option>)}
                    </Select>
                  </label>
                  <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">Horas</span><Input type="number" inputMode="decimal" value={corr.horas} onChange={(e) => setCorr({ ...corr, horas: e.target.value })} placeholder="0" /></label>
                  <label className="text-xs"><span className="mb-0.5 block text-muted-foreground">Horas extra</span><Input type="number" inputMode="decimal" value={corr.extra} onChange={(e) => setCorr({ ...corr, extra: e.target.value })} placeholder="0" /></label>
                </div>
                <label className="block text-xs"><span className="mb-0.5 block text-muted-foreground">Motivo (opcional)</span><Input value={corr.nota} onChange={(e) => setCorr({ ...corr, nota: e.target.value })} placeholder="Ej. no se registró el domingo" /></label>
                <div className="flex justify-end">
                  <Button size="sm" variant="gradient" disabled={savingCorr} onClick={guardarCorreccion}>{savingCorr ? <Loader2 className="animate-spin" /> : <Wrench className="size-3.5" />} Registrar corrección</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {puedeAprobar && rangoEnviado && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-3">
            <p className="text-sm"><strong>{enviadas.length}</strong> registro(s) de tareo por aprobar ({fmtDate(rangoEnviado.desde)} – {fmtDate(rangoEnviado.hasta)}).</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => aprobar(rangoEnviado.desde, rangoEnviado.hasta, false)}><Undo2 className="size-3.5" /> Devolver</Button>
              <Button size="sm" variant="gradient" disabled={busy} onClick={() => aprobar(rangoEnviado.desde, rangoEnviado.hasta, true)}>{busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Aprobar todo</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {dias.map(({ fecha, filas }) => {
        const est = EST[filas[0]?.estado] ?? EST.registrado;
        const extras = filas.filter((f) => Number(f.horas_extra) > 0).length;
        return (
          <Card key={fecha}>
            <CardContent className="p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-semibold">{fmtDate(fecha)}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{filas.length} trab.{extras ? ` · ${extras} c/extra` : ''}</span>
                  <Badge variant={est.variant}>{est.label}</Badge>
                </div>
              </div>
              <div className="divide-y">
                {filas.map((f) => {
                  const editable = puedeAprobar && (f.estado === 'registrado' || f.estado === 'enviado');
                  if (edit?.id === f.id) return (
                    <div key={f.id} className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" className="size-4 accent-azur-600" checked={edit.presente} onChange={(e) => setEdit({ ...edit, presente: e.target.checked })} /> {f.trabajador_nombre}</label>
                      <span className="ml-auto flex items-center gap-1">
                        <Input className="h-7 w-16 text-right" type="number" inputMode="decimal" placeholder="h" value={edit.horas} onChange={(e) => setEdit({ ...edit, horas: e.target.value })} />
                        <Input className="h-7 w-16 text-right" type="number" inputMode="decimal" placeholder="extra" value={edit.extra} onChange={(e) => setEdit({ ...edit, extra: e.target.value })} />
                        <button onClick={guardarFila} className="text-emerald-600" title="Guardar">{savingFila ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}</button>
                        <button onClick={() => setEdit(null)} className="text-muted-foreground" title="Cancelar"><X className="size-4" /></button>
                      </span>
                    </div>
                  );
                  return (
                    <div key={f.id} className="flex items-center justify-between py-1 text-sm">
                      <span className={f.presente ? '' : 'text-azur-600 line-through'}>
                        {f.trabajador_nombre}
                        {f.es_correccion && <Badge variant="warning" className="ml-1.5 align-middle text-[10px]">corrección</Badge>}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{f.horas ?? 0} h{Number(f.horas_extra) > 0 ? ` + ${f.horas_extra} extra` : ''}</span>
                        {editable && <button onClick={() => setEdit({ id: f.id, presente: f.presente, horas: f.horas == null ? '' : String(f.horas), extra: f.horas_extra == null ? '' : String(f.horas_extra) })} className="text-muted-foreground hover:text-azur-600" title="Editar"><Pencil className="size-3.5" /></button>}
                      </span>
                    </div>
                  );
                })}
              </div>
              {puedeAprobar && filas[0]?.estado === 'enviado' && (
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => aprobar(fecha, fecha, true)}><CheckCircle2 className="size-3.5" /> Aprobar este día</Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
