import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, ClipboardSignature, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Partes diarios del proyecto' };

const CLIMA_EMOJI: Record<string, string> = {
  soleado: '☀',
  nublado: '☁',
  nuboso: '⛅',
  lluvioso: '🌧',
  tormenta: '⛈',
};

type SearchParams = {
  desde?: string;
  hasta?: string;
};

export default async function RdosProyectoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: SearchParams;
}) {
  await requireSession();
  const supabase = createClient();

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('id, codigo, nombre')
    .eq('id', params.id)
    .single();
  if (!proyecto) notFound();

  const desde = searchParams?.desde ?? new Date(Date.now() - 60 * 86400_000).toISOString().slice(0, 10);
  const hasta = searchParams?.hasta ?? new Date().toISOString().slice(0, 10);

  const { data: rdos } = await supabase
    .from('rdo_partes')
    .select(
      'id, codigo, fecha, clima, temperatura_c, resumen, observaciones, incidencias, personal_total, reportado_por, created_at',
    )
    .eq('proyecto_id', params.id)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false })
    .limit(200);

  const userIds = [...new Set((rdos ?? []).map((r) => r.reportado_por).filter(Boolean))] as string[];
  const perfilMap = new Map<string, { full_name: string; email: string }>();
  if (userIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    (perfiles ?? []).forEach((p) =>
      perfilMap.set(p.id, { full_name: p.full_name, email: p.email }),
    );
  }

  const items = (rdos ?? []).map((r) => ({
    ...r,
    perfil: r.reportado_por ? perfilMap.get(r.reportado_por) ?? null : null,
  }));

  const inputClass =
    'flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Partes diarios"
        description={`${proyecto.codigo} · ${proyecto.nombre}`}
        icon={ClipboardSignature}
        breadcrumbs={[
          { label: 'Proyectos', href: '/proyectos' },
          { label: proyecto.codigo, href: `/proyectos/${params.id}` },
          { label: 'Partes diarios' },
        ]}
      />

      {/* Filtros */}
      <form className="azur-card grid gap-3 sm:grid-cols-3 sm:items-end">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Desde
          </label>
          <input type="date" name="desde" defaultValue={desde} className={`mt-1 ${inputClass}`} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hasta
          </label>
          <input type="date" name="hasta" defaultValue={hasta} className={`mt-1 ${inputClass}`} />
        </div>
        <div className="flex justify-end gap-2">
          <Link
            href={`/proyectos/${params.id}/rdos`}
            className="inline-flex h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-medium hover:border-azur-coral"
          >
            Limpiar
          </Link>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-azur-gradient px-5 text-sm font-semibold text-white shadow-azur-md"
          >
            Filtrar
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardSignature}
          title="Sin partes diarios en este periodo"
          description="Cuando el residente registre un parte desde la PWA, aparecerá aquí."
        />
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <article
              key={r.id}
              className="azur-card transition-shadow hover:shadow-azur-md"
            >
              <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/proyectos/${params.id}/rdos/${r.id}`}
                      className="font-mono text-sm font-bold text-azur-red hover:underline"
                    >
                      {r.codigo}
                    </Link>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(r.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Reportado por <strong>{r.perfil?.full_name ?? '—'}</strong>
                    {r.perfil?.email && ` · ${r.perfil.email}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.clima && (
                    <Badge variant="coral">
                      {CLIMA_EMOJI[r.clima] ?? '·'} {r.clima}
                    </Badge>
                  )}
                  {r.temperatura_c != null && (
                    <Badge variant="outline">{Number(r.temperatura_c).toFixed(1)}°C</Badge>
                  )}
                  {r.personal_total != null && r.personal_total > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {r.personal_total}
                    </Badge>
                  )}
                </div>
              </header>

              <div className="grid gap-3 text-sm md:grid-cols-3">
                {r.resumen && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Resumen del día
                    </p>
                    <p className="mt-0.5 text-azur-ink">{r.resumen}</p>
                  </div>
                )}
                {r.observaciones && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Observaciones
                    </p>
                    <p className="mt-0.5 text-azur-ink">{r.observaciones}</p>
                  </div>
                )}
                {r.incidencias && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                      Incidencias
                    </p>
                    <p className="mt-0.5 text-azur-ink">{r.incidencias}</p>
                  </div>
                )}
              </div>
            </article>
          ))}
          <p className="text-center text-[11px] text-muted-foreground">
            {items.length} parte(s) · máx 200 por filtro
          </p>
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        <Link
          href={`/proyectos/${params.id}`}
          className="inline-flex items-center gap-1 hover:text-azur-red"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al proyecto
        </Link>
      </p>
    </div>
  );
}
