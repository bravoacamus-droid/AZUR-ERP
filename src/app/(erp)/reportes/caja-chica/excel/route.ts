import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { LOGO_DATA_URI } from '@/lib/brand-logo';
import { STATUS_SOLICITUD } from '@/lib/estados';

export const runtime = 'nodejs';

const AZUR = 'FFC02128';
const GREY = 'FFF3F4F6';

// Listado de "caja chica reportada" (gastos ya pagados desde caja chica),
// filtrable por fechas, para revisarlos/aprobarlos rápido. Pedido de David.
export async function GET(req: Request) {
  await requireModulo('reportes', 'ver');
  const { searchParams } = new URL(req.url);
  const desde = searchParams.get('desde') ?? '';
  const hasta = searchParams.get('hasta') ?? '';
  const supabase = createClient() as any;

  let q = supabase
    .from('solicitudes_pago')
    .select('id, codigo, created_at, fecha_gasto, monto, status, sustento_url, beneficiario_nombre, descripcion, gestor, num_comprobante, sustento_urls, tipo, proyecto:proyectos(nombre)')
    .eq('pagado_caja_chica', true);
  if (desde) q = q.gte('created_at', `${desde}T00:00:00`);
  if (hasta) q = q.lte('created_at', `${hasta}T23:59:59`);
  const { data } = await q.order('created_at', { ascending: false });
  const filas = (data ?? []) as any[];

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AZUR ERP';
  const ws = wb.addWorksheet('Caja chica reportada', { views: [{ showGridLines: false }] });
  ws.columns = [
    { width: 12 }, { width: 12 }, { width: 28 }, { width: 20 }, { width: 32 },
    { width: 14 }, { width: 14 }, { width: 14 }, { width: 40 },
  ];

  // Encabezado con logo y marca
  try {
    const imgId = wb.addImage({ base64: LOGO_DATA_URI.split(',')[1], extension: 'png' });
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 56, height: 56 } });
  } catch { /* si falla la imagen, el reporte igual se genera */ }
  ws.mergeCells('B1:I1');
  ws.getCell('B1').value = 'AZUR CONSTRUCTORA E INMOBILIARIA';
  ws.getCell('B1').font = { bold: true, size: 16, color: { argb: AZUR } };
  ws.mergeCells('B2:I2');
  const rango = desde || hasta ? `${desde || 'inicio'} a ${hasta || 'hoy'}` : 'Todo el histórico';
  ws.getCell('B2').value = `Caja chica reportada · ${rango}`;
  ws.getCell('B2').font = { size: 11, color: { argb: 'FF666666' } };
  ws.mergeCells('B3:I3');
  ws.getCell('B3').value = 'Gastos ya pagados desde caja chica. Flujo corto: aprueba el Jefe de Proyectos y Administración valida el sustento; ahí suma al proyecto.';
  ws.getCell('B3').font = { size: 9, italic: true, color: { argb: 'FF888888' } };
  ws.getRow(1).height = 22;

  let r = 5;
  const head = ws.getRow(r);
  head.values = ['Fecha', 'Código', 'Proyecto', 'Gestor', 'Detalle', 'N° Fact/RHE', 'Monto', 'Estado', 'Sustento'];
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUR } };
    c.alignment = { vertical: 'middle' };
  });
  head.height = 18;
  r++;

  const money = '#,##0.00';
  let total = 0;
  filas.forEach((f) => {
    const monto = Number(f.monto ?? 0);
    total += monto;
    const row = ws.getRow(r);
    row.values = [
      String(f.fecha_gasto ?? f.created_at).slice(0, 10),
      f.codigo ?? '',
      f.proyecto?.nombre ?? '',
      f.gestor ?? '',
      f.descripcion || f.beneficiario_nombre || '',
      f.num_comprobante ?? '',
      monto,
      STATUS_SOLICITUD[f.status]?.label ?? f.status,
      (f.sustento_urls?.[0] ?? f.sustento_url) ?? '',
    ];
    row.getCell(7).numFmt = money;
    const url1 = f.sustento_urls?.[0] ?? f.sustento_url;
    if (url1) {
      const n = f.sustento_urls?.length ?? 1;
      row.getCell(9).value = { text: n > 1 ? `Ver sustento (${n} fotos)` : 'Ver sustento', hyperlink: url1 };
      row.getCell(9).font = { color: { argb: 'FF0563C1' }, underline: true };
    }
    r++;
  });

  const tot = ws.getRow(r);
  tot.values = ['', '', '', '', '', 'Total del periodo', total, '', ''];
  tot.eachCell((c, i) => {
    c.font = { bold: true };
    if (i === 7) c.numFmt = money;
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="Caja-chica-reportada-AZUR.xlsx"',
    },
  });
}
