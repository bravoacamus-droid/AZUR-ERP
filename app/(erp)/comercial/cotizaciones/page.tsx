import { ClipboardCheck } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'Cotizaciones' };

export default async function CotizacionesPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={ClipboardCheck}
      title="Cotizaciones"
      description="Generador con APU, catálogo de partidas e insumos, estados de negociación y plantilla profesional con identidad AZUR — listo en Fase 3."
    />
  );
}
