import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushToUser } from '@/lib/push/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'no-session' }, { status: 401 });

  const enviadas = await sendPushToUser(user.id, {
    title: 'AZUR ERP · Prueba',
    body: 'Si ves esto, las notificaciones push funcionan ✅',
    url: '/inicio',
    tag: 'test',
  });
  return NextResponse.json({ ok: true, enviadas });
}
