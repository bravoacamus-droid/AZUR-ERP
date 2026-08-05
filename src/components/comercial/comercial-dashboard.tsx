'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, LabelList } from 'recharts';
import { FileText, Send, CheckCircle2, Percent, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { KpiCard } from '@/components/ui/page';
import { EmptyState } from '@/components/ui/misc';
import { fmtMoney } from '@/lib/format';
import { ESTADO_COTIZACION } from '@/lib/estados';

type Dash = {
  porEstado: Record<string, number>;
  porLinea: { nombre: string; n: number }[];
  porMes: { mes: string; creadas: number; aceptadas: number }[];
  montoGanado: number;
  total: number;
} | null;

// Colores de estado (cada estado es un "state", no una serie categórica).
const ESTADO_COLOR: Record<string, string> = {
  borrador: '#94a3b8', enviada: '#0ea5e9', en_negociacion: '#f59e0b',
  aceptada: '#10b981', vencida: '#64748b', rechazada: '#E20627',
};
const ORDEN = ['borrador', 'enviada', 'en_negociacion', 'aceptada', 'vencida', 'rechazada'];
const mescorto = (m: string) => { const [a, mm] = m.split('-'); return `${['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Set','Oct','Nov','Dic'][Number(mm)]} ${a.slice(2)}`; };

export function ComercialDashboard({ dash }: { dash: Dash }) {
  if (!dash || dash.total === 0) return <EmptyState titulo="Sin cotizaciones" descripcion="Aún no hay cotizaciones para analizar." />;

  const pipeline = ORDEN.filter((e) => dash.porEstado[e]).map((e) => ({ estado: e, label: ESTADO_COTIZACION[e]?.label ?? e, n: dash.porEstado[e] }));
  const aceptadas = dash.porEstado.aceptada ?? 0;
  const decididas = (dash.porEstado.aceptada ?? 0) + (dash.porEstado.rechazada ?? 0) + (dash.porEstado.vencida ?? 0);
  const conversion = decididas > 0 ? Math.round((aceptadas / decididas) * 100) : 0;
  const enProceso = (dash.porEstado.enviada ?? 0) + (dash.porEstado.en_negociacion ?? 0);
  const mes = dash.porMes.map((m) => ({ ...m, label: mescorto(m.mes) }));
  const linea = dash.porLinea.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard label="Cotizaciones" value={dash.total} icon={<FileText />} />
        <KpiCard label="En proceso" value={enProceso} icon={<Send />} tone="default" />
        <KpiCard label="Aceptadas" value={aceptadas} icon={<CheckCircle2 />} tone="success" />
        <KpiCard label="Conversión" value={`${conversion}%`} icon={<Percent />} tone={conversion >= 50 ? 'success' : 'warning'} />
        <KpiCard label="Monto ganado" value={fmtMoney(dash.montoGanado)} icon={<Trophy />} tone="azur" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-base">Pipeline por estado</CardTitle><p className="text-xs text-muted-foreground">Cotizaciones en cada etapa.</p></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                  <XAxis type="number" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" fontSize={11} width={96} />
                  <Tooltip formatter={(v: number) => [`${v} cotización(es)`, 'Cantidad']} />
                  <Bar dataKey="n" radius={[0, 4, 4, 0]} barSize={18}>
                    {pipeline.map((p) => <Cell key={p.estado} fill={ESTADO_COLOR[p.estado] ?? '#94a3b8'} />)}
                    <LabelList dataKey="n" position="right" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1"><CardTitle className="text-base">Por línea de negocio</CardTitle><p className="text-xs text-muted-foreground">Cantidad de cotizaciones por línea.</p></CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={linea} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                  <XAxis type="number" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="nombre" fontSize={11} width={110} />
                  <Tooltip formatter={(v: number) => [`${v} cotización(es)`, 'Cantidad']} />
                  <Bar dataKey="n" radius={[0, 4, 4, 0]} barSize={18} fill="#E20627"><LabelList dataKey="n" position="right" fontSize={11} /></Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-1"><CardTitle className="text-base">Evolución mensual</CardTitle><p className="text-xs text-muted-foreground">Cotizaciones <span className="text-azur-600">creadas</span> vs <span className="text-emerald-600">aceptadas</span> por mes.</p></CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mes} margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} width={32} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="creadas" name="Creadas" stroke="#E20627" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="aceptadas" name="Aceptadas" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
