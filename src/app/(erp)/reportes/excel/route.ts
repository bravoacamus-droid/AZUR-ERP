import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { LOGO_DATA_URI } from '@/lib/brand-logo';
import { TIPO_SOLICITUD_LABEL } from '@/lib/estados';
import { saludGlobal, SALUD_LABEL, type DashboardProyecto } from '@/lib/salud';

export const runtime = 'nodejs';
const AZUR = 'FFE20627';
const GREY = 'FFF3F4F6';
const CATS = ['contratistas', 'proveedores', 'caja_chica', 'servicios', 'honorarios'] as const;

function desdeDe(periodo: string): string | null {
  const hoy = new Date();
  if (periodo === 'todo') return null;
  if (periodo === 'mes') return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const d = new Date(hoy);
  d.setDate(d.getDate() - (Number(periodo) || 30));
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const periodo = searchParams.get('periodo') ?? '30';
  const proyecto = searchParams.get('proyecto') ?? '';
  const linea = searchParams.get('linea') ?? '';
  const desdeISO = desdeDe(periodo);
  const supabase = createClient();

  const [{ data: dashRaw }, { data: lineasRaw }, { data: proyRaw }] = await Promise.all([
    supabase.from('v_dashboard_proyecto').select('*'),
    supabase.from('lineas_negocio').select('id, nombre').order('nombre'),
    supabase.from('proyectos').select('id, linea_id'),
  ]);
  let proyIds: string[] | null = null;
  if (proyecto) proyIds = [proyecto];
  else if (linea) proyIds = (proyRaw ?? []).filter((p) => p.linea_id === linea).map((p) => p.id);

  let qSols = supabase.from('solicitudes_pago').select('monto, tipo, pagado_at, proyecto_id').in('status', ['pagada', 'conciliada']);
  let qAbonos = supabase.from('abonos_cliente').select('monto, fecha, proyecto_id');
  if (desdeISO) { qSols = qSols.gte('pagado_at', desdeISO); qAbonos = qAbonos.gte('fecha', desdeISO); }
  if (proyIds) { const ids = proyIds.length ? proyIds : ['00000000-0000-0000-0000-000000000000']; qSols = qSols.in('proyecto_id', ids); qAbonos = qAbonos.in('proyecto_id', ids); }
  const [{ data: sols }, { data: abonos }] = await Promise.all([qSols, qAbonos]);

  const ingresos = (abonos ?? []).reduce((a, r) => a + Number(r.monto), 0);
  const egresos = (sols ?? []).reduce((a, r) => a + Number(r.monto), 0);
  const acc = new Map<string, number>();
  (sols ?? []).forEach((s) => acc.set(s.tipo, (acc.get(s.tipo) ?? 0) + Number(s.monto)));

  const dash: DashboardProyecto[] = (dashRaw ?? [])
    .map((d) => ({ proyecto_id: d.proyecto_id ?? '', codigo: d.codigo, nombre: d.nombre ?? '', linea_id: d.linea_id, estado: d.estado ?? '', tipo_proyecto: d.tipo_proyecto ?? '', proyectado: Number(d.proyectado ?? 0), pagos: Number(d.pagos ?? 0), gasto: Number(d.gasto ?? 0), valorizado: Number(d.valorizado ?? 0) }))
    .filter((d) => (!proyecto || d.proyecto_id === proyecto) && (!linea || d.linea_id === linea));

  const periodoLabel = { '7': 'Últimos 7 días', '15': 'Últimos 15 días', '30': 'Últimos 30 días', mes: 'Este mes', todo: 'Histórico' }[periodo] ?? periodo;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AZUR ERP';
  const ws = wb.addWorksheet('Reporte', { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 36 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 16 }, { width: 16 }];

  try {
    const imgId = wb.addImage({ base64: LOGO_DATA_URI.split(',')[1], extension: 'png' });
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 56, height: 56 } });
  } catch { /* */ }
  ws.mergeCells('B1:F1'); ws.getCell('B1').value = 'AZUR CONSTRUCTORA E INMOBILIARIA'; ws.getCell('B1').font = { bold: true, size: 16, color: { argb: AZUR } };
  ws.mergeCells('B2:F2'); ws.getCell('B2').value = `Reporte gerencial · ${periodoLabel}`; ws.getCell('B2').font = { size: 11, color: { argb: 'FF666666' } };
  ws.getRow(1).height = 22;

  let r = 4;
  const title = (t: string) => { ws.mergeCells(`A${r}:F${r}`); const c = ws.getCell(`A${r}`); c.value = t; c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUR } }; r++; };
  const money = '#,##0.00';

  // KPIs
  title('Resumen del periodo');
  [['Ingresos cobrados', ingresos], ['Egresos pagados', egresos], ['Flujo neto', ingresos - egresos]].forEach(([k, v]) => {
    ws.getCell(`A${r}`).value = k as string; ws.getCell(`B${r}`).value = Number(v); ws.getCell(`B${r}`).numFmt = money; r++;
  });
  r++;

  // Gasto por categoría
  title('Gasto por categoría');
  ws.getRow(r).values = ['Categoría', 'Monto']; ws.getRow(r).font = { bold: true }; r++;
  CATS.forEach((t) => { ws.getCell(`A${r}`).value = TIPO_SOLICITUD_LABEL[t] ?? t; ws.getCell(`B${r}`).value = acc.get(t) ?? 0; ws.getCell(`B${r}`).numFmt = money; r++; });
  r++;

  // Resultados por línea
  title('Resultados por línea de negocio');
  ws.getRow(r).values = ['Línea', 'Proyectado', 'Cobrado', 'Gasto']; ws.getRow(r).font = { bold: true }; r++;
  (lineasRaw ?? []).forEach((l) => {
    const de = dash.filter((p) => p.linea_id === l.id);
    if (!de.length) return;
    ws.getCell(`A${r}`).value = l.nombre;
    ws.getCell(`B${r}`).value = de.reduce((a, p) => a + p.proyectado, 0);
    ws.getCell(`C${r}`).value = de.reduce((a, p) => a + p.pagos, 0);
    ws.getCell(`D${r}`).value = de.reduce((a, p) => a + p.gasto, 0);
    ['B', 'C', 'D'].forEach((col) => (ws.getCell(`${col}${r}`).numFmt = money));
    r++;
  });
  r++;

  // Proyectos
  title('Proyectos · salud y resultados');
  const head = ws.getRow(r); head.values = ['Proyecto', 'Proyectado', 'Cobrado', 'Gasto', 'Valorizado', 'Salud'];
  head.eachCell((c) => { c.font = { bold: true }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } }; }); r++;
  dash.forEach((p) => {
    const row = ws.getRow(r);
    row.values = [p.nombre, p.proyectado, p.pagos, p.gasto, p.valorizado, SALUD_LABEL[saludGlobal(p)]];
    [2, 3, 4, 5].forEach((i) => (row.getCell(i).numFmt = money));
    r++;
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Reporte-AZUR-${periodo}.xlsx"`,
    },
  });
}
