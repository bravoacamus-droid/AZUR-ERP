/**
 * Helpers de alto nivel para enviar push notifications a roles o usuarios.
 * Wrappers fire-and-forget — nunca lanzan errores hacia las server actions.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushToUser } from './server';
import type { RolSistema } from '@/lib/auth/roles';

type Payload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

async function logPush(source: string, userId: string | null, title: string, status: string, detail?: string) {
  try {
    const admin = createAdminClient();
    await admin.from('push_log').insert({
      source,
      target_user_id: userId,
      title,
      status,
      detail: detail ?? null,
    });
  } catch {
    // si el log falla, no rompemos el flujo
  }
}

/** Envía push a un usuario sin bloquear. Errores solo se loguean. */
export async function notifyUser(userId: string, payload: Payload, source = 'notifyUser'): Promise<void> {
  await logPush(source, userId, payload.title, 'attempt');
  try {
    const r = await sendPushToUser(userId, payload);
    await logPush(source, userId, payload.title, 'ok', `sent=${r.sent} removed=${r.removed}`);
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    await logPush(source, userId, payload.title, 'error', msg);
    console.error('[push] notifyUser falló', userId, msg);
  }
}

/** Envía push a TODOS los usuarios activos con alguno de los roles indicados. */
export async function notifyRoles(roles: RolSistema[], payload: Payload): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: targets, error } = await admin
      .from('profiles')
      .select('id')
      .eq('activo', true)
      .in('rol', roles);
    if (error) {
      await logPush('notifyRoles', null, payload.title, 'error', `profiles query: ${error.message}`);
      return;
    }
    await logPush('notifyRoles', null, payload.title, 'attempt', `targets=${targets?.length ?? 0} roles=${roles.join(',')}`);
    if (!targets || targets.length === 0) return;
    await Promise.all(targets.map((t) => notifyUser(t.id, payload, 'notifyRoles')));
  } catch (err) {
    const msg = (err as Error).message ?? String(err);
    await logPush('notifyRoles', null, payload.title, 'error', msg);
    console.error('[push] notifyRoles falló', roles, msg);
  }
}

/** Roles que pueden aprobar solicitudes — debe coincidir con ROLES_APROBADORES en finanzas/solicitudes/actions.ts */
export const ROLES_APROBADORES_PUSH: RolSistema[] = [
  'gerencia_general',
  'jefe_proyectos',
  'jefe_presupuestos',
  'administrador',
];
