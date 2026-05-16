import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = {
  variant?: 'full' | 'mark' | 'wordmark';
  className?: string;
  priority?: boolean;
};

export function Logo({ variant = 'full', className, priority = false }: LogoProps) {
  if (variant === 'mark') {
    return (
      <Image
        src="/logo.png"
        alt="AZUR"
        width={64}
        height={80}
        priority={priority}
        className={cn('object-contain object-top', className)}
        style={{ objectPosition: 'top' }}
      />
    );
  }

  if (variant === 'wordmark') {
    return (
      <span className={cn('font-display text-2xl font-bold tracking-tight text-azur-red', className)}>
        AZUR
      </span>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="AZUR Constructora e Inmobiliaria"
      width={170}
      height={210}
      priority={priority}
      className={cn('object-contain', className)}
    />
  );
}
