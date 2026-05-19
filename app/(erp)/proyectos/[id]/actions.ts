'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { optionalString } from '@/lib/zod-helpers';

const actualizarMetradoSchema = z.object({
  partida_id: z.string().uuid(),
  proyecto_id: z.string().uuid(),
  metrado_ejecutado: z.coerce.number().min(0),
});

export async function actualizarMetradoEjecutado(formData: FormData) {
  await requireSession();
  const parsed = actualizarMetradoSchema.safeParse({
    partida_id: formData.get('partida_id'),
    proyecto_id: formData.get('proyecto_id'),
    metrado_ejecutado: formData.get('metrado_ejecutado'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  const supabase = createClient();
  const { error } = await supabase
    .from('proyecto_partidas')
    .update({ metrado_ejecutado: parsed.data.metrado_ejecutado })
    .eq('id', parsed.data.partida_id);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${parsed.data.proyecto_id}`);
}

const cambiarEstadoSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['planificado', 'en_curso', 'pausado', 'cerrado', 'cancelado']),
});

export async function cambiarEstadoProyecto(formData: FormData) {
  await requireSession();
  const parsed = cambiarEstadoSchema.safeParse({
    id: formData.get('id'),
    estado: formData.get('estado'),
  });
  if (!parsed.success) throw new Error('Datos inválidos');

  const supabase = createClient();
  const patch =
    parsed.data.estado === 'cerrado'
      ? { estado: parsed.data.estado, fecha_fin_real: new Date().toISOString().slice(0, 10) }
      : { estado: parsed.data.estado };

  const { error } = await supabase.from('proyectos').update(patch).eq('id', parsed.data.id);
  if (error) throw new Error(error.message);

  revalidatePath('/proyectos');
  revalidatePath(`/proyectos/${parsed.data.id}`);
}

// ---------------------------------------------------------------------
// Actualizar ubicación (ubigeo + dirección + coords + geofence)
// ---------------------------------------------------------------------
const ubicacionSchema = z.object({
  proyecto_id: z.string().uuid(),
  ubigeo_codigo: optionalString(),
  departamento: optionalString(),
  provincia: optionalString(),
  distrito: optionalString(),
  direccion: optionalString(),
  latitud: z.coerce.number().min(-90).max(90),
  longitud: z.coerce.number().min(-180).max(180),
  radio_geofence_m: z.coerce.number().int().min(20).max(5000).default(200),
});

export async function actualizarUbicacionProyecto(formData: FormData) {
  const session = await requireSession();
  if (!['gerencia_general', 'jefe_proyectos', 'jefe_presupuestos'].includes(session.rol)) {
    throw new Error('Solo mando puede editar la ubicación del proyecto');
  }

  const parsed = ubicacionSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    ubigeo_codigo: formData.get('ubigeo_codigo'),
    departamento: formData.get('departamento'),
    provincia: formData.get('provincia'),
    distrito: formData.get('distrito'),
    direccion: formData.get('direccion'),
    latitud: formData.get('latitud'),
    longitud: formData.get('longitud'),
    radio_geofence_m: formData.get('radio_geofence_m'),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');
  }

  // Componer "ubicacion" legible para compatibilidad con vistas/listados
  const ubicacionTexto = [parsed.data.direccion, parsed.data.distrito, parsed.data.provincia, parsed.data.departamento]
    .filter(Boolean)
    .join(', ');

  const supabase = createClient();
  const { error } = await supabase
    .from('proyectos')
    .update({
      ubigeo_codigo: parsed.data.ubigeo_codigo ?? null,
      departamento: parsed.data.departamento ?? null,
      provincia: parsed.data.provincia ?? null,
      distrito: parsed.data.distrito ?? null,
      direccion: parsed.data.direccion ?? null,
      ubicacion: ubicacionTexto || null,
      latitud: parsed.data.latitud,
      longitud: parsed.data.longitud,
      radio_geofence_m: parsed.data.radio_geofence_m,
    })
    .eq('id', parsed.data.proyecto_id);
  if (error) throw new Error(error.message);

  revalidatePath('/proyectos');
  revalidatePath(`/proyectos/${parsed.data.proyecto_id}`);
}
