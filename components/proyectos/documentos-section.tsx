import Link from 'next/link';
import { File, FolderOpen } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import {
  CARPETA_LABEL,
  CARPETA_VARIANT,
  VISIBILIDAD_LABEL,
  VISIBILIDAD_VARIANT,
  formatBytes,
  type DocCarpeta,
  type DocVisibilidad,
} from '@/lib/proyectos/documentos';

type Props = { proyectoId: string };

export async function DocumentosSection({ proyectoId }: Props) {
  const supabase = createClient();

  const { data } = await supabase
    .from('documentos_proyecto')
    .select('id, titulo, carpeta, visibilidad, storage_path, tamano_bytes, tipo_mime, created_at, subido_por')
    .eq('proyecto_id', proyectoId)
    .order('created_at', { ascending: false })
    .limit(8);

  const items = data ?? [];

  // Conteo total por carpeta (para mostrar el resumen)
  const { data: counts } = await supabase
    .from('documentos_proyecto')
    .select('carpeta')
    .eq('proyecto_id', proyectoId);
  const countsByCarpeta = new Map<string, number>();
  (counts ?? []).forEach((c) => {
    countsByCarpeta.set(c.carpeta, (countsByCarpeta.get(c.carpeta) ?? 0) + 1);
  });

  // Signed URLs
  const admin = createAdminClient();
  const urls = new Map<string, string>();
  if (items.length > 0) {
    const { data: signed } = await admin.storage
      .from('documentos')
      .createSignedUrls(items.map((d) => d.storage_path), 60 * 60);
    (signed ?? []).forEach((s) => {
      if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    });
  }

  // Perfiles
  const userIds = [...new Set(items.map((d) => d.subido_por).filter(Boolean))] as string[];
  const perfilMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    (perfiles ?? []).forEach((p) => perfilMap.set(p.id, p.full_name));
  }

  return (
    <section className="azur-card p-0">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div>
          <h2 className="font-display text-lg font-bold text-azur-ink">Documentos del proyecto</h2>
          <p className="text-xs text-muted-foreground">
            Planos, contratos, cotizaciones y fichas técnicas — con segmentación de visibilidad.
          </p>
        </div>
        <Link
          href={`/proyectos/${proyectoId}/documentos`}
          className="text-xs font-semibold text-azur-red hover:underline"
        >
          Ver todos / subir →
        </Link>
      </header>

      {/* Resumen por carpeta */}
      {countsByCarpeta.size > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-border/60 px-6 py-3">
          {(Object.keys(CARPETA_LABEL) as DocCarpeta[]).map((c) => {
            const n = countsByCarpeta.get(c) ?? 0;
            if (n === 0) return null;
            return (
              <Badge key={c} variant={CARPETA_VARIANT[c]}>
                {CARPETA_LABEL[c]} · {n}
              </Badge>
            );
          })}
        </div>
      )}

      {items.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted-foreground">
          Sin documentos cargados. Click en "Ver todos / subir" para agregar el primero.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((d) => {
            const url = urls.get(d.storage_path);
            const reportador = d.subido_por ? perfilMap.get(d.subido_por) : null;
            return (
              <li key={d.id} className="flex items-center gap-3 px-6 py-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
                  <File className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-azur-ink">{d.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {reportador ?? '—'} · {formatBytes(Number(d.tamano_bytes ?? 0))} ·{' '}
                    {new Date(d.created_at).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={CARPETA_VARIANT[d.carpeta as DocCarpeta] ?? 'outline'}>
                    {CARPETA_LABEL[d.carpeta as DocCarpeta] ?? d.carpeta}
                  </Badge>
                  <Badge variant={VISIBILIDAD_VARIANT[d.visibilidad as DocVisibilidad] ?? 'outline'}>
                    {VISIBILIDAD_LABEL[d.visibilidad as DocVisibilidad] ?? d.visibilidad}
                  </Badge>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener"
                      className="text-xs font-semibold text-azur-red hover:underline"
                    >
                      Abrir
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
