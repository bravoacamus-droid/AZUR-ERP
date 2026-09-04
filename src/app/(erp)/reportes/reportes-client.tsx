'use client';

import { useRouter } from 'next/navigation';
import { useTransition, useState, Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, Label, LabelList,
} from 'recharts';
import { Download, TrendingUp, TrendingDown, Wallet, HardHat, Loader2, FileSpreadsheet, Users, Search, FileDown, Receipt, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/misc';
import { PageHeader, KpiCard } from '@/components/ui/page';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { fmtMoney, fmtPct, fmtDate } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { STATUS_SOLICITUD } from '@/lib/estados';
import { aprobarSolicitud, validarGastoCaja } from '@/app/(erp)/finanzas/actions';
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
  { v: 'sem', l: 'Semanal (12 sem)' }, { v: 'mes', l: 'Este mes' }, { v: 'todo', l: 'Histórico' },
];

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: i * 0.06 },
});

export function ReportesClient({ data }: { data: ReportesData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { filtros, proyectosLista, lineasLista, kpis, serie, lineas, categorias, proyectos, tareo, tareoTotal, pnlProyectos, pnlLineas, pnlPorMes, rol, gastosEmpresa, cajaChica } = data;
  // Filtro de fechas del listado de caja chica reportada (pedido de David).
  const [ccDesde, setCcDesde] = useState('');
  const [ccHasta, setCcHasta] = useState('');
  const [ccBusy, setCcBusy] = useState<string | null>(null);
  const ccFiltrada = cajaChica.filter((c) => (!ccDesde || c.fecha >= ccDesde) && (!ccHasta || c.fecha <= ccHasta));
  const ccTotal = ccFiltrada.reduce((a, c) => a + c.monto, 0);
  const ccPend = ccFiltrada.filter((c) => c.status === 'solicitada' || c.status === 'aprobada').length;
  const utilidadEmpresa = kpis.ingresos - kpis.egresos - gastosEmpresa.total;
  async function ccAccion(id: string, fn: (i: string) => Promise<{ ok: boolean; error?: string }>) {
    setCcBusy(id);
    const r = await fn(id);
    if (!r.ok) alert(r.error ?? 'No se pudo completar');
    setCcBusy(null);
    router.refresh();
  }
  const pnlUrl = (fmt: string) => `/reportes/pnl/${fmt}?periodo=${filtros.periodo}&proyecto=${filtros.proyecto}&linea=${filtros.linea}`;
  const gapTone = (g: number) => (g >= 0 ? 'text-emerald-600' : 'text-red-600');
  const [tareoQ, setTareoQ] = useState('');
  const [tareoExp, setTareoExp] = useState<string | null>(null);
  const tareoFiltrado = tareo.filter((t) => t.nombre.toLowerCase().includes(tareoQ.trim().toLowerCase()));
  const tareoPdfUrl = `/reportes/tareo/pdf?periodo=${filtros.periodo}&proyecto=${filtros.proyecto}&linea=${filtros.linea}`;

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

      {/* Estado de resultados (P&L): utilidad real vs cotizada */}
      <motion.div {...fade(4)}>
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base">Estado de resultados (P&amp;L) · utilidad real vs cotizada</CardTitle>
            <div className="flex gap-2">
              <a href={pnlUrl('excel')}><Button variant="outline" size="sm"><FileSpreadsheet className="size-4" /> Excel</Button></a>
              <a href={pnlUrl('pdf')} target="_blank" rel="noreferrer"><Button variant="outline" size="sm"><FileDown className="size-4" /> PDF</Button></a>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            {/* Por línea de negocio */}
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Por línea de negocio</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Línea</TableHead><TableHead className="text-right">Cobrado</TableHead><TableHead className="text-right">Gastado</TableHead>
                    <TableHead className="text-right">Utilidad real</TableHead><TableHead className="text-right">% Margen real</TableHead>
                    <TableHead className="text-right">% Margen cot.</TableHead><TableHead className="text-right">Gap</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {pnlLineas.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Sin datos para el filtro.</TableCell></TableRow>
                    ) : pnlLineas.map((l) => (
                      <TableRow key={l.linea_id}>
                        <TableCell className="font-medium">{l.nombre} <span className="text-xs text-muted-foreground">({l.nProyectos})</span></TableCell>
                        <TableCell className="text-right tabular-nums text-sky-600">{fmtMoney(l.cobrado)}</TableCell>
                        <TableCell className="text-right tabular-nums text-azur-600">{fmtMoney(l.gastado)}</TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${l.utilReal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtMoney(l.utilReal)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(l.margenRealPct)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{fmtPct(l.margenCotPct)}</TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${gapTone(l.gapPct)}`}>{l.gapPct >= 0 ? '+' : ''}{fmtPct(l.gapPct)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Por proyecto */}
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Por proyecto</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Proyecto</TableHead><TableHead className="text-right">Cobrado</TableHead><TableHead className="text-right">Gastado</TableHead>
                    <TableHead className="text-right">Utilidad real</TableHead><TableHead className="text-right">% Margen real</TableHead>
                    <TableHead className="text-right">Util. cotizada</TableHead><TableHead className="text-right">% Margen cot.</TableHead><TableHead className="text-right">Gap</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {pnlProyectos.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Sin datos para el filtro.</TableCell></TableRow>
                    ) : pnlProyectos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.nombre}</TableCell>
                        <TableCell className="text-right tabular-nums text-sky-600">{fmtMoney(p.cobrado)}</TableCell>
                        <TableCell className="text-right tabular-nums text-azur-600">{fmtMoney(p.gastado)}</TableCell>
                        <TableCell className={`text-right font-semibold tabular-nums ${p.utilReal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtMoney(p.utilReal)}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtPct(p.margenRealPct)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{fmtMoney(p.utilCotizada)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{fmtPct(p.margenCotPct)}</TableCell>
                        <TableCell className={`text-right font-medium tabular-nums ${gapTone(p.gapPct)}`}>{p.gapPct >= 0 ? '+' : ''}{fmtPct(p.gapPct)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Por línea / mes (base caja) */}
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground">Por línea / mes (base caja: cobrado − gastado)</p>
              {pnlPorMes.filas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin movimientos en el periodo seleccionado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead className="text-right">Cobrado</TableHead>
                      <TableHead className="text-right">Gastado</TableHead>
                      <TableHead className="text-right">Utilidad</TableHead>
                      {pnlPorMes.lineas.map((l) => <TableHead key={l.id} className="text-right">{l.nombre}</TableHead>)}
                    </TableRow></TableHeader>
                    <TableBody>
                      {pnlPorMes.filas.map((f) => (
                        <TableRow key={f.mes}>
                          <TableCell className="font-medium">{f.mes.slice(5, 7)}/{f.mes.slice(0, 4)}</TableCell>
                          <TableCell className="text-right tabular-nums text-sky-600">{fmtMoney(f.cobrado)}</TableCell>
                          <TableCell className="text-right tabular-nums text-azur-600">{fmtMoney(f.gastado)}</TableCell>
                          <TableCell className={`text-right font-semibold tabular-nums ${f.utilidad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtMoney(f.utilidad)}</TableCell>
                          {pnlPorMes.lineas.map((l) => (
                            <TableCell key={l.id} className={`text-right tabular-nums ${(f.porLinea[l.id] ?? 0) >= 0 ? '' : 'text-red-600'}`}>{fmtMoney(f.porLinea[l.id] ?? 0)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                      <TableRow className="border-t-2 border-azur-600/40 font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right tabular-nums text-sky-600">{fmtMoney(pnlPorMes.total.cobrado)}</TableCell>
                        <TableCell className="text-right tabular-nums text-azur-600">{fmtMoney(pnlPorMes.total.gastado)}</TableCell>
                        <TableCell className={`text-right tabular-nums ${pnlPorMes.total.utilidad >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtMoney(pnlPorMes.total.utilidad)}</TableCell>
                        {pnlPorMes.lineas.map((l) => <TableCell key={l.id} className="text-right tabular-nums">{fmtMoney(pnlPorMes.total.porLinea[l.id] ?? 0)}</TableCell>)}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">Las columnas por línea muestran la utilidad del mes (cobrado − gastado) de esa línea. Respeta el filtro de periodo.</p>
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <strong>Cómo se calcula:</strong> Utilidad real = Cobrado − Gastado (flujo de caja del proyecto, acumulado a la fecha).
              Margen cotizado = (GG + GA + Utilidad) / (1 + GG + GA + Utilidad) sobre el contrato neto de IGV. Utilidad cotizada = contrato neto × margen cotizado (proyectada a fin de obra).
              Gap = margen real − margen cotizado. Los importes son acumulados del proyecto, no del periodo.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tareo consolidado (todos los proyectos) */}
      <motion.div {...fade(5)}>
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="flex items-center gap-2 text-base"><Users className="size-4 text-azur-600" /> Tareo consolidado <Badge variant="info">{fmtMoney(tareoTotal)}</Badge></CardTitle>
            <a href={tareoPdfUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm"><FileDown className="size-4" /> PDF</Button>
            </a>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-4 pb-2">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={tareoQ} onChange={(e) => setTareoQ(e.target.value)} placeholder="Buscar trabajador…" className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm" />
              </div>
            </div>
            {tareoFiltrado.length === 0 ? (
              <div className="p-6"><EmptyState titulo="Sin tareo en el filtro" descripcion="Aparece el tareo aprobado/pagado del periodo, en todos los proyectos." /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Trabajador</TableHead><TableHead className="text-right">Días</TableHead><TableHead className="text-right">Horas</TableHead>
                    <TableHead className="text-right">Extra</TableHead><TableHead className="text-right">Monto</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {tareoFiltrado.map((t, i) => (
                      <Fragment key={i}>
                        <TableRow>
                          <TableCell>
                            <button className="text-left font-medium hover:text-azur-600" onClick={() => setTareoExp(tareoExp === t.nombre ? null : t.nombre)}>{t.nombre}</button>
                            {t.proyectos.length > 1 && <span className="ml-1 text-xs text-muted-foreground">({t.proyectos.length} proyectos)</span>}
                            {t.correcciones > 0 && <Badge variant="warning" className="ml-1.5 text-[10px]">+{t.correcciones} corr.</Badge>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{t.dias}</TableCell>
                          <TableCell className="text-right tabular-nums">{t.horas}</TableCell>
                          <TableCell className="text-right tabular-nums text-amber-600">{t.extra || '—'}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{fmtMoney(t.monto)}</TableCell>
                        </TableRow>
                        {tareoExp === t.nombre && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-muted/30">
                              <div className="space-y-1 py-1">
                                {t.proyectos.map((p, j) => (
                                  <div key={j} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">{p.nombre}</span>
                                    <span className="tabular-nums">{p.dias} día(s) · {p.horas} h · <strong>{fmtMoney(p.monto)}</strong></span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Gastos de empresa (EEFF) — no pasan por el flujo de obra */}
      <motion.div {...fade(9)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Receipt className="size-4 text-azur-600" /> Gastos de empresa (EEFF)</span>
              <span className="text-sm font-normal text-muted-foreground">Planilla, publicidad, impuestos, gastos financieros… del periodo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Gastos de empresa</p>
                <p className="text-lg font-semibold tabular-nums text-azur-600">{fmtMoney(gastosEmpresa.total)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Sin línea (general)</p>
                <p className="text-lg font-semibold tabular-nums">{fmtMoney(gastosEmpresa.sinLinea)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Utilidad de empresa (ingresos − obra − empresa)</p>
                <p className={utilidadEmpresa >= 0 ? 'text-lg font-semibold tabular-nums text-emerald-600' : 'text-lg font-semibold tabular-nums text-red-600'}>{fmtMoney(utilidadEmpresa)}</p>
              </div>
            </div>

            {gastosEmpresa.porLinea.length > 0 && (
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Por línea de negocio</p>
                <div className="flex flex-wrap gap-3">
                  {gastosEmpresa.porLinea.map((l) => (
                    <span key={l.id} className="flex items-center gap-2 text-sm">
                      <span className="inline-block size-3 rounded-full" style={{ background: l.color }} />
                      {l.nombre}: <strong className="tabular-nums">{fmtMoney(l.monto)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {gastosEmpresa.filas.length === 0 ? (
              <EmptyState icon={<Receipt className="size-8" />} titulo="Sin gastos de empresa en el periodo" descripcion="Administración los registra en Finanzas → Gastos de empresa." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead><TableHead>Categoría</TableHead><TableHead>Descripción</TableHead>
                      <TableHead>Proyecto</TableHead><TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gastosEmpresa.filas.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="tabular-nums">{fmtDate(g.fecha)}</TableCell>
                        <TableCell>{g.categoria ? <Badge variant="muted">{g.categoria}</Badge> : '—'}</TableCell>
                        <TableCell className="text-sm">{g.descripcion ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{g.proyecto ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmtMoney(g.monto)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell colSpan={4} className="text-right">Total</TableCell>
                      <TableCell className="text-right tabular-nums text-azur-600">{fmtMoney(gastosEmpresa.total)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Caja chica reportada — listado por fechas para aprobar rápido */}
      <motion.div {...fade(10)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2"><Wallet className="size-4 text-azur-600" /> Caja chica reportada</span>
              <span className="text-sm font-normal text-muted-foreground">
                {ccFiltrada.length} gasto(s) · {fmtMoney(ccTotal)}{ccPend ? ' · ' + ccPend + ' por revisar' : ''}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Desde</p>
                <Input type="date" value={ccDesde} onChange={(e) => setCcDesde(e.target.value)} className="w-40" />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Hasta</p>
                <Input type="date" value={ccHasta} onChange={(e) => setCcHasta(e.target.value)} className="w-40" />
              </div>
              {(ccDesde || ccHasta) && <Button size="sm" variant="ghost" onClick={() => { setCcDesde(''); setCcHasta(''); }}>Limpiar</Button>}
              <a href={'/reportes/caja-chica/excel?desde=' + ccDesde + '&hasta=' + ccHasta} className="ml-auto">
                <Button size="sm" variant="outline"><FileSpreadsheet className="size-4" /> Excel</Button>
              </a>
            </div>

            {ccFiltrada.length === 0 ? (
              <EmptyState icon={<Wallet className="size-8" />} titulo="Sin gastos de caja chica" descripcion="Aquí aparecen los gastos ya pagados desde caja chica, para revisarlos y aprobarlos rápido." />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead><TableHead>Código</TableHead><TableHead>Proyecto</TableHead>
                      <TableHead>Detalle</TableHead><TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead><TableHead>Sustento</TableHead><TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ccFiltrada.map((c) => {
                      const st = STATUS_SOLICITUD[c.status] ?? { label: c.status, variant: 'muted' as const };
                      const puedeAprobarCc = c.status === 'solicitada' && (rol === 'jefe_proyectos' || rol === 'gerencia');
                      const puedeValidarCc = c.status === 'aprobada' && (rol === 'administrador' || rol === 'gerencia');
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="tabular-nums">{fmtDate(c.fecha)}</TableCell>
                          <TableCell className="font-medium">{c.codigo ?? '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{c.proyecto ?? '—'}</TableCell>
                          <TableCell className="text-sm">{c.descripcion || c.beneficiario || '—'}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmtMoney(c.monto)}</TableCell>
                          <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                          <TableCell>{c.sustento_url ? <a href={c.sustento_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-azur-600 hover:underline"><FileText className="size-3.5" /> Ver</a> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {puedeAprobarCc && <Button size="sm" variant="outline" disabled={ccBusy === c.id} onClick={() => ccAccion(c.id, aprobarSolicitud)}><CheckCircle2 className="size-3.5" /> Aprobar</Button>}
                              {puedeValidarCc && <Button size="sm" variant="gradient" disabled={ccBusy === c.id} onClick={() => ccAccion(c.id, validarGastoCaja)}><CheckCircle2 className="size-3.5" /> Validar sustento</Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/40 font-semibold">
                      <TableCell colSpan={4} className="text-right">Total del periodo</TableCell>
                      <TableCell className="text-right tabular-nums text-azur-600">{fmtMoney(ccTotal)}</TableCell>
                      <TableCell colSpan={3} />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
