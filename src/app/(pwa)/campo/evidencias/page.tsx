import Link from 'next/link';
import { ChevronLeft, Images } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { fmtDateTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/misc';
import { EvidenciaForm } from './evidencia-form';

export const dynamic = 'force-dynamic';

export default async function EvidenciasPage() {
  await requireSession();
  const supabase = createClient();

  const [{ data: proyectos }, { data: partidas }, { data: evidenciasRaw }] = await Promise.all([
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase.from('proyecto_items').select('id, titulo, proyecto_id').eq('es_hoja', true).order('orden'),
    supabase
      .from('evidencias')
      .select('id, url, descripcion, created_at')
      .order('created_at', { ascending: false })
      .limit(24),
  ]);

  type EvidenciaRow = { id: string; url: string; descripcion: string | null; created_at: string };
  const evidencias = (evidenciasRaw ?? []) as EvidenciaRow[];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo" className="mb-1 inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Campo
        </Link>
        <h1 className="text-xl font-bold">Evidencias</h1>
      </div>

      <EvidenciaForm proyectos={proyectos ?? []} partidas={partidas ?? []} />

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Images className="size-4 text-azur-600" />
          <p className="text-sm font-semibold">Evidencias recientes</p>
        </div>
        {evidencias.length === 0 ? (
          <EmptyState titulo="Sin evidencias" descripcion="Aún no se han registrado fotos." />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {evidencias.map((e) => (
              <a
                key={e.id}
                href={e.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-xl border bg-secondary/30"
                title={e.descripcion ?? fmtDateTime(e.created_at)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.url}
                  alt={e.descripcion ?? 'Evidencia'}
                  className="size-full object-cover transition-transform group-active:scale-95"
                />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
