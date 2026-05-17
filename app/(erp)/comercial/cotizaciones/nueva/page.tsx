import { ClipboardPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { NuevaCotizacionForm } from './nueva-form';

export const metadata = { title: 'Nueva cotización' };

export default async function NuevaCotizacionPage() {
  await requireSession();
  const supabase = createClient();
  const { data: clientes } = await supabase
    .from('clientes')
    .select('id, razon_social, ruc')
    .eq('activo', true)
    .order('razon_social');

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nueva cotización"
        description="Define los datos generales. Las partidas y APU se agregan en el detalle."
        icon={ClipboardPlus}
        breadcrumbs={[
          { label: 'Comercial' },
          { label: 'Cotizaciones', href: '/comercial/cotizaciones' },
          { label: 'Nueva' },
        ]}
      />

      <NuevaCotizacionForm clientes={clientes ?? []} />
    </div>
  );
}
