import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, LogIn, LogOut, MapPin, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Asistencias del proyecto' };

type SearchParams = {
  user?: string;
  desde?: string;
  hasta?: string;
  tipo?: 'checkin' | 'checkout';
};

export default async function AsistenciasProyectoPage({
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
    .select('id, codigo, nombre, latitud, longitud, radio_geofence_m')
    .eq('id', params.id)
    .single();
  if (!proyecto) notFound();

  // Filtros
  const desde = searchParams?.desde ?? new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const hasta = searchParams?.hasta ?? new Date().toISOString().slice(0, 10);

  let q = supabase
    .from('asistencias_gps')
    .select(
      'id, tipo, fecha, hora, latitud, longitud, precision_metros, distancia_obra_m, dentro_geofence, observaciones, user_id, perfil:user_id(full_name, email)',
    )
    .eq('proyecto_id', params.id)
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('hora', { ascending: false })
    .limit(500);

  if (searchParams?.user) q = q.eq('user_id', searchParams.user);
  if (searchParams?.tipo) q = q.eq('tipo', searchParams.tipo);

  const { data: rows } = await q;
  const items = (rows ?? []).map((r) => ({
    ...r,
    distancia_obra_m: r.distancia_obra_m == null ? null : Number(r.distancia_obra_m),
    perfil: Array.isArray(r.perfil) ? r.perfil[0] ?? null : r.perfil,
  }));

  // Lista de usuarios distintos para el filtro
  const usuariosMap = new Map<string, string>();
  for (const r of items) {
    if (r.perfil && r.perfil.full_name) usuariosMap.set(r.user_id, r.perfil.full_name);
  }

  // KPI: cantidad en obra ahora
  const hoy = new Date().toISOString().slice(0, 10);
  const hoyRows = items.filter((r) => r.fecha === hoy);
  const enObra = new Set(
    hoyRows.filter((r) => r.tipo === 'checkin' && r.dentro_geofence !== false).map((r) => r.user_id),
  );
  const fuera = new Set(hoyRows.filter((r) => r.tipo === 'checkout').map((r) => r.user_id));
  const activos = [...enObra].filter((u) => !fuera.has(u));

  const selectClass =
    'flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asistencias del proyecto"
        description={`${proyecto.codigo} · ${proyecto.nombre}`}
        icon={Users}
        breadcrumbs={[
          { label: 'Proyectos', href: '/proyectos' },
          { label: proyecto.codigo, href: `/proyectos/${params.id}` },
          { label: 'Asistencias' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            En obra ahora (hoy)
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-success">{activos.length}</p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Eventos hoy
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-azur-ink">{hoyRows.length}</p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Eventos en periodo
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-azur-red">{items.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <form className="azur-card grid gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Desde
          </label>
          <input type="date" name="desde" defaultValue={desde} className={`mt-1 ${selectClass}`} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hasta
          </label>
          <input type="date" name="hasta" defaultValue={hasta} className={`mt-1 ${selectClass}`} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo
          </label>
          <select name="tipo" defaultValue={searchParams?.tipo ?? ''} className={`mt-1 ${selectClass}`}>
            <option value="">Todos</option>
            <option value="checkin">Check-IN</option>
            <option value="checkout">Check-OUT</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Usuario
          </label>
          <select name="user" defaultValue={searchParams?.user ?? ''} className={`mt-1 ${selectClass}`}>
            <option value="">Todos</option>
            {[...usuariosMap.entries()].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-4 flex justify-end gap-2">
          <Link
            href={`/proyectos/${params.id}/asistencias`}
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

      {/* Tabla */}
      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin asistencias con esos filtros"
          description="Ajusta el rango de fechas o el tipo de evento."
        />
      ) : (
        <div className="azur-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Persona</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Hora</th>
                  <th className="px-4 py-3 font-semibold">Geofence</th>
                  <th className="px-4 py-3 text-right font-semibold">Distancia</th>
                  <th className="px-4 py-3 font-semibold">GPS captura</th>
                  <th className="px-4 py-3 font-semibold">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((r) => {
                  const nombre = r.perfil?.full_name || r.perfil?.email || '—';
                  return (
                    <tr key={r.id} className="hover:bg-azur-coral/5">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-azur-gradient text-[10px] font-bold text-white">
                            {initials(nombre)}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-xs font-semibold text-azur-ink">
                              {nombre}
                            </p>
                            {r.perfil?.email && (
                              <p className="text-[10px] text-muted-foreground">{r.perfil.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {r.tipo === 'checkin' ? (
                          <Badge variant="success" className="gap-1">
                            <LogIn className="h-3 w-3" />
                            Check-IN
                          </Badge>
                        ) : (
                          <Badge variant="coral" className="gap-1">
                            <LogOut className="h-3 w-3" />
                            Check-OUT
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(r.fecha).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-azur-ink">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {new Date(r.hora).toLocaleTimeString('es-PE', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {r.dentro_geofence == null ? (
                          <Badge variant="outline">Sin geofence</Badge>
                        ) : r.dentro_geofence ? (
                          <Badge variant="success" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            En obra
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            Fuera
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        {r.distancia_obra_m == null
                          ? '—'
                          : `${Math.round(r.distancia_obra_m).toLocaleString('es-PE')} m`}
                      </td>
                      <td className="px-4 py-2.5">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${r.latitud}&mlon=${r.longitud}#map=18/${r.latitud}/${r.longitud}`}
                          target="_blank"
                          rel="noopener"
                          className="font-mono text-[10px] text-azur-red hover:underline"
                        >
                          {Number(r.latitud).toFixed(5)}, {Number(r.longitud).toFixed(5)}
                        </a>
                        {r.precision_metros != null && (
                          <p className="text-[10px] text-muted-foreground">±{Math.round(Number(r.precision_metros))} m</p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {r.observaciones || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-border/60 px-6 py-2 text-[11px] text-muted-foreground">
              {items.length} eventos (máx 500 por filtro). Click en las coords para ver en OpenStreetMap.
            </p>
          </div>
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
