import Link from 'next/link';
import { ClipboardPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { NuevaSolicitudForm } from './nueva-form';

export const metadata = { title: 'Nueva solicitud de pago' };
export const dynamic = 'force-dynamic';

export default async function NuevaSolicitudPage() {
  await requireSession();
  const supabase = createClient();

  const { data: proyectos } = await supabase
    .from('proyectos')
    .select('id, codigo, nombre, moneda')
    .neq('estado', 'cancelado')
    .order('codigo', { ascending: false });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nueva solicitud de pago"
        description="Selecciona el proyecto y completa los datos. La aprobación pasa por jefe → administrador."
        icon={ClipboardPlus}
        breadcrumbs={[
          { label: 'Finanzas' },
          { label: 'Solicitudes', href: '/finanzas/solicitudes' },
          { label: 'Nueva' },
        ]}
      />

      {(proyectos ?? []).length === 0 ? (
        <div className="azur-card text-center">
          <p className="text-sm text-muted-foreground">
            No hay proyectos activos. Crea o aprueba una cotización primero en{' '}
            <Link href="/comercial/cotizaciones" className="font-semibold text-azur-red hover:underline">
              Comercial
            </Link>
            .
          </p>
        </div>
      ) : (
        <NuevaSolicitudForm proyectos={proyectos ?? []} />
      )}
    </div>
  );
}
