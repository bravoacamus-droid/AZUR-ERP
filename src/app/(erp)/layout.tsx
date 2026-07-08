import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { ROLES_ERP } from '@/lib/roles';
import { navForPermisos } from '@/lib/nav';
import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const nav = navForPermisos(session.rol, session.permisos);
  // Accede al ERP si su rol base es de oficina o si su rol personalizado le da algún módulo.
  if (!ROLES_ERP.includes(session.rol) && nav.length === 0) redirect('/campo');

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
