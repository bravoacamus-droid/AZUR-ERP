/**
 * Motor APU (Análisis de Precios Unitarios) y totales de cotización.
 * Funciones puras — fácilmente testeables y reutilizables en cliente, servidor y PDF.
 */

export type ApuComponente = {
  cantidad: number;
  precio_unit: number;
};

export type CotPartida = {
  cantidad: number;
  precio_unitario: number;
};

export type CotMeta = {
  margen_porcentaje: number;
  gastos_generales_porcentaje: number;
  igv_porcentaje: number;
};

/** Suma cantidad × precio_unit de un APU completo (costo directo de la partida). */
export function calcularPrecioUnitario(componentes: ApuComponente[]): number {
  return componentes.reduce((sum, c) => sum + Number(c.cantidad) * Number(c.precio_unit), 0);
}

/** Costo directo total de la cotización = Σ (cantidad × precio_unitario) de cada partida. */
export function calcularCostoDirecto(partidas: CotPartida[]): number {
  return partidas.reduce((sum, p) => sum + Number(p.cantidad) * Number(p.precio_unitario), 0);
}

export type CotizacionTotales = {
  costoDirecto: number;
  gastosGenerales: number;
  utilidad: number;
  subtotal: number;
  igv: number;
  total: number;
};

/**
 * Calcula todos los totales (CD, GG, Utilidad, Subtotal, IGV, Total).
 * GG y Utilidad son porcentajes sobre el costo directo (estándar del sector).
 * IGV se aplica sobre el subtotal (CD + GG + Utilidad).
 */
export function calcularTotalesCotizacion(
  partidas: CotPartida[],
  meta: CotMeta,
): CotizacionTotales {
  const costoDirecto = calcularCostoDirecto(partidas);
  const gastosGenerales = round2(costoDirecto * (meta.gastos_generales_porcentaje / 100));
  const utilidad = round2(costoDirecto * (meta.margen_porcentaje / 100));
  const subtotal = round2(costoDirecto + gastosGenerales + utilidad);
  const igv = round2(subtotal * (meta.igv_porcentaje / 100));
  const total = round2(subtotal + igv);
  return { costoDirecto, gastosGenerales, utilidad, subtotal, igv, total };
}

/** Agrupa un APU por categoría y suma parciales por grupo (MO/MAT/EQ/GG/Subc/Trans). */
export type ApuCategoriaTotal = {
  categoria: string;
  parcial: number;
};

export function totalesApuPorCategoria<
  T extends { categoria: string; cantidad: number; precio_unit: number },
>(componentes: T[]): ApuCategoriaTotal[] {
  const map = new Map<string, number>();
  for (const c of componentes) {
    const parcial = Number(c.cantidad) * Number(c.precio_unit);
    map.set(c.categoria, (map.get(c.categoria) ?? 0) + parcial);
  }
  return Array.from(map.entries())
    .map(([categoria, parcial]) => ({ categoria, parcial: round2(parcial) }))
    .sort((a, b) => b.parcial - a.parcial);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
