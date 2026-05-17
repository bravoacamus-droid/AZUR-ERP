import { LayoutDashboard } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'Dashboard ejecutivo' };

export default async function DashboardPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={LayoutDashboard}
      title="Dashboard ejecutivo"
      description="Pronto verás aquí KPIs globales: avance físico vs financiero, alertas de sobrecostos, cumplimiento de hitos y comparativos multi-proyecto."
      actions={[
        { label: 'Proyectos', href: '/proyectos' },
        { label: 'Finanzas', href: '/finanzas/aprobaciones' },
        { label: 'Comercial', href: '/comercial/cotizaciones' },
        { label: 'Auditoría', href: '/auditoria' },
      ]}
    />
  );
}
