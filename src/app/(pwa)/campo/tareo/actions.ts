'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth';
import { notifyUser, notifyRoles } from '@/lib/push/notify';

type Res = { ok: boolean; error?: string };

// ── Maestro de trabajadores ─────────────────────────────────────────────
const trabSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().trim().min(2, 'Nombre requerido'),
  documento: z.string().trim().nullable().optional(),
  especialidad: z.string().trim().nullable().optional(),
  tarifa_dia: z.number().min(0).nullable().optional(),
  recurrente: z.boolean().optional(),
});

export async function guardarTrabajador(input: z.input<typeof trabSchema>): Promise<Res & { id?: string }> {
  const session = await requireSession();
  const parsed = trabSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const supabase = createClient() as any;
  const payload = {
    nombre: d.nombre,
    documento: d.documento || null,
    especialidad: d.especialidad || null,
    tarifa_dia: d.tarifa_dia ?? 0,
    recurrente: d.recurrente ?? false,
  };
  if (d.id) {
    const { error } = await supabase.from('trabajadores').update(payload).eq('id', d.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/campo/tareo');
    return { ok: true, id: d.id };
  }
  const { data, error } = await supabase.from('trabajadores').insert({ ...payload, created_by: session.id }).select('id').single();
  if (error || !data) return { ok: false, error: error?.message ?? 'No se pudo registrar' };
  revalidatePath('/campo/tareo');
  return { ok: true, id: data.id };
}

export async function eliminarTrabajador(id: string): Promise<Res> {
  await requireSession();
  const supabase = createClient() as any;
  const { error } = await supabase.from('trabajadores').update({ activo: false }).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/campo/tareo');
  return { ok: true };
}

// ── Tareo diario ────────────────────────────────────────────────────────
const tareoSchema = z.object({
  proyecto_id: z.string().uuid(),
  fecha: z.string(),
  trabajadores: z.array(z.object({
    trabajador_id: z.string().uuid().nullable().optional(),
    trabajador_nombre: z.string().trim().min(1),
    presente: z.boolean(),
    horas: z.number().nullable().optional(),
    horas_extra: z.number().nullable().optional(),
  })).min(1),
});

export async function guardarTareo(input: z.input<typeof tareoSchema>): Promise<Res> {
  const session = await requireSession();
  const parsed = tareoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos incompletos' };
  const d = parsed.data;
  const supabase = createClient() as any;

  // Tarifa snapshot desde el maestro (para los que vienen del maestro).
  const ids = d.trabajadores.map((t) => t.trabajador_id).filter(Boolean) as string[];
  const tarifas = new Map<string, number>();
  if (ids.length) {
    const { data: m } = await supabase.from('trabajadores').select('id, tarifa_dia').in('id', ids);
    (m ?? []).forEach((x: any) => tarifas.set(x.id, Number(x.tarifa_dia ?? 0)));
  }
  // Reemplaza lo del día que aún no está aprobado (evita duplicados al re-guardar).
  await supabase.from('tareo').delete().eq('proyecto_id', d.proyecto_id).eq('fecha', d.fecha).in('estado', ['registrado', 'enviado']);
  const { error } = await supabase.from('tareo').insert(
    d.trabajadores.map((t) => ({
      proyecto_id: d.proyecto_id,
      fecha: d.fecha,
      trabajador_id: t.trabajador_id || null,
      trabajador_nombre: t.trabajador_nombre,
      presente: t.presente,
      horas: t.horas ?? null,
      horas_extra: t.horas_extra ?? null,
      tarifa_dia: t.trabajador_id ? (tarifas.get(t.trabajador_id) ?? 0) : 0,
      estado: 'registrado',
      created_by: session.id,
    })),
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath('/campo/tareo');
  return { ok: true };
}

// Residente envía el tareo de un rango a revisión del jefe de proyectos.
export async function enviarTareo(proyectoId: string, desde: string, hasta: string): Promise<Res> {
  const session = await requireSession();
  const supabase = createClient() as any;
  const { error, count } = await supabase.from('tareo')
    .update({ estado: 'enviado' }, { count: 'exact' })
    .eq('proyecto_id', proyectoId).gte('fecha', desde).lte('fecha', hasta).eq('estado', 'registrado');
  if (error) return { ok: false, error: error.message };
  if (!count) return { ok: false, error: 'No hay tareo por enviar en ese rango.' };

  const admin = createAdminClient();
  const { data: proy } = await admin.from('proyectos').select('nombre').eq('id', proyectoId).single();
  const { data: equipo } = await admin.from('proyecto_equipo').select('profile:profiles(id, rol)').eq('proyecto_id', proyectoId);
  const jefes = (equipo ?? []).map((e: any) => e.profile).filter((p: any) => p?.rol === 'jefe_proyectos');
  const payload = { title: 'Tareo por aprobar', body: `${session.nombre} envió el tareo de ${proy?.nombre ?? 'un proyecto'} (${desde} a ${hasta})`, url: `/proyectos/${proyectoId}`, tag: 'tareo' };
  if (jefes.length) jefes.forEach((j: any) => j && notifyUser(j.id, payload, 'tareo'));
  else notifyRoles(['jefe_proyectos', 'gerencia'], payload, 'tareo');
  revalidatePath('/campo/tareo');
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// Jefe de proyectos aprueba (o devuelve) el tareo enviado de un rango.
export async function revisarTareo(proyectoId: string, desde: string, hasta: string, aprobado: boolean): Promise<Res> {
  const session = await requireSession();
  if (session.rol !== 'jefe_proyectos' && session.rol !== 'gerencia') return { ok: false, error: 'Solo el jefe de proyectos o gerencia pueden aprobar el tareo' };
  const supabase = createClient() as any;
  const nuevo = aprobado ? 'aprobado' : 'registrado';
  const { error } = await supabase.from('tareo')
    .update({ estado: nuevo, revisado_by: session.id, revisado_at: new Date().toISOString() })
    .eq('proyecto_id', proyectoId).gte('fecha', desde).lte('fecha', hasta).eq('estado', 'enviado');
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// Finanzas: actualiza la tarifa (maestro + tareo del rango) y marca como pagado.
export async function actualizarTarifaTrabajador(trabajadorId: string, tarifa: number): Promise<Res> {
  const session = await requireSession();
  if (session.rol !== 'administrador' && session.rol !== 'gerencia') return { ok: false, error: 'Solo administración o gerencia' };
  const supabase = createClient() as any;
  await supabase.from('trabajadores').update({ tarifa_dia: tarifa }).eq('id', trabajadorId);
  await supabase.from('tareo').update({ tarifa_dia: tarifa }).eq('trabajador_id', trabajadorId).in('estado', ['aprobado']);
  revalidatePath('/finanzas');
  return { ok: true };
}

export async function marcarTareoPagado(ids: string[]): Promise<Res> {
  const session = await requireSession();
  if (session.rol !== 'administrador' && session.rol !== 'gerencia') return { ok: false, error: 'Solo administración o gerencia' };
  if (!ids.length) return { ok: true };
  const supabase = createClient() as any;
  const { error } = await supabase.from('tareo').update({ estado: 'pagado' }).in('id', ids);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/finanzas');
  return { ok: true };
}
