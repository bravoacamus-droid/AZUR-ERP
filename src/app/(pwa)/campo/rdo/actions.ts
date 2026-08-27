'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth';
import { notifyUser, notifyRoles } from '@/lib/push/notify';

const actividadSchema = z.object({
  descripcion: z.string().trim().min(1, 'Descripción requerida'),
  proyecto_item_id: z.string().uuid().nullable(),
  avance_pct: z.number().min(0).max(100).nullable(),
  estado: z.string().trim().nullable().optional(),
});

const rdoSchema = z.object({
  proyecto_id: z.string().uuid('Selecciona un proyecto'),
  fecha: z.string().min(1, 'Fecha requerida'),
  clima: z.string().trim().nullable(),
  jornada: z.string().trim().nullable().optional(),
  personal_count: z.number().int().min(0).nullable(),
  equipos: z.string().trim().nullable(),
  materiales_recibidos: z.string().trim().nullable(),
  programacion: z.string().trim().nullable().optional(),
  observaciones: z.string().trim().nullable(),
  incidencias: z.string().trim().nullable(),
  actividades: z.array(actividadSchema),
});

export type RdoInput = z.infer<typeof rdoSchema>;
type Res = { ok: boolean; error?: string; id?: string };

export async function crearRdo(input: RdoInput): Promise<Res> {
  const session = await requireSession();
  const parsed = rdoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;
  const supabase = createClient() as any; // columnas nuevas (jornada/programacion/estado) aún no tipadas

  const { data: parte, error } = await supabase
    .from('partes_diarios')
    .insert({
      proyecto_id: d.proyecto_id,
      fecha: d.fecha,
      clima: d.clima || null,
      jornada: d.jornada || null,
      personal_count: d.personal_count,
      equipos: d.equipos || null,
      materiales_recibidos: d.materiales_recibidos || null,
      programacion: d.programacion || null,
      observaciones: d.observaciones || null,
      incidencias: d.incidencias || null,
      created_by: session.id,
    })
    .select('id')
    .single();

  if (error || !parte) return { ok: false, error: error?.message ?? 'No se pudo crear el parte' };

  const actividades = d.actividades.filter((a) => a.descripcion.trim().length > 0);
  if (actividades.length > 0) {
    const { error: actError } = await supabase.from('rdo_actividades').insert(
      actividades.map((a) => ({
        rdo_id: parte.id,
        descripcion: a.descripcion,
        proyecto_item_id: a.proyecto_item_id,
        // El usuario ingresa 0–100; se guarda como fracción 0–1 (como el resto del sistema).
        avance_pct: a.avance_pct == null ? null : a.avance_pct / 100,
        estado: a.estado || null,
      })),
    );
    if (actError) return { ok: false, error: actError.message };
  }

  revalidatePath('/campo/rdo');
  return { ok: true, id: parte.id };
}

// Edita un reporte. Autor si está en borrador/observado; jefe/gerencia si está enviado.
export async function actualizarRdo(id: string, input: RdoInput): Promise<Res> {
  const session = await requireSession();
  const parsed = rdoSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const supabase = createClient() as any;
  const { data: parte } = await supabase.from('partes_diarios').select('created_by, estado').eq('id', id).single();
  if (!parte) return { ok: false, error: 'Reporte no encontrado' };
  const esAutor = parte.created_by === session.id;
  const esJefe = session.rol === 'jefe_proyectos' || session.rol === 'gerencia';
  const editable = (esAutor && ['borrador', 'observado'].includes(parte.estado)) || (esJefe && parte.estado === 'enviado');
  if (!editable) return { ok: false, error: 'Este reporte ya no se puede editar en su estado actual.' };

  const { error: e1 } = await supabase.from('partes_diarios').update({
    fecha: d.fecha,
    clima: d.clima || null,
    jornada: d.jornada || null,
    personal_count: d.personal_count,
    equipos: d.equipos || null,
    materiales_recibidos: d.materiales_recibidos || null,
    programacion: d.programacion || null,
    observaciones: d.observaciones || null,
    incidencias: d.incidencias || null,
  }).eq('id', id);
  if (e1) return { ok: false, error: e1.message };

  await supabase.from('rdo_actividades').delete().eq('rdo_id', id);
  const actividades = d.actividades.filter((a) => a.descripcion.trim().length > 0);
  if (actividades.length > 0) {
    const { error: e2 } = await supabase.from('rdo_actividades').insert(actividades.map((a) => ({
      rdo_id: id, descripcion: a.descripcion, proyecto_item_id: a.proyecto_item_id,
      avance_pct: a.avance_pct == null ? null : a.avance_pct / 100, estado: a.estado || null,
    })));
    if (e2) return { ok: false, error: e2.message };
  }
  revalidatePath('/campo/rdo');
  return { ok: true, id };
}

// Elimina una foto de un reporte (mientras es editable por el usuario).
export async function eliminarFotoRdo(evidenciaId: string): Promise<Res> {
  const session = await requireSession();
  const supabase = createClient() as any;
  const { data: ev } = await supabase.from('evidencias').select('rdo_id').eq('id', evidenciaId).single();
  if (!ev?.rdo_id) return { ok: false, error: 'Foto no encontrada' };
  const { data: parte } = await supabase.from('partes_diarios').select('created_by, estado').eq('id', ev.rdo_id).single();
  const esAutor = parte?.created_by === session.id;
  const esJefe = session.rol === 'jefe_proyectos' || session.rol === 'gerencia';
  const editable = (esAutor && ['borrador', 'observado'].includes(parte?.estado)) || (esJefe && parte?.estado === 'enviado');
  if (!editable) return { ok: false, error: 'No se puede editar este reporte.' };
  const { error } = await supabase.from('evidencias').delete().eq('id', evidenciaId);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/campo/rdo');
  return { ok: true };
}

// Residente envía el reporte a revisión del jefe de proyectos.
export async function enviarRdo(id: string): Promise<Res> {
  const session = await requireSession();
  const supabase = createClient() as any; // columnas de estado/revisión aún no tipadas
  const { data: parte } = await supabase.from('partes_diarios').select('id, proyecto_id, fecha, estado, created_by, proyectos(nombre)').eq('id', id).single();
  if (!parte) return { ok: false, error: 'Reporte no encontrado' };
  if (parte.created_by !== session.id) return { ok: false, error: 'Solo el autor puede enviar el reporte' };
  const { error } = await supabase.from('partes_diarios').update({ estado: 'enviado', enviado_at: new Date().toISOString(), obs_revision: null }).eq('id', id);
  if (error) return { ok: false, error: error.message };

  // Notifica al jefe de proyectos del equipo (o a gerencia como respaldo).
  const admin = createAdminClient();
  const { data: equipo } = await admin.from('proyecto_equipo').select('profile:profiles(id, rol)').eq('proyecto_id', parte.proyecto_id);
  const jefes = (equipo ?? []).map((e) => e.profile as { id: string; rol: string } | null).filter((p) => p?.rol === 'jefe_proyectos');
  const proyNombre = (parte.proyectos as { nombre?: string } | null)?.nombre ?? 'Proyecto';
  const payload = { title: 'Reporte de obra por revisar', body: `${session.nombre} envió un reporte de ${proyNombre}`, url: `/proyectos/${parte.proyecto_id}`, tag: 'rdo' };
  if (jefes.length) jefes.forEach((j) => j && notifyUser(j.id, payload, 'rdo'));
  else notifyRoles(['jefe_proyectos', 'gerencia'], payload, 'rdo');

  revalidatePath('/campo/rdo');
  revalidatePath(`/proyectos/${parte.proyecto_id}`);
  return { ok: true };
}

// Jefe de proyectos aprueba u observa el reporte enviado.
export async function revisarRdo(id: string, aprobado: boolean, motivo?: string): Promise<Res> {
  const session = await requireSession();
  if (session.rol !== 'jefe_proyectos' && session.rol !== 'gerencia') return { ok: false, error: 'Solo el jefe de proyectos o gerencia pueden revisar' };
  if (!aprobado && !motivo?.trim()) return { ok: false, error: 'Indica el motivo de la observación' };
  const supabase = createClient() as any;
  const { data: parte } = await supabase.from('partes_diarios').select('id, proyecto_id, created_by, proyectos(nombre)').eq('id', id).single();
  if (!parte) return { ok: false, error: 'Reporte no encontrado' };
  const { error } = await supabase.from('partes_diarios').update({
    estado: aprobado ? 'aprobado' : 'observado',
    revisado_by: session.id,
    revisado_at: new Date().toISOString(),
    obs_revision: aprobado ? null : (motivo ?? '').trim(),
  }).eq('id', id);
  if (error) return { ok: false, error: error.message };

  const proyNombre = (parte.proyectos as { nombre?: string } | null)?.nombre ?? 'Proyecto';
  if (parte.created_by) {
    notifyUser(parte.created_by, {
      title: aprobado ? 'Reporte aprobado' : 'Reporte observado',
      body: aprobado ? `Tu reporte de ${proyNombre} fue aprobado` : `Tu reporte de ${proyNombre} tiene observaciones: ${motivo}`,
      url: '/campo/rdo', tag: 'rdo',
    }, 'rdo');
  }
  revalidatePath('/campo/rdo');
  revalidatePath(`/proyectos/${parte.proyecto_id}`);
  return { ok: true };
}

export async function eliminarRdo(id: string): Promise<Res> {
  const session = await requireSession();
  const supabase = createClient() as any;
  const { data: parte } = await supabase.from('partes_diarios').select('created_by, estado, proyecto_id').eq('id', id).single();
  if (!parte) return { ok: false, error: 'Reporte no encontrado' };
  if (parte.created_by !== session.id) return { ok: false, error: 'Solo el autor puede eliminar el reporte' };
  if (parte.estado === 'aprobado') return { ok: false, error: 'Un reporte aprobado no se puede eliminar' };
  const { error } = await supabase.from('partes_diarios').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/campo/rdo');
  return { ok: true };
}

// Adjunta evidencias EXISTENTES del proyecto a un reporte (les asigna rdo_id),
// para que se usen en el RDO y aparezcan en el consolidado.
export async function adjuntarEvidenciasRdo(rdoId: string, evidenciaIds: string[]): Promise<Res> {
  await requireSession();
  if (!evidenciaIds.length) return { ok: true };
  const supabase = createClient() as any;
  const { error } = await supabase.from('evidencias').update({ rdo_id: rdoId }).in('id', evidenciaIds);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/campo/rdo');
  return { ok: true };
}

// Registra en el reporte las fotos ya subidas al bucket (evidencias con rdo_id).
export async function adjuntarFotosRdo(rdoId: string, proyectoId: string, fotos: { url: string; descripcion?: string }[]): Promise<Res> {
  const session = await requireSession();
  if (!fotos.length) return { ok: true };
  const supabase = createClient();
  const { error } = await supabase.from('evidencias').insert(
    fotos.map((f) => ({ url: f.url, proyecto_id: proyectoId, rdo_id: rdoId, descripcion: f.descripcion || null, created_by: session.id })),
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath('/campo/rdo');
  return { ok: true };
}
