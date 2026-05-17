'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { ROLES, type RolSistema } from '@/lib/auth/roles';

function ensureGerencia(rol: string) {
  if (rol !== 'gerencia_general') {
    throw new Error('Solo gerencia puede modificar usuarios');
  }
}

const cambiarRolSchema = z.object({
  user_id: z.string().uuid(),
  rol: z.enum(ROLES as unknown as [RolSistema, ...RolSistema[]]),
});

export async function cambiarRol(formData: FormData) {
  const session = await requireSession();
  ensureGerencia(session.rol);

  const parsed = cambiarRolSchema.safeParse({
    user_id: formData.get('user_id'),
    rol: formData.get('rol'),
  });
  if (!parsed.success) throw new Error('Datos inválidos');

  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ rol: parsed.data.rol })
    .eq('id', parsed.data.user_id);
  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
}

export async function toggleActivo(formData: FormData) {
  const session = await requireSession();
  ensureGerencia(session.rol);

  const userId = formData.get('user_id') as string;
  const activoActual = formData.get('activo_actual') === 'true';
  if (!userId) throw new Error('user_id requerido');

  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ activo: !activoActual })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
}

const asignacionSchema = z.object({
  user_id: z.string().uuid(),
  proyecto_id: z.string().uuid(),
  rol_obra: z.enum(['residente', 'coordinador', 'supervisor', 'jefe']),
});

export async function asignarProyecto(formData: FormData) {
  const session = await requireSession();
  ensureGerencia(session.rol);

  const parsed = asignacionSchema.safeParse({
    user_id: formData.get('user_id'),
    proyecto_id: formData.get('proyecto_id'),
    rol_obra: formData.get('rol_obra'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  const supabase = createClient();
  const { error } = await supabase.from('usuario_proyectos').upsert(
    {
      user_id: parsed.data.user_id,
      proyecto_id: parsed.data.proyecto_id,
      rol_obra: parsed.data.rol_obra,
      activo: true,
    },
    { onConflict: 'user_id,proyecto_id' },
  );
  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
}

export async function desasignarProyecto(formData: FormData) {
  const session = await requireSession();
  ensureGerencia(session.rol);

  const userId = formData.get('user_id') as string;
  const proyectoId = formData.get('proyecto_id') as string;
  if (!userId || !proyectoId) throw new Error('Datos inválidos');

  const supabase = createClient();
  const { error } = await supabase
    .from('usuario_proyectos')
    .update({ activo: false })
    .eq('user_id', userId)
    .eq('proyecto_id', proyectoId);
  if (error) throw new Error(error.message);
  revalidatePath('/usuarios');
}
