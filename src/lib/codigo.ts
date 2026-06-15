// Formatea el código correlativo estándar (COT-0001, PROY-0001, SP-0001…).
export function formatCodigo(prefijo: string, correlativo: number) {
  return `${prefijo}-${String(correlativo).padStart(4, '0')}`;
}

// Nombre de archivo estandarizado (Anexo B A.9).
export function nombreArchivoCotizacion(proyecto: string, codigo: string, marca = 'AZUR') {
  const limpio = (s: string) => s.replace(/[^\p{L}\p{N} \-_]/gu, '').trim();
  return `COTIZACIÓN - ${limpio(proyecto)} - ${codigo} - ${marca}`;
}
