import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { fmtDateInput } from '@/lib/format';
import { RdoForm, type RdoInicial } from '@/app/(pwa)/campo/rdo/rdo-form';

export const dynamic = 'force-dynamic';

export default async function EditarRdoOficinaPage({ params }: { params: { id: string; rdoId: string } }) {
  const session = await requireModulo('proyectos', 'editar');
  const esJefe = session.rol === 'jefe_proyectos' || session.rol === 'gerencia';
  const supabase = createClient() as any;

  const { data: parte } = await supabase.from('partes_diarios').select('*').eq('id', params.rdoId).single();
  if (!parte || parte.proyecto_id !== params.id) notFound();
  // El jefe/gerencia edita el reporte mientras está "enviado".
  if (!(esJefe && parte.estado === 'enviado')) redirect(`/proyectos/${params.id}`);

  const [{ data: acts }, { data: fotos }, { data: proyectos }, { data: partidas }] = await Promise.all([
    supabase.from('rdo_actividades').select('descripcion, proyecto_item_id, avance_pct, estado').eq('rdo_id', params.rdoId),
    supabase.from('evidencias').select('id, url').eq('rdo_id', params.rdoId).order('created_at'),
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase.from('proyecto_items').select('id, titulo, proyecto_id').eq('es_hoja', true).order('orden'),
  ]);

  const inicial: RdoInicial = {
    id: parte.id, proyecto_id: parte.proyecto_id, fecha: fmtDateInput(parte.fecha),
    clima: parte.clima, jornada: parte.jornada, personal_count: parte.personal_count,
    equipos: parte.equipos, materiales_recibidos: parte.materiales_recibidos,
    programacion: parte.programacion, observaciones: parte.observaciones, incidencias: parte.incidencias,
    actividades: (acts ?? []).map((a: any) => ({ descripcion: a.descripcion, proyecto_item_id: a.proyecto_item_id, avance_pct: a.avance_pct == null ? null : Number(a.avance_pct), estado: a.estado })),
    fotos: (fotos ?? []).map((f: any) => ({ id: f.id, url: f.url })),
  };

  return (
    <div className="space-y-4">
      <Link href={`/proyectos/${params.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Volver al proyecto</Link>
      <h1 className="text-xl font-bold">Editar reporte de obra</h1>
      <div className="max-w-2xl">
        <RdoForm proyectos={proyectos ?? []} partidas={partidas ?? []} hoy={fmtDateInput(new Date())} inicial={inicial} volverA={`/proyectos/${params.id}`} />
      </div>
    </div>
  );
}
