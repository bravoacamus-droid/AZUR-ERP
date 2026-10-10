// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Valor ganado (EVM) por proyecto — una sola fuente para la Curva S de  ║
// ║  costos y los dashboards de Gerencia / Jefe de Proyectos.              ║
// ║                                                                        ║
// ║  Todo a COSTO (sin margen):                                            ║
// ║   · BAC = presupuesto a costo = Σ total_costo de las hojas             ║
// ║   · PV  = valor planificado a una fecha (reparto lineal del costo de   ║
// ║           cada hoja en su plazo de la línea base fi_proy → fe_proy)    ║
// ║   · EV  = valor ganado = Σ valorizacion_items.total (base costo)       ║
// ║   · AC  = costo real = solicitudes pagadas/conciliadas (sin la         ║
// ║           reposición de caja chica), igual que v_dashboard_proyecto    ║
// ║   · SPI = EV / PV (avance real ÷ avance proyectado)                    ║
// ║   · CPI = EV / AC (valorización ÷ dinero gastado real)                 ║
// ╚══════════════════════════════════════════════════════════════════════╝

export interface EvmItem {
  id: string;
  parent_id?: string | null;
  nivel?: number | null;
  orden?: number | null;
  titulo: string;
  item_codigo?: string | null;
  es_hoja?: boolean | null;
  es_hito?: boolean | null;
  total_costo?: number | string | null;
  fi_proy?: string | null;
  fe_proy?: string | null;
  fecha_inicio?: string | null;
  fecha_entrega?: string | null;
  contratista_id?: string | null;
}

export interface EvmValorizacion {
  numero: number;
  semana?: number | null; // semana del cronograma (valorizaciones semanales)
  fecha_corte?: string | null;
  created_at?: string | null;
  valorizacion_items?: { proyecto_item_id: string; pct_avance?: number | string | null; total?: number | string | null }[] | null;
}

export interface EvmGasto {
  monto: number | string;
  fecha: string | null; // pagado_at (o fecha del gasto)
  tipo?: string | null;
  proyecto_item_id?: string | null;
  partida_ppto?: string | null;
  contraparte_id?: string | null;
  beneficiario?: string | null;
}

const MS_DIA = 86400000;
const d10 = (x: string | null | undefined) => (x ? String(x).slice(0, 10) : null);
const t = (iso: string) => new Date(iso + 'T00:00:00').getTime();
const isoDe = (ms: number) => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const hojasDe = (items: EvmItem[]) => items.filter((i) => i.es_hoja && !i.es_hito);
const n = (x: unknown) => Number(x ?? 0) || 0;

/** Presupuesto a costo (BAC). */
export function bac(items: EvmItem[]): number {
  return hojasDe(items).reduce((a, i) => a + n(i.total_costo), 0);
}

/** Fracción (0–1) del plazo planificado de una hoja transcurrida a `fecha`. */
export function fraccionPlan(it: EvmItem, fecha: string): number {
  const fi = d10(it.fi_proy), fe = d10(it.fe_proy);
  if (!fi || !fe) return 0;
  const ini = t(fi), fin = t(fe) + MS_DIA; // fin inclusive
  const f = t(fecha) + MS_DIA; // a fin del día
  if (f <= ini) return 0;
  if (f >= fin) return 1;
  return (f - ini) / Math.max(MS_DIA, fin - ini);
}

/** Valor planificado acumulado a una fecha. */
export function pvA(items: EvmItem[], fecha: string): number {
  return hojasDe(items).reduce((a, i) => a + n(i.total_costo) * fraccionPlan(i, fecha), 0);
}

const fechaVal = (v: EvmValorizacion) => d10(v.fecha_corte) ?? d10(v.created_at);

/** Valor ganado acumulado (opcionalmente hasta una fecha de corte). */
export function evA(vals: EvmValorizacion[], fecha?: string): number {
  return vals
    .filter((v) => !fecha || !fechaVal(v) || fechaVal(v)! <= fecha)
    .reduce((a, v) => a + (v.valorizacion_items ?? []).reduce((s, vi) => s + n(vi.total), 0), 0);
}

/** Costo real acumulado (opcionalmente hasta una fecha). */
export function acA(gastos: EvmGasto[], fecha?: string): number {
  return gastos.filter((g) => !fecha || (g.fecha && d10(g.fecha)! <= fecha)).reduce((a, g) => a + n(g.monto), 0);
}

export interface ResumenEvm {
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  spi: number | null;
  cpi: number | null;
  avanceReal: number; // EV / BAC
  avanceProy: number; // PV / BAC
  cv: number; // EV − AC
  sv: number; // EV − PV
  eac: number | null; // BAC / CPI
}

export function resumenEvm(items: EvmItem[], vals: EvmValorizacion[], gastos: EvmGasto[], hoy: string): ResumenEvm {
  const B = bac(items);
  const pv = pvA(items, hoy);
  const ev = evA(vals);
  const ac = acA(gastos);
  const cpi = ac > 0 ? ev / ac : null;
  return {
    bac: B, pv, ev, ac,
    spi: pv > 0 ? ev / pv : null,
    cpi,
    avanceReal: B > 0 ? ev / B : 0,
    avanceProy: B > 0 ? pv / B : 0,
    cv: ev - ac,
    sv: ev - pv,
    eac: cpi && cpi > 0 ? B / cpi : null,
  };
}

export interface PuntoEvm {
  semana: number;
  fecha: string; // fin de la semana
  pv: number;
  ev: number | null;
  ac: number | null;
}

/** Serie semanal acumulada PV / EV / AC desde el inicio de la línea base. */
export function serieEvm(items: EvmItem[], vals: EvmValorizacion[], gastos: EvmGasto[], hoy: string): { data: PuntoEvm[]; inicio: string | null } {
  const hojas = hojasDe(items);
  const fechas = [
    ...hojas.map((i) => d10(i.fi_proy)), ...hojas.map((i) => d10(i.fecha_inicio)),
    ...vals.map(fechaVal), ...gastos.map((g) => d10(g.fecha)),
  ].filter(Boolean) as string[];
  if (!fechas.length) return { data: [], inicio: null };
  const inicio = fechas.sort()[0];
  const finPlan = hojas.map((i) => d10(i.fe_proy)).filter(Boolean).sort().slice(-1)[0] ?? inicio;
  const ultimoReal = [...vals.map(fechaVal), ...gastos.map((g) => d10(g.fecha))].filter(Boolean).sort().slice(-1)[0] ?? inicio;
  const corteReal = [hoy, ultimoReal].sort().slice(-1)[0];
  const fin = [finPlan, corteReal].sort().slice(-1)[0];
  const semanas = Math.min(260, Math.max(1, Math.ceil((t(fin) - t(inicio) + MS_DIA) / (7 * MS_DIA))));
  const semVal = (v: EvmValorizacion) => Number(v.semana ?? v.numero) || 1;
  const semanaMaxVal = vals.reduce((m, v) => Math.max(m, semVal(v)), 0);
  const evHastaSemana = (s: number) => evA(vals.filter((v) => semVal(v) <= s));
  const semanasTot = Math.max(semanas, semanaMaxVal);
  const data: PuntoEvm[] = [{ semana: 0, fecha: inicio, pv: 0, ev: semanaMaxVal > 0 ? 0 : null, ac: 0 }];
  for (let s = 1; s <= semanasTot; s++) {
    const f = isoDe(t(inicio) + (s * 7 - 1) * MS_DIA);
    const visibleReal = t(f) - 6 * MS_DIA <= t(corteReal); // la semana ya empezó
    data.push({
      semana: s,
      fecha: f,
      pv: round2(pvA(items, f)),
      // El valor ganado se ubica en la semana de su valorización (N1 → S1…),
      // igual que la curva S de % de avance; el costo real, por fecha de pago.
      ev: s <= semanaMaxVal ? round2(evHastaSemana(s)) : null,
      ac: visibleReal ? round2(acA(gastos, f)) : null,
    });
  }
  return { data, inicio };
}

const round2 = (x: number) => Math.round(x * 100) / 100;
const norm = (s: string | null | undefined) => (s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/** Partida de nivel 1 (raíz) a la que pertenece cada ítem. */
function raizDe(items: EvmItem[]): Map<string, string> {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out = new Map<string, string>();
  items.forEach((i) => {
    let cur: EvmItem | undefined = i;
    let guard = 0;
    while (cur?.parent_id && byId.has(cur.parent_id) && guard++ < 10) cur = byId.get(cur.parent_id);
    out.set(i.id, cur?.id ?? i.id);
  });
  return out;
}

/** Ubica la partida de un gasto: por id, por código ("2.1") o por título. */
export function itemDeGasto(items: EvmItem[], g: EvmGasto): string | null {
  if (g.proyecto_item_id && items.some((i) => i.id === g.proyecto_item_id)) return g.proyecto_item_id;
  const p = norm(g.partida_ppto);
  if (!p) return null;
  const porCodigo = items.find((i) => norm(i.item_codigo) === p);
  if (porCodigo) return porCodigo.id;
  const porTitulo = items.find((i) => norm(i.titulo) === p) ?? items.find((i) => p.length >= 6 && norm(i.titulo).startsWith(p));
  return porTitulo?.id ?? null;
}

export interface FilaPartida {
  id: string;
  codigo: string;
  titulo: string;
  presupuesto: number; // costo
  ev: number;
  avance: number; // EV / presupuesto
  costoReal: number;
}

/** Avance y costo por partida de nivel 1. El costo no asignable a una partida va en "Sin partida asignada". */
export function porPartida(items: EvmItem[], vals: EvmValorizacion[], gastos: EvmGasto[], codigos?: Map<string, string>): FilaPartida[] {
  const raiz = raizDe(items);
  const raices = items.filter((i) => !i.parent_id && !i.es_hito).sort((a, b) => n(a.orden) - n(b.orden));
  const filas = new Map<string, FilaPartida>();
  raices.forEach((r, k) => filas.set(r.id, { id: r.id, codigo: codigos?.get(r.id) ?? r.item_codigo ?? `${k + 1}.0`, titulo: r.titulo, presupuesto: 0, ev: 0, avance: 0, costoReal: 0 }));
  hojasDe(items).forEach((h) => { const f = filas.get(raiz.get(h.id)!); if (f) f.presupuesto += n(h.total_costo); });
  vals.forEach((v) => (v.valorizacion_items ?? []).forEach((vi) => {
    const f = filas.get(raiz.get(vi.proyecto_item_id) ?? '');
    if (f) f.ev += n(vi.total);
  }));
  let sinPartida = 0;
  gastos.forEach((g) => {
    const it = itemDeGasto(items, g);
    const f = it ? filas.get(raiz.get(it) ?? '') : undefined;
    if (f) f.costoReal += n(g.monto); else sinPartida += n(g.monto);
  });
  const out = [...filas.values()].map((f) => ({ ...f, avance: f.presupuesto > 0 ? f.ev / f.presupuesto : 0 }));
  if (sinPartida > 0) out.push({ id: '_sin', codigo: '—', titulo: 'Sin partida asignada', presupuesto: 0, ev: 0, avance: 0, costoReal: sinPartida });
  return out;
}

export interface FilaContratista {
  id: string;
  nombre: string;
  contrato: number; // Σ costo de las partidas asignadas
  pagado: number;
  porPagar: number; // solicitudes aprobadas/programadas
  saldo: number; // contrato − pagado
}

/** Contrato, pagos y saldo por contratista (asignación de partidas en el Last Planner). */
export function porContratista(
  items: EvmItem[],
  contrapartes: { id: string; razon_social: string }[],
  pagados: EvmGasto[],
  pendientes: EvmGasto[],
): FilaContratista[] {
  const nombre = new Map(contrapartes.map((c) => [c.id, c.razon_social]));
  const porNombre = new Map(contrapartes.map((c) => [norm(c.razon_social), c.id]));
  const filas = new Map<string, FilaContratista>();
  const fila = (id: string) => {
    if (!filas.has(id)) filas.set(id, { id, nombre: nombre.get(id) ?? 'Contratista', contrato: 0, pagado: 0, porPagar: 0, saldo: 0 });
    return filas.get(id)!;
  };
  hojasDe(items).forEach((h) => { if (h.contratista_id) fila(h.contratista_id).contrato += n(h.total_costo); });
  const idDe = (g: EvmGasto) => g.contraparte_id ?? porNombre.get(norm(g.beneficiario)) ?? null;
  pagados.forEach((g) => { const id = idDe(g); if (id && (filas.has(id) || nombre.has(id))) fila(id).pagado += n(g.monto); });
  pendientes.forEach((g) => { const id = idDe(g); if (id && (filas.has(id) || nombre.has(id))) fila(id).porPagar += n(g.monto); });
  return [...filas.values()]
    .map((f) => ({ ...f, saldo: Math.max(0, f.contrato - f.pagado) }))
    .filter((f) => f.contrato > 0 || f.pagado > 0 || f.porPagar > 0)
    .sort((a, b) => b.contrato + b.pagado - (a.contrato + a.pagado));
}

/** Fechas extremas de la línea base y del cronograma real (hojas). */
export function plazos(items: EvmItem[]) {
  const h = hojasDe(items);
  const min = (xs: (string | null)[]) => (xs.filter(Boolean) as string[]).sort()[0] ?? null;
  const max = (xs: (string | null)[]) => (xs.filter(Boolean) as string[]).sort().slice(-1)[0] ?? null;
  const iniPlan = min(h.map((i) => d10(i.fi_proy)));
  const finPlan = max(h.map((i) => d10(i.fe_proy)));
  const iniReal = min(h.map((i) => d10(i.fecha_inicio)));
  const finReal = max(h.map((i) => d10(i.fecha_entrega)));
  const dias = (a: string | null, b: string | null) => (a && b ? Math.round((t(b) - t(a)) / MS_DIA) + 1 : null);
  return { iniPlan, finPlan, iniReal, finReal, durPlan: dias(iniPlan, finPlan), durReal: dias(iniReal, finReal) };
}
