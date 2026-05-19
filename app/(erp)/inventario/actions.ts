'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { optionalString } from '@/lib/zod-helpers';

const ROLES_ALMACEN_CENTRAL = ['gerencia_general', 'jefe_proyectos', 'administrador'] as const;

const compraSchema = z.object({
  insumo_id: z.string().uuid(),
  cantidad: z.coerce.number().min(0.0001),
  costo_unit: z.coerce.number().min(0).optional().nullable(),
  proveedor: z.string().min(2),
  numero_documento: optionalString(),
  fecha: z.string().optional().nullable(),
  notas: optionalString(),
});

export type CompraState = { ok: boolean; error?: string; message?: string };

/**
 * Registra una compra/ingreso al almacén central.
 * Solo gerencia, jefe_proyectos y administrador.
 */
export async function registrarCompra(
  _prev: CompraState,
  formData: FormData,
): Promise<CompraState> {
  const session = await requireSession();
  if (!ROLES_ALMACEN_CENTRAL.includes(session.rol as (typeof ROLES_ALMACEN_CENTRAL)[number])) {
    return { ok: false, error: 'No tienes permisos para registrar ingresos al almacén central' };
  }

  const parsed = compraSchema.safeParse({
    insumo_id: formData.get('insumo_id'),
    cantidad: formData.get('cantidad'),
    costo_unit: formData.get('costo_unit') || null,
    proveedor: formData.get('proveedor'),
    numero_documento: formData.get('numero_documento'),
    fecha: formData.get('fecha') || null,
    notas: formData.get('notas'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const admin = createAdminClient();

  // Leer descripción y unidad del insumo para snapshot
  const { data: insumo } = await admin
    .from('insumos_maestros')
    .select('descripcion, unidad')
    .eq('id', parsed.data.insumo_id)
    .single();
  if (!insumo) return { ok: false, error: 'Insumo no encontrado' };

  const supabase = createClient();
  const { error } = await supabase.from('almacen_movimientos').insert({
    proyecto_id: null,
    tipo: 'ingreso',
    insumo_id: parsed.data.insumo_id,
    descripcion: insumo.descripcion,
    cantidad: parsed.data.cantidad,
    unidad: insumo.unidad,
    proveedor: parsed.data.proveedor,
    numero_documento: parsed.data.numero_documento || null,
    costo_unit: parsed.data.costo_unit ?? null,
    fecha: parsed.data.fecha || new Date().toISOString().slice(0, 10),
    responsable: null,
    notas: parsed.data.notas || null,
    registrado_por: session.userId,
  });
  if (error) return { ok: false, error: error.message };

  // Si vino costo unitario, actualizar el catálogo (precio referencial)
  if (parsed.data.costo_unit != null && parsed.data.costo_unit > 0) {
    await admin
      .from('insumos_maestros')
      .update({ precio_unit: parsed.data.costo_unit })
      .eq('id', parsed.data.insumo_id);
  }

  revalidatePath('/inventario');
  revalidatePath('/comercial/catalogo');

  return {
    ok: true,
    message: `Ingreso registrado: ${parsed.data.cantidad} ${insumo.unidad} de ${insumo.descripcion}`,
  };
}
