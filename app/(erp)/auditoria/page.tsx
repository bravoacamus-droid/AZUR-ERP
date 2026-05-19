import { History, User } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { describeAudit, type AuditRow } from '@/lib/auditoria/describe';

export const metadata = { title: 'Auditoría · Log inmutable' };
export const dynamic = 'force-dynamic';

const ACTION_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  INSERT: 'success',
  UPDATE: 'warning',
  DELETE: 'destructive',
};

type ProyectoLite = { id: string; codigo: string; nombre: string };

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
    .select('id, occurred_at, actor_email, table_name, record_id, action, diff, new_data, old_data')
    .order('occurred_at', { ascending: false })
    .limit(200);

  if (searchParams?.table) query = query.eq('table_name', searchParams.table);
  if (searchParams?.action) query = query.eq('action', searchParams.action);

  const { data: rows } = await query;
  const items = rows ?? [];

  // ---------- Resolver proyecto de cada fila ----------
  const proyectoIds = new Set<string>();
  const pagosSolicitudIds = new Set<string>();

  for (const r of items) {
    const data = (r.new_data ?? r.old_data) as Record<string, unknown> | null;
    const pid = typeof data?.proyecto_id === 'string' ? data.proyecto_id : null;
    if (pid) proyectoIds.add(pid);
    if (r.table_name === 'pagos') {
      const sid = typeof data?.solicitud_id === 'string' ? data.solicitud_id : null;
      if (sid) pagosSolicitudIds.add(sid);
    }
    // proyectos: el record_id ES el proyecto_id
    if (r.table_name === 'proyectos' && r.record_id) proyectoIds.add(r.record_id);
  }

  // Mapear solicitud → proyecto para audit de tabla pagos
  const solicitudProyectoMap = new Map<string, string>();
  if (pagosSolicitudIds.size > 0) {
    const { data: sols } = await supabase
      .from('solicitudes_pago')
      .select('id, proyecto_id')
      .in('id', Array.from(pagosSolicitudIds));
    (sols ?? []).forEach((s) => {
      if (s.proyecto_id) {
        solicitudProyectoMap.set(s.id, s.proyecto_id);
        proyectoIds.add(s.proyecto_id);
      }
    });
  }

  // Batch fetch proyectos
  const proyectoMap = new Map<string, ProyectoLite>();
  if (proyectoIds.size > 0) {
    const { data: ps } = await supabase
      .from('proyectos')
      .select('id, codigo, nombre')
      .in('id', Array.from(proyectoIds));
    (ps ?? []).forEach((p) => proyectoMap.set(p.id, p));
  }

  function getProyecto(r: (typeof items)[number]): ProyectoLite | null {
    const data = (r.new_data ?? r.old_data) as Record<string, unknown> | null;
    let pid = typeof data?.proyecto_id === 'string' ? data.proyecto_id : null;
    if (!pid && r.table_name === 'pagos' && typeof data?.solicitud_id === 'string') {
      pid = solicitudProyectoMap.get(data.solicitud_id) ?? null;
    }
    if (!pid && r.table_name === 'proyectos' && r.record_id) {
      pid = r.record_id;
    }
    return pid ? proyectoMap.get(pid) ?? null : null;
  }

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
        description="Log inmutable de cambios en tablas críticas — quién, cuándo, qué pasó y a qué proyecto afectó."
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

      {items.length === 0 ? (
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
                  <th className="px-4 py-3 font-semibold">¿Qué pasó?</th>
                  <th className="px-4 py-3 font-semibold">Proyecto</th>
                  <th className="px-4 py-3 font-semibold">Tabla técnica</th>
                  <th className="px-4 py-3 font-semibold">Acción</th>
                  <th className="px-4 py-3 font-semibold">Diff técnico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((r) => {
                  const proyecto = getProyecto(r);
                  const descripcion = describeAudit(r as AuditRow);
                  return (
                    <tr key={r.id} className="hover:bg-azur-coral/5">
                      <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(r.occurred_at).toLocaleString('es-PE', { timeZone: 'America/Lima',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-azur-ink">
                          <User className="h-3 w-3" />
                          {r.actor_email ?? 'sistema'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-semibold text-azur-ink">{descripcion}</p>
                        {r.record_id && (
                          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                            ID: {r.record_id.slice(0, 8)}…
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {proyecto ? (
                          <Link
                            href={`/proyectos/${proyecto.id}`}
                            className="group inline-flex flex-col"
                          >
                            <span className="font-mono text-[11px] font-semibold text-azur-red group-hover:underline">
                              {proyecto.codigo}
                            </span>
                            <span className="line-clamp-1 text-[10px] text-muted-foreground">
                              {proyecto.nombre}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">
                        {r.table_name}
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
                            <pre className="mt-2 max-w-md overflow-x-auto rounded-lg bg-muted/40 p-2 text-[10px]">
                              {JSON.stringify(r.diff, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border/60 px-6 py-2 text-[11px] text-muted-foreground">
            Mostrando {items.length} registros (máx 200 por consulta).
          </p>
        </div>
      )}
    </div>
  );
}
