'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRol, requireSession } from '@/lib/auth';
import { notifyUser, notifyRoles } from '@/lib/push/notify';
import { fmtMoney } from '@/lib/format';

type Res = { ok: boolean; error?: string; id?: string };

// Umbral configurable que obliga aprobación final de Gerencia (Sección 5.2 / 12).
const UMBRAL_GERENCIA = 20000;

// ── N1: Jefe de Proyectos aprueba ───────────────────────────────────────
export async function aprobarSolicitud(id: string): Promise<Res> {
  const session = await requireRol(['jefe_proyectos', 'gerencia']);
  const supabase = createClient();
  const { error } = await supabase
    .from('solicitudes_pago')
    .update({ status: 'aprobada', aprobado_por: session.id, aprobado_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  await notifyRoles(['administrador'], {
    title: 'Solicitud aprobada — programar pago',
    body: 'Una solicitud fue aprobada y está lista para programar.',
    url: '/finanzas',
  }, 'finanzas');
  revalidatePath('/finanzas');
  return { ok: true };
}

export async function rechazarSolicitud(id: string, motivo: string, devolver = false): Promise<Res> {
  const session = await requireRol(['jefe_proyectos', 'gerencia', 'administrador']);
  const supabase = createClient();
  const admin = createAdminClient();
  const { error } = await supabase
    .from('solicitudes_pago')
    .update({ status: devolver ? 'devuelta' : 'rechazada', motivo_rechazo: motivo })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  const { data: sol } = await admin.from('solicitudes_pago').select('solicitado_por, codigo').eq('id', id).single();
  if (sol?.solicitado_por) {
    await notifyUser(sol.solicitado_por, {
      title: devolver ? 'Solicitud devuelta' : 'Solicitud rechazada',
      body: `${sol.codigo}: ${motivo}`,
      url: '/campo/solicitudes',
    }, 'finanzas');
  }
  revalidatePath('/finanzas');
  return { ok: true };
}

// ── N2: Administrador programa el pago ──────────────────────────────────
export async function programarPago(id: string, banco: string, fecha: string): Promise<Res> {
  const session = await requireRol(['administrador', 'gerencia']);
  const supabase = createClient();
  const { error } = await supabase
    .from('solicitudes_pago')
    .update({ status: 'programada', banco_origen: banco, fecha_programada: fecha, programado_por: session.id, programado_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/finanzas');
  return { ok: true };
}

// ── N2: Administrador marca pagada (sube voucher) ───────────────────────
export async function marcarPagada(
  id: string,
  pago: { voucherUrl: string; detraccion: number; metodo?: string; num_operacion?: string },
): Promise<Res> {
  const session = await requireRol(['administrador', 'gerencia']);
  const supabase = createClient();
  const admin = createAdminClient();

  const { data: sol } = await admin.from('solicitudes_pago').select('*').eq('id', id).single();
  if (!sol) return { ok: false, error: 'No encontrada' };

  const requiereGerencia = Number(sol.monto) >= UMBRAL_GERENCIA && session.rol !== 'gerencia';

  const { error } = await supabase
    .from('solicitudes_pago')
    .update({
      status: 'pagada', voucher_url: pago.voucherUrl || null, detraccion_monto: pago.detraccion || 0,
      metodo: (pago.metodo as never) || null, num_operacion: pago.num_operacion || null,
      pagado_por: session.id, pagado_at: new Date().toISOString(),
      requiere_gerencia: requiereGerencia,
    })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };

  // notificar al solicitante
  if (sol.solicitado_por) {
    await notifyUser(sol.solicitado_por, {
      title: 'Pago realizado',
      body: `${sol.codigo} · ${fmtMoney(Number(sol.monto))}`,
      url: '/campo/solicitudes',
    }, 'finanzas');
  }

  if (requiereGerencia) {
    await notifyRoles(['gerencia'], {
      title: 'Aprobación final requerida',
      body: `${sol.codigo} por ${fmtMoney(Number(sol.monto))} supera el umbral.`,
      url: '/finanzas',
    }, 'finanzas');
  } else {
    await conciliarInterno(id);
  }
  revalidatePath('/finanzas');
  return { ok: true };
}

// ── Gerencia: aprobación final → concilia ───────────────────────────────
export async function aprobarGerencia(id: string): Promise<Res> {
  const session = await requireRol(['gerencia']);
  const supabase = createClient();
  await supabase.from('solicitudes_pago').update({ aprobado_gerencia_por: session.id }).eq('id', id);
  await conciliarInterno(id);
  revalidatePath('/finanzas');
  return { ok: true };
}

// Concilia: imputa el egreso a la caja chica del proyecto si aplica.
async function conciliarInterno(id: string) {
  const admin = createAdminClient();
  const { data: sol } = await admin.from('solicitudes_pago').select('*').eq('id', id).single();
  if (!sol) return;
  await admin.from('solicitudes_pago').update({ status: 'conciliada' }).eq('id', id);

  // egreso de caja chica solo para reposiciones de caja chica
  if (sol.tipo === 'caja_chica' && sol.proyecto_id) {
    const { data: caja } = await admin.from('cajas').select('id').eq('proyecto_id', sol.proyecto_id).eq('tipo', 'chica').limit(1).single();
    if (caja) {
      await admin.from('movimientos_caja').insert({
        caja_id: caja.id, proyecto_id: sol.proyecto_id, tipo: 'egreso', monto: Number(sol.monto),
        concepto: `Reposición caja chica ${sol.codigo}`, referencia_tipo: 'solicitud', referencia_id: id, created_by: sol.pagado_por,
      });
    }
  }
}

// ── CxC: emitir factura desde una armada ────────────────────────────────
export async function emitirFactura(armadaId: string): Promise<Res> {
  await requireRol(['administrador', 'gerencia', 'comercial']);
  const supabase = createClient();
  const { data: arm } = await supabase.from('cronograma_cobros').select('*, proyecto:proyectos(cliente_id)').eq('id', armadaId).single();
  if (!arm) return { ok: false, error: 'Armada no encontrada' };
  const { data: fac, error } = await supabase.from('facturas').insert({
    cliente_id: (arm.proyecto as { cliente_id?: string } | null)?.cliente_id ?? null,
    proyecto_id: arm.proyecto_id, armada_id: armadaId, monto: Number(arm.monto),
    fecha_vencimiento: null, estado: 'emitida',
  }).select('id').single();
  if (error) return { ok: false, error: error.message };
  await supabase.from('cronograma_cobros').update({ estado: 'facturado', factura_id: fac.id }).eq('id', armadaId);
  revalidatePath('/finanzas');
  return { ok: true };
}

export async function crearFacturaManual(input: { cliente_id: string; proyecto_id?: string; numero?: string; monto: number; fecha_vencimiento?: string }): Promise<Res> {
  await requireRol(['administrador', 'gerencia']);
  const supabase = createClient();
  const { error } = await supabase.from('facturas').insert({
    cliente_id: input.cliente_id, proyecto_id: input.proyecto_id || null, numero: input.numero || null,
    monto: input.monto, fecha_vencimiento: input.fecha_vencimiento || null, estado: 'emitida',
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/finanzas');
  return { ok: true };
}

// ── CxC: registrar abono/cobro del cliente ──────────────────────────────
export async function registrarAbono(facturaId: string, monto: number): Promise<Res> {
  const session = await requireRol(['administrador', 'gerencia']);
  const supabase = createClient();
  const admin = createAdminClient();
  const { data: fac } = await admin.from('facturas').select('*').eq('id', facturaId).single();
  if (!fac) return { ok: false, error: 'Factura no encontrada' };

  const nuevoCobrado = Number(fac.monto_cobrado) + monto;
  const estado = nuevoCobrado >= Number(fac.monto) ? 'cobrada' : 'parcial';
  await admin.from('facturas').update({ monto_cobrado: nuevoCobrado, estado }).eq('id', facturaId);
  await admin.from('abonos_cliente').insert({
    factura_id: facturaId, proyecto_id: fac.proyecto_id, monto, metodo: 'Cobranza', created_by: session.id,
  });
  if (estado === 'cobrada' && fac.armada_id) {
    await admin.from('cronograma_cobros').update({ estado: 'cobrado' }).eq('id', fac.armada_id);
  }
  revalidatePath('/finanzas');
  return { ok: true };
}

// ── Cajas: movimiento manual (traslado / reposición / ajuste) ───────────
export async function movimientoCaja(input: { caja_id: string; proyecto_id?: string; tipo: string; monto: number; concepto: string; metodo?: string; num_operacion?: string; voucher_url?: string }): Promise<Res> {
  const session = await requireRol(['administrador', 'gerencia']);
  const supabase = createClient();
  const { error } = await supabase.from('movimientos_caja').insert({
    caja_id: input.caja_id, proyecto_id: input.proyecto_id || null, tipo: input.tipo as never,
    monto: input.monto, concepto: input.concepto, created_by: session.id,
    metodo: (input.metodo as never) || null, num_operacion: input.num_operacion || null, voucher_url: input.voucher_url || null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/finanzas');
  return { ok: true };
}
