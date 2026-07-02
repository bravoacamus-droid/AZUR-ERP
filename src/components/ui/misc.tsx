import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('h-px w-full bg-border', className)} {...props} />;
}

/**
 * Ícono de ayuda con popover explicativo al pasar el mouse (o mantener en móvil).
 * Uso: <InfoTip text="..." /> junto a un título/etiqueta.
 */
export function InfoTip({
  text,
  className,
  side = 'top',
}: {
  text: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
}) {
  return (
    <span className={cn('group relative inline-flex align-middle', className)}>
      <button
        type="button"
        tabIndex={0}
        aria-label="Más información"
        className="inline-flex text-muted-foreground/60 transition-colors hover:text-azur-600 focus:text-azur-600 focus:outline-none"
      >
        <HelpCircle className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 w-64 -translate-x-1/2 rounded-lg border bg-popover px-3 py-2 text-xs font-normal leading-relaxed text-popover-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        )}
      >
        {text}
      </span>
    </span>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

export function Avatar({
  nombre,
  src,
  className,
}: {
  nombre: string;
  src?: string | null;
  className?: string;
}) {
  const initials = nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-azur-100 text-xs font-semibold text-azur-700',
        className,
      )}
      title={nombre}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nombre} className="size-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  titulo,
  descripcion,
  action,
}: {
  icon?: React.ReactNode;
  titulo: string;
  descripcion?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-14 text-center">
      {icon && <div className="text-muted-foreground/60">{icon}</div>}
      <div>
        <p className="font-medium text-foreground">{titulo}</p>
        {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
  required,
  className,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-foreground/90">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
