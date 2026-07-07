import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/format';
import { calcularLiquidacion } from '@/lib/liquidacion';
import { LiquidacionPDF, type LiqPdfData } from './liquidacion-pdf';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: proy } = await supabase.from('proyectos').select('*, cliente:clientes(razon_social)').eq('id', params.id).single();
  if (!proy) return new Response('No encontrado', { status: 404 });

  const [{ data: items }, { data: vals }, { data: dash }, { data: ads }, { data: medios }] = await Promise.all([
    supabase.from('proyecto_items').select('total_costo, es_hoja').eq('proyecto_id', params.id),
    supabase.from('valorizaciones').select('amortizacion_adelanto').eq('proyecto_id', params.id),
    supabase.from('v_dashboard_proyecto').select('*').eq('proyecto_id', params.id).single(),
    supabase.from('adicionales_deductivos').select('tipo, monto, estado').eq('proyecto_id', params.id).eq('estado', 'aprobado'),
    supabase.from('medios_pago_empresa').select('banco, titular, cuenta_soles, cci_soles, cuenta_dolares, cci_dolares, es_detraccion, mostrar_liquidacion').eq('mostrar_liquidacion', true).order('orden'),
  ]);

  const contrato = Number(proy.contrato_total);
  const costoPresupuestado = (items ?? []).filter((i) => i.es_hoja).reduce((a, i) => a + Number(i.total_costo ?? 0), 0);
  const amortizado = (vals ?? []).reduce((a, v) => a + Number(v.amortizacion_adelanto ?? 0), 0);
  const adicionales = (ads ?? []).filter((a) => a.tipo === 'adicional').reduce((a, x) => a + Number(x.monto), 0);
  const deductivos = (ads ?? []).filter((a) => a.tipo === 'deductivo').reduce((a, x) => a + Number(x.monto), 0);

  const liq = calcularLiquidacion({
    contrato, adelantoPct: Number(proy.adelanto_pct), amortizadoAdelanto: amortizado,
    valorizado: Number(dash?.valorizado ?? 0), cobrado: Number(dash?.pagos ?? 0), gastado: Number(dash?.gasto ?? 0),
    costoPresupuestado, adicionales, deductivos,
  });

  const d: LiqPdfData = {
    proyecto: proy.nombre, codigo: proy.codigo ?? '', cliente: (proy.cliente as { razon_social?: string } | null)?.razon_social ?? '', fecha: fmtDate(new Date()),
    contrato, adicionales, deductivos, contratoAjustado: liq.contratoAjustado,
    valorizado: Number(dash?.valorizado ?? 0), cobrado: Number(dash?.pagos ?? 0), porCobrar: liq.porCobrar,
    costoPresupuestado, gastado: Number(dash?.gasto ?? 0),
    margenPresupuesto: liq.margenPresupuesto, utilidadReal: liq.utilidadReal, margenPct: liq.margenPct,
    adelantoInicial: liq.adelantoInicial, amortizado, adelantoSaldo: liq.adelantoSaldo,
    medios: (medios ?? []).map((m) => ({
      banco: m.banco, titular: m.titular,
      cuentaSoles: m.cuenta_soles ?? undefined, cciSoles: m.cci_soles ?? undefined,
      cuentaDolares: m.cuenta_dolares ?? undefined, cciDolares: m.cci_dolares ?? undefined,
      detraccion: m.es_detraccion,
    })),
  };

  const buffer = await renderToBuffer(createElement(LiquidacionPDF as any, { d }) as any);
  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="Liquidacion-${proy.codigo ?? ''}.pdf"` },
  });
}
