'use client';

import { useEffect, useState } from 'react';
import { BellRing, BellOff, Loader2 } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushOptIn() {
  const [status, setStatus] = useState<'idle' | 'on' | 'loading' | 'unsupported'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? 'on' : 'idle'))
      .catch(() => setStatus('idle'));
  }, []);

  async function enable() {
    setStatus('loading');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('idle');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      const json = sub.toJSON();
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
          user_agent: navigator.userAgent,
        }),
      });
      setStatus('on');
    } catch {
      setStatus('idle');
    }
  }

  if (status === 'unsupported') return null;

  return (
    <button
      onClick={enable}
      disabled={status === 'on' || status === 'loading'}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-70"
    >
      {status === 'loading' ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : status === 'on' ? (
        <BellRing className="size-3.5 text-emerald-600" />
      ) : (
        <BellOff className="size-3.5" />
      )}
      {status === 'on' ? 'Notificaciones push activas' : 'Activar notificaciones push'}
    </button>
  );
}
