'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fmtDateTime } from '@/lib/format';
import { PushOptIn } from './push-optin';

interface Notif {
  id: string;
  titulo: string;
  cuerpo: string | null;
  url: string | null;
  leida: boolean;
  created_at: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notificaciones')
      .select('id, titulo, cuerpo, url, leida, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    setItems((data as Notif[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    void load();
    const ch = supabase
      .channel('notif-' + userId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `user_id=eq.${userId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [supabase, userId, load]);

  const unread = items.filter((i) => !i.leida).length;

  async function markAll() {
    setItems((prev) => prev.map((i) => ({ ...i, leida: true }))); // optimista
    await supabase.from('notificaciones').update({ leida: true }).eq('leida', false);
    void load();
  }

  async function markOne(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, leida: true } : i))); // optimista
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
  }

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-full border bg-white p-2 transition-colors hover:bg-secondary">
        <Bell className="size-5 text-foreground/70" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-2 top-16 z-50 mx-auto max-w-sm overflow-hidden rounded-2xl border bg-white shadow-xl animate-fade-in sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mx-0 sm:mt-2 sm:w-96">
            <div className="flex items-center justify-between border-b px-3 py-2.5">
              <p className="text-sm font-semibold">Notificaciones</p>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAll} className="flex items-center gap-1 text-xs text-azur-600">
                    <CheckCheck className="size-3.5" /> Marcar leídas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-secondary"><X className="size-4" /></button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">Sin notificaciones</p>
              ) : (
                items.map((n) => (
                  <a
                    key={n.id}
                    href={n.url ?? '#'}
                    onClick={() => { void markOne(n.id); setOpen(false); }}
                    className={`block border-b px-3 py-2.5 last:border-0 hover:bg-secondary ${!n.leida ? 'bg-azur-50/40' : ''}`}
                  >
                    <p className="text-sm font-medium leading-tight">{n.titulo}</p>
                    {n.cuerpo && <p className="mt-0.5 text-xs text-muted-foreground">{n.cuerpo}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground/70">{fmtDateTime(n.created_at)}</p>
                  </a>
                ))
              )}
            </div>
            <div className="border-t p-2">
              <PushOptIn />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
