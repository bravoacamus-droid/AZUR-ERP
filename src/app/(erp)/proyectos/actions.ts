'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireModulo } from '@/lib/auth';
import { notifyRoles } from '@/lib/push/notify';
import { calcEstado, calcPrioridad, proyectadoSemana, semanasEntre } from '@/lib/lastplanner';
import { saludRegla1, saludRegla2 } from '@/lib/salud';
import { nowLima } from '@/lib/format';

type Res = { ok: boolean; error?: string; id?: string };

// Escritura en Proyectos: exige permiso de edición del módulo.
async function guard() {
  return requireModulo('proyectos', 'editar');
}

// ── Cabecera del proyecto ───────────────────────────────────────────────
export async function actualizarProyecto(id: string, patch: Record<string, unknown>): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { error } = await supabase.from('proyectos').update(patch as never).eq('id', id);
  if (error) return { ok: false, error: error.message };
  // El recálculo de fechas de entrega se hace de forma explícita desde el Last Planner
  // (botón "Recalcular fechas"), para aplicar todos los cambios de un golpe y con feedback.
  revalidatePath(`/proyectos/${id}`);
  return { ok: true };
}

// ── Itemizado (cuadrantes 1 y 2) ────────────────────────────────────────
export async function agregarItemProyecto(
  proyectoId: string,
  parentId: string | null,
  nivel: number,
  prefill?: { titulo?: string; unidad?: string | null; costo_unitario?: number | null; catalogoPartidaId?: string },
  idPreset?: string,
): Promise<Res> {
  await guard();
  const supabase = createClient();
  const admin = createAdminClient();
  if (parentId) await supabase.from('proyecto_items').update({ es_hoja: false }).eq('id', parentId);
  let q = supabase.from('proyecto_items').select('id', { count: 'exact', head: true }).eq('proyecto_id', proyectoId);
  q = parentId ? q.eq('parent_id', parentId) : q.is('parent_id', null);
  const { count } = await q;
  const tituloDefault = nivel === 1 ? 'Nueva partida' : nivel === 2 ? 'Nueva sub partida' : nivel === 3 ? 'Nueva actividad' : 'Nueva sub actividad';
  const cu = prefill?.costo_unitario ?? null;
  const { data: nuevo, error } = await supabase.from('proyecto_items').insert({
    ...(idPreset ? { id: idPreset } : {}),
    proyecto_id: proyectoId, parent_id: parentId, nivel, orden: (count ?? 0) + 1,
    titulo: prefill?.titulo || tituloDefault,
    unidad: prefill?.unidad ?? null,
    costo_unitario: cu,
    cantidad: cu != null ? 1 : null,
    total_costo: cu != null ? cu : 0,
    es_hoja: true, estado_tarea: 'pendiente', prioridad: 'media',
  } as never).select('id').single();
  if (error || !nuevo) return { ok: false, error: error?.message ?? 'Error' };

  // copiar APU plantilla del catálogo si corresponde
  if (prefill?.catalogoPartidaId) {
    const { data: tpl } = await admin.from('catalogo_apu').select('*').eq('catalogo_partida_id', prefill.catalogoPartidaId).order('orden');
    if (tpl && tpl.length) {
      await admin.from('apu_proyecto').insert(tpl.map((t) => ({
        proyecto_item_id: nuevo.id, tipo: t.tipo, descripcion: t.descripcion, unidad: t.unidad,
        cuadrilla: t.cuadrilla, rendimiento: t.rendimiento, cantidad: t.cantidad, precio: t.precio, orden: t.orden,
      })));
      await recalcularApuProyecto(nuevo.id);
    }
  }

  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

async function recalcularApuProyecto(itemId: string) {
  const admin = createAdminClient();
  const { data: comps } = await admin.from('apu_proyecto').select('cantidad, precio').eq('proyecto_item_id', itemId);
  const cu = (comps ?? []).reduce((a, c) => a + Number(c.cantidad) * Number(c.precio), 0);
  const tiene = (comps ?? []).length > 0;
  const { data: it } = await admin.from('proyecto_items').select('cantidad').eq('id', itemId).single();
  const cant = Number(it?.cantidad ?? 1) || 1;
  await admin.from('proyecto_items').update({
    costo_unitario: tiene ? cu : undefined,
    total_costo: tiene ? cu * cant : undefined,
    tiene_apu: tiene,
  }).eq('id', itemId);
}

export async function guardarComponenteApuProyecto(
  proyectoId: string, itemId: string,
  comp: { id?: string; tipo: string; descripcion: string; unidad?: string; cuadrilla?: number; rendimiento?: number; cantidad: number; precio: number },
): Promise<Res> {
  await guard();
  const supabase = createClient();
  const payload = {
    proyecto_item_id: itemId, tipo: comp.tipo as never, descripcion: comp.descripcion,
    unidad: comp.unidad || null, cuadrilla: comp.cuadrilla ?? null, rendimiento: comp.rendimiento ?? null,
    cantidad: comp.cantidad, precio: comp.precio,
  };
  if (comp.id) {
    const { error } = await supabase.from('apu_proyecto').update(payload).eq('id', comp.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from('apu_proyecto').insert(payload);
    if (error) return { ok: false, error: error.message };
  }
  await recalcularApuProyecto(itemId);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function eliminarComponenteApuProyecto(proyectoId: string, itemId: string, compId: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  await supabase.from('apu_proyecto').delete().eq('id', compId);
  await recalcularApuProyecto(itemId);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function actualizarItemProyecto(proyectoId: string, itemId: string, patch: Record<string, unknown>): Promise<Res> {
  await guard();
  const supabase = createClient();
  // recalcular total_costo si cambian cantidad/cu
  if ('cantidad' in patch || 'costo_unitario' in patch) {
    const { data: it } = await supabase.from('proyecto_items').select('cantidad, costo_unitario').eq('id', itemId).single();
    const cant = Number((patch.cantidad ?? it?.cantidad) ?? 0);
    const cu = Number((patch.costo_unitario ?? it?.costo_unitario) ?? 0);
    patch.total_costo = cant * cu;
  }
  const { error } = await supabase.from('proyecto_items').update(patch as never).eq('id', itemId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function eliminarItemProyecto(proyectoId: string, itemId: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { data: item } = await supabase.from('proyecto_items').select('parent_id').eq('id', itemId).single();
  await supabase.from('proyecto_items').delete().eq('id', itemId);
  if (item?.parent_id) {
    const { count } = await supabase.from('proyecto_items').select('id', { count: 'exact', head: true }).eq('parent_id', item.parent_id);
    if (!count) await supabase.from('proyecto_items').update({ es_hoja: true }).eq('id', item.parent_id);
  }
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Valorizaciones (cuadrante 3) ────────────────────────────────────────
export async function crearValorizacion(proyectoId: string): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const { data: ult } = await supabase.from('valorizaciones').select('numero').eq('proyecto_id', proyectoId).order('numero', { ascending: false }).limit(1);
  const numero = (ult?.[0]?.numero ?? 0) + 1;
  const { data, error } = await supabase.from('valorizaciones').insert({
    proyecto_id: proyectoId, numero, semana: numero, created_by: session.id,
  }).select('id').single();
  if (error || !data) return { ok: false, error: error?.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true, id: data.id };
}

const avanceSchema = z.object({
  itemId: z.string().uuid(),
  pct: z.number().min(0).max(1),
});

export async function guardarAvances(
  proyectoId: string,
  valorizacionId: string,
  avances: { itemId: string; pct: number }[],
): Promise<Res> {
  await guard();
  const supabase = createClient();

  // ítems hoja con su total
  const { data: items } = await supabase
    .from('proyecto_items')
    .select('id, total_costo, es_hoja, fecha_inicio, fecha_entrega, duracion_dias, estado_override, parent_id')
    .eq('proyecto_id', proyectoId);
  const leafTotal = new Map<string, number>();
  (items ?? []).forEach((i) => { if (i.es_hoja) leafTotal.set(i.id, Number(i.total_costo ?? 0)); });

  // valorizaciones existentes (para validar acumulado y conocer la semana)
  const { data: vals } = await supabase
    .from('valorizaciones')
    .select('id, numero, valorizacion_items(proyecto_item_id, pct_avance)')
    .eq('proyecto_id', proyectoId)
    .order('numero');

  // acumulado previo (sin contar esta valorización)
  const acumPrevio = new Map<string, number>();
  (vals ?? []).forEach((v) => {
    if (v.id === valorizacionId) return;
    (v.valorizacion_items as { proyecto_item_id: string; pct_avance: number }[]).forEach((vi) => {
      acumPrevio.set(vi.proyecto_item_id, (acumPrevio.get(vi.proyecto_item_id) ?? 0) + Number(vi.pct_avance));
    });
  });

  // validar y upsert
  let montoValorizado = 0;
  for (const a of avances) {
    const p = avanceSchema.safeParse(a);
    if (!p.success) return { ok: false, error: 'Avance inválido' };
    const prev = acumPrevio.get(a.itemId) ?? 0;
    if (prev + a.pct > 1.0001) return { ok: false, error: 'El % acumulado supera el 100% en una partida.' };
    const total = leafTotal.get(a.itemId) ?? 0;
    montoValorizado += a.pct * total;
  }

  // borrar items previos de esta valorización y reinsertar
  await supabase.from('valorizacion_items').delete().eq('valorizacion_id', valorizacionId);
  if (avances.length) {
    await supabase.from('valorizacion_items').insert(
      avances.filter((a) => a.pct > 0).map((a) => ({
        valorizacion_id: valorizacionId,
        proyecto_item_id: a.itemId,
        pct_avance: a.pct,
        total: a.pct * (leafTotal.get(a.itemId) ?? 0),
      })),
    );
  }

  // base de valorización: costo (itemizado) o precio (con margen → factor contrato/costo)
  const { data: proy } = await supabase.from('proyectos').select('adelanto_pct, contrato_total, base_valorizacion').eq('id', proyectoId).single();
  const costoDirecto = Array.from(leafTotal.values()).reduce((a, b) => a + b, 0);
  const factorVal = proy?.base_valorizacion === 'precio' && costoDirecto > 0 ? Number(proy.contrato_total ?? 0) / costoDirecto : 1;
  montoValorizado = montoValorizado * factorVal;

  // dilución del adelanto (B.9)
  const adelantoPct = Number(proy?.adelanto_pct ?? 0);
  const amortizacion = adelantoPct * montoValorizado;
  await supabase.from('valorizaciones').update({
    monto_valorizado: montoValorizado,
    amortizacion_adelanto: amortizacion,
    cobro_neto: montoValorizado - amortizacion,
  }).eq('id', valorizacionId);

  // recomputar estado/prioridad de cada hoja (B.5)
  const numeroActual = (vals ?? []).find((v) => v.id === valorizacionId)?.numero ?? (vals?.length ?? 1);
  const avanceMap = new Map(avances.map((a) => [a.itemId, a.pct]));
  for (const it of items ?? []) {
    if (!it.es_hoja) continue;
    const acum = (acumPrevio.get(it.id) ?? 0) + (avanceMap.get(it.id) ?? 0);
    const numSem = semanasEntre(it.fecha_inicio, it.fecha_entrega, it.duracion_dias ? Number(it.duracion_dias) : null);
    const proyAcum = proyectadoSemana(numeroActual, numSem);
    const estado = calcEstado({
      pctAcum: acum,
      avanceUltimaSemana: avanceMap.get(it.id) ?? 0,
      fechaInicio: it.fecha_inicio,
      fechaEntrega: it.fecha_entrega,
      override: (it.estado_override as never) ?? null,
      hoy: nowLima(),
    });
    const prioridad = calcPrioridad(acum, proyAcum);
    await supabase.from('proyecto_items').update({ estado_tarea: estado, prioridad }).eq('id', it.id);
  }

  await generarAlertasSalud(proyectoId);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// Genera/actualiza alertas de salud (reglas #1 y #2) para un proyecto.
async function generarAlertasSalud(proyectoId: string) {
  const admin = createAdminClient();
  const { data: d } = await admin.from('v_dashboard_proyecto').select('*').eq('proyecto_id', proyectoId).single();
  if (!d) return;
  const { data: proy } = await admin.from('proyectos').select('nombre').eq('id', proyectoId).single();
  const nombre = proy?.nombre ?? 'Proyecto';
  const nums = { proyectado: Number(d.proyectado), pagos: Number(d.pagos), gasto: Number(d.gasto), valorizado: Number(d.valorizado) };

  const evals: { tipo: string; titulo: string; detalle: string }[] = [];
  if (saludRegla1(nums) === 'critica')
    evals.push({ tipo: 'salud_caja', titulo: `${nombre}: gasto supera lo cobrado (regla #1)`, detalle: `Gasto ${nums.gasto.toFixed(0)} > Cobrado ${nums.pagos.toFixed(0)}.` });
  if (saludRegla2(nums) === 'critica')
    evals.push({ tipo: 'sobrecosto_avance', titulo: `${nombre}: gasto real supera lo valorizado (regla #2)`, detalle: `Gasto ${nums.gasto.toFixed(0)} > Valorizado ${nums.valorizado.toFixed(0)}.` });

  // limpia alertas previas no resueltas de estos tipos y reinserta las vigentes
  await admin.from('alertas').delete().eq('proyecto_id', proyectoId).eq('resuelta', false).in('tipo', ['salud_caja', 'sobrecosto_avance']);
  if (evals.length) {
    await admin.from('alertas').insert(evals.map((e) => ({ ...e, proyecto_id: proyectoId, severidad: 'critica' as const })));
    await notifyRoles(['gerencia'], { title: '⚠ Alerta de salud de proyecto', body: evals[0].titulo, url: `/proyectos/${proyectoId}` }, 'alertas');
  }
}

// Subir documento al expediente
export async function subirDocumento(proyectoId: string, input: { nombre: string; url: string; carpeta: string }): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const { error } = await supabase.from('documentos').insert({
    proyecto_id: proyectoId, nombre: input.nombre, url: input.url, carpeta: input.carpeta, visibilidad: 'mando', created_by: session.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// Registrar el cobro neto de una valorización → caja del proyecto (ingreso)
export async function registrarCobroValorizacion(proyectoId: string, valorizacionId: string): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const admin = createAdminClient();
  const { data: val } = await supabase.from('valorizaciones').select('cobro_neto, numero').eq('id', valorizacionId).single();
  if (!val) return { ok: false, error: 'Valorización no encontrada' };
  await admin.from('abonos_cliente').insert({
    proyecto_id: proyectoId, monto: Number(val.cobro_neto), metodo: `Valorización N${val.numero}`, created_by: session.id,
  });
  const { data: caja } = await admin.from('cajas').select('id').eq('proyecto_id', proyectoId).eq('tipo', 'chica').limit(1).single();
  if (caja) {
    await admin.from('movimientos_caja').insert({
      caja_id: caja.id, proyecto_id: proyectoId, tipo: 'abono', monto: Number(val.cobro_neto),
      concepto: `Cobro valorización N${val.numero}`, referencia_tipo: 'valorizacion', referencia_id: valorizacionId, created_by: session.id,
    });
  }
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Adelantos adicionales / extraordinarios ─────────────────────────────
export async function agregarAdelanto(proyectoId: string, input: { concepto: string; tipo: string; monto: number; fecha?: string }): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const { error } = await supabase.from('adelantos').insert({
    proyecto_id: proyectoId, concepto: input.concepto, tipo: input.tipo,
    monto: input.monto, fecha: input.fecha || undefined, created_by: session.id,
  } as never);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function eliminarAdelanto(proyectoId: string, id: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  await supabase.from('adelantos').delete().eq('id', id);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Itemizado propio de Proyectos (independiente del comercial) ─────────
// Vacía el itemizado heredado de la cotización para que Proyectos arme el suyo.
// La comparación con el comercial pasa a ser solo por totales/márgenes.
export async function vaciarItemizadoProyecto(proyectoId: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  await supabase.from('proyecto_items').delete().eq('proyecto_id', proyectoId);
  const { error } = await supabase.from('proyectos').update({ itemizado_propio: true } as never).eq('id', proyectoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// Guarda el monto proyectado de un tipo de gasto (reparto manual del presupuesto).
export async function guardarPresupuestoTipoGasto(proyectoId: string, tipo: string, monto: number): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { error } = await supabase
    .from('presupuesto_tipo_gasto')
    .upsert({ proyecto_id: proyectoId, tipo, monto_proyectado: monto } as never, { onConflict: 'proyecto_id,tipo' });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// Firmantes de los documentos del proyecto (valorización / liquidación).
export async function guardarFirmantesProyecto(proyectoId: string, userIds: string[]): Promise<Res> {
  await guard();
  const admin = createAdminClient();
  const ids = (userIds ?? []).filter((x) => typeof x === 'string');
  const { error } = await admin.from('proyectos').update({ firmantes: ids } as never).eq('id', proyectoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function marcarItemizadoPropio(proyectoId: string, propio: boolean): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { error } = await supabase.from('proyectos').update({ itemizado_propio: propio } as never).eq('id', proyectoId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Solicitudes de cambio (aprobaciones) ────────────────────────────────
// Cambios de cantidad/monto en el itemizado → aprueba Presupuestos.
export async function solicitarCambioMonto(
  proyectoId: string, itemId: string, descripcion: string, patch: Record<string, unknown>,
): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const { error } = await supabase.from('solicitudes_cambio').insert({
    proyecto_id: proyectoId, tipo: 'item_monto', rol_aprobador: 'presupuestos',
    referencia_id: itemId, descripcion, payload: patch as never,
    solicitado_por: session.id, solicitado_nombre: session.nombre,
  } as never);
  if (error) return { ok: false, error: error.message };
  await notifyRoles(['presupuestos', 'gerencia'], { title: 'Solicitud de cambio (monto)', body: descripcion, url: `/proyectos/${proyectoId}` }, 'alertas');
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// Corregir una valorización ya cobrada → aprueba Gerencia (reabre para edición).
export async function solicitarReaperturaValorizacion(
  proyectoId: string, valorizacionId: string, numero: number, motivo: string,
): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const { error } = await supabase.from('solicitudes_cambio').insert({
    proyecto_id: proyectoId, tipo: 'valorizacion_reapertura', rol_aprobador: 'gerencia',
    referencia_id: valorizacionId, descripcion: `Reapertura de la Valorización N°${numero}`,
    payload: { motivo } as never, solicitado_por: session.id, solicitado_nombre: session.nombre,
  } as never);
  if (error) return { ok: false, error: error.message };
  await notifyRoles(['gerencia'], { title: 'Solicitud de reapertura de valorización', body: `Val N°${numero}: ${motivo}`, url: `/proyectos/${proyectoId}` }, 'alertas');
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// Gerencia reabre directamente una valorización (sin solicitud: ella misma es la aprobadora).
export async function reabrirValorizacion(proyectoId: string, valorizacionId: string): Promise<Res> {
  const session = await guard();
  if (session.rol !== 'gerencia') return { ok: false, error: 'Solo Gerencia puede reabrir directamente' };
  const supabase = createClient();
  await supabase.from('valorizaciones').update({ reabierta: false } as never).eq('proyecto_id', proyectoId);
  const { error } = await supabase.from('valorizaciones').update({ reabierta: true } as never).eq('id', valorizacionId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function aprobarSolicitud(proyectoId: string, solicitudId: string): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const { data: sol } = await supabase.from('solicitudes_cambio').select('*').eq('id', solicitudId).single();
  if (!sol || sol.estado !== 'pendiente') return { ok: false, error: 'Solicitud no disponible' };
  // solo el rol aprobador (o gerencia) puede aprobar
  const permitido = session.rol === 'gerencia' || session.rol === sol.rol_aprobador;
  if (!permitido) return { ok: false, error: 'No autorizado para aprobar esta solicitud' };

  if (sol.tipo === 'item_monto' && sol.referencia_id) {
    const patch = { ...(sol.payload as Record<string, unknown>) };
    const { data: it } = await supabase.from('proyecto_items').select('cantidad, costo_unitario').eq('id', sol.referencia_id).single();
    const cant = Number((patch.cantidad ?? it?.cantidad) ?? 0);
    const cu = Number((patch.costo_unitario ?? it?.costo_unitario) ?? 0);
    patch.total_costo = cant * cu;
    await supabase.from('proyecto_items').update(patch as never).eq('id', sol.referencia_id);
  } else if (sol.tipo === 'valorizacion_reapertura' && sol.referencia_id) {
    await supabase.from('valorizaciones').update({ reabierta: false } as never).eq('proyecto_id', proyectoId);
    await supabase.from('valorizaciones').update({ reabierta: true } as never).eq('id', sol.referencia_id);
  }
  await supabase.from('solicitudes_cambio').update({
    estado: 'aprobada', resuelto_por: session.id, resuelto_nombre: session.nombre, resuelto_at: new Date().toISOString(),
  } as never).eq('id', solicitudId);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function rechazarSolicitud(proyectoId: string, solicitudId: string, motivo: string): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const { data: sol } = await supabase.from('solicitudes_cambio').select('rol_aprobador, estado').eq('id', solicitudId).single();
  if (!sol || sol.estado !== 'pendiente') return { ok: false, error: 'Solicitud no disponible' };
  if (!(session.rol === 'gerencia' || session.rol === sol.rol_aprobador)) return { ok: false, error: 'No autorizado' };
  await supabase.from('solicitudes_cambio').update({
    estado: 'rechazada', motivo, resuelto_por: session.id, resuelto_nombre: session.nombre, resuelto_at: new Date().toISOString(),
  } as never).eq('id', solicitudId);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// Re-bloquea una valorización reabierta tras guardar la corrección.
export async function cerrarReaperturaValorizacion(proyectoId: string, valorizacionId: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  await supabase.from('valorizaciones').update({ reabierta: false } as never).eq('id', valorizacionId);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Equipo de obra ──────────────────────────────────────────────────────
export async function asignarEquipo(proyectoId: string, profileId: string, rolObra: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { error } = await supabase.from('proyecto_equipo').insert({
    proyecto_id: proyectoId, profile_id: profileId, rol_obra: rolObra as never,
  });
  if (error && !error.message.includes('duplicate')) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}
export async function quitarEquipo(proyectoId: string, id: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  await supabase.from('proyecto_equipo').delete().eq('id', id);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Cronograma de cobros (armadas) ──────────────────────────────────────
export async function guardarArmadas(
  proyectoId: string,
  armadas: { concepto: string; porcentaje: number; condicion_tipo: string; condicion_valor?: number; fecha_esperada?: string }[],
): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { data: proy } = await supabase.from('proyectos').select('contrato_total').eq('id', proyectoId).single();
  const contrato = Number(proy?.contrato_total ?? 0);
  await supabase.from('cronograma_cobros').delete().eq('proyecto_id', proyectoId);
  if (armadas.length) {
    await supabase.from('cronograma_cobros').insert(armadas.map((a, i) => ({
      proyecto_id: proyectoId, orden: i + 1, concepto: a.concepto, porcentaje: a.porcentaje,
      monto: contrato * a.porcentaje, condicion_tipo: a.condicion_tipo as never,
      condicion_valor: a.condicion_valor ?? null, fecha_esperada: a.fecha_esperada ?? null, estado: 'pendiente',
    })));
  }
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Adicionales / deductivos ────────────────────────────────────────────
export async function registrarAdicional(
  proyectoId: string,
  input: { tipo: 'adicional' | 'deductivo'; descripcion: string; monto: number; proyecto_item_id?: string },
): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  const { error } = await supabase.from('adicionales_deductivos').insert({
    proyecto_id: proyectoId, tipo: input.tipo, descripcion: input.descripcion, monto: input.monto,
    proyecto_item_id: input.proyecto_item_id || null, solicitado_por: session.id, estado: 'solicitado',
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}
export async function resolverAdicional(proyectoId: string, id: string, aprobar: boolean): Promise<Res> {
  const session = await guard();
  const supabase = createClient();
  await supabase.from('adicionales_deductivos').update({
    estado: aprobar ? 'aprobado' : 'rechazado', aprobado_por: session.id,
  }).eq('id', id);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Liquidación / cierre de obra (Sec. 4.6 / 7bis.2) ────────────────────
export async function liquidarProyecto(proyectoId: string): Promise<Res> {
  const session = await requireModulo('proyectos', 'editar');
  const admin = createAdminClient();

  // remanente de la caja chica → vuelve a caja central
  const { data: cajaSaldo } = await admin.from('v_cajas_saldos').select('*').eq('proyecto_id', proyectoId).eq('tipo', 'chica').limit(1).single();
  const { data: central } = await admin.from('cajas').select('id').eq('tipo', 'central').limit(1).single();
  const remanente = Number(cajaSaldo?.saldo_actual ?? 0);
  const cajaId = cajaSaldo?.caja_id ?? null;
  if (cajaId && central && remanente > 0) {
    await admin.from('movimientos_caja').insert([
      { caja_id: cajaId, proyecto_id: proyectoId, tipo: 'traslado', monto: -remanente, concepto: 'Cierre de obra: remanente a caja central', created_by: session.id },
      { caja_id: central.id, proyecto_id: null, tipo: 'traslado', monto: remanente, concepto: `Cierre de obra ${proyectoId}: remanente recibido`, created_by: session.id },
    ]);
    await admin.from('cajas').update({ activa: false }).eq('id', cajaId);
  }

  const { error } = await admin.from('proyectos').update({ estado: 'liquidado' }).eq('id', proyectoId);
  if (error) return { ok: false, error: error.message };
  await notifyRoles(['gerencia', 'administrador'], { title: 'Proyecto liquidado', body: 'Se cerró y liquidó un proyecto.', url: `/proyectos/${proyectoId}` }, 'proyectos');
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Mantenimiento programado (Sec. 3.6 / 7.2) ───────────────────────────
const PASO_DIAS: Record<string, number> = { semanal: 7, quincenal: 15, mensual: 30, trimestral: 90, semestral: 180 };

function sumarDias(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function generarServiciosMantenimiento(
  proyectoId: string,
  input: { categoria: string; descripcion?: string; monto: number; recurrencia: string; inicio: string; repeticiones: number; dias_aviso: number },
): Promise<Res> {
  await guard();
  const supabase = createClient();
  const reps = input.recurrencia === 'unica' ? 1 : Math.max(1, Math.min(60, input.repeticiones || 1));
  const paso = PASO_DIAS[input.recurrencia] ?? 0;
  const filas = Array.from({ length: reps }, (_, i) => ({
    proyecto_id: proyectoId,
    categoria: input.categoria,
    descripcion: input.descripcion || null,
    fecha_planificada: paso ? sumarDias(input.inicio, paso * i) : input.inicio,
    monto: input.monto || 0,
    recurrencia: input.recurrencia as never,
    dias_aviso: input.dias_aviso || 7,
    estado: 'programado',
  }));
  const { error } = await supabase.from('servicios_mantenimiento').insert(filas);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function actualizarServicio(proyectoId: string, id: string, patch: Record<string, unknown>): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { error } = await supabase.from('servicios_mantenimiento').update(patch as never).eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

export async function eliminarServicio(proyectoId: string, id: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  await supabase.from('servicios_mantenimiento').delete().eq('id', id);
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Hitos ───────────────────────────────────────────────────────────────
export async function guardarHito(proyectoId: string, nombre: string, fecha: string): Promise<Res> {
  await guard();
  const supabase = createClient();
  const { error } = await supabase.from('hitos').insert({ proyecto_id: proyectoId, nombre, fecha_comprometida: fecha });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

// ── Valorización: notificar corte (jueves) ──────────────────────────────
export async function notificarValorizacionPendiente(proyectoId: string, nombre: string): Promise<Res> {
  await guard();
  await notifyRoles(['jefe_proyectos'], {
    title: 'Valorización por emitir',
    body: `Llegó la fecha de corte para ${nombre}.`,
    url: `/proyectos/${proyectoId}`,
  }, 'proyectos');
  return { ok: true };
}
