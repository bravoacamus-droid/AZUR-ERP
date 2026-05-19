/**
 * Tipo de cambio USD → PEN.
 * Cascade: SUNAT (apis.net.pe v2 → v1) → ER-API → exchangerate-api.
 * Cache 1h via fetch revalidate. Si TODAS las fuentes fallan, devolvemos null.
 * Nunca mostramos valor "referencial" hardcoded.
 */

export type TipoCambio = {
  compra: number;
  venta: number;
  fecha: string; // YYYY-MM-DD
  origen: 'sunat' | 'er-api' | 'exchangerate-api';
};

const REVALIDATE_SECONDS = 3600; // 1h

async function trySunatV2(): Promise<TipoCambio | null> {
  try {
    const res = await fetch('https://api.apis.net.pe/v2/sunat/tipo-cambio', {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { compra?: number; venta?: number; fecha?: string };
    if (typeof data.compra !== 'number' || typeof data.venta !== 'number') return null;
    return {
      compra: data.compra,
      venta: data.venta,
      fecha: data.fecha ?? new Date().toISOString().slice(0, 10),
      origen: 'sunat',
    };
  } catch {
    return null;
  }
}

async function trySunatV1(): Promise<TipoCambio | null> {
  try {
    const res = await fetch('https://api.apis.net.pe/v1/tipo-cambio-sunat', {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { compra?: number; venta?: number; fecha?: string };
    if (typeof data.compra !== 'number' || typeof data.venta !== 'number') return null;
    return {
      compra: data.compra,
      venta: data.venta,
      fecha: data.fecha ?? new Date().toISOString().slice(0, 10),
      origen: 'sunat',
    };
  } catch {
    return null;
  }
}

async function tryErApi(): Promise<TipoCambio | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_utc?: string };
    if (data.result !== 'success' || typeof data.rates?.PEN !== 'number') return null;
    const rate = data.rates.PEN;
    // Esta API da rate único — aproximamos un spread típico de 0.5% (compra menor, venta mayor)
    return {
      compra: Number((rate - rate * 0.0025).toFixed(4)),
      venta: Number((rate + rate * 0.0025).toFixed(4)),
      fecha: new Date().toISOString().slice(0, 10),
      origen: 'er-api',
    };
  } catch {
    return null;
  }
}

async function tryExchangerateApi(): Promise<TipoCambio | null> {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: Record<string, number>; date?: string };
    if (typeof data.rates?.PEN !== 'number') return null;
    const rate = data.rates.PEN;
    return {
      compra: Number((rate - rate * 0.0025).toFixed(4)),
      venta: Number((rate + rate * 0.0025).toFixed(4)),
      fecha: data.date ?? new Date().toISOString().slice(0, 10),
      origen: 'exchangerate-api',
    };
  } catch {
    return null;
  }
}

/**
 * Cascade de fuentes — devuelve la primera que responda con datos válidos.
 * Si todas fallan, devuelve null (la UI debe esconder el banner).
 */
export async function getTipoCambio(): Promise<TipoCambio | null> {
  const sources = [trySunatV2, trySunatV1, tryErApi, tryExchangerateApi];
  for (const fn of sources) {
    const result = await fn();
    if (result) return result;
  }
  return null;
}
