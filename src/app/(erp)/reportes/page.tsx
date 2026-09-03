import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { TIPO_SOLICITUD_LABEL } from '@/lib/estados';
import { saludGlobal, type DashboardProyecto } from '@/lib/salud';
import { montoDia } from '@/lib/tareo';
import { pnlProyecto, agruparPnlPorLinea, pnlMensual, type PnlRow, type PnlLinea, type PnlMensual } from '@/lib/pnl';
import { ReportesClient } from './reportes-client';

export const dynamic = 'force-dynamic';

const CATEGORIAS = ['contratistas', 'proveedores', 'caja_chica', 'servicios', 'honorarios', 'otros_gastos'] as const;

export interface ReportesData {
  filtros: { periodo: string; proyecto: string; linea: string };
  proyectosLista: { id: string; nombre: string }[];
  lineasLista: { id: string; nombre: string; color: string }[];
  kpis: { ingresos: number; egresos: number; utilidad: number; nProyectos: number };
  serie: { label: string; Ingresos: number; Egresos: number }[];
  lineas: { nombre: string; color: string; proyectado: number; pagos: number; gasto: number }[];
  categorias: { tipo: string; label: string; monto: number; proyectado: number }[];
  proyectos: { proyecto_id: string; codigo: string | null; nombre: string; proyectado: number; pagos: number; gasto: number; valorizado: number; salud: string }[];
  tareo: { nombre: string; dias: number; horas: number; extra: number; monto: number; correcciones: number; proyectos: { nombre: string; dias: number; horas: number; monto: number }[] }[];
  tareoTotal: number;
  pnlProyectos: PnlRow[];
  pnlLineas: PnlLinea[];
  pnlPorMes: PnlMensual;
  rol: string;
  // Gastos de empresa (EEFF): no pasan por el flujo de obra.
  gastosEmpresa: {
    total: number;
    sinLinea: number;
    porLinea: { id: string; nombre: string; color: string; monto: number }[];
    filas: { id: string; fecha: string; categoria: string | null; descripcion: string | null; monto: number; proyecto: string | null }[];
  };
  // "Caja chica reportada": gastos ya pagados de caja chica, para revisarlos/aprobarlos rápido.
  cajaChica: { id: string; codigo: string | null; fecha: string; monto: number; status: string; sustento_url: string | null; beneficiario: string | null; descripcion: string | null; proyecto: string | null }[];
}

function desdeDe(periodo: string): Date | null {
  const hoy = new Date();
  if (periodo === 'todo') return null;
  if (periodo === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  if (periodo === 'sem') { const d = new Date(hoy); d.setDate(d.getDate() - 84); return d; } // 12 semanas
  const dias = Number(periodo) || 30;
  const d = new Date(hoy);
  d.setDate(d.getDate() - dias);
  return d;
}

export default async function ReportesPage({ searchParams }: { searchParams: { periodo?: string; proyecto?: string; linea?: string } }) {
  const session = await requireModulo('reportes', 'ver');
  const supabase = createClient();

  const periodo = searchParams.periodo ?? '30';
  const proyecto = searchParams.proyecto ?? '';
  const linea = searchParams.linea ?? '';
  const desde = desdeDe(periodo);
  const desdeISO = desde ? desde.toISOString().slice(0, 10) : null;

  const [{ data: dashRaw }, { data: lineasRaw }, { data: proyRaw }] = await Promise.all([
    supabase.from('v_dashboard_proyecto').select('*'),
    supabase.from('lineas_negocio').select('id, nombre, color').order('nombre'),
    supabase.from('proyectos').select('id, nombre, linea_id, gg_pct, ga_pct, utilidad_pct, igv_pct').order('nombre'),
  ]);

  const proyByLinea = (proyRaw ?? []).filter((p) => !linea || p.linea_id === linea);
  let proyIds: string[] | null = null;
  if (proyecto) proyIds = [proyecto];
  else if (linea) proyIds = proyByLinea.map((p) => p.id);

  let qAbonos = supabase.from('abonos_cliente').select('monto, fecha, proyecto_id');
  // Caja chica es un pedido, no gasto del proyecto → se excluye de egresos.
  let qSols = supabase.from('solicitudes_pago').select('monto, tipo, pagado_at, proyecto_id, linea_id').in('status', ['pagada', 'conciliada']).neq('tipo', 'caja_chica');
  let qPtg = supabase.from('presupuesto_tipo_gasto').select('tipo, monto_proyectado, proyecto_id');
  // Tareo consolidado (todos los proyectos): jornales aprobados/pagados del periodo.
  let qTareo = (supabase as unknown as { from: (t: string) => any }).from('tareo')
    .select('trabajador_id, trabajador_nombre, presente, horas, horas_extra, jornal_semana, fecha, es_correccion, proyecto:proyectos(nombre)')
    .in('estado', ['aprobado', 'pagado']);
  if (desdeISO) { qAbonos = qAbonos.gte('fecha', desdeISO); qSols = qSols.gte('pagado_at', desdeISO); qTareo = qTareo.gte('fecha', desdeISO); }
  if (proyIds) {
    const ids = proyIds.length ? proyIds : ['00000000-0000-0000-0000-000000000000'];
    qAbonos = qAbonos.in('proyecto_id', ids); qSols = qSols.in('proyecto_id', ids); qPtg = qPtg.in('proyecto_id', ids); qTareo = qTareo.in('proyecto_id', ids);
  }
  const [{ data: abonos }, { data: sols }, { data: ptg }, { data: tareoRows }] = await Promise.all([qAbonos, qSols, qPtg, qTareo]);

  // Consolidación de tareo por trabajador (con desglose por proyecto).
  const tareoMap = new Map<string, any>();
  (tareoRows ?? []).forEach((r: any) => {
    if (!r.presente) return;
    const key = r.trabajador_id || `n:${r.trabajador_nombre}`;
    const h = Number(r.horas ?? 0), e = Number(r.horas_extra ?? 0);
    const monto = montoDia(Number(r.jornal_semana ?? 0), h, e);
    const t = tareoMap.get(key) ?? { nombre: r.trabajador_nombre, dias: 0, horas: 0, extra: 0, monto: 0, correcciones: 0, proyectos: new Map<string, any>() };
    t.dias += 1; t.horas += h; t.extra += e; t.monto += monto; if (r.es_correccion) t.correcciones += 1;
    const pn = r.proyecto?.nombre ?? 'Proyecto';
    const pr = t.proyectos.get(pn) ?? { nombre: pn, dias: 0, horas: 0, monto: 0 };
    pr.dias += 1; pr.horas += h; pr.monto += monto; t.proyectos.set(pn, pr);
    tareoMap.set(key, t);
  });
  const tareo = [...tareoMap.values()].map((t) => ({ ...t, proyectos: [...t.proyectos.values()] })).sort((a, b) => b.monto - a.monto);
  const tareoTotal = tareo.reduce((a, t) => a + t.monto, 0);

  // lunes de la semana de una fecha (para el bucket semanal, #10)
  const lunesDe = (s: string) => { const d = new Date(s.slice(0, 10) + 'T00:00:00'); const g = d.getDay(); d.setDate(d.getDate() + (g === 0 ? -6 : 1 - g)); return d.toISOString().slice(0, 10); };
  const bucket = (s: string) => (periodo === 'todo' ? s.slice(0, 7) : periodo === 'sem' ? lunesDe(s) : s.slice(0, 10));
  const serieMap = new Map<string, { Ingresos: number; Egresos: number }>();
  const get = (k: string) => serieMap.get(k) ?? { Ingresos: 0, Egresos: 0 };
  (abonos ?? []).forEach((a) => { const k = bucket(a.fecha); const v = get(k); v.Ingresos += Number(a.monto); serieMap.set(k, v); });
  (sols ?? []).forEach((s) => { if (!s.pagado_at) return; const k = bucket(s.pagado_at); const v = get(k); v.Egresos += Number(s.monto); serieMap.set(k, v); });
  const fmtLbl = (k: string) => (periodo === 'sem' ? `Sem ${k.slice(8, 10)}/${k.slice(5, 7)}` : k);
  const serie = [...serieMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, v]) => ({ label: fmtLbl(label), ...v }));

  const ingresos = (abonos ?? []).reduce((a, r) => a + Number(r.monto), 0);
  const egresos = (sols ?? []).reduce((a, r) => a + Number(r.monto), 0);

  const acc = new Map<string, number>();
  (sols ?? []).forEach((s) => acc.set(s.tipo, (acc.get(s.tipo) ?? 0) + Number(s.monto)));
  const proyAcc = new Map<string, number>();
  (ptg ?? []).forEach((p) => proyAcc.set(p.tipo, (proyAcc.get(p.tipo) ?? 0) + Number(p.monto_proyectado)));
  const categorias = CATEGORIAS.map((tipo) => ({ tipo, label: TIPO_SOLICITUD_LABEL[tipo] ?? tipo, monto: acc.get(tipo) ?? 0, proyectado: proyAcc.get(tipo) ?? 0 }));

  const dash: DashboardProyecto[] = (dashRaw ?? [])
    .map((d) => ({
      proyecto_id: d.proyecto_id ?? '', codigo: d.codigo, nombre: d.nombre ?? 'Sin nombre', linea_id: d.linea_id,
      estado: d.estado ?? '', tipo_proyecto: d.tipo_proyecto ?? '',
      proyectado: Number(d.proyectado ?? 0), pagos: Number(d.pagos ?? 0), gasto: Number(d.gasto ?? 0), valorizado: Number(d.valorizado ?? 0),
    }))
    .filter((d) => (!proyecto || d.proyecto_id === proyecto) && (!linea || d.linea_id === linea));

  const lineasResultado = (lineasRaw ?? [])
    .map((l) => {
      const de = dash.filter((p) => p.linea_id === l.id);
      return { nombre: l.nombre, color: l.color, proyectado: de.reduce((a, p) => a + p.proyectado, 0), pagos: de.reduce((a, p) => a + p.pagos, 0), gasto: de.reduce((a, p) => a + p.gasto, 0) };
    })
    .filter((l) => l.proyectado || l.pagos || l.gasto);

  // Estado de resultados (P&L): utilidad real (cobrado − gastado) vs cotizada, acumulado.
  const margenMap = new Map((proyRaw ?? []).map((p) => [p.id, p]));
  const pnlProyectos: PnlRow[] = dash.map((d) => pnlProyecto(
    { proyecto_id: d.proyecto_id, codigo: d.codigo, nombre: d.nombre, linea_id: d.linea_id, proyectado: d.proyectado, pagos: d.pagos, gasto: d.gasto },
    margenMap.get(d.proyecto_id),
  )).sort((a, b) => b.cobrado - a.cobrado);
  const pnlLineas: PnlLinea[] = agruparPnlPorLinea(pnlProyectos, (lineasRaw ?? []).map((l) => ({ id: l.id, nombre: l.nombre, color: l.color })));

  // Estado de resultados por línea/mes (base caja: cobrado − gastado del mes).
  const proyLinea = new Map<string, string | null>((proyRaw ?? []).map((p) => [p.id, p.linea_id]));
  const pnlPorMes: PnlMensual = pnlMensual(abonos ?? [], (sols ?? []).map((s) => ({ monto: s.monto, pagado_at: s.pagado_at, proyecto_id: s.proyecto_id, linea_id: s.linea_id })), proyLinea, (lineasRaw ?? []).map((l) => ({ id: l.id, nombre: l.nombre })));

  // ── Gastos de empresa (EEFF) y caja chica reportada ───────────────────
  const sbAny = supabase as unknown as { from: (t: string) => any };
  let qGastosEmp = sbAny.from('gastos_empresa')
    .select('id, fecha, categoria, descripcion, monto, linea_id, proyecto_id, proyecto:proyectos(nombre)');
  if (desdeISO) qGastosEmp = qGastosEmp.gte('fecha', desdeISO);
  if (linea) qGastosEmp = qGastosEmp.eq('linea_id', linea);
  if (proyecto) qGastosEmp = qGastosEmp.eq('proyecto_id', proyecto);

  const [gastosEmpRes, cajaChicaRes] = await Promise.all([
    qGastosEmp.order('fecha', { ascending: false }),
    sbAny.from('solicitudes_pago')
      .select('id, codigo, created_at, monto, status, sustento_url, beneficiario_nombre, descripcion, proyecto:proyectos(nombre)')
      .eq('pagado_caja_chica', true).order('created_at', { ascending: false }),
  ]);

  const gastosEmpRaw = (gastosEmpRes.data ?? []) as any[];
  const gastosPorLinea = new Map<string, number>();
  let gastosSinLinea = 0;
  gastosEmpRaw.forEach((g) => {
    const m = Number(g.monto ?? 0);
    if (g.linea_id) gastosPorLinea.set(g.linea_id, (gastosPorLinea.get(g.linea_id) ?? 0) + m);
    else gastosSinLinea += m;
  });
  const gastosEmpresa = {
    total: gastosEmpRaw.reduce((a, g) => a + Number(g.monto ?? 0), 0),
    sinLinea: gastosSinLinea,
    porLinea: (lineasRaw ?? [])
      .map((l) => ({ id: l.id, nombre: l.nombre, color: l.color, monto: gastosPorLinea.get(l.id) ?? 0 }))
      .filter((l) => l.monto > 0),
    filas: gastosEmpRaw.map((g) => ({
      id: g.id, fecha: g.fecha, categoria: g.categoria ?? null, descripcion: g.descripcion ?? null,
      monto: Number(g.monto ?? 0), proyecto: g.proyecto?.nombre ?? null,
    })),
  };

  const cajaChica = ((cajaChicaRes.data ?? []) as any[]).map((c) => ({
    id: c.id, codigo: c.codigo ?? null, fecha: String(c.created_at).slice(0, 10), monto: Number(c.monto ?? 0),
    status: c.status, sustento_url: c.sustento_url ?? null, beneficiario: c.beneficiario_nombre ?? null,
    descripcion: c.descripcion ?? null, proyecto: c.proyecto?.nombre ?? null,
  }));

  const data: ReportesData = {
    filtros: { periodo, proyecto, linea },
    proyectosLista: (proyRaw ?? []).map((p) => ({ id: p.id, nombre: p.nombre })),
    lineasLista: (lineasRaw ?? []).map((l) => ({ id: l.id, nombre: l.nombre, color: l.color })),
    kpis: { ingresos, egresos, utilidad: ingresos - egresos, nProyectos: dash.length },
    serie,
    lineas: lineasResultado,
    categorias,
    proyectos: dash.map((p) => ({ proyecto_id: p.proyecto_id, codigo: p.codigo, nombre: p.nombre, proyectado: p.proyectado, pagos: p.pagos, gasto: p.gasto, valorizado: p.valorizado, salud: saludGlobal(p) })),
    tareo,
    tareoTotal,
    pnlProyectos,
    pnlLineas,
    pnlPorMes,
    rol: session.rol,
    gastosEmpresa,
    cajaChica,
  };

  return <ReportesClient data={data} />;
}
