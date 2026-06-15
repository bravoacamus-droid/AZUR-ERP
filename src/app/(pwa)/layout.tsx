import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { ROLES_PWA } from '@/lib/roles';
import { BottomNav } from '@/components/shell/bottom-nav';
import { NotificationBell } from '@/components/shell/notification-bell';
import { UserMenu } from '@/components/shell/user-menu';
import { Logo } from '@/components/brand/logo';

export default async function PwaLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (!ROLES_PWA.includes(session.rol)) redirect('/inicio');

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-secondary/30">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white/90 px-4 pt-safe backdrop-blur-md">
        <Logo size={32} withText={false} />
        <span className="text-sm font-semibold">AZUR Campo</span>
        <div className="flex items-center gap-1.5">
          <NotificationBell userId={session.id} />
          <UserMenu
            nombre={session.nombre}
            email={session.email}
            rol={session.rol}
            avatarUrl={session.avatar_url}
          />
        </div>
      </header>
      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
      <BottomNav rol={session.rol} />
    </div>
  );
}
