'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { optionalString } from '@/lib/zod-helpers';
import { visibilidadesPermitidas } from '@/lib/proyectos/documentos';

export type DocActionState = { ok: boolean; error?: string; savedAt?: number };

const docSchema = z.object({
  proyecto_id: z.string().uuid(),
  titulo: z.string().min(3),
  carpeta: z.enum(['general', 'planos', 'contratos', 'cotizaciones', 'fichas', 'permisos']),
  visibilidad: z.enum(['publica', 'mando', 'gerencia']).default('publica'),
  descripcion: optionalString(),
});

export async function subirDocumentoErp(
  _prev: DocActionState,
  formData: FormData,
): Promise<DocActionState> {
  const session = await requireSession();
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { ok: false, error: 'Selecciona un archivo' };
  if (file.size > 50 * 1024 * 1024) return { ok: false, error: 'Máximo 50 MB' };

  const parsed = docSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    titulo: formData.get('titulo'),
    carpeta: formData.get('carpeta'),
    visibilidad: formData.get('visibilidad') || 'publica',
    descripcion: formData.get('descripcion'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  // Verificar que el rol puede asignar esa visibilidad
  const permitidas = visibilidadesPermitidas(session.rol);
  if (!permitidas.includes(parsed.data.visibilidad)) {
    return {
      ok: false,
      error: `Tu rol no puede asignar visibilidad "${parsed.data.visibilidad}". Permitidas: ${permitidas.join(', ')}`,
    };
  }

  const admin = createAdminClient();
  const safeName = file.name.replace(/[^a-z0-9.\-_]/gi, '_');
  const path = `${parsed.data.proyecto_id}/${parsed.data.carpeta}/${Date.now()}-${safeName}`;
  const buf = await file.arrayBuffer();

  const { error: upErr } = await admin.storage
    .from('documentos')
    .upload(path, new Uint8Array(buf), {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (upErr) return { ok: false, error: upErr.message };

  const supabase = createClient();
  const { error: dbErr } = await supabase.from('documentos_proyecto').insert({
    proyecto_id: parsed.data.proyecto_id,
    titulo: parsed.data.titulo,
    descripcion: parsed.data.descripcion || null,
    carpeta: parsed.data.carpeta,
    visibilidad: parsed.data.visibilidad,
    storage_path: path,
    tipo_mime: file.type || 'application/octet-stream',
    tamano_bytes: file.size,
    subido_por: session.userId,
  });
  if (dbErr) {
    await admin.storage.from('documentos').remove([path]);
    return { ok: false, error: dbErr.message };
  }

  revalidatePath(`/proyectos/${parsed.data.proyecto_id}`);
  revalidatePath(`/proyectos/${parsed.data.proyecto_id}/documentos`);
  return { ok: true, savedAt: Date.now() };
}

const eliminarSchema = z.object({
  id: z.string().uuid(),
  proyecto_id: z.string().uuid(),
});

export async function eliminarDocumento(formData: FormData) {
  await requireSession();
  const parsed = eliminarSchema.safeParse({
    id: formData.get('id'),
    proyecto_id: formData.get('proyecto_id'),
  });
  if (!parsed.success) throw new Error('Datos inválidos');

  const supabase = createClient();
  const admin = createAdminClient();

  // Obtener el storage_path antes de borrar
  const { data: doc } = await supabase
    .from('documentos_proyecto')
    .select('storage_path')
    .eq('id', parsed.data.id)
    .single();

  const { error } = await supabase.from('documentos_proyecto').delete().eq('id', parsed.data.id);
  if (error) throw new Error(error.message);

  // Limpiar storage (best-effort)
  if (doc?.storage_path) {
    await admin.storage.from('documentos').remove([doc.storage_path]);
  }

  revalidatePath(`/proyectos/${parsed.data.proyecto_id}/documentos`);
  revalidatePath(`/proyectos/${parsed.data.proyecto_id}`);
}
