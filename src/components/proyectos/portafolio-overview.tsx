'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/page';
import { fmtMoney } from '@/lib/format';
import { SALUD_COLOR, SALUD_LABEL, type Salud } from '@/lib/salud';

export type PortItem = {
  id: string; codigo: string | null; nombre: string; estado: string;
  contrato: number; valorizado: number; gasto: number;
  fisico: number; tiempo: number; gap: number; margen: number; salud: Salud;
};

function Barra({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct * 100))}%`, backgroundColor: color }} />
    </div>
  );
}

export function PortafolioOverview({ items }: { items: PortItem[] }) {
  const [abierto, setAbierto] = useState(true);
  if (!items.length) return null;

  const contrato = items.reduce((a, p) => a + p.contrato, 0);
  const valorizado = items.reduce((a, p) => a + p.valorizado, 0);
  const gasto = items.reduce((a, p) => a + p.gasto, 0);
  const criticos = items.filter((p) => p.salud === 'critica').length;
  const orden = { critica: 0, advertencia: 1, ok: 2 } as const;
  const filas = [...items].sort((a, b) => orden[a.salud] - orden[b.salud] || a.gap - b.gap);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <button type="button" onClick={() => setAbierto((v) => !v)} className="flex w-full items-center justify-between">
          <span className="flex items-center gap-2 font-semibold"><LayoutDashboard className="size-4 text-azur-600" /> Portafolio · salud de proyectos</span>
          {abierto ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </button>

        {abierto && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <KpiCard label="Proyectos activos" value={items.length} />
              <KpiCard label="Contrato total" value={fmtMoney(contrato)} tone="azur" />
              <KpiCard label="Valorizado" value={fmtMoney(valorizado)} tone="success" />
              <KpiCard label="Gasto" value={fmtMoney(gasto)} tone="warning" />
              <KpiCard label="Críticos" value={criticos} tone={criticos ? 'azur' : 'default'} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-2 py-2 text-left">Proyecto</th>
                    <th className="px-2 py-2 text-left">Salud</th>
                    <th className="px-2 py-2 text-left">Avance físico</th>
                    <th className="px-2 py-2 text-left">Tiempo</th>
                    <th className="px-2 py-2 text-right">Gap</th>
                    <th className="px-2 py-2 text-right">Valorizado</th>
                    <th className="px-2 py-2 text-right">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-secondary/30">
                      <td className="px-2 py-2">
                        <Link href={`/proyectos/${p.id}`} className="font-medium hover:text-azur-600">{p.codigo ?? p.nombre}</Link>
                        <p className="max-w-[180px] truncate text-xs text-muted-foreground">{p.nombre}</p>
                      </td>
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: SALUD_COLOR[p.salud] }}>
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: SALUD_COLOR[p.salud] }} /> {SALUD_LABEL[p.salud]}
                        </span>
                      </td>
                      <td className="px-2 py-2"><div className="flex items-center gap-2"><Barra pct={p.fisico} color="#10b981" /><span className="w-9 text-right text-xs tabular-nums">{Math.round(p.fisico * 100)}%</span></div></td>
                      <td className="px-2 py-2"><div className="flex items-center gap-2"><Barra pct={p.tiempo} color="#94a3b8" /><span className="w-9 text-right text-xs tabular-nums">{Math.round(p.tiempo * 100)}%</span></div></td>
                      <td className={`px-2 py-2 text-right text-xs font-semibold tabular-nums ${p.gap < -0.05 ? 'text-azur-600' : p.gap > 0.05 ? 'text-emerald-600' : 'text-muted-foreground'}`}>{p.gap >= 0 ? '+' : '−'}{Math.abs(Math.round(p.gap * 100))} pp</td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtMoney(p.valorizado)}</td>
                      <td className={`px-2 py-2 text-right tabular-nums ${p.margen < 0 ? 'text-azur-600' : ''}`}>{fmtMoney(p.margen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground">Avance físico = valorizado ÷ contrato. Tiempo = transcurrido ÷ plazo. Gap = físico − tiempo (negativo = atraso). Margen a la fecha = valorizado − gasto. Salud según reglas: gasto ≤ cobrado y gasto ≤ valorizado.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
