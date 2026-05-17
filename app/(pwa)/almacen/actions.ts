'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';

const movSchema = z.object({
  proyecto_id: z.string().uuid(),
  tipo: z.enum(['salida', 'devolucion']),
  descripcion: z.string().min(3),
  cantidad: z.coerce.number().min(0.0001),
  unidad: z.string().min(1),
  responsable: z.string().optional().or(z.literal('')),
  notas: z.string().optional().or(z.literal('')),
});

export async function registrarMovimientoAlmacen(formData: FormData) {
  const session = await requireSession();
  const parsed = movSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    tipo: formData.get('tipo'),
    descripcion: formData.get('descripcion'),
    cantidad: formData.get('cantidad'),
    unidad: formData.get('unidad'),
    responsable: formData.get('responsable'),
    notas: formData.get('notas'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  const supabase = createClient();
  const { error } = await supabase.from('almacen_movimientos').insert({
    proyecto_id: parsed.data.proyecto_id,
    tipo: parsed.data.tipo,
    descripcion: parsed.data.descripcion,
    cantidad: parsed.data.cantidad,
    unidad: parsed.data.unidad,
    responsable: parsed.data.responsable || null,
    notas: parsed.data.notas || null,
    registrado_por: session.userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/almacen');
}
