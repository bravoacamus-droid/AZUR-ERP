import { NotificationBell } from './notification-bell';
import { UserMenu } from './user-menu';
import type { SessionUser } from '@/lib/auth';

export function Topbar({ session, title }: { session: SessionUser; title?: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md lg:px-6">
      <div className="pl-10 lg:pl-0">
        <h1 className="text-lg font-semibold tracking-tight">{title ?? 'AZUR ERP'}</h1>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell userId={session.id} />
        <UserMenu
          nombre={session.nombre}
          email={session.email}
          rol={session.rol}
          avatarUrl={session.avatar_url}
        />
      </div>
    </header>
  );
}
