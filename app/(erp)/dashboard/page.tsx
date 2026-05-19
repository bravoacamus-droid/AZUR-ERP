import Link from 'next/link';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { AvanceFinancieroChart } from '@/components/charts/avance-financiero';
import { GastoCategoriaChart } from '@/components/charts/gasto-categoria';
import { formatPEN, formatPercent } from '@/lib/utils';
import { PROYECTO_ESTADO_LABEL, PROYECTO_ESTADO_VARIANT, type ProyectoEstado } from '@/lib/proyectos/estados';
import { computeAlertasProyecto, type Alerta } from '@/lib/proyectos/alertas';

export const metadata = { title: 'Dashboard ejecutivo' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  await requireSession();
  const supabase = createClient();

  const [
    { data: cartera },
    { data: gastoCat },
    { data: avance },
    { data: solicitudes },
  ] = await Promise.all([
    supabase.from('v_dashboard_cartera').select('*'),
    supabase.from('v_dashboard_gasto_categoria').select('*'),
    supabase.from('v_dashboard_avance_vs_gasto').select('*').limit(12),
    supabase.from('v_dashboard_solicitudes').select('*'),
  ]);

  const proyectosActivos = (cartera ?? []).reduce((s, c) => s + Number(c.cantidad ?? 0), 0);
  const monto = (cartera ?? []).reduce((s, c) => s + Number(c.monto_contrato ?? 0), 0);
  const ejecutadoTotal = (avance ?? []).reduce(
    (s, a) => s + Number(a.ejecutado_venta ?? 0),
    0,
  );

  // Alertas por proyecto (mismo motor que /proyectos/[id])
  const proyectosConAlertas = (avance ?? []).map((a) => {
    const contractual = Number(a.contractual ?? 0);
    const ejecutado = Number(a.ejecutado_venta ?? 0);
    const presupuesto = Number(a.presupuesto_venta ?? contractual);
    const alertas = computeAlertasProyecto({
      estado: a.estado as string,
      fechaInicio: a.fecha_inicio as string | null,
      fechaFinPlan: a.fecha_fin_plan as string | null,
      fechaFinReal: a.fecha_fin_real as string | null,
      presupuestoVenta: presupuesto,
      ejecutadoVenta: ejecutado,
      gastadoReal: Number(a.gastado_real ?? 0),
      pctAvance: Number(a.pct_avance ?? 0),
      latitud: a.latitud as number | null,
      longitud: a.longitud as number | null,
    });
    return {
      id: a.id as string,
      codigo: a.codigo as string,
      nombre: a.nombre as string,
      alertas,
      maxSeveridad: maxSev(alertas),
    };
  });

  const enRiesgo = proyectosConAlertas.filter(
    (p) => p.maxSeveridad === 'critica' || p.maxSeveridad === 'alta',
  );
  const proyectosCriticos = proyectosConAlertas
    .filter((p) => p.alertas.length > 0)
    .sort((a, b) => sevOrder(a.maxSeveridad) - sevOrder(b.maxSeveridad));

  const pendientesAprobar =
    (solicitudes ?? []).find((s) => s.estado === 'pendiente')?.cantidad ?? 0;
  const aprobadasJefe = (solicitudes ?? []).find((s) => s.estado === 'aprobada_jefe')?.cantidad ?? 0;

  const barData = (avance ?? []).map((a) => ({
    proyecto: a.codigo as string,
    contractual: Number(a.contractual ?? 0),
    ejecutado: Number(a.ejecutado_venta ?? 0),
    gastado: Number(a.gastado_real ?? 0),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard ejecutivo"
        description="Visión 360 del avance físico vs financiero, cartera de proyectos y bandeja de aprobaciones."
        icon={LayoutDashboard}
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Building2} label="Proyectos activos" value={proyectosActivos} accent="default" />
        <Kpi
          icon={Wallet}
          label="Cartera en contrato"
          value={formatPEN(monto)}
          accent="brand"
          subtitle={`Ejecutado: ${formatPEN(ejecutadoTotal)}`}
        />
        <Kpi
          icon={ClipboardList}
          label="Solicitudes pendientes"
          value={pendientesAprobar}
          accent={Number(pendientesAprobar) > 0 ? 'warn' : 'default'}
          subtitle={`Aprobadas jefe: ${aprobadasJefe}`}
        />
        <Kpi
          icon={enRiesgo.length > 0 ? AlertTriangle : CheckCircle2}
          label="Proyectos en riesgo"
          value={enRiesgo.length}
          accent={enRiesgo.length > 0 ? 'danger' : 'success'}
          subtitle={
            enRiesgo.length > 0
              ? `${proyectosCriticos.filter((p) => p.maxSeveridad === 'critica').length} crítico(s) · ${enRiesgo.length - proyectosCriticos.filter((p) => p.maxSeveridad === 'critica').length} alto(s)`
              : 'Sin alertas críticas'
          }
        />
      </div>

      {/* Proyectos con alertas */}
      {proyectosCriticos.length > 0 && (
        <section className="azur-card p-0">
          <header className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-azur-ink">
                Proyectos con alertas · {proyectosCriticos.length}
              </h2>
              <p className="text-xs text-muted-foreground">
                Atiende los críticos primero. Click para abrir el proyecto.
              </p>
            </div>
          </header>
          <ul className="divide-y divide-border/60">
            {proyectosCriticos.slice(0, 8).map((p) => {
              const top = p.alertas[0];
              const SevIcon = p.maxSeveridad === 'critica' ? AlertOctagon : AlertTriangle;
              const sevColor =
                p.maxSeveridad === 'critica'
                  ? 'text-destructive'
                  : p.maxSeveridad === 'alta'
                    ? 'text-[hsl(38_92%_30%)]'
                    : 'text-muted-foreground';
              return (
                <li key={p.id}>
                  <Link
                    href={`/proyectos/${p.id}`}
                    className="flex items-start gap-3 px-6 py-3 hover:bg-azur-coral/5"
                  >
                    <div className={`mt-0.5 ${sevColor}`}>
                      <SevIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-azur-ink">
                        <span className="font-mono text-xs text-azur-red">{p.codigo}</span>{' '}
                        · {p.nombre}
                      </p>
                      {top && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          <span className={`font-semibold ${sevColor}`}>{top.titulo}:</span>{' '}
                          {top.mensaje}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {p.alertas.length} alerta{p.alertas.length > 1 ? 's' : ''}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="azur-card lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-bold text-azur-ink">
            Avance vs gasto real
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Comparativo por proyecto. Barras más oscuras indican gasto real superior al avance físico
            valorizado.
          </p>
          <AvanceFinancieroChart data={barData} moneda="PEN" />
        </section>

        <section className="azur-card">
          <h2 className="mb-3 font-display text-lg font-bold text-azur-ink">Gasto por categoría</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Solo solicitudes aprobadas, programadas y pagadas.
          </p>
          <GastoCategoriaChart
            data={(gastoCat ?? []).map((g) => ({
              categoria: g.categoria ?? 'otros',
              total: Number(g.total ?? 0),
            }))}
            moneda="PEN"
          />
        </section>
      </div>

      {/* Cartera por estado */}
      <section className="azur-card">
        <h2 className="mb-4 font-display text-lg font-bold text-azur-ink">Cartera por estado</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {(cartera ?? []).map((c) => (
            <div
              key={c.estado}
              className="rounded-2xl border border-border/60 bg-white p-4"
            >
              <Badge variant={PROYECTO_ESTADO_VARIANT[c.estado as ProyectoEstado]}>
                {PROYECTO_ESTADO_LABEL[c.estado as ProyectoEstado]}
              </Badge>
              <p className="mt-3 font-display text-2xl font-bold text-azur-ink">{c.cantidad}</p>
              <p className="text-xs text-muted-foreground">
                {formatPEN(Number(c.monto_contrato ?? 0))}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tabla de avance */}
      <section className="azur-card overflow-hidden p-0">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-azur-ink">Detalle por proyecto</h2>
        </div>
        {(!avance || avance.length === 0) ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            Aún no hay proyectos con avance registrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Proyecto</th>
                <th className="px-4 py-3 text-right font-semibold">Contractual</th>
                <th className="px-4 py-3 text-right font-semibold">Ejecutado</th>
                <th className="px-4 py-3 text-right font-semibold">Gastado real</th>
                <th className="px-4 py-3 text-right font-semibold">% Avance</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {avance.map((a) => {
                const ejec = Number(a.ejecutado_venta ?? 0);
                const gast = Number(a.gastado_real ?? 0);
                const enRiesgo = gast > ejec * 1.1;
                return (
                  <tr key={a.id} className="hover:bg-azur-coral/5">
                    <td className="px-4 py-2.5 font-mono text-xs text-azur-red">{a.codigo}</td>
                    <td className="px-4 py-2.5 text-azur-ink">{a.nombre}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      {formatPEN(Number(a.contractual ?? 0))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{formatPEN(ejec)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-semibold ${
                          enRiesgo ? 'text-destructive' : 'text-azur-ink'
                        }`}
                      >
                        {enRiesgo ? (
                          <TrendingDown className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingUp className="h-3.5 w-3.5" />
                        )}
                        {formatPEN(gast)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">
                      {formatPercent(Number(a.pct_avance ?? 0) / 100)}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={PROYECTO_ESTADO_VARIANT[a.estado as ProyectoEstado]}>
                        {PROYECTO_ESTADO_LABEL[a.estado as ProyectoEstado]}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function maxSev(alertas: Alerta[]): Alerta['severidad'] | 'ninguna' {
  if (alertas.length === 0) return 'ninguna';
  if (alertas.some((a) => a.severidad === 'critica')) return 'critica';
  if (alertas.some((a) => a.severidad === 'alta')) return 'alta';
  if (alertas.some((a) => a.severidad === 'media')) return 'media';
  return 'info';
}

function sevOrder(s: Alerta['severidad'] | 'ninguna'): number {
  return { critica: 0, alta: 1, media: 2, info: 3, ninguna: 4 }[s];
}

function Kpi({
  icon: Icon,
  label,
  value,
  subtitle,
  accent,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  subtitle?: string;
  accent: 'default' | 'brand' | 'warn' | 'danger' | 'success';
}) {
  const accentClass: Record<typeof accent, string> = {
    default: 'bg-azur-coral/20 text-azur-red',
    brand: 'bg-azur-gradient text-white',
    warn: 'bg-warning/15 text-[hsl(38_92%_30%)]',
    danger: 'bg-destructive/15 text-destructive',
    success: 'bg-success/15 text-success',
  };

  return (
    <div className={`azur-card ${accent === 'brand' ? 'bg-azur-gradient text-white' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              accent === 'brand' ? 'opacity-80' : 'text-muted-foreground'
            }`}
          >
            {label}
          </p>
          <p
            className={`mt-1 font-display text-2xl font-bold ${
              accent === 'brand' ? 'text-white' : 'text-azur-ink'
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className={`mt-0.5 text-[11px] ${
                accent === 'brand' ? 'opacity-80' : 'text-muted-foreground'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            accent === 'brand' ? 'bg-white/20 text-white' : accentClass[accent]
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
