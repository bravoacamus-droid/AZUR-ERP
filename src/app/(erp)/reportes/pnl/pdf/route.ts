import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { fmtMoney, fmtPct } from '@/lib/format';
import { pnlProyecto, agruparPnlPorLinea, pnlMensual, type PnlRow } from '@/lib/pnl';
import { PnlPDF, type PnlPdfData } from './pnl-pdf';

export const runtime = 'nodejs';

const desdeDe = (periodo: string): string | null => {
  const hoy = new Date();
  if (periodo === 'todo') return null;
  if (periodo === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const d = new Date(hoy); d.setDate(d.getDate() - (periodo === 'sem' ? 84 : Number(periodo) || 30));
  return d.toISOString().slice(0, 10);
};

export async function GET(req: Request) {
  await requireModulo('reportes', 'ver');
  const supabase = createClient() as any;
  const url = new URL(req.url);
  const periodo = url.searchParams.get('periodo') || '30';
  const proyecto = url.searchParams.get('proyecto') || '';
  const linea = url.searchParams.get('linea') || '';
  const dl = url.searchParams.get('dl') === '1';
  const desdeISO = desdeDe(periodo);

  const [{ data: dashRaw }, { data: proyRaw }, { data: lineasRaw }] = await Promise.all([
    supabase.from('v_dashboard_proyecto').select('proyecto_id, codigo, nombre, linea_id, proyectado, pagos, gasto'),
    supabase.from('proyectos').select('id, linea_id, gg_pct, ga_pct, utilidad_pct, igv_pct'),
    supabase.from('lineas_negocio').select('id, nombre, color').order('nombre'),
  ]);

  // Abonos/solicitudes para el estado de resultados por mes (respeta periodo/alcance).
  let proyIds: string[] | null = null;
  if (proyecto) proyIds = [proyecto];
  else if (linea) proyIds = (proyRaw ?? []).filter((p: any) => p.linea_id === linea).map((p: any) => p.id);
  let qAb = supabase.from('abonos_cliente').select('monto, fecha, proyecto_id');
  let qSo = supabase.from('solicitudes_pago').select('monto, pagado_at, proyecto_id, linea_id').in('status', ['pagada', 'conciliada']);
  if (desdeISO) { qAb = qAb.gte('fecha', desdeISO); qSo = qSo.gte('pagado_at', desdeISO); }
  if (proyIds) { const ids = proyIds.length ? proyIds : ['00000000-0000-0000-0000-000000000000']; qAb = qAb.in('proyecto_id', ids); qSo = qSo.in('proyecto_id', ids); }
  const [{ data: abonos }, { data: sols }] = await Promise.all([qAb, qSo]);

  let alcance = 'Todos los proyectos';
  const dash = (dashRaw ?? []).filter((d: any) => (!proyecto || d.proyecto_id === proyecto) && (!linea || d.linea_id === linea));
  if (proyecto) alcance = dash[0]?.nombre ?? 'Proyecto';
  else if (linea) alcance = `Línea: ${(lineasRaw ?? []).find((l: any) => l.id === linea)?.nombre ?? ''}`;

  const margenMap = new Map<string, any>((proyRaw ?? []).map((p: any) => [p.id, p]));
  const proyectos: PnlRow[] = dash
    .map((d: any) => pnlProyecto(d, margenMap.get(d.proyecto_id)))
    .sort((a: PnlRow, b: PnlRow) => b.cobrado - a.cobrado);
  const lineas = agruparPnlPorLinea(proyectos, (lineasRaw ?? []).map((l: any) => ({ id: l.id, nombre: l.nombre, color: l.color })));
  const proyLinea = new Map<string, string | null>((proyRaw ?? []).map((p: any) => [p.id, p.linea_id]));
  const mensual = pnlMensual(abonos ?? [], sols ?? [], proyLinea, (lineasRaw ?? []).map((l: any) => ({ id: l.id, nombre: l.nombre })));

  // ── Gastos de empresa (EEFF): mismo alcance/periodo que el resto ──
  let qGE = supabase.from('gastos_empresa')
    .select('id, fecha, categoria, descripcion, monto, linea_id, proyecto_id, proyecto:proyectos(nombre)');
  if (desdeISO) qGE = qGE.gte('fecha', desdeISO);
  if (linea) qGE = qGE.eq('linea_id', linea);
  if (proyecto) qGE = qGE.eq('proyecto_id', proyecto);
  const { data: geRaw } = await qGE.order('fecha', { ascending: false });

  const ge = (geRaw ?? []) as any[];
  const gePorLinea = new Map<string, number>();
  let geSinLinea = 0;
  ge.forEach((g) => {
    const m = Number(g.monto ?? 0);
    if (g.linea_id) gePorLinea.set(g.linea_id, (gePorLinea.get(g.linea_id) ?? 0) + m);
    else geSinLinea += m;
  });
  const geTotal = ge.reduce((a, g) => a + Number(g.monto ?? 0), 0);
  const ingresos = proyectos.reduce((a: number, r: PnlRow) => a + r.cobrado, 0);
  const egresosObra = proyectos.reduce((a: number, r: PnlRow) => a + r.gastado, 0);

  const gastosEmpresa = {
    total: geTotal,
    sinLinea: geSinLinea,
    ingresos,
    egresosObra,
    utilidadEmpresa: ingresos - egresosObra - geTotal,
    porLinea: (lineasRaw ?? [])
      .map((l: any) => ({ id: l.id, nombre: l.nombre, monto: gePorLinea.get(l.id) ?? 0 }))
      .filter((l: any) => l.monto > 0),
    filas: ge.map((g) => ({
      id: g.id, fecha: String(g.fecha).slice(0, 10), categoria: g.categoria ?? null,
      descripcion: g.descripcion ?? null, proyecto: g.proyecto?.nombre ?? null, monto: Number(g.monto ?? 0),
    })),
  };

  const d: PnlPdfData = { periodo: 'Acumulado a la fecha', alcance, lineas, proyectos, mensual, gastosEmpresa, fmtMoney: (n) => fmtMoney(n), fmtPct: (n) => fmtPct(n) };
  const buffer = await renderToBuffer(createElement(PnlPDF as never, { d }) as never);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${dl ? 'attachment' : 'inline'}; filename="Estado-resultados.pdf"`,
    },
  });
}
