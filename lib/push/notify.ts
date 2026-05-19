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

/** Envía push a un usuario sin bloquear. Errores solo se loguean. */
export async function notifyUser(userId: string, payload: Payload): Promise<void> {
  try {
    await sendPushToUser(userId, payload);
  } catch (err) {
    console.error('[push] notifyUser falló', userId, (err as Error).message);
  }
}

/** Envía push a TODOS los usuarios activos con alguno de los roles indicados. */
export async function notifyRoles(roles: RolSistema[], payload: Payload): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: targets } = await admin
      .from('profiles')
      .select('id')
      .eq('activo', true)
      .in('rol', roles);
    if (!targets || targets.length === 0) return;
    await Promise.all(targets.map((t) => notifyUser(t.id, payload)));
  } catch (err) {
    console.error('[push] notifyRoles falló', roles, (err as Error).message);
  }
}

/** Roles que pueden aprobar solicitudes — debe coincidir con ROLES_APROBADORES en finanzas/solicitudes/actions.ts */
export const ROLES_APROBADORES_PUSH: RolSistema[] = [
  'gerencia_general',
  'jefe_proyectos',
  'jefe_presupuestos',
  'administrador',
];
