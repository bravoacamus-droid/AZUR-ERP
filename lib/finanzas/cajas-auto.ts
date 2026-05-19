/**
 * Helpers para auto-movimientos de caja al pagar solicitudes / cobrar valorizaciones.
 * Se llaman desde server actions con el cliente Supabase ya autenticado.
 *
 * Estrategia: si no existe la caja correspondiente, NO falla — solo se omite
 * silenciosamente. AZUR puede registrar manualmente más tarde si lo necesita.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type SB = SupabaseClient<Database>;

async function findCajaCentral(
  supabase: SB,
  moneda: string,
): Promise<{ id: string; nombre: string } | null> {
  const { data } = await supabase
    .from('cajas')
    .select('id, nombre')
    .eq('tipo', 'central')
    .eq('moneda', moneda)
    .eq('activo', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

async function findCajaChica(
  supabase: SB,
  proyectoId: string,
  moneda: string,
): Promise<{ id: string; nombre: string } | null> {
  const { data } = await supabase
    .from('cajas')
    .select('id, nombre')
    .eq('tipo', 'proyecto')
    .eq('proyecto_id', proyectoId)
    .eq('moneda', moneda)
    .eq('activo', true)
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * Cuando una solicitud_pago se marca como pagada, registra el movimiento
 * automático en la(s) caja(s) correspondiente(s).
 *
 * - categoria === 'caja_chica': traslado central → chica del proyecto
 * - cualquier otra: salida de caja central
 *
 * No revierte la operación si no hay caja registrada — solo log silencioso.
 * Retorna metadata para que el caller pueda mostrar feedback si quiere.
 */
export async function autoMovimientoPorPago(
  supabase: SB,
  args: {
    userId: string;
    solicitudId: string;
  },
): Promise<{ tipo: 'traslado' | 'salida' | 'omitido'; razon?: string }> {
  const { data: sol } = await supabase
    .from('solicitudes_pago')
    .select('id, codigo, categoria, beneficiario, monto, moneda, proyecto_id')
    .eq('id', args.solicitudId)
    .single();

  if (!sol) return { tipo: 'omitido', razon: 'Solicitud no encontrada' };

  const moneda = sol.moneda;
  const fecha = new Date().toISOString().slice(0, 10);
  const cajaCentral = await findCajaCentral(supabase, moneda);

  if (!cajaCentral) {
    return {
      tipo: 'omitido',
      razon: `Sin caja central en ${moneda} — registra el movimiento manualmente`,
    };
  }

  // Caso A: reposición de caja chica → traslado
  if (sol.categoria === 'caja_chica') {
    const cajaChica = await findCajaChica(supabase, sol.proyecto_id, moneda);
    if (!cajaChica) {
      // Salida normal de central (no hay caja chica destino)
      await supabase.from('caja_movimientos').insert({
        caja_id: cajaCentral.id,
        tipo: 'salida',
        fecha,
        concepto: `Pago ${sol.codigo} a ${sol.beneficiario} (sin caja chica destino)`,
        monto: Number(sol.monto),
        referencia: sol.codigo,
        registrado_por: args.userId,
      });
      return {
        tipo: 'salida',
        razon: `Sin caja chica del proyecto — solo se debitó ${cajaCentral.nombre}`,
      };
    }

    // Traslado: 2 movimientos correlacionados
    const ref = `AUTO-${sol.codigo}`;
    await supabase.from('caja_movimientos').insert([
      {
        caja_id: cajaCentral.id,
        tipo: 'traslado_out',
        fecha,
        concepto: `Reposición a ${cajaChica.nombre} (${sol.codigo})`,
        monto: Number(sol.monto),
        referencia: ref,
        registrado_por: args.userId,
      },
      {
        caja_id: cajaChica.id,
        tipo: 'traslado_in',
        fecha,
        concepto: `Reposición desde ${cajaCentral.nombre} (${sol.codigo})`,
        monto: Number(sol.monto),
        referencia: ref,
        registrado_por: args.userId,
      },
    ]);
    return { tipo: 'traslado' };
  }

  // Caso B: pago a proveedor/contratista/etc → salida de caja central
  await supabase.from('caja_movimientos').insert({
    caja_id: cajaCentral.id,
    tipo: 'salida',
    fecha,
    concepto: `Pago ${sol.codigo} a ${sol.beneficiario}`,
    monto: Number(sol.monto),
    referencia: sol.codigo,
    registrado_por: args.userId,
  });
  return { tipo: 'salida' };
}

/**
 * Cuando una valorización pasa a 'pagada', registra entrada en caja central.
 */
export async function autoMovimientoPorCobroValorizacion(
  supabase: SB,
  args: {
    userId: string;
    valorizacionId: string;
  },
): Promise<{ tipo: 'entrada' | 'omitido'; razon?: string }> {
  const { data: val } = await supabase
    .from('valorizaciones')
    .select('id, codigo, proyecto:proyecto_id(moneda)')
    .eq('id', args.valorizacionId)
    .single();

  if (!val) return { tipo: 'omitido', razon: 'Valorización no encontrada' };
  const proyecto = Array.isArray(val.proyecto) ? val.proyecto[0] : val.proyecto;
  const moneda = (proyecto?.moneda as string) ?? 'PEN';

  const { data: totales } = await supabase
    .from('v_valorizacion_totales')
    .select('monto_a_pagar')
    .eq('id', args.valorizacionId)
    .single();

  const monto = Number(totales?.monto_a_pagar ?? 0);
  if (monto <= 0) return { tipo: 'omitido', razon: 'Monto a pagar es 0' };

  const cajaCentral = await findCajaCentral(supabase, moneda);
  if (!cajaCentral) {
    return { tipo: 'omitido', razon: `Sin caja central en ${moneda}` };
  }

  await supabase.from('caja_movimientos').insert({
    caja_id: cajaCentral.id,
    tipo: 'entrada',
    fecha: new Date().toISOString().slice(0, 10),
    concepto: `Cobro ${val.codigo} (valorización pagada)`,
    monto,
    referencia: val.codigo,
    registrado_por: args.userId,
  });

  return { tipo: 'entrada' };
}
