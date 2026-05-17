import Link from 'next/link';
import { Clock, History, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckinForm } from './checkin-form';

export const metadata = { title: 'Check-in GPS' };
export const dynamic = 'force-dynamic';

export default async function CheckinPage() {
  const session = await requireSession();
  const supabase = createClient();

  // Proyectos asignados al residente (o todos para mando)
  const isMando = ['gerencia_general', 'jefe_proyectos', 'jefe_presupuestos'].includes(
    session.rol,
  );

  let proyectos: Array<{
    id: string;
    codigo: string;
    nombre: string;
    latitud: number | null;
    longitud: number | null;
    radio_geofence_m: number | null;
  }> = [];

  if (isMando) {
    const { data } = await supabase
      .from('proyectos')
      .select('id, codigo, nombre, latitud, longitud, radio_geofence_m')
      .neq('estado', 'cancelado')
      .order('codigo', { ascending: false })
      .limit(20);
    proyectos = data ?? [];
  } else {
    const { data } = await supabase
      .from('usuario_proyectos')
      .select('proyecto:proyecto_id(id, codigo, nombre, latitud, longitud, radio_geofence_m)')
      .eq('user_id', session.userId)
      .eq('activo', true);
    proyectos = (data ?? [])
      .map((a) => (Array.isArray(a.proyecto) ? a.proyecto[0] : a.proyecto))
      .filter(Boolean) as typeof proyectos;
  }

  // Último estado del día
  const today = new Date().toISOString().slice(0, 10);
  const { data: hoy } = await supabase
    .from('asistencias_gps')
    .select('tipo, hora, distancia_obra_m, dentro_geofence, proyecto:proyecto_id(codigo, nombre)')
    .eq('user_id', session.userId)
    .eq('fecha', today)
    .order('hora', { ascending: false });

  const ultimo = hoy?.[0];
  const ultimoTipo = (ultimo?.tipo as 'checkin' | 'checkout' | undefined) ?? null;

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <Link href="/inicio" className="text-xs font-semibold text-muted-foreground hover:text-azur-red">
          ← Inicio
        </Link>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-azur-ink">
          <MapPin className="h-6 w-6 text-azur-red" />
          Check-in / Check-out
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu posición GPS se valida contra el centro de obra (geofence).
        </p>
      </header>

      {proyectos.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Sin proyectos asignados"
          description="Pide a tu jefe de proyectos que te asigne a un proyecto activo para poder hacer check-in."
        />
      ) : (
        <CheckinForm proyectos={proyectos} ultimoTipo={ultimoTipo} />
      )}

      {/* Historial del día */}
      {hoy && hoy.length > 0 && (
        <section className="azur-card space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-azur-ink">
            <History className="h-4 w-4" />
            Hoy
          </h2>
          <ul className="space-y-2">
            {hoy.map((h, i) => {
              const proyecto = Array.isArray(h.proyecto) ? h.proyecto[0] : h.proyecto;
              const tiempo = new Date(h.hora).toLocaleTimeString('es-PE', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-3"
                >
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      h.tipo === 'checkin' ? 'bg-success/15 text-success' : 'bg-azur-coral/30 text-azur-red'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-azur-ink">
                      {h.tipo === 'checkin' ? 'Check-IN' : 'Check-OUT'} · {tiempo}
                    </p>
                    {proyecto && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{proyecto.nombre}</p>
                    )}
                  </div>
                  {h.distancia_obra_m != null && (
                    <Badge variant={h.dentro_geofence ? 'success' : 'warning'}>
                      {Math.round(Number(h.distancia_obra_m))} m
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
