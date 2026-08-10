// Cálculo del jornal en el tareo (regla AZUR confirmada por el cliente).
// La tarifa se guarda como JORNAL SEMANAL por trabajador.
export const HORAS_SEMANA = 48;      // base de horas de la semana
export const FACTOR_EXTRA = 1.2;     // la hora extra vale 20% más

// Valor de la hora a partir del jornal semanal.
export function valorHora(jornalSemana: number): number {
  return (Number(jornalSemana) || 0) / HORAS_SEMANA;
}

// Monto de un día = jornal/48 × horas normales + jornal/48 × 1.2 × horas extra.
export function montoDia(jornalSemana: number, horas: number, horasExtra = 0): number {
  const vh = valorHora(jornalSemana);
  return vh * (Number(horas) || 0) + vh * FACTOR_EXTRA * (Number(horasExtra) || 0);
}
