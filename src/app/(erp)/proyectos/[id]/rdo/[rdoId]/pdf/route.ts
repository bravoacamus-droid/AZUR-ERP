import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/format';
import { RdoPDF, type RdoPdfData } from './rdo-pdf';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string; rdoId: string } }) {
  // Cliente sin tipar: columnas recientes (estado/revisión, es_hito) aún no están
  // en los tipos generados.
  const supabase = createClient() as any;

  const { data: parte } = await supabase
    .from('partes_diarios')
    .select('*, proyectos(nombre, codigo, direccion, cliente:clientes(razon_social)), autor:profiles!created_by(nombre, cip, firma_data), revisor:profiles!revisado_by(nombre, cip, firma_data)')
    .eq('id', params.rdoId)
    .single();
  if (!parte || parte.proyecto_id !== params.id) return new Response('No encontrado', { status: 404 });

  const [{ data: acts }, { data: fotos }, { data: allItems }, { data: equipo }] = await Promise.all([
    supabase.from('rdo_actividades').select('descripcion, avance_pct, estado, proyecto_item_id').eq('rdo_id', params.rdoId),
    supabase.from('evidencias').select('url, descripcion').eq('rdo_id', params.rdoId).order('created_at'),
    supabase.from('proyecto_items').select('id, parent_id, nivel, orden, item_codigo, titulo, es_hoja, es_hito').eq('proyecto_id', params.id).order('orden'),
    supabase.from('proyecto_equipo').select('profile:profiles(nombre, cip, firma_data, rol)').eq('proyecto_id', params.id),
  ]);

  const itemById = new Map((allItems ?? []).map((i: any) => [i.id, i]));

  const proy = parte.proyectos as { nombre?: string; codigo?: string; direccion?: string; cliente?: { razon_social?: string } | null } | null;
  const autor = parte.autor as { nombre?: string; cip?: string; firma_data?: string | null } | null;
  const revisor = parte.revisor as { nombre?: string; cip?: string; firma_data?: string | null } | null;
  // Supervisor: quien revisó; si aún no, el jefe de proyectos del equipo.
  const jefeEquipo = (equipo ?? []).map((e: any) => e.profile).find((p: any) => p?.rol === 'jefe_proyectos') as { nombre?: string; cip?: string; firma_data?: string | null } | undefined;
  const sup = revisor ?? jefeEquipo ?? null;

  const d: RdoPdfData = {
    proyecto: proy?.nombre ?? 'Proyecto',
    ubicacion: proy?.direccion ?? undefined,
    codigo: proy?.codigo ?? '',
    cliente: proy?.cliente?.razon_social ?? undefined,
    fecha: fmtDate(parte.fecha),
    estado: parte.estado ?? 'borrador',
    residente: autor?.nombre ?? undefined,
    residenteCip: autor?.cip ?? undefined,
    residenteFirma: autor?.firma_data ?? undefined,
    supervisor: sup?.nombre ?? undefined,
    supervisorCip: sup?.cip ?? undefined,
    supervisorFirma: sup?.firma_data ?? undefined,
    jornada: parte.jornada ?? undefined,
    personal: parte.personal_count ?? undefined,
    clima: parte.clima ?? undefined,
    equipos: parte.equipos ?? undefined,
    materiales: parte.materiales_recibidos ?? undefined,
    programacion: parte.programacion ?? undefined,
    revisadoFecha: parte.revisado_at ? fmtDate(parte.revisado_at) : undefined,
    obsRevision: parte.obs_revision ?? undefined,
    observaciones: parte.observaciones ?? undefined,
    incidencias: parte.incidencias ?? undefined,
    actividades: (acts ?? []).map((a: any) => {
      const it = (a.proyecto_item_id ? itemById.get(a.proyecto_item_id) : null) as any;
      return {
        actividad: a.descripcion,
        partida: it?.titulo ?? undefined,
        avancePct: a.avance_pct == null ? null : Number(a.avance_pct),
        estado: a.estado ?? undefined,
      };
    }),
    fotos: (fotos ?? []).map((f: any) => ({ url: f.url, descripcion: f.descripcion ?? undefined })),
  };

  const buffer = await renderToBuffer(createElement(RdoPDF as never, { d }) as never);
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Reporte-${proy?.codigo ?? ''}-${parte.fecha}.pdf"`,
    },
  });
}
