import { BellRing, AlertTriangle, FolderKanban } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { PageHeader, KpiCard } from '@/components/ui/page';
import { AlertasClient, type AlertaRow } from './alertas-client';

export const dynamic = 'force-dynamic';

export default async function AlertasPage() {
  await requireRol(['gerencia', 'jefe_proyectos', 'administrador']);
  const supabase = createClient();

  const { data } = await supabase
    .from('alertas')
    .select('id, titulo, detalle, tipo, severidad, resuelta, created_at, proyecto:proyectos(nombre, codigo)')
    .order('created_at', { ascending: false });

  const alertas = (data ?? []) as unknown as AlertaRow[];

  const abiertas = alertas.filter((a) => !a.resuelta);
  const criticas = abiertas.filter((a) => a.severidad === 'critica').length;
  const conProyecto = abiertas.filter((a) => a.proyecto != null).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas"
        description="Eventos que requieren atención: liquidez, sobregasto, vencimientos y más."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Abiertas" value={abiertas.length} icon={<BellRing />} tone="warning" />
        <KpiCard label="Críticas" value={criticas} icon={<AlertTriangle />} tone="azur" />
        <KpiCard label="Asociadas a proyecto" value={conProyecto} icon={<FolderKanban />} />
      </div>

      <AlertasClient alertas={alertas} />
    </div>
  );
}
