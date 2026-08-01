import { renderToBuffer } from '@react-pdf/renderer';
import { createElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fmtDate } from '@/lib/format';
import { armarArbol, renumerar } from '@/lib/calc';
import { RdoPDF, type RdoPdfData } from './rdo-pdf';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { id: string; rdoId: string } }) {
  // Cliente sin tipar: columnas recientes (estado/revisión, es_hito) aún no están
  // en los tipos generados.
  const supabase = createClient() as any;

  const { data: parte } = await supabase
    .from('partes_diarios')
    .select('*, proyectos(nombre, codigo, cliente:clientes(razon_social)), autor:profiles!created_by(nombre, firma_data), revisor:profiles!revisado_by(nombre, firma_data)')
    .eq('id', params.rdoId)
    .single();
  if (!parte || parte.proyecto_id !== params.id) return new Response('No encontrado', { status: 404 });

  const [{ data: acts }, { data: fotos }, { data: allItems }] = await Promise.all([
    supabase.from('rdo_actividades').select('descripcion, avance_pct, proyecto_item_id').eq('rdo_id', params.rdoId),
    supabase.from('evidencias').select('url, descripcion').eq('rdo_id', params.rdoId).order('created_at'),
    supabase.from('proyecto_items').select('id, parent_id, nivel, orden, item_codigo, titulo, es_hoja, es_hito').eq('proyecto_id', params.id).order('orden'),
  ]);

  const codigos = renumerar(armarArbol(((allItems ?? []).filter((i: any) => !i.es_hito)) as never) as never);
  const itemById = new Map((allItems ?? []).map((i: any) => [i.id, i]));

  const proy = parte.proyectos as { nombre?: string; codigo?: string; cliente?: { razon_social?: string } | null } | null;
  const autor = parte.autor as { nombre?: string; firma_data?: string | null } | null;
  const revisor = parte.revisor as { nombre?: string; firma_data?: string | null } | null;

  const d: RdoPdfData = {
    proyecto: proy?.nombre ?? 'Proyecto',
    codigo: proy?.codigo ?? '',
    cliente: proy?.cliente?.razon_social ?? undefined,
    fecha: fmtDate(parte.fecha),
    estado: parte.estado ?? 'borrador',
    residente: autor?.nombre ?? undefined,
    residenteFirma: autor?.firma_data ?? undefined,
    jefe: revisor?.nombre ?? undefined,
    jefeFirma: revisor?.firma_data ?? undefined,
    revisadoFecha: parte.revisado_at ? fmtDate(parte.revisado_at) : undefined,
    obsRevision: parte.obs_revision ?? undefined,
    clima: parte.clima ?? undefined,
    personal: parte.personal_count ?? undefined,
    equipos: parte.equipos ?? undefined,
    materiales: parte.materiales_recibidos ?? undefined,
    observaciones: parte.observaciones ?? undefined,
    incidencias: parte.incidencias ?? undefined,
    actividades: (acts ?? []).map((a: any) => {
      const it = (a.proyecto_item_id ? itemById.get(a.proyecto_item_id) : null) as any;
      return {
        codigo: it ? (codigos.get(it.id) ?? it.item_codigo ?? '') : '',
        titulo: it?.titulo ?? undefined,
        descripcion: a.descripcion,
        avancePct: a.avance_pct == null ? null : Number(a.avance_pct),
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
