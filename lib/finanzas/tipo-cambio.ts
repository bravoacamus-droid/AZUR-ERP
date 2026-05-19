/**
 * Tipo de cambio USD → PEN desde SUNAT (vía apis.net.pe).
 * Cacheable: la API expone el TC del día, revalidamos cada hora.
 */

export type TipoCambio = {
  compra: number;
  venta: number;
  fecha: string; // YYYY-MM-DD
  origen: 'sunat' | 'fallback';
};

/** Fallback en caso de que la API esté caída — valor histórico razonable. */
const FALLBACK: TipoCambio = {
  compra: 3.75,
  venta: 3.78,
  fecha: new Date().toISOString().slice(0, 10),
  origen: 'fallback',
};

/**
 * Obtiene el tipo de cambio actual SUNAT.
 * En Server Components y route handlers (Node runtime).
 * Cacheado vía next.fetch con revalidate: 3600 (1h).
 */
export async function getTipoCambio(): Promise<TipoCambio> {
  try {
    const res = await fetch('https://api.apis.net.pe/v2/sunat/tipo-cambio', {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return FALLBACK;
    const data = (await res.json()) as { compra?: number; venta?: number; fecha?: string };
    if (typeof data.compra !== 'number' || typeof data.venta !== 'number') return FALLBACK;
    return {
      compra: data.compra,
      venta: data.venta,
      fecha: data.fecha ?? new Date().toISOString().slice(0, 10),
      origen: 'sunat',
    };
  } catch {
    return FALLBACK;
  }
}
