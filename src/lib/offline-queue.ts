'use client';

// Cola offline para campo (RDO y solicitudes). Guarda en localStorage cuando no
// hay señal y sincroniza en orden cronológico al reconectar (Sección 8.9).

const KEY = 'azur_offline_queue';

export interface QueueItem {
  id: string;
  type: 'rdo' | 'solicitud';
  payload: unknown;
  created_at: number;
}

export function getQueue(): QueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function setQueue(items: QueueItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('azur-queue-changed', { detail: items.length }));
}

export function enqueue(type: QueueItem['type'], payload: unknown): QueueItem {
  const item: QueueItem = {
    id: `${type}-${Date.now()}-${Math.floor(performance.now())}`,
    type,
    payload,
    created_at: Date.now(),
  };
  setQueue([...getQueue(), item]);
  return item;
}

export function removeFromQueue(id: string) {
  setQueue(getQueue().filter((i) => i.id !== id));
}

export function queueCount(): number {
  return getQueue().length;
}

export function isOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

// Procesa la cola en orden cronológico con los handlers provistos.
// Detiene el flush al primer fallo (probablemente sigue sin conexión).
export async function flushQueue(
  handlers: Record<QueueItem['type'], (payload: unknown) => Promise<{ ok: boolean; error?: string }>>,
): Promise<{ enviados: number; pendientes: number }> {
  if (!isOnline()) return { enviados: 0, pendientes: queueCount() };
  const items = getQueue().sort((a, b) => a.created_at - b.created_at);
  let enviados = 0;
  for (const item of items) {
    try {
      const res = await handlers[item.type](item.payload);
      if (res.ok) {
        removeFromQueue(item.id);
        enviados++;
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return { enviados, pendientes: queueCount() };
}
