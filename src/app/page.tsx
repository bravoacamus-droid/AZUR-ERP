import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { homeFor } from '@/lib/nav';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');
  // Considera el rol personalizado: un residente con acceso ERP aterriza en el ERP.
  redirect(homeFor(session.rol, session.permisos));
}
