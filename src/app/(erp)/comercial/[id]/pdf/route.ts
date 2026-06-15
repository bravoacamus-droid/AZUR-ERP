import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/format';
import { nombreArchivoCotizacion } from '@/lib/codigo';
import {
  armarArbol, renumerar, calcularCostosMargen, calcularTotales, type NodoArbol,
} from '@/lib/calc';
import { CotizacionPDF, type PdfRow, type PdfData } from './cotizacion-pdf';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: cot } = await supabase
    .from('cotizaciones')
    .select('*, cliente:clientes(*), linea:lineas_negocio(*)')
    .eq('id', params.id)
    .single();
  if (!cot) return new Response('No encontrado', { status: 404 });

  const [{ data: items }, { data: medios }] = await Promise.all([
    supabase.from('cotizacion_items').select('*').eq('cotizacion_id', params.id).order('orden'),
    supabase.from('medios_pago_empresa').select('*').order('orden'),
  ]);

  const arbol = armarArbol((items ?? []) as never);
  const codigos = renumerar(arbol as never);
  const calc = calcularCostosMargen(arbol as never);
  const totales = calcularTotales(calc, arbol as never, {
    gg_pct: Number(cot.gg_pct), ga_pct: Number(cot.ga_pct), utilidad_pct: Number(cot.utilidad_pct),
    igv_pct: Number(cot.igv_pct), descuento_pct: Number(cot.descuento_pct), descuento_activo: cot.descuento_activo,
  });

  const rows: PdfRow[] = [];
  const walk = (nodos: any[], depth: number) => {
    nodos.forEach((n: any) => {
      const node = n as { data: { id: string; titulo: string; unidad?: string; cantidad?: number }; hijos: any[]; esHoja: boolean };
      const c = calc.get(node.data.id);
      rows.push({
        codigo: codigos.get(node.data.id) ?? '',
        titulo: node.data.titulo,
        depth,
        esHoja: node.esHoja,
        unidad: node.data.unidad ?? null,
        cantidad: node.data.cantidad ?? null,
        precio_unitario: c?.precio_unitario ?? 0,
        subtotal: c?.margen_subtotal ?? 0,
      });
      walk(node.hijos, depth + 1);
    });
  };
  walk(arbol as any, 0);

  const d: PdfData = {
    codigo: cot.codigo ?? '####',
    fecha: fmtDate(cot.fecha),
    proyecto: cot.proyecto_nombre,
    asunto: cot.asunto ?? undefined,
    ubicacion: cot.ubicacion ?? undefined,
    cliente: cot.cliente?.razon_social ?? '',
    ruc: cot.cliente?.ruc_dni ?? undefined,
    empresa: 'AZUR CONSTRUYE S.A.C.',
    rucEmpresa: 'R.U.C. 20602938019',
    vigencia: cot.vigencia_dias ? `${cot.vigencia_dias} días` : undefined,
    plazo: cot.plazo_valor ? `${cot.plazo_valor} días ${cot.plazo_tipo === 'util' ? 'útiles' : 'calendario'}` : undefined,
    rows,
    totales: {
      subtotal: totales.subtotal,
      gg: cot.mostrar_gg ? totales.gastos_generales : undefined,
      ga: cot.mostrar_ga ? totales.gastos_administrativos : undefined,
      util: cot.mostrar_utilidad ? totales.utilidad : undefined,
      costoDirecto: totales.costo_directo,
      igv: cot.mostrar_igv ? totales.igv : undefined,
      total: totales.total,
      descuento: cot.descuento_activo ? totales.descuento : undefined,
      totalConDescuento: totales.total_con_descuento,
    },
    condiciones: cot.condiciones ?? undefined,
    serviciosIncluidos: cot.servicios_incluidos ?? undefined,
    serviciosOmitidos: cot.servicios_omitidos ?? undefined,
    garantia: cot.garantia_activa ? (cot.garantia ?? undefined) : undefined,
    medios: (medios ?? []).map((m) => ({ banco: m.banco, titular: m.titular, cuenta: m.cuenta_soles ?? undefined, detraccion: m.es_detraccion })),
  };

  const buffer = await renderToBuffer(createElement(CotizacionPDF as any, { d }) as any);
  const filename = nombreArchivoCotizacion(cot.proyecto_nombre, cot.codigo ?? 'SN');

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}.pdf"`,
    },
  });
}
