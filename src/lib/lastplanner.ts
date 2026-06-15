// Automatización de ESTADO DE TAREA y PRIORIDAD (Anexo B.4 / B.5).
// Proyectado proporcional por semanas; real = % acumulado valorizado.

export type EstadoTarea =
  | 'completado' | 'en_progreso' | 'detenido' | 'en_espera' | 'pendiente' | 'retrasado' | 'cancelado';
export type Prioridad = 'muy_baja' | 'baja' | 'media' | 'alta' | 'muy_alta';

export function semanasEntre(inicio?: string | null, fin?: string | null, duracionDias?: number | null): number {
  if (duracionDias && duracionDias > 0) return Math.max(1, Math.ceil(duracionDias / 7));
  if (inicio && fin) {
    const ms = new Date(fin).getTime() - new Date(inicio).getTime();
    return Math.max(1, Math.ceil(ms / (7 * 24 * 3600 * 1000)));
  }
  return 1;
}

// Avance proyectado acumulado para la semana s (1..n) — reparto proporcional.
export function proyectadoSemana(semana: number, numSemanas: number): number {
  if (numSemanas <= 0) return 0;
  return Math.min(1, semana / numSemanas);
}

// PRIORIDAD comparando real vs proyectado de la semana (regla base de Juan,
// con umbrales; mejora propuesta por Promptive = parametrizable).
export function calcPrioridad(
  realAcum: number,
  proyectadoAcum: number,
  opts?: { umbralCritico?: number; holgura?: number },
): Prioridad {
  const umbralCritico = opts?.umbralCritico ?? 0.5; // < 50% de lo proyectado
  const holgura = opts?.holgura ?? 1.2;
  if (proyectadoAcum <= 0) return 'media';
  const r = realAcum / proyectadoAcum;
  if (r < umbralCritico) return 'muy_alta';
  if (r < 1 - 1e-6) return 'alta';
  if (Math.abs(r - 1) <= 1e-6) return 'media';
  return r >= holgura ? 'muy_baja' : 'baja';
}

// ESTADO DE TAREA (condicional tipo Excel).
export function calcEstado(p: {
  pctAcum: number;
  avanceUltimaSemana: number; // % agregado en la última valorización
  fechaInicio?: string | null;
  fechaEntrega?: string | null;
  override?: EstadoTarea | null;
  hoy?: Date;
}): EstadoTarea {
  if (p.override) return p.override;
  const hoy = p.hoy ?? new Date();
  if (p.pctAcum >= 1 - 1e-6) return 'completado';
  if (!p.fechaInicio) return 'pendiente';
  const inicio = new Date(p.fechaInicio);
  if (inicio.getTime() > hoy.getTime() && p.pctAcum <= 0) return 'en_espera';
  if (p.fechaEntrega) {
    const fin = new Date(p.fechaEntrega);
    if (fin.getTime() < hoy.getTime() && p.pctAcum < 1 - 1e-6) return 'retrasado';
  }
  if (p.avanceUltimaSemana > 0) return 'en_progreso';
  return 'detenido';
}
