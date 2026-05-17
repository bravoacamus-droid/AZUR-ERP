'use client';

import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export type CurvaSPoint = {
  periodo: number;
  fecha: string;            // ISO date
  ejecutado: number;        // acumulado ejecutado al periodo
  planificado: number;      // acumulado planificado al periodo (lineal por defecto)
};

type CurvaSProps = {
  data: CurvaSPoint[];
  moneda: 'PEN' | 'USD';
};

function fmtAxis(v: number, moneda: 'PEN' | 'USD') {
  if (Math.abs(v) >= 1_000_000) {
    return `${moneda === 'USD' ? '$' : 'S/'} ${(v / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(v) >= 1_000) {
    return `${moneda === 'USD' ? '$' : 'S/'} ${(v / 1_000).toFixed(0)}k`;
  }
  return `${moneda === 'USD' ? '$' : 'S/'} ${v.toFixed(0)}`;
}

function fmtTooltip(v: number, moneda: 'PEN' | 'USD') {
  return (moneda === 'USD' ? '$ ' : 'S/ ') +
    v.toLocaleString(moneda === 'USD' ? 'en-US' : 'es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
}

export function CurvaSChart({ data, moneda }: CurvaSProps) {
  if (data.length === 0) {
    return (
      <div className="grid h-72 place-items-center rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
        Sin valorizaciones aún para graficar la Curva S
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={340}>
      <AreaChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
        <defs>
          <linearGradient id="grad-planif" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ECA4A9" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#ECA4A9" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="grad-ejec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BE1723" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#BE1723" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e3e3e3" />
        <XAxis
          dataKey="periodo"
          tickFormatter={(v) => `V${v}`}
          tick={{ fontSize: 11, fill: '#666' }}
          axisLine={{ stroke: '#e3e3e3' }}
        />
        <YAxis
          tickFormatter={(v) => fmtAxis(Number(v), moneda)}
          tick={{ fontSize: 11, fill: '#666' }}
          axisLine={{ stroke: '#e3e3e3' }}
          width={70}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #ECA4A9',
            background: '#fff',
            fontSize: 12,
          }}
          formatter={(v: number) => fmtTooltip(v, moneda)}
          labelFormatter={(l) => `Valorización ${l}`}
        />
        <Legend
          wrapperStyle={{ fontSize: 12 }}
          formatter={(v) => (v === 'planificado' ? 'Planificado acumulado' : 'Ejecutado acumulado')}
        />
        <Area
          type="monotone"
          dataKey="planificado"
          stroke="#ECA4A9"
          strokeWidth={2}
          fill="url(#grad-planif)"
          strokeDasharray="6 4"
        />
        <Area
          type="monotone"
          dataKey="ejecutado"
          stroke="#BE1723"
          strokeWidth={2.5}
          fill="url(#grad-ejec)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
