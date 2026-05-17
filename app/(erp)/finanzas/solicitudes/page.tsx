import Link from 'next/link';
import { ClipboardList, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN } from '@/lib/utils';
import {
  SOLICITUD_ESTADO_LABEL,
  SOLICITUD_ESTADO_VARIANT,
  SOLICITUD_CATEGORIA_LABEL,
  URGENCIA_VARIANT,
  URGENCIA_LABEL,
  type SolicitudEstado,
} from '@/lib/finanzas/estados';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Solicitudes de pago' };

export default async function SolicitudesPage() {
  await requireSession();
  const supabase = createClient();

  const { data } = await supabase
    .from('solicitudes_pago')
    .select('id, codigo, concepto, beneficiario, monto, moneda, categoria, urgencia, estado, created_at, proyecto:proyecto_id(codigo, nombre)')
    .order('created_at', { ascending: false })
    .limit(100);

  const solicitudes = data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Solicitudes de pago"
        description="Todas las solicitudes registradas — desde campo y oficina."
        icon={ClipboardList}
        breadcrumbs={[{ label: 'Finanzas' }, { label: 'Solicitudes' }]}
        actions={
          <Link href="/finanzas/solicitudes/nueva">
            <Button>
              <Plus className="h-4 w-4" />
              Nueva solicitud
            </Button>
          </Link>
        }
      />

      {solicitudes.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Sin solicitudes"
          description="Las solicitudes se generan desde aquí o desde la PWA en campo. Las aprobaciones pasan por jefe → administrador → pago."
          action={
            <Link href="/finanzas/solicitudes/nueva">
              <Button>
                <Plus className="h-4 w-4" />
                Nueva solicitud
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="azur-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Proyecto</th>
                  <th className="px-4 py-3 font-semibold">Concepto</th>
                  <th className="px-4 py-3 font-semibold">Beneficiario</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 font-semibold">Urgencia</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {solicitudes.map((s) => {
                  const proyecto = Array.isArray(s.proyecto) ? s.proyecto[0] : s.proyecto;
                  return (
                    <tr key={s.id} className="hover:bg-azur-coral/5">
                      <td className="px-4 py-3">
                        <Link
                          href={`/finanzas/solicitudes/${s.id}`}
                          className="font-mono text-xs font-semibold text-azur-red hover:underline"
                        >
                          {s.codigo}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {proyecto && (
                          <div>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              {proyecto.codigo}
                            </p>
                            <p className="line-clamp-1 text-xs text-azur-ink">{proyecto.nombre}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-azur-ink">{s.concepto}</td>
                      <td className="px-4 py-3 text-muted-foreground">{s.beneficiario}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {SOLICITUD_CATEGORIA_LABEL[s.categoria] ?? s.categoria}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={URGENCIA_VARIANT[s.urgencia] ?? 'outline'}>
                          {URGENCIA_LABEL[s.urgencia] ?? s.urgencia}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={SOLICITUD_ESTADO_VARIANT[s.estado as SolicitudEstado]}>
                          {SOLICITUD_ESTADO_LABEL[s.estado as SolicitudEstado]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-azur-ink">
                        {s.moneda === 'USD'
                          ? `$ ${Number(s.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : formatPEN(Number(s.monto))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
