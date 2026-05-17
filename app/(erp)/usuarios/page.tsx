import { notFound, redirect } from 'next/navigation';
import { Mail, Plus, UserCog, Users, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ROLES, ROL_LABEL, type RolSistema } from '@/lib/auth/roles';
import { initials } from '@/lib/utils';
import { asignarProyecto, desasignarProyecto, toggleActivo } from './actions';
import { RolSelect } from './rol-select';

export const metadata = { title: 'Usuarios' };
export const dynamic = 'force-dynamic';

const ROL_VARIANT: Record<RolSistema, 'default' | 'coral' | 'success' | 'ink' | 'outline' | 'secondary'> = {
  gerencia_general: 'default',
  jefe_proyectos: 'coral',
  jefe_presupuestos: 'success',
  administrador: 'ink',
  comercial: 'outline',
  residente: 'secondary',
};

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-2 text-xs shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

export default async function UsuariosPage() {
  const session = await requireSession();
  if (session.rol !== 'gerencia_general') redirect('/dashboard');

  const supabase = createClient();

  const [{ data: usuarios }, { data: proyectos }, { data: asignaciones }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, rol, cargo, activo, created_at')
      .order('rol')
      .order('full_name'),
    supabase
      .from('proyectos')
      .select('id, codigo, nombre')
      .neq('estado', 'cancelado')
      .order('codigo', { ascending: false }),
    supabase
      .from('usuario_proyectos')
      .select('user_id, proyecto_id, rol_obra, proyecto:proyecto_id(codigo, nombre)')
      .eq('activo', true),
  ]);

  if (!usuarios) notFound();

  // Index asignaciones por user
  const asigMap = new Map<
    string,
    Array<{ proyecto_id: string; rol_obra: string; codigo: string; nombre: string }>
  >();
  for (const a of asignaciones ?? []) {
    const p = Array.isArray(a.proyecto) ? a.proyecto[0] : a.proyecto;
    if (!p) continue;
    const arr = asigMap.get(a.user_id) ?? [];
    arr.push({
      proyecto_id: a.proyecto_id,
      rol_obra: a.rol_obra,
      codigo: p.codigo,
      nombre: p.nombre,
    });
    asigMap.set(a.user_id, arr);
  }

  // Counts por rol
  const counts: Partial<Record<RolSistema, number>> = {};
  for (const u of usuarios) {
    if (!u.activo) continue;
    counts[u.rol as RolSistema] = (counts[u.rol as RolSistema] ?? 0) + 1;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Usuarios y permisos"
        description="Gestión de roles, activación y asignación de residentes a proyectos."
        icon={UserCog}
        breadcrumbs={[{ label: 'Administración' }, { label: 'Usuarios' }]}
      />

      {/* Counts por rol */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ROLES.map((r) => (
          <div key={r} className="azur-card">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {ROL_LABEL[r]}
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-azur-ink">{counts[r] ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">activo(s)</p>
          </div>
        ))}
      </div>

      {/* Lista de usuarios */}
      {usuarios.length === 0 ? (
        <EmptyState icon={Users} title="Sin usuarios registrados" />
      ) : (
        <div className="azur-card overflow-hidden p-0">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-azur-ink">
              {usuarios.length} usuario(s)
            </h2>
            <p className="text-xs text-muted-foreground">
              Cambia rol o estado directamente. Asigna proyectos a los residentes desde la fila.
            </p>
          </div>
          <div className="divide-y divide-border/60">
            {usuarios.map((u) => {
              const asigs = asigMap.get(u.id) ?? [];
              const rol = u.rol as RolSistema;
              return (
                <div key={u.id} className="grid gap-3 p-4 lg:grid-cols-[2fr_1fr_2fr_auto]">
                  {/* Identidad */}
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-azur-gradient text-xs font-bold text-white">
                      {initials(u.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold text-azur-ink">
                        {u.full_name || '—'}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {u.email}
                      </p>
                      {u.cargo && <p className="text-[11px] text-muted-foreground">{u.cargo}</p>}
                    </div>
                  </div>

                  {/* Rol */}
                  <div className="flex items-center gap-2">
                    {u.id === session.userId ? (
                      <Badge variant={ROL_VARIANT[rol]}>{ROL_LABEL[rol]} (tú)</Badge>
                    ) : (
                      <RolSelect userId={u.id} rolActual={rol} />
                    )}
                  </div>

                  {/* Proyectos asignados */}
                  <div className="min-w-0 space-y-2">
                    {asigs.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {asigs.map((a) => (
                          <span
                            key={a.proyecto_id}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2 py-0.5 text-[11px]"
                            title={a.nombre}
                          >
                            <span className="font-mono text-azur-red">{a.codigo}</span>
                            <span className="text-muted-foreground">· {a.rol_obra}</span>
                            <form action={desasignarProyecto} className="contents">
                              <input type="hidden" name="user_id" value={u.id} />
                              <input type="hidden" name="proyecto_id" value={a.proyecto_id} />
                              <button
                                type="submit"
                                title="Desasignar"
                                className="ml-1 grid h-3.5 w-3.5 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </form>
                          </span>
                        ))}
                      </div>
                    )}
                    {/* Asignar nuevo proyecto */}
                    {(proyectos ?? []).length > 0 && (
                      <form action={asignarProyecto} className="flex gap-1">
                        <input type="hidden" name="user_id" value={u.id} />
                        <select name="proyecto_id" required className={selectClass}>
                          <option value="">+ Asignar proyecto…</option>
                          {(proyectos ?? [])
                            .filter((p) => !asigs.some((a) => a.proyecto_id === p.id))
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.codigo} · {p.nombre}
                              </option>
                            ))}
                        </select>
                        <select name="rol_obra" defaultValue="residente" className={selectClass}>
                          <option value="residente">residente</option>
                          <option value="coordinador">coordinador</option>
                          <option value="supervisor">supervisor</option>
                          <option value="jefe">jefe</option>
                        </select>
                        <Button type="submit" size="sm" variant="secondary" className="h-9 px-2">
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="flex items-center justify-end">
                    {u.id === session.userId ? (
                      <Badge variant="success">Activo (tú)</Badge>
                    ) : (
                      <form action={toggleActivo} className="contents">
                        <input type="hidden" name="user_id" value={u.id} />
                        <input type="hidden" name="activo_actual" value={String(u.activo)} />
                        <Button
                          type="submit"
                          variant={u.activo ? 'secondary' : 'default'}
                          size="sm"
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        💡 Para crear nuevos usuarios actualmente se usa el script <code className="rounded bg-muted px-1">pnpm db:seed</code> o
        el panel Auth de Supabase. Un creador de usuarios in-app llegará en la siguiente iteración si
        Azur lo necesita.
      </p>
    </div>
  );
}
