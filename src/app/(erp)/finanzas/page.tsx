import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { PageHeader, KpiCard } from '@/components/ui/page';
import { Wallet, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { FinanzasClient } from './finanzas-client';
import { fmtMoney } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function FinanzasPage() {
  const session = await requireRol(['gerencia', 'jefe_proyectos', 'administrador']);
  const supabase = createClient();

  const [sols, facturas, armadas, cajas, clientes, proyectos] = await Promise.all([
    supabase.from('solicitudes_pago').select('*, proyecto:proyectos(nombre), solicitante:profiles!solicitudes_pago_solicitado_por_fkey(nombre)').order('created_at', { ascending: false }),
    supabase.from('facturas').select('*, cliente:clientes(razon_social), proyecto:proyectos(nombre)').order('created_at', { ascending: false }),
    supabase.from('cronograma_cobros').select('*, proyecto:proyectos(nombre)').in('estado', ['pendiente', 'por_facturar']).order('fecha_esperada'),
    supabase.from('v_cajas_saldos').select('*'),
    supabase.from('clientes').select('id, razon_social').order('razon_social'),
    supabase.from('proyectos').select('id, nombre').order('nombre'),
  ]);

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
        solicitudes={solicitudes}
        facturas={facturas.data ?? []}
        armadas={armadas.data ?? []}
        cajas={cajas.data ?? []}
        clientes={clientes.data ?? []}
        proyectos={proyectos.data ?? []}
      />
    </div>
  );
}
