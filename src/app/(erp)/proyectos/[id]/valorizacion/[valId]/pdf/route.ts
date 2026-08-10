import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/format';
import { dilucionAdelanto, armarArbol, renumerar } from '@/lib/calc';
import { ValorizacionPDF, type ValPdfData } from './valorizacion-pdf';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: { id: string; valId: string } }) {
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
    .select('profile:profiles(nombre, rol, firma_data)')
    .eq('proyecto_id', params.id);
  const jefe = (equipo ?? []).map((e) => e.profile as { nombre?: string; rol?: string; firma_data?: string | null } | null)
    .find((p) => p?.rol === 'jefe_proyectos');
  const responsable = jefe?.nombre ?? undefined;
  const responsableFirma = jefe?.firma_data ?? undefined;
  // Gerente (aprueba). Si hay un único gerente, su firma va automática.
  const { data: gerentes } = await supabase.from('profiles').select('nombre, firma_data').eq('rol', 'gerencia').eq('activo', true);
  const gerente = (gerentes ?? []).length === 1 ? (gerentes![0] as { nombre?: string }).nombre ?? undefined : undefined;
  const gerenteFirma = (gerentes ?? []).length === 1 ? (gerentes![0] as { firma_data?: string | null }).firma_data ?? undefined : undefined;

  // Firmantes configurados en el proyecto (si no hay, el PDF usa Jefe + Gerente).
  const firmanteIds: string[] = Array.isArray((proy as { firmantes?: unknown }).firmantes) ? (proy as { firmantes: string[] }).firmantes : [];
  let firmantes: { nombre: string; rol?: string; firma?: string }[] = [];
  if (firmanteIds.length) {
    const { data: fs } = await supabase.from('profiles').select('id, nombre, rol, firma_data').in('id', firmanteIds);
    firmantes = firmanteIds.map((id) => (fs ?? []).find((u) => u.id === id)).filter(Boolean)
      .map((u) => ({ nombre: (u as { nombre: string }).nombre, rol: (u as { rol?: string }).rol, firma: (u as { firma_data?: string | null }).firma_data ?? undefined }));
  }

  // itemizado completo (para código de ítem, unidad y monto contractual de cada partida)
  const { data: allItems } = await supabase
    .from('proyecto_items')
    .select('id, parent_id, nivel, orden, item_codigo, titulo, unidad, total_costo, es_hoja')
    .eq('proyecto_id', params.id)
    .order('orden');
  const codigos = renumerar(armarArbol((allItems ?? []) as never) as never);
  const itemById = new Map((allItems ?? []).map((i) => [i.id, i]));

  // Base de valorización. En modo "precio" el contrato es el precio de venta,
  // pero los montos guardados (monto_valorizado, valorizacion_items.total) están
  // en COSTO. factorVal escala costo→precio; se aplica tanto a las filas (fCli)
  // como a los montos acumulados para que todo el PDF quede en las mismas unidades.
  const contrato = Number(proy.contrato_total);
  const costoDirecto = (allItems ?? []).reduce((a, i) => a + (i.es_hoja ? Number(i.total_costo ?? 0) : 0), 0);
  const esPrecio = proy.base_valorizacion === 'precio';
  const factorVal = esPrecio && costoDirecto > 0 ? contrato / costoDirecto : 1;

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
  const valorizadoAcum = (vals ?? []).reduce((a, v) => a + Number(v.monto_valorizado), 0) * factorVal;
  const historial = (vals ?? []).map((v) => ({
    numero: v.numero as number,
    fecha: v.fecha_corte ? fmtDate(v.fecha_corte as string) : '—',
    monto: Number(v.monto_valorizado) * factorVal,
  }));

  const adelantoPct = Number(proy.adelanto_pct);
  const periodo = Number(val.monto_valorizado) * factorVal;
  // Adelanto: contractual (%) + adicionales/extraordinarios; dilución proporcional.
  const { data: adels } = await supabase.from('adelantos').select('monto').eq('proyecto_id', params.id);
  const adelantoExtra = (adels ?? []).reduce((a, x) => a + Number(x.monto ?? 0), 0);
  const adelantoTotal = contrato * adelantoPct + adelantoExtra;
  const tasaAmort = contrato > 0 ? adelantoTotal / contrato : 0;
  const dil = dilucionAdelanto(periodo, tasaAmort);
  const amortizadoAcum = tasaAmort * valorizadoAcum;
  const saldoAdelanto = adelantoTotal - amortizadoAcum;

  // medios de pago de la empresa (dónde deposita el cliente)
  const { data: medios } = await supabase
    .from('medios_pago_empresa')
    .select('banco, titular, cuenta_soles, cci_soles, cuenta_dolares, cci_dolares, es_detraccion, mostrar_valorizacion')
    .eq('mostrar_valorizacion', true)
    .order('orden');

  // Opción "sin impuestos": ?igv=0 emite la valorización con los montos netos de IGV.
  const ggPct = Number(proy.gg_pct ?? 0), gaPct = Number(proy.ga_pct ?? 0), utilPct = Number(proy.utilidad_pct ?? 0), igvPct = Number(proy.igv_pct ?? 0);
  const conIgv = new URL(req.url).searchParams.get('igv') !== '0';
  const kIgv = conIgv || igvPct <= 0 ? 1 : 1 / (1 + igvPct); // quita el IGV de los montos que lo incluyen
  const fCli = factorVal * kIgv; // costo → precio al cliente (con o sin IGV)

  // Desglose del cobro: parte el monto (que llega CON IGV) en subtotal con margen
  // + GG + GA + utilidad (+ IGV si el reporte lo incluye), con los % del proyecto.
  const desglosar = (T: number) => {
    const base = igvPct > 0 ? T / (1 + igvPct) : T; // neto de IGV
    const sub = base / (1 + ggPct + gaPct + utilPct);
    const gg = sub * ggPct, ga = sub * gaPct, util = sub * utilPct;
    return { subtotal: sub, gg, ga, util, igv: conIgv ? base * igvPct : 0, total: conIgv ? T : base };
  };

  const rows = ((val.valorizacion_items as any[]) ?? [])
    .map((vi) => {
      const it = itemById.get(vi.proyecto_item_id);
      const contractual = Number(it?.total_costo ?? 0) * fCli;
      const pctAcum = acumPct.get(vi.proyecto_item_id) ?? Number(vi.pct_avance);
      const valorizadoAcum = pctAcum * contractual;
      return {
        codigo: codigos.get(vi.proyecto_item_id) ?? it?.item_codigo ?? '',
        titulo: it?.titulo ?? '—',
        unidad: it?.unidad ?? '',
        contractual,
        pct: Number(vi.pct_avance),
        monto: Number(vi.total) * fCli,
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
    conIgv,
    contrato: contrato * kIgv,
    valorizadoPeriodo: periodo * kIgv,
    amortizacion: dil.amortizacion * kIgv,
    cobroNeto: dil.cobroNeto * kIgv,
    adelantoPct,
    tasaAmort,
    adelantoTotal: adelantoTotal * kIgv,
    amortizadoAcum: amortizadoAcum * kIgv,
    saldoAdelanto: saldoAdelanto * kIgv,
    valorizadoAcum: valorizadoAcum * kIgv,
    // "Saldo por pagar" (vista cliente): contrato − adelanto − valorizado acumulado.
    saldoContrato: (contrato - adelantoTotal - valorizadoAcum) * kIgv,
    responsable,
    responsableFirma,
    gerente,
    gerenteFirma,
    firmantes,
    desglose: esPrecio ? { ...desglosar(periodo), ggPct, gaPct, utilPct, igvPct: conIgv ? igvPct : 0 } : undefined,
    rows,
    historial: historial.map((h) => ({ ...h, monto: h.monto * kIgv })),
    medios: (medios ?? []).map((m) => ({
      banco: m.banco, titular: m.titular,
      cuentaSoles: m.cuenta_soles ?? undefined, cciSoles: m.cci_soles ?? undefined,
      cuentaDolares: m.cuenta_dolares ?? undefined, cciDolares: m.cci_dolares ?? undefined,
      detraccion: m.es_detraccion,
    })),
  };

  const buffer = await renderToBuffer(createElement(ValorizacionPDF as any, { d }) as any);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Valorizacion-N${val.numero}-${proy.codigo ?? ''}.pdf"`,
    },
  });
}
