import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/format';
import { dilucionAdelanto, armarArbol, renumerar } from '@/lib/calc';
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
    .select('*, valorizacion_items(proyecto_item_id, pct_avance, total)')
    .eq('id', params.valId)
    .single();
  if (!val) return new Response('No encontrado', { status: 404 });

  // jefe de proyectos del equipo (responsable que elabora el informe)
  const { data: equipo } = await supabase
    .from('proyecto_equipo')
    .select('profile:profiles(nombre, rol)')
    .eq('proyecto_id', params.id);
  const responsable = (equipo ?? []).map((e) => e.profile as { nombre?: string; rol?: string } | null)
    .find((p) => p?.rol === 'jefe_proyectos')?.nombre ?? undefined;

  // itemizado completo (para código de ítem, unidad y monto contractual de cada partida)
  const { data: allItems } = await supabase
    .from('proyecto_items')
    .select('id, parent_id, nivel, orden, item_codigo, titulo, unidad, total_costo, es_hoja')
    .eq('proyecto_id', params.id)
    .order('orden');
  const codigos = renumerar(armarArbol((allItems ?? []) as never) as never);
  const itemById = new Map((allItems ?? []).map((i) => [i.id, i]));

  // % acumulado por ítem hasta esta valorización (inclusive)
  const { data: valsHasta } = await supabase
    .from('valorizaciones')
    .select('numero, valorizacion_items(proyecto_item_id, pct_avance)')
    .eq('proyecto_id', params.id)
    .lte('numero', val.numero);
  const acumPct = new Map<string, number>();
  (valsHasta ?? []).forEach((v) => (v.valorizacion_items as any[] ?? []).forEach((vi) => {
    acumPct.set(vi.proyecto_item_id, (acumPct.get(vi.proyecto_item_id) ?? 0) + Number(vi.pct_avance));
  }));

  // acumulado del proyecto hasta esta valorización
  const { data: vals } = await supabase
    .from('valorizaciones')
    .select('monto_valorizado, numero, fecha_corte')
    .eq('proyecto_id', params.id)
    .lte('numero', val.numero)
    .order('numero');
  const valorizadoAcum = (vals ?? []).reduce((a, v) => a + Number(v.monto_valorizado), 0);
  const historial = (vals ?? []).map((v) => ({
    numero: v.numero as number,
    fecha: v.fecha_corte ? fmtDate(v.fecha_corte as string) : '—',
    monto: Number(v.monto_valorizado),
  }));

  const contrato = Number(proy.contrato_total);
  const adelantoPct = Number(proy.adelanto_pct);
  const periodo = Number(val.monto_valorizado);
  // Adelanto: contractual (%) + adicionales/extraordinarios; dilución proporcional.
  const { data: adels } = await supabase.from('adelantos').select('monto').eq('proyecto_id', params.id);
  const adelantoExtra = (adels ?? []).reduce((a, x) => a + Number(x.monto ?? 0), 0);
  const adelantoTotal = contrato * adelantoPct + adelantoExtra;
  const tasaAmort = contrato > 0 ? adelantoTotal / contrato : 0;
  const dil = dilucionAdelanto(periodo, tasaAmort);
  const amortizadoAcum = tasaAmort * valorizadoAcum;
  const saldoAdelanto = adelantoTotal - amortizadoAcum;

  // base de valorización: costo o precio (factor = contrato / costo directo)
  const costoDirecto = (allItems ?? []).reduce((a, i) => a + (i.es_hoja ? Number(i.total_costo ?? 0) : 0), 0);
  const factorVal = proy.base_valorizacion === 'precio' && costoDirecto > 0 ? contrato / costoDirecto : 1;

  const rows = ((val.valorizacion_items as any[]) ?? [])
    .map((vi) => {
      const it = itemById.get(vi.proyecto_item_id);
      const contractual = Number(it?.total_costo ?? 0) * factorVal;
      const pctAcum = acumPct.get(vi.proyecto_item_id) ?? Number(vi.pct_avance);
      const valorizadoAcum = pctAcum * contractual;
      return {
        codigo: codigos.get(vi.proyecto_item_id) ?? it?.item_codigo ?? '',
        titulo: it?.titulo ?? '—',
        unidad: it?.unidad ?? '',
        contractual,
        pct: Number(vi.pct_avance),
        monto: Number(vi.total) * factorVal,
        pctAcum,
        valorizadoAcum,
        saldo: contractual - valorizadoAcum,
      };
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));

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
    adelantoPct,
    tasaAmort,
    adelantoTotal,
    amortizadoAcum,
    saldoAdelanto,
    valorizadoAcum,
    saldoContrato: contrato - valorizadoAcum,
    responsable,
    rows,
    historial,
  };

  const buffer = await renderToBuffer(createElement(ValorizacionPDF as any, { d }) as any);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Valorizacion-N${val.numero}-${proy.codigo ?? ''}.pdf"`,
    },
  });
}
