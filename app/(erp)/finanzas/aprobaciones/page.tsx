import Link from 'next/link';
import { ArrowRight, Mailbox } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN } from '@/lib/utils';
import {
  SOLICITUD_ESTADO_LABEL,
  SOLICITUD_ESTADO_VARIANT,
  SOLICITUD_CATEGORIA_LABEL,
  URGENCIA_LABEL,
  URGENCIA_VARIANT,
  type SolicitudEstado,
} from '@/lib/finanzas/estados';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Bandeja de aprobaciones' };

export default async function AprobacionesPage() {
  const session = await requireSession();
  const supabase = createClient();

  // Bandeja según rol:
  //  - jefes / gerencia → pendientes (sin aprobar_jefe)
  //  - administrador    → aprobada_jefe (esperando programación)
  let estadosFiltro: SolicitudEstado[] = [];
  let titulo = 'Bandeja de aprobaciones';
  let descripcion = '';
  if (['gerencia_general', 'jefe_proyectos', 'jefe_presupuestos'].includes(session.rol)) {
    estadosFiltro = ['pendiente'];
    descripcion = 'Solicitudes esperando tu aprobación como jefe.';
  } else if (session.rol === 'administrador') {
    estadosFiltro = ['aprobada_jefe'];
    descripcion = 'Solicitudes aprobadas por el jefe — listas para programar el pago.';
    titulo = 'Bandeja del administrador';
  }

  const { data: rows } = await supabase
    .from('solicitudes_pago')
    .select('id, codigo, concepto, beneficiario, monto, moneda, categoria, urgencia, estado, created_at, proyecto:proyecto_id(codigo, nombre)')
    .in('estado', estadosFiltro.length > 0 ? estadosFiltro : ['pendiente'])
    .order('urgencia', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);

  const solicitudes = rows ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={titulo}
        description={descripcion}
        icon={Mailbox}
        breadcrumbs={[{ label: 'Finanzas' }, { label: 'Aprobaciones' }]}
      />

      {solicitudes.length === 0 ? (
        <EmptyState
          icon={Mailbox}
          title="Bandeja vacía"
          description="No hay solicitudes esperando tu acción. Cuando se registre una nueva, aparecerá aquí ordenada por urgencia."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {solicitudes.map((s) => {
            const proyecto = Array.isArray(s.proyecto) ? s.proyecto[0] : s.proyecto;
            const fmt = (n: number) =>
              s.moneda === 'USD'
                ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : formatPEN(n);
            return (
              <Link
                key={s.id}
                href={`/finanzas/solicitudes/${s.id}`}
                className="azur-card group flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-azur-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] font-semibold text-azur-red">{s.codigo}</p>
                    <h3 className="line-clamp-2 font-display text-sm font-bold text-azur-ink">
                      {s.concepto}
                    </h3>
                  </div>
                  <Badge variant={URGENCIA_VARIANT[s.urgencia] ?? 'outline'}>
                    {URGENCIA_LABEL[s.urgencia] ?? s.urgencia}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-azur-ink">{s.beneficiario}</span> ·{' '}
                  {SOLICITUD_CATEGORIA_LABEL[s.categoria] ?? s.categoria}
                </p>

                {proyecto && (
                  <p className="text-[11px] text-muted-foreground">
                    Proyecto: <span className="text-azur-ink">{proyecto.codigo}</span> · {proyecto.nombre}
                  </p>
                )}

                <div className="flex items-end justify-between gap-2 pt-2">
                  <Badge variant={SOLICITUD_ESTADO_VARIANT[s.estado as SolicitudEstado]}>
                    {SOLICITUD_ESTADO_LABEL[s.estado as SolicitudEstado]}
                  </Badge>
                  <p className="font-mono text-base font-bold text-azur-ink">{fmt(Number(s.monto))}</p>
                </div>

                <p className="flex items-center gap-1 text-xs font-semibold text-azur-red opacity-0 transition-opacity group-hover:opacity-100">
                  Revisar
                  <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
