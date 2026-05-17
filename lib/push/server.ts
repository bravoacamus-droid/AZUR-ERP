import webpush, { type PushSubscription as WebPushSubscription } from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:no-reply@azur.dev';
  if (!pub || !priv) {
    throw new Error('VAPID keys no configuradas (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)');
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/** Envía push a TODAS las suscripciones de un usuario. Limpia las inválidas. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureConfigured();
  const admin = createAdminClient();

  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) return { sent: 0, removed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let removed = 0;

  await Promise.all(
    subs.map(async (s) => {
      const sub: WebPushSubscription = {
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      };
      try {
        await webpush.sendNotification(sub, body);
        sent++;
        await admin
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', s.id);
      } catch (err: unknown) {
        const e = err as { statusCode?: number };
        if (e.statusCode === 404 || e.statusCode === 410) {
          // Suscripción inválida — limpiar
          await admin.from('push_subscriptions').delete().eq('id', s.id);
          removed++;
        }
      }
    }),
  );

  return { sent, removed };
}
