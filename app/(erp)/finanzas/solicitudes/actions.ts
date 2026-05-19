'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { optionalString, optionalUuid } from '@/lib/zod-helpers';
import { autoMovimientoPorPago } from '@/lib/finanzas/cajas-auto';
import { notifyUser, notifyRoles, ROLES_APROBADORES_PUSH } from '@/lib/push/notify';

const ROLES_APROBADORES = ['gerencia_general', 'jefe_proyectos', 'jefe_presupuestos', 'administrador'] as const;
const ROLES_SOLICITAR = [
  'gerencia_general',
  'jefe_proyectos',
  'jefe_presupuestos',
  'administrador',
  'residente',
] as const;

const crearSchema = z.object({
  proyecto_id: z.string().uuid(),
  partida_id: optionalUuid(),
  categoria: z.enum([
    'proveedor',
    'contratista',
    'jornales',
    'caja_chica',
    'agua',
    'alquiler_equipo',
    'flete',
    'servicios',
    'otros',
  ]),
  concepto: z.string().min(3),
  beneficiario: z.string().min(3),
  monto: z.coerce.number().min(0.01),
  moneda: z.enum(['PEN', 'USD']).default('PEN'),
  urgencia: z.enum(['baja', 'normal', 'alta', 'critica']).default('normal'),
  notas: optionalString(),
});

export type CrearSolicitudState = { ok: boolean; error?: string };

export async function crearSolicitud(
  _prev: CrearSolicitudState,
  formData: FormData,
): Promise<CrearSolicitudState> {
  const session = await requireSession();
  if (!ROLES_SOLICITAR.includes(session.rol as (typeof ROLES_SOLICITAR)[number])) {
    return { ok: false, error: 'No tienes permisos para solicitar pagos' };
  }

  const parsed = crearSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    partida_id: formData.get('partida_id'),
    categoria: formData.get('categoria'),
    concepto: formData.get('concepto'),
    beneficiario: formData.get('beneficiario'),
    monto: formData.get('monto'),
    moneda: formData.get('moneda'),
    urgencia: formData.get('urgencia'),
    notas: formData.get('notas'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('solicitudes_pago')
    .insert({
      proyecto_id: parsed.data.proyecto_id,
      partida_id: parsed.data.partida_id || null,
      categoria: parsed.data.categoria,
      concepto: parsed.data.concepto,
      beneficiario: parsed.data.beneficiario,
      monto: parsed.data.monto,
      moneda: parsed.data.moneda,
      urgencia: parsed.data.urgencia,
      notas: parsed.data.notas || null,
      solicitado_por: session.userId,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo crear la solicitud' };
  }

  revalidatePath('/finanzas/solicitudes');
  revalidatePath('/finanzas/aprobaciones');
  revalidatePath('/solicitudes');

  // Push a aprobadores (fire-and-forget)
  const montoFmt = parsed.data.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 });
  await notifyRoles(ROLES_APROBADORES_PUSH, {
    title: `Nueva solicitud · ${parsed.data.moneda} ${montoFmt}`,
    body: `${parsed.data.concepto} — ${parsed.data.beneficiario}`,
    url: `/finanzas/solicitudes/${data.id}`,
    tag: `solicitud-${data.id}`,
  });

  // El residente vive en la PWA y no puede acceder a /finanzas/*
  const base = session.rol === 'residente' ? '/solicitudes' : '/finanzas/solicitudes';
  redirect(`${base}/${data.id}`);
}

const decidirSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['aprobar_jefe', 'aprobar_gerencia', 'rechazar', 'cancelar']),
  motivo: optionalString(),
});

export async function decidirSolicitud(formData: FormData) {
  const session = await requireSession();
  if (!ROLES_APROBADORES.includes(session.rol as (typeof ROLES_APROBADORES)[number])) {
    throw new Error('No tienes permisos para aprobar');
  }
  const parsed = decidirSchema.safeParse({
    id: formData.get('id'),
    decision: formData.get('decision'),
    motivo: formData.get('motivo'),
  });
  if (!parsed.success) throw new Error('Datos inválidos');

  const supabase = createClient();
  const now = new Date().toISOString();

  let patch: {
    estado: 'aprobada_jefe' | 'rechazada' | 'cancelada';
    aprobada_jefe_por?: string;
    aprobada_jefe_at?: string;
    aprobada_gerencia_por?: string;
    aprobada_gerencia_at?: string;
    rechazada_por?: string;
    rechazada_at?: string;
    motivo_rechazo?: string | null;
  };

  if (parsed.data.decision === 'aprobar_jefe') {
    patch = { estado: 'aprobada_jefe', aprobada_jefe_por: session.userId, aprobada_jefe_at: now };
  } else if (parsed.data.decision === 'aprobar_gerencia') {
    patch = {
      estado: 'aprobada_jefe',
      aprobada_gerencia_por: session.userId,
      aprobada_gerencia_at: now,
    };
  } else if (parsed.data.decision === 'rechazar') {
    patch = {
      estado: 'rechazada',
      rechazada_por: session.userId,
      rechazada_at: now,
      motivo_rechazo: parsed.data.motivo || null,
    };
  } else {
    patch = { estado: 'cancelada' };
  }

  const { error } = await supabase
    .from('solicitudes_pago')
    .update(patch)
    .eq('id', parsed.data.id);
  if (error) throw new Error(error.message);

  // Push al solicitante
  const { data: sol } = await supabase
    .from('solicitudes_pago')
    .select('solicitado_por, concepto, monto, moneda')
    .eq('id', parsed.data.id)
    .single();
  if (sol?.solicitado_por) {
    const montoFmt = Number(sol.monto ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
    let title = '';
    let body = '';
    if (parsed.data.decision === 'aprobar_jefe') {
      title = `✓ Solicitud aprobada · ${sol.moneda} ${montoFmt}`;
      body = `${sol.concepto} — aprobada por jefatura, pendiente programar pago.`;
    } else if (parsed.data.decision === 'aprobar_gerencia') {
      title = `✓ Aprobación final · ${sol.moneda} ${montoFmt}`;
      body = `${sol.concepto} — aprobada por gerencia.`;
    } else if (parsed.data.decision === 'rechazar') {
      title = `✗ Solicitud rechazada · ${sol.moneda} ${montoFmt}`;
      body = parsed.data.motivo ? `Motivo: ${parsed.data.motivo}` : sol.concepto ?? '';
    } else {
      title = 'Solicitud cancelada';
      body = sol.concepto ?? '';
    }
    const base = '/solicitudes'; // ruta común al PWA, residente la abre directo
    await notifyUser(sol.solicitado_por, {
      title,
      body,
      url: `${base}/${parsed.data.id}`,
      tag: `solicitud-${parsed.data.id}`,
    });
  }

  revalidatePath('/finanzas/aprobaciones');
  revalidatePath('/finanzas/solicitudes');
  revalidatePath(`/finanzas/solicitudes/${parsed.data.id}`);
}

const programarPagoSchema = z.object({
  solicitud_id: z.string().uuid(),
  monto: z.coerce.number().min(0.01),
  fecha_programada: z.string(),
  banco_origen: optionalString(),
  cuenta_origen: optionalString(),
  banco_destino: optionalString(),
  cuenta_destino: optionalString(),
  numero_operacion: optionalString(),
  observaciones: optionalString(),
});

export async function programarPago(formData: FormData) {
  const session = await requireSession();
  if (!ROLES_APROBADORES.includes(session.rol as (typeof ROLES_APROBADORES)[number])) {
    throw new Error('No tienes permisos para programar pagos');
  }
  const parsed = programarPagoSchema.safeParse({
    solicitud_id: formData.get('solicitud_id'),
    monto: formData.get('monto'),
    fecha_programada: formData.get('fecha_programada'),
    banco_origen: formData.get('banco_origen'),
    cuenta_origen: formData.get('cuenta_origen'),
    banco_destino: formData.get('banco_destino'),
    cuenta_destino: formData.get('cuenta_destino'),
    numero_operacion: formData.get('numero_operacion'),
    observaciones: formData.get('observaciones'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  const supabase = createClient();
  const { data: sol } = await supabase
    .from('solicitudes_pago')
    .select('moneda, solicitado_por, concepto')
    .eq('id', parsed.data.solicitud_id)
    .single();

  const { error: pagoError } = await supabase.from('pagos').insert({
    solicitud_id: parsed.data.solicitud_id,
    monto: parsed.data.monto,
    moneda: (sol?.moneda as 'PEN' | 'USD') ?? 'PEN',
    fecha_programada: parsed.data.fecha_programada,
    banco_origen: parsed.data.banco_origen || null,
    cuenta_origen: parsed.data.cuenta_origen || null,
    banco_destino: parsed.data.banco_destino || null,
    cuenta_destino: parsed.data.cuenta_destino || null,
    numero_operacion: parsed.data.numero_operacion || null,
    observaciones: parsed.data.observaciones || null,
    programado_por: session.userId,
  });
  if (pagoError) throw new Error(pagoError.message);

  const { error: solError } = await supabase
    .from('solicitudes_pago')
    .update({ estado: 'programada' })
    .eq('id', parsed.data.solicitud_id);
  if (solError) throw new Error(solError.message);

  // Push al solicitante
  if (sol?.solicitado_por) {
    const montoFmt = parsed.data.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 });
    await notifyUser(sol.solicitado_por, {
      title: `📅 Pago programado · ${sol.moneda ?? 'PEN'} ${montoFmt}`,
      body: `${sol.concepto ?? 'Solicitud'} — programado para ${parsed.data.fecha_programada}.`,
      url: `/solicitudes/${parsed.data.solicitud_id}`,
      tag: `solicitud-${parsed.data.solicitud_id}`,
    });
  }

  revalidatePath('/finanzas/solicitudes');
  revalidatePath('/finanzas/pagos');
  revalidatePath(`/finanzas/solicitudes/${parsed.data.solicitud_id}`);
}

export async function subirVoucher(formData: FormData) {
  const session = await requireSession();
  const pagoId = formData.get('pago_id') as string;
  const file = formData.get('file') as File | null;
  if (!pagoId || !file || file.size === 0) throw new Error('Selecciona un archivo');
  if (file.size > 5 * 1024 * 1024) throw new Error('Máximo 5 MB');

  const admin = createAdminClient();
  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase();
  const path = `${pagoId}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: upError } = await admin.storage
    .from('vouchers')
    .upload(path, new Uint8Array(arrayBuffer), {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });
  if (upError) throw new Error(upError.message);

  const supabase = createClient();
  const { data: pago } = await supabase
    .from('pagos')
    .select('solicitud_id, monto, moneda')
    .eq('id', pagoId)
    .single();

  const { error: pagoErr } = await supabase
    .from('pagos')
    .update({
      voucher_path: path,
      fecha_ejecutado: new Date().toISOString().slice(0, 10),
    })
    .eq('id', pagoId);
  if (pagoErr) throw new Error(pagoErr.message);

  if (pago?.solicitud_id) {
    await supabase
      .from('solicitudes_pago')
      .update({ estado: 'pagada' })
      .eq('id', pago.solicitud_id);

    // Auto-movimiento de caja (traslado o salida según categoría)
    try {
      await autoMovimientoPorPago(supabase, {
        userId: session.userId,
        solicitudId: pago.solicitud_id,
      });
      revalidatePath('/finanzas/cajas');
    } catch (err) {
      // No revertir el pago — solo log
      console.error('autoMovimientoPorPago error:', err);
    }

    // Push al solicitante: pago ejecutado
    const { data: solPago } = await supabase
      .from('solicitudes_pago')
      .select('solicitado_por, concepto')
      .eq('id', pago.solicitud_id)
      .single();
    if (solPago?.solicitado_por) {
      const montoFmt = Number(pago.monto ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2 });
      await notifyUser(solPago.solicitado_por, {
        title: `💰 Pago ejecutado · ${pago.moneda ?? 'PEN'} ${montoFmt}`,
        body: `${solPago.concepto ?? 'Solicitud'} — voucher disponible.`,
        url: `/solicitudes/${pago.solicitud_id}`,
        tag: `solicitud-${pago.solicitud_id}`,
      });
    }

    revalidatePath(`/finanzas/solicitudes/${pago.solicitud_id}`);
    revalidatePath(`/solicitudes/${pago.solicitud_id}`);
  }

  revalidatePath('/finanzas/pagos');
  revalidatePath('/finanzas/solicitudes');
}
