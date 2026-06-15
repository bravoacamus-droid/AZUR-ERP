'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';

export type Res = { ok: boolean; error?: string };

const perfilSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  telefono: z.string().optional().or(z.literal('')).transform((v) => (v ? v : null)),
});

export async function actualizarPerfil(input: z.input<typeof perfilSchema>): Promise<Res> {
  const session = await requireSession();
  const parsed = perfilSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ nombre: parsed.data.nombre, telefono: parsed.data.telefono })
    .eq('id', session.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/perfil');
  return { ok: true };
}

const avatarSchema = z.object({ avatar_url: z.string().url('URL inválida') });

export async function guardarAvatar(input: z.input<typeof avatarSchema>): Promise<Res> {
  const session = await requireSession();
  const parsed = avatarSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'URL inválida' };

  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: parsed.data.avatar_url })
    .eq('id', session.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/perfil');
  return { ok: true };
}
