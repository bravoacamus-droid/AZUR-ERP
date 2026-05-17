import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROL_LABEL, type RolSistema } from '@/lib/auth/roles';

type Action = { label: string; href: string };

type WelcomeCardProps = {
  fullName: string;
  rol: RolSistema;
  title: string;
  description: string;
  icon: LucideIcon;
  phaseNote?: string;
  actions?: Action[];
};

export function WelcomeCard({
  fullName,
  rol,
  title,
  description,
  icon: Icon,
  phaseNote = 'Vista provisional de Fase 1 — el contenido real llega en fases siguientes.',
  actions = [],
}: WelcomeCardProps) {
  return (
    <div className="space-y-6">
      <div className="azur-card relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-azur-coral/30 blur-3xl" />
        <div className="relative flex items-start gap-5">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-azur-gradient text-white shadow-azur-md">
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-azur-red">
              {ROL_LABEL[rol]}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-azur-ink sm:text-3xl">
              Hola, {fullName.split(' ')[0]}.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="azur-card">
        <h2 className="font-display text-lg font-bold text-azur-ink">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{phaseNote}</p>

        {actions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-azur-ink',
                  'transition-all hover:border-azur-red hover:text-azur-red',
                )}
              >
                {a.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
