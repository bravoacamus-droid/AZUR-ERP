// Firma del representante para el PDF de cotización.
// Cuando Juan envíe la firma en PNG (sin fondo), reemplazar null por el data URI:
//   export const FIRMA_DATA_URI = 'data:image/png;base64,iVBORw0KG...';
// Mientras sea null, el PDF muestra solo la línea + nombre + cargo.
export const FIRMA_DATA_URI: string | null = null;
