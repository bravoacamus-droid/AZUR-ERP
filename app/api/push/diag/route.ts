import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/push/diag
 * Diagnóstico de configuración push.
 * No envía nada — solo reporta estado.
 */
export async function GET() {
  const session = await requireSession();

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  const admin = createAdminClient();
  const { data: subs, error: subsErr } = await admin
    .from('push_subscriptions')
    .select('id, user_id, last_used_at, created_at')
    .eq('user_id', session.userId);

  const { data: misRoles } = await admin
    .from('profiles')
    .select('id, full_name, rol')
    .eq('id', session.userId)
    .single();

  // Intentar enviar push real al user actual para ver el error
  let testResult: { ok: boolean; status?: number; body?: string; message?: string } | null = null;
  if (subs && subs.length > 0) {
    try {
      const webpush = (await import('web-push')).default;
      if (pub && priv) {
        webpush.setVapidDetails(subject || 'mailto:no-reply@azur.dev', pub, priv);
        const fullSub = await admin
          .from('push_subscriptions')
          .select('endpoint, p256dh, auth')
          .eq('user_id', session.userId)
          .limit(1)
          .single();
        if (fullSub.data) {
          try {
            const r = await webpush.sendNotification(
              {
                endpoint: fullSub.data.endpoint,
                keys: { p256dh: fullSub.data.p256dh, auth: fullSub.data.auth },
              },
              JSON.stringify({
                title: 'AZUR · DIAG',
                body: 'Push desde Vercel ' + new Date().toLocaleTimeString('es-PE'),
                url: '/inicio',
                tag: 'diag',
              }),
            );
            testResult = { ok: true, status: r.statusCode };
          } catch (e) {
            const err = e as { statusCode?: number; body?: string; message?: string };
            testResult = {
              ok: false,
              status: err.statusCode,
              body: err.body,
              message: err.message,
            };
          }
        }
      } else {
        testResult = { ok: false, message: 'VAPID keys faltantes — no se intentó enviar' };
      }
    } catch (e) {
      testResult = { ok: false, message: (e as Error).message };
    }
  }

  return NextResponse.json({
    usuario: {
      id: session.userId,
      nombre: session.fullName,
      rol: session.rol,
      profileRol: misRoles?.rol,
    },
    vapid: {
      publicKey_set: !!pub,
      publicKey_len: pub?.length ?? 0,
      privateKey_set: !!priv,
      privateKey_len: priv?.length ?? 0,
      subject_set: !!subject,
      subject_value: subject ?? null,
    },
    suscripciones: {
      count: subs?.length ?? 0,
      items: subs ?? [],
      error: subsErr?.message ?? null,
    },
    testPush: testResult,
    timestamp: new Date().toISOString(),
  });
}
