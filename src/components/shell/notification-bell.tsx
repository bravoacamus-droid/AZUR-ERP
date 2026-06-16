'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Dropdown } from '@/components/ui/dropdown';
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
  const supabase = createClient();

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
    <Dropdown
      align="end"
      className="w-80 max-w-[90vw]"
      trigger={
        <button className="relative rounded-full border bg-white p-2 transition-colors hover:bg-secondary">
          <Bell className="size-5 text-foreground/70" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      }
    >
      <div onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unread > 0 && (
            <button onClick={markAll} className="flex items-center gap-1 text-xs text-azur-600">
              <CheckCheck className="size-3.5" /> Marcar leídas
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Sin notificaciones</p>
          ) : (
            items.map((n) => (
              <a
                key={n.id}
                href={n.url ?? '#'}
                onClick={() => void markOne(n.id)}
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
    </Dropdown>
  );
}
