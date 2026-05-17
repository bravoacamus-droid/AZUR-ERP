import { History, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { redirect } from 'next/navigation';

export const metadata = { title: 'Auditoría · Log inmutable' };
export const dynamic = 'force-dynamic';

const ACTION_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  INSERT: 'success',
  UPDATE: 'warning',
  DELETE: 'destructive',
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams?: { table?: string; action?: string };
}) {
  const session = await requireSession();
  if (session.rol !== 'gerencia_general') redirect('/dashboard');

  const supabase = createClient();

  let query = supabase
    .from('audit_log')
    .select('id, occurred_at, actor_email, table_name, record_id, action, diff')
    .order('occurred_at', { ascending: false })
    .limit(200);

  if (searchParams?.table) query = query.eq('table_name', searchParams.table);
  if (searchParams?.action) query = query.eq('action', searchParams.action);

  const { data: rows } = await query;

  // Lista de tablas distintas para el filtro
  const { data: tablas } = await supabase
    .from('audit_log')
    .select('table_name')
    .order('table_name')
    .limit(1000);
  const uniqueTablas = Array.from(new Set((tablas ?? []).map((t) => t.table_name)));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Auditoría"
        description="Log inmutable de cambios en tablas críticas — quién, cuándo, qué y diff completo."
        icon={History}
        breadcrumbs={[{ label: 'Auditoría' }]}
      />

      {/* Filtros */}
      <form className="azur-card flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tabla
          </label>
          <select
            name="table"
            defaultValue={searchParams?.table ?? ''}
            className="mt-1 flex h-10 w-56 rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
          >
            <option value="">— Todas —</option>
            {uniqueTablas.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Acción
          </label>
          <select
            name="action"
            defaultValue={searchParams?.action ?? ''}
            className="mt-1 flex h-10 w-44 rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
          >
            <option value="">— Todas —</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-azur-gradient px-5 text-sm font-semibold text-white shadow-azur-md"
        >
          Filtrar
        </button>
      </form>

      {!rows || rows.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin registros con esos filtros"
          description="Cambia los filtros o espera a que se generen cambios en el sistema."
        />
      ) : (
        <div className="azur-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-azur-coral/10 text-left uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cuándo</th>
                  <th className="px-4 py-3 font-semibold">Actor</th>
                  <th className="px-4 py-3 font-semibold">Tabla</th>
                  <th className="px-4 py-3 font-semibold">Registro</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                  <th className="px-4 py-3 font-semibold">Diff (UPDATE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-azur-coral/5">
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {new Date(r.occurred_at).toLocaleString('es-PE')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-azur-ink">
                        <User className="h-3 w-3" />
                        {r.actor_email ?? 'sistema'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono">{r.table_name}</td>
                    <td className="px-4 py-2.5 font-mono text-muted-foreground">
                      {r.record_id ? r.record_id.slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={ACTION_VARIANT[r.action] ?? 'default'}>{r.action}</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      {r.diff && Object.keys(r.diff).length > 0 ? (
                        <details className="group">
                          <summary className="cursor-pointer text-azur-red hover:underline">
                            Ver cambios
                          </summary>
                          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/40 p-2 text-[10px]">
                            {JSON.stringify(r.diff, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border/60 px-6 py-2 text-[11px] text-muted-foreground">
            Mostrando {rows.length} registros (máx 200 por consulta).
          </p>
        </div>
      )}
    </div>
  );
}
