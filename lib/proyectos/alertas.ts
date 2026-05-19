/**
 * Motor de alertas de proyecto — funciones puras.
 * Se ejecuta en server components con los datos ya cargados.
 */

export type AlertaSeveridad = 'critica' | 'alta' | 'media' | 'info';
export type AlertaTipo =
  | 'tiempo_excedido'
  | 'tiempo_proximo'
  | 'sobrecosto'
  | 'presupuesto_cerca'
  | 'presupuesto_agotado'
  | 'sin_avance'
  | 'sin_geofence';

export type Alerta = {
  severidad: AlertaSeveridad;
  tipo: AlertaTipo;
  titulo: string;
  mensaje: string;
};

type Input = {
  estado: string;
  fechaInicio: string | null;
  fechaFinPlan: string | null;
  fechaFinReal: string | null;
  presupuestoVenta: number;
  ejecutadoVenta: number; // suma de monto_ejecutado_venta de las partidas
  gastadoReal: number;    // suma de solicitudes pagadas
  pctAvance: number;      // 0-100
  latitud: number | null;
  longitud: number | null;
};

const DAY_MS = 86400_000;

export function computeAlertasProyecto(p: Input): Alerta[] {
  const alertas: Alerta[] = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Si está cerrado o cancelado, no aplica la mayoría de alertas
  const activo = p.estado !== 'cerrado' && p.estado !== 'cancelado';

  // ----------- TIEMPO -----------
  if (activo && p.fechaFinPlan) {
    const finPlan = new Date(p.fechaFinPlan);
    finPlan.setHours(0, 0, 0, 0);
    const diasDiff = Math.round((finPlan.getTime() - hoy.getTime()) / DAY_MS);

    if (diasDiff < 0) {
      alertas.push({
        severidad: 'critica',
        tipo: 'tiempo_excedido',
        titulo: 'Cronograma excedido',
        mensaje: `La fecha fin planificada (${formatDate(p.fechaFinPlan)}) se venció hace ${Math.abs(diasDiff)} día(s). Avance actual ${p.pctAvance.toFixed(0)}%.`,
      });
    } else if (diasDiff <= 7) {
      alertas.push({
        severidad: 'alta',
        tipo: 'tiempo_proximo',
        titulo: 'Cierre próximo',
        mensaje: `Faltan ${diasDiff} día(s) para la fecha fin planificada. Avance actual ${p.pctAvance.toFixed(0)}%.`,
      });
    } else if (diasDiff <= 30 && p.pctAvance < 80) {
      alertas.push({
        severidad: 'media',
        tipo: 'tiempo_proximo',
        titulo: 'Ritmo de avance bajo',
        mensaje: `Faltan ${diasDiff} días y el avance es ${p.pctAvance.toFixed(0)}%. Revisa cronograma vs ejecutado.`,
      });
    }
  }

  // ----------- SOBRECOSTO -----------
  if (activo && p.ejecutadoVenta > 0) {
    const ratio = p.gastadoReal / p.ejecutadoVenta;
    if (ratio > 1.15) {
      alertas.push({
        severidad: 'critica',
        tipo: 'sobrecosto',
        titulo: 'Sobrecosto severo detectado',
        mensaje: `El gasto real (${formatCurrency(p.gastadoReal)}) supera en ${((ratio - 1) * 100).toFixed(0)}% al avance valorizado (${formatCurrency(p.ejecutadoVenta)}).`,
      });
    } else if (ratio > 1.05) {
      alertas.push({
        severidad: 'alta',
        tipo: 'sobrecosto',
        titulo: 'Posible sobrecosto',
        mensaje: `El gasto real (${formatCurrency(p.gastadoReal)}) supera en ${((ratio - 1) * 100).toFixed(0)}% al avance valorizado.`,
      });
    }
  }

  // ----------- PRESUPUESTO -----------
  if (activo && p.presupuestoVenta > 0) {
    const pctConsumido = (p.ejecutadoVenta / p.presupuestoVenta) * 100;
    if (pctConsumido >= 100) {
      alertas.push({
        severidad: 'critica',
        tipo: 'presupuesto_agotado',
        titulo: 'Presupuesto agotado',
        mensaje: `Se ejecutó el ${pctConsumido.toFixed(0)}% del contrato. Considera registrar adicionales si hay scope extra.`,
      });
    } else if (pctConsumido >= 90) {
      alertas.push({
        severidad: 'alta',
        tipo: 'presupuesto_cerca',
        titulo: 'Cerca del límite del contrato',
        mensaje: `Se ejecutó el ${pctConsumido.toFixed(0)}% del contrato. Quedan ${formatCurrency(p.presupuestoVenta - p.ejecutadoVenta)} por valorizar.`,
      });
    }
  }

  // ----------- SIN AVANCE -----------
  if (activo && p.fechaInicio) {
    const diasDesdeInicio = Math.round(
      (hoy.getTime() - new Date(p.fechaInicio).getTime()) / DAY_MS,
    );
    if (diasDesdeInicio >= 14 && p.pctAvance === 0) {
      alertas.push({
        severidad: 'alta',
        tipo: 'sin_avance',
        titulo: 'Sin avance reportado',
        mensaje: `Han pasado ${diasDesdeInicio} días desde el inicio y el avance valorizado es 0%. Revisa metrados ejecutados.`,
      });
    }
  }

  // ----------- GEOFENCE -----------
  if (activo && (p.latitud == null || p.longitud == null)) {
    alertas.push({
      severidad: 'info',
      tipo: 'sin_geofence',
      titulo: 'Ubicación GPS no configurada',
      mensaje:
        'Configura las coordenadas en la sección "Ubicación de obra" para validar los check-in del residente.',
    });
  }

  // Ordenar por severidad (crítica > alta > media > info)
  const order: Record<AlertaSeveridad, number> = { critica: 0, alta: 1, media: 2, info: 3 };
  return alertas.sort((a, b) => order[a.severidad] - order[b.severidad]);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCurrency(n: number): string {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
