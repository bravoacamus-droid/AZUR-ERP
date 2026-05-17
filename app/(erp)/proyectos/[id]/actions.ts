'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';

const actualizarMetradoSchema = z.object({
  partida_id: z.string().uuid(),
  proyecto_id: z.string().uuid(),
  metrado_ejecutado: z.coerce.number().min(0),
});

export async function actualizarMetradoEjecutado(formData: FormData) {
  await requireSession();
  const parsed = actualizarMetradoSchema.safeParse({
    partida_id: formData.get('partida_id'),
    proyecto_id: formData.get('proyecto_id'),
    metrado_ejecutado: formData.get('metrado_ejecutado'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  const supabase = createClient();
  const { error } = await supabase
    .from('proyecto_partidas')
    .update({ metrado_ejecutado: parsed.data.metrado_ejecutado })
    .eq('id', parsed.data.partida_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${parsed.data.proyecto_id}`);
}

const cambiarEstadoSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['planificado', 'en_curso', 'pausado', 'cerrado', 'cancelado']),
});

export async function cambiarEstadoProyecto(formData: FormData) {
  await requireSession();
  const parsed = cambiarEstadoSchema.safeParse({
    id: formData.get('id'),
    estado: formData.get('estado'),
  });
  if (!parsed.success) throw new Error('Datos inválidos');

  const supabase = createClient();
  const patch =
    parsed.data.estado === 'cerrado'
      ? { estado: parsed.data.estado, fecha_fin_real: new Date().toISOString().slice(0, 10) }
      : { estado: parsed.data.estado };

  const { error } = await supabase.from('proyectos').update(patch).eq('id', parsed.data.id);
  if (error) throw new Error(error.message);

  revalidatePath('/proyectos');
  revalidatePath(`/proyectos/${parsed.data.id}`);
}
