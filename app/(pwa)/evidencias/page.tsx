import Link from 'next/link';
import Image from 'next/image';
import { Camera, ImagePlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { EmptyState } from '@/components/ui/empty-state';
import { EvidenciaForm } from './evidencia-form';

export const metadata = { title: 'Evidencias fotográficas' };
export const dynamic = 'force-dynamic';

export default async function EvidenciasPage() {
  const session = await requireSession();
  const supabase = createClient();

  // Proyectos disponibles
  const { data: asignados } = await supabase
    .from('usuario_proyectos')
    .select('proyecto:proyecto_id(id, codigo, nombre)')
    .eq('user_id', session.userId)
    .eq('activo', true);

  let proyectos = (asignados ?? [])
    .map((a) => (Array.isArray(a.proyecto) ? a.proyecto[0] : a.proyecto))
    .filter(Boolean) as Array<{ id: string; codigo: string; nombre: string }>;

  if (proyectos.length === 0) {
    const { data: all } = await supabase
      .from('proyectos')
      .select('id, codigo, nombre')
      .neq('estado', 'cancelado')
      .order('codigo', { ascending: false })
      .limit(20);
    proyectos = all ?? [];
  }

  // Últimas 12 evidencias del usuario
  const { data: evidencias } = await supabase
    .from('evidencias')
    .select('id, storage_path, titulo, tomada_en, proyecto:proyecto_id(codigo)')
    .eq('capturada_por', session.userId)
    .order('tomada_en', { ascending: false })
    .limit(12);

  // Signed URLs (preview)
  const admin = createAdminClient();
  let urls: Record<string, string> = {};
  if (evidencias && evidencias.length > 0) {
    const result = await admin.storage
      .from('evidencias')
      .createSignedUrls(evidencias.map((e) => e.storage_path), 60 * 60);
    if (result.data) {
      urls = result.data.reduce<Record<string, string>>((acc, r) => {
        if (r.path && r.signedUrl) acc[r.path] = r.signedUrl;
        return acc;
      }, {});
    }
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <Link href="/inicio" className="text-xs font-semibold text-muted-foreground hover:text-azur-red">
          ← Inicio
        </Link>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-azur-ink">
          <Camera className="h-6 w-6 text-azur-red" />
          Evidencias fotográficas
        </h1>
        <p className="text-sm text-muted-foreground">
          Captura, geotag y carga directa al proyecto. Comprime a 1920px antes de subir.
        </p>
      </header>

      {proyectos.length === 0 ? (
        <EmptyState icon={ImagePlus} title="Sin proyectos disponibles" />
      ) : (
        <EvidenciaForm proyectos={proyectos} />
      )}

      {evidencias && evidencias.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Mis últimas fotos
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {evidencias.map((e) => {
              const u = urls[e.storage_path];
              const proyecto = Array.isArray(e.proyecto) ? e.proyecto[0] : e.proyecto;
              return (
                <div
                  key={e.id}
                  className="aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted"
                >
                  {u ? (
                    <Image
                      src={u}
                      alt={e.titulo ?? 'Evidencia'}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover"
                      title={`${proyecto?.codigo ?? ''} · ${new Date(e.tomada_en).toLocaleString('es-PE', { timeZone: 'America/Lima' })}`}
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                      —
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
