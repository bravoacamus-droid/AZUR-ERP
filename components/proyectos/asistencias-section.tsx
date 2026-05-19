import Link from 'next/link';
import { Clock, LogIn, LogOut, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';

type Props = {
  proyectoId: string;
};

type AsistenciaRow = {
  id: string;
  tipo: string;
  fecha: string;
  hora: string;
  distancia_obra_m: number | null;
  dentro_geofence: boolean | null;
  observaciones: string | null;
  user_id: string;
  perfil: { full_name: string; email: string } | null;
};

export async function AsistenciasSection({ proyectoId }: Props) {
  const supabase = createClient();

  // Últimas 30 asistencias del proyecto con join al perfil del usuario
  const { data } = await supabase
    .from('asistencias_gps')
    .select(
      'id, tipo, fecha, hora, distancia_obra_m, dentro_geofence, observaciones, user_id, perfil:user_id(full_name, email)',
    )
    .eq('proyecto_id', proyectoId)
    .order('hora', { ascending: false })
    .limit(30);

  const rows = (data ?? []).map((r): AsistenciaRow => ({
    id: r.id,
    tipo: r.tipo,
    fecha: r.fecha,
    hora: r.hora,
    distancia_obra_m: r.distancia_obra_m == null ? null : Number(r.distancia_obra_m),
    dentro_geofence: r.dentro_geofence,
    observaciones: r.observaciones,
    user_id: r.user_id,
    perfil: Array.isArray(r.perfil) ? r.perfil[0] ?? null : r.perfil,
  }));

  // Asistencias de hoy
  const hoy = new Date().toISOString().slice(0, 10);
  const hoyRows = rows.filter((r) => r.fecha === hoy);
  const enObraHoy = new Set(
    hoyRows
      .filter((r) => r.tipo === 'checkin' && r.dentro_geofence !== false)
      .map((r) => r.user_id),
  );
  const cerradosHoy = new Set(hoyRows.filter((r) => r.tipo === 'checkout').map((r) => r.user_id));
  const activos = [...enObraHoy].filter((u) => !cerradosHoy.has(u));

  return (
    <section className="azur-card p-0">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-bold text-azur-ink">
            Asistencias del personal de campo
          </h2>
          <p className="text-xs text-muted-foreground">
            Check-in / Check-out con GPS validado contra el geofence del proyecto.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={activos.length > 0 ? 'success' : 'secondary'}>
            {activos.length} en obra ahora
          </Badge>
          <Badge variant="outline">{hoyRows.length} eventos hoy</Badge>
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          Sin asistencias registradas todavía. Cuando un residente haga check-in desde la PWA,
          aparecerá aquí.
        </p>
      ) : (
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
                <th className="px-4 py-3 font-semibold">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => {
                const nombre = r.perfil?.full_name || r.perfil?.email || '—';
                return (
                  <tr key={r.id} className="hover:bg-azur-coral/5">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-azur-gradient text-[10px] font-bold text-white">
                          {initials(nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-xs font-semibold text-azur-ink">{nombre}</p>
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
                          Fuera de obra
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">
                      {r.distancia_obra_m == null
                        ? '—'
                        : `${Math.round(r.distancia_obra_m).toLocaleString('es-PE')} m`}
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
            Mostrando últimos {rows.length} eventos. Para historial completo y exportación, ver
            <Link href={`/proyectos/${proyectoId}/asistencias`} className="ml-1 font-semibold text-azur-red hover:underline">
              vista completa →
            </Link>
          </p>
        </div>
      )}
    </section>
  );
}
