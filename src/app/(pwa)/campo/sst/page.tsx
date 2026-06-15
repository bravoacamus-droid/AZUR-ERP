import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { SstPanel } from './sst-panel';

export const dynamic = 'force-dynamic';

export default async function SstPage() {
  await requireSession();
  const supabase = createClient();

  const [{ data: proyectos }, { data: charlas }, { data: observaciones }, { data: incidentes }] =
    await Promise.all([
      supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
      supabase
        .from('sst_charlas')
        .select('id, tema, asistentes, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('sst_observaciones')
        .select('id, tipo, descripcion, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('sst_incidentes')
        .select('id, descripcion, gravedad, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo" className="mb-1 inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Campo
        </Link>
        <h1 className="text-xl font-bold">Seguridad y Salud (SST)</h1>
      </div>

      <SstPanel
        proyectos={proyectos ?? []}
        charlas={charlas ?? []}
        observaciones={observaciones ?? []}
        incidentes={incidentes ?? []}
      />
    </div>
  );
}
