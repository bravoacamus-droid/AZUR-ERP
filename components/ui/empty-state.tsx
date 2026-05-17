import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'grid place-items-center rounded-2xl border-2 border-dashed border-border/70 bg-white/40 p-10 text-center',
        className,
      )}
    >
      <div className="flex max-w-md flex-col items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-azur-coral/20 text-azur-red">
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-display text-lg font-bold text-azur-ink">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
