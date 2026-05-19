import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CalendarRange,
  ClipboardCheck,
  ExternalLink,
  Hammer,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN, formatNumber, formatPercent } from '@/lib/utils';
import {
  PROYECTO_ESTADO_LABEL,
  PROYECTO_ESTADO_VARIANT,
  type ProyectoEstado,
} from '@/lib/proyectos/estados';
import { cambiarEstadoProyecto } from './actions';
import { MetradoInput } from './metrado-input';
import { UbicacionSection } from '@/components/proyectos/ubicacion-section';
import { AsistenciasSection } from '@/components/proyectos/asistencias-section';
import { RdosSection } from '@/components/proyectos/rdos-section';
import { EvidenciasSection } from '@/components/proyectos/evidencias-section';
import { SstSection } from '@/components/proyectos/sst-section';
import { DocumentosSection } from '@/components/proyectos/documentos-section';
import { AlmacenSection } from '@/components/proyectos/almacen-section';
import { AlertasBanner } from '@/components/proyectos/alertas-banner';
import { computeAlertasProyecto } from '@/lib/proyectos/alertas';

export const dynamic = 'force-dynamic';

export default async function ProyectoDetallePage({ params }: { params: { id: string } }) {
  await requireSession();
  const supabase = createClient();

  const [{ data: proyecto }, { data: resumen }, { data: ubigeos }] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', params.id).single(),
    supabase.from('v_proyectos_resumen').select('*').eq('id', params.id).single(),
    supabase
      .from('ubigeos')
      .select('codigo, departamento, provincia, distrito, latitud, longitud, tipo'),
  ]);

  if (!proyecto) notFound();

  const { data: etapas } = await supabase
    .from('proyecto_etapas')
    .select('id, codigo, nombre, orden')
    .eq('proyecto_id', params.id)
    .order('orden');

  // Suma de solicitudes pagadas (para alerta de sobrecosto)
  const { data: solicitudesPagadas } = await supabase
    .from('solicitudes_pago')
    .select('monto')
    .eq('proyecto_id', params.id)
    .eq('estado', 'pagada');
  const gastadoReal = (solicitudesPagadas ?? []).reduce(
    (sum, s) => sum + Number(s.monto ?? 0),
    0,
  );

  const { data: partidasRaw } = await supabase
    .from('proyecto_partidas')
    .select(
      'id, codigo, descripcion, unidad, metrado_contractual, metrado_ejecutado, precio_unitario_costo, precio_unitario_venta, monto_contractual_venta, monto_ejecutado_venta, porcentaje_avance, etapa_id, orden',
    )
    .eq('proyecto_id', params.id)
    .order('orden');

  const partidas = (partidasRaw ?? []).map((p) => ({
    ...p,
    metrado_contractual: Number(p.metrado_contractual),
    metrado_ejecutado: Number(p.metrado_ejecutado),
    monto_contractual_venta: Number(p.monto_contractual_venta),
    monto_ejecutado_venta: Number(p.monto_ejecutado_venta),
    porcentaje_avance: Number(p.porcentaje_avance),
  }));

  const moneda = (proyecto.moneda as string) === 'USD' ? 'USD' : 'PEN';
  const fmt = (n: number) =>
    moneda === 'USD'
      ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatPEN(n);

  const estado = proyecto.estado as ProyectoEstado;
  const avance = Number(resumen?.porcentaje_avance ?? 0);
  const ejecutadoCosto = partidas.reduce(
    (sum, p) => sum + p.metrado_ejecutado * Number(p.precio_unitario_costo),
    0,
  );
  const contratoCosto = partidas.reduce(
    (sum, p) => sum + p.metrado_contractual * Number(p.precio_unitario_costo),
    0,
  );
  const margenCalculado =
    contratoCosto > 0 ? ((Number(proyecto.presupuesto_venta) - contratoCosto) / contratoCosto) * 100 : 0;

  // Calcular alertas
  const alertas = computeAlertasProyecto({
    estado: estado,
    fechaInicio: proyecto.fecha_inicio,
    fechaFinPlan: proyecto.fecha_fin_plan,
    fechaFinReal: proyecto.fecha_fin_real,
    presupuestoVenta: Number(proyecto.presupuesto_venta ?? 0),
    ejecutadoVenta: Number(resumen?.ejecutado_venta ?? 0),
    gastadoReal,
    pctAvance: avance,
    latitud: proyecto.latitud == null ? null : Number(proyecto.latitud),
    longitud: proyecto.longitud == null ? null : Number(proyecto.longitud),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={proyecto.nombre}
        description={`Código ${proyecto.codigo}${proyecto.descripcion ? ' · ' + proyecto.descripcion : ''}`}
        icon={Building2}
        breadcrumbs={[
          { label: 'Proyectos', href: '/proyectos' },
          { label: proyecto.codigo ?? '—' },
        ]}
        actions={
          <>
            <Link href={`/proyectos/${params.id}/valorizaciones`}>
              <Button variant="secondary">Valorizaciones</Button>
            </Link>
            <Link href={`/proyectos/${params.id}/adicionales`}>
              <Button variant="secondary">Adicionales</Button>
            </Link>
            {proyecto.cotizacion_id && (
              <Link href={`/comercial/cotizaciones/${proyecto.cotizacion_id}`}>
                <Button variant="ghost">
                  <ClipboardCheck className="h-4 w-4" />
                  Cotización
                </Button>
              </Link>
            )}
            <Badge variant={PROYECTO_ESTADO_VARIANT[estado]} className="ml-1">
              {PROYECTO_ESTADO_LABEL[estado]}
            </Badge>
          </>
        }
      />

      {/* Alertas del proyecto */}
      <AlertasBanner alertas={alertas} />

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Avance físico
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-azur-red">
            {formatPercent(avance / 100)}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-azur-gradient transition-all"
              style={{ width: `${Math.min(avance, 100)}%` }}
            />
          </div>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contrato (venta)
          </p>
          <p className="mt-1 font-display text-xl font-bold text-azur-ink">
            {fmt(Number(proyecto.presupuesto_venta ?? 0))}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {partidas.length} partida{partidas.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ejecutado
          </p>
          <p className="mt-1 font-display text-xl font-bold text-azur-red">
            {fmt(Number(resumen?.ejecutado_venta ?? 0))}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Costo real: {fmt(ejecutadoCosto)}
          </p>
        </div>
        <div className="azur-card bg-azur-gradient text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
            Margen estimado
          </p>
          <p className="mt-1 font-display text-2xl font-bold">
            {formatPercent(margenCalculado / 100)}
          </p>
          <p className="mt-1 text-[11px] opacity-80">
            (Venta − Costo) / Costo · snapshot inicial
          </p>
        </div>
      </div>

      {/* Ubicación con ubigeo + mapa */}
      <UbicacionSection
        proyectoId={params.id}
        ubigeos={(ubigeos ?? []).map((u) => ({
          codigo: u.codigo,
          departamento: u.departamento,
          provincia: u.provincia,
          distrito: u.distrito,
          latitud: u.latitud == null ? null : Number(u.latitud),
          longitud: u.longitud == null ? null : Number(u.longitud),
          tipo: u.tipo as 'departamento' | 'provincia' | 'distrito',
        }))}
        initial={{
          ubigeo_codigo: proyecto.ubigeo_codigo ?? null,
          departamento: proyecto.departamento ?? null,
          provincia: proyecto.provincia ?? null,
          distrito: proyecto.distrito ?? null,
          direccion: proyecto.direccion ?? null,
          ubicacion: proyecto.ubicacion ?? null,
          latitud: proyecto.latitud == null ? null : Number(proyecto.latitud),
          longitud: proyecto.longitud == null ? null : Number(proyecto.longitud),
          radio_geofence_m: proyecto.radio_geofence_m ?? null,
        }}
      />

      {/* Otros datos del proyecto */}
      <div className="azur-card grid gap-4 sm:grid-cols-3">
        <Field
          icon={CalendarRange}
          label="Fecha inicio"
          value={
            proyecto.fecha_inicio
              ? new Date(proyecto.fecha_inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : '—'
          }
        />
        <Field
          icon={CalendarRange}
          label="Fecha fin plan"
          value={
            proyecto.fecha_fin_plan
              ? new Date(proyecto.fecha_fin_plan).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })
              : 'A definir'
          }
        />
        <Field
          icon={TrendingUp}
          label="Margen cotizado"
          value={`${Number(proyecto.margen_porcentaje ?? 0).toFixed(2)}%`}
        />
      </div>

      {/* Partidas */}
      <section className="azur-card p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-azur-ink">Estructura del proyecto</h2>
            <p className="text-xs text-muted-foreground">
              {etapas?.length ?? 0} etapa(s) · {partidas.length} partida(s) · Metrado ejecutado
              editable
            </p>
          </div>
        </div>

        {partidas.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Hammer}
              title="Sin partidas"
              description="Este proyecto aún no tiene partidas. Se agregan automáticamente desde la cotización aprobada o manualmente."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                  <th className="px-4 py-3 font-semibold">Und</th>
                  <th className="px-4 py-3 text-right font-semibold">Metrado contractual</th>
                  <th className="px-4 py-3 text-right font-semibold">Metrado ejecutado</th>
                  <th className="px-4 py-3 text-right font-semibold">P.U. Venta</th>
                  <th className="px-4 py-3 text-right font-semibold">Ejecutado</th>
                  <th className="px-4 py-3 text-right font-semibold">% Avance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {partidas.map((p) => (
                  <tr key={p.id} className="hover:bg-azur-coral/5">
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-azur-red">
                      {p.codigo}
                    </td>
                    <td className="px-4 py-2.5 text-azur-ink">{p.descripcion}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.unidad}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatNumber(p.metrado_contractual)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <MetradoInput
                        partidaId={p.id}
                        proyectoId={params.id}
                        inicial={p.metrado_ejecutado}
                        max={p.metrado_contractual}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {fmt(Number(p.precio_unitario_venta))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-azur-ink">
                      {fmt(p.monto_ejecutado_venta)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-azur-gradient"
                            style={{ width: `${Math.min(p.porcentaje_avance, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-azur-ink">
                          {p.porcentaje_avance.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-azur-coral/5">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">
                    Totales
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-base font-bold text-azur-red">
                    {fmt(Number(resumen?.ejecutado_venta ?? 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-base font-bold text-azur-ink">
                    {formatPercent(avance / 100)}
                  </td>
                </tr>
              </tfoot>
            </table>
            <p className="border-t border-border/60 px-6 py-2 text-[11px] text-muted-foreground">
              Editá el metrado ejecutado y la página recalculará avance, monto y % en el próximo refresh.
            </p>
          </div>
        )}
      </section>

      {/* Asistencias GPS del personal de campo */}
      <AsistenciasSection proyectoId={params.id} />

      {/* Partes diarios (RDO) */}
      <RdosSection proyectoId={params.id} />

      {/* Evidencias fotográficas */}
      <EvidenciasSection proyectoId={params.id} />

      {/* Seguridad y Salud (SST) */}
      <SstSection proyectoId={params.id} />

      {/* Almacén del proyecto */}
      <AlmacenSection proyectoId={params.id} />

      {/* Documentos del proyecto */}
      <DocumentosSection proyectoId={params.id} />

      {/* Estado del proyecto */}
      <div className="azur-card flex flex-wrap items-center justify-between gap-3 bg-azur-coral/10">
        <div>
          <p className="font-display text-base font-bold text-azur-ink">Estado del proyecto</p>
          <p className="text-xs text-muted-foreground">
            Cambiar a "Cerrado" registra la fecha de fin real automáticamente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['planificado', 'en_curso', 'pausado', 'cerrado', 'cancelado'] as ProyectoEstado[])
            .filter((e) => e !== estado)
            .map((e) => (
              <form key={e} action={cambiarEstadoProyecto} className="contents">
                <input type="hidden" name="id" value={proyecto.id} />
                <input type="hidden" name="estado" value={e} />
                <Button
                  type="submit"
                  variant={e === 'cerrado' ? 'default' : e === 'cancelado' ? 'destructive' : 'secondary'}
                  size="sm"
                >
                  {PROYECTO_ESTADO_LABEL[e]}
                </Button>
              </form>
            ))}
        </div>
      </div>

      <p className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <Link href="/proyectos" className="inline-flex items-center gap-1 hover:text-azur-red">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al listado
        </Link>
        {proyecto.cotizacion_id && (
          <Link
            href={`/api/cotizaciones/${proyecto.cotizacion_id}/pdf`}
            target="_blank"
            className="inline-flex items-center gap-1 hover:text-azur-red"
          >
            Cotización aprobada (PDF)
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </p>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-azur-ink">{value}</p>
      </div>
    </div>
  );
}
