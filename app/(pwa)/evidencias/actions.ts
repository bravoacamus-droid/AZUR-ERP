'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { optionalNumber, optionalString, optionalUuid } from '@/lib/zod-helpers';

const evidenciaSchema = z.object({
  proyecto_id: z.string().uuid(),
  partida_id: optionalUuid(),
  titulo: optionalString(),
  descripcion: optionalString(),
  latitud: optionalNumber(),
  longitud: optionalNumber(),
});

export type SubirEvidenciaState = { ok: boolean; error?: string };

export async function subirEvidencia(
  _prev: SubirEvidenciaState,
  formData: FormData,
): Promise<SubirEvidenciaState> {
  const session = await requireSession();
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { ok: false, error: 'Adjunta una foto' };
  if (file.size > 10 * 1024 * 1024) return { ok: false, error: 'Máximo 10 MB' };

  const parsed = evidenciaSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    partida_id: formData.get('partida_id'),
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion'),
    latitud: formData.get('latitud') || undefined,
    longitud: formData.get('longitud') || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const admin = createAdminClient();
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${parsed.data.proyecto_id}/${session.userId}/${Date.now()}.${ext}`;
  const buf = await file.arrayBuffer();
  const { error: upErr } = await admin.storage
    .from('evidencias')
    .upload(path, new Uint8Array(buf), {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });
  if (upErr) return { ok: false, error: upErr.message };

  const supabase = createClient();
  const { error: insErr } = await supabase.from('evidencias').insert({
    proyecto_id: parsed.data.proyecto_id,
    partida_id: parsed.data.partida_id || null,
    storage_path: path,
    titulo: parsed.data.titulo || null,
    descripcion: parsed.data.descripcion || null,
    latitud: parsed.data.latitud ?? null,
    longitud: parsed.data.longitud ?? null,
    capturada_por: session.userId,
  });
  if (insErr) {
    // rollback storage
    await admin.storage.from('evidencias').remove([path]);
    return { ok: false, error: insErr.message };
  }

  revalidatePath('/evidencias');
  return { ok: true };
}
