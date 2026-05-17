import { Topbar } from '@/components/shell/topbar';
import { requireSession } from '@/lib/auth/server';

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-white to-azur-coral/10">
      <Topbar
        fullName={session.fullName}
        email={session.email}
        rol={session.rol}
        cargo={session.cargo}
        surface="erp"
      />
      <main className="container py-8">{children}</main>
    </div>
  );
}
