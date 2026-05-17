import { NextResponse } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ValorizacionPDF } from '@/components/pdf/valorizacion-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const [{ data: val }, { data: totales }] = await Promise.all([
    supabase
      .from('valorizaciones')
      .select(
        '*, proyecto:proyecto_id(codigo, nombre, moneda, cotizacion:cotizacion_id(cliente:cliente_id(razon_social)))',
      )
      .eq('id', params.id)
      .single(),
    supabase.from('v_valorizacion_totales').select('*').eq('id', params.id).single(),
  ]);

  if (!val) return NextResponse.json({ error: 'No encontrada' }, { status: 404 });

  const { data: partidas } = await supabase
    .from('valorizacion_partidas')
    .select(
      'partida:partida_id(codigo, descripcion, unidad), metrado_contractual, metrado_anterior, metrado_periodo, metrado_acumulado, precio_unitario, monto_periodo, monto_acumulado, porcentaje_acumulado, orden',
    )
    .eq('valorizacion_id', params.id)
    .order('orden');

  const proyecto = Array.isArray(val.proyecto) ? val.proyecto[0] : val.proyecto;
  const cotizacion = proyecto?.cotizacion
    ? Array.isArray(proyecto.cotizacion)
      ? proyecto.cotizacion[0]
      : proyecto.cotizacion
    : null;
  const cliente = cotizacion?.cliente
    ? Array.isArray(cotizacion.cliente)
      ? cotizacion.cliente[0]
      : cotizacion.cliente
    : null;

  const moneda = (proyecto?.moneda as 'PEN' | 'USD') ?? 'PEN';

  const partidasNum = (partidas ?? []).map((p) => {
    const part = Array.isArray(p.partida) ? p.partida[0] : p.partida;
    return {
      codigo: part?.codigo ?? '',
      descripcion: part?.descripcion ?? '',
      unidad: part?.unidad ?? '',
      metrado_contractual: Number(p.metrado_contractual),
      metrado_anterior: Number(p.metrado_anterior),
      metrado_periodo: Number(p.metrado_periodo),
      metrado_acumulado: Number(p.metrado_acumulado),
      precio_unitario: Number(p.precio_unitario),
      monto_periodo: Number(p.monto_periodo),
      monto_acumulado: Number(p.monto_acumulado),
      porcentaje_acumulado: Number(p.porcentaje_acumulado),
    };
  });

  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const element = createElement(ValorizacionPDF, {
    logoUrl: `${origin}/logo.png`,
    codigo: val.codigo as string,
    numero: val.numero,
    periodoInicio: val.periodo_inicio as string,
    periodoFin: val.periodo_fin as string,
    estado: (val.estado as string).replace('_', ' '),
    proyectoCodigo: proyecto?.codigo ?? '',
    proyectoNombre: proyecto?.nombre ?? '',
    cliente: cliente?.razon_social ?? null,
    moneda,
    retencionPct: Number(val.retencion_porcentaje),
    igvPct: Number(val.igv_porcentaje),
    amortizacionAdelanto: Number(val.amortizacion_adelanto),
    partidas: partidasNum,
    totales: {
      monto_periodo: Number(totales?.monto_periodo ?? 0),
      monto_acumulado: Number(totales?.monto_acumulado ?? 0),
      retencion: Number(totales?.retencion ?? 0),
      igv: Number(totales?.igv ?? 0),
      monto_a_pagar: Number(totales?.monto_a_pagar ?? 0),
    },
  }) as unknown as ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${val.codigo}-valorizacion.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}
