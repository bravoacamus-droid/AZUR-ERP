import { TrendingUp, TrendingDown, HardHat, BellRing, FileText, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { PageHeader, KpiCard } from '@/components/ui/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { BarraTresTramos } from '@/components/dashboard/barra-tres-tramos';
import { fmtMoney, fmtDateTime } from '@/lib/format';
import type { DashboardProyecto } from '@/lib/salud';

export const dynamic = 'force-dynamic';

export default async function InicioPage() {
  const session = await requireSession();
  const supabase = createClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  const mesISO = inicioMes.toISOString().slice(0, 10);

  const [{ data: dash }, { data: abonos }, { data: egresos }, { data: cotsNeg }, { data: solsPend }, { data: alertas }] =
    await Promise.all([
      supabase.from('v_dashboard_proyecto').select('*'),
      supabase.from('abonos_cliente').select('monto').gte('fecha', mesISO),
      supabase.from('solicitudes_pago').select('monto').in('status', ['pagada', 'conciliada']).gte('pagado_at', mesISO),
      supabase.from('cotizaciones').select('id').in('estado', ['enviada', 'en_negociacion']),
      supabase.from('solicitudes_pago').select('id').in('status', ['solicitada', 'aprobada']),
      supabase.from('alertas').select('*').eq('resuelta', false).order('created_at', { ascending: false }).limit(6),
    ]);

  const proyectos = (dash ?? []) as DashboardProyecto[];
  const ingresosMes = (abonos ?? []).reduce((a, r) => a + Number(r.monto), 0);
  const egresosMes = (egresos ?? []).reduce((a, r) => a + Number(r.monto), 0);
  const activos = proyectos.filter((p) => p.estado === 'en_ejecucion').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${session.nombre.split(' ')[0]} 👋`}
        description="Resumen ejecutivo de la operación AZUR en tiempo real."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Ingresos del mes" value={fmtMoney(ingresosMes)} icon={<TrendingUp />} tone="success" />
        <KpiCard label="Egresos del mes" value={fmtMoney(egresosMes)} icon={<TrendingDown />} tone="azur" />
        <KpiCard label="Proyectos activos" value={activos} sub={`${proyectos.length} en total`} icon={<HardHat />} />
        <KpiCard label="Alertas abiertas" value={alertas?.length ?? 0} icon={<BellRing />} tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Salud por proyecto</h2>
            <p className="text-xs text-muted-foreground">Proyectado · Pagos · Gasto (regla #1 y #2)</p>
          </div>
          {proyectos.length === 0 ? (
            <EmptyState titulo="Sin proyectos" descripcion="Crea un proyecto o acepta una cotización." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {proyectos.map((p) => (
                <BarraTresTramos key={p.proyecto_id} p={p} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="size-4 text-azur-600" /> Alertas críticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!alertas || alertas.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Todo en orden ✅</p>
              ) : (
                alertas.map((a) => (
                  <div key={a.id} className="rounded-lg border border-azur-100 bg-azur-50/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{a.titulo}</p>
                      <Badge variant={a.severidad === 'critica' ? 'danger' : 'warning'}>{a.severidad}</Badge>
                    </div>
                    {a.detalle && <p className="mt-1 text-xs text-muted-foreground">{a.detalle}</p>}
                    <p className="mt-1 text-[10px] text-muted-foreground/70">{fmtDateTime(a.created_at)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Cotizaciones abiertas" value={cotsNeg?.length ?? 0} icon={<FileText />} />
            <KpiCard label="Pagos por gestionar" value={solsPend?.length ?? 0} icon={<Wallet />} />
          </div>
        </div>
      </div>
    </div>
  );
}
