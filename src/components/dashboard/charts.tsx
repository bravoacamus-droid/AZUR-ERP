'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ── Paleta validada (scripts/validate_palette del método dataviz) ──
// Categórica: azul (proyectado/plan), naranja (real), aqua (tercera serie).
export const C = {
  plan: '#2a78d6',
  real: '#eb6834',
  tercera: '#1baf7a',
  planClaro: '#86b6ef',
  // estados (siempre con texto/ícono, nunca solo color)
  bien: '#0ca30c',
  atencion: '#fab219',
  serio: '#ec835a',
  critico: '#d03b3b',
  // tinta y chrome
  tinta: '#0b0b0b',
  tinta2: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  eje: '#c3c2b7',
};
// Rampa ordinal azul para antigüedad (0–15 → +60 días), validada con --ordinal.
export const RAMPA_ANTIG = ['#86b6ef', '#3987e5', '#1c5cab', '#0d366b'];

export const fmtK = (v: number) => {
  const a = Math.abs(v);
  const s = a >= 1e6 ? `${(v / 1e6).toFixed(a >= 1e7 ? 0 : 1)} MM` : a >= 1e3 ? `${(v / 1e3).toFixed(a >= 1e5 ? 0 : 1)} k` : `${Math.round(v)}`;
  return s.replace('.0 ', ' ');
};
export const fmtSoles = (v: number) => `S/ ${fmtK(v)}`;
export const pct = (v: number | null | undefined, dec = 0) => (v == null || !isFinite(v) ? '—' : `${(v * 100).toFixed(dec)}%`);

export const ejeProps = { fontSize: 11, stroke: C.eje, tick: { fill: C.muted } } as const;
export const leyendaTexto = (v: string) => <span style={{ color: C.tinta2, fontSize: 12 }}>{v}</span>;

// Etiquetas de datos sin salto de línea (las de Recharts se parten al ancho de la barra).
export function etiquetaDerecha(fmt: (v: number) => string, color: string = C.tinta) {
  // eslint-disable-next-line react/display-name
  return (p: any) => (p.value == null || p.value === 0 ? null : (
    <text x={p.x + p.width + 6} y={p.y + p.height / 2 + 4} fontSize={11} fontWeight={600} fill={color}>{fmt(Number(p.value))}</text>
  ));
}
export function etiquetaArriba(fmt: (v: any) => string, color: string = C.tinta) {
  // eslint-disable-next-line react/display-name
  return (p: any) => (p.value == null || p.value === '' ? null : (
    <text x={p.x + p.width / 2} y={p.y - 6} textAnchor="middle" fontSize={11} fontWeight={600} fill={color}>{typeof p.value === 'number' ? fmt(p.value) : String(p.value)}</text>
  ));
}

/** Tick de eje de categorías en una sola línea (trunca con "…"; el nombre completo va en el tooltip/tabla). */
export function tickUnaLinea(max = 26, anchor: 'end' | 'middle' = 'end') {
  // eslint-disable-next-line react/display-name
  return (p: any) => {
    const v = String(p.payload?.value ?? '');
    const t = v.length > max ? `${v.slice(0, max - 1)}…` : v;
    return <text x={p.x} y={p.y} dy={anchor === 'end' ? 4 : 14} textAnchor={anchor} fontSize={11} fill={C.muted}><title>{v}</title>{t}</text>;
  };
}

export interface ColTabla<T> { k: string; label: string; v: (r: T) => React.ReactNode; right?: boolean }

/** Tarjeta de gráfico con su vista de tabla (equivalente accesible). */
export function ChartCard<T>({
  titulo, descripcion, children, filas, columnas, acciones, alto = 288, vacio,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  children: React.ReactNode;
  filas?: T[];
  columnas?: ColTabla<T>[];
  acciones?: React.ReactNode;
  alto?: number;
  vacio?: string | null;
}) {
  const [tabla, setTabla] = React.useState(false);
  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base">{titulo}</CardTitle>
            {descripcion && <p className="mt-0.5 text-xs text-muted-foreground">{descripcion}</p>}
          </div>
          <div className="flex items-center gap-2">
            {acciones}
            {filas && columnas && !vacio && (
              <button type="button" onClick={() => setTabla((v) => !v)} className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary">
                {tabla ? 'Ver gráfico' : 'Ver tabla'}
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {vacio ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground" style={{ minHeight: Math.min(alto, 180) }}>{vacio}</div>
        ) : tabla && filas && columnas ? (
          <div className="overflow-auto rounded-lg border" style={{ maxHeight: alto + 40 }}>
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 text-muted-foreground">
                <tr>{columnas.map((c) => <th key={c.k} className={`px-2 py-1.5 ${c.right ? 'text-right' : 'text-left'}`}>{c.label}</th>)}</tr>
              </thead>
              <tbody className="tabular-nums">
                {filas.map((f, i) => (
                  <tr key={i} className="border-t">{columnas.map((c) => <td key={c.k} className={`px-2 py-1 ${c.right ? 'text-right' : ''}`}>{c.v(f)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height: alto }} className="w-full">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

/** Tarjeta de indicador (stat tile) con barra de estado y texto. */
export function StatTile({ etiqueta, valor, sub, estado }: { etiqueta: string; valor: string; sub?: string; estado?: 'bien' | 'atencion' | 'critico' }) {
  const color = estado === 'bien' ? C.bien : estado === 'atencion' ? C.atencion : estado === 'critico' ? C.critico : null;
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 text-2xl font-bold">{valor}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {color && <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: color }} />}
    </div>
  );
}

/** Indicador circular para SPI / CPI (meta = 1.00). */
export function Medidor({ titulo, sub, valor, okTexto, malTexto }: { titulo: string; sub: string; valor: number | null; okTexto: string; malTexto: string }) {
  const v = valor ?? 0;
  const estado = valor == null ? null : v >= 0.95 ? 'bien' : v >= 0.9 ? 'atencion' : 'critico';
  const color = estado === 'bien' ? C.bien : estado === 'atencion' ? C.atencion : estado === 'critico' ? C.critico : C.eje;
  const r = 34, L = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, v / 1.5)); // escala 0–1.5; la meta 1.00 queda a 2/3
  const meta = (1 / 1.5) * 360 - 90;
  return (
    <div className="flex flex-col items-center rounded-xl border bg-white p-3 text-center">
      <p className="text-sm font-semibold">{titulo}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
      <svg width="96" height="96" viewBox="0 0 96 96" className="my-1" role="img" aria-label={`${titulo} ${valor == null ? 'sin datos' : v.toFixed(2)}`}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="#eeede8" strokeWidth="9" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${frac * L} ${L}`} transform="rotate(-90 48 48)" />
        <line x1="48" y1="9" x2="48" y2="19" stroke={C.tinta} strokeWidth="2" transform={`rotate(${meta + 90} 48 48)`} />
        <text x="48" y="54" textAnchor="middle" fontSize="19" fontWeight="700" fill={C.tinta}>{valor == null ? '—' : v.toFixed(2)}</text>
      </svg>
      <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: valor == null ? '#f0efec' : `${color}22`, color: C.tinta2 }}>
        {valor == null ? 'Sin datos' : v >= 1 ? `▲ ${okTexto}` : `● ${malTexto}`}
      </span>
    </div>
  );
}
