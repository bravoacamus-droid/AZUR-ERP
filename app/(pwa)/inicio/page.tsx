import { Smartphone } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'Inicio · App de campo' };

export default async function PwaInicioPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={Smartphone}
      title="App de campo"
      description="Check-in con GPS, parte diario digital, captura fotográfica geolocalizada, solicitudes de pago y SST — todo desde tu celular."
    />
  );
}
