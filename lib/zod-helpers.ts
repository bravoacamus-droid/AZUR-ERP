import { z } from 'zod';

/**
 * UUID opcional resiliente al input de FormData.
 *
 * FormData.get(field) devuelve `null` si el campo no existe en el HTML,
 * o `""` si existe pero está vacío. Ambos son válidos para "sin UUID".
 *
 * Uso:  partida_id: optionalUuid()
 */
export function optionalUuid() {
  return z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.string().uuid().optional(),
  );
}

/**
 * String opcional resiliente: null/empty → undefined.
 */
export function optionalString(min?: number) {
  return z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    min !== undefined ? z.string().min(min).optional() : z.string().optional(),
  );
}

/**
 * Number coerced opcional resiliente.
 */
export function optionalNumber() {
  return z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.coerce.number().optional(),
  );
}
