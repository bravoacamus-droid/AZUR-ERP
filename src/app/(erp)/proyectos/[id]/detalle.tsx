'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Save, Loader2, CheckCircle2, Calendar, Users, Layers,
  TrendingUp, FileBarChart, Banknote, ListChecks,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Field, EmptyState } from '@/components/ui/misc';
import { KpiCard } from '@/components/ui/page';
import { BarraTresTramos } from '@/components/dashboard/barra-tres-tramos';
import { CurvaS } from '@/components/proyectos/curva-s';
import { fmtMoney, fmtNumber, fmtDate, fmtDateInput, fmtPct } from '@/lib/format';
import { ESTADO_PROYECTO, ESTADO_TAREA, PRIORIDAD } from '@/lib/estados';
import { armarArbol, calcularValorizacion, dilucionAdelanto, type NodoArbol } from '@/lib/calc';
import type { DashboardProyecto } from '@/lib/salud';
import {
  agregarItemProyecto, actualizarItemProyecto, eliminarItemProyecto, crearValorizacion,
  guardarAvances, registrarCobroValorizacion, asignarEquipo, quitarEquipo, guardarArmadas,
  registrarAdicional, resolverAdicional, actualizarProyecto, guardarHito, subirDocumento,
} from '../actions';
import { createClient } from '@/lib/supabase/client';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function ProyectoDetalle(props: any) {
  const { proy, items, valorizaciones, contrapartes, equipo, armadas, adicionales, dash, cajas, perfiles, hitos, documentos, canManage } = props;
  const [tab, setTab] = useState('resumen');
  const est = ESTADO_PROYECTO[proy.estado] ?? { label: proy.estado, variant: 'muted' as const };
  const cajaSaldo = cajas?.[0]?.saldo_actual ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-2 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{proy.nombre}</h1>
              <Badge variant={est.variant}>{est.label}</Badge>
              <Badge variant={proy.tipo_proyecto === 'grande' ? 'info' : 'secondary'}>{proy.tipo_proyecto}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {proy.codigo} · {proy.cliente?.razon_social} · {proy.linea?.nombre}
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'resumen', label: 'Resumen' },
          { value: 'lastplanner', label: 'Last Planner' },
          { value: 'cobros', label: 'Cronograma de cobros' },
          { value: 'adicionales', label: 'Adicionales' },
          { value: 'equipo', label: 'Equipo' },
          { value: 'expediente', label: 'Expediente' },
        ]}
      />

      {tab === 'resumen' && <Resumen proy={proy} dash={dash} cajaSaldo={cajaSaldo} valorizaciones={valorizaciones} hitos={hitos} canManage={canManage} />}
      {tab === 'lastplanner' && <LastPlanner proy={proy} items={items} valorizaciones={valorizaciones} contrapartes={contrapartes} canManage={canManage} />}
      {tab === 'cobros' && <Cobros proy={proy} armadas={armadas} canManage={canManage} />}
      {tab === 'adicionales' && <Adicionales proy={proy} items={items} adicionales={adicionales} canManage={canManage} />}
      {tab === 'equipo' && <Equipo proy={proy} equipo={equipo} perfiles={perfiles} canManage={canManage} />}
      {tab === 'expediente' && <Expediente proy={proy} documentos={documentos} canManage={canManage} />}
    </div>
  );
}

// ───────────────────────────── RESUMEN ────────────────────────────────
function Resumen({ proy, dash, cajaSaldo, valorizaciones, hitos, canManage }: any) {
  const router = useRouter();
  const d: DashboardProyecto = dash ?? { proyecto_id: proy.id, codigo: proy.codigo, nombre: proy.nombre, linea_id: proy.linea_id, estado: proy.estado, tipo_proyecto: proy.tipo_proyecto, proyectado: Number(proy.contrato_total), pagos: 0, gasto: 0, valorizado: 0 };
  const adelanto = Number(proy.contrato_total) * Number(proy.adelanto_pct);
  const [hitoForm, setHitoForm] = useState({ nombre: '', fecha: '' });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Contrato" value={fmtMoney(Number(proy.contrato_total))} icon={<FileBarChart />} />
          <KpiCard label="Cobrado" value={fmtMoney(d.pagos)} tone="success" icon={<TrendingUp />} />
          <KpiCard label="Gasto" value={fmtMoney(d.gasto)} tone="azur" icon={<Banknote />} />
          <KpiCard label="Caja chica" value={fmtMoney(Number(cajaSaldo))} icon={<Banknote />} />
        </div>
        <BarraTresTramos p={d} />
        {proy.tipo_proyecto === 'grande' && (
          <CurvaS contratoTotal={Number(proy.contrato_total)} fechaInicio={proy.fecha_inicio} fechaFin={proy.fecha_fin} valorizaciones={valorizaciones} />
        )}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2"><CardTitle className="text-base flex items-center gap-2"><Calendar className="size-4 text-azur-600" /> Hitos contractuales</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(!hitos || hitos.length === 0) && <p className="text-sm text-muted-foreground">Sin hitos registrados.</p>}
            {hitos?.map((h: any) => {
              const vencido = !h.cumplido && new Date(h.fecha_comprometida) < new Date();
              return (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-2.5">
                  <div><p className="text-sm font-medium">{h.nombre}</p><p className="text-xs text-muted-foreground">{fmtDate(h.fecha_comprometida)}</p></div>
                  <Badge variant={h.cumplido ? 'success' : vencido ? 'danger' : 'info'}>{h.cumplido ? 'Cumplido' : vencido ? 'Vencido' : 'Próximo'}</Badge>
                </div>
              );
            })}
            {canManage && (
              <div className="flex items-end gap-2 border-t pt-2">
                <Field label="Hito" className="flex-1"><Input value={hitoForm.nombre} onChange={(e) => setHitoForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Entrega de casco" /></Field>
                <Field label="Fecha"><Input type="date" value={hitoForm.fecha} onChange={(e) => setHitoForm((f) => ({ ...f, fecha: e.target.value }))} /></Field>
                <Button variant="outline" disabled={!hitoForm.nombre || !hitoForm.fecha} onClick={async () => { await guardarHito(proy.id, hitoForm.nombre, hitoForm.fecha); setHitoForm({ nombre: '', fecha: '' }); router.refresh(); }}><Plus /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Datos del proyecto</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Dato k="Dirección" v={proy.direccion} />
            <Dato k="Inicio" v={fmtDate(proy.fecha_inicio)} />
            <Dato k="Fin" v={fmtDate(proy.fecha_fin)} />
            <Dato k="Modalidad" v={proy.modalidad_cobro} />
            <Dato k="Adelanto" v={`${fmtPct(Number(proy.adelanto_pct))} · ${fmtMoney(adelanto)}`} />
          </CardContent>
        </Card>
        {canManage && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Configuración rápida</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Field label="Estado">
                <Select defaultValue={proy.estado} onChange={async (e) => { await actualizarProyecto(proy.id, { estado: e.target.value }); router.refresh(); }}>
                  {Object.entries(ESTADO_PROYECTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Contrato total">
                  <Input type="number" defaultValue={Number(proy.contrato_total)} onBlur={async (e) => { await actualizarProyecto(proy.id, { contrato_total: Number(e.target.value) }); router.refresh(); }} />
                </Field>
                <Field label="Adelanto %">
                  <Input type="number" defaultValue={Number(proy.adelanto_pct) * 100} onBlur={async (e) => { await actualizarProyecto(proy.id, { adelanto_pct: Number(e.target.value) / 100 }); router.refresh(); }} />
                </Field>
              </div>
              <Field label="Tope caja chica">
                <Input type="number" defaultValue={Number(proy.caja_maximo)} onBlur={async (e) => { await actualizarProyecto(proy.id, { caja_maximo: Number(e.target.value) }); router.refresh(); }} />
              </Field>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Dato({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v || '—'}</span></div>;
}

// ───────────────────────── LAST PLANNER ───────────────────────────────
function LastPlanner({ proy, items, valorizaciones, contrapartes, canManage }: any) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<any[]>(items);
  useEffect(() => setRows(items), [items]);

  const valsSorted = [...valorizaciones].sort((a, b) => a.numero - b.numero);
  const activeVal = valsSorted[valsSorted.length - 1];

  // avances por item: [valIndex] = pct (de valorizacion_items)
  const baseAvances = useMemo(() => {
    const m = new Map<string, number[]>();
    rows.forEach((r) => { if (r.es_hoja) m.set(r.id, Array(valsSorted.length).fill(0)); });
    valsSorted.forEach((v, idx) => {
      (v.valorizacion_items ?? []).forEach((vi: any) => {
        const arr = m.get(vi.proyecto_item_id);
        if (arr) arr[idx] = Number(vi.pct_avance);
      });
    });
    return m;
  }, [rows, valorizaciones]);

  // edición local del avance de la valorización activa
  const [activeAvances, setActiveAvances] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    const m = new Map<string, number>();
    if (activeVal) (activeVal.valorizacion_items ?? []).forEach((vi: any) => m.set(vi.proyecto_item_id, Number(vi.pct_avance)));
    setActiveAvances(m);
  }, [valorizaciones]);

  // merge para cálculo
  const avancesCalc = useMemo(() => {
    const m = new Map<string, number[]>();
    baseAvances.forEach((arr, id) => {
      const copy = [...arr];
      if (activeVal) copy[valsSorted.length - 1] = activeAvances.get(id) ?? 0;
      m.set(id, copy);
    });
    return m;
  }, [baseAvances, activeAvances]);

  const arbol = useMemo(() => armarArbol(rows as any), [rows]);
  const calcVal = useMemo(() => calcularValorizacion(arbol as any, avancesCalc, valsSorted.length || 1), [arbol, avancesCalc, valsSorted.length]);

  const flat = useMemo(() => {
    const out: { row: any; depth: number }[] = [];
    const walk = (nodos: NodoArbol<any>[], depth: number) => nodos.forEach((n) => { out.push({ row: n.data, depth }); walk(n.hijos, depth + 1); });
    walk(arbol as any, 0);
    return out;
  }, [arbol]);

  async function add(parent: any | null) {
    setBusy(true);
    await agregarItemProyecto(proy.id, parent?.id ?? null, parent ? Math.min(4, parent.nivel + 1) : 1);
    router.refresh(); setBusy(false);
  }
  async function del(id: string) { setBusy(true); await eliminarItemProyecto(proy.id, id); router.refresh(); setBusy(false); }
  async function save(id: string, patch: any) { await actualizarItemProyecto(proy.id, id, patch); }
  async function nuevaVal() { setBusy(true); await crearValorizacion(proy.id); router.refresh(); setBusy(false); }
  async function guardar() {
    if (!activeVal) return;
    setBusy(true);
    const avances = Array.from(activeAvances.entries()).map(([itemId, pct]) => ({ itemId, pct }));
    const res = await guardarAvances(proy.id, activeVal.id, avances);
    if (!res.ok) alert(res.error);
    router.refresh(); setBusy(false);
  }
  async function cobrar() {
    if (!activeVal) return;
    setBusy(true);
    await registrarCobroValorizacion(proy.id, activeVal.id);
    router.refresh(); setBusy(false);
  }

  const montoActivo = activeVal ? Array.from(activeAvances.entries()).reduce((acc, [id, pct]) => {
    const leaf = rows.find((r) => r.id === id && r.es_hoja);
    return acc + (leaf ? pct * Number(leaf.total_costo ?? 0) : 0);
  }, 0) : 0;
  const dil = dilucionAdelanto(montoActivo, Number(proy.adelanto_pct));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Layers className="size-4" /> Cuadrantes 1-4 + valorizaciones semanales acumulables
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => add(null)} disabled={busy}><Plus /> Partida</Button>
            <Button size="sm" variant="outline" onClick={nuevaVal} disabled={busy}><Calendar /> Nueva valorización</Button>
            {activeVal && <Button size="sm" variant="gradient" onClick={guardar} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Guardar avances</Button>}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-xs">
              <thead className="bg-muted/50 uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left">Ítem</th>
                  <th className="min-w-[180px] px-2 py-2 text-left">Título</th>
                  <th className="px-2 py-2">Und</th>
                  <th className="px-2 py-2">Cant</th>
                  <th className="px-2 py-2">C.Unit</th>
                  <th className="px-2 py-2 text-right">Total</th>
                  <th className="px-2 py-2 text-left">Contratista</th>
                  <th className="px-2 py-2">Inicio</th>
                  <th className="px-2 py-2">Entrega</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Prioridad</th>
                  <th className="px-2 py-2">% Acum</th>
                  <th className="px-2 py-2 text-right">Saldo</th>
                  {valsSorted.map((v, i) => (
                    <th key={v.id} className={`px-2 py-2 text-center ${i === valsSorted.length - 1 ? 'bg-azur-50/60' : ''}`}>
                      Val N{v.numero}<br /><span className="font-normal normal-case">% sem</span>
                    </th>
                  ))}
                  {canManage && <th className="px-2 py-2" />}
                </tr>
              </thead>
              <tbody>
                {flat.length === 0 && <tr><td colSpan={20} className="py-10 text-center text-muted-foreground">Sin itemizado. Agrega la primera partida.</td></tr>}
                {flat.map(({ row, depth }) => {
                  const cv = calcVal.get(row.id);
                  const hoja = row.es_hoja;
                  const et = ESTADO_TAREA[row.estado_tarea] ?? { label: row.estado_tarea, variant: 'muted' as const };
                  const pr = PRIORIDAD[row.prioridad] ?? { label: row.prioridad, variant: 'muted' as const };
                  return (
                    <tr key={row.id} className={`border-b ${!hoja ? 'bg-muted/30 font-medium' : ''}`}>
                      <td className="px-2 py-1.5 text-muted-foreground">{row.item_codigo}</td>
                      <td className="px-2 py-1.5">
                        <span style={{ paddingLeft: depth * 12 }}>{row.titulo}</span>
                      </td>
                      <td className="px-1 py-1.5 text-center">{hoja ? (canManage ? <input className="w-12 rounded border bg-white px-1 text-center" defaultValue={row.unidad ?? ''} onBlur={(e) => save(row.id, { unidad: e.target.value })} /> : row.unidad) : ''}</td>
                      <td className="px-1 py-1.5 text-right">{hoja ? (canManage ? <Num v={row.cantidad} onSave={(x) => { setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, cantidad: x, total_costo: x * Number(r.costo_unitario ?? 0) } : r)); save(row.id, { cantidad: x }); }} /> : fmtNumber(Number(row.cantidad ?? 0), 0)) : ''}</td>
                      <td className="px-1 py-1.5 text-right">{hoja ? (canManage ? <Num v={row.costo_unitario} onSave={(x) => { setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, costo_unitario: x, total_costo: Number(r.cantidad ?? 0) * x } : r)); save(row.id, { costo_unitario: x }); }} /> : fmtNumber(Number(row.costo_unitario ?? 0))) : ''}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmtNumber(cv?.total_partida ?? 0)}</td>
                      <td className="px-1 py-1.5">
                        {hoja && canManage ? (
                          <select className="max-w-[140px] rounded border bg-white px-1 py-0.5" defaultValue={row.contratista_id ?? ''} onChange={(e) => save(row.id, { contratista_id: e.target.value || null })}>
                            <option value="">—</option>
                            {contrapartes.map((c: any) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                          </select>
                        ) : ''}
                      </td>
                      <td className="px-1 py-1.5">{hoja && canManage ? <input type="date" className="rounded border bg-white px-1 py-0.5" defaultValue={fmtDateInput(row.fecha_inicio)} onBlur={(e) => save(row.id, { fecha_inicio: e.target.value || null })} /> : (hoja ? fmtDate(row.fecha_inicio) : '')}</td>
                      <td className="px-1 py-1.5">{hoja && canManage ? <input type="date" className="rounded border bg-white px-1 py-0.5" defaultValue={fmtDateInput(row.fecha_entrega)} onBlur={(e) => save(row.id, { fecha_entrega: e.target.value || null })} /> : (hoja ? fmtDate(row.fecha_entrega) : '')}</td>
                      <td className="px-2 py-1.5 text-center"><Badge variant={et.variant}>{et.label}</Badge></td>
                      <td className="px-2 py-1.5 text-center"><Badge variant={pr.variant}>{pr.label}</Badge></td>
                      <td className="px-2 py-1.5 text-center tabular-nums">{fmtPct(cv?.pct_acumulado ?? 0, 0)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmtNumber(cv?.saldo ?? 0)}</td>
                      {valsSorted.map((v, i) => {
                        const isActive = i === valsSorted.length - 1;
                        const pct = (avancesCalc.get(row.id)?.[i] ?? 0);
                        return (
                          <td key={v.id} className={`px-1 py-1.5 text-center ${isActive ? 'bg-azur-50/40' : ''}`}>
                            {hoja && isActive && canManage ? (
                              <input type="number" step="any" className="w-14 rounded border bg-white px-1 text-center" defaultValue={pct ? pct * 100 : ''} onBlur={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value) / 100;
                                setActiveAvances((m) => new Map(m).set(row.id, val));
                              }} />
                            ) : (hoja ? (pct ? `${fmtNumber(pct * 100, 0)}%` : '—') : '')}
                          </td>
                        );
                      })}
                      {canManage && (
                        <td className="px-1 py-1.5">
                          <div className="flex gap-0.5">
                            {row.nivel < 4 && <button onClick={() => add(row)} className="rounded p-1 hover:bg-secondary"><Plus className="size-3.5 text-muted-foreground" /></button>}
                            <button onClick={() => del(row.id)} className="rounded p-1 hover:bg-azur-50"><Trash2 className="size-3.5 text-azur-600" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {activeVal && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Valorización N{activeVal.numero} · dilución del adelanto</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-4">
            <KpiCard label="Valorizado periodo" value={fmtMoney(montoActivo)} />
            <KpiCard label={`Amortización (${fmtPct(Number(proy.adelanto_pct), 0)})`} value={fmtMoney(dil.amortizacion)} tone="warning" />
            <KpiCard label="Cobro neto" value={fmtMoney(dil.cobroNeto)} tone="success" />
            <div className="flex items-end gap-2">
              <a href={`/proyectos/${proy.id}/valorizacion/${activeVal.id}/pdf`} target="_blank" rel="noreferrer" className="flex-1">
                <Button variant="outline" className="w-full"><FileBarChart /> Resumen PDF</Button>
              </a>
              {canManage && <Button variant="gradient" className="flex-1" onClick={cobrar} disabled={busy}><CheckCircle2 /> Registrar cobro</Button>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Num({ v, onSave }: { v: any; onSave: (n: number) => void }) {
  return <input type="number" step="any" className="w-16 rounded border bg-white px-1 text-right" defaultValue={v ?? ''} onBlur={(e) => onSave(e.target.value === '' ? 0 : Number(e.target.value))} />;
}

// ───────────────────────── EXPEDIENTE ─────────────────────────────────
const CARPETAS = ['Información', 'Contractuales', 'Material utilizado', 'Evidencias', 'SST', 'General'];
function Expediente({ proy, documentos, canManage }: any) {
  const router = useRouter();
  const [carpeta, setCarpeta] = useState('Contractuales');
  const [subiendo, setSubiendo] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      const supabase = createClient();
      const path = `${proy.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('documentos').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('documentos').getPublicUrl(path);
        await subirDocumento(proy.id, { nombre: file.name, url: data.publicUrl, carpeta });
        router.refresh();
      }
    } finally {
      setSubiendo(false);
    }
  }

  const porCarpeta = (c: string) => (documentos ?? []).filter((d: any) => d.carpeta === c);

  return (
    <div className="space-y-3">
      {canManage && (
        <Card>
          <CardContent className="flex flex-wrap items-end gap-2 p-4">
            <Field label="Carpeta" className="flex-1"><Select value={carpeta} onChange={(e) => setCarpeta(e.target.value)}>{CARPETAS.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-azur-gradient px-4 text-sm font-medium text-white">
              {subiendo ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Subir documento
              <input type="file" className="hidden" onChange={onFile} disabled={subiendo} />
            </label>
          </CardContent>
        </Card>
      )}
      {CARPETAS.map((c) => {
        const docs = porCarpeta(c);
        if (docs.length === 0) return null;
        return (
          <Card key={c}>
            <CardHeader className="pb-2"><CardTitle className="text-base">{c}</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {docs.map((d: any) => (
                <a key={d.id} href={d.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg border p-2.5 text-sm hover:bg-secondary">
                  <span>{d.nombre}</span><span className="text-xs text-muted-foreground">{fmtDate(d.created_at)}</span>
                </a>
              ))}
            </CardContent>
          </Card>
        );
      })}
      {(!documentos || documentos.length === 0) && <EmptyState titulo="Expediente vacío" descripcion="Sube contratos, planos, fichas técnicas y más." />}
    </div>
  );
}

// ───────────────────────── CRONOGRAMA COBROS ──────────────────────────
function Cobros({ proy, armadas, canManage }: any) {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>(armadas.length ? armadas.map((a: any) => ({ concepto: a.concepto, porcentaje: Number(a.porcentaje), condicion_tipo: a.condicion_tipo, condicion_valor: a.condicion_valor, fecha_esperada: a.fecha_esperada, estado: a.estado })) : []);
  const [busy, setBusy] = useState(false);
  const suma = rows.reduce((a, r) => a + r.porcentaje, 0);
  const contrato = Number(proy.contrato_total);

  async function guardar() {
    setBusy(true);
    await guardarArmadas(proy.id, rows.map((r) => ({ concepto: r.concepto, porcentaje: r.porcentaje, condicion_tipo: r.condicion_tipo, condicion_valor: r.condicion_valor ? Number(r.condicion_valor) : undefined, fecha_esperada: r.fecha_esperada || undefined })));
    router.refresh(); setBusy(false);
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Cronograma de cobros (armadas)</CardTitle>
        {canManage && <Button size="sm" variant="outline" onClick={() => setRows((r) => [...r, { concepto: 'Armada', porcentaje: 0, condicion_tipo: 'avance', condicion_valor: 0, fecha_esperada: '', estado: 'pendiente' }])}><Plus /> Agregar</Button>}
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 && <EmptyState titulo="Sin armadas" descripcion="Define cómo se cobrará al cliente." />}
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-2 items-end gap-2 rounded-lg border p-2 sm:grid-cols-6">
            <Field label="Concepto" className="col-span-2"><Input value={r.concepto} disabled={!canManage} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, concepto: e.target.value } : x))} /></Field>
            <Field label="%"><Input type="number" disabled={!canManage} value={Math.round(r.porcentaje * 100)} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, porcentaje: Number(e.target.value) / 100 } : x))} /></Field>
            <Field label="Condición"><Select disabled={!canManage} value={r.condicion_tipo} onChange={(e) => setRows((rs) => rs.map((x, j) => j === i ? { ...x, condicion_tipo: e.target.value } : x))}><option value="avance">% avance</option><option value="fecha">Fecha fija</option></Select></Field>
            <Field label="Monto"><Input disabled value={fmtNumber(contrato * r.porcentaje)} /></Field>
            {canManage && <Button size="icon" variant="ghost" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><Trash2 className="text-azur-600" /></Button>}
          </div>
        ))}
        <div className={`text-sm ${suma > 1.0001 ? 'text-azur-600' : 'text-muted-foreground'}`}>Suma: {fmtNumber(suma * 100, 0)}%</div>
        {canManage && rows.length > 0 && <Button variant="gradient" onClick={guardar} disabled={busy || suma > 1.0001}><Save /> Guardar cronograma</Button>}
      </CardContent>
    </Card>
  );
}

// ───────────────────────── ADICIONALES ────────────────────────────────
function Adicionales({ proy, items, adicionales, canManage }: any) {
  const router = useRouter();
  const [form, setForm] = useState({ tipo: 'adicional', descripcion: '', monto: 0, proyecto_item_id: '' });
  const [busy, setBusy] = useState(false);
  const hojas = items.filter((i: any) => i.es_hoja);

  async function add() {
    if (!form.descripcion) return;
    setBusy(true);
    await registrarAdicional(proy.id, { tipo: form.tipo as any, descripcion: form.descripcion, monto: Number(form.monto), proyecto_item_id: form.proyecto_item_id || undefined });
    setForm({ tipo: 'adicional', descripcion: '', monto: 0, proyecto_item_id: '' });
    router.refresh(); setBusy(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {canManage && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Registrar adicional / deductivo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Field label="Tipo"><Select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}><option value="adicional">Adicional</option><option value="deductivo">Deductivo</option></Select></Field>
            <Field label="Descripción"><Input value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} /></Field>
            <Field label="Monto"><Input type="number" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: Number(e.target.value) }))} /></Field>
            <Field label="Partida afectada"><Select value={form.proyecto_item_id} onChange={(e) => setForm((f) => ({ ...f, proyecto_item_id: e.target.value }))}><option value="">—</option>{hojas.map((h: any) => <option key={h.id} value={h.id}>{h.titulo}</option>)}</Select></Field>
            <Button variant="gradient" onClick={add} disabled={busy}><Plus /> Registrar</Button>
          </CardContent>
        </Card>
      )}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-base">Historial</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {adicionales.length === 0 && <EmptyState titulo="Sin adicionales/deductivos" />}
          {adicionales.map((a: any) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.tipo === 'adicional' ? 'info' : 'warning'}>{a.tipo}</Badge>
                  <span className="font-medium">{fmtMoney(Number(a.monto))}</span>
                  <Badge variant={a.estado === 'aprobado' ? 'success' : a.estado === 'rechazado' ? 'danger' : 'muted'}>{a.estado}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.descripcion}</p>
              </div>
              {canManage && a.estado === 'solicitado' && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={async () => { await resolverAdicional(proy.id, a.id, true); router.refresh(); }}>Aprobar</Button>
                  <Button size="sm" variant="ghost" onClick={async () => { await resolverAdicional(proy.id, a.id, false); router.refresh(); }}>Rechazar</Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ───────────────────────────── EQUIPO ─────────────────────────────────
function Equipo({ proy, equipo, perfiles, canManage }: any) {
  const router = useRouter();
  const [profileId, setProfileId] = useState('');
  const [rolObra, setRolObra] = useState('residente');
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {canManage && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="size-4" /> Asignar al equipo</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Field label="Persona"><Select value={profileId} onChange={(e) => setProfileId(e.target.value)}><option value="">Seleccionar…</option>{perfiles.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Select></Field>
            <Field label="Rol de obra"><Select value={rolObra} onChange={(e) => setRolObra(e.target.value)}><option value="jefe">Jefe de obra</option><option value="residente">Residente / Coordinador</option><option value="prevencionista">Prevencionista (SOMA)</option><option value="logistico">Logístico</option></Select></Field>
            <Button variant="gradient" disabled={!profileId || busy} onClick={async () => { setBusy(true); await asignarEquipo(proy.id, profileId, rolObra); setProfileId(''); router.refresh(); setBusy(false); }}><Plus /> Asignar</Button>
            <p className="text-xs text-muted-foreground">Una persona puede tener varios roles en el proyecto.</p>
          </CardContent>
        </Card>
      )}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ListChecks className="size-4" /> Equipo asignado</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {equipo.length === 0 && <EmptyState titulo="Sin equipo asignado" />}
          {equipo.map((e: any) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
              <div><p className="font-medium">{e.profile?.nombre}</p><Badge variant="outline">{e.rol_obra}</Badge></div>
              {canManage && <Button size="icon" variant="ghost" onClick={async () => { await quitarEquipo(proy.id, e.id); router.refresh(); }}><Trash2 className="text-azur-600" /></Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
