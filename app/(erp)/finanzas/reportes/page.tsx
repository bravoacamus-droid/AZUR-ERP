import { FileText } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'Reportes financieros' };

export default async function ReportesPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={FileText}
      title="Reportes financieros"
      description="Reportes semanal, quincenal, mensual y de cierre de proyecto — exportables a Excel y PDF. Disponible al consolidar Fase 8 con dashboards multi-proyecto."
    />
  );
}
