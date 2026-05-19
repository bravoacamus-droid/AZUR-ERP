'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { optionalString } from '@/lib/zod-helpers';

const ROLES_PUEDEN_GESTIONAR = [
  'gerencia_general',
  'jefe_presupuestos',
  'comercial',
  'administrador',
] as const;

const clienteSchema = z.object({
  razon_social: z.string().min(3, 'La razón social es obligatoria (mín. 3 caracteres)'),
  nombre_comercial: optionalString(),
  ruc: optionalString().refine(
    (v) => !v || /^\d{11}$/.test(v),
    'El RUC debe tener 11 dígitos',
  ),
  contacto: optionalString(),
  email: optionalString().refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    'Email inválido',
  ),
  telefono: optionalString(),
  direccion: optionalString(),
  notas: optionalString(),
});

export type ClienteState = {
  ok: boolean;
  error?: string;
  cliente?: { id: string; razon_social: string; ruc: string | null };
};

export async function crearCliente(
  _prev: ClienteState,
  formData: FormData,
): Promise<ClienteState> {
  const session = await requireSession();
  if (!ROLES_PUEDEN_GESTIONAR.includes(session.rol as (typeof ROLES_PUEDEN_GESTIONAR)[number])) {
    return { ok: false, error: 'No tienes permisos para crear clientes' };
  }

  const parsed = clienteSchema.safeParse({
    razon_social: formData.get('razon_social'),
    nombre_comercial: formData.get('nombre_comercial'),
    ruc: formData.get('ruc'),
    contacto: formData.get('contacto'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    notas: formData.get('notas'),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = createClient();

  // Verificar RUC duplicado
  if (parsed.data.ruc) {
    const { data: existing } = await supabase
      .from('clientes')
      .select('id, razon_social')
      .eq('ruc', parsed.data.ruc)
      .maybeSingle();
    if (existing) {
      return {
        ok: false,
        error: `Ya existe un cliente con RUC ${parsed.data.ruc}: ${existing.razon_social}`,
      };
    }
  }

  const { data, error } = await supabase
    .from('clientes')
    .insert({
      razon_social: parsed.data.razon_social,
      nombre_comercial: parsed.data.nombre_comercial || null,
      ruc: parsed.data.ruc || null,
      contacto: parsed.data.contacto || null,
      email: parsed.data.email || null,
      telefono: parsed.data.telefono || null,
      direccion: parsed.data.direccion || null,
      notas: parsed.data.notas || null,
    })
    .select('id, razon_social, ruc')
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? 'No se pudo crear el cliente' };
  }

  revalidatePath('/clientes');
  revalidatePath('/comercial/cotizaciones/nueva');
  revalidatePath('/comercial/cotizaciones');

  return { ok: true, cliente: { id: data.id, razon_social: data.razon_social, ruc: data.ruc } };
}

const updateSchema = clienteSchema.extend({ id: z.string().uuid() });

export async function actualizarCliente(formData: FormData) {
  const session = await requireSession();
  if (!ROLES_PUEDEN_GESTIONAR.includes(session.rol as (typeof ROLES_PUEDEN_GESTIONAR)[number])) {
    throw new Error('No tienes permisos para editar clientes');
  }

  const parsed = updateSchema.safeParse({
    id: formData.get('id'),
    razon_social: formData.get('razon_social'),
    nombre_comercial: formData.get('nombre_comercial'),
    ruc: formData.get('ruc'),
    contacto: formData.get('contacto'),
    email: formData.get('email'),
    telefono: formData.get('telefono'),
    direccion: formData.get('direccion'),
    notas: formData.get('notas'),
  });
  if (!parsed.success) throw new Error(parsed.error.errors[0]?.message ?? 'Datos inválidos');

  const supabase = createClient();
  const { error } = await supabase
    .from('clientes')
    .update({
      razon_social: parsed.data.razon_social,
      nombre_comercial: parsed.data.nombre_comercial || null,
      ruc: parsed.data.ruc || null,
      contacto: parsed.data.contacto || null,
      email: parsed.data.email || null,
      telefono: parsed.data.telefono || null,
      direccion: parsed.data.direccion || null,
      notas: parsed.data.notas || null,
    })
    .eq('id', parsed.data.id);

  if (error) throw new Error(error.message);

  revalidatePath('/clientes');
  revalidatePath('/comercial/cotizaciones');
}

export async function toggleActivoCliente(formData: FormData) {
  const session = await requireSession();
  if (!ROLES_PUEDEN_GESTIONAR.includes(session.rol as (typeof ROLES_PUEDEN_GESTIONAR)[number])) {
    throw new Error('Sin permisos');
  }
  const id = formData.get('id') as string;
  const activo = formData.get('activo') === 'true';
  if (!id) throw new Error('ID requerido');

  const supabase = createClient();
  const { error } = await supabase.from('clientes').update({ activo: !activo }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/clientes');
}
