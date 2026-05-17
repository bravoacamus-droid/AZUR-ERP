'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { SOLICITUD_CATEGORIA_LABEL } from '@/lib/finanzas/estados';

const COLORS = ['#BE1723', '#E20627', '#ECA4A9', '#0A0A0A', '#7A0C18', '#F8DDDF', '#4A4A4A'];

type Slice = { categoria: string; total: number };

export function GastoCategoriaChart({ data, moneda }: { data: Slice[]; moneda: 'PEN' | 'USD' }) {
  if (data.length === 0) {
    return (
      <div className="grid h-64 place-items-center rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
        Sin gastos aún para graficar
      </div>
    );
  }

  const data2 = data.map((d) => ({
    name: SOLICITUD_CATEGORIA_LABEL[d.categoria] ?? d.categoria,
    value: Number(d.total),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data2}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          dataKey="value"
          stroke="#fff"
          strokeWidth={2}
        >
          {data2.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) =>
            `${moneda === 'USD' ? '$' : 'S/'} ${v.toLocaleString(moneda === 'USD' ? 'en-US' : 'es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          }
          contentStyle={{ borderRadius: 12, border: '1px solid #ECA4A9', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
