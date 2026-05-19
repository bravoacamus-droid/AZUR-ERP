import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  Calendar,
  ClipboardSignature,
  CloudRain,
  Thermometer,
  Users,
  User,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const CLIMA_LABEL: Record<string, string> = {
  soleado: '☀ Soleado',
  nublado: '☁ Nublado',
  nuboso: '⛅ Nuboso',
  lluvioso: '🌧 Lluvioso',
  tormenta: '⛈ Tormenta',
};

export default async function RdoDetallePage({
  params,
}: {
  params: { id: string; rdoId: string };
}) {
  await requireSession();
  const supabase = createClient();

  const [{ data: proyecto }, { data: rdo }] = await Promise.all([
    supabase.from('proyectos').select('id, codigo, nombre').eq('id', params.id).single(),
    supabase.from('rdo_partes').select('*').eq('id', params.rdoId).single(),
  ]);

  if (!proyecto || !rdo) notFound();

  let perfil: { full_name: string; email: string } | null = null;
  if (rdo.reportado_por) {
    const { data: p } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', rdo.reportado_por)
      .single();
    perfil = p ?? null;
  }
  const fecha = new Date(rdo.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Parte diario · ${fecha}`}
        description={`${rdo.codigo} · ${proyecto.codigo} ${proyecto.nombre}`}
        icon={ClipboardSignature}
        breadcrumbs={[
          { label: 'Proyectos', href: '/proyectos' },
          { label: proyecto.codigo, href: `/proyectos/${params.id}` },
          { label: 'Partes diarios', href: `/proyectos/${params.id}/rdos` },
          { label: rdo.codigo ?? '—' },
        ]}
      />

      {/* Resumen rápido */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="azur-card">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-azur-red" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Fecha
            </p>
          </div>
          <p className="mt-1 font-display text-base font-bold text-azur-ink">{fecha}</p>
        </div>
        <div className="azur-card">
          <div className="flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-azur-red" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Clima
            </p>
          </div>
          <p className="mt-1 font-display text-base font-bold text-azur-ink">
            {rdo.clima ? CLIMA_LABEL[rdo.clima] ?? rdo.clima : '— No registrado —'}
          </p>
        </div>
        <div className="azur-card">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-azur-red" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Temperatura
            </p>
          </div>
          <p className="mt-1 font-display text-base font-bold text-azur-ink">
            {rdo.temperatura_c != null ? `${Number(rdo.temperatura_c).toFixed(1)}°C` : '—'}
          </p>
        </div>
        <div className="azur-card bg-azur-gradient text-white">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
              Personal en obra
            </p>
          </div>
          <p className="mt-1 font-display text-2xl font-bold">{rdo.personal_total ?? 0}</p>
        </div>
      </div>

      {/* Reportado por */}
      <div className="azur-card flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-azur-gradient text-sm font-bold text-white">
          {initials(perfil?.full_name ?? perfil?.email ?? '?')}
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Reportado por
          </p>
          <p className="font-display text-base font-bold text-azur-ink">
            {perfil?.full_name ?? '—'}
          </p>
          {perfil?.email && <p className="text-xs text-muted-foreground">{perfil.email}</p>}
        </div>
        <div className="ml-auto text-right text-xs text-muted-foreground">
          <p>Registrado el</p>
          <p className="font-mono">{new Date(rdo.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</p>
        </div>
      </div>

      {/* Contenido */}
      {rdo.resumen && (
        <section className="azur-card">
          <h2 className="font-display text-base font-bold text-azur-ink">Resumen del día</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-azur-ink">{rdo.resumen}</p>
        </section>
      )}

      {rdo.observaciones && (
        <section className="azur-card">
          <h2 className="font-display text-base font-bold text-azur-ink">Observaciones</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-azur-ink">{rdo.observaciones}</p>
        </section>
      )}

      {rdo.incidencias && (
        <section className="azur-card border-warning/30 bg-warning/5">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-[hsl(38_92%_30%)]">
            <AlertTriangle className="h-4 w-4" />
            Incidencias
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm text-azur-ink">{rdo.incidencias}</p>
        </section>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        <Link
          href={`/proyectos/${params.id}/rdos`}
          className="inline-flex items-center gap-1 hover:text-azur-red"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a la lista de partes
        </Link>
      </p>
    </div>
  );
}
