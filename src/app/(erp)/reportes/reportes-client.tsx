'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, Label, LabelList,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Wallet, HardHat, Loader2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/misc';
import { PageHeader, KpiCard } from '@/components/ui/page';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { fmtMoney } from '@/lib/format';
import { SALUD_LABEL } from '@/lib/salud';
import type { ReportesData } from './page';

const AZUR = '#E20627';
const AZUR_DARK = '#BE1723';
const SKY = '#0ea5e9';
const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const VIOLET = '#8b5cf6';
const PIE_COLORS = [AZUR, SKY, EMERALD, AMBER, VIOLET];
const kfmt = (v: number) => (v ? `S/${(Number(v) / 1000).toFixed(0)}k` : '');

const PERIODOS = [
  { v: '7', l: '7 días' }, { v: '15', l: '15 días' }, { v: '30', l: '30 días' },
  { v: 'mes', l: 'Este mes' }, { v: 'todo', l: 'Histórico' },
];

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.06 },
});

export function ReportesClient({ data }: { data: ReportesData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { filtros, proyectosLista, lineasLista, kpis, serie, lineas, categorias, proyectos } = data;

  function setFiltro(patch: Partial<typeof filtros>) {
    const next = { ...filtros, ...patch };
    const sp = new URLSearchParams();
    if (next.periodo) sp.set('periodo', next.periodo);
    if (next.proyecto) sp.set('proyecto', next.proyecto);
    if (next.linea) sp.set('linea', next.linea);
    startTransition(() => router.push(`/reportes?${sp.toString()}`));
  }

  const excelUrl = `/reportes/excel?periodo=${filtros.periodo}&proyecto=${filtros.proyecto}&linea=${filtros.linea}`;
  const saludVariant = (s: string) => (s === 'ok' ? 'success' : s === 'advertencia' ? 'warning' : 'danger');
  const catData = categorias.filter((c) => c.monto > 0).map((c) => ({ name: c.label, value: c.monto }));
  const catComp = categorias
    .filter((c) => c.monto > 0 || c.proyectado > 0)
    .map((c) => ({ name: c.label, Proyectado: c.proyectado, Real: c.monto, gap: c.proyectado - c.monto }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Reportería cruzada e interactiva: filtra por periodo, proyecto y línea."
        action={
          <a href={excelUrl}>
            <Button variant="gradient"><FileSpreadsheet /> Exportar Excel</Button>
          </a>
        }
      />

      {/* Barra de filtros */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {PERIODOS.map((p) => (
              <button
                key={p.v}
                onClick={() => setFiltro({ periodo: p.v })}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  filtros.periodo === p.v ? 'bg-azur-gradient text-white shadow-sm' : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.l}
              </button>
            ))}
            {pending && <Loader2 className="size-4 animate-spin text-azur-600" />}
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={filtros.linea} onChange={(e) => setFiltro({ linea: e.target.value, proyecto: '' })} className="w-44">
              <option value="">Todas las líneas</option>
              {lineasLista.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
            </Select>
            <Select value={filtros.proyecto} onChange={(e) => setFiltro({ proyecto: e.target.value })} className="w-52">
              <option value="">Todos los proyectos</option>
              {proyectosLista.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Ingresos del periodo', value: fmtMoney(kpis.ingresos), icon: <TrendingUp />, tone: 'success' as const },
          { label: 'Egresos del periodo', value: fmtMoney(kpis.egresos), icon: <TrendingDown />, tone: 'azur' as const },
          { label: 'Flujo neto', value: fmtMoney(kpis.utilidad), icon: <Wallet />, tone: kpis.utilidad >= 0 ? ('success' as const) : ('warning' as const) },
          { label: 'Proyectos', value: kpis.nProyectos, icon: <HardHat />, tone: 'default' as const },
        ].map((k, i) => (
          <motion.div key={k.label} {...fade(i)}>
            <KpiCard label={k.label} value={k.value} icon={k.icon} tone={k.tone} />
          </motion.div>
        ))}
      </div>

      {/* Serie temporal ingresos vs egresos */}
      <motion.div {...fade(0)}>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Ingresos vs. egresos en el tiempo</CardTitle></CardHeader>
          <CardContent>
            {serie.length === 0 ? <EmptyState titulo="Sin movimientos en el periodo" /> : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={serie} margin={{ top: 8, right: 16, left: 16, bottom: 24 }}>
                    <defs>
                      <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={EMERALD} stopOpacity={0.4} /><stop offset="95%" stopColor={EMERALD} stopOpacity={0} /></linearGradient>
                      <linearGradient id="gEgr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={AZUR} stopOpacity={0.4} /><stop offset="95%" stopColor={AZUR} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="label" fontSize={11} height={42}>
                      <Label value="Fecha" position="insideBottom" offset={-2} style={{ fontSize: 11, fill: '#64748b' }} />
                    </XAxis>
                    <YAxis fontSize={11} width={62} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`}>
                      <Label value="Monto (S/)" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fontSize: 11, fill: '#64748b' }} />
                    </YAxis>
                    <Tooltip formatter={(v: number) => fmtMoney(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="Ingresos" stroke={EMERALD} strokeWidth={2} fill="url(#gIng)" />
                    <Area type="monotone" dataKey="Egresos" stroke={AZUR} strokeWidth={2} fill="url(#gEgr)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Resultados por línea */}
        <motion.div {...fade(1)}>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Resultados por línea de negocio</CardTitle></CardHeader>
            <CardContent>
              {lineas.length === 0 ? <EmptyState titulo="Sin datos" /> : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lineas} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="nombre" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => `S/${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => fmtMoney(v)} />
                      <Legend />
                      <Bar dataKey="proyectado" name="Proyectado" fill="#cbd5e1" radius={[4, 4, 0, 0]}><LabelList dataKey="proyectado" position="top" formatter={kfmt} style={{ fontSize: 9, fill: '#64748b' }} /></Bar>
                      <Bar dataKey="pagos" name="Cobrado" fill={SKY} radius={[4, 4, 0, 0]}><LabelList dataKey="pagos" position="top" formatter={kfmt} style={{ fontSize: 9, fill: SKY }} /></Bar>
                      <Bar dataKey="gasto" name="Gasto" fill={AZUR} radius={[4, 4, 0, 0]}><LabelList dataKey="gasto" position="top" formatter={kfmt} style={{ fontSize: 9, fill: AZUR }} /></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Gasto por categoría */}
        <motion.div {...fade(2)}>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Gasto por categoría (5 tipos)</CardTitle></CardHeader>
            <CardContent>
              {catData.length === 0 ? <EmptyState titulo="Sin gasto en el periodo" /> : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3}
                        label={(e: any) => kfmt(e.value)} labelLine={false} style={{ fontSize: 10 }}>
                        {catData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmtMoney(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Proyectado vs Real por tipo de gasto (control financiero) */}
      <motion.div {...fade(2)}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Proyectado vs Real por tipo de gasto</CardTitle>
            <p className="text-xs text-muted-foreground">Presupuesto proyectado (reparto) vs gasto real (solicitudes pagadas/conciliadas) por categoría, con el gap.</p>
          </CardHeader>
          <CardContent>
            {catComp.length === 0 ? <EmptyState titulo="Sin datos de presupuesto/gasto" /> : (
              <>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={catComp} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="name" fontSize={11} />
                      <YAxis fontSize={11} tickFormatter={(v) => `S/ ${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => fmtMoney(v)} />
                      <Legend />
                      <Bar dataKey="Proyectado" fill={SKY} radius={[4, 4, 0, 0]}><LabelList dataKey="Proyectado" position="top" formatter={kfmt} style={{ fontSize: 9, fill: SKY }} /></Bar>
                      <Bar dataKey="Real" fill={AZUR} radius={[4, 4, 0, 0]}><LabelList dataKey="Real" position="top" formatter={kfmt} style={{ fontSize: 9, fill: AZUR }} /></Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Tipo de gasto</TableHead><TableHead className="text-right">Proyectado</TableHead><TableHead className="text-right">Real</TableHead><TableHead className="text-right">Gap</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {catComp.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtMoney(c.Proyectado)}</TableCell>
                        <TableCell className="text-right tabular-nums text-azur-600">{fmtMoney(c.Real)}</TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${c.gap < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{c.gap < 0 ? '' : '+'}{fmtMoney(c.gap)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de proyectos */}
      <motion.div {...fade(3)}>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Proyectos · salud y resultados</CardTitle></CardHeader>
          <CardContent className="p-0">
            {proyectos.length === 0 ? <div className="p-6"><EmptyState titulo="Sin proyectos para el filtro" /></div> : (
              <Table>
                <TableHeader><TableRow><TableHead>Proyecto</TableHead><TableHead>Proyectado</TableHead><TableHead>Cobrado</TableHead><TableHead>Gasto</TableHead><TableHead>Valorizado</TableHead><TableHead>Salud</TableHead></TableRow></TableHeader>
                <TableBody>
                  {proyectos.map((p) => (
                    <TableRow key={p.proyecto_id}>
                      <TableCell className="font-medium">{p.nombre}</TableCell>
                      <TableCell className="tabular-nums">{fmtMoney(p.proyectado)}</TableCell>
                      <TableCell className="tabular-nums text-sky-600">{fmtMoney(p.pagos)}</TableCell>
                      <TableCell className="tabular-nums text-azur-600">{fmtMoney(p.gasto)}</TableCell>
                      <TableCell className="tabular-nums">{fmtMoney(p.valorizado)}</TableCell>
                      <TableCell><Badge variant={saludVariant(p.salud) as never}>{SALUD_LABEL[p.salud as never]}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
