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
