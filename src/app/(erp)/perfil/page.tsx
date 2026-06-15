import { requireSession } from '@/lib/auth';
import { PerfilClient, type PerfilData } from './perfil-client';

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const session = await requireSession();
  const perfil: PerfilData = {
    id: session.id,
    nombre: session.nombre,
    email: session.email,
    rol: session.rol,
    telefono: session.telefono,
    avatar_url: session.avatar_url,
  };
  return <PerfilClient perfil={perfil} />;
}
