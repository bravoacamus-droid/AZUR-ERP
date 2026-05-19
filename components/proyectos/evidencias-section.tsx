import Link from 'next/link';
import Image from 'next/image';
import { Camera, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

type Props = {
  proyectoId: string;
};

export async function EvidenciasSection({ proyectoId }: Props) {
  const supabase = createClient();

  const { data: evidencias } = await supabase
    .from('evidencias')
    .select(
      'id, storage_path, titulo, descripcion, latitud, longitud, tomada_en, capturada_por',
    )
    .eq('proyecto_id', proyectoId)
    .order('tomada_en', { ascending: false })
    .limit(12);

  const items = evidencias ?? [];

  // Perfiles por separado (mismo patrón que asistencias/rdos)
  const userIds = [...new Set(items.map((e) => e.capturada_por).filter(Boolean))] as string[];
  const perfilMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    (perfiles ?? []).forEach((p) => perfilMap.set(p.id, p.full_name));
  }

  // Signed URLs (1 hora)
  const admin = createAdminClient();
  const urls = new Map<string, string>();
  if (items.length > 0) {
    const { data: signed } = await admin.storage
      .from('evidencias')
      .createSignedUrls(items.map((e) => e.storage_path), 60 * 60);
    (signed ?? []).forEach((s) => {
      if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    });
  }

  return (
    <section className="azur-card p-0">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-bold text-azur-ink">Evidencias fotográficas</h2>
          <p className="text-xs text-muted-foreground">
            Fotos del avance subidas desde la PWA con geotag.
          </p>
        </div>
        <Link
          href={`/proyectos/${proyectoId}/evidencias`}
          className="text-xs font-semibold text-azur-red hover:underline"
        >
          Ver galería completa →
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          Aún no hay evidencias. Cuando el residente suba una foto desde la PWA, aparecerá aquí.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((e) => {
            const url = urls.get(e.storage_path);
            const reportador = e.capturada_por ? perfilMap.get(e.capturada_por) : null;
            const fecha = new Date(e.tomada_en).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
              day: '2-digit',
              month: 'short',
            });
            return (
              <Link
                key={e.id}
                href={`/proyectos/${proyectoId}/evidencias`}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted"
                title={`${e.titulo ?? 'Evidencia'} · ${reportador ?? '—'} · ${new Date(e.tomada_en).toLocaleString('es-PE', { timeZone: 'America/Lima' })}`}
              >
                {url ? (
                  <Image
                    src={url}
                    alt={e.titulo ?? 'Evidencia'}
                    fill
                    sizes="(max-width: 768px) 50vw, 200px"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-[10px] text-muted-foreground">
                    Sin preview
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="line-clamp-1 text-[10px] font-semibold text-white">
                    {e.titulo ?? 'Sin título'}
                  </p>
                  <p className="text-[9px] text-white/80">{fecha}</p>
                </div>
                {e.latitud != null && (
                  <div className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-azur-red">
                    <MapPin className="h-3 w-3" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
