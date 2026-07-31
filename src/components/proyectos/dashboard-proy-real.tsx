'use client';

import { CurvaSComparativa } from './curva-s-comparativa';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fmtDate } from '@/lib/format';

const iso = (d: any): string | null => (d ? String(d).slice(0, 10) : null);
const dias = (a: string, b: string) => Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000);
const minISO = (xs: (string | null)[]) => { const v = xs.filter(Boolean).sort() as string[]; return v[0] ?? null; };
const maxISO = (xs: (string | null)[]) => { const v = xs.filter(Boolean).sort() as string[]; return v[v.length - 1] ?? null; };

// Dashboard #9 (reunión 4): cruce PROYECTADO vs REAL en Proyectos.
// Costos → curva S comparativa. Tiempo → Gap de plazo (fechas plan vs real).
export function DashboardProyVsReal({
  proy,
  items,
  valorizaciones,
}: {
  proy: any;
  items: any[];
  valorizaciones: { numero: number; monto_valorizado: number }[];
}) {
  const leaves = (items ?? []).filter((i) => i.es_hoja && !i.es_hito);
  const baseVal = proy.base_valorizacion === 'precio' ? 'precio' : 'costo';
  const costoDirecto = leaves.reduce((a, i) => a + Number(i.total_costo ?? 0), 0);
  const factorVal = baseVal === 'precio' && costoDirecto > 0 ? Number(proy.contrato_total ?? 0) / costoDirecto : 1;

  const itemsPlan = leaves.map((r) => ({ fi: iso(r.fi_proy), fe: iso(r.fe_proy), monto: Number(r.total_costo ?? 0) * factorVal }));
  const valsCurva = [...(valorizaciones ?? [])].sort((a, b) => a.numero - b.numero).map((v) => ({ numero: v.numero, monto: Number(v.monto_valorizado ?? 0) }));

  const iniPlan = minISO(leaves.map((r) => iso(r.fi_proy)));
  const finPlan = maxISO(leaves.map((r) => iso(r.fe_proy)));
  const iniReal = minISO(leaves.map((r) => iso(r.fecha_inicio)));
  const finReal = maxISO(leaves.map((r) => iso(r.fecha_entrega)));
  const inicioBase = iniPlan || iso(proy.fecha_inicio);

  const gapDias = finPlan && finReal ? dias(finPlan, finReal) : null;
  const durPlan = iniPlan && finPlan ? dias(iniPlan, finPlan) + 1 : null;
  const durReal = iniReal && finReal ? dias(iniReal, finReal) + 1 : null;
  const atraso = gapDias != null && gapDias > 0;
  const adelanto = gapDias != null && gapDias < 0;

  const sinPlan = itemsPlan.every((i) => !i.fi && !i.fe);

  return (
    <div className="space-y-4">
      <CurvaSComparativa items={itemsPlan} inicioBase={inicioBase} valorizaciones={valsCurva} moneda="S/" />

      <Card>
        <CardHeader className="pb-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Plazo · Proyectado vs Real</CardTitle>
            {gapDias != null && (
              <Badge variant={atraso ? 'danger' : adelanto ? 'success' : 'muted'}>
                {atraso ? `Atraso de ${gapDias} día(s)` : adelanto ? `Adelanto de ${Math.abs(gapDias)} día(s)` : 'En fecha'}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Comparación del cronograma: línea base (fechas planificadas) vs cronograma real del Last Planner.</p>
        </CardHeader>
        <CardContent>
          {sinPlan ? (
            <p className="text-sm text-muted-foreground">Aún no hay fechas planificadas en la línea base. Cárgalas en Last Planner → Proyectado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr><th className="px-2 py-1.5 text-left" /><th className="px-2 py-1.5 text-left">Inicio</th><th className="px-2 py-1.5 text-left">Fin</th><th className="px-2 py-1.5 text-right">Duración (días)</th></tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-2 py-1.5 font-medium text-slate-500">Proyectado (línea base)</td>
                    <td className="px-2 py-1.5">{fmtDate(iniPlan)}</td>
                    <td className="px-2 py-1.5">{fmtDate(finPlan)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{durPlan ?? '—'}</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-2 py-1.5 font-medium text-azur-600">Real (cronograma)</td>
                    <td className="px-2 py-1.5">{fmtDate(iniReal)}</td>
                    <td className="px-2 py-1.5">{fmtDate(finReal)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{durReal ?? '—'}</td>
                  </tr>
                  <tr className="border-t-2 border-azur-200 font-semibold">
                    <td className="px-2 py-1.5">Gap (Real − Proyectado)</td>
                    <td className="px-2 py-1.5" />
                    <td className={`px-2 py-1.5 ${atraso ? 'text-azur-600' : adelanto ? 'text-emerald-600' : ''}`}>{gapDias == null ? '—' : `${gapDias >= 0 ? '+' : '−'}${Math.abs(gapDias)} día(s)`}</td>
                    <td className={`px-2 py-1.5 text-right tabular-nums ${durPlan != null && durReal != null && durReal > durPlan ? 'text-azur-600' : durPlan != null && durReal != null && durReal < durPlan ? 'text-emerald-600' : ''}`}>{durPlan != null && durReal != null ? `${durReal - durPlan >= 0 ? '+' : '−'}${Math.abs(durReal - durPlan)}` : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
