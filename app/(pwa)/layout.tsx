import { PwaShell } from '@/components/shell/pwa-shell';
import { requireSession } from '@/lib/auth/server';

export default async function PwaLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <PwaShell
      fullName={session.fullName}
      email={session.email}
      rol={session.rol}
      cargo={session.cargo}
    >
      {children}
    </PwaShell>
  );
}
