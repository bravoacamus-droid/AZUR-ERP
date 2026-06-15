import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/server';
import { nombreArchivoCotizacion } from '@/lib/codigo';
import { armarArbol, renumerar, calcularCostosMargen, calcularTotales, type NodoArbol } from '@/lib/calc';

export const runtime = 'nodejs';

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

  // Cabecera + cuadro de costos y margen (vista interna completa)
  const aoa: (string | number)[][] = [
    [`COTIZACIÓN ${cot.codigo ?? ''} (VISTA INTERNA)`],
    ['Proyecto', cot.proyecto_nombre],
    ['Cliente', cot.cliente?.razon_social ?? ''],
    ['RUC', cot.cliente?.ruc_dni ?? ''],
    [],
    ['ITEM', 'TÍTULO', 'UNIDAD', 'CANTIDAD', 'C. UNITARIO', 'SUBTOTAL COSTO', '% MARGEN', 'P. UNITARIO', 'MARGEN', 'SUBTOTAL C/MARGEN'],
  ];

  const walk = (nodos: any[], depth: number) => {
    nodos.forEach((n: any) => {
      const c = calc.get(n.data.id);
      const hoja = n.esHoja;
      aoa.push([
        codigos.get(n.data.id) ?? '',
        '  '.repeat(depth) + n.data.titulo,
        hoja ? (n.data.unidad ?? '') : '',
        hoja ? Number(n.data.cantidad ?? 0) : '',
        hoja ? Number(n.data.costo_unitario ?? 0) : '',
        Number((c?.costo_subtotal ?? 0).toFixed(2)),
        hoja ? Number(((n.data.margen_pct ?? 0) * 100).toFixed(1)) : '',
        hoja ? Number((c?.precio_unitario ?? 0).toFixed(2)) : '',
        Number((c?.margen_monto ?? 0).toFixed(2)),
        Number((c?.margen_subtotal ?? 0).toFixed(2)),
      ]);
      walk(n.hijos, depth + 1);
    });
  };
  walk(arbol as never, 0);

  aoa.push([]);
  aoa.push(['', '', '', '', '', '', '', '', 'SUBTOTAL', Number(totales.subtotal.toFixed(2))]);
  aoa.push(['', '', '', '', '', '', '', '', 'GASTOS GENERALES', Number(totales.gastos_generales.toFixed(2))]);
  aoa.push(['', '', '', '', '', '', '', '', 'GASTOS ADMINISTRATIVOS', Number(totales.gastos_administrativos.toFixed(2))]);
  aoa.push(['', '', '', '', '', '', '', '', 'UTILIDAD', Number(totales.utilidad.toFixed(2))]);
  aoa.push(['', '', '', '', '', '', '', '', 'COSTO DIRECTO', Number(totales.costo_directo.toFixed(2))]);
  aoa.push(['', '', '', '', '', '', '', '', 'I.G.V.', Number(totales.igv.toFixed(2))]);
  aoa.push(['', '', '', '', '', '', '', '', 'TOTAL', Number(totales.total.toFixed(2))]);
  if (cot.descuento_activo) {
    aoa.push(['', '', '', '', '', '', '', '', 'DESCUENTO', Number(totales.descuento.toFixed(2))]);
    aoa.push(['', '', '', '', '', '', '', '', 'TOTAL C/DESCUENTO', Number(totales.total_con_descuento.toFixed(2))]);
  }
  aoa.push([]);
  aoa.push(['', '', '', '', '', '', '', '', 'MARGEN TOTAL (interno)', Number(totales.margen_subtotal.toFixed(2))]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = [{ wch: 8 }, { wch: 36 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 9 }, { wch: 12 }, { wch: 12 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cotización');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  const filename = nombreArchivoCotizacion(cot.proyecto_nombre, cot.codigo ?? 'SN');
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    },
  });
}
