'use client';

import { useMemo } from 'react';
import { Calendar, Flag, Link2, Loader2, Save, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FullscreenButton } from '@/components/ui/fullscreen-button';
import { fmtDate, fmtDateInput, fmtNumber, todayLimaISO } from '@/lib/format';
import { PATRON_LABEL, type PatronDias } from '@/lib/fechas';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Colores del Gantt: la línea base va en azul (color diferenciador) y la barra
// real en el color de estado (verde dentro de plazo / rojo atrasada).
const C_PLAN = '#2a78d6';
const C_OK = '#0ca30c';
const C_ATR = '#d03b3b';
const C_TERM_ATR = '#ec835a';
const C_SIN = '#c3c2b7';

const MS = 86400000;
const t = (iso: string) => new Date(iso + 'T00:00:00').getTime();
const d10 = (x: any): string | null => (x ? fmtDateInput(x) || null : null);
const diffDias = (a: string, b: string) => Math.round((t(b) - t(a)) / MS);

export type EstadoPlazo = 'atrasada' | 'ok' | 'terminada' | 'terminada_atraso' | 'sin';
export const ESTADO_PLAZO: Record<EstadoPlazo, { label: string; variant: 'danger' | 'success' | 'warning' | 'muted'; color: string }> = {
  atrasada: { label: 'Atrasada', variant: 'danger', color: C_ATR },
  ok: { label: 'Dentro de plazo', variant: 'success', color: C_OK },
  terminada: { label: 'Terminada', variant: 'success', color: C_OK },
  terminada_atraso: { label: 'Terminada con atraso', variant: 'warning', color: C_TERM_ATR },
  sin: { label: 'Sin línea base', variant: 'muted', color: C_SIN },
};

/** Estado de control de tiempo de una partida (hoja). */
export function estadoPlazo(row: any, pctAvance: number, hoy: string): EstadoPlazo {
  const feP = d10(row.fe_proy);
  const feR = d10(row.fecha_entrega);
  if (!feP) return 'sin';
  const terminada = pctAvance >= 0.999 || row.estado_tarea === 'completado';
  if (terminada) return feR && feR > feP ? 'terminada_atraso' : 'terminada';
  // Atrasada: el cronograma real termina después de lo proyectado, o ya pasó
  // la fecha fin proyectada y la partida no está terminada.
  if ((feR && feR > feP) || hoy > feP) return 'atrasada';
  return 'ok';
}

interface FlatRow { row: any; depth: number; codigo: string }

export function Cronograma({
  flat, rows, calcVal, canManage, busy, aviso, setAviso, patronSel, setPatronSel, recalcular, saveFechas, saveFechasProy, setDepTarget, codigoDe,
}: {
  flat: FlatRow[];
  rows: any[];
  calcVal: Map<string, any>;
  canManage: boolean;
  busy: boolean;
  aviso: string | null;
  setAviso: (v: string | null) => void;
  patronSel: PatronDias;
  setPatronSel: (p: PatronDias) => void;
  recalcular: (capa: 'real' | 'proy') => void;
  saveFechas: (row: any, patch: any) => void;
  saveFechasProy: (row: any, patch: any) => void;
  setDepTarget: (row: any) => void;
  codigoDe: Map<string, string>;
}) {
  const hoy = todayLimaISO();

  // Hojas descendientes de cada fila (para agregar fechas y estado en los padres).
  const hojasDe = useMemo(() => {
    const hijos = new Map<string, any[]>();
    rows.filter((r) => !r.es_hito).forEach((r) => { const k = r.parent_id ?? '_'; const a = hijos.get(k) ?? []; a.push(r); hijos.set(k, a); });
    const memo = new Map<string, any[]>();
    const go = (id: string): any[] => {
      if (memo.has(id)) return memo.get(id)!;
      const hs = hijos.get(id) ?? [];
      const out = hs.length ? hs.flatMap((h) => (h.es_hoja ? [h] : go(h.id))) : [];
      memo.set(id, out);
      return out;
    };
    rows.forEach((r) => go(r.id));
    return memo;
  }, [rows]);

  // Datos de cada fila: fechas (agregadas en padres), desfase, avance y estado.
  const info = useMemo(() => {
    const m = new Map<string, { fiP: string | null; feP: string | null; fiR: string | null; feR: string | null; durP: number | null; durR: number | null; pct: number; estado: EstadoPlazo; desfase: number | null }>();
    const min = (xs: (string | null)[]) => (xs.filter(Boolean) as string[]).sort()[0] ?? null;
    const max = (xs: (string | null)[]) => (xs.filter(Boolean) as string[]).sort().slice(-1)[0] ?? null;
    flat.forEach(({ row }) => {
      const pct = Number(calcVal.get(row.id)?.pct_acumulado ?? 0);
      if (row.es_hoja || row.es_hito) {
        const fiP = d10(row.fi_proy), feP = d10(row.fe_proy), fiR = d10(row.fecha_inicio), feR = d10(row.fecha_entrega);
        m.set(row.id, {
          fiP, feP, fiR, feR, durP: row.dur_proy ?? null, durR: row.duracion_dias ?? null, pct,
          estado: row.es_hito ? (feP ? (feR && feR > feP ? 'atrasada' : 'ok') : 'sin') : estadoPlazo(row, pct, hoy),
          desfase: feP && feR ? diffDias(feP, feR) : null,
        });
      } else {
        const hs = hojasDe.get(row.id) ?? [];
        const fiP = min(hs.map((h) => d10(h.fi_proy))), feP = max(hs.map((h) => d10(h.fe_proy)));
        const fiR = min(hs.map((h) => d10(h.fecha_inicio))), feR = max(hs.map((h) => d10(h.fecha_entrega)));
        const est = hs.map((h) => estadoPlazo(h, Number(calcVal.get(h.id)?.pct_acumulado ?? 0), hoy));
        const estado: EstadoPlazo = !est.length || est.every((e) => e === 'sin') ? 'sin'
          : est.includes('atrasada') ? 'atrasada'
          : est.every((e) => e === 'terminada' || e === 'terminada_atraso') ? (est.includes('terminada_atraso') ? 'terminada_atraso' : 'terminada')
          : 'ok';
        m.set(row.id, { fiP, feP, fiR, feR, durP: fiP && feP ? diffDias(fiP, feP) + 1 : null, durR: fiR && feR ? diffDias(fiR, feR) + 1 : null, pct, estado, desfase: feP && feR ? diffDias(feP, feR) : null });
      }
    });
    return m;
  }, [flat, calcVal, hojasDe, hoy]);

  // Rango del Gantt: todas las fechas (plan y real) + hoy si cae cerca.
  const rango = useMemo(() => {
    const fechas = [...info.values()].flatMap((i) => [i.fiP, i.feP, i.fiR, i.feR]).filter(Boolean) as string[];
    if (!fechas.length) return null;
    fechas.sort();
    let ini = fechas[0], fin = fechas[fechas.length - 1];
    if (hoy > ini && diffDias(fin, hoy) <= 30) fin = hoy > fin ? hoy : fin;
    // arranca en lunes para que las semanas cuadren
    const dIni = new Date(ini + 'T00:00:00'); dIni.setDate(dIni.getDate() - ((dIni.getDay() + 6) % 7));
    ini = fmtDateInput(dIni);
    const dias = diffDias(ini, fin) + 1;
    const dayW = Math.max(4, Math.min(28, 860 / dias));
    return { ini, fin, dias, dayW, ancho: Math.ceil(dias * dayW) };
  }, [info, hoy]);

  const hojas = flat.filter((f) => f.row.es_hoja && !f.row.es_hito);
  const cuenta = (e: EstadoPlazo[]) => hojas.filter((f) => e.includes(info.get(f.row.id)?.estado ?? 'sin')).length;
  const nAtr = cuenta(['atrasada']), nOk = cuenta(['ok']), nTerm = cuenta(['terminada', 'terminada_atraso']), nSin = cuenta(['sin']);
  const tot = (() => {
    const all = hojas.map((f) => info.get(f.row.id)!).filter(Boolean);
    const max = (xs: (string | null)[]) => (xs.filter(Boolean) as string[]).sort().slice(-1)[0] ?? null;
    const feP = max(all.map((i) => i.feP)), feR = max(all.map((i) => i.feR));
    return { feP, feR, desfase: feP && feR ? diffDias(feP, feR) : null };
  })();

  const x = (iso: string | null) => (rango && iso ? diffDias(rango.ini, iso) * rango.dayW : 0);
  const w = (a: string | null, b: string | null) => (rango && a && b ? Math.max(rango.dayW, (diffDias(a, b) + 1) * rango.dayW) : 0);

  const inp = 'rounded border bg-white px-1 py-0.5';
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="danger">{nAtr} atrasada(s)</Badge>
          <Badge variant="success">{nOk} dentro de plazo</Badge>
          <Badge variant="info">{nTerm} terminada(s)</Badge>
          {nSin > 0 && <Badge variant="muted">{nSin} sin línea base</Badge>}
          <span className="text-muted-foreground">
            Fin proyectado <strong className="text-foreground">{fmtDate(tot.feP)}</strong> · Fin real <strong className="text-foreground">{fmtDate(tot.feR)}</strong>
            {tot.desfase != null && <> · Desfase <strong className={tot.desfase > 0 ? 'text-azur-600' : 'text-emerald-600'}>{tot.desfase > 0 ? `+${tot.desfase}` : tot.desfase} día(s)</strong></>}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FullscreenButton />
          {canManage && (
            <div className="flex items-center gap-1 rounded-lg border bg-white px-1.5 py-0.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              <select className="bg-transparent py-1 text-xs" value={patronSel} onChange={(e) => setPatronSel(e.target.value as PatronDias)}>
                {Object.entries(PATRON_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={() => recalcular('proy')} disabled={busy} title="Recalcula el fin proyectado con inicio + duración">{busy ? <Loader2 className="animate-spin" /> : <Save />} Recalcular proyectado</Button>
              <Button size="sm" variant="outline" onClick={() => recalcular('real')} disabled={busy} title="Recalcula el fin real con inicio + duración">Recalcular real</Button>
            </div>
          )}
        </div>
      </div>

      <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
        Control de tiempos por partida: <strong style={{ color: C_PLAN }}>Inicio – Fin proyectado</strong> (línea base) vs <strong>Inicio – Fin real</strong>. Estas fechas son la fuente única: el <strong>Last Planner</strong> las toma de aquí para las valorizaciones, y el % de avance viene de sus valorizaciones.
      </p>

      {aviso && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} className="text-amber-600 hover:text-amber-900"><X className="size-4" /></button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-xs">
              <thead className="bg-muted/50 uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th rowSpan={2} className="px-2 py-2 text-left align-bottom">Ítem</th>
                  <th rowSpan={2} className="min-w-[200px] px-2 py-2 text-left align-bottom">Partida</th>
                  <th colSpan={3} className="border-b border-sky-200 bg-sky-50 px-2 py-1 text-center" style={{ color: C_PLAN }}>Proyectado (línea base)</th>
                  <th colSpan={3} className="border-b px-2 py-1 text-center">Real</th>
                  <th rowSpan={2} className="px-2 py-2 text-right align-bottom">Desfase</th>
                  <th rowSpan={2} className="px-2 py-2 text-right align-bottom">% Avance</th>
                  <th rowSpan={2} className="px-2 py-2 text-center align-bottom">Estado</th>
                </tr>
                <tr>
                  <th className="bg-sky-50 px-2 py-1" style={{ color: C_PLAN }}>Inicio</th>
                  <th className="bg-sky-50 px-2 py-1" style={{ color: C_PLAN }}>Fin</th>
                  <th className="bg-sky-50 px-2 py-1" style={{ color: C_PLAN }}>Dur</th>
                  <th className="px-2 py-1">Inicio</th>
                  <th className="px-2 py-1">Fin</th>
                  <th className="px-2 py-1">Dur</th>
                </tr>
              </thead>
              <tbody>
                {flat.length === 0 && <tr><td colSpan={11} className="py-10 text-center text-muted-foreground">Sin partidas. Agrégalas desde el Last Planner.</td></tr>}
                {flat.map(({ row, depth, codigo }) => {
                  const i = info.get(row.id);
                  if (!i) return null;
                  const hoja = row.es_hoja || row.es_hito;
                  const edit = canManage && hoja;
                  const est = ESTADO_PLAZO[i.estado];
                  const depCod = row.depende_de ? codigoDe.get(row.depende_de) : null;
                  const dep = canManage && hoja ? (
                    <button type="button" title={depCod ? `Depende de ${depCod}` : 'Vincular dependencia'} onClick={() => setDepTarget(row)} className={`ml-1 rounded p-0.5 hover:bg-secondary ${row.depende_de ? 'text-azur-600' : 'text-muted-foreground'}`}><Link2 className="size-3" /></button>
                  ) : null;
                  const nivelBg = row.es_hito ? 'bg-amber-50/40' : ['bg-slate-200/80', 'bg-slate-100/80', 'bg-slate-50/80', 'bg-slate-50/40'][Math.min(3, (row.nivel ?? 1) - 1)];
                  return (
                    <tr key={row.id} className={`border-b ${nivelBg} ${!hoja ? 'font-medium' : ''}`}>
                      <td className={`px-2 py-1.5 font-medium ${row.es_hito ? 'text-amber-700' : 'text-muted-foreground'}`}>{codigo}</td>
                      <td className="px-2 py-1.5">
                        <span className="flex items-center gap-1" style={{ paddingLeft: depth * 14 }}>
                          {row.es_hito && <Flag className="size-3 shrink-0 text-amber-600" />}
                          <span className="max-w-[280px] truncate" title={row.titulo}>{row.titulo}</span>
                          {depCod && <span className="text-[10px] font-medium text-azur-600">← {depCod}</span>}
                        </span>
                      </td>
                      {/* Proyectado */}
                      <td className="bg-sky-50/70 px-1 py-1">{edit ? <input type="date" className={inp} key={`pi-${row.id}-${i.fiP}`} defaultValue={i.fiP ?? ''} onBlur={(e) => { if ((e.target.value || null) !== i.fiP) saveFechasProy(row, { fi_proy: e.target.value || null }); }} /> : <span style={{ color: C_PLAN }}>{fmtDate(i.fiP)}</span>}</td>
                      <td className="bg-sky-50/70 px-1 py-1"><span className="flex items-center">{edit ? <input type="date" className={inp} key={`pf-${row.id}-${i.feP}`} defaultValue={i.feP ?? ''} onBlur={(e) => { if ((e.target.value || null) !== i.feP) saveFechasProy(row, { fe_proy: e.target.value || null }); }} /> : <span style={{ color: C_PLAN }}>{fmtDate(i.feP)}</span>}{dep}</span></td>
                      <td className="bg-sky-50/70 px-1 py-1 text-center">{edit ? <input type="number" className={`${inp} w-12 text-center`} key={`pd-${row.id}-${row.dur_proy ?? ''}`} defaultValue={row.dur_proy ?? ''} onBlur={(e) => { const nv = e.target.value === '' ? null : Number(e.target.value); if (nv !== (row.dur_proy ?? null)) saveFechasProy(row, { dur_proy: nv }); }} /> : <span style={{ color: C_PLAN }}>{i.durP ?? ''}</span>}</td>
                      {/* Real */}
                      <td className="px-1 py-1">{edit ? <input type="date" className={inp} key={`ri-${row.id}-${i.fiR}`} defaultValue={i.fiR ?? ''} onBlur={(e) => { if ((e.target.value || null) !== i.fiR) saveFechas(row, { fecha_inicio: e.target.value || null }); }} /> : fmtDate(i.fiR)}</td>
                      <td className="px-1 py-1">{edit ? <input type="date" className={inp} key={`rf-${row.id}-${i.feR}`} defaultValue={i.feR ?? ''} onBlur={(e) => { if ((e.target.value || null) !== i.feR) saveFechas(row, { fecha_entrega: e.target.value || null }); }} /> : fmtDate(i.feR)}</td>
                      <td className="px-1 py-1 text-center">{edit ? <input type="number" className={`${inp} w-12 text-center`} key={`rd-${row.id}-${row.duracion_dias ?? ''}`} defaultValue={row.duracion_dias ?? ''} onBlur={(e) => { const nv = e.target.value === '' ? null : Number(e.target.value); if (nv !== (row.duracion_dias ?? null)) saveFechas(row, { duracion_dias: nv }); }} /> : (i.durR ?? '')}</td>
                      <td className={`px-2 py-1.5 text-right tabular-nums ${i.desfase != null && i.desfase > 0 ? 'font-semibold text-azur-600' : i.desfase != null && i.desfase < 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>{i.desfase == null ? '—' : `${i.desfase > 0 ? '+' : ''}${i.desfase} d`}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.es_hito ? '' : `${fmtNumber(i.pct * 100, 0)}%`}</td>
                      <td className="px-2 py-1.5 text-center">{row.es_hito ? <Badge variant="warning">Hito</Badge> : <Badge variant={est.variant}>{est.label}</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {rango && (
        <Card>
          <CardContent className="p-3">
            <p className="mb-2 text-sm font-semibold">Diagrama de Gantt · Proyectado vs Real</p>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 260 + rango.ancho }}>
                <div className="flex border-b pb-1">
                  <div className="w-[260px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Partida</div>
                  <GanttHeader ini={rango.ini} dias={rango.dias} dayW={rango.dayW} ancho={rango.ancho} hoy={hoy} />
                </div>
                {flat.map(({ row, depth, codigo }) => {
                  const i = info.get(row.id);
                  if (!i) return null;
                  const est = ESTADO_PLAZO[i.estado];
                  const hoja = row.es_hoja || row.es_hito;
                  return (
                    <div key={row.id} className={`flex items-center border-b border-slate-100 ${!hoja ? 'bg-slate-50' : ''}`}>
                      <div className={`w-[260px] shrink-0 truncate py-1 pr-2 text-xs ${!hoja ? 'font-semibold' : ''}`} style={{ paddingLeft: depth * 12 }} title={row.titulo}>
                        <span className="text-muted-foreground">{codigo}</span> {row.titulo}
                      </div>
                      <div className="relative h-7" style={{ width: rango.ancho }}
                        title={`${row.titulo}\nProyectado: ${fmtDate(i.fiP)} → ${fmtDate(i.feP)}\nReal: ${fmtDate(i.fiR)} → ${fmtDate(i.feR)}\n${row.es_hito ? 'Hito' : est.label}`}>
                        {Array.from({ length: Math.ceil(rango.dias / 7) }).map((_, k) => <div key={k} className="absolute inset-y-0 w-px bg-slate-100" style={{ left: k * 7 * rango.dayW }} />)}
                        {hoy >= rango.ini && hoy <= rango.fin && <div className="absolute inset-y-0 w-px bg-azur-500" style={{ left: x(hoy) }} />}
                        {i.fiP && i.feP && <div className="absolute top-[4px] h-[8px] rounded-sm" style={{ left: x(i.fiP), width: w(i.fiP, i.feP), backgroundColor: C_PLAN, opacity: hoja ? 0.9 : 0.55 }} />}
                        {i.fiR && i.feR && <div className="absolute top-[15px] h-[8px] rounded-sm" style={{ left: x(i.fiR), width: w(i.fiR, i.feR), backgroundColor: est.color, opacity: hoja ? 1 : 0.6 }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded-sm" style={{ backgroundColor: C_PLAN }} /> Proyectado (línea base)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded-sm" style={{ backgroundColor: C_OK }} /> Real · dentro de plazo / terminada</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded-sm" style={{ backgroundColor: C_ATR }} /> Real · atrasada</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-5 rounded-sm" style={{ backgroundColor: C_TERM_ATR }} /> Real · terminada con atraso</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-px bg-azur-500" /> Hoy</span>
        <span>Atrasada = el fin real supera al proyectado, o ya pasó el fin proyectado sin terminar la partida.</span>
      </div>
    </div>
  );
}

function GanttHeader({ ini, dias, dayW, ancho, hoy }: { ini: string; dias: number; dayW: number; ancho: number; hoy: string }) {
  const semanas = Math.ceil(dias / 7);
  return (
    <div className="relative h-8 normal-case" style={{ width: ancho }}>
      {Array.from({ length: semanas }).map((_, s) => {
        const d = new Date(ini + 'T00:00:00'); d.setDate(d.getDate() + s * 7);
        return (
          <div key={s} className="absolute top-0 h-full border-l border-slate-300 pl-0.5 text-[10px] leading-tight" style={{ left: s * 7 * dayW, width: 7 * dayW }}>
            <div className="font-semibold">S{s + 1}</div>
            {7 * dayW >= 34 && <div className="font-normal">{String(d.getDate()).padStart(2, '0')}/{String(d.getMonth() + 1).padStart(2, '0')}</div>}
          </div>
        );
      })}
      {hoy >= ini && <div className="absolute bottom-0 text-[9px] font-semibold text-azur-600" style={{ left: Math.min(ancho - 24, diffDias(ini, hoy) * dayW) }}>hoy</div>}
    </div>
  );
}
