'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRol } from '@/lib/auth';
import { ROLES } from '@/lib/roles';

export type Res = { ok: boolean; error?: string; id?: string };

async function guard() {
  return requireRol(['gerencia', 'administrador']);
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
