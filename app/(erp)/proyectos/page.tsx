import { Building2 } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'Proyectos' };

export default async function ProyectosPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={Building2}
      title="Gestión de proyectos"
      description="Presupuestos heredados del módulo Comercial, cronograma planificado vs ejecutado, valorizaciones quincenales con APU y Curva S."
      actions={[
        { label: 'Cotizaciones', href: '/comercial/cotizaciones' },
        { label: 'Aprobaciones financieras', href: '/finanzas/aprobaciones' },
      ]}
    />
  );
}
