import { Package } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'Almacén' };

export default async function AlmacenPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={Package}
      title="Almacén"
      description="Salidas y devoluciones de herramientas/materiales — disponible en Fase 9."
    />
  );
}
