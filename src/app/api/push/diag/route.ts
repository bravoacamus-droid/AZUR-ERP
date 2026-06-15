import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushToUser } from '@/lib/push/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'no-session' }, { status: 401 });

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, last_used_at')
    .eq('user_id', user.id);

  const vapid = {
    public: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    private: !!process.env.VAPID_PRIVATE_KEY,
    subject: !!process.env.VAPID_SUBJECT,
  };

  let testPush: { ok: boolean; sent?: number; error?: string } = { ok: false };
  try {
    const sent = await sendPushToUser(user.id, {
      title: 'AZUR · Diagnóstico',
      body: 'Push de diagnóstico',
      url: '/inicio',
      tag: 'diag',
    });
    testPush = { ok: sent > 0, sent };
  } catch (e) {
    testPush = { ok: false, error: String(e) };
  }

  return NextResponse.json({
    ok: true,
    vapid,
    suscripciones: { count: subs?.length ?? 0, items: subs },
    testPush,
  });
}
