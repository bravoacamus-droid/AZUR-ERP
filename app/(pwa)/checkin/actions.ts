'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { haversineMeters } from '@/lib/geo/haversine';

const checkSchema = z.object({
  proyecto_id: z.string().uuid(),
  tipo: z.enum(['checkin', 'checkout']),
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
  precision_metros: z.coerce.number().min(0).default(0),
  observaciones: z.string().optional().or(z.literal('')),
});

export type CheckActionResult =
  | { ok: true; distancia_m: number | null; dentro: boolean | null }
  | { ok: false; error: string };

export async function registrarAsistencia(
  _prev: CheckActionResult | null,
  formData: FormData,
): Promise<CheckActionResult> {
  const session = await requireSession();
  const parsed = checkSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    tipo: formData.get('tipo'),
    latitud: formData.get('latitud'),
    longitud: formData.get('longitud'),
    precision_metros: formData.get('precision_metros'),
    observaciones: formData.get('observaciones'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();

  // Calcular distancia al proyecto (si tiene lat/lon)
  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('latitud, longitud, radio_geofence_m')
    .eq('id', parsed.data.proyecto_id)
    .single();

  let distancia: number | null = null;
  let dentro: boolean | null = null;
  if (proyecto?.latitud && proyecto?.longitud) {
    distancia = haversineMeters(
      Number(proyecto.latitud),
      Number(proyecto.longitud),
      parsed.data.latitud,
      parsed.data.longitud,
    );
    const radio = Number(proyecto.radio_geofence_m ?? 200);
    dentro = distancia <= radio;
  }

  const { error } = await supabase.from('asistencias_gps').insert({
    user_id: session.userId,
    proyecto_id: parsed.data.proyecto_id,
    tipo: parsed.data.tipo,
    latitud: parsed.data.latitud,
    longitud: parsed.data.longitud,
    precision_metros: parsed.data.precision_metros,
    distancia_obra_m: distancia,
    dentro_geofence: dentro,
    observaciones: parsed.data.observaciones || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/inicio');
  revalidatePath('/checkin');
  return { ok: true, distancia_m: distancia, dentro };
}
