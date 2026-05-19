import { ArrowLeftRight, TrendingUp } from 'lucide-react';
import { getTipoCambio } from '@/lib/finanzas/tipo-cambio';

/**
 * Banner con el tipo de cambio USD/PEN actual SUNAT.
 * Se actualiza cada hora (revalidate en el fetch).
 * Server component — se puede embeber en cualquier página ERP.
 */
export async function TipoCambioBanner() {
  const tc = await getTipoCambio();
  const fechaLima = new Date(tc.fecha + 'T12:00:00').toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="azur-card flex flex-wrap items-center justify-between gap-4 border-azur-coral/40 bg-gradient-to-r from-azur-coral/10 via-white to-white p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-azur-gradient text-white shadow-azur-md">
          <ArrowLeftRight className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de cambio SUNAT
          </p>
          <p className="font-display text-sm font-bold text-azur-ink">
            USD → PEN · {fechaLima}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Compra
          </p>
          <p className="font-mono text-lg font-bold text-azur-ink">
            S/ {tc.compra.toFixed(3)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Venta
          </p>
          <p className="font-mono text-lg font-bold text-azur-red">
            S/ {tc.venta.toFixed(3)}
          </p>
        </div>
        {tc.origen === 'fallback' && (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-[hsl(38_92%_30%)]" title="API SUNAT no disponible, mostrando valor referencial">
            Referencial
          </span>
        )}
        {tc.origen === 'sunat' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">
            <TrendingUp className="h-3 w-3" />
            Oficial
          </span>
        )}
      </div>
    </div>
  );
}
