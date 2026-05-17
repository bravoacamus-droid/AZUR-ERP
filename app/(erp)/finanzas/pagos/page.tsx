import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pagos' };

export default async function PagosPage() {
  await requireSession();
  const supabase = createClient();

  const { data } = await supabase
    .from('pagos')
    .select(
      'id, codigo, monto, moneda, fecha_programada, fecha_ejecutado, voucher_path, banco_origen, numero_operacion, solicitud:solicitud_id(id, codigo, concepto, beneficiario)',
    )
    .order('fecha_programada', { ascending: false })
    .limit(100);

  const pagos = data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pagos"
        description="Pagos programados y ejecutados — con voucher para compartir por WhatsApp."
        icon={Receipt}
        breadcrumbs={[{ label: 'Finanzas' }, { label: 'Pagos' }]}
      />

      {pagos.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin pagos registrados"
          description="Los pagos se generan al programar una solicitud aprobada desde la bandeja del administrador."
        />
      ) : (
        <div className="azur-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Solicitud</th>
                  <th className="px-4 py-3 font-semibold">Beneficiario</th>
                  <th className="px-4 py-3 font-semibold">Programado</th>
                  <th className="px-4 py-3 font-semibold">Ejecutado</th>
                  <th className="px-4 py-3 font-semibold">Voucher</th>
                  <th className="px-4 py-3 text-right font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pagos.map((p) => {
                  const sol = Array.isArray(p.solicitud) ? p.solicitud[0] : p.solicitud;
                  return (
                    <tr key={p.id} className="hover:bg-azur-coral/5">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-azur-red">{p.codigo}</td>
                      <td className="px-4 py-3">
                        {sol && (
                          <Link
                            href={`/finanzas/solicitudes/${sol.id}`}
                            className="text-xs text-azur-red hover:underline"
                          >
                            {sol.codigo}
                          </Link>
                        )}
                        <p className="line-clamp-1 text-xs text-muted-foreground">{sol?.concepto}</p>
                      </td>
                      <td className="px-4 py-3 text-azur-ink">{sol?.beneficiario ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(p.fecha_programada).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.fecha_ejecutado ? new Date(p.fecha_ejecutado).toLocaleDateString('es-PE') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.voucher_path ? 'success' : 'warning'}>
                          {p.voucher_path ? 'Cargado' : 'Pendiente'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-azur-ink">
                        {p.moneda === 'USD'
                          ? `$ ${Number(p.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                          : formatPEN(Number(p.monto))}
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
