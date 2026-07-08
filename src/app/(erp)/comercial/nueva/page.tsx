import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page';
import { NuevaCotizacionForm } from './form';

export const dynamic = 'force-dynamic';

export default async function NuevaCotizacionPage() {
  await requireModulo('comercial', 'editar');
  const supabase = createClient();
  const [{ data: lineas }, { data: clientes }, { data: plantillas }] = await Promise.all([
    supabase.from('lineas_negocio').select('id, codigo, nombre').eq('activo', true),
    supabase.from('clientes').select('id, razon_social').order('razon_social'),
    supabase.from('plantillas_cotizacion').select('id, nombre'),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Nueva cotización" description="Paso 0 y 1 — origen del lead y datos generales." />
      <NuevaCotizacionForm
        lineas={lineas ?? []}
        clientes={clientes ?? []}
        plantillas={plantillas ?? []}
      />
    </div>
  );
}
