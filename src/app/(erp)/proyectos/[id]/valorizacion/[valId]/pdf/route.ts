import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/format';
import { dilucionAdelanto } from '@/lib/calc';
import { ValorizacionPDF, type ValPdfData } from './valorizacion-pdf';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string; valId: string } }) {
  const supabase = createClient();
  const { data: proy } = await supabase
    .from('proyectos')
    .select('*, cliente:clientes(razon_social)')
    .eq('id', params.id)
    .single();
  if (!proy) return new Response('No encontrado', { status: 404 });

  const { data: val } = await supabase
    .from('valorizaciones')
    .select('*, valorizacion_items(pct_avance, total, proyecto_item:proyecto_items(titulo))')
    .eq('id', params.valId)
    .single();
  if (!val) return new Response('No encontrado', { status: 404 });

  // acumulado del proyecto hasta esta valorización
  const { data: vals } = await supabase
    .from('valorizaciones')
    .select('monto_valorizado, numero')
    .eq('proyecto_id', params.id)
    .lte('numero', val.numero);
  const valorizadoAcum = (vals ?? []).reduce((a, v) => a + Number(v.monto_valorizado), 0);

  const contrato = Number(proy.contrato_total);
  const periodo = Number(val.monto_valorizado);
  const dil = dilucionAdelanto(periodo, Number(proy.adelanto_pct));

  const rows = ((val.valorizacion_items as any[]) ?? []).map((vi) => ({
    titulo: vi.proyecto_item?.titulo ?? '—',
    pct: Number(vi.pct_avance),
    monto: Number(vi.total),
  }));

  const d: ValPdfData = {
    proyecto: proy.nombre,
    codigo: proy.codigo ?? '',
    cliente: (proy.cliente as { razon_social?: string } | null)?.razon_social ?? '',
    numero: val.numero,
    fecha: fmtDate(val.fecha_corte),
    contrato,
    valorizadoPeriodo: periodo,
    amortizacion: dil.amortizacion,
    cobroNeto: dil.cobroNeto,
    adelantoPct: Number(proy.adelanto_pct),
    valorizadoAcum,
    saldoContrato: contrato - valorizadoAcum,
    rows,
  };

  const buffer = await renderToBuffer(createElement(ValorizacionPDF as any, { d }) as any);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Valorizacion-N${val.numero}-${proy.codigo ?? ''}.pdf"`,
    },
  });
}
