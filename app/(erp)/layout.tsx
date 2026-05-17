import { ErpShell } from '@/components/shell/erp-shell';
import { requireSession } from '@/lib/auth/server';

export default async function ErpLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <ErpShell
      fullName={session.fullName}
      email={session.email}
      rol={session.rol}
      cargo={session.cargo}
    >
      {children}
    </ErpShell>
  );
}
