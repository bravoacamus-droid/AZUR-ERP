import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushToUser, type PushPayload } from './server';
import type { Rol } from '@/lib/roles';

// Wrappers fire-and-forget que NUNCA lanzan (Anexo A.4 paso 9 / A.6).
// Loguean a push_log y crean la notificación in-app.

async function logPush(source: string, target: string | null, title: string, status: string, sent = 0, detail?: string) {
  try {
    const admin = createAdminClient();
    await admin.from('push_log').insert({ source, target_user_id: target, title, status, sent, detail });
  } catch {
    /* nunca lanzar */
  }
}

export async function notifyUser(userId: string, payload: PushPayload, source = 'app') {
  try {
    const admin = createAdminClient();
    // notificación in-app (campana)
    await admin.from('notificaciones').insert({
      user_id: userId,
      titulo: payload.title,
      cuerpo: payload.body ?? null,
      url: payload.url ?? null,
      tipo: payload.tag ?? 'info',
    });
    await logPush(source, userId, payload.title, 'attempt');
    const sent = await sendPushToUser(userId, payload);
    await logPush(source, userId, payload.title, 'ok', sent);
  } catch (err) {
    await logPush(source, userId, payload.title, 'error', 0, String(err));
  }
}

export async function notifyRoles(roles: Rol[], payload: PushPayload, source = 'app') {
  try {
    const admin = createAdminClient();
    const { data: users } = await admin.from('profiles').select('id').in('rol', roles).eq('activo', true);
    if (!users) return;
    await Promise.all(users.map((u) => notifyUser(u.id, payload, source)));
  } catch (err) {
    await logPush(source, null, payload.title, 'error', 0, String(err));
  }
}
