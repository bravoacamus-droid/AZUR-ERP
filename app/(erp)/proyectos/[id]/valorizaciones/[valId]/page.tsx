import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, FileSpreadsheet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPEN, formatNumber } from '@/lib/utils';
import { cambiarEstadoValorizacion } from '../actions';

export const dynamic = 'force-dynamic';

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

export default async function ValorizacionDetallePage({
  params,
}: {
  params: { id: string; valId: string };
}) {
  await requireSession();
  const supabase = createClient();

  const [{ data: val }, { data: totales }, { data: proyecto }] = await Promise.all([
    supabase.from('valorizaciones').select('*').eq('id', params.valId).single(),
    supabase.from('v_valorizacion_totales').select('*').eq('id', params.valId).single(),
    supabase.from('proyectos').select('id, codigo, nombre, moneda').eq('id', params.id).single(),
  ]);

  if (!val || !proyecto) notFound();

  const { data: partidas } = await supabase
    .from('valorizacion_partidas')
    .select(
      'id, partida:partida_id(codigo, descripcion, unidad), metrado_contractual, metrado_anterior, metrado_periodo, metrado_acumulado, precio_unitario, monto_periodo, monto_acumulado, porcentaje_acumulado, orden',
    )
    .eq('valorizacion_id', params.valId)
    .order('orden');

  const moneda = (proyecto.moneda as 'PEN' | 'USD') ?? 'PEN';
  const fmt = (n: number) =>
    moneda === 'USD'
      ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatPEN(n);

  const estado = val.estado as string;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Valorización N° ${val.numero}`}
        description={`${val.codigo} · ${proyecto.codigo} · ${proyecto.nombre}`}
        icon={FileSpreadsheet}
        breadcrumbs={[
          { label: 'Proyectos', href: '/proyectos' },
          { label: proyecto.codigo, href: `/proyectos/${params.id}` },
          { label: 'Valorizaciones', href: `/proyectos/${params.id}/valorizaciones` },
          { label: `N° ${val.numero}` },
        ]}
        actions={
          <>
            <a href={`/api/valorizaciones/${val.id}/pdf`} target="_blank" rel="noopener">
              <Button variant="secondary">
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </a>
            <Badge variant={VAL_VARIANT[estado] ?? 'secondary'}>{VAL_LABEL[estado] ?? estado}</Badge>
          </>
        }
      />

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Periodo
          </p>
          <p className="mt-1 text-sm font-bold text-azur-ink">
            {new Date(val.periodo_inicio).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
            {' → '}
            {new Date(val.periodo_fin).toLocaleDateString('es-PE', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Monto periodo
          </p>
          <p className="mt-1 font-display text-xl font-bold text-azur-red">
            {fmt(Number(totales?.monto_periodo ?? 0))}
          </p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Acumulado
          </p>
          <p className="mt-1 font-display text-xl font-bold text-azur-ink">
            {fmt(Number(totales?.monto_acumulado ?? 0))}
          </p>
        </div>
        <div className="azur-card bg-azur-gradient text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">A pagar</p>
          <p className="mt-1 font-display text-xl font-bold">
            {fmt(Number(totales?.monto_a_pagar ?? 0))}
          </p>
          <p className="mt-1 text-[11px] opacity-80">
            Retención {val.retencion_porcentaje}% · IGV {val.igv_porcentaje}%
          </p>
        </div>
      </div>

      {/* Tabla formato sector */}
      <div className="azur-card overflow-hidden p-0">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-azur-ink">Detalle por partida</h2>
          <p className="text-xs text-muted-foreground">
            Formato estándar del sector construcción: metrado contractual / anterior / periodo / acumulado.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-azur-coral/10 text-left uppercase tracking-wider text-azur-red">
              <tr>
                <th className="px-3 py-3 font-semibold">Código</th>
                <th className="px-3 py-3 font-semibold">Descripción</th>
                <th className="px-3 py-3 font-semibold">Und</th>
                <th className="px-3 py-3 text-right font-semibold">Metr. Contr.</th>
                <th className="px-3 py-3 text-right font-semibold">Metr. Ant.</th>
                <th className="px-3 py-3 text-right font-semibold">Metr. Periodo</th>
                <th className="px-3 py-3 text-right font-semibold">Metr. Acum.</th>
                <th className="px-3 py-3 text-right font-semibold">P. Unit.</th>
                <th className="px-3 py-3 text-right font-semibold">Periodo</th>
                <th className="px-3 py-3 text-right font-semibold">Acumulado</th>
                <th className="px-3 py-3 text-right font-semibold">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(partidas ?? []).map((p) => {
                const partida = Array.isArray(p.partida) ? p.partida[0] : p.partida;
                return (
                  <tr key={p.id} className="hover:bg-azur-coral/5">
                    <td className="px-3 py-2 font-mono text-azur-red">{partida?.codigo}</td>
                    <td className="px-3 py-2">{partida?.descripcion}</td>
                    <td className="px-3 py-2 text-muted-foreground">{partida?.unidad}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatNumber(Number(p.metrado_contractual))}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatNumber(Number(p.metrado_anterior))}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      {formatNumber(Number(p.metrado_periodo))}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{formatNumber(Number(p.metrado_acumulado))}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(Number(p.precio_unitario))}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(Number(p.monto_periodo))}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      {fmt(Number(p.monto_acumulado))}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-azur-red">
                      {Number(p.porcentaje_acumulado).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-azur-coral/5 text-sm">
              <tr>
                <td colSpan={8} className="px-3 py-3 text-right font-bold text-muted-foreground">
                  Subtotal del periodo
                </td>
                <td className="px-3 py-3 text-right font-mono text-base font-bold text-azur-red">
                  {fmt(Number(totales?.monto_periodo ?? 0))}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Acciones de estado */}
      {estado !== 'pagada' && estado !== 'rechazada' && (
        <div className="azur-card flex flex-wrap items-center justify-between gap-3 bg-azur-coral/10">
          <p className="font-display text-base font-bold text-azur-ink">Cambiar estado</p>
          <div className="flex flex-wrap gap-2">
            {(['enviada', 'aprobada', 'pagada', 'rechazada'] as const)
              .filter((e) => e !== estado)
              .map((e) => (
                <form key={e} action={cambiarEstadoValorizacion} className="contents">
                  <input type="hidden" name="id" value={val.id} />
                  <input type="hidden" name="proyecto_id" value={params.id} />
                  <input type="hidden" name="estado" value={e} />
                  <Button type="submit" variant={e === 'rechazada' ? 'destructive' : 'secondary'} size="sm">
                    Marcar como {VAL_LABEL[e]}
                  </Button>
                </form>
              ))}
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        <Link
          href={`/proyectos/${params.id}/valorizaciones`}
          className="inline-flex items-center gap-1 hover:text-azur-red"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Link>
      </p>
    </div>
  );
}
