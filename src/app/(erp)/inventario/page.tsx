import { Boxes, PackageOpen, Wrench } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { puedeEditar } from '@/lib/permisos';
import { PageHeader, KpiCard } from '@/components/ui/page';
import {
  InventarioClient,
  type ItemRow,
  type ProyectoOpt,
  type MovimientoRow,
} from './inventario-client';

export const dynamic = 'force-dynamic';

export default async function InventarioPage() {
  const session = await requireModulo('inventario', 'ver');
  const canEdit = puedeEditar(session.permisos, 'inventario');
  const supabase = createClient();

  const [{ data: items }, { data: proyectos }, { data: movimientos }] = await Promise.all([
    supabase.from('inventario_items').select('id, codigo, nombre, unidad, stock, tipo').order('codigo'),
    supabase.from('proyectos').select('id, nombre, codigo').order('nombre'),
    supabase
      .from('movimientos_almacen')
      .select(
        'id, tipo, cantidad, created_at, item:inventario_items(codigo, nombre, unidad), proyecto:proyectos(nombre, codigo)',
      )
      .order('created_at', { ascending: false })
      .limit(30),
  ]);

  const itemRows = (items ?? []) as ItemRow[];
  const proyectoOpts = (proyectos ?? []) as ProyectoOpt[];
  const movimientoRows = (movimientos ?? []) as unknown as MovimientoRow[];

  const totalItems = itemRows.length;
  const herramientas = itemRows.filter((i) => i.tipo === 'herramienta').length;
  const sinStock = itemRows.filter((i) => Number(i.stock ?? 0) <= 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Almacén web: ítems, stock y movimientos (ingresos, salidas y devoluciones)."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <KpiCard label="Ítems registrados" value={totalItems} icon={<Boxes />} />
        <KpiCard label="Herramientas" value={herramientas} icon={<Wrench />} tone="azur" />
        <KpiCard label="Sin stock" value={sinStock} icon={<PackageOpen />} tone="warning" />
      </div>

      <InventarioClient items={itemRows} proyectos={proyectoOpts} movimientos={movimientoRows} canEdit={canEdit} />
    </div>
  );
}
