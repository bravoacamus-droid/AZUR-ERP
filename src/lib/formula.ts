// Evalúa fórmulas aritméticas simples para el costo unitario (estilo Excel).
// Solo permite dígitos, + - * / ( ) . y espacios. Devuelve el número o null.
// Acepta que el usuario escriba con o sin '=' al inicio (ej. "=40/1.18" o "4*50").
export function evalFormula(expr: string): number | null {
  if (expr == null) return null;
  let s = String(expr).trim();
  if (s === '') return null;
  if (s.startsWith('=')) s = s.slice(1);
  s = s.replace(/,/g, '.'); // coma decimal → punto
  if (!/^[0-9+\-*/().\s]+$/.test(s)) return null; // caracteres no permitidos
  if (/[+\-*/.]{2,}/.test(s.replace(/\s/g, '')) && !/\(\(/.test(s)) {
    // evita operadores duplicados accidentales, pero permitimos paréntesis
  }
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${s});`)();
    if (typeof val !== 'number' || !isFinite(val)) return null;
    return Math.round(val * 100) / 100;
  } catch {
    return null;
  }
}

// ¿El texto parece una fórmula (tiene operador o '=')?
export function esFormula(expr: string): boolean {
  if (!expr) return false;
  const s = String(expr).trim();
  return s.startsWith('=') || /[+\-*/()]/.test(s.replace(/^-/, ''));
}
