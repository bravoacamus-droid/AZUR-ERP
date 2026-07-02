import * as React from 'react';
import { cn } from '@/lib/utils';

// InfoTip vive en su propio archivo cliente (usa portal). Se re-exporta aquí
// para mantener el import `@/components/ui/misc` que ya usan los componentes.
export { InfoTip } from './info-tip';

export function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('h-px w-full bg-border', className)} {...props} />;
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
