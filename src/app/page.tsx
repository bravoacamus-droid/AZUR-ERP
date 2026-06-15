import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ROL_META } from '@/lib/roles';

export default async function Home() {
  const session = await getSession();
  if (!session) redirect('/login');
  redirect(ROL_META[session.rol].home);
}
