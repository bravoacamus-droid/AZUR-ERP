import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-azur-red/10 text-azur-red',
        secondary: 'bg-muted text-foreground',
        outline: 'border border-border bg-transparent text-foreground',
        success: 'bg-success/15 text-success',
        warning: 'bg-warning/15 text-[hsl(38_92%_30%)]',
        destructive: 'bg-destructive/15 text-destructive',
        coral: 'bg-azur-coral/30 text-azur-red',
        ink: 'bg-azur-ink/15 text-azur-ink',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
