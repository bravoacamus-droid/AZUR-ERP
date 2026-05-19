import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  DollarSign,
  Info,
  MapPin,
  TrendingDown,
} from 'lucide-react';
import type { Alerta, AlertaSeveridad, AlertaTipo } from '@/lib/proyectos/alertas';

type Props = {
  alertas: Alerta[];
};

const ICON_TIPO: Record<AlertaTipo, typeof AlertOctagon> = {
  tiempo_excedido: Clock,
  tiempo_proximo: Clock,
  sobrecosto: TrendingDown,
  presupuesto_cerca: DollarSign,
  presupuesto_agotado: DollarSign,
  sin_avance: Bell,
  sin_geofence: MapPin,
};

const SEV_STYLES: Record<
  AlertaSeveridad,
  { container: string; icon: typeof AlertOctagon; iconColor: string; label: string }
> = {
  critica: {
    container: 'border-destructive/40 bg-destructive/10',
    icon: AlertOctagon,
    iconColor: 'text-destructive',
    label: 'Crítica',
  },
  alta: {
    container: 'border-warning/40 bg-warning/10',
    icon: AlertTriangle,
    iconColor: 'text-[hsl(38_92%_30%)]',
    label: 'Alta',
  },
  media: {
    container: 'border-azur-coral/50 bg-azur-coral/10',
    icon: AlertTriangle,
    iconColor: 'text-azur-red',
    label: 'Media',
  },
  info: {
    container: 'border-border/60 bg-muted/40',
    icon: Info,
    iconColor: 'text-muted-foreground',
    label: 'Info',
  },
};

export function AlertasBanner({ alertas }: Props) {
  if (alertas.length === 0) {
    return (
      <section className="azur-card flex items-center gap-3 border-success/30 bg-success/5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-success/15 text-success">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-base font-bold text-success">Proyecto saludable</h2>
          <p className="text-xs text-muted-foreground">
            Sin alertas de presupuesto, tiempo o sobrecosto detectadas.
          </p>
        </div>
      </section>
    );
  }

  const critica = alertas.filter((a) => a.severidad === 'critica').length;
  const alta = alertas.filter((a) => a.severidad === 'alta').length;

  return (
    <section className="azur-card p-0">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`grid h-10 w-10 place-items-center rounded-xl ${
              critica > 0
                ? 'bg-destructive/15 text-destructive'
                : alta > 0
                  ? 'bg-warning/15 text-[hsl(38_92%_30%)]'
                  : 'bg-azur-coral/20 text-azur-red'
            }`}
          >
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-azur-ink">
              Alertas del proyecto · {alertas.length}
            </h2>
            <p className="text-xs text-muted-foreground">
              {critica > 0 && `${critica} crítica(s) · `}
              {alta > 0 && `${alta} alta(s) · `}
              Atender lo antes posible.
            </p>
          </div>
        </div>
      </header>
      <ul className="divide-y divide-border/60">
        {alertas.map((a, i) => {
          const sev = SEV_STYLES[a.severidad];
          const TipoIcon = ICON_TIPO[a.tipo] ?? sev.icon;
          return (
            <li key={i} className={`flex items-start gap-3 px-6 py-3 ${sev.container} border-l-4`}>
              <div className={`mt-0.5 ${sev.iconColor}`}>
                <TipoIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-azur-ink">{a.titulo}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.mensaje}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sev.iconColor}`}
              >
                {sev.label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
