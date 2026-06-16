'use client';

import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // ya instalada → no mostrar
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    if (standalone) return;
    if (localStorage.getItem('azur_install_dismissed') === '1') return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua);
    setIsIOS(ios);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    // iOS no dispara beforeinstallprompt → mostramos instrucciones
    if (ios) setShow(true);

    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem('azur_install_dismissed', '1');
  }

  async function instalar() {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-2xl border bg-white p-4 shadow-xl animate-fade-in">
      <button onClick={dismiss} className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-secondary">
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-azur-gradient text-white">
          <Download className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Instala AZUR en tu celular</p>
          {isIOS ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Toca <Share className="inline size-3.5" /> <b>Compartir</b> y luego{' '}
              <b>&ldquo;Añadir a pantalla de inicio&rdquo;</b>.
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs text-muted-foreground">Acceso directo, pantalla completa y notificaciones.</p>
              <button onClick={instalar} className="mt-2 rounded-lg bg-azur-gradient px-3 py-1.5 text-xs font-medium text-white">
                Instalar app
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
