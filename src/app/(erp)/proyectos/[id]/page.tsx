import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { puedeEditar } from '@/lib/permisos';
import { ProyectoDetalle } from './detalle';

export const dynamic = 'force-dynamic';

export default async function ProyectoPage({ params }: { params: { id: string } }) {
  const session = await requireModulo('proyectos', 'ver');
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
    supabase.from('profiles').select('id, nombre, rol, firma_data').eq('activo', true).order('nombre'),
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

  const { data: solicitudes } = await supabase
    .from('solicitudes_cambio')
    .select('*')
    .eq('proyecto_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: adelantos } = await supabase
    .from('adelantos')
    .select('*')
    .eq('proyecto_id', params.id)
    .order('fecha');

  // Comparativo Comercial vs Proyecto (solo totales/márgenes) para itemizado propio.
  const sumHojas = (arr: { es_hoja?: boolean | null; total_costo?: number | null; cantidad?: number | null; costo_unitario?: number | null }[]) =>
    (arr ?? []).reduce((a, i) => a + (i.es_hoja ? Number(i.total_costo ?? (Number(i.cantidad ?? 0) * Number(i.costo_unitario ?? 0))) : 0), 0);
  let costoComercial: number | null = null;
  let cotMoneda = 'PEN';
  let cotTc = 1;
  if (proy.cotizacion_id) {
    const [{ data: cotItems }, { data: cotMon }] = await Promise.all([
      supabase.from('cotizacion_items').select('es_hoja, cantidad, costo_unitario').eq('cotizacion_id', proy.cotizacion_id),
      supabase.from('cotizaciones').select('moneda, tipo_cambio').eq('id', proy.cotizacion_id).single(),
    ]);
    cotMoneda = cotMon?.moneda ?? 'PEN';
    // El proyecto opera en soles: si la cotización está en USD, convertir el costo
    // comercial con el mismo T.C. para comparar en la misma moneda que venta/costoProyecto.
    cotTc = cotMoneda === 'USD' ? Number(cotMon?.tipo_cambio ?? 1) : 1;
    costoComercial = sumHojas(cotItems ?? []) * cotTc;
  }
  const costoProyecto = sumHojas((items.data ?? []) as never);
  const comparativo = {
    venta: Number(proy.contrato_total),
    costoComercial,
    costoProyecto,
    monedaCotizacion: cotMoneda,
    tipoCambio: cotTc,
  };

  // Presupuesto por tipo de gasto: Proyectado (reparto manual) vs Real (solicitudes pagadas/conciliadas)
  const TIPOS_GASTO: { tipo: string; label: string }[] = [
    { tipo: 'contratistas', label: 'Contratistas' },
    { tipo: 'proveedores', label: 'Proveedores' },
    { tipo: 'caja_chica', label: 'Caja chica' },
    { tipo: 'servicios', label: 'Servicios' },
    { tipo: 'honorarios', label: 'Honorarios' },
  ];
  const [{ data: ptg }, { data: solsGasto }] = await Promise.all([
    supabase.from('presupuesto_tipo_gasto').select('tipo, monto_proyectado').eq('proyecto_id', params.id),
    supabase.from('solicitudes_pago').select('tipo, monto, status').eq('proyecto_id', params.id).in('status', ['pagada', 'conciliada']),
  ]);
  const proyMap = new Map((ptg ?? []).map((r) => [r.tipo as string, Number(r.monto_proyectado)]));
  const realMap = new Map<string, number>();
  (solsGasto ?? []).forEach((s) => realMap.set(s.tipo as string, (realMap.get(s.tipo as string) ?? 0) + Number(s.monto)));
  const presupuestoGasto = {
    costo: costoProyecto,
    tipos: TIPOS_GASTO.map((t) => ({ ...t, proyectado: proyMap.get(t.tipo) ?? 0, real: realMap.get(t.tipo) ?? 0 })),
  };

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
        usuariosFirma={(perfiles.data ?? []).map((u) => ({ id: u.id, nombre: u.nombre, rol: u.rol as string, tiene_firma: !!(u as { firma_data?: string | null }).firma_data }))}
        hitos={hitos.data ?? []}
        documentos={documentos.data ?? []}
        catalogo={catalogoConApu}
        apuProyecto={apuProy ?? []}
        servicios={servicios ?? []}
        solicitudes={solicitudes ?? []}
        comparativo={comparativo}
        presupuestoGasto={presupuestoGasto}
        adelantos={adelantos ?? []}
        userId={session.id}
        userNombre={session.nombre}
        userRol={session.rol}
        campo={{
          asistencias: asistencias.data ?? [],
          partes: partesDiarios.data ?? [],
          evidencias: evidencias.data ?? [],
          sstCharlas: sstCharlas.data ?? [],
          sstObs: sstObs.data ?? [],
          sstInc: sstInc.data ?? [],
        }}
        canManage={puedeEditar(session.permisos, 'proyectos')}
      />
    </div>
  );
}
