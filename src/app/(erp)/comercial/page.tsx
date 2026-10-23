import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, FileText, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireModulo } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/misc';
import { fmtDate } from '@/lib/format';
import { CotizacionRowActions } from './row-actions';

import { SearchBox, Pagination } from '@/components/ui/list-tools';
import { ESTADOS_COMERCIALES, ESTADO_COMERCIAL_META, esEstadoComercial, estadoComercial, filtrarEstadoComercial } from '@/lib/estado-comercial';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 20;

export default async function ComercialPage({ searchParams }: { searchParams: { q?: string; page?: string; tab?: string; estado?: string } }) {
  const session = await requireModulo('comercial', 'ver');
  const esGerencia = session.rol === 'gerencia';
  const supabase = createClient();

  // El dashboard comercial se movió al Dashboard general (Inicio).
  if (searchParams.tab === 'dashboard') redirect('/inicio?vista=comercial');
  const tab = searchParams.tab === 'plantillas' ? 'plantillas' : 'cotizaciones';
  const estadoF = esEstadoComercial(searchParams.estado) ? searchParams.estado : null;
  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const desde = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('cotizaciones')
    .select('id, codigo, proyecto_nombre, estado, revision_estado, fecha, tipo_proyecto, cliente:clientes(razon_social), linea:lineas_negocio(codigo, nombre)', { count: 'exact' })
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
  if (estadoF) query = filtrarEstadoComercial(query, estadoF);
  const { data: cots, count } = await query.order('created_at', { ascending: false }).range(desde, desde + PAGE_SIZE - 1);

  const cotizaciones = cots ?? [];
  // "Enviada" (y "Vencida") solo se ofrecen como filtro si hay cotizaciones en ese estado.
  const [{ count: nEnviada }, { count: nVencida }] = await Promise.all([
    supabase.from('cotizaciones').select('id', { count: 'exact', head: true }).eq('es_plantilla', false).eq('estado', 'enviada'),
    supabase.from('cotizaciones').select('id', { count: 'exact', head: true }).eq('es_plantilla', false).eq('estado', 'vencida'),
  ]);
  const estadosFiltro = ESTADOS_COMERCIALES.filter((e) => !e.extra || e.k === estadoF || (e.k === 'enviada' ? (nEnviada ?? 0) > 0 : (nVencida ?? 0) > 0));
  const total = count ?? 0;

  // Plantillas reutilizables (cotizaciones marcadas como plantilla)
  const { data: plantillas } = await supabase
    .from('cotizaciones')
    .select('id, codigo, proyecto_nombre, estado, fecha, cliente:clientes(razon_social), linea:lineas_negocio(codigo)')
    .eq('es_plantilla', true)
    .order('created_at', { ascending: false });

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
      </div>

      {tab === 'plantillas' ? (
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

      {/* Filtro por estado (también es el destino del clic en el pipeline del dashboard). */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">Estado:</span>
        {[{ k: null as string | null, label: 'Todos' }, ...estadosFiltro.map((e) => ({ k: e.k as string | null, label: e.label }))].map((e) => {
          const params = new URLSearchParams();
          if (q) params.set('q', q);
          if (e.k) params.set('estado', e.k);
          const activo = (estadoF ?? null) === e.k;
          return (
            <Link key={e.label} href={`/comercial${params.toString() ? `?${params.toString()}` : ''}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${activo ? 'border-foreground bg-foreground text-white' : 'bg-white hover:bg-secondary'}`}>
              {e.label}
            </Link>
          );
        })}
      </div>

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
                        {/* Estado comercial unificado (estado + revisión de Costos y Presupuestos). */}
                        <Badge variant={ESTADO_COMERCIAL_META[estadoComercial(c as { estado: string; revision_estado?: string | null })].variant}>
                          {ESTADO_COMERCIAL_META[estadoComercial(c as { estado: string; revision_estado?: string | null })].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(c.fecha)}</TableCell>
                      <TableCell><CotizacionRowActions id={c.id} estado={c.estado} codigo={c.codigo} puedeEliminarDirecto={esGerencia} /></TableCell>
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
      )}
    </div>
  );
}
