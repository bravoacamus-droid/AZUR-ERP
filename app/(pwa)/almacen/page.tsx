import Link from 'next/link';
import { ArrowDownToLine, ArrowUpFromLine, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { registrarMovimientoAlmacen } from './actions';

export const metadata = { title: 'Almacén' };
export const dynamic = 'force-dynamic';

const inputClass =
  'flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

export default async function AlmacenPage() {
  const session = await requireSession();
  const supabase = createClient();

  const { data: asignados } = await supabase
    .from('usuario_proyectos')
    .select('proyecto:proyecto_id(id, codigo, nombre)')
    .eq('user_id', session.userId)
    .eq('activo', true);

  let proyectos = (asignados ?? [])
    .map((a) => (Array.isArray(a.proyecto) ? a.proyecto[0] : a.proyecto))
    .filter(Boolean) as Array<{ id: string; codigo: string; nombre: string }>;

  if (proyectos.length === 0) {
    const { data } = await supabase
      .from('proyectos')
      .select('id, codigo, nombre')
      .neq('estado', 'cancelado')
      .order('codigo', { ascending: false })
      .limit(15);
    proyectos = data ?? [];
  }

  const proyectoIds = proyectos.map((p) => p.id);

  const { data: unidades } = await supabase.from('unidades_medida').select('codigo, nombre').order('codigo');

  const { data: movs } = proyectoIds.length
    ? await supabase
        .from('almacen_movimientos')
        .select('id, fecha, tipo, descripcion, cantidad, unidad, responsable, proyecto:proyecto_id(codigo)')
        .in('proyecto_id', proyectoIds)
        .order('fecha', { ascending: false })
        .limit(15)
    : { data: [] };

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <Link href="/inicio" className="text-xs font-semibold text-muted-foreground hover:text-azur-red">
          ← Inicio
        </Link>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-azur-ink">
          <Package className="h-6 w-6 text-azur-red" />
          Almacén
        </h1>
        <p className="text-sm text-muted-foreground">
          Registra salidas y devoluciones de herramientas/materiales por proyecto.
        </p>
      </header>

      {proyectos.length === 0 ? (
        <EmptyState icon={Package} title="Sin proyectos disponibles" />
      ) : (
        <form action={registrarMovimientoAlmacen} className="azur-card space-y-3">
          <h2 className="font-display text-base font-bold text-azur-ink">Nuevo movimiento</h2>
          <div className="space-y-2">
            <Label htmlFor="alm_proy">Proyecto</Label>
            <select name="proyecto_id" id="alm_proy" required className={inputClass}>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo} · {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select name="tipo" id="tipo" required className={inputClass} defaultValue="salida">
                <option value="salida">Salida</option>
                <option value="devolucion">Devolución</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidad">Unidad</Label>
              <select name="unidad" id="unidad" required className={inputClass} defaultValue="und">
                {(unidades ?? []).map((u) => (
                  <option key={u.codigo} value={u.codigo}>
                    {u.codigo}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input
              name="descripcion"
              id="descripcion"
              required
              minLength={3}
              placeholder="Ej. Taladro Bosch, andamio chico (2 cuerpos)"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input name="cantidad" id="cantidad" type="number" step="0.01" min={0.01} required defaultValue={1} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsable">Responsable</Label>
              <Input name="responsable" id="responsable" placeholder="Recibe / devuelve" />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Registrar movimiento
          </Button>
        </form>
      )}

      {movs && movs.length > 0 && (
        <section className="azur-card space-y-3">
          <h2 className="font-display text-base font-bold text-azur-ink">Últimos movimientos</h2>
          <ul className="space-y-2">
            {movs.map((m) => {
              const proyecto = Array.isArray(m.proyecto) ? m.proyecto[0] : m.proyecto;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-3"
                >
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      m.tipo === 'salida' ? 'bg-azur-coral/20 text-azur-red' : 'bg-success/15 text-success'
                    }`}
                  >
                    {m.tipo === 'salida' ? (
                      <ArrowUpFromLine className="h-4 w-4" />
                    ) : (
                      <ArrowDownToLine className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-azur-ink">
                      {m.descripcion}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {proyecto?.codigo ?? ''} · {new Date(m.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} · {m.responsable ?? 'sin responsable'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {Number(m.cantidad).toLocaleString('es-PE')} {m.unidad}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
