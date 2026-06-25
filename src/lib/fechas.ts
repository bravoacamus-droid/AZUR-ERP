// Cálculo de fechas por días laborables según el patrón del proyecto.
export type PatronDias = 'lun_vie' | 'lun_sab' | 'lun_dom' | 'sab_dom';

export const PATRON_LABEL: Record<PatronDias, string> = {
  lun_vie: 'Lunes a viernes',
  lun_sab: 'Lunes a sábado',
  lun_dom: 'Lunes a domingo',
  sab_dom: 'Solo sábado y domingo',
};

function esLaborable(d: Date, patron: PatronDias): boolean {
  const g = d.getDay(); // 0=Dom ... 6=Sab
  if (patron === 'lun_vie') return g >= 1 && g <= 5;
  if (patron === 'lun_sab') return g >= 1 && g <= 6;
  if (patron === 'sab_dom') return g === 0 || g === 6;
  return true; // lun_dom
}

const toDate = (iso: string) => new Date(iso + 'T00:00:00');
// Componentes LOCALES (no UTC) para no correr el día al serializar.
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Fecha de entrega = inicio + (dias) días laborables (1 día = mismo día de inicio).
export function entregaDesdeDuracion(inicioISO: string, dias: number, patron: PatronDias): string | null {
  if (!inicioISO || !dias || dias < 1) return null;
  const d = toDate(inicioISO);
  // avanza hasta el primer día laborable
  while (!esLaborable(d, patron)) d.setDate(d.getDate() + 1);
  let contados = 1;
  while (contados < dias) {
    d.setDate(d.getDate() + 1);
    if (esLaborable(d, patron)) contados++;
  }
  return toISO(d);
}

// Duración (días laborables) entre inicio y entrega, ambos inclusive.
export function duracionDesdeFechas(inicioISO: string, finISO: string, patron: PatronDias): number | null {
  if (!inicioISO || !finISO) return null;
  const ini = toDate(inicioISO);
  const fin = toDate(finISO);
  if (fin < ini) return null;
  let n = 0;
  const cur = new Date(ini);
  while (cur <= fin) {
    if (esLaborable(cur, patron)) n++;
    cur.setDate(cur.getDate() + 1);
  }
  return n;
}
