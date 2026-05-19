'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { optionalString, optionalUuid } from '@/lib/zod-helpers';

const movSchema = z.object({
  proyecto_id: z.string().uuid(),
  tipo: z.enum(['salida', 'devolucion']),
  insumo_id: optionalUuid(),
  descripcion: z.string().min(3),
  cantidad: z.coerce.number().min(0.0001),
  unidad: z.string().min(1),
  responsable: optionalString(),
  notas: optionalString(),
});

export async function registrarMovimientoAlmacen(formData: FormData) {
  const session = await requireSession();
  const parsed = movSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    tipo: formData.get('tipo'),
    insumo_id: formData.get('insumo_id'),
    descripcion: formData.get('descripcion'),
    cantidad: formData.get('cantidad'),
    unidad: formData.get('unidad'),
    responsable: formData.get('responsable'),
    notas: formData.get('notas'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  // VALIDACIÓN DE STOCK: solo para salidas con insumo del catálogo
  if (parsed.data.tipo === 'salida' && parsed.data.insumo_id) {
    const admin = createAdminClient();
    const { data: stock } = await admin
      .from('v_almacen_central_stock')
      .select('stock_disponible, descripcion, unidad')
      .eq('insumo_id', parsed.data.insumo_id)
      .single();
    const disponible = Number(stock?.stock_disponible ?? 0);
    if (disponible < parsed.data.cantidad) {
      throw new Error(
        `Stock insuficiente en almacén central. Disponible: ${disponible} ${stock?.unidad ?? ''} de "${stock?.descripcion ?? 'insumo'}". Intentas sacar ${parsed.data.cantidad}.`,
      );
    }
  }

  const supabase = createClient();
  const { error } = await supabase.from('almacen_movimientos').insert({
    proyecto_id: parsed.data.proyecto_id,
    tipo: parsed.data.tipo,
    insumo_id: parsed.data.insumo_id || null,
    descripcion: parsed.data.descripcion,
    cantidad: parsed.data.cantidad,
    unidad: parsed.data.unidad,
    responsable: parsed.data.responsable || null,
    notas: parsed.data.notas || null,
    registrado_por: session.userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/almacen');
  revalidatePath('/inventario');
}
