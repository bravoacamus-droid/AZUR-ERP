'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth';
import { formatCodigo } from '@/lib/codigo';
import { notifyRoles } from '@/lib/push/notify';
import { ROLES_VEN_MARGEN } from '@/lib/roles';
import { armarArbol, calcularCostosMargen, calcularTotales } from '@/lib/calc';

type Res = { ok: boolean; error?: string; id?: string };

async function guard() {
  const session = await requireSession();
  if (!ROLES_VEN_MARGEN.includes(session.rol))
    throw new Error('Sin permiso para el módulo Comercial');
  return session;
}

// ── Crear cotización ────────────────────────────────────────────────────
const crearSchema = z.object({
  linea_id: z.string().uuid(),
  cliente_id: z.string().uuid(),
  proyecto_nombre: z.string().min(2),
  asunto: z.string().optional(),
  ubicacion: z.string().optional(),
  tipo_cotizacion: z.enum(['unica', 'programada', 'recurrencia']),
  tipo_proyecto: z.enum(['grande', 'chico']),
  origen: z.enum(['directo', 'recomendacion', 'oficina', 'llamada']).optional(),
  vigencia_dias: z.coerce.number().optional(),
  plantilla_id: z.string().uuid().optional().or(z.literal('')),
});

export async function crearCotizacion(input: z.input<typeof crearSchema>): Promise<Res> {
  const session = await guard();
  const parsed = crearSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Datos incompletos' };
  const d = parsed.data;

  const supabase = createClient();

  // condiciones precargadas desde la plantilla elegida
  let cond = {};
  if (d.plantilla_id) {
    const { data: pl } = await supabase
      .from('plantillas_cotizacion')
      .select('condiciones, servicios_incluidos, servicios_omitidos, garantia')
      .eq('id', d.plantilla_id)
      .single();
    if (pl) cond = pl;
  }

  const { data, error } = await supabase
    .from('cotizaciones')
    .insert({
      linea_id: d.linea_id,
      cliente_id: d.cliente_id,
      proyecto_nombre: d.proyecto_nombre,
      asunto: d.asunto,
      ubicacion: d.ubicacion,
      tipo_cotizacion: d.tipo_cotizacion,
      tipo_proyecto: d.tipo_proyecto,
      origen: d.origen,
      vigencia_dias: d.vigencia_dias ?? 7,
      plantilla_id: d.plantilla_id || null,
      responsable_id: session.id,
      ...cond,
    })
    .select('id, correlativo')
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? 'Error al crear' };

  await supabase
    .from('cotizaciones')
    .update({ codigo: formatCodigo('COT', data.correlativo) })
    .eq('id', data.id);

  revalidatePath('/comercial');
  return { ok: true, id: data.id };
}

// ── Cabecera / parámetros ───────────────────────────────────────────────
export async function guardarCabecera(id: string, patch: Record<string, unknown>): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { error } = await supabase.from('cotizaciones').update(patch as never).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/comercial/${id}`);
  return { ok: true };
}

// ── Ítems del árbol ─────────────────────────────────────────────────────
export async function agregarItem(
  cotizacionId: string,
  parentId: string | null,
  nivel: number,
  prefill?: { titulo?: string; unidad?: string | null; costo_unitario?: number | null; catalogoPartidaId?: string },
): Promise<Res> {
  await guard();
  const supabase = createClient();
  const admin = createAdminClient();
  // el padre deja de ser hoja
  if (parentId) await supabase.from('cotizacion_items').update({ es_hoja: false }).eq('id', parentId);

  let q = supabase
    .from('cotizacion_items')
    .select('id', { count: 'exact', head: true })
    .eq('cotizacion_id', cotizacionId);
  q = parentId ? q.eq('parent_id', parentId) : q.is('parent_id', null);
  const { count } = await q;

  const tituloDefault = nivel === 1 ? 'Nueva partida' : nivel === 2 ? 'Nueva sub partida' : nivel === 3 ? 'Nueva actividad' : 'Nueva sub actividad';
  const { data: nuevo, error } = await supabase.from('cotizacion_items').insert({
    cotizacion_id: cotizacionId,
    parent_id: parentId,
    nivel,
    orden: (count ?? 0) + 1,
    titulo: prefill?.titulo || tituloDefault,
    unidad: prefill?.unidad ?? null,
    costo_unitario: prefill?.costo_unitario ?? null,
    cantidad: prefill?.costo_unitario != null ? 1 : null,
    es_hoja: true,
    margen_pct: 0.3,
  }).select('id').single();
  if (error || !nuevo) return { ok: false, error: error?.message ?? 'Error' };

  // Si la partida del catálogo tiene APU plantilla, copiarlo al nuevo ítem
  if (prefill?.catalogoPartidaId) {
    const { data: tpl } = await admin.from('catalogo_apu').select('*').eq('catalogo_partida_id', prefill.catalogoPartidaId).order('orden');
    if (tpl && tpl.length) {
      await admin.from('apu_componentes').insert(tpl.map((t) => ({
        cotizacion_item_id: nuevo.id, tipo: t.tipo, descripcion: t.descripcion, unidad: t.unidad,
        cuadrilla: t.cuadrilla, rendimiento: t.rendimiento, cantidad: t.cantidad, precio: t.precio, orden: t.orden,
      })));
      const cu = tpl.reduce((a, t) => a + Number(t.cantidad) * Number(t.precio), 0);
      await admin.from('cotizacion_items').update({ costo_unitario: cu, tiene_apu: true }).eq('id', nuevo.id);
    }
  }

  revalidatePath(`/comercial/${cotizacionId}`);
  return { ok: true };
}

export async function actualizarItem(
  cotizacionId: string,
  itemId: string,
  patch: Record<string, unknown>,
): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { error } = await supabase.from('cotizacion_items').update(patch as never).eq('id', itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/comercial/${cotizacionId}`);
  return { ok: true };
}

export async function eliminarItem(cotizacionId: string, itemId: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { data: item } = await supabase
    .from('cotizacion_items')
    .select('parent_id')
    .eq('id', itemId)
    .single();
  await supabase.from('cotizacion_items').delete().eq('id', itemId);
  // si el padre se quedó sin hijos, vuelve a ser hoja
  if (item?.parent_id) {
    const { count } = await supabase
      .from('cotizacion_items')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', item.parent_id);
    if (!count) await supabase.from('cotizacion_items').update({ es_hoja: true }).eq('id', item.parent_id);
  }
  revalidatePath(`/comercial/${cotizacionId}`);
  return { ok: true };
}

// ── APU detallado (desglose del costo unitario) ─────────────────────────
async function recalcularApu(itemId: string) {
  const admin = createAdminClient();
  const { data: comps } = await admin.from('apu_componentes').select('cantidad, precio').eq('cotizacion_item_id', itemId);
  const cu = (comps ?? []).reduce((a, c) => a + Number(c.cantidad) * Number(c.precio), 0);
  const tiene = (comps ?? []).length > 0;
  await admin.from('cotizacion_items').update({ costo_unitario: tiene ? cu : undefined, tiene_apu: tiene }).eq('id', itemId);
}

export async function guardarComponenteApu(
  cotizacionId: string,
  itemId: string,
  comp: { id?: string; tipo: string; descripcion: string; unidad?: string; cuadrilla?: number; rendimiento?: number; cantidad: number; precio: number },
): Promise<Res> {
  await guard();
  const supabase = createClient();
  const payload = {
    cotizacion_item_id: itemId, tipo: comp.tipo as never, descripcion: comp.descripcion,
    unidad: comp.unidad || null, cuadrilla: comp.cuadrilla ?? null, rendimiento: comp.rendimiento ?? null,
    cantidad: comp.cantidad, precio: comp.precio,
  };
  if (comp.id) {
    const { error } = await supabase.from('apu_componentes').update(payload).eq('id', comp.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from('apu_componentes').insert(payload);
    if (error) return { ok: false, error: error.message };
  }
  await recalcularApu(itemId);
  revalidatePath(`/comercial/${cotizacionId}`);
  return { ok: true };
}

export async function eliminarComponenteApu(cotizacionId: string, itemId: string, compId: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  await supabase.from('apu_componentes').delete().eq('id', compId);
  await recalcularApu(itemId);
  revalidatePath(`/comercial/${cotizacionId}`);
  return { ok: true };
}

// ── Formas de pago ──────────────────────────────────────────────────────
export async function guardarFormasPago(
  cotizacionId: string,
  formas: { concepto: string; porcentaje: number; es_adelanto: boolean }[],
): Promise<Res> {
  await guard();
  const supabase = createClient();
  const suma = formas.reduce((a, f) => a + f.porcentaje, 0);
  if (suma > 1.0001) return { ok: false, error: 'La suma de pagos supera el 100%' };
  await supabase.from('cotizacion_formas_pago').delete().eq('cotizacion_id', cotizacionId);
  if (formas.length) {
    await supabase.from('cotizacion_formas_pago').insert(
      formas.map((f, i) => ({ cotizacion_id: cotizacionId, orden: i + 1, ...f })),
    );
  }
  revalidatePath(`/comercial/${cotizacionId}`);
  return { ok: true };
}

// ── Estados ─────────────────────────────────────────────────────────────
export async function cambiarEstado(
  id: string,
  estado: 'borrador' | 'enviada' | 'en_negociacion' | 'vencida' | 'rechazada',
  motivo?: string,
): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { error } = await supabase
    .from('cotizaciones')
    .update({ estado, motivo_rechazo: motivo ?? null })
    .eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/comercial/${id}`);
  revalidatePath('/comercial');
  return { ok: true };
}

// ── Versionado (snapshot de negociación) ────────────────────────────────
export async function guardarVersion(cotizacionId: string, justificacion: string): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const { data: cot } = await supabase.from('cotizaciones').select('*').eq('id', cotizacionId).single();
  const { data: items } = await supabase.from('cotizacion_items').select('*').eq('cotizacion_id', cotizacionId);
  const version = (cot?.version ?? 1);
  await supabase.from('cotizacion_versiones').insert({
    cotizacion_id: cotizacionId,
    version,
    snapshot: { cotizacion: cot, items },
    justificacion,
    usuario_id: session.id,
  });
  await supabase.from('cotizaciones').update({ version: version + 1 }).eq('id', cotizacionId);
  revalidatePath(`/comercial/${cotizacionId}`);
  return { ok: true };
}

// ── Aprobar → crea Proyecto (sin margen) ────────────────────────────────
export async function aprobarCotizacion(cotizacionId: string): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const admin = createAdminClient();

  const { data: cot } = await supabase.from('cotizaciones').select('*').eq('id', cotizacionId).single();
  if (!cot) return { ok: false, error: 'Cotización no encontrada' };
  if (cot.proyecto_id) return { ok: false, error: 'Ya tiene proyecto asociado' };

  const { data: items } = await supabase
    .from('cotizacion_items')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('orden');

  // contrato_total = total con descuento aprobado (precio cliente)
  const { data: c4 } = await supabase
    .from('cotizacion_formas_pago')
    .select('*')
    .eq('cotizacion_id', cotizacionId)
    .order('orden');

  // total con descuento (precio cliente) desde el motor de cálculo
  const arbol = armarArbol((items ?? []) as never);
  const calc = calcularCostosMargen(arbol as never);
  const totales = calcularTotales(calc, arbol as never, {
    gg_pct: Number(cot.gg_pct), ga_pct: Number(cot.ga_pct), utilidad_pct: Number(cot.utilidad_pct),
    igv_pct: Number(cot.igv_pct), descuento_pct: Number(cot.descuento_pct), descuento_activo: cot.descuento_activo,
  });

  // crear proyecto
  const { data: proy, error: ep } = await admin
    .from('proyectos')
    .insert({
      cotizacion_id: cotizacionId,
      linea_id: cot.linea_id,
      cliente_id: cot.cliente_id,
      nombre: cot.proyecto_nombre,
      direccion: cot.ubicacion,
      tipo_proyecto: cot.tipo_proyecto,
      estado: 'planeacion',
      contrato_total: totales.total_con_descuento,
      gg_pct: cot.gg_pct,
      ga_pct: cot.ga_pct,
      utilidad_pct: cot.utilidad_pct,
      igv_pct: cot.igv_pct,
    })
    .select('id, correlativo')
    .single();
  if (ep || !proy) return { ok: false, error: ep?.message ?? 'Error al crear proyecto' };

  await admin.from('proyectos').update({ codigo: formatCodigo('PROY', proy.correlativo) }).eq('id', proy.id);

  // copiar itemizado SIN margen (costo). Mantener jerarquía mapeando ids.
  if (items && items.length) {
    const idMap = new Map<string, string>();
    // insertar por niveles para respetar parent_id
    const byParent = (pid: string | null) => items.filter((i) => i.parent_id === pid);
    async function copyLevel(origParent: string | null, newParent: string | null) {
      for (const it of byParent(origParent)) {
        const { data: ni } = await admin
          .from('proyecto_items')
          .insert({
            proyecto_id: proy!.id,
            parent_id: newParent,
            nivel: it.nivel,
            orden: it.orden,
            item_codigo: it.item_codigo,
            titulo: it.titulo,
            unidad: it.unidad,
            cantidad: it.cantidad,
            costo_unitario: it.costo_unitario,
            total_costo: Number(it.cantidad ?? 0) * Number(it.costo_unitario ?? 0),
            es_hoja: it.es_hoja,
          })
          .select('id')
          .single();
        if (ni) {
          idMap.set(it.id, ni.id);
          await copyLevel(it.id, ni.id);
        }
      }
    }
    await copyLevel(null, null);
    // Nota: el total de los padres se calcula por agregación en la UI
    // (calc.ts) a partir de las hojas; total_costo guardado solo en hojas.
  }

  // cronograma de cobros (armadas) desde las formas de pago
  if (cot.tipo_proyecto && c4 && c4.length) {
    await admin.from('cronograma_cobros').insert(
      c4.map((f, i) => ({
        proyecto_id: proy!.id,
        orden: i + 1,
        concepto: f.concepto,
        porcentaje: f.porcentaje,
        monto: totales.total_con_descuento * Number(f.porcentaje),
        condicion_tipo: f.es_adelanto ? 'fecha' : 'avance',
        estado: 'pendiente',
      })),
    );
  }

  // caja chica
  await admin.from('cajas').insert({
    proyecto_id: proy.id,
    tipo: 'chica',
    nombre: `Caja chica — ${cot.proyecto_nombre}`,
    modalidad: 'credito',
    monto_maximo: 0,
    saldo_inicial: 0,
  });

  // marcar cotización aceptada
  await supabase
    .from('cotizaciones')
    .update({ estado: 'aceptada', proyecto_id: proy.id })
    .eq('id', cotizacionId);

  // notificar a Jefe de Proyectos y Presupuestos
  await notifyRoles(['jefe_proyectos', 'presupuestos'], {
    title: 'Nueva cotización aceptada',
    body: `${cot.proyecto_nombre} se convirtió en proyecto ${formatCodigo('PROY', proy.correlativo)}.`,
    url: `/proyectos/${proy.id}`,
    tag: `cot-${cotizacionId}`,
  }, 'comercial');

  revalidatePath('/comercial');
  revalidatePath('/proyectos');
  return { ok: true, id: proy.id };
}
