import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Rol } from '@/lib/roles';
import {
  BASE_ROLE_PERMISOS, normalizarPermisos, puedeVer, puedeEditar,
  type Modulo, type PermisosMap,
} from '@/lib/permisos';

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  telefono: string | null;
  avatar_url: string | null;
  activo: boolean;
  rol_personalizado_id: string | null;
  /** Permisos efectivos por módulo (rol personalizado si existe, si no el rol base). */
  permisos: PermisosMap;
}

/** Devuelve el perfil del usuario logueado o null.
 *  Memoizado por request (React cache) → evita lookups duplicados
 *  entre el layout y la página en una misma navegación. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Lookup del perfil con admin client (Bug #1: evita null silencioso por RLS).
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, nombre, rol, telefono, avatar_url, activo, rol_personalizado_id')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  // Permisos efectivos: rol personalizado (si existe) o el rol base.
  let permisos: PermisosMap = BASE_ROLE_PERMISOS[(profile as { rol: Rol }).rol] ?? {};
  const rolPersId = (profile as { rol_personalizado_id: string | null }).rol_personalizado_id;
  if (rolPersId) {
    const { data: rp } = await admin
      .from('roles_personalizados')
      .select('permisos, activo')
      .eq('id', rolPersId)
      .single();
    if (rp && (rp as { activo: boolean }).activo) {
      permisos = normalizarPermisos((rp as { permisos: unknown }).permisos);
    }
  }

  return { ...(profile as object), permisos } as SessionUser;
});

/** Exige sesión; redirige a /login si no hay. */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.activo) redirect('/login?error=inactivo');
  return session;
}

/** Exige que el rol del usuario esté entre los permitidos. */
export async function requireRol(roles: Rol[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.rol)) redirect('/inicio?error=sin-permiso');
  return session;
}

/**
 * Exige permiso sobre un módulo. `nivel='ver'` para páginas (lectura);
 * `nivel='editar'` para acciones de escritura. Redirige si no cumple
 * (mismo comportamiento que requireRol; la UI además oculta lo no permitido).
 */
export async function requireModulo(modulo: Modulo, nivel: 'ver' | 'editar' = 'ver'): Promise<SessionUser> {
  const session = await requireSession();
  const ok = nivel === 'editar' ? puedeEditar(session.permisos, modulo) : puedeVer(session.permisos, modulo);
  if (!ok) redirect('/inicio?error=sin-permiso');
  return session;
}
