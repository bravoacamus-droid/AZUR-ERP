import Link from 'next/link';
import { ClipboardCheck, ShieldAlert, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CharlaForm } from './charla-form';
import { ObservacionForm } from './observacion-form';
import { IncidenteForm } from './incidente-form';

export const metadata = { title: 'SST · Seguridad y Salud' };
export const dynamic = 'force-dynamic';

const SEV_VARIANT: Record<string, 'secondary' | 'warning' | 'destructive'> = {
  leve: 'secondary',
  moderado: 'warning',
  grave: 'destructive',
  critico: 'destructive',
};

const TIPO_OBS_LABEL: Record<string, string> = {
  acto_inseguro: 'Acto inseguro',
  condicion_insegura: 'Condición insegura',
  sugerencia: 'Sugerencia',
};

export default async function SstPage() {
  const session = await requireSession();
  const supabase = createClient();

  const { data: asignados } = await supabase
    .from('usuario_proyectos')
    .select('proyecto:proyecto_id(id, codigo, nombre)')
    .eq('user_id', session.userId)
    .eq('activo', true);

  let proyectos = (asignados ?? [])
    .map((a) => (Array.isArray(a.proyecto) ? a.proyecto[0] : a.proyecto))
    .filter(Boolean) as Array<{ id: string; codigo: string; nombre: string }>;

  if (proyectos.length === 0) {
    const { data } = await supabase
      .from('proyectos')
      .select('id, codigo, nombre')
      .neq('estado', 'cancelado')
      .order('codigo', { ascending: false })
      .limit(15);
    proyectos = data ?? [];
  }

  const proyectoIds = proyectos.map((p) => p.id);

  const [{ data: charlas }, { data: obs }, { data: inc }] = await Promise.all([
    proyectoIds.length
      ? supabase
          .from('sst_charlas')
          .select('id, fecha, tema, asistencia')
          .in('proyecto_id', proyectoIds)
          .order('fecha', { ascending: false })
          .limit(5)
      : Promise.resolve({
          data: [] as Array<{ id: string; fecha: string; tema: string; asistencia: number }>,
        }),
    proyectoIds.length
      ? supabase
          .from('sst_observaciones')
          .select('id, tipo, descripcion, fecha, resuelta')
          .in('proyecto_id', proyectoIds)
          .order('fecha', { ascending: false })
          .limit(5)
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            tipo: string;
            descripcion: string;
            fecha: string;
            resuelta: boolean;
          }>,
        }),
    proyectoIds.length
      ? supabase
          .from('sst_incidentes')
          .select('id, severidad, descripcion, fecha')
          .in('proyecto_id', proyectoIds)
          .order('fecha', { ascending: false })
          .limit(5)
      : Promise.resolve({
          data: [] as Array<{ id: string; severidad: string; descripcion: string; fecha: string }>,
        }),
  ]);

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <Link href="/inicio" className="text-xs font-semibold text-muted-foreground hover:text-azur-red">
          ← Inicio
        </Link>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-azur-ink">
          <ShieldAlert className="h-6 w-6 text-azur-red" />
          Seguridad y Salud
        </h1>
        <p className="text-sm text-muted-foreground">
          Charla diaria, observaciones (actos / condiciones inseguras) e incidentes.
        </p>
      </header>

      {proyectos.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Sin proyectos disponibles" />
      ) : (
        <>
          {/* Charla 5 min */}
          <section className="azur-card space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-azur-red" />
              <h2 className="font-display text-base font-bold text-azur-ink">Charla de 5 minutos</h2>
            </div>
            <CharlaForm proyectos={proyectos} />
            {charlas && charlas.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-azur-red">Últimas charlas</summary>
                <ul className="mt-2 space-y-1.5">
                  {charlas.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-1.5"
                    >
                      <span>
                        <strong>{new Date(c.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}</strong> · {c.tema}
                      </span>
                      <Badge variant="outline">
                        <Users className="mr-1 h-3 w-3" />
                        {c.asistencia}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {/* Observación */}
          <ObservacionForm proyectos={proyectos} />
          {obs && obs.length > 0 && (
            <details className="azur-card text-xs">
              <summary className="cursor-pointer text-azur-red font-semibold">
                Últimas observaciones
              </summary>
              <ul className="mt-2 space-y-1.5">
                {obs.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-1.5"
                  >
                    <span className="line-clamp-1">
                      <strong>{TIPO_OBS_LABEL[o.tipo] ?? o.tipo}</strong> — {o.descripcion}
                    </span>
                    <Badge variant={o.resuelta ? 'success' : 'warning'}>
                      {o.resuelta ? 'Resuelta' : 'Abierta'}
                    </Badge>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {/* Incidente */}
          <IncidenteForm proyectos={proyectos} />
          {inc && inc.length > 0 && (
            <details className="azur-card text-xs">
              <summary className="cursor-pointer text-destructive font-semibold">
                Últimos incidentes
              </summary>
              <ul className="mt-2 space-y-1.5">
                {inc.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5"
                  >
                    <span className="line-clamp-1">{i.descripcion}</span>
                    <Badge variant={SEV_VARIANT[i.severidad] ?? 'secondary'}>{i.severidad}</Badge>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </div>
  );
}
