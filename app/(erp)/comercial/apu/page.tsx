import { Calculator } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'Editor APU' };

export default async function ApuPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={Calculator}
      title="Editor APU avanzado"
      description="Editor APU dedicado con drag-drop, cuadrillas, rendimientos y plantillas — programado para la próxima iteración. Por ahora, agrega partidas con su precio unitario desde el detalle de la cotización."
    />
  );
}
