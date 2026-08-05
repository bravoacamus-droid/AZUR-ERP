'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth';
import { formatCodigo } from '@/lib/codigo';
import { notifyRoles } from '@/lib/push/notify';

const schema = z.object({
  tipo: z.enum(['contratistas', 'proveedores', 'caja_chica', 'servicios', 'honorarios']),
  proyecto_id: z.string().uuid().nullable(),
  partida_ppto: z.string().trim().nullable(),
  beneficiario_nombre: z.string().trim().nullable(),
  especialidad: z.string().trim().nullable(),
  categoria_etapa: z.string().trim().nullable(),
  categoria: z.string().trim().nullable().optional(),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  constancia: z.enum(['factura', 'boleta', 'rhe', 'evidencia']).nullable(),
  sustento_url: z.string().trim().nullable().optional(),
  descripcion: z.string().trim().nullable(),
  cta_bancaria: z.string().trim().nullable(),
  ruc_dni: z.string().trim().nullable(),
  razon_social: z.string().trim().nullable(),
  contraparte_id: z.string().uuid().nullable().optional(),
  num_comprobante: z.string().trim().nullable().optional(),
  moneda: z.enum(['PEN', 'USD']).optional(),
  detraccion_monto: z.coerce.number().optional().nullable(),
});

export type SolicitudInput = z.infer<typeof schema>;
type Res = { ok: boolean; error?: string };

// Alta de proveedor por el residente: queda como solicitud a validar por el
// administrador (validado=false); recién validado aparece en el maestro.
const provSchema = z.object({
  razon_social: z.string().trim().min(2, 'Razón social requerida'),
  ruc_dni: z.string().trim().nullable().optional(),
  especialidad: z.string().trim().nullable().optional(),
  banco: z.string().trim().nullable().optional(),
  cuenta: z.string().trim().nullable().optional(),
  cci: z.string().trim().nullable().optional(),
  telefono: z.string().trim().nullable().optional(),
});

export async function registrarProveedor(input: z.input<typeof provSchema>): Promise<Res> {
  const session = await requireSession();
  const parsed = provSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  const d = parsed.data;
  const supabase = createClient() as any;
  const { error } = await supabase.from('contrapartes').insert({
    razon_social: d.razon_social, tipo: 'proveedor', ruc_dni: d.ruc_dni || null,
    especialidad: d.especialidad || null, banco: d.banco || null, cuenta: d.cuenta || null,
    cci: d.cci || null, telefono: d.telefono || null, validado: false, created_by: session.id,
  });
  if (error) return { ok: false, error: error.message };
  await notifyRoles(['administrador', 'gerencia'], {
    title: 'Proveedor por validar', body: `${session.nombre} registró a ${d.razon_social}`, url: '/finanzas', tag: 'proveedor',
  }, 'campo');
  revalidatePath('/campo/solicitudes');
  return { ok: true };
}

export async function crearSolicitud(input: SolicitudInput): Promise<Res> {
  const session = await requireSession();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;
  const supabase = createClient() as any; // columnas recientes (categoria) aún no tipadas

  // heredar línea de negocio del proyecto
  let linea_id: string | null = null;
  if (d.proyecto_id) {
    const admin = createAdminClient();
    const { data: proy } = await admin
      .from('proyectos')
      .select('linea_id')
      .eq('id', d.proyecto_id)
      .single();
    linea_id = proy?.linea_id ?? null;
  }

  const { data: sol, error } = await supabase
    .from('solicitudes_pago')
    .insert({
      tipo: d.tipo,
      proyecto_id: d.proyecto_id,
      partida_ppto: d.partida_ppto || null,
      beneficiario_nombre: d.beneficiario_nombre || null,
      especialidad: d.especialidad || null,
      categoria_etapa: d.categoria_etapa || null,
      categoria: d.categoria || null,
      monto: d.monto,
      constancia: d.constancia as never, // 'evidencia' aún no está en los tipos generados
      sustento_url: d.sustento_url || null,
      descripcion: d.descripcion || null,
      cta_bancaria: d.cta_bancaria || null,
      ruc_dni: d.ruc_dni || null,
      razon_social: d.razon_social || null,
      contraparte_id: d.contraparte_id || null,
      num_comprobante: d.num_comprobante || null,
      moneda: d.moneda ?? 'PEN',
      detraccion_monto: d.detraccion_monto ?? 0,
      linea_id,
      solicitado_por: session.id,
      status: 'solicitada',
    })
    .select('id, correlativo')
    .single();

  if (error || !sol) return { ok: false, error: error?.message ?? 'No se pudo crear la solicitud' };

  const codigo = formatCodigo('SP', sol.correlativo);
  await supabase.from('solicitudes_pago').update({ codigo }).eq('id', sol.id);

  await notifyRoles(
    ['jefe_proyectos', 'gerencia'],
    {
      title: 'Nueva solicitud de pago',
      body: `${codigo} · ${d.beneficiario_nombre ?? 'Sin beneficiario'} por S/ ${d.monto.toFixed(2)}`,
      url: '/finanzas',
      tag: `sp-${sol.id}`,
    },
    'campo',
  );

  revalidatePath('/campo/solicitudes');
  return { ok: true };
}
