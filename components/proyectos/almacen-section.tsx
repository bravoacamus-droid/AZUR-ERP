import Link from 'next/link';
import { ArrowDownToLine, ArrowUpFromLine, Package, Warehouse } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';

type Props = { proyectoId: string };

const CATEGORIA_LABEL: Record<string, string> = {
  equipo: 'Herramienta',
  material: 'Material',
  libre: 'Texto libre',
};

const CATEGORIA_VARIANT: Record<string, 'default' | 'coral' | 'outline'> = {
  equipo: 'default',
  material: 'coral',
  libre: 'outline',
};

export async function AlmacenSection({ proyectoId }: Props) {
  const supabase = createClient();

  // Stock actual del proyecto (lo que está entregado y no devuelto)
  const { data: stockData } = await supabase
    .from('v_almacen_stock')
    .select('insumo_codigo, descripcion, categoria, unidad, total_salidas, total_devoluciones, disponible, ultimo_movimiento')
    .eq('proyecto_id', proyectoId)
    .gt('disponible', 0)
    .order('disponible', { ascending: false })
    .limit(10);

  const stock = stockData ?? [];

  // Últimos movimientos del proyecto
  const { data: movsData } = await supabase
    .from('almacen_movimientos')
    .select('id, fecha, tipo, descripcion, cantidad, unidad, responsable')
    .eq('proyecto_id', proyectoId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  const movs = movsData ?? [];

  // Totales del proyecto
  const totalItems = stock.length;
  const totalEntregado = stock.reduce((acc, s) => acc + Number(s.disponible ?? 0), 0);

  if (stock.length === 0 && movs.length === 0) {
    // No mostrar la sección si no hay nada
    return null;
  }

  return (
    <section className="azur-card p-0">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-azur-ink">
              Almacén del proyecto
            </h2>
            <p className="text-xs text-muted-foreground">
              {totalItems > 0
                ? `${totalItems} ítem(s) entregados a obra, sin devolver`
                : 'Sin material pendiente de devolución'}
            </p>
          </div>
        </div>
        <Link
          href={`/inventario?proyecto=${proyectoId}`}
          className="text-xs font-semibold text-azur-red hover:underline"
        >
          Ver todo →
        </Link>
      </header>

      {/* Stock actual */}
      {stock.length > 0 && (
        <div className="border-b border-border/60">
          <div className="px-6 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Existencias actuales en obra
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/5 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-6 py-2 font-semibold">Material / herramienta</th>
                  <th className="px-6 py-2 font-semibold">Categoría</th>
                  <th className="px-6 py-2 text-right font-semibold">Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {stock.map((s, i) => (
                  <tr key={`${s.descripcion}-${i}`} className="hover:bg-azur-coral/5">
                    <td className="px-6 py-2">
                      <p className="line-clamp-1 text-sm font-semibold text-azur-ink">
                        {s.descripcion}
                      </p>
                      {s.insumo_codigo && s.insumo_codigo !== '—' && (
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {s.insumo_codigo}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-2">
                      <Badge variant={CATEGORIA_VARIANT[s.categoria as string] ?? 'outline'}>
                        {CATEGORIA_LABEL[s.categoria as string] ?? s.categoria}
                      </Badge>
                    </td>
                    <td className="px-6 py-2 text-right">
                      <Badge variant="warning">
                        {Number(s.disponible).toLocaleString('es-PE')} {s.unidad}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Últimos movimientos */}
      {movs.length > 0 && (
        <div>
          <div className="px-6 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Últimos movimientos
            </p>
          </div>
          <ul className="divide-y divide-border/40">
            {movs.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-6 py-2.5 hover:bg-azur-coral/5">
                <div
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                    m.tipo === 'salida'
                      ? 'bg-azur-coral/20 text-azur-red'
                      : 'bg-success/15 text-success'
                  }`}
                >
                  {m.tipo === 'salida' ? (
                    <ArrowUpFromLine className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownToLine className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-semibold text-azur-ink">
                    {m.descripcion}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(m.fecha).toLocaleDateString('es-PE', {
                      timeZone: 'America/Lima',
                      day: '2-digit',
                      month: 'short',
                    })}
                    {m.responsable && ` · ${m.responsable}`}
                  </p>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {Number(m.cantidad).toLocaleString('es-PE')} {m.unidad}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      <footer className="border-t border-border/60 bg-muted/20 px-6 py-2.5 text-[11px] text-muted-foreground">
        El residente registra cada salida/devolución desde la PWA · Almacén.
      </footer>
    </section>
  );
}
