import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { puedeEditar } from '@/lib/permisos';
import { PageHeader } from '@/components/ui/page';
import { ClientesMaestro } from './clientes-maestro';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const session = await requireModulo('clientes', 'ver');
  const canEdit = puedeEditar(session.permisos, 'clientes');
  const supabase = createClient();

  const { data: clientes } = await supabase.from('clientes').select('*').order('razon_social');

  // conteos de cotizaciones y proyectos por cliente
  const [{ data: cots }, { data: proys }] = await Promise.all([
    supabase.from('cotizaciones').select('cliente_id'),
    supabase.from('proyectos').select('cliente_id'),
  ]);
  const countCot: Record<string, number> = {};
  const countProy: Record<string, number> = {};
  (cots ?? []).forEach((c) => { if (c.cliente_id) countCot[c.cliente_id] = (countCot[c.cliente_id] ?? 0) + 1; });
  (proys ?? []).forEach((p) => { if (p.cliente_id) countProy[p.cliente_id] = (countProy[p.cliente_id] ?? 0) + 1; });

  return (
    <div className="space-y-6">
      <PageHeader title="Clientes" description="Maestro de clientes — cartera, contactos e importación masiva." />
      <ClientesMaestro clientes={clientes ?? []} countCot={countCot} countProy={countProy} canEdit={canEdit} />
    </div>
  );
}
