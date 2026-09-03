'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';

export type Res = { ok: boolean; error?: string; id?: string };

// Configuración es un maestro sensible: solo gerencia (módulo 'configuracion').
async function guard() {
  return requireModulo('configuracion', 'editar');
}

// Revalida las pantallas que consumen estos maestros.
function revalidar() {
  revalidatePath('/configuracion');
  revalidatePath('/comercial');
  revalidatePath('/comercial/nueva');
}

// ─────────────────────────── Líneas de negocio ───────────────────────────
const lineaSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(2, 'Nombre requerido'),
  codigo: z.string().min(1, 'Código requerido').max(12, 'Máx. 12 caracteres'),
  color: z.string().regex(/^#?[0-9a-fA-F]{6}$/, 'Color inválido').optional().or(z.literal('')),
  activo: z.coerce.boolean().default(true),
});

export async function guardarLinea(input: z.input<typeof lineaSchema>): Promise<Res> {
  await guard();
  const parsed = lineaSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, color, ...rest } = parsed.data;
  const d = { ...rest, codigo: rest.codigo.toUpperCase().trim(), color: color ? (color.startsWith('#') ? color : `#${color}`) : '#E20627' };
  const supabase = createClient();
  if (id) {
    const { error } = await supabase.from('lineas_negocio').update(d).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidar();
    return { ok: true, id };
  }
  const { data, error } = await supabase.from('lineas_negocio').insert(d).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidar();
  return { ok: true, id: data?.id };
}

export async function toggleLinea(id: string, activo: boolean): Promise<Res> {
  await guard();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  const supabase = createClient();
  const { error } = await supabase.from('lineas_negocio').update({ activo }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidar();
  return { ok: true, id };
}

// ─────────────────────────── Tipos de servicio ───────────────────────────
const servicioSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(2, 'Nombre requerido'),
  orden: z.coerce.number().int().default(0),
  activo: z.coerce.boolean().default(true),
});

export async function guardarTipoServicio(input: z.input<typeof servicioSchema>): Promise<Res> {
  await guard();
  const parsed = servicioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, ...d } = parsed.data;
  const supabase = createClient() as any;
  if (id) {
    const { error } = await supabase.from('tipos_servicio').update(d).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidar();
    return { ok: true, id };
  }
  const { data, error } = await supabase.from('tipos_servicio').insert(d).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidar();
  return { ok: true, id: data?.id };
}

export async function toggleTipoServicio(id: string, activo: boolean): Promise<Res> {
  await guard();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  const supabase = createClient() as any;
  const { error } = await supabase.from('tipos_servicio').update({ activo }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidar();
  return { ok: true, id };
}

export async function eliminarTipoServicio(id: string): Promise<Res> {
  await guard();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  const supabase = createClient() as any;
  const { error } = await supabase.from('tipos_servicio').delete().eq('id', id);
  if (error) {
    // FK: hay cotizaciones que lo usan → no se puede borrar, mejor desactivar.
    if (error.code === '23503' || /foreign key/i.test(error.message)) {
      return { ok: false, error: 'Hay cotizaciones que usan este servicio. Desactívalo en lugar de eliminarlo.' };
    }
    return { ok: false, error: error.message };
  }
  revalidar();
  return { ok: true, id };
}
