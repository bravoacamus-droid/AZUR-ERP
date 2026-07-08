'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireModulo } from '@/lib/auth';
import { ROLES } from '@/lib/roles';
import { MODULOS, type Nivel } from '@/lib/permisos';

export type Res = { ok: boolean; error?: string; id?: string };

async function guard() {
  return requireModulo('usuarios', 'editar');
}

// Valida y normaliza el mapa de permisos que llega desde la UI del constructor de roles.
function normalizarPermisosInput(raw: Record<string, string> | undefined): Record<string, Nivel> {
  const out: Record<string, Nivel> = {};
  for (const m of MODULOS) {
    const v = raw?.[m];
    if (v === 'ver' || v === 'editar') out[m] = v; // 'none'/ausente => sin acceso
  }
  return out;
}

const crearSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  rol: z.enum(ROLES),
  telefono: z.string().optional().or(z.literal('')).transform((v) => (v ? v : null)),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export async function crearUsuario(input: z.input<typeof crearSchema>): Promise<Res> {
  await guard();
  const parsed = crearSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: d.email,
    password: d.password,
    email_confirm: true,
    user_metadata: { nombre: d.nombre, rol: d.rol, telefono: d.telefono },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/usuarios');
  return { ok: true, id: data.user?.id };
}

const passSchema = z.object({ id: z.string().uuid(), password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres') });

export async function cambiarPassword(input: z.input<typeof passSchema>): Promise<Res> {
  await guard();
  const parsed = passSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.id, { password: parsed.data.password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: parsed.data.id };
}

const rolSchema = z.object({ id: z.string().uuid(), rol: z.enum(ROLES) });

export async function cambiarRol(input: z.input<typeof rolSchema>): Promise<Res> {
  const session = await guard();
  const parsed = rolSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' };
  if (parsed.data.id === session.id) return { ok: false, error: 'No puedes cambiar tu propio rol' };

  const supabase = createClient();
  const { error } = await supabase.from('profiles').update({ rol: parsed.data.rol }).eq('id', parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/usuarios');
  return { ok: true, id: parsed.data.id };
}

const activoSchema = z.object({ id: z.string().uuid(), activo: z.boolean() });

export async function cambiarActivo(input: z.input<typeof activoSchema>): Promise<Res> {
  const session = await guard();
  const parsed = activoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' };
  if (parsed.data.id === session.id) return { ok: false, error: 'No puedes desactivar tu propia cuenta' };

  const supabase = createClient();
  const { error } = await supabase.from('profiles').update({ activo: parsed.data.activo }).eq('id', parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/usuarios');
  return { ok: true, id: parsed.data.id };
}

// ── Editar datos del usuario (nombre / teléfono / email) ────────────────
const editarSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(2, 'Nombre requerido'),
  telefono: z.string().optional().or(z.literal('')).transform((v) => (v ? v : null)),
  email: z.string().email('Email inválido').optional(),
});

export async function actualizarUsuario(input: z.input<typeof editarSchema>): Promise<Res> {
  await guard();
  const parsed = editarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, nombre, telefono, email } = parsed.data;
  const admin = createAdminClient();
  // El correo vive en auth: se actualiza ahí y se refleja en profiles.
  if (email) {
    const { error: eAuth } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true });
    if (eAuth) return { ok: false, error: eAuth.message };
  }
  const patch: Record<string, unknown> = { nombre, telefono };
  if (email) patch.email = email;
  const { error } = await admin.from('profiles').update(patch as never).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/usuarios');
  return { ok: true, id };
}

// ── Roles personalizados (módulos + nivel Ver/Editar) ───────────────────
const rolPersSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(2, 'Nombre requerido'),
  permisos: z.record(z.string()).optional(),
  activo: z.coerce.boolean().default(true),
});

export async function guardarRolPersonalizado(input: z.input<typeof rolPersSchema>): Promise<Res> {
  await guard();
  const parsed = rolPersSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  const { id, nombre, activo } = parsed.data;
  const permisos = normalizarPermisosInput(parsed.data.permisos);
  const admin = createAdminClient();
  if (id) {
    const { error } = await admin.from('roles_personalizados').update({ nombre, permisos, activo } as never).eq('id', id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/usuarios');
    return { ok: true, id };
  }
  const { data, error } = await admin.from('roles_personalizados').insert({ nombre, permisos } as never).select('id').single();
  if (error) return { ok: false, error: error.message };
  revalidatePath('/usuarios');
  return { ok: true, id: (data as { id: string } | null)?.id };
}

export async function eliminarRolPersonalizado(id: string): Promise<Res> {
  await guard();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: 'ID inválido' };
  const admin = createAdminClient();
  // Desasigna el rol de cualquier usuario y luego lo borra.
  await admin.from('profiles').update({ rol_personalizado_id: null } as never).eq('rol_personalizado_id', id);
  const { error } = await admin.from('roles_personalizados').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/usuarios');
  return { ok: true, id };
}

const asignarSchema = z.object({ id: z.string().uuid(), rol_personalizado_id: z.string().uuid().nullable() });

export async function asignarRolPersonalizado(input: z.input<typeof asignarSchema>): Promise<Res> {
  const session = await guard();
  const parsed = asignarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' };
  if (parsed.data.id === session.id) return { ok: false, error: 'No puedes cambiar tu propio rol' };
  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ rol_personalizado_id: parsed.data.rol_personalizado_id } as never).eq('id', parsed.data.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/usuarios');
  return { ok: true, id: parsed.data.id };
}
