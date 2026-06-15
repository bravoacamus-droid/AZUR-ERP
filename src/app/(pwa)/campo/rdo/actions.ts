'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';

const actividadSchema = z.object({
  descripcion: z.string().trim().min(1, 'Descripción requerida'),
  proyecto_item_id: z.string().uuid().nullable(),
  avance_pct: z.number().min(0).max(100).nullable(),
});

const rdoSchema = z.object({
  proyecto_id: z.string().uuid('Selecciona un proyecto'),
  fecha: z.string().min(1, 'Fecha requerida'),
  clima: z.string().trim().nullable(),
  personal_count: z.number().int().min(0).nullable(),
  equipos: z.string().trim().nullable(),
  materiales_recibidos: z.string().trim().nullable(),
  observaciones: z.string().trim().nullable(),
  incidencias: z.string().trim().nullable(),
  actividades: z.array(actividadSchema),
});

export type RdoInput = z.infer<typeof rdoSchema>;
type Res = { ok: boolean; error?: string };

export async function crearRdo(input: RdoInput): Promise<Res> {
  const session = await requireSession();
  const parsed = rdoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;
  const supabase = createClient();

  const { data: parte, error } = await supabase
    .from('partes_diarios')
    .insert({
      proyecto_id: d.proyecto_id,
      fecha: d.fecha,
      clima: d.clima || null,
      personal_count: d.personal_count,
      equipos: d.equipos || null,
      materiales_recibidos: d.materiales_recibidos || null,
      observaciones: d.observaciones || null,
      incidencias: d.incidencias || null,
      created_by: session.id,
    })
    .select('id')
    .single();

  if (error || !parte) return { ok: false, error: error?.message ?? 'No se pudo crear el parte' };

  const actividades = d.actividades.filter((a) => a.descripcion.trim().length > 0);
  if (actividades.length > 0) {
    const { error: actError } = await supabase.from('rdo_actividades').insert(
      actividades.map((a) => ({
        rdo_id: parte.id,
        descripcion: a.descripcion,
        proyecto_item_id: a.proyecto_item_id,
        avance_pct: a.avance_pct,
      })),
    );
    if (actError) return { ok: false, error: actError.message };
  }

  revalidatePath('/campo/rdo');
  return { ok: true };
}
