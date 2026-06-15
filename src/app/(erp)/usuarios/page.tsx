import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { UsuariosClient, type Profile } from './usuarios-client';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const session = await requireRol(['gerencia', 'administrador']);
  const supabase = createClient();

  const { data } = await supabase
    .from('profiles')
    .select('id, nombre, email, rol, telefono, activo, avatar_url')
    .order('nombre');

  return <UsuariosClient usuarios={(data ?? []) as Profile[]} miId={session.id} />;
}
