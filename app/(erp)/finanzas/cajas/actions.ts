'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { optionalString, optionalUuid } from '@/lib/zod-helpers';

const ROLES_CAJA = ['gerencia_general', 'jefe_proyectos', 'jefe_presupuestos', 'administrador'] as const;

export type CajaActionState = { ok: boolean; error?: string; savedAt?: number };

// ---------------------------------------------------------------------
// Crear caja (central o por proyecto)
// ---------------------------------------------------------------------
const crearCajaSchema = z.object({
  nombre: z.string().min(3),
  tipo: z.enum(['central', 'proyecto']),
  proyecto_id: optionalUuid(),
  moneda: z.enum(['PEN', 'USD']).default('PEN'),
  saldo_inicial: z.coerce.number().min(0).default(0),
});

export async function crearCaja(
  _prev: CajaActionState,
  formData: FormData,
): Promise<CajaActionState> {
  const session = await requireSession();
  if (!ROLES_CAJA.includes(session.rol as (typeof ROLES_CAJA)[number])) {
    return { ok: false, error: 'No tienes permisos para crear cajas' };
  }

  const parsed = crearCajaSchema.safeParse({
    nombre: formData.get('nombre'),
    tipo: formData.get('tipo'),
    proyecto_id: formData.get('proyecto_id'),
    moneda: formData.get('moneda'),
    saldo_inicial: formData.get('saldo_inicial') || 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  if (parsed.data.tipo === 'proyecto' && !parsed.data.proyecto_id) {
    return { ok: false, error: 'Selecciona un proyecto para la caja chica' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('cajas').insert({
    nombre: parsed.data.nombre,
    tipo: parsed.data.tipo,
    proyecto_id: parsed.data.tipo === 'central' ? null : parsed.data.proyecto_id ?? null,
    moneda: parsed.data.moneda,
    saldo_inicial: parsed.data.saldo_inicial,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/finanzas/cajas');
  return { ok: true, savedAt: Date.now() };
}

// ---------------------------------------------------------------------
// Movimiento de caja (entrada/salida)
// ---------------------------------------------------------------------
const movimientoSchema = z.object({
  caja_id: z.string().uuid(),
  tipo: z.enum(['entrada', 'salida']),
  fecha: z.string(),
  concepto: z.string().min(3),
  monto: z.coerce.number().min(0.01),
  referencia: optionalString(),
});

export async function registrarMovimiento(
  _prev: CajaActionState,
  formData: FormData,
): Promise<CajaActionState> {
  const session = await requireSession();
  if (!ROLES_CAJA.includes(session.rol as (typeof ROLES_CAJA)[number])) {
    return { ok: false, error: 'No tienes permisos' };
  }

  const parsed = movimientoSchema.safeParse({
    caja_id: formData.get('caja_id'),
    tipo: formData.get('tipo'),
    fecha: formData.get('fecha'),
    concepto: formData.get('concepto'),
    monto: formData.get('monto'),
    referencia: formData.get('referencia'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('caja_movimientos').insert({
    caja_id: parsed.data.caja_id,
    tipo: parsed.data.tipo,
    fecha: parsed.data.fecha,
    concepto: parsed.data.concepto,
    monto: parsed.data.monto,
    referencia: parsed.data.referencia || null,
    registrado_por: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/finanzas/cajas');
  revalidatePath(`/finanzas/cajas/${parsed.data.caja_id}`);
  return { ok: true, savedAt: Date.now() };
}

// ---------------------------------------------------------------------
// Traslado entre cajas (genera 2 movimientos correlacionados)
// ---------------------------------------------------------------------
const trasladoSchema = z.object({
  caja_origen: z.string().uuid(),
  caja_destino: z.string().uuid(),
  monto: z.coerce.number().min(0.01),
  fecha: z.string(),
  concepto: z.string().min(3),
});

export async function trasladarEntreCajas(
  _prev: CajaActionState,
  formData: FormData,
): Promise<CajaActionState> {
  const session = await requireSession();
  if (!ROLES_CAJA.includes(session.rol as (typeof ROLES_CAJA)[number])) {
    return { ok: false, error: 'No tienes permisos' };
  }

  const parsed = trasladoSchema.safeParse({
    caja_origen: formData.get('caja_origen'),
    caja_destino: formData.get('caja_destino'),
    monto: formData.get('monto'),
    fecha: formData.get('fecha'),
    concepto: formData.get('concepto'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }
  if (parsed.data.caja_origen === parsed.data.caja_destino) {
    return { ok: false, error: 'Origen y destino deben ser distintos' };
  }

  const supabase = createClient();
  const ref = `TRA-${Date.now()}`;

  const { error: outErr } = await supabase.from('caja_movimientos').insert({
    caja_id: parsed.data.caja_origen,
    tipo: 'traslado_out',
    fecha: parsed.data.fecha,
    concepto: `${parsed.data.concepto} (traslado salida)`,
    monto: parsed.data.monto,
    referencia: ref,
    registrado_por: session.userId,
  });
  if (outErr) return { ok: false, error: outErr.message };

  const { error: inErr } = await supabase.from('caja_movimientos').insert({
    caja_id: parsed.data.caja_destino,
    tipo: 'traslado_in',
    fecha: parsed.data.fecha,
    concepto: `${parsed.data.concepto} (traslado entrada)`,
    monto: parsed.data.monto,
    referencia: ref,
    registrado_por: session.userId,
  });
  if (inErr) return { ok: false, error: inErr.message };

  revalidatePath('/finanzas/cajas');
  return { ok: true, savedAt: Date.now() };
}
