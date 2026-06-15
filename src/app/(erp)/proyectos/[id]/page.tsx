import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { ProyectoDetalle } from './detalle';

export const dynamic = 'force-dynamic';

export default async function ProyectoPage({ params }: { params: { id: string } }) {
  const session = await requireRol(['gerencia', 'jefe_proyectos', 'presupuestos']);
  const supabase = createClient();

  const { data: proy } = await supabase
    .from('proyectos')
    .select('*, cliente:clientes(*), linea:lineas_negocio(*)')
    .eq('id', params.id)
    .single();
  if (!proy) notFound();

  const [items, vals, contrapartes, equipo, armadas, adicionales, dash, caja, perfiles, hitos, documentos] = await Promise.all([
    supabase.from('proyecto_items').select('*').eq('proyecto_id', params.id).order('orden'),
    supabase.from('valorizaciones').select('*, valorizacion_items(*)').eq('proyecto_id', params.id).order('numero'),
    supabase.from('contrapartes').select('id, razon_social, tipo').order('razon_social'),
    supabase.from('proyecto_equipo').select('id, rol_obra, profile:profiles(id, nombre, rol)').eq('proyecto_id', params.id),
    supabase.from('cronograma_cobros').select('*').eq('proyecto_id', params.id).order('orden'),
    supabase.from('adicionales_deductivos').select('*').eq('proyecto_id', params.id).order('created_at', { ascending: false }),
    supabase.from('v_dashboard_proyecto').select('*').eq('proyecto_id', params.id).single(),
    supabase.from('v_cajas_saldos').select('*').eq('proyecto_id', params.id),
    supabase.from('profiles').select('id, nombre, rol').eq('activo', true).order('nombre'),
    supabase.from('hitos').select('*').eq('proyecto_id', params.id).order('fecha_comprometida'),
    supabase.from('documentos').select('*').eq('proyecto_id', params.id).order('created_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-4">
      <Link href="/proyectos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Volver a proyectos
      </Link>
      <ProyectoDetalle
        proy={proy}
        items={items.data ?? []}
        valorizaciones={vals.data ?? []}
        contrapartes={contrapartes.data ?? []}
        equipo={equipo.data ?? []}
        armadas={armadas.data ?? []}
        adicionales={adicionales.data ?? []}
        dash={dash.data}
        cajas={caja.data ?? []}
        perfiles={perfiles.data ?? []}
        hitos={hitos.data ?? []}
        documentos={documentos.data ?? []}
        canManage={['gerencia', 'jefe_proyectos', 'presupuestos'].includes(session.rol)}
      />
    </div>
  );
}
