import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { LOGO_DATA_URI } from '@/lib/brand-logo';
import { pnlProyecto, agruparPnlPorLinea, pnlMensual, type PnlRow } from '@/lib/pnl';

export const runtime = 'nodejs';
const AZUR = 'FFC02128';
const GREY = 'FFF3F4F6';

const desdeDe = (periodo: string): string | null => {
  const hoy = new Date();
  if (periodo === 'todo') return null;
  if (periodo === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const d = new Date(hoy); d.setDate(d.getDate() - (periodo === 'sem' ? 84 : Number(periodo) || 30));
  return d.toISOString().slice(0, 10);
};

export async function GET(req: Request) {
  await requireModulo('reportes', 'ver');
  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get('periodo') ?? '30';
  const proyecto = searchParams.get('proyecto') ?? '';
  const linea = searchParams.get('linea') ?? '';
  const desdeISO = desdeDe(periodo);
  const supabase = createClient() as any;

  const [{ data: dashRaw }, { data: proyRaw }, { data: lineasRaw }] = await Promise.all([
    supabase.from('v_dashboard_proyecto').select('proyecto_id, codigo, nombre, linea_id, proyectado, pagos, gasto'),
    supabase.from('proyectos').select('id, linea_id, gg_pct, ga_pct, utilidad_pct, igv_pct'),
    supabase.from('lineas_negocio').select('id, nombre, color').order('nombre'),
  ]);

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
  const proyectos: PnlRow[] = dash.map((d: any) => pnlProyecto(d, margenMap.get(d.proyecto_id))).sort((a: PnlRow, b: PnlRow) => b.cobrado - a.cobrado);
  const lineas = agruparPnlPorLinea(proyectos, (lineasRaw ?? []).map((l: any) => ({ id: l.id, nombre: l.nombre, color: l.color })));
  const proyLinea = new Map<string, string | null>((proyRaw ?? []).map((p: any) => [p.id, p.linea_id]));
  const mensual = pnlMensual(abonos ?? [], sols ?? [], proyLinea, (lineasRaw ?? []).map((l: any) => ({ id: l.id, nombre: l.nombre })));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AZUR ERP';
  const ws = wb.addWorksheet('Estado de resultados', { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 38 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 12 }];

  try {
    const imgId = wb.addImage({ base64: LOGO_DATA_URI.split(',')[1], extension: 'png' });
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 56, height: 56 } });
  } catch { /* */ }
  ws.mergeCells('B1:H1'); ws.getCell('B1').value = 'AZUR CONSTRUCTORA E INMOBILIARIA'; ws.getCell('B1').font = { bold: true, size: 16, color: { argb: AZUR } };
  ws.mergeCells('B2:H2'); ws.getCell('B2').value = `Estado de resultados (P&L) · Acumulado · ${alcance}`; ws.getCell('B2').font = { size: 11, color: { argb: 'FF666666' } };
  ws.getRow(1).height = 22;

  let r = 4;
  const money = '#,##0.00';
  const pct = '0.0%';
  const title = (t: string, span = 'H') => { ws.mergeCells(`A${r}:${span}${r}`); const c = ws.getCell(`A${r}`); c.value = t; c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUR } }; r++; };
  const headRow = (vals: string[]) => { const h = ws.getRow(r); h.values = vals; h.eachCell((c) => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } }; }); r++; };

  // Por línea
  title('Por línea de negocio');
  headRow(['Línea', 'Cobrado', 'Gastado', 'Utilidad real', '% M. real', '% M. cotizado', 'Gap']);
  lineas.forEach((l) => {
    const row = ws.getRow(r);
    row.values = [`${l.nombre} (${l.nProyectos})`, l.cobrado, l.gastado, l.utilReal, l.margenRealPct, l.margenCotPct, l.gapPct];
    [2, 3, 4].forEach((i) => (row.getCell(i).numFmt = money));
    [5, 6, 7].forEach((i) => (row.getCell(i).numFmt = pct));
    r++;
  });
  r++;

  // Por proyecto
  title('Por proyecto');
  headRow(['Proyecto', 'Cobrado', 'Gastado', 'Utilidad real', '% M. real', 'Util. cotizada', '% M. cotizado', 'Gap']);
  proyectos.forEach((p: PnlRow) => {
    const row = ws.getRow(r);
    row.values = [p.nombre, p.cobrado, p.gastado, p.utilReal, p.margenRealPct, p.utilCotizada, p.margenCotPct, p.gapPct];
    [2, 3, 4, 6].forEach((i) => (row.getCell(i).numFmt = money));
    [5, 7, 8].forEach((i) => (row.getCell(i).numFmt = pct));
    r++;
  });
  r += 1;
  ws.mergeCells(`A${r}:H${r}`);
  ws.getCell(`A${r}`).value = 'Utilidad real = Cobrado − Gastado (flujo de caja acumulado). Margen cotizado = (GG+GA+Utilidad)/(1+GG+GA+Utilidad) sobre contrato neto de IGV. Gap = margen real − margen cotizado.';
  ws.getCell(`A${r}`).font = { size: 8, italic: true, color: { argb: 'FF888888' } };

  // ── Hoja 2: P&L por línea / mes (base caja) ──
  const ws2 = wb.addWorksheet('P&L mensual', { views: [{ showGridLines: false }] });
  ws2.columns = [{ width: 12 }, { width: 16 }, { width: 16 }, { width: 16 }, ...mensual.lineas.map(() => ({ width: 18 }))];
  ws2.mergeCells(1, 1, 1, 4 + mensual.lineas.length);
  ws2.getCell('A1').value = `Estado de resultados por línea / mes (base caja) · ${alcance}`;
  ws2.getCell('A1').font = { bold: true, size: 13, color: { argb: AZUR } };
  let r2 = 3;
  const head2 = ws2.getRow(r2);
  head2.values = ['Mes', 'Cobrado', 'Gastado', 'Utilidad', ...mensual.lineas.map((l) => l.nombre)];
  head2.eachCell((c) => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUR } }; });
  r2++;
  const money2 = '#,##0.00';
  mensual.filas.forEach((f) => {
    const row = ws2.getRow(r2);
    row.values = [`${f.mes.slice(5, 7)}/${f.mes.slice(0, 4)}`, f.cobrado, f.gastado, f.utilidad, ...mensual.lineas.map((l) => f.porLinea[l.id] ?? 0)];
    for (let i = 2; i <= 4 + mensual.lineas.length; i++) row.getCell(i).numFmt = money2;
    r2++;
  });
  const totRow = ws2.getRow(r2);
  totRow.values = ['Total', mensual.total.cobrado, mensual.total.gastado, mensual.total.utilidad, ...mensual.lineas.map((l) => mensual.total.porLinea[l.id] ?? 0)];
  totRow.eachCell((c, i) => { c.font = { bold: true }; if (i >= 2) c.numFmt = money2; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } }; });

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Estado-resultados-AZUR.xlsx"',
    },
  });
}
