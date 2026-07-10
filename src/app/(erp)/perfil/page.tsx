import { requireSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PerfilClient, type PerfilData } from './perfil-client';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const session = await requireSession();
  const { data: prof } = await createClient().from('profiles').select('firma_data').eq('id', session.id).single();
  const perfil: PerfilData = {
    id: session.id,
    nombre: session.nombre,
    email: session.email,
    rol: session.rol,
    telefono: session.telefono,
    avatar_url: session.avatar_url,
    firma_data: (prof as { firma_data?: string | null } | null)?.firma_data ?? null,
  };
  return <PerfilClient perfil={perfil} />;
}
