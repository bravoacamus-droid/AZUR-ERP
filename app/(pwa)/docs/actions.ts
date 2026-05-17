'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';

const docSchema = z.object({
  proyecto_id: z.string().uuid(),
  titulo: z.string().min(3),
  carpeta: z.enum(['general', 'planos', 'contratos', 'cotizaciones', 'fichas', 'permisos']),
  descripcion: z.string().optional().or(z.literal('')),
});

export async function subirDocumento(formData: FormData) {
  const session = await requireSession();
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('Selecciona un archivo');
  if (file.size > 50 * 1024 * 1024) throw new Error('Máximo 50 MB');

  const parsed = docSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    titulo: formData.get('titulo'),
    carpeta: formData.get('carpeta'),
    descripcion: formData.get('descripcion'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  const admin = createAdminClient();
  const ext = (file.name.split('.').pop() ?? 'bin').toLowerCase();
  const path = `${parsed.data.proyecto_id}/${parsed.data.carpeta}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`;
  const buf = await file.arrayBuffer();

  const { error: upErr } = await admin.storage
    .from('documentos')
    .upload(path, new Uint8Array(buf), {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const supabase = createClient();
  const { error: dbErr } = await supabase.from('documentos_proyecto').insert({
    proyecto_id: parsed.data.proyecto_id,
    titulo: parsed.data.titulo,
    descripcion: parsed.data.descripcion || null,
    carpeta: parsed.data.carpeta,
    storage_path: path,
    tipo_mime: file.type || 'application/octet-stream',
    tamano_bytes: file.size,
    subido_por: session.userId,
  });
  if (dbErr) {
    await admin.storage.from('documentos').remove([path]);
    throw new Error(dbErr.message);
  }

  revalidatePath('/docs');
}
