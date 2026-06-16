import ExcelJS from 'exceljs';
import { createClient } from '@/lib/supabase/server';
import { nombreArchivoCotizacion } from '@/lib/codigo';
import { LOGO_DATA_URI } from '@/lib/brand-logo';
import { armarArbol, renumerar, calcularCostosMargen, calcularTotales } from '@/lib/calc';

export const runtime = 'nodejs';

const AZUR = 'FFE20627';
const AZUR2 = 'FFBE1723';
const GREY = 'FFF3F4F6';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: cot } = await supabase
    .from('cotizaciones')
    .select('*, cliente:clientes(*)')
    .eq('id', params.id)
    .single();
  if (!cot) return new Response('No encontrado', { status: 404 });

  const { data: items } = await supabase.from('cotizacion_items').select('*').eq('cotizacion_id', params.id).order('orden');

  const arbol = armarArbol((items ?? []) as never);
  const codigos = renumerar(arbol as never);
  const calc = calcularCostosMargen(arbol as never);
  const totales = calcularTotales(calc, arbol as never, {
    gg_pct: Number(cot.gg_pct), ga_pct: Number(cot.ga_pct), utilidad_pct: Number(cot.utilidad_pct),
    igv_pct: Number(cot.igv_pct), descuento_pct: Number(cot.descuento_pct), descuento_activo: cot.descuento_activo,
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'AZUR ERP';
  const ws = wb.addWorksheet('Cotización', { views: [{ showGridLines: false }] });
  ws.columns = [
    { width: 9 }, { width: 40 }, { width: 8 }, { width: 10 }, { width: 13 },
    { width: 14 }, { width: 9 }, { width: 13 }, { width: 13 }, { width: 16 },
  ];

  // ── Encabezado con logo ────────────────────────────────────────────
  try {
    const imgId = wb.addImage({ base64: LOGO_DATA_URI.split(',')[1], extension: 'png' });
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 60, height: 60 } });
  } catch { /* ignora si falla la imagen */ }
  ws.mergeCells('B1:J1');
  ws.getCell('B1').value = 'AZUR CONSTRUCTORA E INMOBILIARIA';
  ws.getCell('B1').font = { bold: true, size: 18, color: { argb: AZUR } };
  ws.mergeCells('B2:J2');
  ws.getCell('B2').value = `COTIZACIÓN ${cot.codigo ?? ''} — VISTA INTERNA`;
  ws.getCell('B2').font = { bold: true, size: 11, color: { argb: AZUR2 } };
  ws.getRow(1).height = 24;

  ws.getCell('B4').value = 'Proyecto:'; ws.getCell('B4').font = { bold: true };
  ws.getCell('C4').value = cot.proyecto_nombre;
  ws.getCell('B5').value = 'Cliente:'; ws.getCell('B5').font = { bold: true };
  ws.getCell('C5').value = cot.cliente?.razon_social ?? '';
  ws.getCell('B6').value = 'RUC:'; ws.getCell('B6').font = { bold: true };
  ws.getCell('C6').value = cot.cliente?.ruc_dni ?? '';

  // ── Cabecera de tabla ──────────────────────────────────────────────
  const headRow = 8;
  const headers = ['ITEM', 'TÍTULO', 'UND', 'CANT', 'C. UNITARIO', 'SUBTOTAL', '% MARGEN', 'P. UNIT', 'MARGEN', 'SUBTOTAL C/M'];
  const hr = ws.getRow(headRow);
  headers.forEach((h, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: AZUR } };
    cell.alignment = { vertical: 'middle', horizontal: i <= 1 ? 'left' : 'center' };
  });
  hr.height = 20;

  // ── Filas del árbol ────────────────────────────────────────────────
  let r = headRow + 1;
  const money = '#,##0.00';
  const walk = (nodos: any[], depth: number) => {
    nodos.forEach((n: any) => {
      const c = calc.get(n.data.id);
      const hoja = n.esHoja;
      const row = ws.getRow(r);
      row.getCell(1).value = codigos.get(n.data.id) ?? '';
      row.getCell(2).value = `${'   '.repeat(depth)}${n.data.titulo}`;
      row.getCell(3).value = hoja ? (n.data.unidad ?? '') : '';
      row.getCell(4).value = hoja ? Number(n.data.cantidad ?? 0) : '';
      row.getCell(5).value = hoja ? Number(n.data.costo_unitario ?? 0) : '';
      row.getCell(6).value = Number((c?.costo_subtotal ?? 0).toFixed(2));
      row.getCell(7).value = hoja ? Number(((n.data.margen_pct ?? 0)).toFixed(4)) : '';
      row.getCell(8).value = hoja ? Number((c?.precio_unitario ?? 0).toFixed(2)) : '';
      row.getCell(9).value = Number((c?.margen_monto ?? 0).toFixed(2));
      row.getCell(10).value = Number((c?.margen_subtotal ?? 0).toFixed(2));
      [5, 6, 8, 9, 10].forEach((i) => (row.getCell(i).numFmt = money));
      row.getCell(7).numFmt = '0.0%';
      if (!hoja) {
        row.font = { bold: true };
        for (let i = 1; i <= 10; i++) row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREY } };
      }
      r++;
      walk(n.hijos, depth + 1);
    });
  };
  walk(arbol as never, 0);

  // ── Totales ────────────────────────────────────────────────────────
  r += 1;
  const totRow = (label: string, value: number, bold = false, hi = false) => {
    const row = ws.getRow(r);
    ws.mergeCells(`B${r}:I${r}`);
    row.getCell(2).value = label;
    row.getCell(2).alignment = { horizontal: 'right' };
    row.getCell(2).font = { bold };
    row.getCell(10).value = Number(value.toFixed(2));
    row.getCell(10).numFmt = money;
    row.getCell(10).font = { bold: bold || hi, color: hi ? { argb: AZUR } : undefined };
    r++;
  };
  totRow('SUBTOTAL', totales.subtotal);
  if (cot.mostrar_gg) totRow('Gastos generales', totales.gastos_generales);
  if (cot.mostrar_ga) totRow('Gastos administrativos', totales.gastos_administrativos);
  if (cot.mostrar_utilidad) totRow('Utilidad', totales.utilidad);
  totRow('COSTO DIRECTO', totales.costo_directo, true);
  if (cot.mostrar_igv) totRow('I.G.V.', totales.igv);
  totRow('TOTAL', totales.total, true, true);
  if (cot.descuento_activo) {
    totRow('Descuento comercial', -totales.descuento);
    totRow('TOTAL CON DESCUENTO', totales.total_con_descuento, true, true);
  }
  r += 1;
  totRow('MARGEN TOTAL (interno)', totales.margen_subtotal, true, true);

  const buffer = await wb.xlsx.writeBuffer();
  const filename = nombreArchivoCotizacion(cot.proyecto_nombre, cot.codigo ?? 'SN');
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    },
  });
}
