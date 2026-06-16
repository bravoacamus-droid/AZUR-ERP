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

  const [{ data: catalogo }, { data: apuTpl }, { data: apuProy }] = await Promise.all([
    supabase.from('catalogo_partidas').select('id, codigo, descripcion, unidad, costo_referencial').order('codigo'),
    supabase.from('catalogo_apu').select('catalogo_partida_id'),
    supabase.from('apu_proyecto').select('*, item:proyecto_items!inner(proyecto_id)').eq('item.proyecto_id', params.id).order('orden'),
  ]);
  const conApu = new Set((apuTpl ?? []).map((a) => a.catalogo_partida_id));
  const catalogoConApu = (catalogo ?? []).map((c) => ({ ...c, tiene_apu: conApu.has(c.id) }));

  const { data: servicios } = await supabase
    .from('servicios_mantenimiento')
    .select('*')
    .eq('proyecto_id', params.id)
    .order('fecha_planificada');

  // Datos de campo (capturados desde la PWA) para supervisión del Jefe
  const [asistencias, partesDiarios, evidencias, sstCharlas, sstObs, sstInc] = await Promise.all([
    supabase.from('asistencias').select('*, persona:profiles(nombre)').eq('proyecto_id', params.id).order('registrado_at', { ascending: false }).limit(50),
    supabase.from('partes_diarios').select('*, autor:profiles(nombre), rdo_actividades(*)').eq('proyecto_id', params.id).order('fecha', { ascending: false }).limit(30),
    supabase.from('evidencias').select('*').eq('proyecto_id', params.id).order('created_at', { ascending: false }).limit(60),
    supabase.from('sst_charlas').select('*').eq('proyecto_id', params.id).order('fecha', { ascending: false }).limit(20),
    supabase.from('sst_observaciones').select('*').eq('proyecto_id', params.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('sst_incidentes').select('*').eq('proyecto_id', params.id).order('created_at', { ascending: false }).limit(20),
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
        catalogo={catalogoConApu}
        apuProyecto={apuProy ?? []}
        servicios={servicios ?? []}
        campo={{
          asistencias: asistencias.data ?? [],
          partes: partesDiarios.data ?? [],
          evidencias: evidencias.data ?? [],
          sstCharlas: sstCharlas.data ?? [],
          sstObs: sstObs.data ?? [],
          sstInc: sstInc.data ?? [],
        }}
        canManage={['gerencia', 'jefe_proyectos', 'presupuestos'].includes(session.rol)}
      />
    </div>
  );
}
