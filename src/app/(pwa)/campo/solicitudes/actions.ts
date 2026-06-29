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
  monto: z.number().positive('El monto debe ser mayor a 0'),
  constancia: z.enum(['factura', 'boleta', 'rhe']).nullable(),
  descripcion: z.string().trim().nullable(),
  cta_bancaria: z.string().trim().nullable(),
  ruc_dni: z.string().trim().nullable(),
  razon_social: z.string().trim().nullable(),
  num_comprobante: z.string().trim().nullable().optional(),
  moneda: z.enum(['PEN', 'USD']).optional(),
  detraccion_monto: z.coerce.number().optional().nullable(),
});

export type SolicitudInput = z.infer<typeof schema>;
type Res = { ok: boolean; error?: string };

export async function crearSolicitud(input: SolicitudInput): Promise<Res> {
  const session = await requireSession();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? 'Datos inválidos' };
  }
  const d = parsed.data;
  const supabase = createClient();

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
      monto: d.monto,
      constancia: d.constancia,
      descripcion: d.descripcion || null,
      cta_bancaria: d.cta_bancaria || null,
      ruc_dni: d.ruc_dni || null,
      razon_social: d.razon_social || null,
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
