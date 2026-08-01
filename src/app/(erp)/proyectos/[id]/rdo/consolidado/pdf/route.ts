import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/format';
import { RdoConsolidadoPDF, type ConsolidadoData } from './rdo-consolidado-pdf';

export const runtime = 'nodejs';

const isoHoy = () => new Date().toISOString().slice(0, 10);
const isoMenos = (dias: number) => new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient() as any; // columnas recientes aún no tipadas
  const url = new URL(req.url);
  const desde = url.searchParams.get('desde') || isoMenos(6);
  const hasta = url.searchParams.get('hasta') || isoHoy();
  const estadoFiltro = url.searchParams.get('estado') || ''; // '' = todos; 'aprobado' = solo aprobados

  const { data: proy } = await supabase.from('proyectos').select('nombre, codigo, ubicacion').eq('id', params.id).single();
  if (!proy) return new Response('No encontrado', { status: 404 });

  let q = supabase
    .from('partes_diarios')
    .select('id, fecha, estado, personal_count, observaciones, incidencias, autor:profiles!created_by(nombre), rdo_actividades(descripcion, avance_pct, estado, proyecto_item_id)')
    .eq('proyecto_id', params.id)
    .gte('fecha', desde)
    .lte('fecha', hasta);
  if (estadoFiltro === 'aprobado') q = q.eq('estado', 'aprobado');
  const { data: partes } = await q.order('fecha');

  const lista = partes ?? [];
  const rdoIds = lista.map((p: any) => p.id);
  const [{ data: fotos }, { data: allItems }] = await Promise.all([
    rdoIds.length ? supabase.from('evidencias').select('url, descripcion, rdo_id').in('rdo_id', rdoIds) : Promise.resolve({ data: [] }),
    supabase.from('proyecto_items').select('id, titulo').eq('proyecto_id', params.id),
  ]);
  const tituloById = new Map((allItems ?? []).map((i: any) => [i.id, i.titulo]));
  const fechaByRdo = new Map(lista.map((p: any) => [p.id, p.fecha]));

  // Avance acumulado por partida/actividad
  const agg = new Map<string, { actividad: string; partida?: string; avanceAcum: number }>();
  lista.forEach((p: any) => (p.rdo_actividades ?? []).forEach((a: any) => {
    const key = a.proyecto_item_id || `d:${a.descripcion}`;
    const partida = a.proyecto_item_id ? (tituloById.get(a.proyecto_item_id) as string | undefined) : undefined;
    const cur = agg.get(key) ?? { actividad: a.descripcion, partida, avanceAcum: 0 };
    cur.avanceAcum += a.avance_pct == null ? 0 : Number(a.avance_pct);
    agg.set(key, cur);
  }));

  const residentes = Array.from(new Set(lista.map((p: any) => p.autor?.nombre).filter(Boolean))).join(', ');

  // Curva de avance del periodo: acumula el avance diario total (suma de % de las
  // actividades de cada día) a lo largo de las fechas del rango.
  let acumCurva = 0;
  const curva = lista.map((p: any) => {
    const diario = (p.rdo_actividades ?? []).reduce((a: number, x: any) => a + (x.avance_pct == null ? 0 : Number(x.avance_pct)), 0);
    acumCurva += diario;
    return { fecha: fmtDate(p.fecha), acum: acumCurva };
  });

  const d: ConsolidadoData = {
    proyecto: proy.nombre,
    ubicacion: proy.ubicacion ?? undefined,
    codigo: proy.codigo ?? '',
    desde: fmtDate(desde),
    hasta: fmtDate(hasta),
    nReportes: lista.length,
    residentes: residentes || undefined,
    estadoFiltro: estadoFiltro === 'aprobado' ? 'Solo aprobados' : 'Todos',
    curva,
    curvaFinal: acumCurva,
    partidas: Array.from(agg.values()).sort((a, b) => b.avanceAcum - a.avanceAcum),
    dias: lista.map((p: any) => ({
      fecha: fmtDate(p.fecha),
      residente: p.autor?.nombre ?? undefined,
      nActividades: (p.rdo_actividades ?? []).length,
      personal: p.personal_count ?? undefined,
      estado: p.estado ?? 'borrador',
    })),
    fotos: (fotos ?? []).map((f: any) => ({ url: f.url, descripcion: f.descripcion ?? undefined, fecha: fmtDate(fechaByRdo.get(f.rdo_id) as string) })),
    notas: lista.filter((p: any) => p.observaciones || p.incidencias).map((p: any) => ({ fecha: fmtDate(p.fecha), observaciones: p.observaciones ?? undefined, incidencias: p.incidencias ?? undefined })),
  };

  const buffer = await renderToBuffer(createElement(RdoConsolidadoPDF as never, { d }) as never);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Reporte-consolidado-${proy.codigo ?? ''}-${desde}_a_${hasta}.pdf"`,
    },
  });
}
