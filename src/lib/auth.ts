import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Rol } from '@/lib/roles';

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  telefono: string | null;
  avatar_url: string | null;
  activo: boolean;
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
    .select('id, email, nombre, rol, telefono, avatar_url, activo')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  return profile as SessionUser;
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
