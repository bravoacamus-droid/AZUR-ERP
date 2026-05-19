import Link from 'next/link';
import { Calendar, ClipboardSignature, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';

type Props = {
  proyectoId: string;
};

const CLIMA_EMOJI: Record<string, string> = {
  soleado: '☀',
  nublado: '☁',
  nuboso: '⛅',
  lluvioso: '🌧',
  tormenta: '⛈',
};

export async function RdosSection({ proyectoId }: Props) {
  const supabase = createClient();

  const { data } = await supabase
    .from('rdo_partes')
    .select(
      'id, codigo, fecha, clima, temperatura_c, resumen, observaciones, incidencias, personal_total, reportado_por',
    )
    .eq('proyecto_id', proyectoId)
    .order('fecha', { ascending: false })
    .limit(10);

  const userIds = [...new Set((data ?? []).map((r) => r.reportado_por).filter(Boolean))] as string[];
  const perfilMap = new Map<string, { full_name: string }>();
  if (userIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    (perfiles ?? []).forEach((p) => perfilMap.set(p.id, { full_name: p.full_name }));
  }

  const items = (data ?? []).map((r) => ({
    ...r,
    perfil: r.reportado_por ? perfilMap.get(r.reportado_por) ?? null : null,
  }));

  return (
    <section className="azur-card p-0">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-bold text-azur-ink">
            Partes diarios (RDO)
          </h2>
          <p className="text-xs text-muted-foreground">
            Reportes registrados desde la PWA por el residente.
          </p>
        </div>
        <Link
          href={`/proyectos/${proyectoId}/rdos`}
          className="text-xs font-semibold text-azur-red hover:underline"
        >
          Ver todos →
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          Aún no hay partes diarios. Cuando el residente registre uno desde la PWA, aparecerá aquí.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((r) => (
            <li key={r.id} className="px-6 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/proyectos/${proyectoId}/rdos/${r.id}`}
                      className="font-mono text-xs font-semibold text-azur-red hover:underline"
                    >
                      {r.codigo}
                    </Link>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(r.fecha).toLocaleDateString('es-PE', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
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
                  {r.resumen && (
                    <p className="mt-1 line-clamp-2 text-sm text-azur-ink">{r.resumen}</p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Reportado por: {r.perfil?.full_name ?? '—'}
                  </p>
                </div>
                <Link
                  href={`/proyectos/${proyectoId}/rdos/${r.id}`}
                  className="shrink-0 text-xs font-semibold text-azur-red hover:underline"
                >
                  Ver →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
