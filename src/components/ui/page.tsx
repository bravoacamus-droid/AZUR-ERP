import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';
import { InfoTip } from './misc';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  tone = 'default',
  tip,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'azur' | 'success' | 'warning';
  tip?: React.ReactNode;
}) {
  const toneCls = {
    default: 'text-foreground',
    azur: 'text-azur-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-2 overflow-hidden p-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"><span className="truncate">{label}</span>{tip && <InfoTip side="bottom" text={tip} />}</p>
          <p className={cn('mt-1 truncate text-lg font-bold leading-tight tabular-nums sm:text-xl lg:text-2xl', toneCls)} title={typeof value === 'string' ? value : undefined}>{value}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
        {icon && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-azur-50 text-azur-600 sm:size-11 [&_svg]:size-4 sm:[&_svg]:size-5">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
