import { Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { formatPEN } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Cajas' };

export default async function CajasPage() {
  await requireSession();
  const supabase = createClient();

  const { data } = await supabase
    .from('v_cajas_saldos')
    .select('*')
    .order('tipo')
    .order('nombre');

  const cajas = data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cajas"
        description="Caja central y cajas chicas por proyecto — saldo en tiempo real."
        icon={Wallet}
        breadcrumbs={[{ label: 'Finanzas' }, { label: 'Cajas' }]}
      />

      {cajas.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin cajas configuradas"
          description="Cuando se cree la caja central y las cajas chicas por proyecto, sus saldos aparecerán aquí en tiempo real."
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
              <div key={c.id} className="azur-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {c.tipo === 'central' ? 'Caja central' : 'Caja proyecto'}
                    </p>
                    <h3 className="mt-0.5 font-display text-base font-bold text-azur-ink">{c.nombre}</h3>
                  </div>
                  <Badge variant={saldo > 0 ? 'success' : 'warning'}>{c.moneda}</Badge>
                </div>
                <p className="mt-3 font-display text-2xl font-bold text-azur-red">{fmt(saldo)}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Entradas</p>
                    <p className="font-mono font-semibold text-success">{fmt(Number(c.entradas ?? 0))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Salidas</p>
                    <p className="font-mono font-semibold text-destructive">
                      {fmt(Number(c.salidas ?? 0))}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
