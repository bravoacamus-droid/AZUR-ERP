'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Ícono de ayuda con popover explicativo. Se renderiza en un portal con
 * posición `fixed` para flotar POR ENCIMA del contenido: no ocupa espacio en
 * el layout ni genera barras de scroll dentro de tablas con overflow.
 * Aparece sobre el texto (side="top") y se voltea solo si no cabe arriba.
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
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{ left: number; top: number; place: 'top' | 'bottom' } | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => setMounted(true), []);

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const half = 132; // mitad del ancho (w-64) + margen para el clamp horizontal
    const left = Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8);
    let place = side;
    if (place === 'top' && r.top < 150) place = 'bottom'; // no cabe arriba → voltear
    const top = place === 'top' ? r.top - 6 : r.bottom + 6;
    setCoords({ left, top, place });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <span className={cn('inline-flex align-middle', className)}>
      <button
        ref={ref}
        type="button"
        aria-label="Más información"
        className="inline-flex text-muted-foreground/60 transition-colors hover:text-azur-600 focus:text-azur-600 focus:outline-none"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <HelpCircle className="size-3.5" />
      </button>
      {mounted && open && coords && createPortal(
        <span
          role="tooltip"
          className="pointer-events-none fixed z-[100] w-64 max-w-[calc(100vw-1rem)] rounded-lg border bg-popover px-3 py-2 text-xs font-normal leading-relaxed text-popover-foreground shadow-lg"
          style={{
            left: coords.left,
            top: coords.top,
            transform: coords.place === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
        >
          {text}
        </span>,
        document.body,
      )}
    </span>
  );
}
