// Datos del Dashboard Comercial (informe AZ-TDR-SIS-002). Cada cotización
// lleva su importe = total con descuento (el mismo del PDF), en su moneda.
import { createClient } from '@/lib/supabase/server';
import { armarArbol, calcularCostosMargen, calcularTotales } from '@/lib/calc';
import { estadoComercial } from '@/lib/estado-comercial';
import type { DashComercial } from '@/lib/dashboard-comercial-tipos';

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function cargarDashboardComercial(): Promise<DashComercial> {
  const sb = createClient() as any;
  const [{ data: cots }, { data: lineas }, { data: servicios }] = await Promise.all([
    sb.from('cotizaciones')
      .select('id, codigo, proyecto_nombre, estado, revision_estado, fecha, created_at, moneda, linea_id, tipo_servicio_id, gg_pct, ga_pct, utilidad_pct, igv_pct, descuento_pct, descuento_activo, descuento_tipo, descuento_monto, cliente:clientes(razon_social)')
      .eq('es_plantilla', false),
    sb.from('lineas_negocio').select('id, nombre, codigo'),
    sb.from('tipos_servicio').select('id, nombre, orden').order('orden'),
  ]);
  const C = (cots ?? []) as any[];

  // Ítems de todas las cotizaciones, por páginas (Supabase devuelve máx. 1000 filas).
  const items: any[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data } = await sb.from('cotizacion_items')
      .select('id, cotizacion_id, parent_id, nivel, orden, item_codigo, titulo, cantidad, costo_unitario, margen_pct, es_hoja')
      .in('cotizacion_id', C.map((c) => c.id)).order('id').range(desde, desde + 999);
    items.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const porCot = new Map<string, any[]>();
  items.forEach((i) => { const a = porCot.get(i.cotizacion_id) ?? []; a.push(i); porCot.set(i.cotizacion_id, a); });

  const lin = new Map(((lineas ?? []) as any[]).map((l) => [l.id, l.nombre]));
  const ser = new Map(((servicios ?? []) as any[]).map((s) => [s.id, s.nombre]));

  return {
    cotizaciones: C.map((c) => {
      const arbol = armarArbol((porCot.get(c.id) ?? []) as never);
      const calc = calcularCostosMargen(arbol as never);
      const t = calcularTotales(calc, arbol as never, {
        gg_pct: Number(c.gg_pct ?? 0), ga_pct: Number(c.ga_pct ?? 0), utilidad_pct: Number(c.utilidad_pct ?? 0),
        igv_pct: Number(c.igv_pct ?? 0), descuento_pct: Number(c.descuento_pct ?? 0), descuento_activo: !!c.descuento_activo,
        descuento_tipo: c.descuento_tipo === 'monto' ? 'monto' : 'pct', descuento_monto: Number(c.descuento_monto ?? 0),
      });
      return {
        id: c.id,
        codigo: c.codigo ?? '—',
        proyecto: c.proyecto_nombre ?? '',
        cliente: c.cliente?.razon_social ?? '—',
        fecha: String(c.fecha ?? c.created_at ?? '').slice(0, 10),
        estado: estadoComercial(c),
        moneda: c.moneda === 'USD' ? 'USD' : 'PEN',
        importe: Math.round((t.total_con_descuento || 0) * 100) / 100,
        linea_id: c.linea_id ?? null,
        linea: lin.get(c.linea_id) ?? 'Sin línea',
        servicio_id: c.tipo_servicio_id ?? null,
        servicio: ser.get(c.tipo_servicio_id) ?? 'Sin tipo de servicio',
      };
    }),
    lineas: ((lineas ?? []) as any[]).map((l) => ({ id: l.id, nombre: l.nombre })),
  };
}
