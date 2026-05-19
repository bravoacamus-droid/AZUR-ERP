import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Building2,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN } from '@/lib/utils';
import { MovimientoForm } from './movimiento-form';
import { TrasladoDialog } from './traslado-dialog';

export const dynamic = 'force-dynamic';

const TIPO_ICON: Record<string, { icon: typeof ArrowDown; color: string; label: string }> = {
  entrada: { icon: ArrowDown, color: 'text-success', label: 'Entrada' },
  salida: { icon: ArrowUp, color: 'text-destructive', label: 'Salida' },
  traslado_in: { icon: ArrowDown, color: 'text-success', label: 'Traslado entrada' },
  traslado_out: { icon: ArrowUp, color: 'text-destructive', label: 'Traslado salida' },
};

export default async function CajaDetallePage({ params }: { params: { id: string } }) {
  await requireSession();
  const supabase = createClient();

  const [{ data: caja }, { data: saldoRow }] = await Promise.all([
    supabase
      .from('cajas')
      .select('id, nombre, tipo, moneda, saldo_inicial, proyecto_id, proyecto:proyecto_id(codigo, nombre)')
      .eq('id', params.id)
      .single(),
    supabase.from('v_cajas_saldos').select('*').eq('id', params.id).single(),
  ]);

  if (!caja) notFound();

  // Cajas posibles destino para traslado (misma moneda, distinta de la actual, activas)
  const { data: destinosRaw } = await supabase
    .from('v_cajas_saldos')
    .select('id, nombre, tipo, moneda, saldo_actual')
    .eq('moneda', caja.moneda)
    .neq('id', caja.id);
  const cajasDestino = (destinosRaw ?? []).map((d) => ({
    id: d.id as string,
    nombre: d.nombre as string,
    tipo: d.tipo as string,
    moneda: d.moneda as string,
    saldo_actual: Number(d.saldo_actual ?? 0),
  }));

  const { data: movsRaw } = await supabase
    .from('caja_movimientos')
    .select('id, tipo, fecha, concepto, monto, referencia, registrado_por, created_at')
    .eq('caja_id', params.id)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  const movs = movsRaw ?? [];

  // Perfiles
  const userIds = [...new Set(movs.map((m) => m.registrado_por).filter(Boolean))] as string[];
  const perfilMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    (perfiles ?? []).forEach((p) => perfilMap.set(p.id, p.full_name));
  }

  const moneda = (caja.moneda as 'PEN' | 'USD') ?? 'PEN';
  const fmt = (n: number) =>
    moneda === 'USD'
      ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatPEN(n);

  const saldo = Number(saldoRow?.saldo_actual ?? caja.saldo_inicial ?? 0);
  const entradas = Number(saldoRow?.entradas ?? 0);
  const salidas = Number(saldoRow?.salidas ?? 0);
  const proyecto = Array.isArray(caja.proyecto) ? caja.proyecto[0] : caja.proyecto;

  return (
    <div className="space-y-8">
      <PageHeader
        title={caja.nombre}
        description={
          caja.tipo === 'central'
            ? `Caja central · ${moneda}`
            : proyecto
              ? `Caja chica del proyecto ${proyecto.codigo} · ${proyecto.nombre}`
              : 'Caja chica de proyecto'
        }
        icon={Wallet}
        breadcrumbs={[
          { label: 'Finanzas' },
          { label: 'Cajas', href: '/finanzas/cajas' },
          { label: caja.nombre },
        ]}
        actions={
          <TrasladoDialog
            cajaOrigenId={caja.id}
            cajaOrigenNombre={caja.nombre}
            cajaOrigenMoneda={caja.moneda}
            saldoOrigen={saldo}
            cajasDestino={cajasDestino}
          />
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="azur-card bg-azur-gradient text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Saldo actual</p>
          <p className="mt-1 font-display text-3xl font-bold">{fmt(saldo)}</p>
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Saldo inicial
          </p>
          <p className="mt-1 font-display text-xl font-bold text-azur-ink">
            {fmt(Number(caja.saldo_inicial ?? 0))}
          </p>
        </div>
        <div className="azur-card">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-success">
            <ArrowDown className="h-3 w-3" />
            Entradas
          </p>
          <p className="mt-1 font-display text-xl font-bold text-success">{fmt(entradas)}</p>
        </div>
        <div className="azur-card">
          <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
            <ArrowUp className="h-3 w-3" />
            Salidas
          </p>
          <p className="mt-1 font-display text-xl font-bold text-destructive">{fmt(salidas)}</p>
        </div>
      </div>

      {proyecto && (
        <div className="azur-card flex items-center gap-3">
          <Building2 className="h-5 w-5 text-azur-red" />
          <Link
            href={`/proyectos/${caja.proyecto_id}`}
            className="font-display text-base font-bold text-azur-red hover:underline"
          >
            {proyecto.codigo} · {proyecto.nombre}
          </Link>
        </div>
      )}

      {/* Form de movimiento */}
      <MovimientoForm cajaId={caja.id} />

      {/* Lista de movimientos */}
      <section className="azur-card overflow-hidden p-0">
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-azur-ink">Historial de movimientos</h2>
            <p className="text-xs text-muted-foreground">
              {movs.length} movimiento(s) registrado(s) · máx 100 mostrados
            </p>
          </div>
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        </header>

        {movs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Wallet}
              title="Sin movimientos"
              description="Usa el formulario de arriba para registrar la primera entrada o salida."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Concepto</th>
                  <th className="px-4 py-3 font-semibold">Referencia</th>
                  <th className="px-4 py-3 font-semibold">Registrado por</th>
                  <th className="px-4 py-3 text-right font-semibold">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {movs.map((m) => {
                  const cfg = TIPO_ICON[m.tipo] ?? TIPO_ICON.entrada;
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  const isOut = m.tipo === 'salida' || m.tipo === 'traslado_out';
                  return (
                    <tr key={m.id} className="hover:bg-azur-coral/5">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 ${cfg.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">{cfg.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {new Date(m.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2.5 text-azur-ink">{m.concepto}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {m.referencia ? <code>{m.referencia}</code> : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {m.registrado_por ? perfilMap.get(m.registrado_por) ?? '—' : '—'}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-mono font-semibold ${
                          isOut ? 'text-destructive' : 'text-success'
                        }`}
                      >
                        {isOut ? '−' : '+'}
                        {fmt(Number(m.monto))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-2 text-xs text-muted-foreground">
        <Link href="/finanzas/cajas" className="inline-flex items-center gap-1 hover:text-azur-red">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a cajas
        </Link>
      </p>
    </div>
  );
}
