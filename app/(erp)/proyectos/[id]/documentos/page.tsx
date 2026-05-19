import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, File, FolderOpen, Lock, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { initials } from '@/lib/utils';
import {
  CARPETA_LABEL,
  CARPETA_VARIANT,
  VISIBILIDAD_LABEL,
  VISIBILIDAD_VARIANT,
  formatBytes,
  visibilidadesPermitidas,
  type DocCarpeta,
  type DocVisibilidad,
} from '@/lib/proyectos/documentos';
import { UploadForm } from './upload-form';
import { eliminarDocumento } from './actions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Documentos del proyecto' };

type SearchParams = { carpeta?: DocCarpeta; vis?: DocVisibilidad };

export default async function DocumentosProyectoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: SearchParams;
}) {
  const session = await requireSession();
  const supabase = createClient();

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('id, codigo, nombre')
    .eq('id', params.id)
    .single();
  if (!proyecto) notFound();

  let q = supabase
    .from('documentos_proyecto')
    .select(
      'id, titulo, descripcion, carpeta, visibilidad, storage_path, tamano_bytes, tipo_mime, created_at, subido_por',
    )
    .eq('proyecto_id', params.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (searchParams?.carpeta) q = q.eq('carpeta', searchParams.carpeta);
  if (searchParams?.vis) q = q.eq('visibilidad', searchParams.vis);

  const { data: docs } = await q;
  const items = docs ?? [];

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

  // Conteos por carpeta para mostrar en filtro
  const countsByCarpeta = new Map<string, number>();
  items.forEach((d) => {
    countsByCarpeta.set(d.carpeta, (countsByCarpeta.get(d.carpeta) ?? 0) + 1);
  });

  const inputClass =
    'flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

  const visPermitidas = visibilidadesPermitidas(session.rol);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documentos del proyecto"
        description={`${proyecto.codigo} · ${proyecto.nombre}`}
        icon={FolderOpen}
        breadcrumbs={[
          { label: 'Proyectos', href: '/proyectos' },
          { label: proyecto.codigo, href: `/proyectos/${params.id}` },
          { label: 'Documentos' },
        ]}
      />

      {/* Resumen por carpeta */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {(Object.keys(CARPETA_LABEL) as DocCarpeta[]).map((c) => (
          <Link
            key={c}
            href={`/proyectos/${params.id}/documentos?carpeta=${c}`}
            className={`azur-card text-center transition-all hover:-translate-y-0.5 hover:shadow-azur-md ${
              searchParams?.carpeta === c ? 'border-azur-red bg-azur-coral/10' : ''
            }`}
          >
            <p className="font-display text-2xl font-bold text-azur-ink">
              {countsByCarpeta.get(c) ?? 0}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {CARPETA_LABEL[c]}
            </p>
          </Link>
        ))}
      </div>

      {/* Form de upload */}
      <UploadForm proyectoId={params.id} visibilidadesPermitidas={visPermitidas} />

      {/* Filtros */}
      <form className="azur-card grid gap-3 sm:grid-cols-3 sm:items-end">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Carpeta
          </label>
          <select name="carpeta" defaultValue={searchParams?.carpeta ?? ''} className={`mt-1 ${inputClass}`}>
            <option value="">Todas</option>
            {(Object.keys(CARPETA_LABEL) as DocCarpeta[]).map((c) => (
              <option key={c} value={c}>
                {CARPETA_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Visibilidad
          </label>
          <select name="vis" defaultValue={searchParams?.vis ?? ''} className={`mt-1 ${inputClass}`}>
            <option value="">Todas</option>
            <option value="publica">Pública</option>
            <option value="mando">Solo mando</option>
            <option value="gerencia">Solo gerencia</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Link
            href={`/proyectos/${params.id}/documentos`}
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

      {/* Lista */}
      {items.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Sin documentos con esos filtros"
          description="Sube el primer documento con el formulario de arriba."
        />
      ) : (
        <div className="azur-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Documento</th>
                  <th className="px-4 py-3 font-semibold">Carpeta</th>
                  <th className="px-4 py-3 font-semibold">Visibilidad</th>
                  <th className="px-4 py-3 font-semibold">Subido por</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-right font-semibold">Tamaño</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((d) => {
                  const url = urls.get(d.storage_path);
                  const perfil = d.subido_por ? perfilMap.get(d.subido_por) : null;
                  const esOwner = d.subido_por === session.userId;
                  const puedeEliminar = esOwner || session.rol === 'gerencia_general';
                  const visIcon = d.visibilidad !== 'publica' ? <Lock className="h-3 w-3" /> : null;
                  return (
                    <tr key={d.id} className="hover:bg-azur-coral/5">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <File className="h-4 w-4 shrink-0 text-azur-red" />
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-semibold text-azur-ink">
                              {d.titulo}
                            </p>
                            {d.descripcion && (
                              <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                {d.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge variant={CARPETA_VARIANT[d.carpeta as DocCarpeta] ?? 'outline'}>
                          {CARPETA_LABEL[d.carpeta as DocCarpeta] ?? d.carpeta}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={VISIBILIDAD_VARIANT[d.visibilidad as DocVisibilidad] ?? 'outline'}
                          className="gap-1"
                        >
                          {visIcon}
                          {VISIBILIDAD_LABEL[d.visibilidad as DocVisibilidad] ?? d.visibilidad}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-azur-gradient text-[9px] font-bold text-white">
                            {initials(perfil ?? '?')}
                          </div>
                          <p className="line-clamp-1 text-xs text-azur-ink">{perfil ?? '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-xs">
                        {formatBytes(Number(d.tamano_bytes ?? 0))}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          {url && (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener"
                              className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-white px-2 text-[11px] font-semibold hover:border-azur-coral hover:text-azur-red"
                              title="Descargar / abrir"
                            >
                              <Download className="h-3 w-3" />
                              Abrir
                            </a>
                          )}
                          {puedeEliminar && (
                            <form action={eliminarDocumento} className="contents">
                              <input type="hidden" name="id" value={d.id} />
                              <input type="hidden" name="proyecto_id" value={params.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                title="Eliminar"
                                className="h-7 w-7"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-border/60 px-6 py-2 text-[11px] text-muted-foreground">
              {items.length} documento(s) · máx 200 por filtro
            </p>
          </div>
        </div>
      )}

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
