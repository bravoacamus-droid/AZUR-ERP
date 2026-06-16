'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';

const schema = z.object({
  proyecto_id: z.string().uuid(),
  fecha: z.string(),
  trabajadores: z.array(z.object({
    trabajador_nombre: z.string().min(1),
    presente: z.boolean(),
    horas: z.number().nullable().optional(),
  })).min(1),
});

type Res = { ok: boolean; error?: string };

export async function guardarTareo(input: z.input<typeof schema>): Promise<Res> {
  const session = await requireSession();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos incompletos' };
  const d = parsed.data;
  const supabase = createClient();
  const { error } = await supabase.from('tareo').insert(
    d.trabajadores.map((t) => ({
      proyecto_id: d.proyecto_id,
      fecha: d.fecha,
      trabajador_nombre: t.trabajador_nombre,
      presente: t.presente,
      horas: t.horas ?? null,
      created_by: session.id,
    })),
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath('/campo/tareo');
  return { ok: true };
}
