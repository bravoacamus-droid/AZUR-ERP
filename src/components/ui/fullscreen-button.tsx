'use client';

import * as React from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Botón "Girar / Pantalla completa" para ver tablas anchas en el celular.
 * - Android (Chrome): pantalla completa + bloquea horizontal (tipo app).
 * - iPhone (Safari): no permite forzar orientación; muestra aviso para inclinar
 *   el teléfono (con la rotación automática activada la página se reacomoda sola).
 * Se muestra solo en pantallas chicas (oculto en escritorio con `lg:hidden`).
 */
export function FullscreenButton({ className = '' }: { className?: string }) {
  const [fs, setFs] = React.useState(false);
  const [hint, setHint] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onFs = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const aviso = (msg: string) => { setHint(msg); setTimeout(() => setHint(null), 3800); };

  const toggle = async () => {
    const orient = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void>; unlock?: () => void } }).orientation;
    try {
      if (document.fullscreenElement) {
        try { orient?.unlock?.(); } catch { /* noop */ }
        await document.exitFullscreen();
        return;
      }
      const el = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> };
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        try { await orient?.lock?.('landscape'); } catch { aviso('Inclina tu teléfono para verlo en horizontal.'); }
      } else {
        // iOS Safari: no admite pantalla completa en páginas; se rota inclinando.
        aviso('Inclina tu teléfono para verlo en horizontal (activa la rotación automática).');
      }
    } catch {
      aviso('Inclina tu teléfono para verlo en horizontal.');
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={toggle} className={`lg:hidden ${className}`} title="Pantalla completa / horizontal">
        {fs ? <Minimize className="size-4" /> : <Maximize className="size-4" />} {fs ? 'Salir' : 'Girar'}
      </Button>
      {hint && (
        <div className="fixed inset-x-3 bottom-4 z-[60] rounded-lg bg-foreground/90 px-3 py-2 text-center text-xs font-medium text-background shadow-lg lg:hidden">
          {hint}
        </div>
      )}
    </>
  );
}
