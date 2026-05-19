/**
 * Helpers para describir entradas de audit_log en lenguaje humano.
 */

export type AuditRow = {
  table_name: string;
  action: string;
  new_data: Record<string, unknown> | null;
  old_data: Record<string, unknown> | null;
  diff: Record<string, { from: unknown; to: unknown }> | null;
};

/** Nombre humano singular de cada tabla auditada. */
const TABLE_NOUN: Record<string, string> = {
  proyectos: 'proyecto',
  cotizaciones: 'cotización',
  cotizacion_items: 'partida de cotización',
  solicitudes_pago: 'solicitud de pago',
  pagos: 'pago',
  caja_movimientos: 'movimiento de caja',
  cajas: 'caja',
  valorizaciones: 'valorización quincenal',
  valorizacion_items: 'metrado de valorización',
  rdos: 'parte diario (RDO)',
  rdo_items: 'detalle del parte diario',
  evidencias: 'evidencia fotográfica',
  asistencias_gps: 'check-in GPS',
  documentos_proyecto: 'documento del proyecto',
  profiles: 'usuario del sistema',
  push_subscriptions: 'suscripción de notificaciones',
  almacen_movimientos: 'movimiento de almacén',
  insumos_maestros: 'insumo del catálogo',
  adicionales_deductivos: 'adicional/deductivo',
  sst_charlas: 'charla SST',
  sst_observaciones: 'observación SST',
  sst_incidentes: 'incidente SST',
  usuario_proyectos: 'asignación de usuario a proyecto',
  proyecto_partidas: 'partida del proyecto',
  proyecto_etapas: 'etapa del proyecto',
  partidas: 'partida del catálogo',
  insumos: 'insumo',
  apus: 'análisis de precios (APU)',
};

const ACTION_VERB: Record<string, string> = {
  INSERT: 'Creó',
  UPDATE: 'Actualizó',
  DELETE: 'Eliminó',
};

/** Cambios de estado conocidos → descripción específica. */
const SOL_ESTADO: Record<string, string> = {
  'pendiente->aprobada_jefe': 'Aprobó la solicitud (jefatura)',
  'aprobada_jefe->programada': 'Programó el pago',
  'programada->pagada': 'Confirmó el pago (voucher cargado)',
  'aprobada_jefe->pagada': 'Pagó la solicitud',
  'pendiente->rechazada': 'Rechazó la solicitud',
  'pendiente->cancelada': 'Canceló la solicitud',
  'aprobada_jefe->cancelada': 'Canceló una solicitud ya aprobada',
};

const PROYECTO_ESTADO: Record<string, string> = {
  'planificado->en_ejecucion': 'Inició la ejecución del proyecto',
  'en_ejecucion->pausado': 'Pausó el proyecto',
  'pausado->en_ejecucion': 'Reanudó el proyecto',
  'en_ejecucion->cerrado': 'Cerró el proyecto',
  'planificado->cancelado': 'Canceló el proyecto',
  'en_ejecucion->cancelado': 'Canceló el proyecto en curso',
};

const COTIZACION_ESTADO: Record<string, string> = {
  'borrador->enviada': 'Envió la cotización al cliente',
  'enviada->en_negociacion': 'Pasó cotización a negociación',
  'en_negociacion->aprobada': 'Aprobó la cotización (genera proyecto)',
  'enviada->aprobada': 'Aprobó la cotización (genera proyecto)',
  'borrador->aprobada': 'Aprobó la cotización (genera proyecto)',
  'enviada->rechazada': 'Cliente rechazó la cotización',
  'en_negociacion->rechazada': 'Cliente rechazó la cotización',
};

const VALORIZACION_ESTADO: Record<string, string> = {
  'borrador->presentada': 'Presentó la valorización',
  'presentada->aprobada': 'Aprobó la valorización',
  'aprobada->pagada': 'Cobró la valorización',
  'presentada->rechazada': 'Rechazó la valorización',
};

function getStr(o: Record<string, unknown> | null | undefined, k: string): string | null {
  if (!o) return null;
  const v = o[k];
  return typeof v === 'string' ? v : null;
}

/** Identificador legible del registro (código, título, nombre o concepto). */
export function getRecordLabel(r: AuditRow): string | null {
  const data = r.new_data ?? r.old_data;
  return (
    getStr(data, 'codigo') ??
    getStr(data, 'titulo') ??
    getStr(data, 'nombre') ??
    getStr(data, 'concepto') ??
    null
  );
}

/** Devuelve una descripción humana de la acción. */
export function describeAudit(r: AuditRow): string {
  const noun = TABLE_NOUN[r.table_name] ?? r.table_name.replace(/_/g, ' ');
  const verb = ACTION_VERB[r.action] ?? r.action;
  const label = getRecordLabel(r);

  // Cambios de estado conocidos
  if (r.action === 'UPDATE' && r.diff) {
    const estadoChange = r.diff.estado as { from?: string; to?: string } | undefined;
    if (estadoChange?.from != null && estadoChange?.to != null) {
      const key = `${estadoChange.from}->${estadoChange.to}`;
      let txt: string | null = null;
      if (r.table_name === 'solicitudes_pago') txt = SOL_ESTADO[key] ?? null;
      else if (r.table_name === 'proyectos') txt = PROYECTO_ESTADO[key] ?? null;
      else if (r.table_name === 'cotizaciones') txt = COTIZACION_ESTADO[key] ?? null;
      else if (r.table_name === 'valorizaciones') txt = VALORIZACION_ESTADO[key] ?? null;
      if (txt) return label ? `${txt} (${label})` : txt;
      // Estado cambió pero no está mapeado
      return `Cambió estado de ${noun}: ${estadoChange.from} → ${estadoChange.to}${label ? ` (${label})` : ''}`;
    }
  }

  // Casos especiales por tabla
  if (r.action === 'INSERT' && r.table_name === 'pagos') {
    return `Programó un pago${label ? ` (${label})` : ''}`;
  }
  if (r.action === 'UPDATE' && r.table_name === 'pagos' && r.diff?.voucher_path) {
    return `Subió voucher del pago${label ? ` (${label})` : ''}`;
  }
  if (r.action === 'INSERT' && r.table_name === 'caja_movimientos') {
    const data = r.new_data as Record<string, unknown> | null;
    const tipo = getStr(data, 'tipo');
    const monto = data?.monto;
    const montoFmt = typeof monto === 'number' || typeof monto === 'string'
      ? ` por S/ ${Number(monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
      : '';
    const tipoLabel = tipo === 'ingreso' ? 'Ingreso' : tipo === 'egreso' ? 'Egreso' : tipo === 'traslado' ? 'Traslado' : 'Movimiento';
    return `${tipoLabel} de caja${montoFmt}`;
  }
  if (r.action === 'INSERT' && r.table_name === 'asistencias_gps') {
    return `Registró check-in GPS en obra`;
  }
  if (r.action === 'INSERT' && r.table_name === 'rdos') {
    return `Registró parte diario (RDO)`;
  }
  if (r.action === 'INSERT' && r.table_name === 'evidencias') {
    return `Subió evidencia fotográfica`;
  }
  if (r.action === 'INSERT' && r.table_name === 'documentos_proyecto') {
    return `Subió documento${label ? `: ${label}` : ''}`;
  }
  if (r.action === 'INSERT' && r.table_name === 'solicitudes_pago') {
    const data = r.new_data as Record<string, unknown> | null;
    const monto = data?.monto;
    const moneda = getStr(data, 'moneda') ?? 'PEN';
    const montoFmt = typeof monto === 'number' || typeof monto === 'string'
      ? ` por ${moneda} ${Number(monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
      : '';
    return `Creó solicitud de pago${montoFmt}${label ? ` — ${label}` : ''}`;
  }

  // Fallback genérico
  return `${verb} ${noun}${label ? ` "${label}"` : ''}`;
}
