'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireModulo } from '@/lib/auth';

export type Res = { ok: boolean; error?: string; id?: string };

// Gastos de empresa (EEFF): los CARGA Administración; Gerencia solo los ve
// (confirmado por David). El resto de roles no accede.
async function guardEscritura() {
  const session = await requireModulo('finanzas', 'editar');
  if (session.rol !== 'administrador') {
    return { session: null, error: 'Solo Administración registra los gastos de empresa (Gerencia los visualiza).' };
  }
  return { session, error: null as string | null };
}

function revalidar() {
  revalidatePath('/finanzas');
  revalidatePath('/reportes');
}

// ─────────────────────────── Categorías (editables) ───────────────────────────
const catSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(2, 'Nombre requerido'),
  orden: z.coerce.number().int().default(0),
  activo: z.coerce.boolean().default(true),
});

export async function guardarCategoriaEmpresa(input: z.input<typeof catSchema>): Promise<Res> {
  const { session, error: gErr } = await guardEscritura();
  if (!session) return { ok: false, error: gErr! };
  const parsed = catSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, ...d } = parsed.data;
  const supabase = createClient() as any;
  if (id) {
    const { error } = await supabase.from('categorias_gasto_empresa').update(d).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidar();
    return { ok: true, id };
  }
  const { data, error } = await supabase.from('categorias_gasto_empresa').insert(d).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidar();
  return { ok: true, id: data?.id };
}

export async function eliminarCategoriaEmpresa(id: string): Promise<Res> {
  const { session, error: gErr } = await guardEscritura();
  if (!session) return { ok: false, error: gErr! };
  const supabase = createClient() as any;
  // Si ya se usó en algún gasto, se desactiva en vez de borrar (no perder histórico).
  const { count } = await supabase.from('gastos_empresa').select('id', { count: 'exact', head: true }).eq('categoria_id', id);
  if ((count ?? 0) > 0) {
    const { error } = await supabase.from('categorias_gasto_empresa').update({ activo: false }).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidar();
    return { ok: true, id };
  }
  const { error } = await supabase.from('categorias_gasto_empresa').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidar();
  return { ok: true, id };
}

// ─────────────────────────── Gasto de empresa ───────────────────────────
const gastoSchema = z.object({
  id: z.string().uuid().optional(),
  fecha: z.string().min(8, 'Fecha requerida'),
  categoria_id: z.string().uuid().optional().or(z.literal('')).transform((v) => (v ? v : null)),
  proyecto_id: z.string().uuid().optional().or(z.literal('')).transform((v) => (v ? v : null)),
  descripcion: z.string().optional().or(z.literal('')).transform((v) => (v ? v : null)),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  sustento_url: z.string().optional().or(z.literal('')).transform((v) => (v ? v : null)),
});

export async function guardarGastoEmpresa(input: z.input<typeof gastoSchema>): Promise<Res> {
  const { session, error: gErr } = await guardEscritura();
  if (!session) return { ok: false, error: gErr! };
  const parsed = gastoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, ...d } = parsed.data;
  const supabase = createClient() as any;
  const admin = createAdminClient() as any;

  // Snapshot del nombre de categoría y línea heredada del proyecto (si hay).
  let categoria: string | null = null;
  if (d.categoria_id) {
    const { data: c } = await admin.from('categorias_gasto_empresa').select('nombre').eq('id', d.categoria_id).single();
    categoria = c?.nombre ?? null;
  }
  let linea_id: string | null = null;
  if (d.proyecto_id) {
    const { data: p } = await admin.from('proyectos').select('linea_id').eq('id', d.proyecto_id).single();
    linea_id = p?.linea_id ?? null;
  }

  const row = { ...d, categoria, linea_id };
  if (id) {
    const { error } = await supabase.from('gastos_empresa').update(row).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidar();
    return { ok: true, id };
  }
  const { data, error } = await supabase
    .from('gastos_empresa')
    .insert({ ...row, created_by: session.id })
    .select('id')
    .single();
  if (error) return { ok: false, error: error.message };
  revalidar();
  return { ok: true, id: data?.id };
}

export async function eliminarGastoEmpresa(id: string): Promise<Res> {
  const { session, error: gErr } = await guardEscritura();
  if (!session) return { ok: false, error: gErr! };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  const supabase = createClient() as any;
  const { error } = await supabase.from('gastos_empresa').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidar();
  return { ok: true, id };
}
