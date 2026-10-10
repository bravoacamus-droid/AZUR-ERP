// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Datos de los dashboards por rol (Gerencia / Jefe de Proyectos /       ║
// ║  Finanzas) — informe AZ-TDR-SIS-001. Se calcula todo en el servidor    ║
// ║  con las mismas reglas que el resto del ERP:                           ║
// ║   · Costos/avance: lib/evm (BAC, PV, EV, AC, SPI, CPI).                 ║
// ║   · Utilidad: igual que la Liquidación (contrato ajustado − costo       ║
// ║     presupuestado / cobrado − gastado).                                 ║
// ║   · Gasto real: solicitudes pagadas/conciliadas sin la reposición de    ║
// ║     caja chica (v_dashboard_proyecto).                                  ║
// ╚══════════════════════════════════════════════════════════════════════╝
import { createClient } from '@/lib/supabase/server';
import { todayLimaISO } from '@/lib/format';
import {
  resumenEvm, serieEvm, porPartida, porContratista, plazos,
  type EvmItem, type EvmValorizacion, type EvmGasto,
} from '@/lib/evm';

/* eslint-disable @typescript-eslint/no-explicit-any */

const MS = 86400000;
const d10 = (x: any): string | null => (x ? String(x).slice(0, 10) : null);
const dias = (a: string, b: string) => Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / MS);
const n = (x: unknown) => Number(x ?? 0) || 0;

import { TRAMOS, type Tramo, type Antiguedad, type DashProyecto, type DashData } from '@/lib/dashboards-tipos';
export { TRAMOS };
export type { Tramo, Antiguedad, DashProyecto, DashData };
const tramoDe = (d: number): Tramo => (d <= 15 ? 'b0' : d <= 30 ? 'b16' : d <= 60 ? 'b31' : 'b61');
const vacio = (): Antiguedad => ({ b0: 0, b16: 0, b31: 0, b61: 0 });

/** Días calendario de un plazo de cotización. */
export function plazoEnDias(valor: number | null | undefined, tipo: string | null | undefined): number | null {
  const v = Number(valor);
  if (!v || v <= 0) return null;
  if (tipo === 'semanas') return Math.round(v * 7);
  if (tipo === 'meses') return Math.round(v * 30);
  if (tipo === 'util') return Math.round((v * 7) / 6); // días útiles (lun–sáb) → calendario
  return Math.round(v);
}

const etiquetaDe = (p: { codigo?: string | null; nombre: string }) => {
  const nom = p.nombre.replace(/^PROYECTO\s+/i, '').trim();
  return nom.length > 26 ? `${nom.slice(0, 24)}…` : nom;
};

export async function cargarDashboards(): Promise<DashData> {
  const sb = createClient() as any;
  const hoy = todayLimaISO();

  const [
    { data: proys }, { data: items }, { data: vals }, { data: sols }, { data: abonos }, { data: facturas },
    { data: armadas }, { data: cajas }, { data: cots }, { data: cotItems }, { data: lineas }, { data: servicios },
    { data: contrapartes }, { data: adics }, { data: gastosEmp }, { data: canales }, { data: inversiones },
  ] = await Promise.all([
    sb.from('proyectos').select('id, codigo, nombre, estado, linea_id, cotizacion_id, contrato_total, igv_pct, adelanto_pct, created_at'),
    sb.from('proyecto_items').select('id, proyecto_id, parent_id, nivel, orden, titulo, item_codigo, es_hoja, es_hito, total_costo, fi_proy, fe_proy, fecha_inicio, fecha_entrega, contratista_id'),
    sb.from('valorizaciones').select('id, proyecto_id, numero, semana, fecha_corte, created_at, cobro_neto, valorizacion_items(proyecto_item_id, pct_avance, total)'),
    sb.from('solicitudes_pago').select('id, proyecto_id, tipo, status, monto, pagado_at, fecha_gasto, created_at, fecha_programada, partida_ppto, proyecto_item_id, contraparte_id, beneficiario_nombre, razon_social, pagado_caja_chica'),
    sb.from('abonos_cliente').select('proyecto_id, monto, fecha, es_adelanto, factura_id'),
    sb.from('facturas').select('proyecto_id, monto, monto_cobrado, estado, fecha_emision, created_at'),
    sb.from('cronograma_cobros').select('proyecto_id, monto, estado, fecha_esperada'),
    sb.from('v_cajas_saldos').select('saldo_actual'),
    sb.from('cotizaciones').select('id, estado, fecha, created_at, linea_id, tipo_servicio_id, canal_id, cliente_id, plazo_valor, plazo_tipo, moneda, tipo_cambio, proyecto_id, es_plantilla'),
    sb.from('cotizacion_items').select('cotizacion_id, es_hoja, cantidad, costo_unitario'),
    sb.from('lineas_negocio').select('id, nombre, codigo'),
    sb.from('tipos_servicio').select('id, nombre'),
    sb.from('contrapartes').select('id, razon_social'),
    sb.from('adicionales_deductivos').select('proyecto_id, tipo, monto, estado').eq('estado', 'aprobado'),
    sb.from('gastos_empresa').select('fecha, monto, proyecto_id'),
    sb.from('canales_adquisicion').select('id, nombre, orden').order('orden'),
    sb.from('inversion_marketing').select('canal_id, mes, monto'),
  ]);

  const P = (proys ?? []) as any[];
  const S = (sols ?? []) as any[];
  const cotById = new Map(((cots ?? []) as any[]).map((c) => [c.id, c]));
  const costoCot = new Map<string, number>();
  ((cotItems ?? []) as any[]).forEach((i) => { if (i.es_hoja) costoCot.set(i.cotizacion_id, (costoCot.get(i.cotizacion_id) ?? 0) + n(i.cantidad) * n(i.costo_unitario)); });

  const pagada = (s: any) => s.status === 'pagada' || s.status === 'conciliada';
  const gastoDe = (s: any): EvmGasto => ({
    monto: n(s.monto), fecha: d10(s.pagado_at) ?? d10(s.fecha_gasto), tipo: s.tipo,
    proyecto_item_id: s.proyecto_item_id, partida_ppto: s.partida_ppto, contraparte_id: s.contraparte_id,
    beneficiario: s.razon_social || s.beneficiario_nombre,
  });

  const proyectos: DashProyecto[] = P.map((p) => {
    const its = ((items ?? []) as any[]).filter((i) => i.proyecto_id === p.id) as EvmItem[];
    const vs = ((vals ?? []) as any[]).filter((v) => v.proyecto_id === p.id) as (EvmValorizacion & { cobro_neto: number })[];
    const sp = S.filter((s) => s.proyecto_id === p.id);
    const gastos = sp.filter((s) => pagada(s) && s.tipo !== 'caja_chica').map(gastoDe);
    const r = resumenEvm(its, vs, gastos, hoy);
    const pl = plazos(its);
    const cobrado = ((abonos ?? []) as any[]).filter((a) => a.proyecto_id === p.id).reduce((a, x) => a + n(x.monto), 0);
    const ad = ((adics ?? []) as any[]).filter((a) => a.proyecto_id === p.id);
    const contrato = n(p.contrato_total);
    const contratoAjustado = contrato + ad.filter((a) => a.tipo === 'adicional').reduce((a, x) => a + n(x.monto), 0) - ad.filter((a) => a.tipo === 'deductivo').reduce((a, x) => a + n(x.monto), 0);
    const cot = p.cotizacion_id ? cotById.get(p.cotizacion_id) : null;
    const tc = cot?.moneda === 'USD' ? n(cot?.tipo_cambio) || 1 : 1;
    const costoComercial = cot && costoCot.has(cot.id) ? (costoCot.get(cot.id) ?? 0) * tc : null;
    const utilProy = contratoAjustado - r.bac;
    const utilReal = cobrado - r.ac;
    const plazoComercial = cot ? plazoEnDias(cot.plazo_valor, cot.plazo_tipo) : null;
    const retrasoDias = pl.durPlan != null && pl.durReal != null ? pl.durReal - pl.durPlan : null;
    // Costo del retraso: días de más × costo diario real (o el presupuestado si aún no hay gasto).
    const costoDia = r.ac > 0 && pl.durReal ? r.ac / pl.durReal : pl.durPlan ? r.bac / pl.durPlan : 0;
    const pendContratistas = sp.filter((s) => s.tipo === 'contratistas' && ['solicitada', 'aprobada', 'programada'].includes(s.status));
    return {
      id: p.id, codigo: p.codigo ?? '', nombre: p.nombre, etiqueta: etiquetaDe(p), estado: p.estado, linea_id: p.linea_id,
      contrato, contratoAjustado, cobrado,
      bac: r.bac, pv: r.pv, ev: r.ev, ac: r.ac, spi: r.spi, cpi: r.cpi, avanceReal: r.avanceReal, avanceProy: r.avanceProy,
      costoComercial,
      utilProy, utilProyPct: contratoAjustado > 0 ? utilProy / contratoAjustado : 0,
      utilReal, utilRealPct: contratoAjustado > 0 ? utilReal / contratoAjustado : 0,
      plazoComercial, durPlan: pl.durPlan, durReal: pl.durReal,
      iniPlan: pl.iniPlan, finPlan: pl.finPlan, iniReal: pl.iniReal, finReal: pl.finReal,
      retrasoDias, costoRetraso: retrasoDias != null && retrasoDias > 0 ? retrasoDias * costoDia : retrasoDias != null ? 0 : null,
      partidas: porPartida(its, vs, gastos),
      contratistas: porContratista(its, (contrapartes ?? []) as any[], sp.filter((s) => pagada(s) && s.tipo === 'contratistas').map(gastoDe), pendContratistas.map(gastoDe)),
      porPagarContratistas: pendContratistas.reduce((a, s) => a + n(s.monto), 0),
      serie: serieEvm(its, vs, gastos, hoy).data,
    };
  });

  // ── CxC: valorizaciones emitidas y aún no cobradas (los abonos que no son
  // adelanto se aplican a la más antigua) + facturas manuales abiertas. ──
  const cxc = P.map((p) => {
    const tramos = vacio();
    const vs = ((vals ?? []) as any[]).filter((v) => v.proyecto_id === p.id && n(v.cobro_neto) > 0).sort((a, b) => a.numero - b.numero);
    let aplicado = ((abonos ?? []) as any[]).filter((a) => a.proyecto_id === p.id && !a.es_adelanto && !a.factura_id).reduce((a, x) => a + n(x.monto), 0);
    vs.forEach((v) => {
      const usa = Math.min(aplicado, n(v.cobro_neto));
      aplicado -= usa;
      const pend = n(v.cobro_neto) - usa;
      if (pend > 0.005) tramos[tramoDe(dias(d10(v.fecha_corte) ?? d10(v.created_at) ?? hoy, hoy))] += pend;
    });
    ((facturas ?? []) as any[]).filter((f) => f.proyecto_id === p.id && f.estado !== 'cobrada' && f.estado !== 'anulada').forEach((f) => {
      const pend = n(f.monto) - n(f.monto_cobrado);
      if (pend > 0.005) tramos[tramoDe(dias(d10(f.fecha_emision) ?? d10(f.created_at) ?? hoy, hoy))] += pend;
    });
    return { proyecto_id: p.id, etiqueta: etiquetaDe(p), tramos, total: tramos.b0 + tramos.b16 + tramos.b31 + tramos.b61 };
  }).filter((x) => x.total > 0.005).sort((a, b) => b.total - a.total);

  // ── CxP: solicitudes por pagar (solicitada/aprobada/programada), por días
  // desde su recepción. Igual que el KPI "Por pagar" de Finanzas. ──
  const pendPago = S.filter((s) => ['solicitada', 'aprobada', 'programada'].includes(s.status));
  const cxpMap = new Map<string, { proyecto_id: string | null; etiqueta: string; tramos: Antiguedad; total: number }>();
  pendPago.forEach((s) => {
    const key = s.proyecto_id ?? '_';
    const pr = P.find((p) => p.id === s.proyecto_id);
    const f = cxpMap.get(key) ?? { proyecto_id: s.proyecto_id ?? null, etiqueta: pr ? etiquetaDe(pr) : 'Gastos generales', tramos: vacio(), total: 0 };
    f.tramos[tramoDe(dias(d10(s.created_at) ?? hoy, hoy))] += n(s.monto);
    f.total += n(s.monto);
    cxpMap.set(key, f);
  });
  const cxp = [...cxpMap.values()].sort((a, b) => b.total - a.total);

  // ── Flujo de caja: cobros del cliente vs pagos ejecutados (sin duplicar lo
  // pagado desde caja chica, cuya salida ya es la reposición) + gastos de empresa. ──
  const flujo: DashData['flujo'] = [
    ...((abonos ?? []) as any[]).filter((a) => d10(a.fecha)).map((a) => ({ fecha: d10(a.fecha)!, tipo: 'ingreso' as const, monto: n(a.monto), proyecto_id: a.proyecto_id ?? null })),
    ...S.filter((s) => pagada(s) && !s.pagado_caja_chica && d10(s.pagado_at)).map((s) => ({ fecha: d10(s.pagado_at)!, tipo: 'egreso' as const, monto: n(s.monto), proyecto_id: s.proyecto_id ?? null })),
    ...((gastosEmp ?? []) as any[]).filter((g) => d10(g.fecha)).map((g) => ({ fecha: d10(g.fecha)!, tipo: 'egreso' as const, monto: n(g.monto), proyecto_id: g.proyecto_id ?? null })),
  ];

  // ── Ventas cerradas comercialmente (cotización aceptada → proyecto). Venta
  // sin IGV y costo directo sin margen, para un margen honesto. ──
  const ventas: DashData['ventas'] = P.filter((p) => p.estado !== 'planeacion' || p.cotizacion_id).map((p) => {
    const cot = p.cotizacion_id ? cotById.get(p.cotizacion_id) : null;
    const dp = proyectos.find((x) => x.id === p.id)!;
    const igv = n(p.igv_pct);
    return {
      fecha: d10(cot?.fecha) ?? d10(p.created_at) ?? hoy,
      proyecto_id: p.id,
      linea_id: cot?.linea_id ?? p.linea_id ?? null,
      servicio_id: cot?.tipo_servicio_id ?? null,
      venta: n(p.contrato_total) / (1 + igv),
      costo: dp.costoComercial ?? dp.bac,
    };
  });

  // ── Finanzas: resumen ──
  const saldoCajas = ((cajas ?? []) as any[]).reduce((a, c) => a + n(c.saldo_actual), 0);
  const porPagar = pendPago.reduce((a, s) => a + n(s.monto), 0);
  const porPagarVencido = pendPago.filter((s) => s.status === 'programada' && d10(s.fecha_programada) && d10(s.fecha_programada)! < hoy).reduce((a, s) => a + n(s.monto), 0);
  const porCobrar = cxc.reduce((a, c) => a + c.total, 0);
  const porCobrar60 = cxc.reduce((a, c) => a + c.tramos.b61, 0);
  // Por facturar: lo que el cronograma de cobros ya debía haberse facturado
  // (armadas con fecha vencida) y aún no se cobró ni está por cobrar.
  let porFacturar = 0; let armadasVencidas = 0;
  P.forEach((p) => {
    const venc = ((armadas ?? []) as any[]).filter((a) => a.proyecto_id === p.id && ['pendiente', 'por_facturar'].includes(a.estado) && (a.estado === 'por_facturar' || (d10(a.fecha_esperada) && d10(a.fecha_esperada)! <= hoy)));
    if (!venc.length) return;
    const cob = proyectos.find((x) => x.id === p.id)!.cobrado;
    const pend = cxc.find((c) => c.proyecto_id === p.id)?.total ?? 0;
    const falta = venc.reduce((a, x) => a + n(x.monto), 0) - cob - pend;
    if (falta > 0.005) { porFacturar += falta; armadasVencidas += venc.length; }
  });

  return {
    hoy,
    proyectos,
    cxc,
    cxp,
    flujo,
    ventas,
    cac: {
      canales: ((canales ?? []) as any[]).map((c) => ({ id: c.id, nombre: c.nombre })),
      inversiones: ((inversiones ?? []) as any[]).map((i) => ({ canal_id: i.canal_id, mes: String(i.mes).slice(0, 7), monto: n(i.monto) })),
      cotizaciones: ((cots ?? []) as any[]).filter((c) => !c.es_plantilla).map((c) => ({ canal_id: c.canal_id ?? null, fecha: d10(c.fecha) ?? d10(c.created_at) ?? hoy, estado: c.estado, cliente_id: c.cliente_id ?? null })),
    },
    lineas: ((lineas ?? []) as any[]).map((l) => ({ id: l.id, nombre: l.nombre, codigo: l.codigo })),
    servicios: ((servicios ?? []) as any[]).map((s) => ({ id: s.id, nombre: s.nombre })),
    finanzas: {
      saldoCajas, porPagar, porPagarVencido, porCobrar, porCobrar60, porFacturar, armadasVencidas,
      caja30: saldoCajas - porPagar,
      liquidez: porPagar > 0 ? saldoCajas / porPagar : null,
    },
  };
}
