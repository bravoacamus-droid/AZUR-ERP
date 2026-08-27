import Link from 'next/link';
import { ChevronLeft, ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { fmtDateInput } from '@/lib/format';
import { EmptyState } from '@/components/ui/misc';
import { RdoForm } from './rdo-form';
import { RdoListItem } from './rdo-list-item';
import { ReporteConsolidado } from '@/components/proyectos/reporte-consolidado';

export const dynamic = 'force-dynamic';

export default async function RdoPage() {
  const session = await requireSession();
  const supabase = createClient();

  const [{ data: proyectos }, { data: partidas }, { data: partesRaw }, { data: actsAcum }, { data: evidenciasRaw }] = await Promise.all([
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase.from('proyecto_items').select('id, titulo, proyecto_id').eq('es_hoja', true).order('orden'),
    supabase
      .from('partes_diarios')
      .select('id, fecha, clima, personal_count, proyecto_id, estado, obs_revision, proyectos(nombre)')
      .eq('created_by', session.id)
      .order('fecha', { ascending: false })
      .limit(10),
    // Avance acumulado por partida (suma de todos los RDO) para la ayuda en pantalla.
    (supabase as any).from('rdo_actividades').select('proyecto_item_id, avance_pct'),
    // Evidencias del proyecto aún no adjuntas a un RDO (para elegirlas en el reporte).
    supabase.from('evidencias').select('id, url, descripcion, proyecto_id').is('rdo_id', null).order('created_at', { ascending: false }),
  ]);

  // Acumulado por partida (fracción 0–1).
  const acum: Record<string, number> = {};
  (actsAcum ?? []).forEach((a: any) => { if (a.proyecto_item_id) acum[a.proyecto_item_id] = (acum[a.proyecto_item_id] ?? 0) + Number(a.avance_pct ?? 0); });

  type ParteRow = {
    id: string;
    fecha: string;
    clima: string | null;
    personal_count: number | null;
    proyecto_id: string;
    estado: string | null;
    obs_revision: string | null;
    proyectos: { nombre: string } | null;
  };
  const partes = ((partesRaw ?? []) as unknown as ParteRow[]).map((p) => ({
    id: p.id, fecha: p.fecha, clima: p.clima, personal_count: p.personal_count,
    proyecto_id: p.proyecto_id, estado: p.estado ?? 'borrador', obs_revision: p.obs_revision,
    nombre: p.proyectos?.nombre ?? 'Proyecto',
  }));

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo" className="mb-1 inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Campo
        </Link>
        <h1 className="text-xl font-bold">Reporte diario de obra</h1>
      </div>

      <RdoForm proyectos={proyectos ?? []} partidas={partidas ?? []} hoy={fmtDateInput(new Date())} acum={acum} evidencias={evidenciasRaw ?? []} />

      {(proyectos ?? []).length > 0 && <ReporteConsolidado proyectos={proyectos ?? []} />}

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <ClipboardList className="size-4 text-azur-600" />
          <p className="text-sm font-semibold">Mis últimos reportes</p>
        </div>
        {partes.length === 0 ? (
          <EmptyState titulo="Sin partes" descripcion="Aún no has registrado partes diarios." />
        ) : (
          <ul className="divide-y">
            {partes.map((p) => <RdoListItem key={p.id} p={p} />)}
          </ul>
        )}
      </div>
    </div>
  );
}
