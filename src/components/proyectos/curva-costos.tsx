'use client';

import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Label } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { resumenEvm, serieEvm, type EvmItem, type EvmValorizacion, type EvmGasto } from '@/lib/evm';
import { fmtMoney, fmtDate } from '@/lib/format';

// Colores por rol (paleta validada): planificado azul, ganado aqua, costo real naranja.
export const C_PV = '#2a78d6';
export const C_EV = '#1baf7a';
export const C_AC = '#eb6834';
const k = (v: number) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)} MM` : Math.abs(v) >= 1e3 ? `${Math.round(v / 1e3)} k` : `${Math.round(v)}`);

// Curva S de COSTOS vs TIEMPO (valor ganado): eje Y en soles (a costo, sin
// margen) y eje X en semanas del cronograma. BAC = presupuesto total.
export function CurvaCostos({ items, valorizaciones, gastos, hoy }: { items: EvmItem[]; valorizaciones: EvmValorizacion[]; gastos: EvmGasto[]; hoy: string }) {
  const [tabla, setTabla] = useState(false);
  const r = useMemo(() => resumenEvm(items, valorizaciones, gastos, hoy), [items, valorizaciones, gastos, hoy]);
  const { data } = useMemo(() => serieEvm(items, valorizaciones, gastos, hoy), [items, valorizaciones, gastos, hoy]);
  const sinPlan = !items.some((i) => i.es_hoja && !i.es_hito && i.fi_proy && i.fe_proy);
  const fmtCpi = (x: number | null) => (x == null ? '—' : x.toFixed(2));

  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Curva S · Costos vs tiempo (BAC · EV · AC)</CardTitle>
            <p className="text-xs text-muted-foreground">Montos a costo (sin margen) por semana del cronograma: valor planificado (línea base), valor ganado (valorizado) y costo real (pagos de Finanzas).</p>
          </div>
          <div className="flex items-center gap-2">
            {r.cpi != null && (
              <Badge variant={r.cpi >= 1 ? 'success' : r.cpi >= 0.9 ? 'warning' : 'danger'}>
                {r.cpi >= 1 ? 'Bajo presupuesto' : 'Sobrecosto'} · CPI {fmtCpi(r.cpi)}
              </Badge>
            )}
            <button type="button" onClick={() => setTabla((v) => !v)} className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">{tabla ? 'Ver gráfico' : 'Ver tabla'}</button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Tile k="BAC (presupuesto sin margen)" v={fmtMoney(r.bac)} />
          <Tile k="AC (costo real)" v={fmtMoney(r.ac)} />
          <Tile k="EV (valor ganado)" v={fmtMoney(r.ev)} />
          <Tile k="CPI (EV / AC)" v={fmtCpi(r.cpi)} sub={r.spi != null ? `SPI ${r.spi.toFixed(2)} · PV ${fmtMoney(r.pv)}` : undefined} />
        </div>
        {sinPlan && data.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Aún no hay fechas de línea base ni movimientos. Programa las partidas en la pestaña Cronograma.</p>
        ) : tabla ? (
          <div className="max-h-80 overflow-auto rounded-lg border">
            <table className="w-full text-xs tabular-nums">
              <thead className="sticky top-0 bg-muted/80 text-muted-foreground"><tr><th className="px-2 py-1.5 text-left">Semana</th><th className="px-2 py-1.5 text-left">Hasta</th><th className="px-2 py-1.5 text-right">PV planificado</th><th className="px-2 py-1.5 text-right">EV ganado</th><th className="px-2 py-1.5 text-right">AC costo real</th></tr></thead>
              <tbody>{data.map((p) => (
                <tr key={p.semana} className="border-t"><td className="px-2 py-1">S{p.semana}</td><td className="px-2 py-1">{fmtDate(p.fecha)}</td><td className="px-2 py-1 text-right">{fmtMoney(p.pv)}</td><td className="px-2 py-1 text-right">{p.ev == null ? '—' : fmtMoney(p.ev)}</td><td className="px-2 py-1 text-right">{p.ac == null ? '—' : fmtMoney(p.ac)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 16, right: 24, left: 16, bottom: 28 }}>
                <CartesianGrid stroke="#e1e0d9" vertical={false} />
                <XAxis dataKey="semana" fontSize={11} tickFormatter={(s) => `S${s}`} stroke="#c3c2b7" tick={{ fill: '#898781' }} height={42}>
                  <Label value="Tiempo (semanas del cronograma)" position="insideBottom" offset={-2} style={{ fontSize: 11, fill: '#52514e' }} />
                </XAxis>
                <YAxis fontSize={11} tickFormatter={(v) => `S/ ${k(v)}`} stroke="#c3c2b7" tick={{ fill: '#898781' }} width={78}>
                  <Label value="Costo acumulado (S/)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#52514e' }} />
                </YAxis>
                <Tooltip
                  formatter={(v: number, name: string) => [v == null ? '—' : fmtMoney(v), name]}
                  labelFormatter={(s, p) => `Semana ${s}${p?.[0]?.payload?.fecha ? ` · hasta ${fmtDate(p[0].payload.fecha)}` : ''}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: '#52514e' }}>{v}</span>} />
                <ReferenceLine y={r.bac} stroke="#52514e" strokeWidth={1}>
                  <Label value={`BAC ${fmtMoney(r.bac)}`} position="insideTopLeft" style={{ fontSize: 11, fill: '#52514e' }} />
                </ReferenceLine>
                <Line type="monotone" dataKey="pv" name="PV · planificado" stroke={C_PV} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ev" name="EV · valor ganado" stroke={C_EV} strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                <Line type="stepAfter" dataKey="ac" name="AC · costo real" stroke={C_AC} strokeWidth={2} dot={false} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="text-[11px] text-muted-foreground">CPI = EV ÷ AC (≥ 1 bajo presupuesto) · SPI = EV ÷ PV (≥ 1 adelantado). Costo real = solicitudes pagadas/conciliadas del proyecto, sin la reposición de caja chica.</p>
      </CardContent>
    </Card>
  );
}

function Tile({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className="text-base font-semibold">{v}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
