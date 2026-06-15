'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';

type Res = { ok: boolean; error?: string };

const ROLES_ALERTAS = ['gerencia', 'jefe_proyectos', 'administrador'] as const;

const resolverSchema = z.object({ id: z.string().uuid() });

export async function resolverAlerta(input: z.input<typeof resolverSchema>): Promise<Res> {
  await requireRol([...ROLES_ALERTAS]);
  const parsed = resolverSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Alerta inválida' };

  const supabase = createClient();
  const { error } = await supabase
    .from('alertas')
    .update({ resuelta: true })
    .eq('id', parsed.data.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/alertas');
  return { ok: true };
}
