import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { fmtMoney, fmtPct } from '@/lib/format';
import { pnlProyecto, agruparPnlPorLinea, type PnlRow } from '@/lib/pnl';
import { PnlPDF, type PnlPdfData } from './pnl-pdf';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  await requireModulo('reportes', 'ver');
  const supabase = createClient() as any;
  const url = new URL(req.url);
  const proyecto = url.searchParams.get('proyecto') || '';
  const linea = url.searchParams.get('linea') || '';
  const dl = url.searchParams.get('dl') === '1';

  const [{ data: dashRaw }, { data: proyRaw }, { data: lineasRaw }] = await Promise.all([
    supabase.from('v_dashboard_proyecto').select('proyecto_id, codigo, nombre, linea_id, proyectado, pagos, gasto'),
    supabase.from('proyectos').select('id, linea_id, gg_pct, ga_pct, utilidad_pct, igv_pct'),
    supabase.from('lineas_negocio').select('id, nombre, color').order('nombre'),
  ]);

  let alcance = 'Todos los proyectos';
  const dash = (dashRaw ?? []).filter((d: any) => (!proyecto || d.proyecto_id === proyecto) && (!linea || d.linea_id === linea));
  if (proyecto) alcance = dash[0]?.nombre ?? 'Proyecto';
  else if (linea) alcance = `Línea: ${(lineasRaw ?? []).find((l: any) => l.id === linea)?.nombre ?? ''}`;

  const margenMap = new Map<string, any>((proyRaw ?? []).map((p: any) => [p.id, p]));
  const proyectos: PnlRow[] = dash
    .map((d: any) => pnlProyecto(d, margenMap.get(d.proyecto_id)))
    .sort((a: PnlRow, b: PnlRow) => b.cobrado - a.cobrado);
  const lineas = agruparPnlPorLinea(proyectos, (lineasRaw ?? []).map((l: any) => ({ id: l.id, nombre: l.nombre, color: l.color })));

  const d: PnlPdfData = { periodo: 'Acumulado a la fecha', alcance, lineas, proyectos, fmtMoney: (n) => fmtMoney(n), fmtPct: (n) => fmtPct(n) };
  const buffer = await renderToBuffer(createElement(PnlPDF as never, { d }) as never);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${dl ? 'attachment' : 'inline'}; filename="Estado-resultados.pdf"`,
    },
  });
}
