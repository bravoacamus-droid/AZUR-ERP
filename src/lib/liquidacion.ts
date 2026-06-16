// Liquidación de obra (Sec. 4.6) y saldo del adelanto (Anexo B.9).

export interface LiquidacionInput {
  contrato: number;          // precio cliente (total con descuento)
  adelantoPct: number;       // % de adelanto
  amortizadoAdelanto: number; // Σ amortizaciones de las valorizaciones
  valorizado: number;        // Σ valorizado al cliente
  cobrado: number;           // Σ abonos del cliente
  gastado: number;           // Σ egresos (solicitudes pagadas/conciliadas)
  costoPresupuestado: number; // Σ costo de las partidas (presupuesto interno)
  adicionales: number;       // adicionales aprobados
  deductivos: number;        // deductivos aprobados
}

export interface LiquidacionResult {
  adelantoInicial: number;
  adelantoSaldo: number;     // baja hasta 0
  contratoAjustado: number;  // contrato + adicionales − deductivos
  porCobrar: number;         // contrato ajustado − cobrado
  utilidadReal: number;      // cobrado − gastado (caja)
  utilidadDevengada: number; // valorizado − gastado
  margenPresupuesto: number; // contrato ajustado − costo presupuestado
  margenPct: number;         // margen / contrato ajustado
}

export function calcularLiquidacion(i: LiquidacionInput): LiquidacionResult {
  const adelantoInicial = i.contrato * i.adelantoPct;
  const adelantoSaldo = Math.max(0, adelantoInicial - i.amortizadoAdelanto);
  const contratoAjustado = i.contrato + i.adicionales - i.deductivos;
  const margenPresupuesto = contratoAjustado - i.costoPresupuestado;
  return {
    adelantoInicial,
    adelantoSaldo,
    contratoAjustado,
    porCobrar: contratoAjustado - i.cobrado,
    utilidadReal: i.cobrado - i.gastado,
    utilidadDevengada: i.valorizado - i.gastado,
    margenPresupuesto,
    margenPct: contratoAjustado > 0 ? margenPresupuesto / contratoAjustado : 0,
  };
}
