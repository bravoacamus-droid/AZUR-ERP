import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { puedeEditar } from '@/lib/permisos';
import { UsuariosClient, type Profile, type RolPers } from './usuarios-client';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const session = await requireModulo('usuarios', 'ver');
  const supabase = createClient();

  const [{ data }, { data: roles }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, nombre, email, rol, telefono, activo, avatar_url, rol_personalizado_id, firma_data')
      .order('nombre'),
    supabase.from('roles_personalizados').select('id, nombre, permisos, activo').order('nombre'),
  ]);

  return (
    <UsuariosClient
      usuarios={(data ?? []) as Profile[]}
      roles={(roles ?? []) as RolPers[]}
      miId={session.id}
      canEdit={puedeEditar(session.permisos, 'usuarios')}
    />
  );
}
