'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireModulo } from '@/lib/auth';
import { formatCodigo } from '@/lib/codigo';
import { notifyRoles, notifyUser } from '@/lib/push/notify';
import { armarArbol, calcularCostosMargen, calcularTotales } from '@/lib/calc';

type Res = { ok: boolean; error?: string; id?: string };

// Escritura en Comercial: exige permiso de edición del módulo (rol base o personalizado).
async function guard() {
  return requireModulo('comercial', 'editar');
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
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  moneda: z.enum(['PEN', 'USD']).optional(),
  tipo_cambio: z.coerce.number().optional(),
  plazo_valor: z.coerce.number().optional().nullable(),
  plazo_tipo: z.enum(['calendario', 'util', 'semanas', 'meses']).optional(),
  recomendado_por: z.string().optional(),
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
      lat: d.lat ?? null,
      lng: d.lng ?? null,
      moneda: d.moneda ?? 'PEN',
      tipo_cambio: d.moneda === 'USD' ? (d.tipo_cambio ?? 1) : 1,
      plazo_valor: d.plazo_valor ?? null,
      plazo_tipo: d.plazo_tipo ?? 'calendario',
      recomendado_por: d.recomendado_por || null,
      responsable_id: session.id,
      // Nace en 0% y ocultos GG/GA/utilidad; solo IGV visible. El usuario los
      // activa/edita si los necesita (pedido reunión 3).
      gg_pct: 0, ga_pct: 0, utilidad_pct: 0,
      mostrar_gg: false, mostrar_ga: false, mostrar_utilidad: false, mostrar_igv: true,
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

// ── Importación de itemizado desde plantilla (Excel/CSV/pegado) ─────────
export type FilaImport = { nivel: number; titulo: string; unidad?: string | null; cantidad?: number | null; costo_unitario?: number | null; margen_pct?: number | null };

export async function importarItemizado(
  cotizacionId: string,
  filas: FilaImport[],
): Promise<Res & { insertados?: number }> {
  await guard();
  if (!filas.length) return { ok: false, error: 'No hay filas para importar.' };
  const admin = createAdminClient();

  // orden de las nuevas partidas raíz continúa después de las existentes
  const { count: rootCount } = await admin
    .from('cotizacion_items').select('id', { count: 'exact', head: true })
    .eq('cotizacion_id', cotizacionId).is('parent_id', null);

  const n = filas.length;
  const tieneHijo = filas.map((f, i) => i + 1 < n && Number(filas[i + 1].nivel || 1) > Number(f.nivel || 1));
  const lastAtLevel: Record<number, string> = {};
  const ordenPorParent: Record<string, number> = { root: rootCount ?? 0 };
  let insertados = 0;

  for (let i = 0; i < n; i++) {
    const f = filas[i];
    const nivel = Math.min(4, Math.max(1, Number(f.nivel) || 1));
    const parentId = nivel > 1 ? (lastAtLevel[nivel - 1] ?? null) : null;
    const key = parentId ?? 'root';
    const orden = (ordenPorParent[key] = (ordenPorParent[key] ?? 0) + 1);
    const esHoja = !tieneHijo[i];
    const { data, error } = await admin.from('cotizacion_items').insert({
      cotizacion_id: cotizacionId, parent_id: parentId, nivel, orden,
      titulo: (f.titulo || 'Partida').toString().slice(0, 300),
      unidad: esHoja ? (f.unidad ?? null) : null,
      cantidad: esHoja ? (f.cantidad ?? null) : null,
      costo_unitario: esHoja ? (f.costo_unitario ?? null) : null,
      es_hoja: esHoja,
      margen_pct: esHoja ? (f.margen_pct ?? 0.3) : 0.3,
    } as never).select('id').single();
    if (error) return { ok: false, error: error.message };
    lastAtLevel[nivel] = (data as { id: string }).id;
    for (let L = nivel + 1; L <= 4; L++) delete lastAtLevel[L]; // limpia niveles más profundos
    insertados++;
  }
  revalidatePath(`/comercial/${cotizacionId}`);
  return { ok: true, insertados };
}

// Parsea un archivo .xlsx en el servidor (para .csv/pegado se procesa en el cliente).
export async function parsearXlsx(formData: FormData): Promise<{ ok: boolean; error?: string; filas?: string[][] }> {
  await guard();
  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false, error: 'Archivo inválido' };
  try {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];
    if (!ws) return { ok: false, error: 'El archivo no tiene hojas.' };
    const filas: string[][] = [];
    ws.eachRow((row) => {
      const vals: string[] = [];
      row.eachCell({ includeEmpty: true }, (cell) => {
        const v = cell.value as unknown;
        vals.push(v == null ? '' : (typeof v === 'object' && 'result' in (v as object) ? String((v as { result: unknown }).result ?? '') : String(v)));
      });
      filas.push(vals);
    });
    return { ok: true, filas };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'No se pudo leer el Excel' };
  }
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

// ── Flujo de revisión / validación ──────────────────────────────────────
// Comercial envía la cotización a revisión → notifica a Presupuestos y Gerencia.
export async function solicitarRevision(cotizacionId: string): Promise<Res> {
  const session = await guard();
  const admin = createAdminClient();
  const { data: cot } = await admin.from('cotizaciones').select('codigo, proyecto_nombre').eq('id', cotizacionId).single();
  const { error } = await admin.from('cotizaciones').update({
    revision_estado: 'pendiente', revision_nota: null,
    revision_solicitada_por: session.id, revision_at: new Date().toISOString(),
  } as never).eq('id', cotizacionId);
  if (error) return { ok: false, error: error.message };
  await notifyRoles(['presupuestos', 'gerencia'], {
    title: 'Cotización para revisar',
    body: `${cot?.codigo ?? ''} · ${cot?.proyecto_nombre ?? ''} — solicitó ${session.nombre}`,
    url: `/comercial/${cotizacionId}`, tag: 'revision',
  }, 'comercial');
  revalidatePath(`/comercial/${cotizacionId}`);
  revalidatePath('/comercial');
  return { ok: true };
}

// Presupuestos/Gerencia resuelve la revisión: aprobada u observada (con nota) →
// notifica a quien la solicitó.
export async function resolverRevision(cotizacionId: string, aprobar: boolean, nota?: string): Promise<Res> {
  const session = await guard();
  const admin = createAdminClient();
  const { data: cot } = await admin.from('cotizaciones')
    .select('codigo, proyecto_nombre, revision_solicitada_por, responsable_id')
    .eq('id', cotizacionId).single();
  const { error } = await admin.from('cotizaciones').update({
    revision_estado: aprobar ? 'aprobada' : 'observada',
    revision_nota: nota ?? null, revision_por: session.id, revision_at: new Date().toISOString(),
  } as never).eq('id', cotizacionId);
  if (error) return { ok: false, error: error.message };
  const destino = (cot as { revision_solicitada_por?: string; responsable_id?: string } | null)?.revision_solicitada_por
    ?? (cot as { responsable_id?: string } | null)?.responsable_id;
  if (destino) {
    await notifyUser(destino, {
      title: aprobar ? 'Revisión aprobada ✓' : 'Cotización observada',
      body: `${cot?.codigo ?? ''} · ${cot?.proyecto_nombre ?? ''}${nota ? ` — ${nota}` : ''}`,
      url: `/comercial/${cotizacionId}`, tag: 'revision',
    }, 'comercial');
  }
  revalidatePath(`/comercial/${cotizacionId}`);
  revalidatePath('/comercial');
  return { ok: true };
}

// ── Ítems del árbol ─────────────────────────────────────────────────────
export async function agregarItem(
  cotizacionId: string,
  parentId: string | null,
  nivel: number,
  prefill?: { titulo?: string; unidad?: string | null; costo_unitario?: number | null; catalogoPartidaId?: string },
  idPreset?: string,
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
    ...(idPreset ? { id: idPreset } : {}),
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
  } as never).select('id').single();
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

// Reordena una partida entre sus hermanas (mismo nivel/padre): intercambia
// el `orden` con la hermana de arriba/abajo. Los códigos (1.1, 1.2…) se renumeran solos.
export async function moverItem(cotizacionId: string, itemId: string, dir: 'up' | 'down'): Promise<Res> {
  await guard();
  const admin = createAdminClient();
  const { data: it } = await admin.from('cotizacion_items').select('id, parent_id, orden').eq('id', itemId).single();
  if (!it) return { ok: false, error: 'Ítem no encontrado' };
  let q = admin.from('cotizacion_items').select('id, orden').eq('cotizacion_id', cotizacionId);
  q = it.parent_id ? q.eq('parent_id', it.parent_id) : q.is('parent_id', null);
  const { data: sibs } = await q.order('orden');
  if (!sibs) return { ok: false, error: 'Error' };
  const idx = sibs.findIndex((s) => s.id === itemId);
  const j = dir === 'up' ? idx - 1 : idx + 1;
  if (j < 0 || j >= sibs.length) return { ok: true }; // ya está en el borde
  const a = sibs[idx]; const b = sibs[j];
  await admin.from('cotizacion_items').update({ orden: b.orden } as never).eq('id', a.id);
  await admin.from('cotizacion_items').update({ orden: a.orden } as never).eq('id', b.id);
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

// Guarda el APU de un ítem de cotización como plantilla reutilizable del catálogo.
export async function guardarApuComoPlantilla(
  cotizacionId: string,
  itemId: string,
  meta: { codigo?: string },
): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const admin = createAdminClient();

  const { data: item } = await supabase.from('cotizacion_items').select('titulo, unidad, costo_unitario, cotizacion_id').eq('id', itemId).single();
  if (!item) return { ok: false, error: 'Ítem no encontrado' };
  const { data: comps } = await supabase.from('apu_componentes').select('*').eq('cotizacion_item_id', itemId).order('orden');
  if (!comps || comps.length === 0) return { ok: false, error: 'Este ítem no tiene componentes APU' };

  const { data: cot } = await supabase.from('cotizaciones').select('linea_id').eq('id', item.cotizacion_id).single();
  const cu = comps.reduce((a, c) => a + Number(c.cantidad) * Number(c.precio), 0);

  const { data: part, error } = await admin.from('catalogo_partidas').insert({
    linea_id: cot?.linea_id ?? null,
    codigo: meta.codigo || null,
    descripcion: item.titulo,
    unidad: item.unidad,
    costo_referencial: cu,
  }).select('id').single();
  if (error || !part) return { ok: false, error: error?.message ?? 'Error al crear partida' };

  await admin.from('catalogo_apu').insert(comps.map((c, i) => ({
    catalogo_partida_id: part.id, tipo: c.tipo, descripcion: c.descripcion, unidad: c.unidad,
    cuadrilla: c.cuadrilla, rendimiento: c.rendimiento, cantidad: c.cantidad, precio: c.precio, orden: i + 1,
  })));

  revalidatePath('/catalogos');
  return { ok: true, id: part.id };
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

// ── Revertir un campo a un valor anterior (desde el historial) ──────────
const CAMPOS_REVERSIBLES: Record<string, Set<string>> = {
  cotizaciones: new Set(['proyecto_nombre', 'asunto', 'ubicacion', 'descripcion', 'condiciones', 'servicios_incluidos', 'servicios_omitidos', 'garantia', 'garantia_activa', 'gg_pct', 'ga_pct', 'utilidad_pct', 'igv_pct', 'descuento_pct', 'descuento_activo', 'vigencia_dias', 'plazo_valor', 'plazo_tipo']),
  cotizacion_items: new Set(['titulo', 'unidad', 'cantidad', 'costo_unitario', 'margen_pct']),
};

export async function revertirCambio(
  cotizacionId: string,
  input: { tabla: string; registroId: string; campo: string; valor: unknown },
): Promise<Res> {
  await guard();
  const permitido = CAMPOS_REVERSIBLES[input.tabla];
  if (!permitido || !permitido.has(input.campo)) return { ok: false, error: 'Campo no reversible' };
  const supabase = createClient();
  const { error } = await supabase
    .from(input.tabla as 'cotizaciones')
    .update({ [input.campo]: input.valor } as never)
    .eq('id', input.registroId);
  if (error) return { ok: false, error: 'No se pudo revertir (¿el registro fue eliminado?)' };
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

// ── Eliminar cotización (solo si NO fue aceptada) ───────────────────────
export async function eliminarCotizacion(id: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { data: cot } = await supabase.from('cotizaciones').select('estado, proyecto_id').eq('id', id).single();
  if (!cot) return { ok: false, error: 'No encontrada' };
  if (cot.estado === 'aceptada' || cot.proyecto_id)
    return { ok: false, error: 'No se puede eliminar: la cotización ya fue aceptada y generó un proyecto.' };
  const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
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

// Restaura una versión guardada (reemplaza cabecera + partidas). Antes guarda el
// estado actual como versión automática para no perder nada.
export async function restaurarVersion(cotizacionId: string, versionId: string): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const admin = createAdminClient();
  const { data: ver } = await supabase.from('cotizacion_versiones').select('snapshot, version').eq('id', versionId).single();
  const snap = ver?.snapshot as { cotizacion?: Record<string, unknown>; items?: Record<string, unknown>[] } | undefined;
  if (!snap?.cotizacion) return { ok: false, error: 'La versión no tiene datos para restaurar' };

  // 1) respaldar el estado ACTUAL como versión
  const { data: cotActual } = await supabase.from('cotizaciones').select('*').eq('id', cotizacionId).single();
  const { data: itemsActual } = await supabase.from('cotizacion_items').select('*').eq('cotizacion_id', cotizacionId).order('orden');
  const { data: ult } = await supabase.from('cotizacion_versiones').select('version').eq('cotizacion_id', cotizacionId).order('version', { ascending: false }).limit(1);
  const nuevaV = (ult?.[0]?.version ?? 0) + 1;
  await admin.from('cotizacion_versiones').insert({
    cotizacion_id: cotizacionId, version: nuevaV, usuario_id: session.id,
    justificacion: `Auto-respaldo antes de restaurar la Versión ${ver?.version}`,
    snapshot: { cotizacion: cotActual, items: itemsActual },
  } as never);
  await admin.from('cotizaciones').update({ version: nuevaV + 1 } as never).eq('id', cotizacionId);

  // 2) restaurar cabecera (solo campos editables)
  const c = snap.cotizacion as Record<string, unknown>;
  const campos = ['proyecto_nombre', 'asunto', 'ubicacion', 'condiciones', 'servicios_incluidos', 'servicios_omitidos',
    'garantia', 'garantia_activa', 'gg_pct', 'ga_pct', 'utilidad_pct', 'igv_pct', 'descuento_pct', 'descuento_activo',
    'mostrar_gg', 'mostrar_ga', 'mostrar_utilidad', 'mostrar_igv', 'moneda', 'tipo_cambio', 'mostrar_equiv_pen',
    'vigencia_dias', 'plazo_valor', 'plazo_tipo'];
  const patch: Record<string, unknown> = {};
  campos.forEach((k) => { if (k in c) patch[k] = c[k]; });
  await admin.from('cotizaciones').update(patch as never).eq('id', cotizacionId);

  // 3) reemplazar partidas desde el snapshot en UNA sola inserción (rápido):
  //    generamos ids nuevos y remapeamos parent_id para conservar la jerarquía.
  await admin.from('cotizacion_items').delete().eq('cotizacion_id', cotizacionId);
  const snapItems = (snap.items ?? []) as Record<string, unknown>[];
  if (snapItems.length) {
    const idMap = new Map<string, string>();
    snapItems.forEach((it) => idMap.set(it.id as string, globalThis.crypto.randomUUID()));
    const filas = snapItems.map((it) => ({
      id: idMap.get(it.id as string), cotizacion_id: cotizacionId,
      parent_id: it.parent_id ? (idMap.get(it.parent_id as string) ?? null) : null,
      nivel: it.nivel, orden: it.orden, item_codigo: it.item_codigo, titulo: it.titulo, unidad: it.unidad,
      cantidad: it.cantidad, costo_unitario: it.costo_unitario, costo_formula: it.costo_formula ?? null,
      margen_pct: it.margen_pct, es_hoja: it.es_hoja,
    }));
    await admin.from('cotizacion_items').insert(filas as never);
  }
  revalidatePath(`/comercial/${cotizacionId}`);
  return { ok: true };
}

// ── Aprobar → crea Proyecto (sin margen) ────────────────────────────────
// Duplica una cotización (cabecera + partidas + formas de pago). Si comoPlantilla,
// la nueva queda marcada como plantilla (reutilizable). Devuelve el id de la copia.
export async function duplicarCotizacion(id: string, opts?: { comoPlantilla?: boolean; nombre?: string }): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const admin = createAdminClient();
  const { data: cot } = await supabase.from('cotizaciones').select('*').eq('id', id).single();
  if (!cot) return { ok: false, error: 'Cotización no encontrada' };
  const [{ data: items }, { data: formas }] = await Promise.all([
    supabase.from('cotizacion_items').select('*').eq('cotizacion_id', id).order('orden'),
    supabase.from('cotizacion_formas_pago').select('*').eq('cotizacion_id', id).order('orden'),
  ]);
  const comoPlantilla = !!opts?.comoPlantilla;
  const nombre = opts?.nombre || (comoPlantilla ? `Plantilla — ${cot.proyecto_nombre}` : `${cot.proyecto_nombre} (copia)`);

  const { data: nueva, error } = await admin.from('cotizaciones').insert({
    linea_id: cot.linea_id, cliente_id: cot.cliente_id, proyecto_nombre: nombre,
    asunto: cot.asunto, ubicacion: cot.ubicacion, tipo_cotizacion: cot.tipo_cotizacion, tipo_proyecto: cot.tipo_proyecto,
    origen: cot.origen, vigencia_dias: cot.vigencia_dias, plazo_valor: cot.plazo_valor, plazo_tipo: cot.plazo_tipo,
    moneda: cot.moneda, tipo_cambio: cot.tipo_cambio, mostrar_equiv_pen: cot.mostrar_equiv_pen,
    gg_pct: cot.gg_pct, ga_pct: cot.ga_pct, utilidad_pct: cot.utilidad_pct, igv_pct: cot.igv_pct,
    descuento_pct: cot.descuento_pct, descuento_activo: cot.descuento_activo, margen_min_pct: cot.margen_min_pct,
    mostrar_gg: cot.mostrar_gg, mostrar_ga: cot.mostrar_ga, mostrar_utilidad: cot.mostrar_utilidad, mostrar_igv: cot.mostrar_igv,
    garantia_activa: cot.garantia_activa, condiciones: cot.condiciones, servicios_incluidos: cot.servicios_incluidos,
    servicios_omitidos: cot.servicios_omitidos, garantia: cot.garantia, plantilla_id: cot.plantilla_id,
    estado: 'borrador', es_plantilla: comoPlantilla, responsable_id: session.id,
  } as never).select('id, correlativo').single();
  if (error || !nueva) return { ok: false, error: error?.message ?? 'No se pudo duplicar' };
  await admin.from('cotizaciones').update({ codigo: formatCodigo('COT', nueva.correlativo) } as never).eq('id', nueva.id);

  if (items?.length) {
    const idMap = new Map<string, string>();
    items.forEach((it) => idMap.set(it.id, globalThis.crypto.randomUUID()));
    const filas = items.map((it) => ({
      id: idMap.get(it.id), cotizacion_id: nueva!.id,
      parent_id: it.parent_id ? (idMap.get(it.parent_id) ?? null) : null,
      nivel: it.nivel, orden: it.orden, item_codigo: it.item_codigo, titulo: it.titulo, unidad: it.unidad,
      cantidad: it.cantidad, costo_unitario: it.costo_unitario, costo_formula: it.costo_formula, margen_pct: it.margen_pct, es_hoja: it.es_hoja,
    }));
    await admin.from('cotizacion_items').insert(filas as never);
  }
  if (formas?.length) {
    await admin.from('cotizacion_formas_pago').insert(formas.map((f) => ({
      cotizacion_id: nueva!.id, orden: f.orden, concepto: f.concepto, porcentaje: f.porcentaje, es_adelanto: f.es_adelanto,
    })) as never);
  }
  revalidatePath('/comercial');
  return { ok: true, id: nueva.id };
}

export async function aprobarCotizacion(cotizacionId: string): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const admin = createAdminClient();

  const { data: cot } = await supabase.from('cotizaciones').select('*').eq('id', cotizacionId).single();
  if (!cot) return { ok: false, error: 'Cotización no encontrada' };
  if (cot.proyecto_id) return { ok: false, error: 'Ya tiene proyecto asociado' };

  // RUC/DNI obligatorio del cliente para poder facturar más adelante.
  const cli = cot.cliente_id
    ? (await supabase.from('clientes').select('ruc_dni').eq('id', cot.cliente_id).single()).data
    : null;
  if (!cli?.ruc_dni || !String(cli.ruc_dni).trim()) {
    return { ok: false, error: 'El cliente no tiene RUC/DNI. Agrégalo en el cliente para poder facturar antes de aprobar.' };
  }

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

  // si la cotización está en dólares, convertir a soles con el T.C. (el proyecto/finanzas opera en soles)
  const tc = cot.moneda === 'USD' ? Number(cot.tipo_cambio ?? 1) : 1;

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
      contrato_total: totales.total_con_descuento * tc,
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
            costo_unitario: it.costo_unitario == null ? null : Number(it.costo_unitario) * tc,
            total_costo: Number(it.cantidad ?? 0) * Number(it.costo_unitario ?? 0) * tc,
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
        monto: totales.total_con_descuento * tc * Number(f.porcentaje),
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
