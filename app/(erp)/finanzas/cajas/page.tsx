import Link from 'next/link';
import { Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { formatPEN } from '@/lib/utils';
import { NuevaCajaDialog } from './nueva-caja-dialog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cajas' };

export default async function CajasPage() {
  await requireSession();
  const supabase = createClient();

  const [{ data }, { data: proyectos }] = await Promise.all([
    supabase.from('v_cajas_saldos').select('*').order('tipo').order('nombre'),
    supabase
      .from('proyectos')
      .select('id, codigo, nombre')
      .neq('estado', 'cancelado')
      .order('codigo', { ascending: false }),
  ]);

  const cajas = data ?? [];

  // Totales por moneda
  const totalesPorMoneda = new Map<string, number>();
  for (const c of cajas) {
    const m = (c.moneda as string) ?? 'PEN';
    totalesPorMoneda.set(m, (totalesPorMoneda.get(m) ?? 0) + Number(c.saldo_actual ?? 0));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cajas"
        description="Caja central y cajas chicas por proyecto — saldo en tiempo real."
        icon={Wallet}
        breadcrumbs={[{ label: 'Finanzas' }, { label: 'Cajas' }]}
        actions={<NuevaCajaDialog proyectos={proyectos ?? []} />}
      />

      {/* Totales consolidados */}
      {totalesPorMoneda.size > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...totalesPorMoneda.entries()].map(([moneda, total]) => (
            <div key={moneda} className="azur-card bg-azur-gradient text-white">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                Saldo total {moneda}
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {moneda === 'USD'
                  ? `$ ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : formatPEN(total)}
              </p>
            </div>
          ))}
          <div className="azur-card">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Cajas activas
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-azur-ink">{cajas.length}</p>
          </div>
        </div>
      )}

      {cajas.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin cajas configuradas"
          description="Crea la primera caja con el botón 'Nueva caja' arriba. Sugerencia: una caja central + una caja chica por cada proyecto activo."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cajas.map((c) => {
            const saldo = Number(c.saldo_actual ?? 0);
            const fmt = (n: number) =>
              c.moneda === 'USD'
                ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : formatPEN(n);
            return (
              <Link
                key={c.id}
                href={`/finanzas/cajas/${c.id}`}
                className="azur-card group transition-all hover:-translate-y-0.5 hover:shadow-azur-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.tipo === 'central' ? 'Caja central' : 'Caja proyecto'}
                    </p>
                    <h3 className="mt-0.5 font-display text-base font-bold text-azur-ink">
                      {c.nombre}
                    </h3>
                  </div>
                  <Badge variant={saldo > 0 ? 'success' : 'warning'}>{c.moneda}</Badge>
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-azur-red">{fmt(saldo)}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Entradas</p>
                    <p className="font-mono font-semibold text-success">
                      {fmt(Number(c.entradas ?? 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Salidas</p>
                    <p className="font-mono font-semibold text-destructive">
                      {fmt(Number(c.salidas ?? 0))}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-semibold text-azur-red opacity-0 transition-opacity group-hover:opacity-100">
                  Ver movimientos →
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
