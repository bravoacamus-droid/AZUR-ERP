import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyRoles } from '@/lib/push/notify';
import { todayLimaISO, nowLima, fmtMoney } from '@/lib/format';
import { saludRegla1, saludRegla2 } from '@/lib/salud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Tipos de alerta generados automáticamente (se limpian y regeneran cada corrida).
const AUTO_TIPOS = ['cotizacion_por_vencer', 'cotizacion_vencida', 'hito_riesgo', 'armada_vencer', 'sobretiempo', 'caja_inactiva', 'salud_caja', 'sobrecosto_avance'];

const DIAS_AVISO = 3;       // avisar N días antes de un vencimiento
const DIAS_CAJA_INACTIVA = 15;

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  // Seguridad: si hay CRON_SECRET, exigir el header de Vercel Cron.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const hoy = todayLimaISO();
  const limite = addDays(hoy, DIAS_AVISO);
  const alertas: { tipo: string; severidad: 'info' | 'advertencia' | 'critica'; proyecto_id: string | null; titulo: string; detalle: string }[] = [];
  const resumen: string[] = [];

  // limpia alertas automáticas previas no resueltas
  await admin.from('alertas').delete().eq('resuelta', false).in('tipo', AUTO_TIPOS);

  // 1) Cotizaciones por vencer / vencidas
  const { data: cots } = await admin
    .from('cotizaciones')
    .select('id, codigo, proyecto_nombre, fecha, vigencia_dias, estado')
    .in('estado', ['enviada', 'en_negociacion']);
  let vencidas = 0, porVencer = 0;
  for (const c of cots ?? []) {
    const venc = addDays(c.fecha as string, Number(c.vigencia_dias ?? 7));
    if (venc < hoy) {
      await admin.from('cotizaciones').update({ estado: 'vencida' }).eq('id', c.id);
      alertas.push({ tipo: 'cotizacion_vencida', severidad: 'advertencia', proyecto_id: null, titulo: `Cotización vencida: ${c.codigo}`, detalle: `${c.proyecto_nombre} venció el ${venc}. Gestionar reactivación.` });
      vencidas++;
    } else if (venc <= limite) {
      alertas.push({ tipo: 'cotizacion_por_vencer', severidad: 'info', proyecto_id: null, titulo: `Cotización por vencer: ${c.codigo}`, detalle: `${c.proyecto_nombre} vence el ${venc}.` });
      porVencer++;
    }
  }
  if (vencidas || porVencer) resumen.push(`${vencidas} cotización(es) vencida(s), ${porVencer} por vencer`);

  // 2) Hitos en riesgo / vencidos
  const { data: hitos } = await admin
    .from('hitos')
    .select('id, nombre, fecha_comprometida, proyecto_id, proyecto:proyectos(nombre)')
    .eq('cumplido', false)
    .lte('fecha_comprometida', limite);
  for (const h of hitos ?? []) {
    const vencido = (h.fecha_comprometida as string) < hoy;
    alertas.push({ tipo: 'hito_riesgo', severidad: vencido ? 'critica' : 'advertencia', proyecto_id: h.proyecto_id, titulo: `Hito ${vencido ? 'vencido' : 'por vencer'}: ${h.nombre}`, detalle: `${(h.proyecto as { nombre?: string } | null)?.nombre ?? ''} · ${h.fecha_comprometida}` });
  }
  if (hitos?.length) resumen.push(`${hitos.length} hito(s) en riesgo`);

  // 3) Armadas (cobros) por vencer
  const { data: armadas } = await admin
    .from('cronograma_cobros')
    .select('id, concepto, monto, fecha_esperada, proyecto_id, proyecto:proyectos(nombre)')
    .eq('estado', 'pendiente')
    .not('fecha_esperada', 'is', null)
    .lte('fecha_esperada', limite);
  for (const a of armadas ?? []) {
    alertas.push({ tipo: 'armada_vencer', severidad: 'advertencia', proyecto_id: a.proyecto_id, titulo: `Armada por facturar: ${a.concepto}`, detalle: `${(a.proyecto as { nombre?: string } | null)?.nombre ?? ''} · ${fmtMoney(Number(a.monto))} · ${a.fecha_esperada}` });
  }
  if (armadas?.length) resumen.push(`${armadas.length} armada(s) por facturar`);

  // 4) Proyectos con sobretiempo (fecha fin pasada y avance < 100%)
  const { data: proys } = await admin.from('proyectos').select('id, nombre, fecha_fin, estado').eq('estado', 'en_ejecucion');
  const { data: dash } = await admin.from('v_dashboard_proyecto').select('*');
  const dashById = new Map((dash ?? []).map((d) => [d.proyecto_id, d]));
  let sobretiempo = 0;
  for (const p of proys ?? []) {
    if (p.fecha_fin && (p.fecha_fin as string) < hoy) {
      const d = dashById.get(p.id);
      const valorizado = Number(d?.valorizado ?? 0);
      const contrato = Number(d?.proyectado ?? 0);
      const avance = contrato > 0 ? valorizado / contrato : 0;
      if (avance < 0.999) {
        alertas.push({ tipo: 'sobretiempo', severidad: 'critica', proyecto_id: p.id, titulo: `Sobretiempo: ${p.nombre}`, detalle: `Venció el ${p.fecha_fin} con avance ${Math.round(avance * 100)}%.` });
        sobretiempo++;
      }
    }
  }
  if (sobretiempo) resumen.push(`${sobretiempo} proyecto(s) en sobretiempo`);

  // 5) Salud financiera (reglas #1 y #2) por proyecto
  let salud = 0;
  for (const d of dash ?? []) {
    const nums = { proyectado: Number(d.proyectado ?? 0), pagos: Number(d.pagos ?? 0), gasto: Number(d.gasto ?? 0), valorizado: Number(d.valorizado ?? 0) };
    if (saludRegla1(nums) === 'critica') { alertas.push({ tipo: 'salud_caja', severidad: 'critica', proyecto_id: d.proyecto_id, titulo: `Gasto supera lo cobrado: ${d.nombre}`, detalle: `Gasto ${fmtMoney(nums.gasto)} > cobrado ${fmtMoney(nums.pagos)}.` }); salud++; }
    if (saludRegla2(nums) === 'critica') { alertas.push({ tipo: 'sobrecosto_avance', severidad: 'critica', proyecto_id: d.proyecto_id, titulo: `Gasto supera lo valorizado: ${d.nombre}`, detalle: `Gasto ${fmtMoney(nums.gasto)} > valorizado ${fmtMoney(nums.valorizado)}.` }); salud++; }
  }
  if (salud) resumen.push(`${salud} alerta(s) de salud financiera`);

  // 6) Cajas chicas sin movimiento por X días (proyectos activos)
  const { data: cajas } = await admin.from('cajas').select('id, nombre, proyecto_id, created_at, proyecto:proyectos(estado)').eq('tipo', 'chica');
  const corteCaja = addDays(hoy, -DIAS_CAJA_INACTIVA);
  for (const c of cajas ?? []) {
    if ((c.proyecto as { estado?: string } | null)?.estado !== 'en_ejecucion') continue;
    const { data: ult } = await admin.from('movimientos_caja').select('created_at').eq('caja_id', c.id).order('created_at', { ascending: false }).limit(1);
    const ultimo = ult?.[0]?.created_at?.slice(0, 10) ?? (c.created_at as string)?.slice(0, 10);
    if (ultimo && ultimo < corteCaja) {
      alertas.push({ tipo: 'caja_inactiva', severidad: 'info', proyecto_id: c.proyecto_id, titulo: `Caja sin movimientos: ${c.nombre}`, detalle: `Sin movimientos desde ${ultimo}.` });
    }
  }

  // Inserta todas las alertas
  if (alertas.length) await admin.from('alertas').insert(alertas);

  // 7) Recordatorio de valorización los jueves (día 4)
  const esJueves = nowLima().getDay() === 4;
  if (esJueves) {
    await notifyRoles(['jefe_proyectos'], { title: 'Valorización semanal por emitir', body: 'Hoy es jueves: consolida y emite las valorizaciones de la semana.', url: '/proyectos' }, 'cron');
  }

  // Digest push (sin correo) a Gerencia y Jefe de Proyectos
  if (resumen.length) {
    const body = resumen.join(' · ');
    await notifyRoles(['gerencia', 'jefe_proyectos'], { title: `Resumen AZUR ${hoy}`, body, url: '/alertas' }, 'cron');
  }
  // a comercial si hay novedades de cotizaciones
  if (vencidas || porVencer) {
    await notifyRoles(['comercial'], { title: 'Cotizaciones por gestionar', body: `${vencidas} vencida(s), ${porVencer} por vencer.`, url: '/comercial' }, 'cron');
  }

  return NextResponse.json({ ok: true, fecha: hoy, alertas: alertas.length, resumen, jueves: esJueves });
}
