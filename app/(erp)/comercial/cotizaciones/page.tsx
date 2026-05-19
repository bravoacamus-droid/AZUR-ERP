import Link from 'next/link';
import { Briefcase, ClipboardCheck, Plus, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN } from '@/lib/utils';
import {
  COTIZACION_ESTADO_LABEL,
  COTIZACION_ESTADO_VARIANT,
  type CotizacionEstado,
} from '@/lib/comercial/estados';
import { TipoCambioBanner } from '@/components/finanzas/tipo-cambio-banner';

export const metadata = { title: 'Cotizaciones' };
export const dynamic = 'force-dynamic';

export default async function CotizacionesPage() {
  await requireSession();
  const supabase = createClient();

  const { data: rows } = await supabase
    .from('cotizaciones')
    .select(
      'id, codigo, titulo, estado, moneda, fecha_emision, validez_dias, cliente:cliente_id(razon_social)',
    )
    .order('fecha_emision', { ascending: false })
    .order('codigo', { ascending: false })
    .limit(100);

  const cotizaciones = rows ?? [];

  // Totales por cotización (vista)
  const totalesMap = new Map<string, number>();
  if (cotizaciones.length > 0) {
    const { data: tot } = await supabase
      .from('v_cotizacion_totales')
      .select('id, total')
      .in(
        'id',
        cotizaciones.map((c) => c.id),
      );
    (tot ?? []).forEach((t) => totalesMap.set(t.id as string, Number(t.total ?? 0)));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cotizaciones"
        description="Genera, envía y gestiona cotizaciones con Análisis de Precios Unitarios."
        icon={ClipboardCheck}
        breadcrumbs={[{ label: 'Comercial' }, { label: 'Cotizaciones' }]}
        actions={
          <>
            <Link href="/comercial/catalogo">
              <Button variant="secondary">
                <Briefcase className="h-4 w-4" />
                Catálogo
              </Button>
            </Link>
            <Link href="/comercial/cotizaciones/nueva">
              <Button>
                <Plus className="h-4 w-4" />
                Nueva cotización
              </Button>
            </Link>
          </>
        }
      />

      <TipoCambioBanner />

      {cotizaciones.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Aún no hay cotizaciones"
          description="Empieza creando tu primera cotización con APU. El sistema generará el código correlativo automáticamente."
          action={
            <Link href="/comercial/cotizaciones/nueva">
              <Button>
                <Plus className="h-4 w-4" />
                Crear cotización
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
                  <th className="px-4 py-3 font-semibold">Cliente / Título</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Emisión</th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {cotizaciones.map((c) => {
                  const total = totalesMap.get(c.id) ?? 0;
                  const cliente = Array.isArray(c.cliente) ? c.cliente[0] : c.cliente;
                  return (
                    <tr key={c.id} className="group transition-colors hover:bg-azur-coral/5">
                      <td className="px-4 py-3">
                        <Link
                          href={`/comercial/cotizaciones/${c.id}`}
                          className="font-mono text-xs font-semibold text-azur-red hover:underline"
                        >
                          {c.codigo}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-azur-ink">{c.titulo}</p>
                        {cliente?.razon_social && (
                          <p className="text-xs text-muted-foreground">{cliente.razon_social}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={COTIZACION_ESTADO_VARIANT[c.estado as CotizacionEstado]}>
                          {COTIZACION_ESTADO_LABEL[c.estado as CotizacionEstado]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(c.fecha_emision).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-azur-ink">
                        {c.moneda === 'USD' ? `$ ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : formatPEN(total)}
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
