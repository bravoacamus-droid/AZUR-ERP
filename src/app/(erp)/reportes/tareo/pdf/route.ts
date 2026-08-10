import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { fmtDate, fmtMoney } from '@/lib/format';
import { montoDia } from '@/lib/tareo';
import { TareoConsolidadoPDF, type TareoConsData, type TareoConsFila } from './tareo-consolidado-pdf';

export const runtime = 'nodejs';

const PERIODO_LBL: Record<string, string> = { '7': 'Últimos 7 días', '30': 'Últimos 30 días', '90': 'Últimos 90 días', mes: 'Mes actual', sem: 'Últimas 12 semanas', todo: 'Histórico' };
function desdeDe(periodo: string): Date | null {
  const hoy = new Date();
  if (periodo === 'todo') return null;
  if (periodo === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  if (periodo === 'sem') { const d = new Date(hoy); d.setDate(d.getDate() - 84); return d; }
  const dias = Number(periodo) || 30; const d = new Date(hoy); d.setDate(d.getDate() - dias); return d;
}

export async function GET(req: Request) {
  await requireModulo('reportes', 'ver');
  const supabase = createClient() as any;
  const url = new URL(req.url);
  const periodo = url.searchParams.get('periodo') || '30';
  const proyecto = url.searchParams.get('proyecto') || '';
  const linea = url.searchParams.get('linea') || '';
  const dl = url.searchParams.get('dl') === '1';
  const desde = desdeDe(periodo);
  const desdeISO = desde ? desde.toISOString().slice(0, 10) : null;

  // Alcance por proyecto/línea (mismo criterio que la Reportería).
  let proyIds: string[] | null = null;
  let alcance = 'Todos los proyectos';
  if (proyecto) {
    proyIds = [proyecto];
    const { data: p } = await supabase.from('proyectos').select('nombre').eq('id', proyecto).single();
    alcance = p?.nombre ?? 'Proyecto';
  } else if (linea) {
    const { data: ps } = await supabase.from('proyectos').select('id').eq('linea_id', linea);
    proyIds = (ps ?? []).map((x: any) => x.id);
    const { data: l } = await supabase.from('lineas_negocio').select('nombre').eq('id', linea).single();
    alcance = l?.nombre ? `Línea: ${l.nombre}` : 'Línea';
  }

  let q = supabase.from('tareo')
    .select('trabajador_id, trabajador_nombre, presente, horas, horas_extra, jornal_semana, fecha, es_correccion, proyecto_id')
    .in('estado', ['aprobado', 'pagado']);
  if (desdeISO) q = q.gte('fecha', desdeISO);
  if (proyIds) q = q.in('proyecto_id', proyIds.length ? proyIds : ['00000000-0000-0000-0000-000000000000']);
  const { data: rows } = await q;

  const map = new Map<string, TareoConsFila & { proyectos: Set<string> }>();
  (rows ?? []).forEach((r: any) => {
    if (!r.presente) return;
    const key = r.trabajador_id || `n:${r.trabajador_nombre}`;
    const h = Number(r.horas ?? 0), e = Number(r.horas_extra ?? 0);
    const t = map.get(key) ?? { nombre: r.trabajador_nombre, proyectosN: 0, dias: 0, horas: 0, extra: 0, monto: 0, correcciones: 0, proyectos: new Set<string>() };
    t.dias += 1; t.horas += h; t.extra += e; t.monto += montoDia(Number(r.jornal_semana ?? 0), h, e);
    if (r.es_correccion) t.correcciones += 1;
    t.proyectos.add(r.proyecto_id);
    map.set(key, t);
  });
  const filas: TareoConsFila[] = [...map.values()]
    .map((t) => ({ nombre: t.nombre, proyectosN: t.proyectos.size, dias: t.dias, horas: t.horas, extra: t.extra, monto: t.monto, correcciones: t.correcciones }))
    .sort((a, b) => b.monto - a.monto);

  const d: TareoConsData = {
    periodo: PERIODO_LBL[periodo] ?? periodo,
    alcance,
    hasta: fmtDate(new Date().toISOString().slice(0, 10)),
    filas,
    total: filas.reduce((a, f) => a + f.monto, 0),
    fmtMoney,
  };

  const buffer = await renderToBuffer(createElement(TareoConsolidadoPDF as never, { d }) as never);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${dl ? 'attachment' : 'inline'}; filename="Tareo-consolidado-${periodo}.pdf"`,
    },
  });
}
