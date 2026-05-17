'use client';

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type Point = {
  proyecto: string;
  contractual: number;
  ejecutado: number;
  gastado: number;
};

export function AvanceFinancieroChart({ data, moneda }: { data: Point[]; moneda: 'PEN' | 'USD' }) {
  if (data.length === 0) {
    return (
      <div className="grid h-64 place-items-center rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
        Sin datos para graficar
      </div>
    );
  }

  const fmt = (v: number) => {
    if (Math.abs(v) >= 1_000_000) return `${moneda === 'USD' ? '$' : 'S/'} ${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `${moneda === 'USD' ? '$' : 'S/'} ${(v / 1_000).toFixed(0)}k`;
    return `${moneda === 'USD' ? '$' : 'S/'} ${v.toFixed(0)}`;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e3" vertical={false} />
        <XAxis
          dataKey="proyecto"
          angle={-25}
          textAnchor="end"
          tick={{ fontSize: 10, fill: '#666' }}
          height={70}
        />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#666' }} width={70} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #ECA4A9', fontSize: 12 }}
          formatter={(v: number) =>
            `${moneda === 'USD' ? '$' : 'S/'} ${v.toLocaleString(moneda === 'USD' ? 'en-US' : 'es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="contractual" name="Contractual" fill="#ECA4A9" radius={[4, 4, 0, 0]} />
        <Bar dataKey="ejecutado" name="Ejecutado físico" fill="#BE1723" radius={[4, 4, 0, 0]} />
        <Bar dataKey="gastado" name="Gastado real" fill="#E20627" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.gastado > d.ejecutado ? '#7A0C18' : '#E20627'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
