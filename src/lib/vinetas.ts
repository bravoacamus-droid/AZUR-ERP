// Texto con viñetas explícitas: solo es viñeta la línea que empieza con un
// marcador (•, -, *, ·…). Así el usuario decide qué líneas llevan viñeta y
// puede borrarla para escribir un título o texto libre (pedido del RDO).

export const VINETA = '• ';
const MARCADOR = /^\s*[•·\-*–○◦●▪]\s+/;

export interface LineaVineta {
  vineta: boolean;
  texto: string;
}

export function esVineta(linea: string): boolean {
  return MARCADOR.test(linea);
}

/** Separa el texto en líneas no vacías, indicando cuáles son viñetas. */
export function parseVinetas(texto: string | null | undefined): LineaVineta[] {
  return (texto ?? '')
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+$/, ''))
    .filter((l) => l.trim() && l.trim() !== '•')
    .map((l) => (esVineta(l) ? { vineta: true, texto: l.replace(MARCADOR, '').trim() } : { vineta: false, texto: l.trim() }));
}
