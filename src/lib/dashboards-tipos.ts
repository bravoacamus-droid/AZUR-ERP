// Tipos y constantes de los dashboards, sin dependencias de servidor
// (los importan los componentes de cliente).
import type { FilaPartida, FilaContratista, PuntoEvm } from '@/lib/evm';

export type Tramo = 'b0' | 'b16' | 'b31' | 'b61';
export const TRAMOS: { k: Tramo; label: string }[] = [
  { k: 'b0', label: '0–15 d' }, { k: 'b16', label: '16–30 d' }, { k: 'b31', label: '31–60 d' }, { k: 'b61', label: '+60 d' },
];
export type Antiguedad = Record<Tramo, number>;

export interface DashProyecto {
  id: string;
  codigo: string;
  nombre: string;
  etiqueta: string; // corto para los ejes
  estado: string;
  linea_id: string | null;
  contrato: number;
  contratoAjustado: number;
  cobrado: number;
  // costos / avance (a costo)
  bac: number; pv: number; ev: number; ac: number;
  spi: number | null; cpi: number | null;
  avanceReal: number; avanceProy: number;
  costoComercial: number | null; // costo directo sin margen de la cotización
  // utilidad (como la Liquidación)
  utilProy: number; utilProyPct: number; utilReal: number; utilRealPct: number;
  // plazos (días calendario)
  plazoComercial: number | null; durPlan: number | null; durReal: number | null;
  iniPlan: string | null; finPlan: string | null; iniReal: string | null; finReal: string | null;
  retrasoDias: number | null; costoRetraso: number | null;
  // detalle para el dashboard del Jefe de Proyectos
  partidas: FilaPartida[];
  contratistas: FilaContratista[];
  porPagarContratistas: number;
  serie: PuntoEvm[];
}

export interface DashData {
  hoy: string;
  proyectos: DashProyecto[];
  cxc: { proyecto_id: string; etiqueta: string; tramos: Antiguedad; total: number }[];
  cxp: { proyecto_id: string | null; etiqueta: string; tramos: Antiguedad; total: number }[];
  flujo: { fecha: string; tipo: 'ingreso' | 'egreso'; monto: number; proyecto_id: string | null }[];
  ventas: { fecha: string; proyecto_id: string; linea_id: string | null; servicio_id: string | null; venta: number; costo: number }[];
  cac: {
    canales: { id: string; nombre: string }[];
    inversiones: { canal_id: string; mes: string; monto: number }[];
    cotizaciones: { canal_id: string | null; fecha: string; estado: string; cliente_id: string | null }[];
  };
  lineas: { id: string; nombre: string; codigo: string }[];
  servicios: { id: string; nombre: string }[];
  finanzas: {
    saldoCajas: number;
    porPagar: number; porPagarVencido: number;
    porCobrar: number; porCobrar60: number;
    porFacturar: number; armadasVencidas: number;
    caja30: number; liquidez: number | null;
  };
}

