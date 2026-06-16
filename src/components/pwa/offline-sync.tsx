'use client';

import { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { flushQueue, queueCount } from '@/lib/offline-queue';
import { crearRdo } from '@/app/(pwa)/campo/rdo/actions';
import { crearSolicitud } from '@/app/(pwa)/campo/solicitudes/actions';

const HANDLERS = {
  rdo: (p: unknown) => crearRdo(p as never),
  solicitud: (p: unknown) => crearSolicitud(p as never),
};

export function OfflineSync() {
  const [online, setOnline] = useState(true);
  const [pendientes, setPendientes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const [okFlash, setOkFlash] = useState(false);

  const sync = useCallback(async () => {
    if (queueCount() === 0) return;
    setSincronizando(true);
    const { enviados, pendientes } = await flushQueue(HANDLERS);
    setSincronizando(false);
    setPendientes(pendientes);
    if (enviados > 0) {
      setOkFlash(true);
      setTimeout(() => setOkFlash(false), 3000);
    }
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    setPendientes(queueCount());

    const onOnline = () => { setOnline(true); void sync(); };
    const onOffline = () => setOnline(false);
    const onChange = (e: Event) => setPendientes((e as CustomEvent).detail ?? queueCount());

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('azur-queue-changed', onChange);
    if (navigator.onLine) void sync();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('azur-queue-changed', onChange);
    };
  }, [sync]);

  if (online && pendientes === 0 && !okFlash) return null;

  return (
    <div
      className={`fixed inset-x-0 top-14 z-30 mx-auto flex max-w-lg items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium ${
        !online ? 'bg-amber-500 text-white' : okFlash ? 'bg-emerald-600 text-white' : 'bg-sky-600 text-white'
      }`}
    >
      {!online ? (
        <><WifiOff className="size-3.5" /> Sin conexión · {pendientes} pendiente(s) por sincronizar</>
      ) : sincronizando ? (
        <><RefreshCw className="size-3.5 animate-spin" /> Sincronizando {pendientes}…</>
      ) : okFlash ? (
        <><CheckCircle2 className="size-3.5" /> Sincronizado ✓</>
      ) : (
        <><RefreshCw className="size-3.5" /> {pendientes} pendiente(s)</>
      )}
    </div>
  );
}
