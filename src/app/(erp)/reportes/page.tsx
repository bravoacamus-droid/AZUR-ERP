import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { TIPO_SOLICITUD_LABEL } from '@/lib/estados';
import { saludGlobal, type DashboardProyecto } from '@/lib/salud';
import { ReportesClient } from './reportes-client';

export const dynamic = 'force-dynamic';

const CATEGORIAS = ['contratistas', 'proveedores', 'caja_chica', 'servicios', 'honorarios'] as const;

export interface ReportesData {
  filtros: { periodo: string; proyecto: string; linea: string };
  proyectosLista: { id: string; nombre: string }[];
  lineasLista: { id: string; nombre: string; color: string }[];
  kpis: { ingresos: number; egresos: number; utilidad: number; nProyectos: number };
  serie: { label: string; Ingresos: number; Egresos: number }[];
  lineas: { nombre: string; color: string; proyectado: number; pagos: number; gasto: number }[];
  categorias: { tipo: string; label: string; monto: number; proyectado: number }[];
  proyectos: { proyecto_id: string; codigo: string | null; nombre: string; proyectado: number; pagos: number; gasto: number; valorizado: number; salud: string }[];
}

function desdeDe(periodo: string): Date | null {
  const hoy = new Date();
  if (periodo === 'todo') return null;
  if (periodo === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const dias = Number(periodo) || 30;
  const d = new Date(hoy);
  d.setDate(d.getDate() - dias);
  return d;
}

export default async function ReportesPage({ searchParams }: { searchParams: { periodo?: string; proyecto?: string; linea?: string } }) {
  await requireRol(['gerencia', 'jefe_proyectos', 'administrador', 'presupuestos']);
  const supabase = createClient();

  const periodo = searchParams.periodo ?? '30';
  const proyecto = searchParams.proyecto ?? '';
  const linea = searchParams.linea ?? '';
  const desde = desdeDe(periodo);
  const desdeISO = desde ? desde.toISOString().slice(0, 10) : null;

  const [{ data: dashRaw }, { data: lineasRaw }, { data: proyRaw }] = await Promise.all([
    supabase.from('v_dashboard_proyecto').select('*'),
    supabase.from('lineas_negocio').select('id, nombre, color').order('nombre'),
    supabase.from('proyectos').select('id, nombre, linea_id').order('nombre'),
  ]);

  const proyByLinea = (proyRaw ?? []).filter((p) => !linea || p.linea_id === linea);
  let proyIds: string[] | null = null;
  if (proyecto) proyIds = [proyecto];
  else if (linea) proyIds = proyByLinea.map((p) => p.id);

  let qAbonos = supabase.from('abonos_cliente').select('monto, fecha, proyecto_id');
  let qSols = supabase.from('solicitudes_pago').select('monto, tipo, pagado_at, proyecto_id, linea_id').in('status', ['pagada', 'conciliada']);
  let qPtg = supabase.from('presupuesto_tipo_gasto').select('tipo, monto_proyectado, proyecto_id');
  if (desdeISO) { qAbonos = qAbonos.gte('fecha', desdeISO); qSols = qSols.gte('pagado_at', desdeISO); }
  if (proyIds) {
    const ids = proyIds.length ? proyIds : ['00000000-0000-0000-0000-000000000000'];
    qAbonos = qAbonos.in('proyecto_id', ids); qSols = qSols.in('proyecto_id', ids); qPtg = qPtg.in('proyecto_id', ids);
  }
  const [{ data: abonos }, { data: sols }, { data: ptg }] = await Promise.all([qAbonos, qSols, qPtg]);

  const bucket = (s: string) => (periodo === 'todo' ? s.slice(0, 7) : s.slice(0, 10));
  const serieMap = new Map<string, { Ingresos: number; Egresos: number }>();
  const get = (k: string) => serieMap.get(k) ?? { Ingresos: 0, Egresos: 0 };
  (abonos ?? []).forEach((a) => { const k = bucket(a.fecha); const v = get(k); v.Ingresos += Number(a.monto); serieMap.set(k, v); });
  (sols ?? []).forEach((s) => { if (!s.pagado_at) return; const k = bucket(s.pagado_at); const v = get(k); v.Egresos += Number(s.monto); serieMap.set(k, v); });
  const serie = [...serieMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, v]) => ({ label, ...v }));

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

  const data: ReportesData = {
    filtros: { periodo, proyecto, linea },
    proyectosLista: (proyRaw ?? []).map((p) => ({ id: p.id, nombre: p.nombre })),
    lineasLista: (lineasRaw ?? []).map((l) => ({ id: l.id, nombre: l.nombre, color: l.color })),
    kpis: { ingresos, egresos, utilidad: ingresos - egresos, nProyectos: dash.length },
    serie,
    lineas: lineasResultado,
    categorias,
    proyectos: dash.map((p) => ({ proyecto_id: p.proyecto_id, codigo: p.codigo, nombre: p.nombre, proyectado: p.proyectado, pagos: p.pagos, gasto: p.gasto, valorizado: p.valorizado, salud: saludGlobal(p) })),
  };

  return <ReportesClient data={data} />;
}
