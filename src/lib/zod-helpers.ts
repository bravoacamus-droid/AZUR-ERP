import { z } from 'zod';

// Bug #4 (Anexo A): formData.get('campo') devuelve null si no existe → Zod
// falla en campos opcionales. Estos helpers normalizan '' y null a undefined.

export const optionalString = () =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.string().optional(),
  );

export const optionalUuid = () =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.string().uuid().optional(),
  );

export const optionalNumber = () =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number().optional(),
  );

export const requiredNumber = () =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : Number(v)),
    z.number({ invalid_type_error: 'Número requerido' }),
  );

export const optionalDate = () =>
  z.preprocess(
    (v) => (v === '' || v == null ? undefined : v),
    z.string().optional(),
  );

export const checkbox = () =>
  z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());

// Convierte un FormData a objeto plano (campos repetidos → array).
export function formToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key in obj) {
      const prev = obj[key];
      obj[key] = Array.isArray(prev) ? [...prev, value] : [prev, value];
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
