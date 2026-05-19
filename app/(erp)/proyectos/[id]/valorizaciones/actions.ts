'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { optionalString } from '@/lib/zod-helpers';

const generarSchema = z.object({
  proyecto_id: z.string().uuid(),
  periodo_inicio: z.string(),
  periodo_fin: z.string(),
});

export type GenerarValState = { ok: boolean; error?: string };

export async function generarValorizacion(
  _prev: GenerarValState,
  formData: FormData,
): Promise<GenerarValState> {
  const session = await requireSession();
  if (!['gerencia_general', 'jefe_proyectos', 'jefe_presupuestos'].includes(session.rol)) {
    return { ok: false, error: 'Solo mando puede generar valorizaciones' };
  }

  const parsed = generarSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    periodo_inicio: formData.get('periodo_inicio'),
    periodo_fin: formData.get('periodo_fin'),
  });
  if (!parsed.success) return { ok: false, error: 'Datos inválidos' };

  const supabase = createClient();
  const { data, error } = await supabase.rpc('fn_generar_valorizacion', {
    p_proyecto_id: parsed.data.proyecto_id,
    p_periodo_inicio: parsed.data.periodo_inicio,
    p_periodo_fin: parsed.data.periodo_fin,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/proyectos/${parsed.data.proyecto_id}/valorizaciones`);
  redirect(`/proyectos/${parsed.data.proyecto_id}/valorizaciones/${data}`);
}

const cambiarEstadoSchema = z.object({
  id: z.string().uuid(),
  proyecto_id: z.string().uuid(),
  estado: z.enum(['borrador', 'enviada', 'aprobada', 'pagada', 'rechazada']),
});

export async function cambiarEstadoValorizacion(formData: FormData) {
  await requireSession();
  const parsed = cambiarEstadoSchema.safeParse({
    id: formData.get('id'),
    proyecto_id: formData.get('proyecto_id'),
    estado: formData.get('estado'),
  });
  if (!parsed.success) throw new Error('Datos inválidos');

  const supabase = createClient();
  const now = new Date().toISOString();
  const patch = {
    estado: parsed.data.estado,
    enviada_at: parsed.data.estado === 'enviada' ? now : null,
    aprobada_at: parsed.data.estado === 'aprobada' ? now : null,
    pagada_at: parsed.data.estado === 'pagada' ? now : null,
  };
  const { error } = await supabase.from('valorizaciones').update(patch).eq('id', parsed.data.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${parsed.data.proyecto_id}/valorizaciones`);
  revalidatePath(`/proyectos/${parsed.data.proyecto_id}/valorizaciones/${parsed.data.id}`);
}

const adicSchema = z.object({
  proyecto_id: z.string().uuid(),
  tipo: z.enum(['adicional', 'deductivo']),
  descripcion: z.string().min(3),
  sustento: optionalString(),
  monto: z.coerce.number().min(0.01),
});

export async function crearAdicionalDeductivo(formData: FormData) {
  const session = await requireSession();
  if (!['gerencia_general', 'jefe_proyectos', 'jefe_presupuestos'].includes(session.rol)) {
    throw new Error('No autorizado');
  }
  const parsed = adicSchema.safeParse({
    proyecto_id: formData.get('proyecto_id'),
    tipo: formData.get('tipo'),
    descripcion: formData.get('descripcion'),
    sustento: formData.get('sustento'),
    monto: formData.get('monto'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  const supabase = createClient();

  const { data: max } = await supabase
    .from('adicionales_deductivos')
    .select('numero')
    .eq('proyecto_id', parsed.data.proyecto_id)
    .eq('tipo', parsed.data.tipo)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle();
  const numero = (max?.numero ?? 0) + 1;
  const prefix = parsed.data.tipo === 'adicional' ? 'AD' : 'DD';

  const { error } = await supabase.from('adicionales_deductivos').insert({
    proyecto_id: parsed.data.proyecto_id,
    tipo: parsed.data.tipo,
    numero,
    codigo: `${prefix}-${numero.toString().padStart(3, '0')}`,
    descripcion: parsed.data.descripcion,
    sustento: parsed.data.sustento || null,
    monto: parsed.data.monto,
    created_by: session.userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${parsed.data.proyecto_id}/adicionales`);
}
