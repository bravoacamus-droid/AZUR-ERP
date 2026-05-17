import { Wallet } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { WelcomeCard } from '@/components/shell/welcome-card';

export const metadata = { title: 'Aprobaciones financieras' };

export default async function AprobacionesPage() {
  const session = await requireSession();
  return (
    <WelcomeCard
      fullName={session.fullName}
      rol={session.rol}
      icon={Wallet}
      title="Bandeja de aprobaciones"
      description="Pronto verás aquí las solicitudes de pago pendientes con priorización por urgencia, doble nivel de aprobación y trazabilidad completa hasta el voucher."
    />
  );
}
