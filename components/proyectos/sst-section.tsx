import Link from 'next/link';
import { AlertOctagon, AlertTriangle, ClipboardCheck, ShieldAlert, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';

type Props = { proyectoId: string };

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

export async function SstSection({ proyectoId }: Props) {
  const supabase = createClient();

  const [{ data: charlas }, { data: obs }, { data: inc }] = await Promise.all([
    supabase
      .from('sst_charlas')
      .select('id, fecha, tema, asistencia, notas, reportada_por')
      .eq('proyecto_id', proyectoId)
      .order('fecha', { ascending: false })
      .limit(5),
    supabase
      .from('sst_observaciones')
      .select('id, tipo, descripcion, accion_correctiva, fecha, resuelta, reportada_por')
      .eq('proyecto_id', proyectoId)
      .order('fecha', { ascending: false })
      .limit(5),
    supabase
      .from('sst_incidentes')
      .select('id, severidad, descripcion, involucrados, acciones, fecha, hora, reportado_por')
      .eq('proyecto_id', proyectoId)
      .order('fecha', { ascending: false })
      .limit(5),
  ]);

  const charlasList = charlas ?? [];
  const obsList = obs ?? [];
  const incList = inc ?? [];

  const obsAbiertas = obsList.filter((o) => !o.resuelta).length;
  const incGraves = incList.filter((i) => i.severidad === 'grave' || i.severidad === 'critico').length;

  // Perfiles (charlas + obs + inc pueden tener distintos reportadores)
  const userIds = [
    ...new Set([
      ...charlasList.map((c) => c.reportada_por),
      ...obsList.map((o) => o.reportada_por),
      ...incList.map((i) => i.reportado_por),
    ].filter(Boolean)),
  ] as string[];
  const perfilMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    (perfiles ?? []).forEach((p) => perfilMap.set(p.id, p.full_name));
  }

  return (
    <section className="azur-card p-0">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-bold text-azur-ink">Seguridad y Salud (SST)</h2>
          <p className="text-xs text-muted-foreground">
            Charlas, observaciones e incidentes reportados desde la PWA.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {obsAbiertas > 0 && (
            <Badge variant="warning">{obsAbiertas} obs. abierta(s)</Badge>
          )}
          {incGraves > 0 && <Badge variant="destructive">{incGraves} inc. grave(s)</Badge>}
          {obsAbiertas === 0 && incGraves === 0 && <Badge variant="success">Sin alertas</Badge>}
        </div>
      </header>

      <div className="grid gap-4 p-6 md:grid-cols-3">
        {/* Charlas */}
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-azur-red">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Charlas 5 min
          </h3>
          {charlasList.length === 0 ? (
            <p className="text-xs text-muted-foreground">— Sin charlas registradas —</p>
          ) : (
            <ul className="space-y-2">
              {charlasList.map((c) => (
                <li key={c.id} className="rounded-lg border border-border/60 bg-white p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-azur-ink">
                      {new Date(c.fecha).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {c.asistencia}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-azur-ink">{c.tema}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {c.reportada_por ? perfilMap.get(c.reportada_por) ?? '—' : '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Observaciones */}
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-azur-red">
            <AlertTriangle className="h-3.5 w-3.5" />
            Observaciones
          </h3>
          {obsList.length === 0 ? (
            <p className="text-xs text-muted-foreground">— Sin observaciones —</p>
          ) : (
            <ul className="space-y-2">
              {obsList.map((o) => (
                <li key={o.id} className="rounded-lg border border-border/60 bg-white p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-azur-ink">
                      {TIPO_OBS_LABEL[o.tipo] ?? o.tipo}
                    </span>
                    <Badge variant={o.resuelta ? 'success' : 'warning'}>
                      {o.resuelta ? 'Resuelta' : 'Abierta'}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-azur-ink">{o.descripcion}</p>
                  {o.accion_correctiva && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                      → {o.accion_correctiva}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(o.fecha).toLocaleDateString('es-PE')} ·{' '}
                    {o.reportada_por ? perfilMap.get(o.reportada_por) ?? '—' : '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Incidentes */}
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-destructive">
            <AlertOctagon className="h-3.5 w-3.5" />
            Incidentes
          </h3>
          {incList.length === 0 ? (
            <p className="text-xs text-muted-foreground">— Sin incidentes —</p>
          ) : (
            <ul className="space-y-2">
              {incList.map((i) => (
                <li
                  key={i.id}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-azur-ink">
                      {new Date(i.fecha).toLocaleDateString('es-PE')}
                    </span>
                    <Badge variant={SEV_VARIANT[i.severidad] ?? 'secondary'}>{i.severidad}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-azur-ink">{i.descripcion}</p>
                  {i.involucrados && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Involucrados: {i.involucrados}
                    </p>
                  )}
                  {i.acciones && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                      Acciones: {i.acciones}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {i.reportado_por ? perfilMap.get(i.reportado_por) ?? '—' : '—'}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
