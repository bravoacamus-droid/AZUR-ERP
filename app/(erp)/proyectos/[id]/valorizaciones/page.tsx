import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarRange, FileSpreadsheet, LineChart, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { CurvaSChart, type CurvaSPoint } from '@/components/charts/curva-s';
import { formatPEN, formatPercent } from '@/lib/utils';
import { generarValorizacion } from './actions';
import { GenerarForm } from './generar-form';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Valorizaciones' };

const VAL_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aprobada: 'Aprobada',
  pagada: 'Pagada',
  rechazada: 'Rechazada',
};

const VAL_VARIANT: Record<string, 'secondary' | 'coral' | 'success' | 'default' | 'destructive'> = {
  borrador: 'secondary',
  enviada: 'coral',
  aprobada: 'success',
  pagada: 'default',
  rechazada: 'destructive',
};

export default async function ValorizacionesPage({ params }: { params: { id: string } }) {
  await requireSession();
  const supabase = createClient();

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('id, codigo, nombre, moneda, presupuesto_venta')
    .eq('id', params.id)
    .single();

  if (!proyecto) notFound();

  const { data: vals } = await supabase
    .from('v_valorizacion_totales')
    .select('*')
    .eq('proyecto_id', params.id)
    .order('numero', { ascending: false });

  const { data: curva } = await supabase
    .from('v_curva_s')
    .select('periodo, fecha, monto_periodo, monto_acumulado')
    .eq('proyecto_id', params.id)
    .order('periodo');

  const moneda = (proyecto.moneda as 'PEN' | 'USD') ?? 'PEN';
  const fmt = (n: number) =>
    moneda === 'USD'
      ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatPEN(n);

  const presupuestoVenta = Number(proyecto.presupuesto_venta ?? 0);
  const totalEjecutado = (vals ?? []).reduce(
    (sum, v) => sum + Number(v.monto_periodo ?? 0),
    0,
  );

  // Construir curva con linea planificada lineal (referencia para Curva S)
  const periodosTotal = Math.max((curva ?? []).length, 8);
  const data: CurvaSPoint[] = (curva ?? []).map((p, i) => ({
    periodo: Number(p.periodo),
    fecha: p.fecha as string,
    ejecutado: Number(p.monto_acumulado),
    planificado: presupuestoVenta * ((i + 1) / periodosTotal),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Valorizaciones · ${proyecto.codigo}`}
        description={`${proyecto.nombre} · ${vals?.length ?? 0} valorización(es) generada(s)`}
        icon={FileSpreadsheet}
        breadcrumbs={[
          { label: 'Proyectos', href: '/proyectos' },
          { label: proyecto.codigo, href: `/proyectos/${params.id}` },
          { label: 'Valorizaciones' },
        ]}
        actions={
          <Link href={`/proyectos/${params.id}/adicionales`}>
            <Button variant="secondary">Adicionales / Deductivos</Button>
          </Link>
        }
      />

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total contrato
          </p>
          <p className="mt-1 font-display text-xl font-bold text-azur-ink">{fmt(presupuestoVenta)}</p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Valorizado acumulado
          </p>
          <p className="mt-1 font-display text-xl font-bold text-azur-red">{fmt(totalEjecutado)}</p>
        </div>
        <div className="azur-card bg-azur-gradient text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">% del contrato</p>
          <p className="mt-1 font-display text-2xl font-bold">
            {presupuestoVenta > 0
              ? formatPercent(totalEjecutado / presupuestoVenta)
              : formatPercent(0)}
          </p>
        </div>
      </div>

      {/* Curva S */}
      <section className="azur-card space-y-3">
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-azur-red" />
          <h2 className="font-display text-lg font-bold text-azur-ink">Curva S</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Ejecutado acumulado vs línea planificada lineal de referencia (basada en el presupuesto y el
          número de periodos).
        </p>
        <CurvaSChart data={data} moneda={moneda} />
      </section>

      {/* Generador */}
      <section className="azur-card space-y-3">
        <h2 className="font-display text-lg font-bold text-azur-ink">Generar nueva valorización</h2>
        <p className="text-xs text-muted-foreground">
          Toma el avance actual del proyecto (metrado ejecutado) y resta lo ya valorizado en periodos
          anteriores. El resultado es editable.
        </p>
        <GenerarForm proyectoId={params.id} />
      </section>

      {/* Lista */}
      {(!vals || vals.length === 0) ? (
        <EmptyState
          icon={CalendarRange}
          title="Sin valorizaciones aún"
          description="Define un periodo (típicamente quincena) y genera la primera valorización."
        />
      ) : (
        <div className="azur-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">N°</th>
                <th className="px-4 py-3 font-semibold">Periodo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Monto periodo</th>
                <th className="px-4 py-3 text-right font-semibold">A pagar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {vals.map((v) => (
                <tr key={v.id} className="hover:bg-azur-coral/5">
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/proyectos/${params.id}/valorizaciones/${v.id}`}
                      className="font-mono text-xs font-semibold text-azur-red hover:underline"
                    >
                      {v.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 font-bold">{v.numero}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {v.periodo_inicio
                      ? new Date(v.periodo_inicio).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
                          day: '2-digit',
                          month: 'short',
                        })
                      : '—'}{' '}
                    →{' '}
                    {v.periodo_fin
                      ? new Date(v.periodo_fin).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
                          day: '2-digit',
                          month: 'short',
                        })
                      : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={v.estado ? VAL_VARIANT[v.estado] ?? 'secondary' : 'secondary'}>
                      {v.estado ? VAL_LABEL[v.estado] ?? v.estado : '—'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    {fmt(Number(v.monto_periodo ?? 0))}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-azur-ink">
                    {fmt(Number(v.monto_a_pagar ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
