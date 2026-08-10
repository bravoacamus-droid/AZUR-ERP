// Estado de resultados (P&L) — cálculo único compartido por pantalla, PDF y Excel
// para que los números siempre cuadren.
//
// Utilidad real   = Cobrado − Gastado   (flujo de caja del proyecto, acumulado a la fecha)
// Margen real %   = Utilidad real / Cobrado
// Margen cotizado % = (GG% + GA% + Utilidad%) / (1 + GG% + GA% + Utilidad%)  (sobre precio neto)
// Utilidad cotizada = Contrato neto de IGV × Margen cotizado %   (proyectada a fin de obra)
// Gap             = Margen real % − Margen cotizado %

export interface PnlRow {
  id: string; codigo: string | null; nombre: string; linea_id: string | null;
  cobrado: number; gastado: number; utilReal: number; margenRealPct: number;
  contratoNeto: number; utilCotizada: number; margenCotPct: number; gapPct: number;
}
export interface PnlLinea {
  linea_id: string; nombre: string; color?: string; nProyectos: number;
  cobrado: number; gastado: number; utilReal: number; margenRealPct: number;
  utilCotizada: number; margenCotPct: number; gapPct: number;
}

type DashLike = { proyecto_id: string; codigo?: string | null; nombre?: string | null; linea_id?: string | null; proyectado?: number | null; pagos?: number | null; gasto?: number | null };
type MargenLike = { gg_pct?: number | null; ga_pct?: number | null; utilidad_pct?: number | null; igv_pct?: number | null };

export function pnlProyecto(d: DashLike, mp?: MargenLike): PnlRow {
  const cobrado = Number(d.pagos ?? 0);
  const gastado = Number(d.gasto ?? 0);
  const utilReal = cobrado - gastado;
  const margenRealPct = cobrado > 0 ? utilReal / cobrado : 0;
  const m = (Number(mp?.gg_pct) || 0) + (Number(mp?.ga_pct) || 0) + (Number(mp?.utilidad_pct) || 0);
  const igv = Number(mp?.igv_pct) || 0;
  const contrato = Number(d.proyectado ?? 0);
  const contratoNeto = igv > 0 ? contrato / (1 + igv) : contrato;
  const margenCotPct = m > 0 ? m / (1 + m) : 0;
  const utilCotizada = contratoNeto * margenCotPct;
  return {
    id: d.proyecto_id, codigo: d.codigo ?? null, nombre: d.nombre ?? 'Proyecto', linea_id: d.linea_id ?? null,
    cobrado, gastado, utilReal, margenRealPct, contratoNeto, utilCotizada, margenCotPct, gapPct: margenRealPct - margenCotPct,
  };
}

// ── Estado de resultados por línea / mes (base caja: cobrado − gastado) ──
export interface PnlMesFila { mes: string; cobrado: number; gastado: number; utilidad: number; porLinea: Record<string, number> }
export interface PnlMensual { lineas: { id: string; nombre: string }[]; filas: PnlMesFila[]; total: PnlMesFila }

type AbonoLike = { monto: number | null; fecha: string | null; proyecto_id: string | null };
type SolLike = { monto: number | null; pagado_at: string | null; proyecto_id: string | null; linea_id?: string | null };

const SIN = '__sin__';
export function pnlMensual(
  abonos: AbonoLike[], sols: SolLike[],
  proyLinea: Map<string, string | null>, lineas: { id: string; nombre: string }[],
): PnlMensual {
  // mes -> linea_id -> { cob, gas }
  const m = new Map<string, Map<string, { cob: number; gas: number }>>();
  const usa = new Set<string>(); // líneas con actividad
  const cell = (mes: string, li: string) => {
    const mm = m.get(mes) ?? new Map(); m.set(mes, mm);
    const c = mm.get(li) ?? { cob: 0, gas: 0 }; mm.set(li, c); return c;
  };
  (abonos ?? []).forEach((a) => {
    if (!a.fecha) return;
    const li = (proyLinea.get(a.proyecto_id ?? '') ?? SIN) || SIN;
    cell(a.fecha.slice(0, 7), li).cob += Number(a.monto ?? 0); usa.add(li);
  });
  (sols ?? []).forEach((s) => {
    if (!s.pagado_at) return;
    const li = (proyLinea.get(s.proyecto_id ?? '') ?? s.linea_id ?? SIN) || SIN;
    cell(s.pagado_at.slice(0, 7), li).gas += Number(s.monto ?? 0); usa.add(li);
  });

  const cols = lineas.filter((l) => usa.has(l.id));
  if (usa.has(SIN)) cols.push({ id: SIN, nombre: 'Sin línea' });

  const filas: PnlMesFila[] = [...m.keys()].sort().map((mes) => {
    const mm = m.get(mes)!;
    let cobrado = 0, gastado = 0; const porLinea: Record<string, number> = {};
    cols.forEach((l) => {
      const c = mm.get(l.id) ?? { cob: 0, gas: 0 };
      cobrado += c.cob; gastado += c.gas; porLinea[l.id] = c.cob - c.gas;
    });
    return { mes, cobrado, gastado, utilidad: cobrado - gastado, porLinea };
  });

  const total: PnlMesFila = { mes: 'Total', cobrado: 0, gastado: 0, utilidad: 0, porLinea: {} };
  cols.forEach((l) => (total.porLinea[l.id] = 0));
  filas.forEach((f) => {
    total.cobrado += f.cobrado; total.gastado += f.gastado; total.utilidad += f.utilidad;
    cols.forEach((l) => (total.porLinea[l.id] += f.porLinea[l.id] ?? 0));
  });

  return { lineas: cols, filas, total };
}

export function agruparPnlPorLinea(rows: PnlRow[], lineas: { id: string; nombre: string; color?: string }[]): PnlLinea[] {
  return lineas
    .map((l) => {
      const de = rows.filter((r) => r.linea_id === l.id);
      const cobrado = de.reduce((a, r) => a + r.cobrado, 0);
      const gastado = de.reduce((a, r) => a + r.gastado, 0);
      const utilReal = cobrado - gastado;
      const utilCotizada = de.reduce((a, r) => a + r.utilCotizada, 0);
      const contratoNeto = de.reduce((a, r) => a + r.contratoNeto, 0);
      return {
        linea_id: l.id, nombre: l.nombre, color: l.color, nProyectos: de.length,
        cobrado, gastado, utilReal,
        margenRealPct: cobrado > 0 ? utilReal / cobrado : 0,
        utilCotizada,
        margenCotPct: contratoNeto > 0 ? utilCotizada / contratoNeto : 0,
        gapPct: (cobrado > 0 ? utilReal / cobrado : 0) - (contratoNeto > 0 ? utilCotizada / contratoNeto : 0),
      };
    })
    .filter((l) => l.cobrado || l.gastado || l.utilCotizada);
}
