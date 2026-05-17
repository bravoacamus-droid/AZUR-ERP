import { FolderOpen } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'Documentos del proyecto' };

export default async function DocsPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={FolderOpen}
      title="Documentos del proyecto"
      description="Planos, contratos, cotizaciones aprobadas — disponible en Fase 9."
    />
  );
}
