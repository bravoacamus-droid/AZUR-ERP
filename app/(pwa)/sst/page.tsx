import { ShieldAlert } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'SST · Seguridad y Salud' };

export default async function SstPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={ShieldAlert}
      title="Seguridad y Salud en el Trabajo"
      description="Charla 5 minutos, observaciones de seguridad e incidentes — disponible en Fase 9."
    />
  );
}
