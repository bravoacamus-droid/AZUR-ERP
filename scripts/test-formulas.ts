import { evalFormula, esFormula } from '../src/lib/formula';
import { entregaDesdeDuracion, duracionDesdeFechas } from '../src/lib/fechas';
import { armarArbol, calcularCostosMargen, calcularTotales, calcularValorizacion, dilucionAdelanto } from '../src/lib/calc';
import { fmtDate, fmtDateInput } from '../src/lib/format';

let pass = 0, fail = 0;
function eq(name: string, got: unknown, exp: unknown, tol = 0.01) {
  const ok = typeof exp === 'number' ? Math.abs((got as number) - exp) <= tol : got === exp;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  got=${got} exp=${exp}`);
  ok ? pass++ : fail++;
}

console.log('--- 1) Costo unitario tipo calculadora (evalFormula) ---');
eq('=40/1.18 (quitar IGV)', evalFormula('=40/1.18'), 33.9);
eq('40/1.18 sin =', evalFormula('40/1.18'), 33.9);
eq('4*50', evalFormula('4*50'), 200);
eq('=4*50+30', evalFormula('=4*50+30'), 230);
eq('(100+50)/2', evalFormula('(100+50)/2'), 75);
eq('1200/12', evalFormula('1200/12'), 100);
eq('50*1.18', evalFormula('50*1.18'), 59);
eq('40,5 (coma decimal)', evalFormula('40,5'), 40.5);
eq('abc -> null', evalFormula('abc'), null);
eq('vacio -> null', evalFormula(''), null);
eq('alert() -> null (seguro)', evalFormula('alert(1)'), null);
eq('esFormula(=1)', esFormula('=1'), true);
eq('esFormula(4*50)', esFormula('4*50'), true);
eq('esFormula(100)', esFormula('100'), false);

console.log('\n--- 2) Plazos: round-trip Inicio+Duracion->Entrega->Duracion ---');
const inicios = ['2026-06-15', '2026-06-13', '2026-06-01', '2026-02-26', '2026-12-31'];
const patrones = ['lun_vie', 'lun_sab', 'lun_dom', 'sab_dom'] as const;
let rtFails = 0;
for (const p of patrones) for (const ini of inicios) for (let n = 1; n <= 12; n++) {
  const ent = entregaDesdeDuracion(ini, n, p);
  const dur = duracionDesdeFechas(ini, ent!, p);
  if (dur !== n) { rtFails++; console.log(`  FALLA ${p} ${ini} n=${n} -> ent=${ent} dur=${dur}`); }
}
eq('round-trip (240 casos)', rtFails, 0);
// Ejemplo concreto L-V: lunes + 5 = viernes misma semana
eq('L-V lun 2026-06-15 + 5 dias', entregaDesdeDuracion('2026-06-15', 5, 'lun_vie'), '2026-06-19');
eq('L-V lun 2026-06-15 + 6 dias (salta finde)', entregaDesdeDuracion('2026-06-15', 6, 'lun_vie'), '2026-06-22');

console.log('\n--- 3) Adelanto y dilucion ---');
const dil = dilucionAdelanto(10000, 0.2);
eq('amortizacion 20% de 10000', dil.amortizacion, 2000);
eq('cobro neto', dil.cobroNeto, 8000);

console.log('\n--- 4) Costos / margen / totales (P.U.=C.U./(1-margen)) ---');
const items = [
  { id: 'p', parent_id: null, orden: 1, nivel: 1, titulo: 'P' },
  { id: 'a', parent_id: 'p', orden: 2, nivel: 2, titulo: 'A', cantidad: 2, costo_unitario: 100, margen_pct: 0.30 },
  { id: 'b', parent_id: 'p', orden: 3, nivel: 2, titulo: 'B', cantidad: 1, costo_unitario: 80, margen_pct: 0.20 },
];
const arbol = armarArbol(items as never);
const calc = calcularCostosMargen(arbol as never);
eq('A costo_subtotal (2*100)', calc.get('a')!.costo_subtotal, 200);
eq('A P.U. (100/0.7)', calc.get('a')!.precio_unitario, 142.857, 0.01);
eq('A subtotal c/m (PU*2)', calc.get('a')!.margen_subtotal, 285.714, 0.01);
eq('B P.U. (80/0.8)', calc.get('b')!.precio_unitario, 100);
const tot = calcularTotales(calc, arbol as never, { gg_pct: 0.05, ga_pct: 0.05, utilidad_pct: 0.10, igv_pct: 0.18, descuento_pct: 0, descuento_activo: false });
eq('subtotal (285.714+100)', tot.subtotal, 385.714, 0.01);
eq('IGV 18% sobre costo directo', tot.igv, (385.714 * 1.20) * 0.18, 0.05);

console.log('\n--- 5) Valorizacion (% <-> monto, rollup ponderado) ---');
const itemsV = [
  { id: 'p', parent_id: null, orden: 1, nivel: 1, titulo: 'P' },
  { id: 'a', parent_id: 'p', orden: 2, nivel: 2, titulo: 'A', total_costo: 1000 },
  { id: 'b', parent_id: 'p', orden: 3, nivel: 2, titulo: 'B', total_costo: 3000 },
];
const arbolV = armarArbol(itemsV as never);
const av = new Map<string, number[]>([['a', [0.5]], ['b', [0.25]]]);
const cv = calcularValorizacion(arbolV as never, av, 1);
eq('A valorizado (50% de 1000)', cv.get('a')!.valorizado_acum, 500);
eq('A saldo', cv.get('a')!.saldo, 500);
eq('P total_partida', cv.get('p')!.total_partida, 4000);
eq('P valorizado (500+750)', cv.get('p')!.valorizado_acum, 1250);
eq('P % ponderado (1250/4000)', cv.get('p')!.pct_acumulado, 0.3125, 0.0001);

console.log('\n--- 6) Base de valorizacion: factor precio = contrato/costo ---');
const factor = 5000 / 4000;
eq('factor', factor, 1.25);
eq('A 50% sobre precio (1000*0.5*1.25)', 0.5 * 1000 * factor, 625);

console.log('\n--- 7) Fechas sin -1 dia (fmtDate/fmtDateInput de fecha pura) ---');
eq('fmtDateInput("2026-06-13")', fmtDateInput('2026-06-13'), '2026-06-13');
eq('fmtDate("2026-06-13") incluye 13', /13/.test(fmtDate('2026-06-13')), true);

console.log(`\n================  RESULTADO: ${pass} PASS, ${fail} FAIL  ================`);
process.exit(fail > 0 ? 1 : 0);
