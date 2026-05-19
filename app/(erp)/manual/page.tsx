import Link from 'next/link';
import { BookOpen, Download, ExternalLink, FileText } from 'lucide-react';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Manual de Usuario' };

export default async function ManualPage() {
  await requireSession();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manual de Usuario"
        description="Guía completa del sistema AZUR ERP + PWA Campo, lista para entregar al cliente."
        icon={BookOpen}
        breadcrumbs={[{ label: 'Manual' }]}
        actions={
          <a href="/api/manual/pdf" target="_blank" rel="noopener">
            <Button>
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="azur-card lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-azur-ink">¿Qué incluye el manual?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            17 capítulos cubriendo cada módulo, flujo y rol del sistema.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {SECCIONES.map((s) => (
              <li
                key={s.num}
                className="flex items-start gap-2 rounded-xl border border-border/60 bg-white p-3 text-xs"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-azur-red text-[10px] font-bold text-white">
                  {s.num}
                </span>
                <span className="font-medium text-azur-ink">{s.titulo}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="azur-card space-y-4">
          <h2 className="font-display text-lg font-bold text-azur-ink">Formato</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-azur-red" />
              <div>
                <p className="font-semibold text-azur-ink">PDF profesional</p>
                <p className="text-xs text-muted-foreground">
                  Logo AZUR en portada, paginación, índice clickeable.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-azur-red" />
              <div>
                <p className="font-semibold text-azur-ink">Generado dinámicamente</p>
                <p className="text-xs text-muted-foreground">
                  Cada descarga refleja el estado actual del sistema.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-azur-red" />
              <div>
                <p className="font-semibold text-azur-ink">Listo para entregar</p>
                <p className="text-xs text-muted-foreground">
                  Comparte con tu equipo o cliente. ~20 páginas A4.
                </p>
              </div>
            </div>
          </div>

          <a
            href="/api/manual/pdf"
            target="_blank"
            rel="noopener"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-azur-gradient px-5 py-3 text-sm font-semibold text-white shadow-azur-md"
          >
            <Download className="h-4 w-4" />
            Descargar manual completo
          </a>
        </section>
      </div>

      <section className="azur-card bg-azur-coral/10">
        <h2 className="font-display text-base font-bold text-azur-ink">Acceso directo al PDF</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Comparte este enlace con cualquier usuario logueado:
        </p>
        <code className="mt-3 block rounded-lg border border-azur-red/30 bg-white p-3 font-mono text-xs text-azur-red">
          https://azur-erp.vercel.app/api/manual/pdf
        </code>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Requiere sesión activa. El PDF se genera en el servidor con los datos vigentes.
        </p>
      </section>
    </div>
  );
}

const SECCIONES = [
  { num: 1, titulo: 'Introducción y arquitectura' },
  { num: 2, titulo: 'Acceso inicial y usuarios' },
  { num: 3, titulo: 'Roles y permisos' },
  { num: 4, titulo: 'Módulo Clientes' },
  { num: 5, titulo: 'Módulo Comercial' },
  { num: 6, titulo: 'Módulo Proyectos' },
  { num: 7, titulo: 'Solicitudes y aprobaciones' },
  { num: 8, titulo: 'Cajas y flujo de caja' },
  { num: 9, titulo: 'Valorizaciones + Curva S' },
  { num: 10, titulo: 'Módulo Almacén' },
  { num: 11, titulo: 'PWA Campo (Residente)' },
  { num: 12, titulo: 'SST' },
  { num: 13, titulo: 'Documentos del proyecto' },
  { num: 14, titulo: 'Dashboard + Auditoría' },
  { num: 15, titulo: 'Notificaciones push' },
  { num: 16, titulo: 'Tipo de cambio SUNAT' },
  { num: 17, titulo: 'Reportes y exportaciones' },
  { num: 18, titulo: 'Flujo end-to-end' },
  { num: 19, titulo: 'FAQ y troubleshooting' },
];
