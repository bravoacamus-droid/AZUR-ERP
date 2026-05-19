'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { optionalString } from '@/lib/zod-helpers';

export type SstActionState = { ok: boolean; error?: string; savedAt?: number };

// ---------------------------------------------------------------------
// Charla 5 minutos
// ---------------------------------------------------------------------
const charlaSchema = z.object({
  proyecto_id: z.string().uuid(),
  fecha: z.string(),
  tema: z.string().min(3),
  asistencia: z.coerce.number().int().min(0),
  notas: optionalString(),
});

export async function registrarCharla(
  _prev: SstActionState,
  formData: FormData,
): Promise<SstActionState> {
  const session = await requireSession();
  const parsed = charlaSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    fecha: formData.get('fecha'),
    tema: formData.get('tema'),
    asistencia: formData.get('asistencia'),
    notas: formData.get('notas'),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };

  const supabase = createClient();
  const { error } = await supabase.from('sst_charlas').upsert(
    {
      proyecto_id: parsed.data.proyecto_id,
      fecha: parsed.data.fecha,
      tema: parsed.data.tema,
      asistencia: parsed.data.asistencia,
      notas: parsed.data.notas || null,
      reportada_por: session.userId,
    },
    { onConflict: 'proyecto_id,fecha' },
  );
  if (error) return { ok: false, error: error.message };

  revalidatePath('/sst');
  return { ok: true, savedAt: Date.now() };
}

// ---------------------------------------------------------------------
// Observación
// ---------------------------------------------------------------------
const obsSchema = z.object({
  proyecto_id: z.string().uuid(),
  tipo: z.enum(['acto_inseguro', 'condicion_insegura', 'sugerencia']),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  accion_correctiva: optionalString(),
});

export async function registrarObservacion(
  _prev: SstActionState,
  formData: FormData,
): Promise<SstActionState> {
  const session = await requireSession();
  const parsed = obsSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    tipo: formData.get('tipo'),
    descripcion: formData.get('descripcion'),
    accion_correctiva: formData.get('accion_correctiva'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('sst_observaciones').insert({
    proyecto_id: parsed.data.proyecto_id,
    tipo: parsed.data.tipo,
    descripcion: parsed.data.descripcion,
    accion_correctiva: parsed.data.accion_correctiva || null,
    reportada_por: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/sst');
  return { ok: true, savedAt: Date.now() };
}

// ---------------------------------------------------------------------
// Incidente
// ---------------------------------------------------------------------
const incSchema = z.object({
  proyecto_id: z.string().uuid(),
  severidad: z.enum(['leve', 'moderado', 'grave', 'critico']),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  involucrados: optionalString(),
  acciones: optionalString(),
});

export async function registrarIncidente(
  _prev: SstActionState,
  formData: FormData,
): Promise<SstActionState> {
  const session = await requireSession();
  const parsed = incSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    severidad: formData.get('severidad'),
    descripcion: formData.get('descripcion'),
    involucrados: formData.get('involucrados'),
    acciones: formData.get('acciones'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();
  const { error } = await supabase.from('sst_incidentes').insert({
    proyecto_id: parsed.data.proyecto_id,
    severidad: parsed.data.severidad,
    descripcion: parsed.data.descripcion,
    involucrados: parsed.data.involucrados || null,
    acciones: parsed.data.acciones || null,
    reportado_por: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath('/sst');
  return { ok: true, savedAt: Date.now() };
}
