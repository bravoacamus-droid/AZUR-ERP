'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash2, Save, Loader2, CheckCircle2, Calendar, Users, Layers,
  TrendingUp, FileBarChart, Banknote, ListChecks, X, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/dialog';
import { Field, EmptyState, Avatar } from '@/components/ui/misc';
import { KpiCard } from '@/components/ui/page';
import { BarraTresTramos } from '@/components/dashboard/barra-tres-tramos';
import { CurvaS } from '@/components/proyectos/curva-s';
import { fmtMoney, fmtNumber, fmtDate, fmtDateInput, fmtDateTime, fmtPct } from '@/lib/format';
import { ESTADO_PROYECTO, ESTADO_TAREA, PRIORIDAD } from '@/lib/estados';
import { armarArbol, renumerar, calcularValorizacion, dilucionAdelanto, type NodoArbol } from '@/lib/calc';
import { evalFormula, esFormula } from '@/lib/formula';
import { entregaDesdeDuracion, duracionDesdeFechas, PATRON_LABEL, type PatronDias } from '@/lib/fechas';
import { calcularLiquidacion } from '@/lib/liquidacion';
import type { DashboardProyecto } from '@/lib/salud';
import {
  agregarItemProyecto, actualizarItemProyecto, eliminarItemProyecto, crearValorizacion,
  guardarAvances, registrarCobroValorizacion, asignarEquipo, quitarEquipo, guardarArmadas,
  registrarAdicional, resolverAdicional, actualizarProyecto, guardarHito, subirDocumento,
  guardarComponenteApuProyecto, eliminarComponenteApuProyecto, liquidarProyecto,
  generarServiciosMantenimiento, actualizarServicio, eliminarServicio,
  solicitarCambioMonto, solicitarReaperturaValorizacion, cerrarReaperturaValorizacion,
  aprobarSolicitud, rechazarSolicitud, vaciarItemizadoProyecto, marcarItemizadoPropio,
} from '../actions';
import { createClient } from '@/lib/supabase/client';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function ProyectoDetalle(props: any) {
  const { proy, items, valorizaciones, contrapartes, equipo, armadas, adicionales, dash, cajas, perfiles, hitos, documentos, catalogo, apuProyecto, servicios, solicitudes, comparativo, campo, userId, userNombre, userRol, canManage } = props;
  const esMantenimiento = proy.tipo_proyecto === 'chico';
  const router = useRouter();
  const [presentes, setPresentes] = useState<string[]>([]);

  // Realtime: presencia + sincronización en vivo del Last Planner (itemizado y valorizaciones)
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase.channel(`proy-${proy.id}`, { config: { presence: { key: userId } } });
    const refrescar = () => router.refresh();
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, { nombre: string }[]>;
      setPresentes([...new Set(Object.values(state).flat().map((p) => p.nombre))]);
    })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proyecto_items', filter: `proyecto_id=eq.${proy.id}` }, refrescar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'valorizaciones', filter: `proyecto_id=eq.${proy.id}` }, refrescar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'valorizacion_items' }, refrescar)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitudes_cambio', filter: `proyecto_id=eq.${proy.id}` }, refrescar)
      .subscribe(async (status) => { if (status === 'SUBSCRIBED') await ch.track({ nombre: userNombre }); });
    return () => { void supabase.removeChannel(ch); };
  }, [proy.id, userId, userNombre, router]);
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
          {presentes.length > 0 && (
            <div className="flex items-center -space-x-2">
              {presentes.slice(0, 5).map((n) => (
                <Avatar key={n} nombre={n} className="size-8 ring-2 ring-white" />
              ))}
              <span className="ml-3 text-xs text-muted-foreground">{presentes.length} en línea</span>
            </div>
          )}
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
          ...(esMantenimiento ? [{ value: 'mantenimiento', label: 'Mantenimiento' }] : []),
          { value: 'campo', label: 'Campo' },
          { value: 'liquidacion', label: 'Liquidación' },
          { value: 'expediente', label: 'Expediente' },
        ]}
      />

      {tab === 'resumen' && <Resumen proy={proy} dash={dash} cajaSaldo={cajaSaldo} valorizaciones={valorizaciones} hitos={hitos} canManage={canManage} solicitudes={solicitudes} userRol={userRol} comparativo={comparativo} />}
      {tab === 'lastplanner' && <LastPlanner proy={proy} items={items} valorizaciones={valorizaciones} contrapartes={contrapartes} catalogo={catalogo} apuProyecto={apuProyecto} canManage={canManage} userRol={userRol} />}
      {tab === 'cobros' && <Cobros proy={proy} armadas={armadas} canManage={canManage} />}
      {tab === 'adicionales' && <Adicionales proy={proy} items={items} adicionales={adicionales} canManage={canManage} />}
      {tab === 'equipo' && <Equipo proy={proy} equipo={equipo} perfiles={perfiles} canManage={canManage} />}
      {tab === 'campo' && <CampoTab campo={campo} />}
      {tab === 'mantenimiento' && <Mantenimiento proy={proy} servicios={servicios} canManage={canManage} />}
      {tab === 'liquidacion' && <Liquidacion proy={proy} items={items} valorizaciones={valorizaciones} adicionales={adicionales} dash={dash} canManage={canManage} />}
      {tab === 'expediente' && <Expediente proy={proy} documentos={documentos} canManage={canManage} />}
    </div>
  );
}

// ───────────────────────────── RESUMEN ────────────────────────────────
function Resumen({ proy, dash, cajaSaldo, valorizaciones, hitos, canManage, solicitudes, userRol, comparativo }: any) {
  const router = useRouter();
  const [busyS, setBusyS] = useState<string | null>(null);
  const [busyIt, setBusyIt] = useState(false);
  async function toggleItemizadoPropio(v: boolean) { setBusyIt(true); await marcarItemizadoPropio(proy.id, v); router.refresh(); setBusyIt(false); }
  async function vaciarItemizado() {
    if (!window.confirm('Esto ELIMINA todo el itemizado heredado de la cotización para que Proyectos arme el suyo desde cero. La comparación quedará solo por totales y margen. ¿Continuar?')) return;
    setBusyIt(true); await vaciarItemizadoProyecto(proy.id); router.refresh(); setBusyIt(false);
  }
  const pendientes = (solicitudes ?? []).filter((s: any) => s.estado === 'pendiente');
  const puedeAprobar = (s: any) => userRol === 'gerencia' || userRol === s.rol_aprobador;
  async function aprobar(s: any) { setBusyS(s.id); await aprobarSolicitud(proy.id, s.id); router.refresh(); setBusyS(null); }
  async function rechazar(s: any) { const m = window.prompt('Motivo del rechazo (opcional):') ?? ''; setBusyS(s.id); await rechazarSolicitud(proy.id, s.id, m); router.refresh(); setBusyS(null); }
  const d: DashboardProyecto = dash ?? { proyecto_id: proy.id, codigo: proy.codigo, nombre: proy.nombre, linea_id: proy.linea_id, estado: proy.estado, tipo_proyecto: proy.tipo_proyecto, proyectado: Number(proy.contrato_total), pagos: 0, gasto: 0, valorizado: 0 };
  const adelanto = Number(proy.contrato_total) * Number(proy.adelanto_pct);
  const [hitoForm, setHitoForm] = useState({ nombre: '', fecha: '' });

  return (
    <div className="space-y-4">
    {canManage && pendientes.length > 0 && (
      <Card className="border-amber-300">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ListChecks className="size-4 text-amber-600" /> Solicitudes de cambio pendientes ({pendientes.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {pendientes.map((s: any) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.descripcion}</p>
                <p className="text-xs text-muted-foreground">
                  {s.tipo === 'item_monto' ? 'Cambio de monto · aprueba Presupuestos' : 'Reapertura de valorización · aprueba Gerencia'}
                  {s.solicitado_nombre ? ` · solicitó ${s.solicitado_nombre}` : ''}
                  {s.payload?.motivo ? ` · "${s.payload.motivo}"` : ''}
                </p>
              </div>
              {puedeAprobar(s) ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => rechazar(s)} disabled={busyS === s.id}>Rechazar</Button>
                  <Button size="sm" variant="gradient" onClick={() => aprobar(s)} disabled={busyS === s.id}>{busyS === s.id ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Aprobar</Button>
                </div>
              ) : <Badge variant="warning">Esperando {s.rol_aprobador}</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    )}
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Contrato" value={fmtMoney(Number(proy.contrato_total))} icon={<FileBarChart />} />
          <KpiCard label="Cobrado" value={fmtMoney(d.pagos)} tone="success" icon={<TrendingUp />} />
          <KpiCard label="Gasto" value={fmtMoney(d.gasto)} tone="azur" icon={<Banknote />} />
          <KpiCard label="Caja chica" value={fmtMoney(Number(cajaSaldo))} icon={<Banknote />} />
        </div>
        <BarraTresTramos p={d} />
        {comparativo && <ComparativoComercial c={comparativo} propio={!!proy.itemizado_propio} />}
        <div className="flex justify-end">
          <InformeBtn proyectoId={proy.id} />
        </div>
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
              <Field label="Días laborables (calendario)">
                <Select defaultValue={proy.dias_laborables ?? 'lun_sab'} onChange={async (e) => { await actualizarProyecto(proy.id, { dias_laborables: e.target.value }); router.refresh(); }}>
                  {Object.entries(PATRON_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <p className="text-xs text-muted-foreground">Define qué días cuentan para calcular automáticamente la fecha de entrega a partir de la duración (y viceversa) en el Last Planner.</p>
            </CardContent>
          </Card>
        )}
        {canManage && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Itemizado de Proyectos</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <label className="flex items-center justify-between gap-2">
                <span>Itemizado propio (independiente del comercial)</span>
                <input type="checkbox" className="size-4 accent-azur-600" checked={!!proy.itemizado_propio} disabled={busyIt} onChange={(e) => toggleItemizadoPropio(e.target.checked)} />
              </label>
              <p className="text-xs text-muted-foreground">Actívalo cuando Proyectos arma una estructura distinta a la cotización. La comparación con el comercial pasa a ser solo por totales y margen.</p>
              <Button size="sm" variant="outline" className="w-full text-azur-700" disabled={busyIt} onClick={vaciarItemizado}>
                {busyIt ? <Loader2 className="animate-spin" /> : <Trash2 />} Vaciar itemizado heredado y empezar de cero
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
    </div>
  );
}

// Comparativo Comercial vs Proyecto: solo totales y márgenes (no por categorías).
function ComparativoComercial({ c, propio }: { c: { venta: number; costoComercial: number | null; costoProyecto: number }; propio: boolean }) {
  const venta = Number(c.venta || 0);
  const margen = (costo: number) => (venta > 0 ? (venta - costo) / venta : 0);
  const mC = c.costoComercial != null ? margen(c.costoComercial) : null;
  const mP = margen(c.costoProyecto);
  const desv = c.costoComercial != null ? c.costoProyecto - c.costoComercial : null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="size-4 text-azur-600" /> Comparativo Comercial vs Proyecto</CardTitle>
        <p className="text-xs text-muted-foreground">{propio ? 'Itemizado propio: la comparación es solo por totales y margen.' : 'Totales y margen (las categorías pueden no coincidir).'}</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr className="border-b">
                <th className="py-1.5 text-left"></th>
                <th className="py-1.5 text-right">Venta (contrato)</th>
                <th className="py-1.5 text-right">Costo directo</th>
                <th className="py-1.5 text-right">Margen</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-1.5 font-medium">Comercial (cotización)</td>
                <td className="py-1.5 text-right tabular-nums">{fmtMoney(venta)}</td>
                <td className="py-1.5 text-right tabular-nums">{c.costoComercial != null ? fmtMoney(c.costoComercial) : '—'}</td>
                <td className="py-1.5 text-right tabular-nums">{mC != null ? fmtNumber(mC * 100, 1) + '%' : '—'}</td>
              </tr>
              <tr className="border-b">
                <td className="py-1.5 font-medium">Proyecto (planificado)</td>
                <td className="py-1.5 text-right tabular-nums">{fmtMoney(venta)}</td>
                <td className="py-1.5 text-right tabular-nums">{fmtMoney(c.costoProyecto)}</td>
                <td className="py-1.5 text-right tabular-nums">{fmtNumber(mP * 100, 1)}%</td>
              </tr>
              <tr>
                <td className="py-1.5 font-medium text-muted-foreground">Desviación de costo</td>
                <td className="py-1.5"></td>
                <td className={`py-1.5 text-right font-semibold tabular-nums ${desv != null && desv > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{desv != null ? (desv > 0 ? '+' : '') + fmtMoney(desv) : '—'}</td>
                <td className={`py-1.5 text-right font-semibold tabular-nums ${mC != null && mP < mC ? 'text-red-600' : 'text-emerald-600'}`}>{mC != null ? fmtNumber((mP - mC) * 100, 1) + ' pp' : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function Dato({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v || '—'}</span></div>;
}

// ───────────────────────── LAST PLANNER ───────────────────────────────
function LastPlanner({ proy, items, valorizaciones, contrapartes, catalogo, apuProyecto, canManage, userRol }: any) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<any[]>(items);
  const [addTarget, setAddTarget] = useState<{ parent: any | null; nivel: number } | null>(null);
  const [apuItem, setApuItem] = useState<any | null>(null);
  useEffect(() => setRows(items), [items]);

  const valsSorted = [...valorizaciones].sort((a, b) => a.numero - b.numero);
  // La valorización editable es la última, salvo que Gerencia haya reabierto una anterior.
  const reabiertaIdx = valsSorted.findIndex((v) => v.reabierta);
  const editIdx = reabiertaIdx >= 0 ? reabiertaIdx : valsSorted.length - 1;
  const activeVal = valsSorted[editIdx];
  const requiereAprobacionMonto = userRol === 'jefe_proyectos'; // Presupuestos/Gerencia editan directo
  // orden de presentación N…→N1 (la más nueva a la izquierda) conservando el índice original
  const valsDesc = valsSorted.map((v, idx) => ({ v, idx })).reverse();

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
      if (activeVal) copy[editIdx] = activeAvances.get(id) ?? 0;
      m.set(id, copy);
    });
    return m;
  }, [baseAvances, activeAvances]);

  const arbol = useMemo(() => armarArbol(rows as any), [rows]);
  const codigos = useMemo(() => renumerar(arbol as any), [arbol]);
  const calcVal = useMemo(() => calcularValorizacion(arbol as any, avancesCalc, valsSorted.length || 1), [arbol, avancesCalc, valsSorted.length]);

  const flat = useMemo(() => {
    const out: { row: any; depth: number }[] = [];
    const walk = (nodos: NodoArbol<any>[], depth: number) => nodos.forEach((n) => { out.push({ row: n.data, depth }); walk(n.hijos, depth + 1); });
    walk(arbol as any, 0);
    return out;
  }, [arbol]);

  function add(parent: any | null) {
    setAddTarget({ parent, nivel: parent ? Math.min(4, parent.nivel + 1) : 1 });
  }
  async function confirmAdd(prefill?: { titulo?: string; unidad?: string | null; costo_unitario?: number | null; catalogoPartidaId?: string }) {
    if (!addTarget) return;
    setBusy(true);
    await agregarItemProyecto(proy.id, addTarget.parent?.id ?? null, addTarget.nivel, prefill);
    setAddTarget(null);
    router.refresh(); setBusy(false);
  }
  async function del(id: string) { setBusy(true); await eliminarItemProyecto(proy.id, id); router.refresh(); setBusy(false); }
  async function save(id: string, patch: any) { await actualizarItemProyecto(proy.id, id, patch); }
  const [aviso, setAviso] = useState<string | null>(null);
  // Cambios de cantidad/monto: directo (Presupuestos/Gerencia) o a aprobación (Jefe de proyectos).
  function aplicarMonto(row: any, patch: any, descripcion: string, optimistic: any) {
    if (requiereAprobacionMonto) {
      solicitarCambioMonto(proy.id, row.id, descripcion, patch).then(() => {
        setAviso('Cambio enviado a aprobación de Presupuestos. Se aplicará cuando lo aprueben.');
        router.refresh();
      });
    } else {
      setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, ...optimistic } : r));
      save(row.id, patch);
    }
  }
  const patron: PatronDias = (proy.dias_laborables ?? 'lun_sab') as PatronDias;
  // Plazos amarrados: al cambiar inicio/entrega/duración recalcula el campo dependiente.
  function saveFechas(row: any, patch: any) {
    const inicio = patch.fecha_inicio !== undefined ? patch.fecha_inicio : fmtDateInput(row.fecha_inicio);
    let entrega = patch.fecha_entrega !== undefined ? patch.fecha_entrega : fmtDateInput(row.fecha_entrega);
    let dur = patch.duracion_dias !== undefined ? patch.duracion_dias : row.duracion_dias;
    if (patch.duracion_dias !== undefined && inicio && dur) {
      entrega = entregaDesdeDuracion(inicio, Number(dur), patron) ?? entrega;
    } else if (patch.fecha_entrega !== undefined && inicio && entrega) {
      dur = duracionDesdeFechas(inicio, entrega, patron) ?? dur;
    } else if (patch.fecha_inicio !== undefined && inicio && dur) {
      entrega = entregaDesdeDuracion(inicio, Number(dur), patron) ?? entrega;
    }
    const full = { fecha_inicio: inicio || null, fecha_entrega: entrega || null, duracion_dias: dur ?? null };
    setRows((rs) => rs.map((r) => r.id === row.id ? { ...r, ...full } : r));
    save(row.id, full);
  }
  async function nuevaVal() { setBusy(true); await crearValorizacion(proy.id); router.refresh(); setBusy(false); }
  async function guardar() {
    if (!activeVal) return;
    setBusy(true);
    const avances = Array.from(activeAvances.entries()).map(([itemId, pct]) => ({ itemId, pct }));
    const res = await guardarAvances(proy.id, activeVal.id, avances);
    if (!res.ok) alert(res.error);
    // si era una valorización reabierta por Gerencia, se vuelve a bloquear al guardar
    if (activeVal.reabierta) await cerrarReaperturaValorizacion(proy.id, activeVal.id);
    router.refresh(); setBusy(false);
  }
  async function pedirReapertura(v: any) {
    const motivo = window.prompt(`Solicitar a Gerencia la reapertura de la Valorización N°${v.numero}. Motivo:`);
    if (!motivo) return;
    setBusy(true);
    const res = await solicitarReaperturaValorizacion(proy.id, v.id, v.numero, motivo);
    if (!res.ok) alert(res.error); else setAviso('Solicitud de reapertura enviada a Gerencia.');
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

      {aviso && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} className="text-amber-600 hover:text-amber-900"><X className="size-4" /></button>
        </div>
      )}
      {reabiertaIdx >= 0 && (
        <div className="rounded-lg border border-azur-300 bg-azur-50 px-3 py-2 text-sm text-azur-800">
          Estás editando la <strong>Valorización N°{valsSorted[reabiertaIdx].numero}</strong>, reabierta por Gerencia. Al guardar, se volverá a bloquear.
        </div>
      )}
      {canManage && valsSorted.length > 1 && reabiertaIdx < 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Corregir una valorización ya cobrada (requiere aprobación de Gerencia):</span>
          {valsSorted.slice(0, -1).map((v) => (
            <button key={v.id} onClick={() => pedirReapertura(v)} disabled={busy} className="rounded border border-azur-200 bg-white px-2 py-0.5 text-azur-700 hover:bg-azur-50">
              Solicitar corrección N°{v.numero}
            </button>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <datalist id="unidades-lp">
              {['m2', 'm3', 'm', 'und', 'glb', 'kg', 'ton', 'pto', 'p2', 'pie', 'gln', 'bls', 'rollo', 'juego', 'día', 'mes', 'hh', 'hm'].map((u) => <option key={u} value={u} />)}
            </datalist>
            <table className="w-full whitespace-nowrap text-xs">
              <thead className="bg-muted/50 uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left">Ítem</th>
                  <th className="min-w-[180px] px-2 py-2 text-left">Título</th>
                  <th className="px-2 py-2">Und</th>
                  <th className="px-2 py-2">Cant</th>
                  <th className="px-2 py-2">C.Unit</th>
                  <th className="px-2 py-2 text-right">Subtotal</th>
                  <th className="px-2 py-2 text-right">Total</th>
                  <th className="px-2 py-2 text-left">Contratista</th>
                  <th className="px-2 py-2">Inicio</th>
                  <th className="px-2 py-2">Entrega</th>
                  <th className="px-2 py-2">Dur</th>
                  <th className="px-2 py-2">Estado</th>
                  <th className="px-2 py-2">Prioridad</th>
                  <th className="px-2 py-2">% Acum</th>
                  <th className="px-2 py-2 text-right">Valorizado</th>
                  <th className="px-2 py-2 text-right">Saldo</th>
                  {valsDesc.flatMap(({ v, idx }) => {
                    const act = idx === editIdx;
                    return [
                      <th key={`${v.id}-p`} className={`px-2 py-2 text-center ${act ? 'bg-azur-50/60' : ''}`}>N{v.numero}<br /><span className="font-normal normal-case">% sem</span></th>,
                      <th key={`${v.id}-t`} className={`px-2 py-2 text-center ${act ? 'bg-azur-50/60' : ''}`}>N{v.numero}<br /><span className="font-normal normal-case">S/ sem</span></th>,
                    ];
                  })}
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
                  const nivelBg = ['bg-azur-100/70', 'bg-azur-50/70', 'bg-sky-50/60', 'bg-slate-50/60'][Math.min(3, (row.nivel ?? 1) - 1)];
                  return (
                    <tr key={row.id} className={`border-b ${nivelBg} ${!hoja ? 'font-medium' : ''}`}>
                      <td className="whitespace-nowrap px-2 py-1.5 font-medium text-muted-foreground">{codigos.get(row.id) ?? row.item_codigo}</td>
                      <td className="px-2 py-1.5">
                        <span style={{ paddingLeft: depth * 14 }}>{row.titulo}</span>
                      </td>
                      <td className="px-1 py-1.5 text-center">{hoja ? (canManage ? <input list="unidades-lp" className="w-16 rounded border bg-white px-1 text-center" defaultValue={row.unidad ?? ''} onBlur={(e) => save(row.id, { unidad: e.target.value })} /> : row.unidad) : ''}</td>
                      <td className="px-1 py-1.5 text-right">{hoja ? (canManage ? <Num key={`cant-${row.id}-${row.cantidad ?? ''}`} v={row.cantidad} onSave={(x) => aplicarMonto(row, { cantidad: x }, `Cantidad de "${row.titulo}": ${row.cantidad ?? 0} → ${x}`, { cantidad: x, total_costo: x * Number(row.costo_unitario ?? 0) })} /> : fmtNumber(Number(row.cantidad ?? 0), 0)) : ''}</td>
                      <td className="px-1 py-1.5 text-right">{hoja ? (row.tiene_apu ? <span className="block w-16 rounded bg-azur-50 px-1 text-right text-xs tabular-nums text-azur-700" title="Calculado por APU">{fmtNumber(Number(row.costo_unitario ?? 0))}</span> : (canManage ? <FormulaCell value={row.costo_unitario} formula={row.costo_formula} onSave={(v, f) => aplicarMonto(row, { costo_unitario: v, costo_formula: f }, `Costo unitario de "${row.titulo}": ${row.costo_unitario ?? 0} → ${v}`, { costo_unitario: v, costo_formula: f, total_costo: Number(row.cantidad ?? 0) * v })} /> : fmtNumber(Number(row.costo_unitario ?? 0)))) : ''}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.nivel > 1 ? fmtNumber(cv?.total_partida ?? 0) : ''}</td>
                      <td className="px-2 py-1.5 text-right font-medium tabular-nums">{row.nivel === 1 ? fmtNumber(cv?.total_partida ?? 0) : ''}</td>
                      <td className="px-1 py-1.5">
                        {hoja && canManage ? (
                          <select className="w-[150px] max-w-[150px] truncate rounded border bg-white py-0.5 pl-1.5 pr-5" defaultValue={row.contratista_id ?? ''} onChange={(e) => save(row.id, { contratista_id: e.target.value || null })}>
                            <option value="">—</option>
                            {contrapartes.map((c: any) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                          </select>
                        ) : ''}
                      </td>
                      <td className="px-1 py-1.5">{hoja && canManage ? <input type="date" className="rounded border bg-white px-1 py-0.5" key={`ini-${row.id}-${fmtDateInput(row.fecha_inicio)}`} defaultValue={fmtDateInput(row.fecha_inicio)} onBlur={(e) => saveFechas(row, { fecha_inicio: e.target.value || null })} /> : (hoja ? fmtDate(row.fecha_inicio) : '')}</td>
                      <td className="px-1 py-1.5">{hoja && canManage ? <input type="date" className="rounded border bg-white px-1 py-0.5" key={`ent-${row.id}-${fmtDateInput(row.fecha_entrega)}`} defaultValue={fmtDateInput(row.fecha_entrega)} onBlur={(e) => saveFechas(row, { fecha_entrega: e.target.value || null })} /> : (hoja ? fmtDate(row.fecha_entrega) : '')}</td>
                      <td className="px-1 py-1.5 text-center">{hoja && canManage ? <input type="number" className="w-12 rounded border bg-white px-1 text-center" key={`dur-${row.id}-${row.duracion_dias ?? ''}`} defaultValue={row.duracion_dias ?? ''} onBlur={(e) => saveFechas(row, { duracion_dias: e.target.value === '' ? null : Number(e.target.value) })} /> : (hoja && row.duracion_dias != null ? row.duracion_dias : '')}</td>
                      <td className="px-2 py-1.5 text-center"><Badge variant={et.variant}>{et.label}</Badge></td>
                      <td className="px-2 py-1.5 text-center"><Badge variant={pr.variant}>{pr.label}</Badge></td>
                      <td className="px-2 py-1.5"><PctBar pct={cv?.pct_acumulado ?? 0} /></td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmtNumber(cv?.valorizado_acum ?? 0)}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{fmtNumber(cv?.saldo ?? 0)}</td>
                      {valsDesc.flatMap(({ v, idx: i }) => {
                        const isActive = i === editIdx;
                        const pct = (avancesCalc.get(row.id)?.[i] ?? 0);
                        const totalPartida = Number(cv?.total_partida ?? 0);
                        const monto = pct * totalPartida;
                        const editable = hoja && isActive && canManage;
                        return [
                          <td key={`${v.id}-p`} className={`px-1 py-1.5 text-center ${isActive ? 'bg-azur-50/40' : ''}`}>
                            {editable ? (
                              <input type="number" step="any" className="w-14 rounded border bg-white px-1 text-center" key={`p-${row.id}-${pct}`} defaultValue={pct ? Math.round(pct * 10000) / 100 : ''} onBlur={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value) / 100;
                                setActiveAvances((m) => new Map(m).set(row.id, val));
                              }} />
                            ) : (hoja ? (pct ? `${fmtNumber(pct * 100, 0)}%` : '—') : '')}
                          </td>,
                          <td key={`${v.id}-t`} className={`px-1 py-1.5 text-right tabular-nums ${isActive ? 'bg-azur-50/40' : ''}`}>
                            {editable ? (
                              <input type="number" step="any" className="w-20 rounded border bg-white px-1 text-right" key={`t-${row.id}-${pct}`} defaultValue={monto ? Math.round(monto * 100) / 100 : ''} onBlur={(e) => {
                                const m = e.target.value === '' ? 0 : Number(e.target.value);
                                const val = totalPartida > 0 ? m / totalPartida : 0;
                                setActiveAvances((mm) => new Map(mm).set(row.id, val));
                              }} />
                            ) : (hoja ? (monto ? fmtNumber(monto) : '—') : '')}
                          </td>,
                        ];
                      })}
                      {canManage && (
                        <td className="px-1 py-1.5">
                          <div className="flex gap-0.5">
                            {hoja && <button title="Detallar APU" onClick={() => setApuItem(row)} className={`rounded p-1 hover:bg-secondary ${row.tiene_apu ? 'text-azur-600' : 'text-muted-foreground'}`}><Layers className="size-3.5" /></button>}
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

      {addTarget && (
        <CatalogoPickerProy nivel={addTarget.nivel} catalogo={catalogo} busy={busy} onClose={() => setAddTarget(null)} onPick={confirmAdd} />
      )}
      {apuItem && (
        <ApuModalProy proyectoId={proy.id} item={apuItem} componentes={apuProyecto.filter((c: any) => c.proyecto_item_id === apuItem.id)} editable={canManage} onClose={() => setApuItem(null)} onChanged={() => router.refresh()} />
      )}
    </div>
  );
}

const NIVEL_LABEL_P = ['', 'partida', 'sub partida', 'actividad', 'sub actividad'];
function CatalogoPickerProy({ nivel, catalogo, busy, onClose, onPick }: any) {
  const [q, setQ] = useState('');
  const filtrados = q.trim() ? catalogo.filter((c: any) => `${c.codigo ?? ''} ${c.descripcion}`.toLowerCase().includes(q.toLowerCase().trim())) : catalogo;
  return (
    <Modal open onClose={onClose} className="sm:max-w-2xl" title={`Agregar ${NIVEL_LABEL_P[nivel]}`} description="Elige una partida del catálogo (precio referencial, editable) o créala en blanco.">
      <div className="space-y-3">
        <Button variant="outline" className="w-full" disabled={busy} onClick={() => onPick(undefined)}><Plus /> Crear en blanco</Button>
        <Input placeholder="Buscar en catálogo por código o descripción…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {filtrados.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Sin coincidencias.</p>}
          {filtrados.map((c: any) => (
            <button key={c.id} disabled={busy} onClick={() => onPick({ titulo: c.descripcion, unidad: c.unidad, costo_unitario: Number(c.costo_referencial ?? 0), catalogoPartidaId: c.id })}
              className="flex w-full items-center justify-between gap-3 rounded-lg border bg-white px-3 py-2 text-left hover:border-azur-300 hover:bg-azur-50 disabled:opacity-60">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{c.descripcion} {c.tiene_apu && <Badge variant="info" className="ml-1 align-middle">APU</Badge>}</p><p className="text-xs text-muted-foreground">{c.codigo ?? 's/código'} {c.unidad ? `· ${c.unidad}` : ''}</p></div>
              <span className="shrink-0 text-sm font-medium tabular-nums text-azur-600">{fmtMoney(Number(c.costo_referencial ?? 0))}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

const APU_TIPOS_P = [
  { v: 'mano_obra', l: 'Mano de obra' }, { v: 'materiales', l: 'Materiales' },
  { v: 'equipos', l: 'Equipos / herramientas' }, { v: 'subcontratos', l: 'Subcontratos' }, { v: 'gastos_generales', l: 'Gastos generales' },
];
function ApuModalProy({ proyectoId, item, componentes, editable, onClose, onChanged }: any) {
  const [busy, setBusy] = useState(false);
  const [nuevo, setNuevo] = useState({ tipo: 'materiales', descripcion: '', unidad: '', cantidad: '', precio: '' });
  const cu = componentes.reduce((a: number, c: any) => a + Number(c.cantidad) * Number(c.precio), 0);

  async function agregar() {
    if (!nuevo.descripcion) return;
    setBusy(true);
    await guardarComponenteApuProyecto(proyectoId, item.id, { tipo: nuevo.tipo, descripcion: nuevo.descripcion, unidad: nuevo.unidad, cantidad: Number(nuevo.cantidad || 0), precio: Number(nuevo.precio || 0) });
    setNuevo({ tipo: nuevo.tipo, descripcion: '', unidad: '', cantidad: '', precio: '' });
    setBusy(false); onChanged();
  }
  async function eliminar(id: string) { setBusy(true); await eliminarComponenteApuProyecto(proyectoId, item.id, id); setBusy(false); onChanged(); }
  const porTipo = (t: string) => componentes.filter((c: any) => c.tipo === t);

  return (
    <Modal open onClose={onClose} className="sm:max-w-3xl" title={`APU · ${item.titulo}`}
      description="Desglose del costo unitario. El C.U. y el total de la partida se recalculan automáticamente."
      footer={<Button variant="gradient" onClick={onClose}>Listo · C.U. = {fmtNumber(cu)}</Button>}>
      <div className="space-y-4">
        {APU_TIPOS_P.map((t) => {
          const comps = porTipo(t.v); if (comps.length === 0) return null;
          const sub = comps.reduce((a: number, c: any) => a + Number(c.cantidad) * Number(c.precio), 0);
          return (
            <div key={t.v}>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-azur-600">{t.l} · {fmtNumber(sub)}</p>
              <div className="space-y-1">
                {comps.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2 rounded-lg border px-2 py-1.5 text-sm">
                    <span className="flex-1">{c.descripcion} {c.unidad && <span className="text-muted-foreground">({c.unidad})</span>}</span>
                    <span className="tabular-nums text-muted-foreground">{fmtNumber(Number(c.cantidad), 2)} × {fmtNumber(Number(c.precio))}</span>
                    <span className="w-20 text-right font-medium tabular-nums">{fmtNumber(Number(c.cantidad) * Number(c.precio))}</span>
                    {editable && <button onClick={() => eliminar(c.id)} className="text-azur-600"><X className="size-4" /></button>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {componentes.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay componentes. Agrega el primero abajo.</p>}
        {editable && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agregar componente</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="col-span-2 sm:col-span-1"><Select value={nuevo.tipo} onChange={(e) => setNuevo((n) => ({ ...n, tipo: e.target.value }))}>{APU_TIPOS_P.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</Select></div>
              <Input className="col-span-2" placeholder="Descripción" value={nuevo.descripcion} onChange={(e) => setNuevo((n) => ({ ...n, descripcion: e.target.value }))} />
              <Input placeholder="Unidad" value={nuevo.unidad} onChange={(e) => setNuevo((n) => ({ ...n, unidad: e.target.value }))} />
              <Input type="number" placeholder="Cantidad/und" value={nuevo.cantidad} onChange={(e) => setNuevo((n) => ({ ...n, cantidad: e.target.value }))} />
              <Input type="number" placeholder="Precio" value={nuevo.precio} onChange={(e) => setNuevo((n) => ({ ...n, precio: e.target.value }))} />
              <Button variant="gradient" disabled={busy || !nuevo.descripcion} onClick={agregar}><Plus /> Agregar</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────── MANTENIMIENTO ────────────────────────────
const RECURRENCIAS = [
  { v: 'unica', l: 'Única' }, { v: 'semanal', l: 'Semanal' }, { v: 'quincenal', l: 'Quincenal' },
  { v: 'mensual', l: 'Mensual' }, { v: 'trimestral', l: 'Trimestral' }, { v: 'semestral', l: 'Semestral' },
];
const ESTADO_SERV: Record<string, any> = { programado: 'info', ejecutado: 'success', facturado: 'muted', cancelado: 'danger' };

function Mantenimiento({ proy, servicios, canManage }: any) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ categoria: '', descripcion: '', monto: 0, recurrencia: 'mensual', inicio: fmtDateInput(new Date()), repeticiones: 6, dias_aviso: 7 });

  async function generar() {
    if (!f.categoria || !f.inicio) return;
    setBusy(true);
    await generarServiciosMantenimiento(proy.id, { ...f, monto: Number(f.monto), repeticiones: Number(f.repeticiones), dias_aviso: Number(f.dias_aviso) });
    setF({ ...f, categoria: '', descripcion: '', monto: 0 });
    router.refresh(); setBusy(false);
  }
  async function setEstado(id: string, estado: string) { await actualizarServicio(proy.id, id, { estado }); router.refresh(); }
  async function borrar(id: string) { await eliminarServicio(proy.id, id); router.refresh(); }

  const total = servicios.reduce((a: number, s: any) => a + Number(s.monto), 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {canManage && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Calendar className="size-4 text-azur-600" /> Programar servicios</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Field label="Categoría"><Input value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })} placeholder="Ej. Limpieza, luminarias…" /></Field>
            <Field label="Descripción"><Input value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Monto por visita"><Input type="number" value={f.monto} onChange={(e) => setF({ ...f, monto: Number(e.target.value) })} /></Field>
              <Field label="Recurrencia"><Select value={f.recurrencia} onChange={(e) => setF({ ...f, recurrencia: e.target.value })}>{RECURRENCIAS.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</Select></Field>
              <Field label="Inicio"><Input type="date" value={f.inicio} onChange={(e) => setF({ ...f, inicio: e.target.value })} /></Field>
              <Field label="N° de visitas"><Input type="number" value={f.repeticiones} onChange={(e) => setF({ ...f, repeticiones: Number(e.target.value) })} disabled={f.recurrencia === 'unica'} /></Field>
            </div>
            <Field label="Avisar (días antes)"><Select value={String(f.dias_aviso)} onChange={(e) => setF({ ...f, dias_aviso: Number(e.target.value) })}><option value="7">7 días</option><option value="15">15 días</option><option value="30">30 días</option></Select></Field>
            <Button variant="gradient" className="w-full" disabled={busy || !f.categoria} onClick={generar}><Plus /> Generar cronograma</Button>
            <p className="text-xs text-muted-foreground">Genera N visitas según la recurrencia. Las alertas saltan según los días configurados.</p>
          </CardContent>
        </Card>
      )}
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Cronograma de servicios</CardTitle>
          <span className="text-sm text-muted-foreground">Total: <b className="text-foreground">{fmtMoney(total)}</b></span>
        </CardHeader>
        <CardContent className="p-0">
          {servicios.length === 0 ? <div className="p-6"><EmptyState titulo="Sin servicios programados" descripcion="Genera el cronograma de mantenimiento." /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Fecha</th><th className="px-3 py-2 text-left">Categoría</th><th className="px-3 py-2 text-right">Monto</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2"></th></tr>
              </thead>
              <tbody>
                {servicios.map((sv: any) => {
                  const vencido = sv.estado === 'programado' && sv.fecha_planificada < fmtDateInput(new Date());
                  return (
                    <tr key={sv.id} className="border-b">
                      <td className="px-3 py-2">{fmtDate(sv.fecha_planificada)}{vencido && <span className="ml-1 text-azur-600">●</span>}</td>
                      <td className="px-3 py-2">{sv.categoria}{sv.descripcion && <span className="block text-xs text-muted-foreground">{sv.descripcion}</span>}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtMoney(Number(sv.monto))}</td>
                      <td className="px-3 py-2 text-center"><Badge variant={ESTADO_SERV[sv.estado] ?? 'muted'}>{sv.estado}</Badge></td>
                      <td className="px-3 py-2">
                        {canManage && (
                          <div className="flex justify-end gap-1">
                            {sv.estado === 'programado' && <Button size="sm" variant="outline" onClick={() => setEstado(sv.id, 'ejecutado')}>Ejecutado</Button>}
                            {sv.estado === 'ejecutado' && <Button size="sm" variant="outline" onClick={() => setEstado(sv.id, 'facturado')}>Facturado</Button>}
                            <Button size="icon" variant="ghost" onClick={() => borrar(sv.id)}><Trash2 className="size-3.5 text-azur-600" /></Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────── LIQUIDACIÓN ──────────────────────────────
function Liquidacion({ proy, items, valorizaciones, adicionales, dash, canManage }: any) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const contrato = Number(proy.contrato_total);
  const costoPresupuestado = items.filter((i: any) => i.es_hoja).reduce((a: number, i: any) => a + Number(i.total_costo ?? 0), 0);
  const amortizado = valorizaciones.reduce((a: number, v: any) => a + Number(v.amortizacion_adelanto ?? 0), 0);
  const adAprob = adicionales.filter((a: any) => a.estado === 'aprobado');
  const adicionalesM = adAprob.filter((a: any) => a.tipo === 'adicional').reduce((a: number, x: any) => a + Number(x.monto), 0);
  const deductivosM = adAprob.filter((a: any) => a.tipo === 'deductivo').reduce((a: number, x: any) => a + Number(x.monto), 0);
  const liq = calcularLiquidacion({
    contrato, adelantoPct: Number(proy.adelanto_pct), amortizadoAdelanto: amortizado,
    valorizado: Number(dash?.valorizado ?? 0), cobrado: Number(dash?.pagos ?? 0), gastado: Number(dash?.gasto ?? 0),
    costoPresupuestado, adicionales: adicionalesM, deductivos: deductivosM,
  });
  const liquidado = proy.estado === 'liquidado';

  async function cerrar() {
    if (!confirm('¿Cerrar y liquidar la obra? La caja chica se cerrará y el remanente volverá a caja central.')) return;
    setBusy(true);
    await liquidarProyecto(proy.id);
    router.refresh();
    setBusy(false);
  }

  const Row = ({ k, v, bold, tone }: { k: string; v: number; bold?: boolean; tone?: 'pos' | 'neg' }) => (
    <div className={`flex items-center justify-between ${bold ? 'border-t pt-2 font-semibold' : ''}`}>
      <span className={bold ? '' : 'text-muted-foreground'}>{k}</span>
      <span className={`tabular-nums ${tone === 'pos' ? 'text-emerald-600' : tone === 'neg' ? 'text-azur-600' : ''}`}>{fmtMoney(v)}</span>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Liquidación de obra</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <Row k="Contrato (precio cliente)" v={contrato} />
            {adicionalesM > 0 && <Row k="(+) Adicionales aprobados" v={adicionalesM} tone="pos" />}
            {deductivosM > 0 && <Row k="(−) Deductivos aprobados" v={deductivosM} tone="neg" />}
            <Row k="Contrato ajustado" v={liq.contratoAjustado} bold />
            <div className="h-2" />
            <Row k="Valorizado al cliente" v={Number(dash?.valorizado ?? 0)} />
            <Row k="Cobrado (abonos)" v={Number(dash?.pagos ?? 0)} tone="pos" />
            <Row k="Por cobrar" v={liq.porCobrar} />
            <div className="h-2" />
            <Row k="Costo presupuestado (interno)" v={costoPresupuestado} />
            <Row k="Gastado real (egresos)" v={Number(dash?.gasto ?? 0)} tone="neg" />
            <div className="h-2" />
            <Row k="Margen vs. presupuesto" v={liq.margenPresupuesto} bold tone={liq.margenPresupuesto >= 0 ? 'pos' : 'neg'} />
            <div className="flex items-center justify-between font-semibold"><span>Utilidad real (cobrado − gastado)</span><span className={`tabular-nums ${liq.utilidadReal >= 0 ? 'text-emerald-600' : 'text-azur-600'}`}>{fmtMoney(liq.utilidadReal)} <span className="text-xs font-normal text-muted-foreground">({fmtPct(liq.margenPct, 1)})</span></span></div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Saldo del adelanto</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <KpiCard label="Adelanto inicial" value={fmtMoney(liq.adelantoInicial)} />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amortizado acumulado</span><span className="tabular-nums">{fmtMoney(amortizado)}</span></div>
            <div className="flex justify-between text-sm font-semibold"><span>Saldo del adelanto</span><span className="tabular-nums text-azur-600">{fmtMoney(liq.adelantoSaldo)}</span></div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-azur-gradient" style={{ width: `${liq.adelantoInicial > 0 ? Math.min(100, (amortizado / liq.adelantoInicial) * 100) : 0}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">El adelanto se diluye con cada valorización hasta llegar a 0.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-4">
            <a href={`/proyectos/${proy.id}/liquidacion/pdf`} target="_blank" rel="noreferrer">
              <Button variant="outline" className="w-full"><FileBarChart /> PDF de liquidación</Button>
            </a>
            {canManage && !liquidado && (
              <Button variant="gradient" className="w-full" disabled={busy} onClick={cerrar}>
                {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Cerrar y liquidar obra
              </Button>
            )}
            {liquidado && <Badge variant="muted" className="w-full justify-center py-1.5">Obra liquidada</Badge>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ───────────────────────────── CAMPO ──────────────────────────────────
function CampoTab({ campo }: any) {
  const [sub, setSub] = useState('asistencias');
  const { asistencias, partes, evidencias, sstCharlas, sstObs, sstInc } = campo;
  const sstTotal = sstCharlas.length + sstObs.length + sstInc.length;
  return (
    <div className="space-y-4">
      <Tabs value={sub} onChange={setSub} tabs={[
        { value: 'asistencias', label: `Asistencia (${asistencias.length})` },
        { value: 'partes', label: `Partes diarios (${partes.length})` },
        { value: 'evidencias', label: `Evidencias (${evidencias.length})` },
        { value: 'sst', label: `SST (${sstTotal})` },
      ]} />

      {sub === 'asistencias' && (
        <Card><CardContent className="p-0">
          {asistencias.length === 0 ? <div className="p-6"><EmptyState titulo="Sin registros de asistencia" /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2 text-left">Persona</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Fecha/hora</th><th className="px-3 py-2">Ubicación GPS</th></tr>
              </thead>
              <tbody>
                {asistencias.map((a: any) => (
                  <tr key={a.id} className="border-b">
                    <td className="px-3 py-2">{a.persona?.nombre ?? '—'}</td>
                    <td className="px-3 py-2 text-center"><Badge variant={a.tipo === 'checkin' ? 'success' : 'secondary'}>{a.tipo === 'checkin' ? 'Entrada' : 'Salida'}</Badge></td>
                    <td className="px-3 py-2 text-center text-muted-foreground">{fmtDateTime(a.registrado_at)}</td>
                    <td className="px-3 py-2 text-center">
                      {a.lat && a.lng ? (
                        <a href={`https://www.google.com/maps?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer" className="text-azur-600 hover:underline">Ver en mapa</a>
                      ) : <span className="text-muted-foreground">sin GPS</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent></Card>
      )}

      {sub === 'partes' && (
        <div className="space-y-3">
          {partes.length === 0 && <EmptyState titulo="Sin partes diarios" />}
          {partes.map((p: any) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{fmtDate(p.fecha)} · {p.autor?.nombre ?? ''}</CardTitle>
                  {p.clima && <Badge variant="info">{p.clima}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {p.rdo_actividades?.length > 0 && (
                  <ul className="space-y-1">
                    {p.rdo_actividades.map((a: any) => (
                      <li key={a.id} className="flex items-center justify-between rounded border px-2 py-1">
                        <span>{a.descripcion}</span>
                        {a.avance_pct != null && <Badge variant="muted">{Math.round(Number(a.avance_pct) * 100)}%</Badge>}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {p.personal_count != null && <span>👷 Personal: {p.personal_count}</span>}
                  {p.equipos && <span>🔧 {p.equipos}</span>}
                  {p.materiales_recibidos && <span>📦 {p.materiales_recibidos}</span>}
                </div>
                {p.observaciones && <p className="text-xs"><b>Obs:</b> {p.observaciones}</p>}
                {p.incidencias && <p className="text-xs text-azur-700"><b>Incidencias:</b> {p.incidencias}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {sub === 'evidencias' && (
        evidencias.length === 0 ? <EmptyState titulo="Sin evidencias fotográficas" /> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {evidencias.map((e: any) => (
              <a key={e.id} href={e.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={e.url} alt={e.descripcion ?? 'evidencia'} className="aspect-square w-full object-cover transition-transform group-hover:scale-105" />
                <div className="p-2 text-[11px] text-muted-foreground">
                  {fmtDate(e.created_at)}{e.lat && e.lng ? ' · 📍' : ''}
                  {e.descripcion && <p className="truncate text-foreground">{e.descripcion}</p>}
                </div>
              </a>
            ))}
          </div>
        )
      )}

      {sub === 'sst' && (
        <div className="grid gap-3 lg:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Charlas de 5 min ({sstCharlas.length})</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {sstCharlas.length === 0 && <p className="text-xs text-muted-foreground">Sin registros.</p>}
              {sstCharlas.map((c: any) => <div key={c.id} className="rounded border p-2 text-xs"><p className="font-medium">{c.tema}</p><p className="text-muted-foreground">{fmtDate(c.fecha)}</p></div>)}
            </CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Observaciones ({sstObs.length})</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {sstObs.length === 0 && <p className="text-xs text-muted-foreground">Sin registros.</p>}
              {sstObs.map((o: any) => <div key={o.id} className="rounded border p-2 text-xs"><Badge variant="warning">{o.tipo}</Badge> <span>{o.descripcion}</span></div>)}
            </CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Incidentes ({sstInc.length})</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {sstInc.length === 0 && <p className="text-xs text-muted-foreground">Sin registros.</p>}
              {sstInc.map((i: any) => <div key={i.id} className="rounded border p-2 text-xs"><Badge variant="danger">{i.gravedad}</Badge> <span>{i.descripcion}</span></div>)}
            </CardContent></Card>
        </div>
      )}
    </div>
  );
}

// Botón + modal para elegir qué secciones lleva el informe al cliente.
function InformeBtn({ proyectoId }: { proyectoId: string }) {
  const [open, setOpen] = useState(false);
  const [secs, setSecs] = useState({ economico: true, avance: true, evidencias: true, observaciones: true });
  const OPCIONES = [
    { k: 'economico' as const, label: 'Resumen económico (contrato, valorizado, por cobrar)' },
    { k: 'avance' as const, label: 'Avance por partida (valorizaciones / saldos)' },
    { k: 'evidencias' as const, label: 'Registro fotográfico (evidencias)' },
    { k: 'observaciones' as const, label: 'Observaciones del residente' },
  ];
  function generar() {
    const sp = new URLSearchParams();
    OPCIONES.forEach((o) => { if (!secs[o.k]) sp.set(o.k, '0'); });
    window.open(`/proyectos/${proyectoId}/informe/pdf?${sp.toString()}`, '_blank');
    setOpen(false);
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><FileBarChart /> Informe de obra (PDF)</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Generar informe para el cliente"
        description="Marca las secciones que quieres incluir. Desmarca las que prefieras omitir."
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="gradient" onClick={generar}><FileBarChart /> Generar PDF</Button></>}>
        <div className="space-y-2">
          {OPCIONES.map((o) => (
            <label key={o.k} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-secondary">
              <input type="checkbox" checked={secs[o.k]} onChange={(e) => setSecs((s) => ({ ...s, [o.k]: e.target.checked }))} className="size-4 accent-azur-600" />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      </Modal>
    </>
  );
}

// Barra de % acumulado (data bar verde, como el Excel del cliente).
function PctBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(1, pct));
  const completo = p >= 0.999;
  return (
    <div className="flex items-center gap-1.5" title={`${Math.round(p * 100)}%`}>
      <div className="h-3 w-14 overflow-hidden rounded-sm bg-secondary">
        <div className={`h-full ${completo ? 'bg-emerald-600' : 'bg-emerald-400'}`} style={{ width: `${p * 100}%` }} />
      </div>
      <span className="w-9 text-right text-xs tabular-nums">{Math.round(p * 100)}%</span>
    </div>
  );
}

// Celda de costo unitario tipo calculadora: acepta fórmula (=40/1.18, 4*50) y guarda
// el resultado + la fórmula; al enfocar muestra la fórmula para editarla.
function FormulaCell({ value, formula, onSave }: { value: any; formula?: string | null; onSave: (v: number, f: string | null) => void }) {
  const [foco, setFoco] = useState(false);
  const display = foco ? (formula || (value ?? '')) : (value ?? '');
  return (
    <input
      className="w-20 rounded border bg-white px-1 text-right tabular-nums"
      title={formula ? `Fórmula: ${formula}` : 'Puedes escribir una fórmula, ej. =40/1.18'}
      defaultValue={display as any}
      key={`${foco}-${value}-${formula ?? ''}`}
      onFocus={() => setFoco(true)}
      onBlur={(e) => {
        setFoco(false);
        const raw = e.target.value.trim();
        if (raw === '') { onSave(0, null); return; }
        if (esFormula(raw)) {
          const r = evalFormula(raw);
          if (r != null) onSave(r, raw);
        } else {
          onSave(Number(raw) || 0, null);
        }
      }}
    />
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
