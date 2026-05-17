import Link from 'next/link';
import {
  Camera,
  ClipboardSignature,
  FolderOpen,
  MapPin,
  Package,
  ShieldAlert,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { Badge } from '@/components/ui/badge';
import { PushToggle } from '@/components/pwa/push-toggle';
import { formatPEN } from '@/lib/utils';

export const metadata = { title: 'Inicio · App de campo' };
export const dynamic = 'force-dynamic';

const TILES = [
  { href: '/checkin', label: 'Check-in', icon: MapPin, color: 'from-azur-red to-azur-bright' },
  { href: '/rdo', label: 'Parte diario', icon: ClipboardSignature, color: 'from-azur-bright to-azur-red' },
  { href: '/evidencias', label: 'Evidencias', icon: Camera, color: 'from-azur-red via-azur-bright to-azur-coral' },
  { href: '/solicitudes', label: 'Solicitudes', icon: Wallet, color: 'from-azur-coral to-azur-red' },
  { href: '/sst', label: 'SST', icon: ShieldAlert, color: 'from-azur-ink to-azur-red' },
  { href: '/almacen', label: 'Almacén', icon: Package, color: 'from-azur-coral to-azur-bright' },
  { href: '/docs', label: 'Documentos', icon: FolderOpen, color: 'from-azur-red to-azur-coral' },
];

export default async function PwaInicioPage() {
  const session = await requireSession();
  const supabase = createClient();

  // Proyectos del usuario (residente) o todos los activos (jefes)
  const { data: asignados } = await supabase
    .from('usuario_proyectos')
    .select('proyecto:proyecto_id(id, codigo, nombre, ubicacion)')
    .eq('user_id', session.userId)
    .eq('activo', true)
    .limit(5);

  const proyectos = (asignados ?? [])
    .map((a) => (Array.isArray(a.proyecto) ? a.proyecto[0] : a.proyecto))
    .filter(Boolean) as Array<{ id: string; codigo: string; nombre: string; ubicacion: string | null }>;

  // Check-in de hoy
  const today = new Date().toISOString().slice(0, 10);
  const { data: checkInHoy } = await supabase
    .from('asistencias_gps')
    .select('tipo, hora')
    .eq('user_id', session.userId)
    .eq('fecha', today)
    .order('hora', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Solicitudes pendientes del usuario
  const { count: solicitudesPendientes } = await supabase
    .from('solicitudes_pago')
    .select('id', { count: 'exact', head: true })
    .eq('solicitado_por', session.userId)
    .in('estado', ['pendiente', 'aprobada_jefe', 'programada']);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-azur-gradient p-5 text-white shadow-azur-lg">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
          ¡Buen día, residente!
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold leading-tight">
          {session.fullName.split(' ')[0]}, listo para obra.
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          {checkInHoy ? (
            <Badge variant="default" className="bg-white text-azur-red">
              {checkInHoy.tipo === 'checkin' ? '✓ Check-in registrado' : '✓ Check-out hecho'}
            </Badge>
          ) : (
            <Link
              href="/checkin"
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-azur-red shadow"
            >
              <MapPin className="h-3.5 w-3.5" />
              Hacer check-in
            </Link>
          )}
          {solicitudesPendientes && solicitudesPendientes > 0 ? (
            <Badge variant="default" className="bg-white/20 text-white">
              {solicitudesPendientes} solicitud{solicitudesPendientes === 1 ? '' : 'es'} activa{solicitudesPendientes === 1 ? '' : 's'}
            </Badge>
          ) : null}
        </div>
      </section>

      {/* Proyectos asignados */}
      {proyectos.length > 0 ? (
        <section>
          <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Tus proyectos
          </h2>
          <div className="space-y-2">
            {proyectos.map((p) => (
              <div key={p.id} className="azur-card flex items-center gap-3 p-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] text-azur-red">{p.codigo}</p>
                  <p className="line-clamp-1 text-sm font-semibold text-azur-ink">{p.nombre}</p>
                  {p.ubicacion && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{p.ubicacion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Tiles principales */}
      <section>
        <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Acciones
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {TILES.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-white p-4 transition-all active:scale-[0.98]"
              >
                <div
                  className={`mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.color} text-white shadow-azur-md`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-azur-ink">{t.label}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Push notifications */}
      <section className="azur-card space-y-3">
        <div>
          <p className="text-sm font-bold text-azur-ink">Notificaciones push</p>
          <p className="text-xs text-muted-foreground">
            Recibí avisos cuando tus solicitudes cambien de estado o haya aprobaciones pendientes.
          </p>
        </div>
        <PushToggle />
      </section>
    </div>
  );
}
