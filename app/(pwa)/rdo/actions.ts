'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';

const rdoSchema = z.object({
  proyecto_id: z.string().uuid(),
  fecha: z.string(),
  clima: z.enum(['soleado', 'nublado', 'lluvioso', 'tormenta', 'nuboso']).optional().or(z.literal('')),
  temperatura_c: z.coerce.number().optional(),
  resumen: z.string().min(5),
  observaciones: z.string().optional().or(z.literal('')),
  incidencias: z.string().optional().or(z.literal('')),
  personal_total: z.coerce.number().int().min(0).default(0),
});

export type CrearRdoState = { ok: boolean; error?: string };

export async function crearRdo(
  _prev: CrearRdoState,
  formData: FormData,
): Promise<CrearRdoState> {
  const session = await requireSession();
  const parsed = rdoSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    fecha: formData.get('fecha'),
    clima: formData.get('clima') || undefined,
    temperatura_c: formData.get('temperatura_c') || undefined,
    resumen: formData.get('resumen'),
    observaciones: formData.get('observaciones'),
    incidencias: formData.get('incidencias'),
    personal_total: formData.get('personal_total') || 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('rdo_partes')
    .upsert(
      {
        proyecto_id: parsed.data.proyecto_id,
        fecha: parsed.data.fecha,
        clima: (parsed.data.clima as 'soleado' | 'nublado' | 'lluvioso' | 'tormenta' | 'nuboso') || null,
        temperatura_c: parsed.data.temperatura_c ?? null,
        resumen: parsed.data.resumen,
        observaciones: parsed.data.observaciones || null,
        incidencias: parsed.data.incidencias || null,
        personal_total: parsed.data.personal_total,
        reportado_por: session.userId,
      },
      { onConflict: 'proyecto_id,fecha' },
    )
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo guardar el RDO' };
  }

  revalidatePath('/rdo');
  redirect('/rdo');
}
