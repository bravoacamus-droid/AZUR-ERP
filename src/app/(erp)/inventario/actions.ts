'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';

type Res = { ok: boolean; error?: string; id?: string };

const ROLES_INVENTARIO = ['gerencia', 'logistico', 'administrador'] as const;

// ── Crear ítem de inventario ──────────────────────────────────────────────
const crearItemSchema = z.object({
  codigo: z.string().min(1, 'Código requerido'),
  nombre: z.string().min(2, 'Nombre requerido'),
  unidad: z.string().min(1, 'Unidad requerida'),
  tipo: z.enum(['herramienta', 'material', 'consumible']),
  stock: z.coerce.number().min(0).optional(),
});

export async function crearItem(input: z.input<typeof crearItemSchema>): Promise<Res> {
  await requireRol([...ROLES_INVENTARIO]);
  const parsed = crearItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos incompletos' };
  const d = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventario_items')
    .insert({
      codigo: d.codigo,
      nombre: d.nombre,
      unidad: d.unidad,
      tipo: d.tipo,
      stock: d.stock ?? 0,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear el ítem' };

  revalidatePath('/inventario');
  return { ok: true, id: data.id };
}

// ── Registrar movimiento de almacén ───────────────────────────────────────
// CHECK del esquema:
//   tipo='ingreso'                 ⇒ proyecto_id NULL
//   tipo in (salida|devolucion)    ⇒ proyecto_id NOT NULL
// Efecto en stock: ingreso/devolucion suman, salida resta.
const movimientoSchema = z
  .object({
    item_id: z.string().uuid('Ítem inválido'),
    tipo: z.enum(['ingreso', 'salida', 'devolucion']),
    cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
    proyecto_id: z.string().uuid().optional().or(z.literal('')),
  })
  .refine((d) => (d.tipo === 'ingreso' ? !d.proyecto_id : !!d.proyecto_id), {
    message: 'El proyecto es obligatorio para salidas y devoluciones, y debe omitirse en ingresos',
    path: ['proyecto_id'],
  });

export async function registrarMovimiento(input: z.input<typeof movimientoSchema>): Promise<Res> {
  const session = await requireRol([...ROLES_INVENTARIO]);
  const parsed = movimientoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos incompletos' };
  const d = parsed.data;

  const supabase = createClient();

  // Ítem actual (para validar stock y recalcular).
  const { data: item, error: ie } = await supabase
    .from('inventario_items')
    .select('id, stock')
    .eq('id', d.item_id)
    .single();
  if (ie || !item) return { ok: false, error: 'Ítem no encontrado' };

  const suma = d.tipo === 'salida' ? -d.cantidad : d.cantidad;
  const nuevoStock = Number(item.stock ?? 0) + suma;
  if (nuevoStock < 0) return { ok: false, error: 'Stock insuficiente para la salida' };

  const proyectoId = d.tipo === 'ingreso' ? null : d.proyecto_id || null;

  const { data: mov, error: me } = await supabase
    .from('movimientos_almacen')
    .insert({
      item_id: d.item_id,
      tipo: d.tipo,
      cantidad: d.cantidad,
      proyecto_id: proyectoId,
      created_by: session.id,
    })
    .select('id')
    .single();
  if (me || !mov) return { ok: false, error: me?.message ?? 'Error al registrar el movimiento' };

  const { error: ue } = await supabase
    .from('inventario_items')
    .update({ stock: nuevoStock })
    .eq('id', d.item_id);
  if (ue) return { ok: false, error: ue.message };

  revalidatePath('/inventario');
  return { ok: true, id: mov.id };
}
