import Link from 'next/link';
import { AlertOctagon, AlertTriangle, ClipboardCheck, ShieldAlert, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { registrarObservacion, registrarIncidente } from './actions';
import { CharlaForm } from './charla-form';

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

const inputClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

const textareaClass =
  'flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

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
                        <strong>{new Date(c.fecha).toLocaleDateString('es-PE')}</strong> · {c.tema}
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

          <form action={registrarObservacion} className="azur-card space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-azur-red" />
              <h2 className="font-display text-base font-bold text-azur-ink">Reportar observación</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obs_proy">Proyecto</Label>
              <select name="proyecto_id" id="obs_proy" required className={inputClass}>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} · {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select name="tipo" id="tipo" required className={inputClass} defaultValue="condicion_insegura">
                <option value="acto_inseguro">Acto inseguro</option>
                <option value="condicion_insegura">Condición insegura</option>
                <option value="sugerencia">Sugerencia</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea name="descripcion" id="descripcion" required rows={2} className={textareaClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accion_correctiva">Acción correctiva (opcional)</Label>
              <textarea name="accion_correctiva" id="accion_correctiva" rows={2} className={textareaClass} />
            </div>
            <Button type="submit" className="w-full">
              Reportar observación
            </Button>
            {obs && obs.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-azur-red">Últimas observaciones</summary>
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
          </form>

          <form
            action={registrarIncidente}
            className="azur-card space-y-3 border-destructive/30 bg-destructive/5"
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-destructive" />
              <h2 className="font-display text-base font-bold text-destructive">Reportar incidente</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inc_proy">Proyecto</Label>
              <select name="proyecto_id" id="inc_proy" required className={inputClass}>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} · {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="severidad">Severidad</Label>
                <select name="severidad" id="severidad" required className={inputClass} defaultValue="leve">
                  <option value="leve">Leve</option>
                  <option value="moderado">Moderado</option>
                  <option value="grave">Grave</option>
                  <option value="critico">Crítico</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="involucrados">Involucrados</Label>
                <Input name="involucrados" id="involucrados" placeholder="Nombres" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inc_desc">Descripción</Label>
              <textarea name="descripcion" id="inc_desc" required rows={3} className={textareaClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acciones">Acciones inmediatas tomadas</Label>
              <textarea name="acciones" id="acciones" rows={2} className={textareaClass} />
            </div>
            <Button type="submit" variant="destructive" className="w-full">
              Reportar incidente
            </Button>
            {inc && inc.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-destructive">Últimos incidentes</summary>
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
          </form>
        </>
      )}
    </div>
  );
}
