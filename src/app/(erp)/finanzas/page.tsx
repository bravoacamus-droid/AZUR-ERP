import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { puedeEditar } from '@/lib/permisos';
import { PageHeader, KpiCard } from '@/components/ui/page';
import { Wallet, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { FinanzasClient } from './finanzas-client';
import { fmtMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function FinanzasPage() {
  const session = await requireModulo('finanzas', 'ver');
  const supabase = createClient();

  const [sols, facturas, armadas, cajas, clientes, proyectos, contrapartes, perfiles, dashboards, categorias] = await Promise.all([
    supabase.from('solicitudes_pago').select('*, proyecto:proyectos(nombre), solicitante:profiles!solicitudes_pago_solicitado_por_fkey(nombre)').order('created_at', { ascending: false }),
    supabase.from('facturas').select('*, cliente:clientes(razon_social), proyecto:proyectos(nombre)').order('created_at', { ascending: false }),
    supabase.from('cronograma_cobros').select('*, proyecto:proyectos(nombre)').in('estado', ['pendiente', 'por_facturar']).order('fecha_esperada'),
    supabase.from('v_cajas_saldos').select('*'),
    supabase.from('clientes').select('id, razon_social').order('razon_social'),
    supabase.from('proyectos').select('id, nombre').order('nombre'),
    (supabase as unknown as { from: (t: string) => any }).from('contrapartes').select('id, razon_social, ruc_dni, banco, cuenta, cci, validado, created_by').order('razon_social'),
    supabase.from('profiles').select('id, nombre, rol').eq('activo', true).order('nombre'),
    supabase.from('v_dashboard_proyecto').select('proyecto_id, codigo, nombre, estado, proyectado, pagos, gasto, valorizado'),
    (supabase as unknown as { from: (t: string) => any }).from('categorias_gasto').select('id, nombre, tipo_base, activo').eq('activo', true).order('nombre'),
  ]);
  const contrapartesAll = (contrapartes.data ?? []) as any[];
  const contrapartesOk = contrapartesAll.filter((c) => c.validado !== false);
  const proveedoresPend = contrapartesAll.filter((c) => c.validado === false);
  const medios = await supabase.from('medios_pago_empresa').select('id, banco, titular, cuenta_soles, cci_soles, cuenta_dolares, cci_dolares').order('orden');

  // Jornales: tareo APROBADO (pendiente de pago) consolidado POR PERSONA,
  // con desglose por proyecto y total (una persona en varios proyectos = 1 fila).
  const { data: tareoAprob } = await (supabase as unknown as { from: (t: string) => any }).from('tareo')
    .select('id, proyecto_id, trabajador_id, trabajador_nombre, presente, horas, horas_extra, tarifa_dia, fecha, proyecto:proyectos(nombre)')
    .eq('estado', 'aprobado').order('fecha');
  const consMap = new Map<string, any>();
  (tareoAprob ?? []).forEach((r: any) => {
    const key = r.trabajador_id || `n:${r.trabajador_nombre}`;
    const dia = r.presente ? 1 : 0;
    const tarifa = Number(r.tarifa_dia ?? 0);
    const p = consMap.get(key) ?? { key, trabajadorId: r.trabajador_id ?? null, nombre: r.trabajador_nombre, tarifa, dias: 0, horas: 0, extra: 0, monto: 0, ids: [] as string[], proyectos: new Map<string, any>() };
    p.dias += dia; p.horas += Number(r.horas ?? 0); p.extra += Number(r.horas_extra ?? 0);
    p.monto += dia * tarifa; p.tarifa = tarifa || p.tarifa; p.ids.push(r.id);
    const pr = p.proyectos.get(r.proyecto_id) ?? { nombre: r.proyecto?.nombre ?? 'Proyecto', dias: 0, horas: 0, extra: 0, monto: 0 };
    pr.dias += dia; pr.horas += Number(r.horas ?? 0); pr.extra += Number(r.horas_extra ?? 0); pr.monto += dia * tarifa;
    p.proyectos.set(r.proyecto_id, pr);
    consMap.set(key, p);
  });
  const jornales = [...consMap.values()].map((p) => ({ ...p, proyectos: [...p.proyectos.values()] })).sort((a, b) => b.monto - a.monto);
  const jornalesTotal = jornales.reduce((a, j) => a + j.monto, 0);

  const solicitudes = sols.data ?? [];
  const pendientes = solicitudes.filter((s) => ['solicitada', 'aprobada', 'programada'].includes(s.status));
  const porPagar = pendientes.reduce((a, s) => a + Number(s.monto), 0);
  const cobranzaPend = (facturas.data ?? []).filter((f) => f.estado !== 'cobrada' && f.estado !== 'anulada').reduce((a, f) => a + (Number(f.monto) - Number(f.monto_cobrado)), 0);
  const cajaTotal = (cajas.data ?? []).reduce((a, c) => a + Number(c.saldo_actual ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Finanzas y Administración" description="Solicitud → aprobación → pago → comprobante. CxC, CxP y cajas." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Por pagar (CxP)" value={fmtMoney(porPagar)} icon={<Clock />} tone="azur" />
        <KpiCard label="Por cobrar (CxC)" value={fmtMoney(cobranzaPend)} icon={<AlertCircle />} tone="warning" />
        <KpiCard label="Saldo en cajas" value={fmtMoney(cajaTotal)} icon={<Wallet />} />
        <KpiCard label="Solicitudes pendientes" value={pendientes.length} icon={<CheckCircle2 />} />
      </div>

      <FinanzasClient
        rol={session.rol}
        canEdit={puedeEditar(session.permisos, 'finanzas')}
        solicitudes={solicitudes}
        facturas={facturas.data ?? []}
        armadas={armadas.data ?? []}
        cajas={cajas.data ?? []}
        clientes={clientes.data ?? []}
        proyectos={proyectos.data ?? []}
        perfiles={perfiles.data ?? []}
        dashboards={dashboards.data ?? []}
        medios={medios.data ?? []}
        contrapartes={contrapartesOk}
        proveedoresPend={proveedoresPend}
        categorias={categorias.data ?? []}
        jornales={jornales}
        jornalesTotal={jornalesTotal}
      />
    </div>
  );
}
