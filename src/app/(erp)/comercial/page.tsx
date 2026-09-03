import Link from 'next/link';
import { Plus, FileText, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/misc';
import { ESTADO_COTIZACION } from '@/lib/estados';
import { fmtDate } from '@/lib/format';
import { CotizacionRowActions } from './row-actions';
import { SearchBox, Pagination } from '@/components/ui/list-tools';
import { ComercialDashboard } from '@/components/comercial/comercial-dashboard';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 20;

export default async function ComercialPage({ searchParams }: { searchParams: { q?: string; page?: string; tab?: string } }) {
  const session = await requireModulo('comercial', 'ver');
  const esGerencia = session.rol === 'gerencia';
  const supabase = createClient();

  const tab = searchParams.tab === 'plantillas' || searchParams.tab === 'dashboard' ? searchParams.tab : 'cotizaciones';
  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const desde = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('cotizaciones')
    .select('id, codigo, proyecto_nombre, estado, fecha, tipo_proyecto, cliente:clientes(razon_social), linea:lineas_negocio(codigo, nombre)', { count: 'exact' })
    .eq('es_plantilla', false);
  if (q) {
    // Busca por proyecto, código y asunto (columnas propias) y también por
    // CLIENTE (tabla relacionada): resolvemos primero los ids que matchean.
    const { data: cliMatch } = await supabase.from('clientes').select('id').ilike('razon_social', `%${q}%`);
    const ids = (cliMatch ?? []).map((c) => c.id);
    const partes = [`proyecto_nombre.ilike.%${q}%`, `codigo.ilike.%${q}%`, `asunto.ilike.%${q}%`];
    if (ids.length) partes.push(`cliente_id.in.(${ids.join(',')})`);
    query = query.or(partes.join(','));
  }
  const { data: cots, count } = await query.order('created_at', { ascending: false }).range(desde, desde + PAGE_SIZE - 1);

  const cotizaciones = cots ?? [];
  const total = count ?? 0;

  // Plantillas reutilizables (cotizaciones marcadas como plantilla)
  const { data: plantillas } = await supabase
    .from('cotizaciones')
    .select('id, codigo, proyecto_nombre, estado, fecha, cliente:clientes(razon_social), linea:lineas_negocio(codigo)')
    .eq('es_plantilla', true)
    .order('created_at', { ascending: false });

  // Agregados para el dashboard comercial (solo cuando se ve esa pestaña).
  let dash: null | { porEstado: Record<string, number>; porLinea: { nombre: string; n: number }[]; porMes: { mes: string; creadas: number; aceptadas: number }[]; montoGanado: number; total: number } = null;
  if (tab === 'dashboard') {
    const [{ data: allCots }, { data: proys }] = await Promise.all([
      supabase.from('cotizaciones').select('id, estado, created_at, linea:lineas_negocio(nombre)').eq('es_plantilla', false),
      supabase.from('proyectos').select('cotizacion_id, contrato_total').not('cotizacion_id', 'is', null),
    ]);
    const cots2 = allCots ?? [];
    const porEstado: Record<string, number> = {};
    const lineaMap = new Map<string, number>();
    const mesMap = new Map<string, { creadas: number; aceptadas: number }>();
    cots2.forEach((c) => {
      porEstado[c.estado] = (porEstado[c.estado] ?? 0) + 1;
      const ln = (c.linea as { nombre?: string } | null)?.nombre ?? 'Sin línea';
      lineaMap.set(ln, (lineaMap.get(ln) ?? 0) + 1);
      const mes = String(c.created_at).slice(0, 7);
      const m = mesMap.get(mes) ?? { creadas: 0, aceptadas: 0 };
      m.creadas += 1; if (c.estado === 'aceptada') m.aceptadas += 1; mesMap.set(mes, m);
    });
    const montoGanado = (proys ?? []).reduce((a, p) => a + Number(p.contrato_total ?? 0), 0);
    dash = {
      porEstado,
      porLinea: [...lineaMap.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, b) => b.n - a.n),
      porMes: [...mesMap.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8).map(([mes, v]) => ({ mes, ...v })),
      montoGanado,
      total: cots2.length,
    };
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comercial"
        description="Cotizaciones, APU y conversión a proyecto."
        action={
          <Link href="/comercial/nueva">
            <Button variant="gradient">
              <Plus /> Nueva cotización
            </Button>
          </Link>
        }
      />

      {/* Pestañas: Cotizaciones | Plantillas */}
      <div className="flex gap-1 border-b">
        <Link href="/comercial" className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === 'cotizaciones' ? 'border-azur-600 text-azur-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          Cotizaciones ({total})
        </Link>
        <Link href="/comercial?tab=plantillas" className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === 'plantillas' ? 'border-azur-600 text-azur-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          Plantillas ({(plantillas ?? []).length})
        </Link>
        <Link href="/comercial?tab=dashboard" className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === 'dashboard' ? 'border-azur-600 text-azur-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
          Dashboard
        </Link>
      </div>

      {tab === 'dashboard' && <ComercialDashboard dash={dash} />}

      {tab !== 'dashboard' && (tab === 'plantillas' ? (
        <Card>
          <CardContent className="p-0">
            {(plantillas ?? []).length === 0 ? (
              <div className="p-6"><EmptyState icon={<FileText className="size-10" />} titulo="Sin plantillas" descripcion="Guarda una cotización como plantilla desde sus Acciones para reutilizarla." /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Plantilla</TableHead><TableHead>Cliente</TableHead><TableHead>Línea</TableHead><TableHead></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {(plantillas ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium"><Link href={`/comercial/${p.id}`} className="hover:underline">{p.proyecto_nombre}</Link></TableCell>
                      <TableCell className="text-muted-foreground">{(p.cliente as { razon_social?: string } | null)?.razon_social ?? '—'}</TableCell>
                      <TableCell><Badge variant="outline">{(p.linea as { codigo?: string } | null)?.codigo ?? '—'}</Badge></TableCell>
                      <TableCell><CotizacionRowActions id={p.id} estado={p.estado} esPlantilla /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
      <>
      <SearchBox placeholder="Buscar por proyecto, código, asunto o cliente…" />

      <Card>
        <CardContent className="p-0">
          {cotizaciones.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<FileText className="size-10" />}
                titulo="Sin cotizaciones"
                descripcion="Crea la primera cotización para iniciar el flujo comercial."
                action={
                  <Link href="/comercial/nueva">
                    <Button variant="gradient">
                      <Plus /> Nueva cotización
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Línea</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cotizaciones.map((c) => {
                  const est = ESTADO_COTIZACION[c.estado] ?? { label: c.estado, variant: 'muted' as const };
                  return (
                    <TableRow key={c.id} className="cursor-pointer">
                      <TableCell className="font-medium">
                        <Link href={`/comercial/${c.id}`} className="text-azur-600 hover:underline">
                          {c.codigo ?? '—'}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/comercial/${c.id}`}>{c.proyecto_nombre}</Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(c.cliente as { razon_social?: string } | null)?.razon_social ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{(c.linea as { codigo?: string } | null)?.codigo ?? '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={est.variant}>{est.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(c.fecha)}</TableCell>
                      <TableCell><CotizacionRowActions id={c.id} estado={c.estado} puedeEliminarDirecto={esGerencia} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
        </CardContent>
      </Card>
      </>
      ))}
    </div>
  );
}
