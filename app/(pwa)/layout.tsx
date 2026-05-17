import { Topbar } from '@/components/shell/topbar';
import { requireSession } from '@/lib/auth/server';

export default async function PwaLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-azur-coral/15 via-white to-white safe-top">
      <Topbar
        fullName={session.fullName}
        email={session.email}
        rol={session.rol}
        cargo={session.cargo}
        surface="pwa"
      />
      <main className="px-4 pb-24 pt-6 safe-bottom">{children}</main>
    </div>
  );
}
