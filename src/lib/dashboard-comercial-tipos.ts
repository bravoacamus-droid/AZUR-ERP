import type { EstadoComercial } from '@/lib/estado-comercial';

export interface CotizacionDash {
  id: string;
  codigo: string;
  proyecto: string;
  cliente: string;
  fecha: string;
  estado: EstadoComercial;
  moneda: 'PEN' | 'USD';
  importe: number; // total con descuento, en la moneda de la cotización
  linea_id: string | null;
  linea: string;
  servicio_id: string | null;
  servicio: string;
}

export interface DashComercial {
  cotizaciones: CotizacionDash[];
  lineas: { id: string; nombre: string }[];
}
