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
  jornal_semana: z.number().min(0).nullable().optional(),
  recurrente: z.boolean().optional(),
});

export async function guardarTrabajador(input: z.input<typeof trabSchema>): Promise<Res & { id?: string }> {
  const session = await requireSession();
  const parsed = trabSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const supabase = createClient() as any;
  // Solo Gerencia General fija o modifica el jornal semanal.
  const puedeTarifa = session.rol === 'gerencia';
  const payload: Record<string, unknown> = {
    nombre: d.nombre,
    documento: d.documento || null,
    especialidad: d.especialidad || null,
    recurrente: d.recurrente ?? false,
  };
  if (d.id) {
    if (puedeTarifa) payload.jornal_semana = d.jornal_semana ?? 0; // otros roles no tocan el jornal existente
    const { error } = await supabase.from('trabajadores').update(payload).eq('id', d.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/campo/tareo');
    return { ok: true, id: d.id };
  }
  payload.jornal_semana = puedeTarifa ? (d.jornal_semana ?? 0) : 0; // el residente/coordinador registra sin jornal; lo fija Gerencia
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
    const { data: m } = await supabase.from('trabajadores').select('id, jornal_semana').in('id', ids);
    (m ?? []).forEach((x: any) => tarifas.set(x.id, Number(x.jornal_semana ?? 0)));
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
      jornal_semana: t.trabajador_id ? (tarifas.get(t.trabajador_id) ?? 0) : 0,
      estado: 'registrado',
      created_by: session.id,
    })),
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath('/campo/tareo');
  return { ok: true };
}

// Corrección post-pago: agrega filas ADITIVAS por fecha (sin tocar lo pagado).
// Cada corrección entra como 'registrado' y sigue el circuito normal de aprobación.
const correccionSchema = z.object({
  proyecto_id: z.string().uuid(),
  nota: z.string().trim().nullable().optional(),
  filas: z.array(z.object({
    fecha: z.string().min(1),
    trabajador_id: z.string().uuid().nullable().optional(),
    trabajador_nombre: z.string().trim().min(1),
    horas: z.number().nullable().optional(),
    horas_extra: z.number().nullable().optional(),
  })).min(1),
});

export async function corregirTareo(input: z.input<typeof correccionSchema>): Promise<Res> {
  const session = await requireSession();
  if (session.rol !== 'jefe_proyectos' && session.rol !== 'gerencia') return { ok: false, error: 'Solo el jefe de proyectos o gerencia pueden registrar correcciones' };
  const parsed = correccionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos incompletos' };
  const d = parsed.data;
  const supabase = createClient() as any;

  // Jornal snapshot desde el maestro para los que vienen del maestro.
  const ids = d.filas.map((f) => f.trabajador_id).filter(Boolean) as string[];
  const tarifas = new Map<string, number>();
  if (ids.length) {
    const { data: m } = await supabase.from('trabajadores').select('id, jornal_semana').in('id', ids);
    (m ?? []).forEach((x: any) => tarifas.set(x.id, Number(x.jornal_semana ?? 0)));
  }
  // La registra el jefe/gerencia (autoridad de aprobación): entra ya 'aprobado'
  // para que finanzas la pague como delta aditiva del periodo correspondiente.
  const { error } = await supabase.from('tareo').insert(
    d.filas.map((f) => ({
      proyecto_id: d.proyecto_id,
      fecha: f.fecha,
      trabajador_id: f.trabajador_id || null,
      trabajador_nombre: f.trabajador_nombre,
      presente: true,
      horas: f.horas ?? null,
      horas_extra: f.horas_extra ?? null,
      jornal_semana: f.trabajador_id ? (tarifas.get(f.trabajador_id) ?? 0) : 0,
      estado: 'aprobado',
      revisado_by: session.id,
      revisado_at: new Date().toISOString(),
      es_correccion: true,
      nota: d.nota || null,
      created_by: session.id,
    })),
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${d.proyecto_id}`);
  revalidatePath('/finanzas');
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

// El jefe de proyectos edita una fila del tareo antes de aprobarla
// (mientras esté en 'registrado' o 'enviado'). El residente edita desde la app.
export async function editarTareoFila(id: string, presente: boolean, horas: number | null, horasExtra: number | null): Promise<Res> {
  const session = await requireSession();
  if (session.rol !== 'jefe_proyectos' && session.rol !== 'gerencia') return { ok: false, error: 'Solo el jefe de proyectos o gerencia pueden editar el tareo aquí' };
  const supabase = createClient() as any;
  const { data, error } = await supabase.from('tareo')
    .update({ presente, horas: horas ?? null, horas_extra: horasExtra ?? null })
    .eq('id', id).in('estado', ['registrado', 'enviado']).select('proyecto_id').single();
  if (error) return { ok: false, error: error.message };
  if (data?.proyecto_id) revalidatePath(`/proyectos/${data.proyecto_id}`);
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

// Actualiza el jornal semanal (maestro + tareo aprobado no pagado). Solo jefe/gerencia.
export async function actualizarTarifaTrabajador(trabajadorId: string, jornalSemana: number): Promise<Res> {
  const session = await requireSession();
  if (session.rol !== 'gerencia') return { ok: false, error: 'Solo Gerencia General puede editar el jornal' };
  const supabase = createClient() as any;
  await supabase.from('trabajadores').update({ jornal_semana: jornalSemana }).eq('id', trabajadorId);
  await supabase.from('tareo').update({ jornal_semana: jornalSemana }).eq('trabajador_id', trabajadorId).in('estado', ['aprobado']);
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

// Finanzas devuelve un jornal aprobado (aún no pagado): vuelve a 'registrado'
// para que el residente lo corrija y el jefe lo vuelva a aprobar.
export async function rechazarJornal(ids: string[], motivo?: string): Promise<Res> {
  const session = await requireSession();
  if (session.rol !== 'administrador' && session.rol !== 'gerencia') return { ok: false, error: 'Solo administración o gerencia' };
  if (!ids.length) return { ok: true };
  const supabase = createClient() as any;
  const { data: filas, error } = await supabase.from('tareo')
    .update({ estado: 'registrado', revisado_by: null, revisado_at: null })
    .in('id', ids).eq('estado', 'aprobado').select('proyecto_id, created_by');
  if (error) return { ok: false, error: error.message };

  // Avisa al residente que registró y al jefe/gerencia del proyecto.
  const proyectoId = filas?.[0]?.proyecto_id as string | undefined;
  const autores = [...new Set((filas ?? []).map((f: any) => f.created_by).filter(Boolean))] as string[];
  const admin = createAdminClient();
  const { data: proy } = proyectoId ? await admin.from('proyectos').select('nombre').eq('id', proyectoId).single() : { data: null };
  const payload = { title: 'Jornal devuelto por finanzas', body: `${session.nombre} devolvió el tareo de ${proy?.nombre ?? 'un proyecto'}${motivo ? `: ${motivo}` : ''}`, url: proyectoId ? `/proyectos/${proyectoId}` : '/campo/tareo', tag: 'tareo' };
  autores.forEach((id) => notifyUser(id, payload, 'tareo'));
  if (proyectoId) {
    const { data: equipo } = await admin.from('proyecto_equipo').select('profile:profiles(id, rol)').eq('proyecto_id', proyectoId);
    (equipo ?? []).map((e: any) => e.profile).filter((p: any) => p?.rol === 'jefe_proyectos').forEach((j: any) => j && notifyUser(j.id, payload, 'tareo'));
  }
  revalidatePath('/finanzas');
  if (proyectoId) revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}
