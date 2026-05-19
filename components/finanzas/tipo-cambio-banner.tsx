import { ArrowLeftRight, TrendingUp } from 'lucide-react';
import { getTipoCambio } from '@/lib/finanzas/tipo-cambio';

const ORIGEN_LABEL: Record<string, string> = {
  sunat: 'SUNAT',
  'er-api': 'ExchangeRate-API',
  'exchangerate-api': 'ExchangeRate.com',
};

/**
 * Banner con el tipo de cambio USD/PEN actual.
 * Si todas las fuentes fallan, el banner no se renderiza.
 */
export async function TipoCambioBanner() {
  const tc = await getTipoCambio();
  if (!tc) return null;

  const fechaLima = new Date(tc.fecha + 'T12:00:00').toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const esSunat = tc.origen === 'sunat';

  return (
    <div className="azur-card flex flex-wrap items-center justify-between gap-4 border-azur-coral/40 bg-gradient-to-r from-azur-coral/10 via-white to-white p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-azur-gradient text-white shadow-azur-md">
          <ArrowLeftRight className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo de cambio · {ORIGEN_LABEL[tc.origen] ?? tc.origen}
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
        {esSunat ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success" title="Tipo de cambio oficial publicado por SUNAT">
            <TrendingUp className="h-3 w-3" />
            Oficial SUNAT
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-azur-coral/20 px-2 py-0.5 text-[10px] font-semibold text-azur-red" title={`Fuente: ${ORIGEN_LABEL[tc.origen] ?? tc.origen} (mercado internacional)`}>
            <TrendingUp className="h-3 w-3" />
            Mercado
          </span>
        )}
      </div>
    </div>
  );
}
