import Image from 'next/image';
import { cn } from '@/lib/utils';

// Logo AZUR — SIEMPRE sobre fondo blanco (Bug #7 / instrucción de marca:
// el logo es rojo y transparente, necesita blanco para contraste).
export function Logo({
  size = 40,
  withText = true,
  className,
}: {
  size?: number;
  withText?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className="flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5"
        style={{ width: size, height: size }}
      >
        <Image
          src="/logoazur.png"
          alt="AZUR"
          width={size}
          height={size}
          className="object-contain p-1"
          priority
        />
      </div>
      {withText && (
        <div className="leading-tight">
          <p className="text-base font-bold tracking-tight text-azur-600">AZUR</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Constructora · ERP
          </p>
        </div>
      )}
    </div>
  );
}
