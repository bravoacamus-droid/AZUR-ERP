'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';

export type Res = { ok: boolean; error?: string; id?: string };
export type ImportRes = { ok: boolean; error?: string; insertados?: number; duplicados?: number };

const ROLES = ['gerencia', 'presupuestos', 'comercial', 'administrador'] as const;

async function guard() {
  return requireRol([...ROLES]);
}

const opt = (s: z.ZodTypeAny = z.string()) => s.optional().or(z.literal('')).transform((v) => (v ? v : null));
const optUuid = z.string().uuid().optional().or(z.literal('')).transform((v) => (v ? v : null));

// ─────────────────────────── Clientes ───────────────────────────
const clienteSchema = z.object({
  id: z.string().uuid().optional(),
  razon_social: z.string().min(2, 'Razón social requerida'),
  tipo_doc: z.string().min(1).default('RUC'),
  ruc_dni: opt(),
  contacto_nombre: opt(),
  contacto_email: opt(z.string().email('Email inválido').or(z.literal(''))),
  contacto_telefono: opt(),
  ubicacion: opt(),
  origen: z.enum(['directo', 'recomendacion', 'oficina', 'llamada']).optional().or(z.literal('')).transform((v) => (v ? v : null)),
});

export async function guardarCliente(input: z.input<typeof clienteSchema>): Promise<Res> {
  await guard();
  const parsed = clienteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, ...d } = parsed.data;
  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from('clientes').update(d).eq('id', id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data, error } = await supabase.from('clientes').insert(d).select('id').single();
    if (error) return { ok: false, error: error.message };
    revalidatePath('/catalogos');
    return { ok: true, id: data?.id };
  }
  revalidatePath('/catalogos');
  return { ok: true, id };
}

export async function importarClientes(raw: string): Promise<ImportRes> {
  await guard();
  if (!raw?.trim()) return { ok: false, error: 'Pega al menos una fila' };
  const supabase = createClient();

  // Detecta duplicados por ruc_dni contra los existentes
  const { data: existentes } = await supabase.from('clientes').select('ruc_dni');
  const rucsExistentes = new Set((existentes ?? []).map((r) => (r.ruc_dni ?? '').trim()).filter(Boolean));
  const vistos = new Set<string>();

  const filas = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(/\t|,|;/).map((c) => c.trim()));

  const aInsertar: { razon_social: string; ruc_dni: string | null; contacto_nombre: string | null; tipo_doc: string }[] = [];
  let duplicados = 0;

  for (const cols of filas) {
    const razon = cols[0];
    if (!razon) continue;
    const ruc = (cols[1] ?? '').trim() || null;
    const contacto = (cols[2] ?? '').trim() || null;
    if (ruc && (rucsExistentes.has(ruc) || vistos.has(ruc))) {
      duplicados++;
      continue;
    }
    if (ruc) vistos.add(ruc);
    aInsertar.push({ razon_social: razon, ruc_dni: ruc, contacto_nombre: contacto, tipo_doc: ruc && ruc.length === 11 ? 'RUC' : 'DNI' });
  }

  if (aInsertar.length === 0) return { ok: false, error: `Sin filas nuevas para insertar (${duplicados} duplicados)` };

  const { error } = await supabase.from('clientes').insert(aInsertar);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/catalogos');
  return { ok: true, insertados: aInsertar.length, duplicados };
}

// ─────────────────────────── Contrapartes ───────────────────────────
const contraparteSchema = z.object({
  id: z.string().uuid().optional(),
  razon_social: z.string().min(2, 'Razón social requerida'),
  tipo: z.enum(['contratista', 'proveedor', 'ambos']).default('proveedor'),
  ruc_dni: opt(),
  especialidad: opt(),
  contacto: opt(),
  telefono: opt(),
  banco: opt(),
  cuenta: opt(),
  cci: opt(),
});

export async function guardarContraparte(input: z.input<typeof contraparteSchema>): Promise<Res> {
  await guard();
  const parsed = contraparteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, ...d } = parsed.data;
  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from('contrapartes').update(d).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/catalogos');
    return { ok: true, id };
  }
  const { data, error } = await supabase.from('contrapartes').insert(d).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/catalogos');
  return { ok: true, id: data?.id };
}

// ─────────────────────────── Partidas ───────────────────────────
const partidaSchema = z.object({
  id: z.string().uuid().optional(),
  linea_id: optUuid,
  codigo: opt(),
  descripcion: z.string().min(2, 'Descripción requerida'),
  unidad: opt(),
  costo_referencial: z.coerce.number().nonnegative().optional().nullable(),
});

export async function guardarPartida(input: z.input<typeof partidaSchema>): Promise<Res> {
  await guard();
  const parsed = partidaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, costo_referencial, ...rest } = parsed.data;
  const d = { ...rest, costo_referencial: costo_referencial ?? null };
  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from('catalogo_partidas').update(d).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/catalogos');
    return { ok: true, id };
  }
  const { data, error } = await supabase.from('catalogo_partidas').insert(d).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/catalogos');
  return { ok: true, id: data?.id };
}

// ─────────────────────────── Insumos ───────────────────────────
const insumoSchema = z.object({
  id: z.string().uuid().optional(),
  codigo: opt(),
  nombre: z.string().min(2, 'Nombre requerido'),
  unidad: opt(),
  precio: z.coerce.number().nonnegative().optional().nullable(),
  tipo: opt(),
});

export async function guardarInsumo(input: z.input<typeof insumoSchema>): Promise<Res> {
  await guard();
  const parsed = insumoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, precio, ...rest } = parsed.data;
  const d = { ...rest, precio: precio ?? null };
  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from('catalogo_insumos').update(d).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/catalogos');
    return { ok: true, id };
  }
  const { data, error } = await supabase.from('catalogo_insumos').insert(d).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/catalogos');
  return { ok: true, id: data?.id };
}

// ─────────────────────────── Plantillas ───────────────────────────
const plantillaSchema = z.object({
  id: z.string().uuid().optional(),
  linea_id: optUuid,
  nombre: z.string().min(2, 'Nombre requerido'),
  condiciones: opt(),
  servicios_incluidos: opt(),
  servicios_omitidos: opt(),
  garantia: opt(),
});

export async function guardarPlantilla(input: z.input<typeof plantillaSchema>): Promise<Res> {
  await guard();
  const parsed = plantillaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, ...d } = parsed.data;
  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from('plantillas_cotizacion').update(d).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/catalogos');
    return { ok: true, id };
  }
  const { data, error } = await supabase.from('plantillas_cotizacion').insert(d).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/catalogos');
  return { ok: true, id: data?.id };
}

// ─────────────────────────── Medios de pago ───────────────────────────
const medioSchema = z.object({
  id: z.string().uuid().optional(),
  banco: z.string().min(2, 'Banco requerido'),
  titular: z.string().min(2, 'Titular requerido'),
  cuenta_soles: opt(),
  cci_soles: opt(),
  cuenta_dolares: opt(),
  cci_dolares: opt(),
  es_detraccion: z.coerce.boolean().default(false),
});

export async function guardarMedioPago(input: z.input<typeof medioSchema>): Promise<Res> {
  await guard();
  const parsed = medioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, ...d } = parsed.data;
  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from('medios_pago_empresa').update(d).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/catalogos');
    return { ok: true, id };
  }
  const { data, error } = await supabase.from('medios_pago_empresa').insert(d).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/catalogos');
  return { ok: true, id: data?.id };
}

// ─────────────────────────── Eliminar (genérico) ───────────────────────────
const TABLAS = {
  clientes: 'clientes',
  contrapartes: 'contrapartes',
  partidas: 'catalogo_partidas',
  insumos: 'catalogo_insumos',
  plantillas: 'plantillas_cotizacion',
  medios: 'medios_pago_empresa',
} as const;

export type TablaCatalogo = keyof typeof TABLAS;

export async function eliminarRegistro(tabla: TablaCatalogo, id: string): Promise<Res> {
  await guard();
  const nombre = TABLAS[tabla];
  if (!nombre) return { ok: false, error: 'Tabla inválida' };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  const supabase = createClient();
  const { error } = await supabase.from(nombre).delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/catalogos');
  return { ok: true, id };
}

// ── Actualización masiva de precios (Sec. 3.5) ──────────────────────────
// factorPct: +5 sube 5%, -10 baja 10%. destino: insumos | partidas | ambos.
export async function actualizarPreciosMasivo(input: { destino: 'insumos' | 'partidas' | 'ambos'; factorPct: number; tipoInsumo?: string }): Promise<Res & { actualizados?: number; borradores?: number }> {
  await guard();
  const supabase = createClient();
  const factor = 1 + Number(input.factorPct) / 100;
  if (!isFinite(factor) || factor <= 0) return { ok: false, error: 'Factor inválido' };
  let actualizados = 0;

  if (input.destino === 'insumos' || input.destino === 'ambos') {
    let q = supabase.from('catalogo_insumos').select('id, precio');
    if (input.tipoInsumo) q = q.eq('tipo', input.tipoInsumo);
    const { data: ins } = await q;
    for (const r of ins ?? []) {
      await supabase.from('catalogo_insumos').update({ precio: Math.round(Number(r.precio) * factor * 100) / 100 }).eq('id', r.id);
      actualizados++;
    }
  }
  if (input.destino === 'partidas' || input.destino === 'ambos') {
    const { data: par } = await supabase.from('catalogo_partidas').select('id, costo_referencial');
    for (const r of par ?? []) {
      await supabase.from('catalogo_partidas').update({ costo_referencial: Math.round(Number(r.costo_referencial) * factor * 100) / 100 }).eq('id', r.id);
      actualizados++;
    }
  }

  // Aviso: cotizaciones enviadas que podrían quedar desactualizadas
  const { data: enviadas } = await supabase.from('cotizaciones').select('id').in('estado', ['enviada', 'en_negociacion']);

  revalidatePath('/catalogos');
  return { ok: true, actualizados, borradores: enviadas?.length ?? 0 };
}
