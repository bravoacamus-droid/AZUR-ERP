// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Motor de cálculo del árbol (Cotización + Gestión de Proyecto)         ║
// ║  Fórmulas verificadas contra COTIZACIÓN_MODELO y GESTIÓN_DE_PROYECTO.  ║
// ╚══════════════════════════════════════════════════════════════════════╝

export interface NodoBase {
  id: string;
  parent_id: string | null;
  orden: number;
  nivel: number;
  item_codigo?: string | null;
  titulo: string;
}

export interface NodoArbol<T> {
  data: T;
  hijos: NodoArbol<T>[];
  esHoja: boolean;
}

// Arma el árbol a partir de filas planas con parent_id.
export function armarArbol<T extends NodoBase>(items: T[]): NodoArbol<T>[] {
  const byId = new Map<string, NodoArbol<T>>();
  items.forEach((d) => byId.set(d.id, { data: d, hijos: [], esHoja: true }));
  const raices: NodoArbol<T>[] = [];
  items
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .forEach((d) => {
      const nodo = byId.get(d.id)!;
      if (d.parent_id && byId.has(d.parent_id)) {
        const padre = byId.get(d.parent_id)!;
        padre.hijos.push(nodo);
        padre.esHoja = false;
      } else {
        raices.push(nodo);
      }
    });
  return raices;
}

// Numeración automática 1.0 / 1.1 / 1.1.1 / 1.1.2.1 según nivel (Anexo B A.2).
export function renumerar<T extends NodoBase>(raices: NodoArbol<T>[]): Map<string, string> {
  const codigos = new Map<string, string>();
  raices.forEach((nodo, i) => walk(nodo, `${i + 1}`, true));
  function walk(nodo: NodoArbol<T>, prefijo: string, esRaiz: boolean) {
    const codigo = esRaiz ? `${prefijo}.0` : prefijo;
    codigos.set(nodo.data.id, codigo);
    nodo.hijos.forEach((h, i) =>
      walk(h, `${esRaiz ? prefijo : prefijo}.${i + 1}`, false),
    );
  }
  return codigos;
}

// ───────────────────────── COSTOS Y MARGEN ────────────────────────────
export interface ItemCosto extends NodoBase {
  unidad?: string | null;
  cantidad?: number | null;
  costo_unitario?: number | null;
  margen_pct?: number | null;
}

export interface CalcItem {
  id: string;
  // costos
  costo_subtotal: number; // SUBTOTAL del cuadro de costos
  // margen
  precio_unitario: number; // C.U. / (1 - margen)
  margen_monto: number; // (PU - CU) * cantidad
  margen_subtotal: number; // PU * cantidad
}

// Calcula costos y márgenes con rollup hacia arriba.
// Solo el nivel hoja captura cantidad/CU/margen; los padres suman hijos.
export function calcularCostosMargen(raices: NodoArbol<ItemCosto>[]): Map<string, CalcItem> {
  const out = new Map<string, CalcItem>();

  function calc(nodo: NodoArbol<ItemCosto>): CalcItem {
    if (nodo.esHoja) {
      const cant = Number(nodo.data.cantidad ?? 0);
      const cu = Number(nodo.data.costo_unitario ?? 0);
      const margen = Math.min(0.999, Number(nodo.data.margen_pct ?? 0));
      const costoSub = cant * cu;
      const pu = margen > 0 ? cu / (1 - margen) : cu;
      const margenMonto = (pu - cu) * cant;
      const margenSub = pu * cant;
      const r: CalcItem = {
        id: nodo.data.id,
        costo_subtotal: costoSub,
        precio_unitario: pu,
        margen_monto: margenMonto,
        margen_subtotal: margenSub,
      };
      out.set(nodo.data.id, r);
      return r;
    }
    // padre = suma de hijos
    const acc: CalcItem = {
      id: nodo.data.id,
      costo_subtotal: 0,
      precio_unitario: 0,
      margen_monto: 0,
      margen_subtotal: 0,
    };
    for (const h of nodo.hijos) {
      const c = calc(h);
      acc.costo_subtotal += c.costo_subtotal;
      acc.margen_monto += c.margen_monto;
      acc.margen_subtotal += c.margen_subtotal;
    }
    out.set(nodo.data.id, acc);
    return acc;
  }

  raices.forEach(calc);
  return out;
}

// Bloque de totales de la cotización (Anexo B A.5).
export interface ParamsTotales {
  gg_pct: number;
  ga_pct: number;
  utilidad_pct: number;
  igv_pct: number;
  descuento_pct: number;
  descuento_activo: boolean;
}
export interface Totales {
  subtotal: number; // suma de subtotales con margen
  gastos_generales: number;
  gastos_administrativos: number;
  utilidad: number;
  costo_directo: number; // subtotal + gg + ga + utilidad
  igv: number;
  total: number;
  descuento: number;
  total_con_descuento: number;
  margen_subtotal: number; // suma de márgenes (interno)
  costo_directo_real: number; // suma de costos directos (interno)
}

export function calcularTotales(
  calc: Map<string, CalcItem>,
  raices: NodoArbol<ItemCosto>[],
  p: ParamsTotales,
): Totales {
  let subtotal = 0;
  let margen = 0;
  let costoReal = 0;
  for (const raiz of raices) {
    const c = calc.get(raiz.data.id);
    if (c) {
      subtotal += c.margen_subtotal;
      margen += c.margen_monto;
      costoReal += c.costo_subtotal;
    }
  }
  const gg = subtotal * p.gg_pct;
  const ga = subtotal * p.ga_pct;
  const util = subtotal * p.utilidad_pct;
  const costoDirecto = subtotal + gg + ga + util;
  const igv = costoDirecto * p.igv_pct;
  const total = costoDirecto + igv;
  const descuento = p.descuento_activo ? total * p.descuento_pct : 0;
  return {
    subtotal,
    gastos_generales: gg,
    gastos_administrativos: ga,
    utilidad: util,
    costo_directo: costoDirecto,
    igv,
    total,
    descuento,
    total_con_descuento: total - descuento,
    margen_subtotal: margen,
    costo_directo_real: costoReal,
  };
}

// ───────────────────────── VALORIZACIÓN ───────────────────────────────
// Por hoja: total_semana = pct_s * TOTAL_PARTIDA; %acum = Σ pct_s;
// valorizado_acum = %acum * TOTAL; saldo = TOTAL*(1-%acum).
// Rollup ponderado por monto (Anexo B B.3).
export interface ItemValor extends NodoBase {
  total_costo?: number | null;
}

export interface CalcValor {
  id: string;
  total_partida: number;
  pct_acumulado: number; // 0..1
  valorizado_acum: number;
  saldo: number;
  por_semana: number[]; // total valorizado por cada semana (índice = semana-1)
}

export function calcularValorizacion(
  raices: NodoArbol<ItemValor>[],
  // avances[itemId][semanaIndex] = pct de esa semana en el nivel hoja
  avances: Map<string, number[]>,
  numSemanas: number,
): Map<string, CalcValor> {
  const out = new Map<string, CalcValor>();

  function calc(nodo: NodoArbol<ItemValor>): CalcValor {
    if (nodo.esHoja) {
      const total = Number(nodo.data.total_costo ?? 0);
      const pcts = avances.get(nodo.data.id) ?? [];
      const porSemana = Array.from({ length: numSemanas }, (_, i) => (pcts[i] ?? 0) * total);
      const acum = pcts.reduce((a, b) => a + (b ?? 0), 0);
      const r: CalcValor = {
        id: nodo.data.id,
        total_partida: total,
        pct_acumulado: acum,
        valorizado_acum: acum * total,
        saldo: total * (1 - acum),
        por_semana: porSemana,
      };
      out.set(nodo.data.id, r);
      return r;
    }
    let total = 0;
    let valAcum = 0;
    const porSemana = Array.from({ length: numSemanas }, () => 0);
    for (const h of nodo.hijos) {
      const c = calc(h);
      total += c.total_partida;
      valAcum += c.valorizado_acum;
      c.por_semana.forEach((v, i) => (porSemana[i] += v));
    }
    const acum = total > 0 ? valAcum / total : 0; // ponderado por monto
    const r: CalcValor = {
      id: nodo.data.id,
      total_partida: total,
      pct_acumulado: acum,
      valorizado_acum: valAcum,
      saldo: total * (1 - acum),
      por_semana: porSemana,
    };
    out.set(nodo.data.id, r);
    return r;
  }

  raices.forEach(calc);
  return out;
}

// Dilución del adelanto por valorización (Anexo B B.9).
export function dilucionAdelanto(valorizacionSemana: number, pctAdelanto: number) {
  const amortizacion = pctAdelanto * valorizacionSemana;
  const cobroNeto = valorizacionSemana - amortizacion;
  return { amortizacion, cobroNeto };
}
