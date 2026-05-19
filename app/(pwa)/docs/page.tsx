import Link from 'next/link';
import { File, FolderOpen, Lock, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
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
import { subirDocumento } from './actions';

export const metadata = { title: 'Documentos del proyecto' };
export const dynamic = 'force-dynamic';

const inputClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

export default async function DocsPage() {
  const session = await requireSession();
  const supabase = createClient();
  const visPermitidas = visibilidadesPermitidas(session.rol);

  const { data: asignados } = await supabase
    .from('usuario_proyectos')
    .select('proyecto:proyecto_id(id, codigo, nombre)')
    .eq('user_id', session.userId)
    .eq('activo', true);

  let proyectos = (asignados ?? [])
    .map((a) => (Array.isArray(a.proyecto) ? a.proyecto[0] : a.proyecto))
    .filter(Boolean) as Array<{ id: string; codigo: string; nombre: string }>;

  if (proyectos.length === 0) {
    const { data } = await supabase
      .from('proyectos')
      .select('id, codigo, nombre')
      .neq('estado', 'cancelado')
      .order('codigo', { ascending: false })
      .limit(15);
    proyectos = data ?? [];
  }

  const proyectoIds = proyectos.map((p) => p.id);

  const { data: docs } = proyectoIds.length
    ? await supabase
        .from('documentos_proyecto')
        .select('id, titulo, descripcion, carpeta, visibilidad, storage_path, tipo_mime, tamano_bytes, created_at, proyecto:proyecto_id(codigo)')
        .in('proyecto_id', proyectoIds)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] };

  // Signed URLs
  const admin = createAdminClient();
  let urls: Record<string, string> = {};
  if (docs && docs.length > 0) {
    const result = await admin.storage
      .from('documentos')
      .createSignedUrls(docs.map((d) => d.storage_path), 60 * 60);
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
          <FolderOpen className="h-6 w-6 text-azur-red" />
          Documentos del proyecto
        </h1>
        <p className="text-sm text-muted-foreground">
          Planos, contratos, cotizaciones aprobadas y fichas técnicas — accesibles desde el celular.
        </p>
      </header>

      {proyectos.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Sin proyectos disponibles" />
      ) : (
        <form action={subirDocumento} className="azur-card space-y-3">
          <h2 className="font-display text-base font-bold text-azur-ink">Subir documento</h2>
          <div className="space-y-2">
            <Label htmlFor="doc_proy">Proyecto</Label>
            <select name="proyecto_id" id="doc_proy" required className={inputClass}>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} · {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="carpeta">Carpeta</Label>
              <select name="carpeta" id="carpeta" required className={inputClass} defaultValue="general">
                {(Object.keys(CARPETA_LABEL) as DocCarpeta[]).map((v) => (
                  <option key={v} value={v}>
                    {CARPETA_LABEL[v]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input name="titulo" id="titulo" required minLength={3} placeholder="Ej. Plano arq. nivel 3" />
            </div>
          </div>
          {visPermitidas.length > 1 ? (
            <div className="space-y-2">
              <Label htmlFor="visibilidad">Visibilidad</Label>
              <select
                name="visibilidad"
                id="visibilidad"
                required
                className={inputClass}
                defaultValue="publica"
              >
                {visPermitidas.map((v) => (
                  <option key={v} value={v}>
                    {VISIBILIDAD_LABEL[v]}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Pública: todos los del proyecto · Mando: solo jefes/gerencia · Gerencia: solo gerencia general.
              </p>
            </div>
          ) : (
            <input type="hidden" name="visibilidad" value="publica" />
          )}
          <div className="space-y-2">
            <Label htmlFor="file">Archivo (máx 50 MB)</Label>
            <input
              id="file"
              type="file"
              name="file"
              required
              className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-azur-red file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-azur-bright"
            />
          </div>
          <Button type="submit" className="w-full">
            <Upload className="h-4 w-4" />
            Subir
          </Button>
        </form>
      )}

      {docs && docs.length > 0 && (
        <section className="azur-card space-y-3">
          <h2 className="font-display text-base font-bold text-azur-ink">
            Documentos ({docs.length})
          </h2>
          <ul className="space-y-2">
            {docs.map((d) => {
              const proyecto = Array.isArray(d.proyecto) ? d.proyecto[0] : d.proyecto;
              const url = urls[d.storage_path];
              const carpeta = d.carpeta as DocCarpeta;
              const vis = d.visibilidad as DocVisibilidad;
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-3"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
                    <File className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-azur-ink">{d.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {proyecto?.codigo ?? ''} · {formatBytes(Number(d.tamano_bytes ?? 0))}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={CARPETA_VARIANT[carpeta] ?? 'outline'}>
                      {CARPETA_LABEL[carpeta] ?? d.carpeta}
                    </Badge>
                    {vis && vis !== 'publica' && (
                      <Badge variant={VISIBILIDAD_VARIANT[vis] ?? 'outline'} className="gap-1">
                        <Lock className="h-3 w-3" />
                        {VISIBILIDAD_LABEL[vis] ?? vis}
                      </Badge>
                    )}
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] font-semibold text-azur-red hover:underline"
                      >
                        Abrir
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
