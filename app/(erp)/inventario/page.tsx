import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  CheckCircle2,
  Package,
  PackageCheck,
  ShoppingCart,
  Users,
  Warehouse,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CompraForm, type InsumoOption } from './compra-form';

export const metadata = { title: 'Almacén · Movimientos por proyecto' };
export const dynamic = 'force-dynamic';

type SearchParams = {
  proyecto?: string;
  tipo?: 'salida' | 'devolucion';
  desde?: string;
  hasta?: string;
};

const ROLES_PUEDEN_COMPRAR = ['gerencia_general', 'jefe_proyectos', 'administrador'];

export default async function AlmacenErpPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = await requireSession();
  const supabase = createClient();
  const puedeComprar = ROLES_PUEDEN_COMPRAR.includes(session.rol);

  // Lista de proyectos para el filtro
  const { data: proyectos } = await supabase
    .from('proyectos')
    .select('id, codigo, nombre')
    .neq('estado', 'cancelado')
    .order('codigo', { ascending: false });

  // Catálogo para el form de compra
  const { data: insumosCatalogo } = await supabase
    .from('insumos_maestros')
    .select('id, codigo, descripcion, categoria, unidad, precio_unit')
    .eq('activo', true)
    .in('categoria', ['equipo', 'material'])
    .order('codigo');
  const insumosOptions: InsumoOption[] = (insumosCatalogo ?? []).map((i) => ({
    id: i.id,
    codigo: i.codigo,
    descripcion: i.descripcion,
    categoria: i.categoria,
    unidad: i.unidad,
    precio_unit: i.precio_unit != null ? Number(i.precio_unit) : null,
  }));

  // Stock del almacén CENTRAL (lo que físicamente está)
  const { data: stockCentralData } = await supabase
    .from('v_almacen_central_stock')
    .select('insumo_codigo, descripcion, categoria, unidad, total_ingresos, total_salidas, total_devoluciones, stock_disponible, ultimo_movimiento')
    .gt('total_ingresos', 0)
    .order('stock_disponible', { ascending: false })
    .limit(200);
  const stockCentral = stockCentralData ?? [];
  const stockCentralItems = stockCentral.length;
  const stockAgotado = stockCentral.filter((s) => Number(s.stock_disponible ?? 0) <= 0).length;

  // Query movimientos
  let q = supabase
    .from('almacen_movimientos')
    .select(
      'id, fecha, tipo, descripcion, cantidad, unidad, responsable, notas, registrado_por, proyecto:proyecto_id(id, codigo, nombre)',
    )
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(300);

  if (searchParams?.proyecto) q = q.eq('proyecto_id', searchParams.proyecto);
  if (searchParams?.tipo) q = q.eq('tipo', searchParams.tipo);
  if (searchParams?.desde) q = q.gte('fecha', searchParams.desde);
  if (searchParams?.hasta) q = q.lte('fecha', searchParams.hasta);

  const { data: movs } = await q;
  const items = movs ?? [];

  // Stock disponible (vista v_almacen_stock)
  let stockQ = supabase
    .from('v_almacen_stock')
    .select('proyecto_id, proyecto_codigo, proyecto_nombre, insumo_codigo, descripcion, categoria, unidad, total_salidas, total_devoluciones, disponible, ultimo_movimiento')
    .gt('disponible', 0)
    .order('proyecto_codigo', { ascending: true })
    .order('disponible', { ascending: false })
    .limit(200);
  if (searchParams?.proyecto) stockQ = stockQ.eq('proyecto_id', searchParams.proyecto);
  const { data: stockRows } = await stockQ;
  const stockItems = stockRows ?? [];

  // Perfiles de quienes registraron
  const userIds = [...new Set(items.map((m) => m.registrado_por).filter(Boolean))] as string[];
  const perfilMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: perfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    (perfiles ?? []).forEach((p) => perfilMap.set(p.id, p.full_name));
  }

  // KPIs
  const totalSalidas = items.filter((m) => m.tipo === 'salida').length;
  const totalDevoluciones = items.filter((m) => m.tipo === 'devolucion').length;
  const proyectosConMov = new Set(items.map((m) => (Array.isArray(m.proyecto) ? m.proyecto[0]?.codigo : m.proyecto?.codigo))).size;
  const responsablesUnicos = new Set(items.map((m) => m.responsable).filter(Boolean)).size;

  const inputClass =
    'flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Almacén"
        description="Stock del almacén central, ingresos por compras y movimientos cruzados por proyecto."
        icon={Package}
        breadcrumbs={[{ label: 'Almacén' }]}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Warehouse}
          label="Items en almacén central"
          value={stockCentralItems}
          subtitle={stockAgotado > 0 ? `${stockAgotado} agotado(s)` : 'Stock saludable'}
          accent="brand"
        />
        <Kpi
          icon={ArrowUpFromLine}
          label="Salidas a obra"
          value={totalSalidas}
          subtitle="Movimientos a proyectos"
          accent="default"
        />
        <Kpi
          icon={ArrowDownToLine}
          label="Devoluciones"
          value={totalDevoluciones}
          subtitle="Regresaron al central"
          accent="success"
        />
        <Kpi
          icon={Building2}
          label="Proyectos con movimientos"
          value={proyectosConMov}
          accent="default"
        />
      </div>

      {/* Stock del almacén central */}
      <section className="azur-card overflow-hidden p-0">
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-azur-gradient text-white shadow-azur-md">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-azur-ink">
                Stock del almacén central
              </h2>
              <p className="text-xs text-muted-foreground">
                Lo que físicamente tienes disponible para entregar a las obras (compras − salidas + devoluciones).
              </p>
            </div>
          </div>
        </header>
        {stockCentral.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no hay ingresos al almacén central. Usa el form de abajo para registrar tu primera compra.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/5 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-6 py-3 font-semibold">Insumo</th>
                  <th className="px-6 py-3 font-semibold">Categoría</th>
                  <th className="px-6 py-3 text-right font-semibold">Ingresos</th>
                  <th className="px-6 py-3 text-right font-semibold">Salidas</th>
                  <th className="px-6 py-3 text-right font-semibold">Devolv.</th>
                  <th className="px-6 py-3 text-right font-semibold">Stock actual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stockCentral.map((s, i) => {
                  const stock = Number(s.stock_disponible ?? 0);
                  const stockColor = stock <= 0 ? 'destructive' : stock < 5 ? 'warning' : 'success';
                  return (
                    <tr key={`${s.insumo_codigo}-${i}`} className="hover:bg-azur-coral/5">
                      <td className="px-6 py-2.5">
                        <p className="text-sm font-semibold text-azur-ink">{s.descripcion}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {s.insumo_codigo}
                        </p>
                      </td>
                      <td className="px-6 py-2.5">
                        <Badge variant={s.categoria === 'equipo' ? 'default' : 'coral'}>
                          {s.categoria === 'equipo' ? 'Herramienta' : 'Material'}
                        </Badge>
                      </td>
                      <td className="px-6 py-2.5 text-right font-mono text-xs text-success">
                        +{Number(s.total_ingresos).toLocaleString('es-PE')}
                      </td>
                      <td className="px-6 py-2.5 text-right font-mono text-xs text-azur-red">
                        −{Number(s.total_salidas).toLocaleString('es-PE')}
                      </td>
                      <td className="px-6 py-2.5 text-right font-mono text-xs text-muted-foreground">
                        +{Number(s.total_devoluciones).toLocaleString('es-PE')}
                      </td>
                      <td className="px-6 py-2.5 text-right">
                        <Badge variant={stockColor}>
                          {Number(stock).toLocaleString('es-PE')} {s.unidad}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Form de compra (solo gerencia/jefe/admin) */}
      {puedeComprar && (
        <section className="azur-card p-6">
          <header className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-azur-ink">
                Registrar compra / ingreso al almacén central
              </h2>
              <p className="text-xs text-muted-foreground">
                Cada compra a proveedor incrementa el stock del central.
              </p>
            </div>
          </header>
          <CompraForm insumos={insumosOptions} />
        </section>
      )}

      {/* Filtros */}
      <form className="azur-card grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Proyecto
          </label>
          <select
            name="proyecto"
            defaultValue={searchParams?.proyecto ?? ''}
            className={`mt-1 ${inputClass}`}
          >
            <option value="">— Todos —</option>
            {(proyectos ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tipo
          </label>
          <select
            name="tipo"
            defaultValue={searchParams?.tipo ?? ''}
            className={`mt-1 ${inputClass}`}
          >
            <option value="">— Todos —</option>
            <option value="salida">Salida</option>
            <option value="devolucion">Devolución</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Desde
          </label>
          <input
            type="date"
            name="desde"
            defaultValue={searchParams?.desde ?? ''}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hasta
          </label>
          <input
            type="date"
            name="hasta"
            defaultValue={searchParams?.hasta ?? ''}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div className="flex gap-2">
          <Link
            href="/inventario"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-medium hover:border-azur-coral"
          >
            Limpiar
          </Link>
          <button
            type="submit"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-azur-gradient px-5 text-sm font-semibold text-white shadow-azur-md"
          >
            Filtrar
          </button>
        </div>
      </form>

      {/* Existencias actuales (stock pendiente de devolver) */}
      {stockItems.length > 0 && (
        <div className="azur-card overflow-hidden p-0">
          <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
                <Warehouse className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-azur-ink">
                  Existencias actualmente entregadas · {stockItems.length}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Material y herramientas que salieron del almacén y aún no han sido devueltos.
                </p>
              </div>
            </div>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/5 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Proyecto</th>
                  <th className="px-4 py-3 font-semibold">Material / herramienta</th>
                  <th className="px-4 py-3 font-semibold">Categoría</th>
                  <th className="px-4 py-3 text-right font-semibold">Salidas</th>
                  <th className="px-4 py-3 text-right font-semibold">Devoluciones</th>
                  <th className="px-4 py-3 text-right font-semibold">Pendiente</th>
                  <th className="px-4 py-3 font-semibold">Último mov.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stockItems.map((s, idx) => (
                  <tr key={`${s.proyecto_id}-${s.descripcion}-${idx}`} className="hover:bg-azur-coral/5">
                    <td className="px-4 py-2.5">
                      {s.proyecto_id ? (
                        <Link href={`/proyectos/${s.proyecto_id}`} className="group inline-flex flex-col">
                          <span className="font-mono text-[11px] font-semibold text-azur-red group-hover:underline">
                            {s.proyecto_codigo}
                          </span>
                          <span className="line-clamp-1 text-[10px] text-muted-foreground">
                            {s.proyecto_nombre}
                          </span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div>
                        <p className="line-clamp-1 text-sm font-semibold text-azur-ink">
                          {s.descripcion}
                        </p>
                        {s.insumo_codigo && s.insumo_codigo !== '—' && (
                          <p className="font-mono text-[10px] text-muted-foreground">{s.insumo_codigo}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge
                        variant={
                          s.categoria === 'equipo'
                            ? 'default'
                            : s.categoria === 'material'
                              ? 'coral'
                              : 'outline'
                        }
                      >
                        {s.categoria === 'equipo'
                          ? 'Herramienta'
                          : s.categoria === 'material'
                            ? 'Material'
                            : s.categoria === 'libre'
                              ? 'Texto libre'
                              : s.categoria}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-azur-red">
                      {Number(s.total_salidas).toLocaleString('es-PE')}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-success">
                      {Number(s.total_devoluciones).toLocaleString('es-PE')}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant="warning">
                        {Number(s.disponible).toLocaleString('es-PE')} {s.unidad}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {s.ultimo_movimiento
                        ? new Date(s.ultimo_movimiento).toLocaleDateString('es-PE', {
                            timeZone: 'America/Lima',
                            day: '2-digit',
                            month: 'short',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-border/60 px-6 py-2 text-[11px] text-muted-foreground">
              {stockItems.length} ítem(s) pendientes · Pendiente = Salidas − Devoluciones · Filtra por proyecto arriba.
            </p>
          </div>
        </div>
      )}

      {/* Lista */}
      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin movimientos con esos filtros"
          description="Cambia los filtros o pide al residente que registre desde la PWA."
        />
      ) : (
        <div className="azur-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Material / herramienta</th>
                  <th className="px-4 py-3 font-semibold">Proyecto</th>
                  <th className="px-4 py-3 font-semibold">Responsable</th>
                  <th className="px-4 py-3 font-semibold">Registrado por</th>
                  <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((m) => {
                  const proyecto = Array.isArray(m.proyecto) ? m.proyecto[0] : m.proyecto;
                  const registradoPor = m.registrado_por ? perfilMap.get(m.registrado_por) : null;
                  return (
                    <tr key={m.id} className="hover:bg-azur-coral/5">
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.fecha).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
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
                          <span className="text-xs font-semibold capitalize text-azur-ink">
                            {m.tipo}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="line-clamp-1 text-sm font-semibold text-azur-ink">
                          {m.descripcion}
                        </p>
                        {m.notas && (
                          <p className="line-clamp-1 text-[11px] text-muted-foreground">
                            {m.notas}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {proyecto ? (
                          <Link href={`/proyectos/${proyecto.id}`} className="group inline-flex flex-col">
                            <span className="font-mono text-[11px] font-semibold text-azur-red group-hover:underline">
                              {proyecto.codigo}
                            </span>
                            <span className="line-clamp-1 text-[10px] text-muted-foreground">
                              {proyecto.nombre}
                            </span>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-azur-ink">
                        {m.responsable ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {registradoPor ?? <span>—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Badge variant={m.tipo === 'salida' ? 'coral' : 'success'}>
                          {Number(m.cantidad).toLocaleString('es-PE')} {m.unidad}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="border-t border-border/60 px-6 py-2 text-[11px] text-muted-foreground">
              {items.length} movimiento(s) · máx 300 por consulta · los registros se crean desde la PWA del residente.
            </p>
          </div>
        </div>
      )}

      <div className="azur-card flex items-start gap-3 bg-azur-coral/5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-azur-coral/20 text-azur-red">
          <PackageCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-azur-ink">¿Cómo se generan estos datos?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            El residente registra cada salida o devolución desde la PWA (sección Almacén). Esta vista
            agrega todos los movimientos para que la gerencia vea consumo cruzado por proyecto, identifique
            responsables y filtre por fecha.
          </p>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  subtitle,
  accent,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
  subtitle?: string;
  accent: 'default' | 'brand' | 'success';
}) {
  const accentClass: Record<typeof accent, string> = {
    default: 'bg-azur-coral/20 text-azur-red',
    brand: 'bg-azur-gradient text-white',
    success: 'bg-success/15 text-success',
  };

  return (
    <div className={`azur-card ${accent === 'brand' ? 'bg-azur-gradient text-white' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              accent === 'brand' ? 'opacity-80' : 'text-muted-foreground'
            }`}
          >
            {label}
          </p>
          <p
            className={`mt-1 font-display text-2xl font-bold ${
              accent === 'brand' ? 'text-white' : 'text-azur-ink'
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className={`mt-0.5 text-[11px] ${
                accent === 'brand' ? 'opacity-80' : 'text-muted-foreground'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            accent === 'brand' ? 'bg-white/20 text-white' : accentClass[accent]
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
