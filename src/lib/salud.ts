// Reglas de salud del documento maestro (Sección 4.3 / 6.1 / 7.1).

export interface DashboardProyecto {
  proyecto_id: string;
  codigo: string | null;
  nombre: string;
  linea_id: string | null;
  estado: string;
  tipo_proyecto: string;
  proyectado: number;
  pagos: number;
  gasto: number;
  valorizado: number;
}

export type Salud = 'ok' | 'advertencia' | 'critica';

// Regla #1: Gasto ≤ Pagos ≤ Proyectado (liquidez / cobro vs desembolso).
export function saludRegla1(p: { proyectado: number; pagos: number; gasto: number }): Salud {
  if (p.gasto > p.pagos) return 'critica'; // se gastó más de lo cobrado
  if (p.proyectado > 0 && p.pagos / p.proyectado < 0.05) return 'advertencia';
  return 'ok';
}

// Regla #2: Gasto real ≤ Valorizado (consumo vs avance / rentabilidad).
export function saludRegla2(p: { gasto: number; valorizado: number }): Salud {
  if (p.valorizado <= 0) return p.gasto > 0 ? 'advertencia' : 'ok';
  if (p.gasto > p.valorizado) return 'critica'; // consume más rápido que el avance
  if (p.gasto / p.valorizado > 0.9) return 'advertencia';
  return 'ok';
}

export function saludGlobal(p: DashboardProyecto): Salud {
  const r1 = saludRegla1(p);
  const r2 = saludRegla2(p);
  if (r1 === 'critica' || r2 === 'critica') return 'critica';
  if (r1 === 'advertencia' || r2 === 'advertencia') return 'advertencia';
  return 'ok';
}

export const SALUD_COLOR: Record<Salud, string> = {
  ok: '#10b981',
  advertencia: '#f59e0b',
  critica: '#E20627',
};

export const SALUD_LABEL: Record<Salud, string> = {
  ok: 'Saludable',
  advertencia: 'En observación',
  critica: 'Crítico',
};
