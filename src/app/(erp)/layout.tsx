import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { ROLES_ERP } from '@/lib/roles';
import { navForRol } from '@/lib/nav';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!ROLES_ERP.includes(session.rol)) redirect('/campo');

  const nav = navForRol(session.rol);

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar nav={nav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar session={session} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
