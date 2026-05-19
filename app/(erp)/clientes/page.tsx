import Link from 'next/link';
import { Building2, CheckCircle2, Mail, Phone, Search, Users, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ClienteFormCard } from './cliente-form-card';
import { toggleActivoCliente } from './actions';

export const metadata = { title: 'Clientes' };
export const dynamic = 'force-dynamic';

type SearchParams = { q?: string; estado?: 'activos' | 'inactivos' | 'todos' };

export default async function ClientesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  await requireSession();
  const supabase = createClient();

  const estado = searchParams?.estado ?? 'activos';

  let q = supabase
    .from('clientes')
    .select('id, razon_social, nombre_comercial, ruc, contacto, email, telefono, direccion, activo, created_at', { count: 'exact' })
    .order('razon_social')
    .limit(200);

  if (estado === 'activos') q = q.eq('activo', true);
  else if (estado === 'inactivos') q = q.eq('activo', false);

  if (searchParams?.q) {
    q = q.or(`razon_social.ilike.%${searchParams.q}%,nombre_comercial.ilike.%${searchParams.q}%,ruc.ilike.%${searchParams.q}%`);
  }

  const { data: clientes, count } = await q;
  const items = clientes ?? [];

  // Conteo de cotizaciones por cliente
  const cotizMap = new Map<string, number>();
  if (items.length > 0) {
    const { data: cots } = await supabase
      .from('cotizaciones')
      .select('cliente_id')
      .in('cliente_id', items.map((c) => c.id).filter(Boolean) as string[]);
    (cots ?? []).forEach((c) => {
      if (c.cliente_id) cotizMap.set(c.cliente_id, (cotizMap.get(c.cliente_id) ?? 0) + 1);
    });
  }

  const inputClass =
    'flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40';

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Empresas y personas a las que se les emiten cotizaciones."
        icon={Users}
        breadcrumbs={[{ label: 'Clientes' }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Listado a la izquierda (col-span-2) */}
        <div className="space-y-4 lg:col-span-2">
          {/* Filtros */}
          <form className="azur-card flex flex-wrap items-end gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                name="q"
                defaultValue={searchParams?.q ?? ''}
                placeholder="Buscar por razón social, nombre o RUC…"
                className={`${inputClass} pl-9`}
              />
            </div>
            <div>
              <select name="estado" defaultValue={estado} className={`${inputClass} w-36`}>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
                <option value="todos">Todos</option>
              </select>
            </div>
            <Button type="submit">Filtrar</Button>
            {(searchParams?.q || estado !== 'activos') && (
              <Link
                href="/clientes"
                className="inline-flex h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-medium hover:border-azur-coral"
              >
                Limpiar
              </Link>
            )}
          </form>

          {/* Tabla */}
          {items.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Sin clientes con esos filtros"
              description="Crea tu primer cliente con el form a la derecha o limpia los filtros."
            />
          ) : (
            <div className="azur-card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold">RUC</th>
                      <th className="px-4 py-3 font-semibold">Contacto</th>
                      <th className="px-4 py-3 text-right font-semibold">Cotizaciones</th>
                      <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {items.map((c) => {
                      const cotizCount = cotizMap.get(c.id) ?? 0;
                      return (
                        <tr key={c.id} className="hover:bg-azur-coral/5">
                          <td className="px-4 py-2.5">
                            <div className="flex items-start gap-2">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-azur-coral/20 text-azur-red">
                                <Building2 className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="line-clamp-1 text-sm font-semibold text-azur-ink">
                                  {c.razon_social}
                                </p>
                                {c.nombre_comercial && (
                                  <p className="line-clamp-1 text-[11px] text-muted-foreground">
                                    {c.nombre_comercial}
                                  </p>
                                )}
                                {!c.activo && (
                                  <Badge variant="destructive" className="mt-1 text-[9px]">
                                    Inactivo
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-xs">
                            {c.ruc ?? <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-xs text-azur-ink">{c.contacto ?? '—'}</p>
                            <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                              {c.email && (
                                <span className="inline-flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {c.email}
                                </span>
                              )}
                              {c.telefono && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {c.telefono}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Badge variant={cotizCount > 0 ? 'default' : 'outline'}>
                              {cotizCount}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <form action={toggleActivoCliente} className="inline-flex">
                              <input type="hidden" name="id" value={c.id} />
                              <input type="hidden" name="activo" value={String(c.activo)} />
                              <Button type="submit" variant="ghost" size="sm" title={c.activo ? 'Desactivar' : 'Activar'}>
                                {c.activo ? (
                                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                )}
                              </Button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="border-t border-border/60 px-6 py-2 text-[11px] text-muted-foreground">
                  Mostrando {items.length} de {count ?? 0} cliente(s).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Form a la derecha */}
        <div className="lg:col-span-1">
          <ClienteFormCard />
        </div>
      </div>
    </div>
  );
}
