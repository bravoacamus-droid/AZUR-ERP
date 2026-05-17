'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';

const ROLES_COMERCIAL = ['gerencia_general', 'jefe_presupuestos', 'comercial'] as const;

const crearCotizacionSchema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres'),
  descripcion: z.string().optional().or(z.literal('')),
  ubicacion: z.string().optional().or(z.literal('')),
  cliente_id: z.string().uuid().optional().or(z.literal('')),
  validez_dias: z.coerce.number().int().min(1).max(365).default(15),
  moneda: z.enum(['PEN', 'USD']).default('PEN'),
  margen_porcentaje: z.coerce.number().min(0).max(200).default(10),
  gastos_generales_porcentaje: z.coerce.number().min(0).max(50).default(8),
  igv_porcentaje: z.coerce.number().min(0).max(30).default(18),
  notas: z.string().optional().or(z.literal('')),
});

export type CrearCotizacionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function crearCotizacion(
  _prev: CrearCotizacionState,
  formData: FormData,
): Promise<CrearCotizacionState> {
  const session = await requireSession();
  if (!ROLES_COMERCIAL.includes(session.rol as (typeof ROLES_COMERCIAL)[number])) {
    return { ok: false, error: 'No tienes permisos para crear cotizaciones' };
  }

  const parsed = crearCotizacionSchema.safeParse({
    titulo: formData.get('titulo'),
    descripcion: formData.get('descripcion'),
    ubicacion: formData.get('ubicacion'),
    cliente_id: formData.get('cliente_id'),
    validez_dias: formData.get('validez_dias'),
    moneda: formData.get('moneda'),
    margen_porcentaje: formData.get('margen_porcentaje'),
    gastos_generales_porcentaje: formData.get('gastos_generales_porcentaje'),
    igv_porcentaje: formData.get('igv_porcentaje'),
    notas: formData.get('notas'),
  });

  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { ok: false, error: first?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('cotizaciones')
    .insert({
      titulo: parsed.data.titulo,
      descripcion: parsed.data.descripcion || null,
      ubicacion: parsed.data.ubicacion || null,
      cliente_id: parsed.data.cliente_id || null,
      validez_dias: parsed.data.validez_dias,
      moneda: parsed.data.moneda,
      margen_porcentaje: parsed.data.margen_porcentaje,
      gastos_generales_porcentaje: parsed.data.gastos_generales_porcentaje,
      igv_porcentaje: parsed.data.igv_porcentaje,
      notas: parsed.data.notas || null,
      created_by: session.userId,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo crear la cotización' };
  }

  revalidatePath('/comercial/cotizaciones');
  redirect(`/comercial/cotizaciones/${data.id}`);
}

const cambiarEstadoSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['borrador', 'enviada', 'en_negociacion', 'aprobada', 'rechazada']),
});

export async function cambiarEstadoCotizacion(formData: FormData) {
  await requireSession();
  const parsed = cambiarEstadoSchema.safeParse({
    id: formData.get('id'),
    estado: formData.get('estado'),
  });
  if (!parsed.success) throw new Error('Datos inválidos');

  const supabase = createClient();
  const now = new Date().toISOString();
  const patch = {
    estado: parsed.data.estado,
    enviado_at: parsed.data.estado === 'enviada' ? now : null,
    aprobado_at: parsed.data.estado === 'aprobada' ? now : null,
    rechazado_at: parsed.data.estado === 'rechazada' ? now : null,
  };

  const { error } = await supabase.from('cotizaciones').update(patch).eq('id', parsed.data.id);
  if (error) throw new Error(error.message);

  revalidatePath('/comercial/cotizaciones');
  revalidatePath(`/comercial/cotizaciones/${parsed.data.id}`);
}

const agregarPartidaSchema = z.object({
  cotizacion_id: z.string().uuid(),
  codigo: z.string().min(1),
  descripcion: z.string().min(3),
  unidad: z.string().min(1),
  cantidad: z.coerce.number().min(0),
  precio_unitario: z.coerce.number().min(0),
  partida_maestra_id: z.string().uuid().optional().or(z.literal('')),
});

export async function agregarPartida(formData: FormData) {
  await requireSession();
  const parsed = agregarPartidaSchema.safeParse({
    cotizacion_id: formData.get('cotizacion_id'),
    codigo: formData.get('codigo'),
    descripcion: formData.get('descripcion'),
    unidad: formData.get('unidad'),
    cantidad: formData.get('cantidad'),
    precio_unitario: formData.get('precio_unitario'),
    partida_maestra_id: formData.get('partida_maestra_id'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  const supabase = createClient();

  // siguiente orden
  const { data: existing } = await supabase
    .from('cotizacion_partidas')
    .select('orden')
    .eq('cotizacion_id', parsed.data.cotizacion_id)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();
  const orden = (existing?.orden ?? 0) + 10;

  const { error } = await supabase.from('cotizacion_partidas').insert({
    cotizacion_id: parsed.data.cotizacion_id,
    codigo: parsed.data.codigo,
    descripcion: parsed.data.descripcion,
    unidad: parsed.data.unidad,
    cantidad: parsed.data.cantidad,
    precio_unitario: parsed.data.precio_unitario,
    partida_maestra_id: parsed.data.partida_maestra_id || null,
    orden,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/comercial/cotizaciones/${parsed.data.cotizacion_id}`);
}

export async function eliminarPartida(formData: FormData) {
  await requireSession();
  const id = formData.get('id') as string;
  const cotizacionId = formData.get('cotizacion_id') as string;
  if (!id || !cotizacionId) throw new Error('Datos inválidos');

  const supabase = createClient();
  const { error } = await supabase.from('cotizacion_partidas').delete().eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/comercial/cotizaciones/${cotizacionId}`);
}
