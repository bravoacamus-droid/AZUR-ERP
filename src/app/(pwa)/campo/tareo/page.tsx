import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { TareoForm } from './tareo-form';
import { fmtDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/misc';

export const dynamic = 'force-dynamic';

export default async function TareoPage() {
  await requireSession();
  const supabase = createClient();
  const [{ data: proyectos }, { data: tareo }] = await Promise.all([
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase.from('tareo').select('*, proyecto:proyectos(nombre)').order('fecha', { ascending: false }).limit(40),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Tareo de cuadrilla</h1>
      <TareoForm proyectos={proyectos ?? []} />

      <div>
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Registros recientes</p>
        {!tareo || tareo.length === 0 ? (
          <EmptyState titulo="Sin tareo registrado" />
        ) : (
          <div className="space-y-1.5">
            {tareo.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border bg-white p-3 text-sm">
                <div>
                  <p className="font-medium">{t.trabajador_nombre}</p>
                  <p className="text-xs text-muted-foreground">{(t.proyecto as { nombre?: string } | null)?.nombre} · {fmtDate(t.fecha)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium ${t.presente ? 'text-emerald-600' : 'text-azur-600'}`}>{t.presente ? 'Presente' : 'Ausente'}</span>
                  {t.horas != null && <p className="text-xs text-muted-foreground">{t.horas} h</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
