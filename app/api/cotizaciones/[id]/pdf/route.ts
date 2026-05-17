import { NextResponse } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { CotizacionPDF } from '@/components/pdf/cotizacion-pdf';
import { calcularTotalesCotizacion } from '@/lib/comercial/apu';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: cot, error } = await supabase
    .from('cotizaciones')
    .select(
      '*, cliente:cliente_id(razon_social, ruc, contacto, email, direccion)',
    )
    .eq('id', params.id)
    .single();

  if (error || !cot) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 });
  }

  const { data: partidas } = await supabase
    .from('cotizacion_partidas')
    .select('codigo, descripcion, unidad, cantidad, precio_unitario, parcial')
    .eq('cotizacion_id', params.id)
    .order('orden');

  const cliente = Array.isArray(cot.cliente) ? cot.cliente[0] : cot.cliente;
  const moneda = (cot.moneda as 'PEN' | 'USD') ?? 'PEN';

  const partidasNum = (partidas ?? []).map((p) => ({
    codigo: p.codigo,
    descripcion: p.descripcion,
    unidad: p.unidad,
    cantidad: Number(p.cantidad),
    precio_unitario: Number(p.precio_unitario),
    parcial: Number(p.parcial ?? Number(p.cantidad) * Number(p.precio_unitario)),
  }));

  const totales = calcularTotalesCotizacion(partidasNum, {
    margen_porcentaje: Number(cot.margen_porcentaje),
    gastos_generales_porcentaje: Number(cot.gastos_generales_porcentaje),
    igv_porcentaje: Number(cot.igv_porcentaje),
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const logoUrl = `${origin}/logo.png`;

  const element = createElement(CotizacionPDF, {
    logoUrl,
    codigo: cot.codigo as string,
    titulo: cot.titulo,
    descripcion: cot.descripcion,
    ubicacion: cot.ubicacion,
    estado: (cot.estado as string).replace('_', ' '),
    fechaEmision: cot.fecha_emision as string,
    validezDias: cot.validez_dias,
    moneda,
    margenPorcentaje: Number(cot.margen_porcentaje),
    ggPorcentaje: Number(cot.gastos_generales_porcentaje),
    igvPorcentaje: Number(cot.igv_porcentaje),
    cliente,
    partidas: partidasNum,
    totales,
    notas: cot.notas,
    terminos: cot.terminos,
  }) as unknown as ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);

  // Buffer → Uint8Array para compatibilidad con BodyInit (Edge + Node runtimes)
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${cot.codigo}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}
