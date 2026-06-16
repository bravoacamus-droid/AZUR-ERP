import Link from 'next/link';
import { Plus, FileText, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
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

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 20;

export default async function ComercialPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  await requireRol(['gerencia', 'comercial', 'presupuestos']);
  const supabase = createClient();

  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const desde = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('cotizaciones')
    .select('id, codigo, proyecto_nombre, estado, fecha, tipo_proyecto, cliente:clientes(razon_social), linea:lineas_negocio(codigo, nombre)', { count: 'exact' });
  if (q) query = query.or(`proyecto_nombre.ilike.%${q}%,codigo.ilike.%${q}%,asunto.ilike.%${q}%`);
  const { data: cots, count } = await query.order('created_at', { ascending: false }).range(desde, desde + PAGE_SIZE - 1);

  const cotizaciones = cots ?? [];
  const total = count ?? 0;
  const porEstado = (e: string) => cotizaciones.filter((c) => c.estado === e).length;

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

      <SearchBox placeholder="Buscar por proyecto, código o asunto…" />

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
                      <TableCell><CotizacionRowActions id={c.id} estado={c.estado} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} />
        </CardContent>
      </Card>
    </div>
  );
}
