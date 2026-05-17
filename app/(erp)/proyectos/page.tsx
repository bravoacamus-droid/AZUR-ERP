import Link from 'next/link';
import { Building2, ArrowRight, MapPin, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN, formatPercent } from '@/lib/utils';
import {
  PROYECTO_ESTADO_LABEL,
  PROYECTO_ESTADO_VARIANT,
  type ProyectoEstado,
} from '@/lib/proyectos/estados';

export const metadata = { title: 'Proyectos' };
export const dynamic = 'force-dynamic';

export default async function ProyectosListPage() {
  await requireSession();
  const supabase = createClient();

  const { data: proyectos } = await supabase
    .from('v_proyectos_resumen')
    .select('*')
    .order('codigo', { ascending: false });

  const items = proyectos ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Proyectos"
        description="Cartera de obras con avance físico y financiero por proyecto."
        icon={Building2}
        breadcrumbs={[{ label: 'Proyectos' }]}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin proyectos aún"
          description="Los proyectos se crean automáticamente al aprobar una cotización. Ve a Comercial → Cotizaciones, abre una y márcala como 'Aprobada'."
          action={
            <Link
              href="/comercial/cotizaciones"
              className="inline-flex items-center gap-2 rounded-full bg-azur-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-azur-md"
            >
              Ir a Cotizaciones
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => {
            const moneda = p.moneda ?? 'PEN';
            const fmt = (n: number) =>
              moneda === 'USD'
                ? `$ ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : formatPEN(Number(n));
            const avance = Number(p.porcentaje_avance ?? 0);
            return (
              <Link
                key={p.id}
                href={`/proyectos/${p.id}`}
                className="azur-card group relative overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-azur-lg"
              >
                {/* Banner color por estado */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
                    p.estado === 'en_curso'
                      ? 'from-azur-red to-azur-bright'
                      : p.estado === 'cerrado'
                        ? 'from-success to-success/70'
                        : 'from-azur-coral to-azur-coral/40'
                  }`}
                />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] font-semibold text-azur-red">{p.codigo}</p>
                      <h3 className="mt-0.5 line-clamp-2 font-display text-base font-bold text-azur-ink">
                        {p.nombre}
                      </h3>
                    </div>
                    <Badge variant={PROYECTO_ESTADO_VARIANT[p.estado as ProyectoEstado]}>
                      {PROYECTO_ESTADO_LABEL[p.estado as ProyectoEstado]}
                    </Badge>
                  </div>

                  {p.ubicacion && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.ubicacion}
                    </p>
                  )}

                  {p.fecha_inicio && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Inicio:{' '}
                      {new Date(p.fecha_inicio).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}

                  {/* Avance bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Avance</span>
                      <span className="font-bold text-azur-ink">
                        {formatPercent(avance / 100)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-azur-gradient transition-all"
                        style={{ width: `${Math.min(avance, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Contrato
                      </p>
                      <p className="font-mono text-sm font-bold text-azur-ink">
                        {fmt(Number(p.presupuesto_venta ?? 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Ejecutado
                      </p>
                      <p className="font-mono text-sm font-bold text-azur-red">
                        {fmt(Number(p.ejecutado_venta ?? 0))}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {p.partidas_count} partida{Number(p.partidas_count) === 1 ? '' : 's'}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
