'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { serieComparativa, type ItemPlan } from '@/lib/curva';
import { fmtNumber } from '@/lib/format';

// Curva S comparativa: PROYECTADO (línea base, gris) vs REAL (ejecutado, rojo).
// El proyectado se calcula solo con las fechas planificadas + el monto de cada
// partida; el real usa las valorizaciones semanales cargadas.
export function CurvaSComparativa({
  items,
  inicioBase,
  valorizaciones,
  moneda = 'S/',
}: {
  items: ItemPlan[];
  inicioBase: string | null;
  valorizaciones: { numero: number; monto: number }[];
  moneda?: string;
}) {
  const serie = serieComparativa({ items, inicioBase, valorizaciones });
  const atrasado = serie.gapMonto < -0.005 * (serie.baseTotal || 1);
  const adelantado = serie.gapMonto > 0.005 * (serie.baseTotal || 1);

  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Curva S · Proyectado vs Real</CardTitle>
            <p className="text-xs text-muted-foreground">
              Avance acumulado del contrato por semana: <span className="text-slate-500">Proyectado</span> (línea base según fechas + costo) vs <span className="text-azur-600">Real</span> (valorizado ejecutado).
            </p>
          </div>
          {serie.semanaRealActual > 0 && (
            <Badge variant={atrasado ? 'danger' : adelantado ? 'success' : 'muted'}>
              {atrasado ? 'Atraso' : adelantado ? 'Adelanto' : 'En línea'} · {serie.gapMonto >= 0 ? '+' : '−'}{moneda} {fmtNumber(Math.abs(serie.gapMonto))} ({serie.gapPct >= 0 ? '+' : '−'}{Math.abs(serie.gapPct).toFixed(1)} pp)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serie.data} margin={{ top: 8, right: 20, left: 24, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="semana" fontSize={11} height={42}>
                <Label value="Semanas (cronograma)" position="insideBottom" offset={-2} style={{ fontSize: 11, fill: '#64748b' }} />
              </XAxis>
              <YAxis fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} width={54}>
                <Label value="% avance acumulado" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
              </YAxis>
              <Tooltip
                formatter={(v: number, name: string) => [v == null ? '—' : `${v}%`, name]}
                labelFormatter={(l) => `Semana ${l}`}
              />
              <Legend />
              <Line type="monotone" dataKey="planPct" name="Proyectado" stroke="#94a3b8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="realPct" name="Real" stroke="#E20627" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {serie.baseTotal > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <Kpi k="Total línea base" v={`${moneda} ${fmtNumber(serie.baseTotal)}`} />
            <Kpi k="Plan a la fecha" v={`${moneda} ${fmtNumber(serie.data[Math.min(serie.semanaRealActual, serie.data.length - 1)]?.planAcum ?? 0)}`} />
            <Kpi k="Real a la fecha" v={`${moneda} ${fmtNumber(valorizaciones.reduce((a, v) => a + (v.monto || 0), 0))}`} />
            <Kpi k="Gap (Real − Plan)" v={`${serie.gapMonto >= 0 ? '+' : '−'}${moneda} ${fmtNumber(Math.abs(serie.gapMonto))}`} tone={atrasado ? 'bad' : adelantado ? 'good' : undefined} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({ k, v, tone }: { k: string; v: string; tone?: 'good' | 'bad' }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
      <div className={`font-semibold tabular-nums ${tone === 'bad' ? 'text-azur-600' : tone === 'good' ? 'text-emerald-600' : ''}`}>{v}</div>
    </div>
  );
}
