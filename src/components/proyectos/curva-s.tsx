'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { semanasEntre } from '@/lib/lastplanner';

// Curva S (Sección 4.2): avance acumulado planificado vs ejecutado.
export function CurvaS({
  contratoTotal,
  fechaInicio,
  fechaFin,
  valorizaciones,
}: {
  contratoTotal: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  valorizaciones: { numero: number; monto_valorizado: number }[];
}) {
  const numSemanas = semanasEntre(fechaInicio, fechaFin);
  const maxVal = valorizaciones.reduce((m, v) => Math.max(m, v.numero), 0);
  const total = Math.max(numSemanas, maxVal, 1);

  // acumulado real por semana
  const valByWeek = new Map<number, number>();
  valorizaciones.forEach((v) => valByWeek.set(v.numero, (valByWeek.get(v.numero) ?? 0) + Number(v.monto_valorizado)));

  let acum = 0;
  const data = Array.from({ length: total + 1 }, (_, s) => {
    acum += valByWeek.get(s) ?? 0;
    const realPct = contratoTotal > 0 && s <= maxVal ? (acum / contratoTotal) * 100 : s <= maxVal ? 0 : null;
    return {
      semana: `S${s}`,
      Planificado: Math.round(Math.min(100, (s / total) * 100) * 10) / 10,
      Ejecutado: realPct == null ? null : Math.round(realPct * 10) / 10,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Curva S · avance acumulado</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="semana" fontSize={11} />
              <YAxis fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Legend />
              <Line type="monotone" dataKey="Planificado" stroke="#94a3b8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Ejecutado" stroke="#E20627" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
