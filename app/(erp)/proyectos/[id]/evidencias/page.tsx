import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Camera, Download, MapPin, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Evidencias del proyecto' };

type SearchParams = {
  desde?: string;
  hasta?: string;
  user?: string;
};

export default async function EvidenciasProyectoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: SearchParams;
}) {
  await requireSession();
  const supabase = createClient();

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('id, codigo, nombre')
    .eq('id', params.id)
    .single();
  if (!proyecto) notFound();

  const desde =
    searchParams?.desde ?? new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10);
  const hasta = searchParams?.hasta ?? new Date().toISOString().slice(0, 10);

  let q = supabase
    .from('evidencias')
    .select(
      'id, storage_path, titulo, descripcion, latitud, longitud, tomada_en, capturada_por',
    )
    .eq('proyecto_id', params.id)
    .gte('tomada_en', `${desde}T00:00:00Z`)
    .lte('tomada_en', `${hasta}T23:59:59Z`)
    .order('tomada_en', { ascending: false })
    .limit(200);

  if (searchParams?.user) q = q.eq('capturada_por', searchParams.user);

  const { data: rows } = await q;
  const items = rows ?? [];

  // Perfiles
  const userIds = [...new Set(items.map((e) => e.capturada_por).filter(Boolean))] as string[];
  const perfilMap = new Map<string, { full_name: string; email: string }>();
  if (userIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    (perfiles ?? []).forEach((p) =>
      perfilMap.set(p.id, { full_name: p.full_name, email: p.email }),
    );
  }

  // Signed URLs
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

  const inputClass =
    'flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Evidencias fotográficas"
        description={`${proyecto.codigo} · ${proyecto.nombre}`}
        icon={Camera}
        breadcrumbs={[
          { label: 'Proyectos', href: '/proyectos' },
          { label: proyecto.codigo, href: `/proyectos/${params.id}` },
          { label: 'Evidencias' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total en periodo
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-azur-ink">{items.length}</p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Geotaggeadas
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-success">
            {items.filter((e) => e.latitud != null).length}
          </p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Fotógrafos distintos
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-azur-red">{userIds.length}</p>
        </div>
      </div>

      <form className="azur-card grid gap-3 sm:grid-cols-4 sm:items-end">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Desde
          </label>
          <input type="date" name="desde" defaultValue={desde} className={`mt-1 ${inputClass}`} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hasta
          </label>
          <input type="date" name="hasta" defaultValue={hasta} className={`mt-1 ${inputClass}`} />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Capturada por
          </label>
          <select name="user" defaultValue={searchParams?.user ?? ''} className={`mt-1 ${inputClass}`}>
            <option value="">Todos</option>
            {[...perfilMap.entries()].map(([id, p]) => (
              <option key={id} value={id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Link
            href={`/proyectos/${params.id}/evidencias`}
            className="inline-flex h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-medium hover:border-azur-coral"
          >
            Limpiar
          </Link>
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-azur-gradient px-5 text-sm font-semibold text-white shadow-azur-md"
          >
            Filtrar
          </button>
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="Sin evidencias en este periodo"
          description="Ajusta el rango o el usuario para ver más fotos."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((e) => {
            const url = urls.get(e.storage_path);
            const perfil = e.capturada_por ? perfilMap.get(e.capturada_por) : null;
            return (
              <article
                key={e.id}
                className="azur-card overflow-hidden p-0"
              >
                <div className="relative aspect-square bg-muted">
                  {url ? (
                    <Image
                      src={url}
                      alt={e.titulo ?? 'Evidencia'}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 300px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                      Sin preview
                    </div>
                  )}
                  {e.latitud != null && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${e.latitud}&mlon=${e.longitud}#map=18/${e.latitud}/${e.longitud}`}
                      target="_blank"
                      rel="noopener"
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-azur-red hover:bg-white"
                      title="Ver ubicación en mapa"
                    >
                      <MapPin className="h-3 w-3" />
                      GPS
                    </a>
                  )}
                  {url && (
                    <a
                      href={url}
                      download
                      className="absolute right-2 bottom-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-azur-red hover:bg-white"
                      title="Descargar"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-azur-ink">
                    {e.titulo ?? 'Sin título'}
                  </p>
                  {e.descripcion && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {e.descripcion}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-azur-gradient text-[9px] font-bold text-white">
                      {initials(perfil?.full_name ?? '?')}
                    </div>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                      {perfil?.full_name ?? '—'}
                    </p>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(e.tomada_en).toLocaleString('es-PE')}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">
        {items.length} foto(s) · máx 200 por filtro
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        <Link
          href={`/proyectos/${params.id}`}
          className="inline-flex items-center gap-1 hover:text-azur-red"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al proyecto
        </Link>
      </p>
    </div>
  );
}
