import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { fmtDateInput } from '@/lib/format';
import { RdoForm, type RdoInicial } from '../../rdo-form';

export const dynamic = 'force-dynamic';

export default async function EditarRdoPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const supabase = createClient() as any;

  const { data: parte } = await supabase.from('partes_diarios').select('*').eq('id', params.id).single();
  if (!parte) notFound();
  // El residente autor edita en borrador/observado (el jefe edita/aprueba desde Oficina).
  const editable = parte.created_by === session.id && ['borrador', 'observado'].includes(parte.estado);
  if (!editable) redirect('/campo/rdo');

  const [{ data: acts }, { data: fotos }, { data: proyectos }, { data: partidas }] = await Promise.all([
    supabase.from('rdo_actividades').select('descripcion, proyecto_item_id, avance_pct, estado').eq('rdo_id', params.id),
    supabase.from('evidencias').select('id, url').eq('rdo_id', params.id).order('created_at'),
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase.from('proyecto_items').select('id, titulo, proyecto_id').eq('es_hoja', true).order('orden'),
  ]);

  const inicial: RdoInicial = {
    id: parte.id,
    proyecto_id: parte.proyecto_id,
    fecha: fmtDateInput(parte.fecha),
    clima: parte.clima, jornada: parte.jornada, personal_count: parte.personal_count,
    equipos: parte.equipos, materiales_recibidos: parte.materiales_recibidos,
    programacion: parte.programacion, observaciones: parte.observaciones, incidencias: parte.incidencias,
    actividades: (acts ?? []).map((a: any) => ({ descripcion: a.descripcion, proyecto_item_id: a.proyecto_item_id, avance_pct: a.avance_pct == null ? null : Number(a.avance_pct), estado: a.estado })),
    fotos: (fotos ?? []).map((f: any) => ({ id: f.id, url: f.url })),
  };

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo/rdo" className="mb-1 inline-flex items-center text-sm text-muted-foreground"><ChevronLeft className="size-4" /> Reportes</Link>
        <h1 className="text-xl font-bold">Editar reporte diario</h1>
        {parte.estado === 'observado' && parte.obs_revision && <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Observación del jefe: {parte.obs_revision}</p>}
      </div>
      <RdoForm proyectos={proyectos ?? []} partidas={partidas ?? []} hoy={fmtDateInput(new Date())} inicial={inicial} />
    </div>
  );
}
