import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, MinusCircle, PlusCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN } from '@/lib/utils';
import { crearAdicionalDeductivo } from '../valorizaciones/actions';

export const dynamic = 'force-dynamic';

export default async function AdicionalesPage({ params }: { params: { id: string } }) {
  await requireSession();
  const supabase = createClient();

  const { data: proyecto } = await supabase
    .from('proyectos')
    .select('id, codigo, nombre, moneda, presupuesto_venta')
    .eq('id', params.id)
    .single();

  if (!proyecto) notFound();

  const { data: items } = await supabase
    .from('adicionales_deductivos')
    .select('*')
    .eq('proyecto_id', params.id)
    .order('fecha', { ascending: false });

  const moneda = (proyecto.moneda as 'PEN' | 'USD') ?? 'PEN';
  const fmt = (n: number) =>
    moneda === 'USD'
      ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatPEN(n);

  const adicionales = (items ?? []).filter((i) => i.tipo === 'adicional');
  const deductivos = (items ?? []).filter((i) => i.tipo === 'deductivo');
  const totalAdic = adicionales.reduce((s, i) => s + Number(i.monto), 0);
  const totalDed = deductivos.reduce((s, i) => s + Number(i.monto), 0);
  const presupuestoBase = Number(proyecto.presupuesto_venta ?? 0);
  const presupuestoVigente = presupuestoBase + totalAdic - totalDed;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Adicionales y Deductivos · ${proyecto.codigo}`}
        description="Modificaciones al contrato — afectan el presupuesto vigente y la Curva S."
        icon={FileText}
        breadcrumbs={[
          { label: 'Proyectos', href: '/proyectos' },
          { label: proyecto.codigo, href: `/proyectos/${params.id}` },
          { label: 'Adicionales / Deductivos' },
        ]}
      />

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contrato base
          </p>
          <p className="mt-1 font-display text-xl font-bold text-azur-ink">
            {fmt(presupuestoBase)}
          </p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Adicionales (+)
          </p>
          <p className="mt-1 font-display text-xl font-bold text-success">{fmt(totalAdic)}</p>
          <p className="text-[10px] text-muted-foreground">{adicionales.length} ítem(s)</p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Deductivos (−)
          </p>
          <p className="mt-1 font-display text-xl font-bold text-destructive">{fmt(totalDed)}</p>
          <p className="text-[10px] text-muted-foreground">{deductivos.length} ítem(s)</p>
        </div>
        <div className="azur-card bg-azur-gradient text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
            Presupuesto vigente
          </p>
          <p className="mt-1 font-display text-xl font-bold">{fmt(presupuestoVigente)}</p>
          <p className="text-[10px] opacity-80">Base ± modificaciones</p>
        </div>
      </div>

      {/* Form */}
      <form action={crearAdicionalDeductivo} className="azur-card space-y-3">
        <input type="hidden" name="proyecto_id" value={params.id} />
        <h2 className="font-display text-lg font-bold text-azur-ink">Nueva modificación</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              name="tipo"
              required
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
            >
              <option value="adicional">Adicional (+)</option>
              <option value="deductivo">Deductivo (−)</option>
            </select>
          </div>
          <div>
            <Label htmlFor="monto">Monto</Label>
            <Input id="monto" name="monto" type="number" step="0.01" min={0.01} required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              id="descripcion"
              name="descripcion"
              required
              minLength={3}
              placeholder="Ej. Cambio de revestimiento de piso en hall principal"
            />
          </div>
          <div className="sm:col-span-4">
            <Label htmlFor="sustento">Sustento (motivo, oficio, etc.)</Label>
            <textarea
              id="sustento"
              name="sustento"
              rows={2}
              className="flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit">Registrar</Button>
        </div>
      </form>

      {/* Lista */}
      {(!items || items.length === 0) ? (
        <EmptyState
          icon={FileText}
          title="Sin modificaciones"
          description="Los adicionales y deductivos modifican el presupuesto vigente y se reflejan en la Curva S del proyecto."
        />
      ) : (
        <div className="azur-card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
              <tr>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-azur-coral/5">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-azur-red">
                    {i.codigo}
                  </td>
                  <td className="px-4 py-2.5">
                    {i.tipo === 'adicional' ? (
                      <Badge variant="success" className="gap-1">
                        <PlusCircle className="h-3 w-3" />
                        Adicional
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1">
                        <MinusCircle className="h-3 w-3" />
                        Deductivo
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-azur-ink">{i.descripcion}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(i.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={i.aprobado ? 'success' : 'warning'}>
                      {i.aprobado ? 'Aprobado' : 'Pendiente'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-azur-ink">
                    {fmt(Number(i.monto))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        <Link
          href={`/proyectos/${params.id}`}
          className="inline-flex items-center gap-1 hover:text-azur-red"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al proyecto
        </Link>
      </p>
    </div>
  );
}
