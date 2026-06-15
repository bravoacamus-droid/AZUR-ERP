import Link from 'next/link';
import { ChevronLeft, Package, History } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { fmtDateTime, fmtNumber } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { MovimientoForm } from './movimiento-form';

export const dynamic = 'force-dynamic';

const TIPO_MOV: Record<string, { label: string; variant: 'info' | 'warning' | 'success' }> = {
  ingreso: { label: 'Ingreso', variant: 'success' },
  salida: { label: 'Salida', variant: 'warning' },
  devolucion: { label: 'Devolución', variant: 'info' },
};

const TIPO_ITEM: Record<string, string> = {
  herramienta: 'Herramienta',
  material: 'Material',
  consumible: 'Consumible',
};

export default async function AlmacenPage() {
  await requireSession();
  const supabase = createClient();

  const [{ data: items }, { data: proyectos }, { data: movimientosRaw }] = await Promise.all([
    supabase.from('inventario_items').select('id, nombre, unidad, stock, tipo').order('nombre'),
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase
      .from('movimientos_almacen')
      .select('id, tipo, cantidad, created_at, inventario_items(nombre), proyectos(nombre)')
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

  type MovRow = {
    id: string;
    tipo: string;
    cantidad: number;
    created_at: string;
    inventario_items: { nombre: string } | null;
    proyectos: { nombre: string } | null;
  };
  const movimientos = (movimientosRaw ?? []) as unknown as MovRow[];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo" className="mb-1 inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Campo
        </Link>
        <h1 className="text-xl font-bold">Almacén</h1>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Package className="size-4 text-azur-600" />
          <p className="text-sm font-semibold">Inventario</p>
        </div>
        {!items || items.length === 0 ? (
          <EmptyState titulo="Sin ítems" descripcion="No hay ítems en el inventario." />
        ) : (
          <ul className="divide-y">
            {items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.nombre}</p>
                  <p className="text-xs text-muted-foreground">{TIPO_ITEM[i.tipo] ?? i.tipo}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{fmtNumber(i.stock, 0)}</p>
                  {i.unidad && <p className="text-xs text-muted-foreground">{i.unidad}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <MovimientoForm
        items={(items ?? []).map((i) => ({ id: i.id, nombre: i.nombre, unidad: i.unidad }))}
        proyectos={proyectos ?? []}
      />

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <History className="size-4 text-azur-600" />
          <p className="text-sm font-semibold">Movimientos recientes</p>
        </div>
        {movimientos.length === 0 ? (
          <EmptyState titulo="Sin movimientos" descripcion="Aún no hay movimientos registrados." />
        ) : (
          <ul className="divide-y">
            {movimientos.map((m) => {
              const item = m.inventario_items;
              const proy = m.proyectos;
              const t = TIPO_MOV[m.tipo] ?? { label: m.tipo, variant: 'info' as const };
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item?.nombre ?? 'Ítem'}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {fmtNumber(m.cantidad, 0)} und
                      {proy ? ` · ${proy.nombre}` : ''} · {fmtDateTime(m.created_at)}
                    </p>
                  </div>
                  <Badge variant={t.variant}>{t.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
