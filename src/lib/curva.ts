// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Curva S comparativa: PROYECTADO (línea base) vs REAL (ejecutado).     ║
// ║  El proyectado se arma automáticamente repartiendo el monto de cada    ║
// ║  partida en las semanas de su plazo planificado (fechas + costo).      ║
// ╚══════════════════════════════════════════════════════════════════════╝

export interface ItemPlan {
  fi: string | null; // fecha inicio planificada (ISO)
  fe: string | null; // fecha entrega planificada (ISO)
  monto: number; // monto de la partida (costo o precio, según base)
}

const MS_DIA = 24 * 3600 * 1000;
const toDate = (iso: string) => new Date(iso + 'T00:00:00');
const diffDias = (aISO: string, bISO: string) => Math.round((toDate(bISO).getTime() - toDate(aISO).getTime()) / MS_DIA);

// Semana (1-based) a la que pertenece una fecha respecto de la base.
function semanaDe(fechaISO: string, inicioBaseISO: string): number {
  const d = diffDias(inicioBaseISO, fechaISO);
  return Math.max(1, Math.floor(d / 7) + 1);
}

// Reparte el monto de cada partida uniformemente entre los días de su plazo
// planificado y acumula por semana. Devuelve el monto planificado por semana
// (índice 0 = semana 1), longitud = numSemanas.
export function repartoSemanal(items: ItemPlan[], inicioBaseISO: string, numSemanas: number): number[] {
  const semanas = new Array(Math.max(1, numSemanas)).fill(0);
  for (const it of items) {
    if (!it.fi || !it.fe || !it.monto) continue;
    const dias = Math.max(1, diffDias(it.fi, it.fe) + 1); // ambos inclusive
    const porDia = it.monto / dias;
    for (let k = 0; k < dias; k++) {
      const fecha = new Date(toDate(it.fi).getTime() + k * MS_DIA);
      const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      const s = semanaDe(iso, inicioBaseISO);
      const idx = Math.min(semanas.length, s) - 1;
      semanas[idx] += porDia;
    }
  }
  return semanas;
}

export interface PuntoCurva {
  semana: number;
  planAcum: number;
  realAcum: number | null; // null tras la última valorización real (aún no ejecutado)
  planPct: number;
  realPct: number | null;
}

export interface SerieComparativa {
  data: PuntoCurva[];
  baseTotal: number; // total planificado (denominador de %)
  numSemanas: number;
  semanaRealActual: number; // última semana con valorización real
  gapMonto: number; // realAcum − planAcum en la semana real actual (negativo = atraso)
  gapPct: number; // en puntos porcentuales del total
}

// Arma la serie semanal comparando el acumulado planificado vs el real.
export function serieComparativa(params: {
  items: ItemPlan[];
  inicioBase: string | null;
  valorizaciones: { numero: number; monto: number }[];
}): SerieComparativa {
  const { items, valorizaciones } = params;
  // base temporal: primer inicio planificado (o el pasado como inicioBase)
  const inicios = items.map((i) => i.fi).filter(Boolean) as string[];
  const inicioBase = params.inicioBase ?? (inicios.length ? inicios.sort()[0] : null);

  const baseTotal = items.reduce((a, i) => a + (i.monto || 0), 0);
  const maxValNum = valorizaciones.reduce((m, v) => Math.max(m, v.numero), 0);

  // semanas necesarias: cubrir todo el plan y todas las valorizaciones reales
  let numSemanasPlan = 1;
  if (inicioBase) {
    const fines = items.map((i) => i.fe).filter(Boolean) as string[];
    if (fines.length) numSemanasPlan = semanaDe(fines.sort().slice(-1)[0], inicioBase);
  }
  const numSemanas = Math.max(numSemanasPlan, maxValNum, 1);

  const plan = inicioBase ? repartoSemanal(items, inicioBase, numSemanas) : new Array(numSemanas).fill(0);

  const realPorSemana = new Map<number, number>();
  valorizaciones.forEach((v) => realPorSemana.set(v.numero, (realPorSemana.get(v.numero) ?? 0) + (v.monto || 0)));

  const data: PuntoCurva[] = [];
  let planAcum = 0, realAcum = 0;
  // punto 0 (arranque en 0)
  data.push({ semana: 0, planAcum: 0, realAcum: maxValNum > 0 ? 0 : null, planPct: 0, realPct: maxValNum > 0 ? 0 : null });
  for (let s = 1; s <= numSemanas; s++) {
    planAcum += plan[s - 1] ?? 0;
    realAcum += realPorSemana.get(s) ?? 0;
    const realVisible = s <= maxValNum;
    data.push({
      semana: s,
      planAcum: Math.round(planAcum * 100) / 100,
      realAcum: realVisible ? Math.round(realAcum * 100) / 100 : null,
      planPct: baseTotal > 0 ? Math.round((planAcum / baseTotal) * 1000) / 10 : 0,
      realPct: realVisible && baseTotal > 0 ? Math.round((realAcum / baseTotal) * 1000) / 10 : null,
    });
  }

  // Gap a la semana real actual
  const planEnSemanaReal = data[Math.min(maxValNum, data.length - 1)]?.planAcum ?? 0;
  const realEnSemanaReal = valorizaciones.reduce((a, v) => a + (v.monto || 0), 0);
  const gapMonto = realEnSemanaReal - planEnSemanaReal;
  const gapPct = baseTotal > 0 ? (gapMonto / baseTotal) * 100 : 0;

  return { data, baseTotal, numSemanas, semanaRealActual: maxValNum, gapMonto, gapPct };
}
