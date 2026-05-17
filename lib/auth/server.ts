import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { RolSistema } from '@/lib/auth/roles';

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string;
  rol: RolSistema;
  avatarUrl: string | null;
  cargo: string | null;
};

/**
 * Devuelve el contexto del usuario autenticado o redirige al login.
 * Usar en cualquier server component bajo (erp)/ o (pwa)/.
 */
export async function requireSession(redirectTo?: string): Promise<SessionContext> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const path = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login';
    redirect(path);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, rol, avatar_url, cargo, activo')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.activo) {
    redirect('/login?error=inactive');
  }

  return {
    userId: user.id,
    email: profile.email,
    fullName: profile.full_name,
    rol: profile.rol as RolSistema,
    avatarUrl: profile.avatar_url,
    cargo: profile.cargo,
  };
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, rol, avatar_url, cargo, activo')
    .eq('id', user.id)
    .single();

  if (!profile?.activo) return null;

  return {
    userId: user.id,
    email: profile.email,
    fullName: profile.full_name,
    rol: profile.rol as RolSistema,
    avatarUrl: profile.avatar_url,
    cargo: profile.cargo,
  };
}
