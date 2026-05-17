'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ROL_DEFAULT_HOME, type RolSistema } from '@/lib/auth/roles';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  redirect: z.string().optional(),
});

export type LoginActionState = {
  ok: boolean;
  error?: string;
};

export async function loginAction(_prev: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    redirect: formData.get('redirect') || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.session) {
    return { ok: false, error: 'Credenciales incorrectas' };
  }

  // Buscar rol para redirección por defecto
  const { data: profile } = await supabase
    .from('profiles')
    .select('rol, activo')
    .eq('id', data.user.id)
    .single();

  if (!profile?.activo) {
    await supabase.auth.signOut();
    return { ok: false, error: 'Tu cuenta está desactivada. Contacta a gerencia.' };
  }

  const target = parsed.data.redirect && parsed.data.redirect.startsWith('/')
    ? parsed.data.redirect
    : ROL_DEFAULT_HOME[(profile?.rol ?? 'residente') as RolSistema];

  revalidatePath('/', 'layout');
  redirect(target);
}
