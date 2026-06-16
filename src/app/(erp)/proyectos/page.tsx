import Link from 'next/link';
import { HardHat } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireRol } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/misc';
import { ESTADO_PROYECTO } from '@/lib/estados';
import { fmtMoney, fmtDate } from '@/lib/format';
import { SearchBox, Pagination } from '@/components/ui/list-tools';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 20;

export default async function ProyectosPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  await requireRol(['gerencia', 'jefe_proyectos', 'presupuestos']);
  const supabase = createClient();

  const q = (searchParams.q ?? '').trim();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const desde = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('proyectos')
    .select('id, codigo, nombre, estado, tipo_proyecto, contrato_total, fecha_inicio, fecha_fin, cliente:clientes(razon_social), linea:lineas_negocio(codigo), jefe:profiles!proyectos_jefe_id_fkey(nombre)', { count: 'exact' });
  if (q) query = query.or(`nombre.ilike.%${q}%,codigo.ilike.%${q}%`);
  const { data: proys, count } = await query.order('created_at', { ascending: false }).range(desde, desde + PAGE_SIZE - 1);

  const proyectos = proys ?? [];
  const total = count ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Proyectos" description="Gestión de obra — Last Planner, valorizaciones y control." />

      <SearchBox placeholder="Buscar por nombre o código…" />

      <Card>
        <CardContent className="p-0">
          {proyectos.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<HardHat className="size-10" />} titulo="Sin proyectos" descripcion="Los proyectos se crean al aceptar una cotización." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Línea</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proyectos.map((p) => {
                  const est = ESTADO_PROYECTO[p.estado] ?? { label: p.estado, variant: 'muted' as const };
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <Link href={`/proyectos/${p.id}`} className="text-azur-600 hover:underline">{p.codigo ?? '—'}</Link>
                      </TableCell>
                      <TableCell><Link href={`/proyectos/${p.id}`}>{p.nombre}</Link></TableCell>
                      <TableCell className="text-muted-foreground">{(p.cliente as { razon_social?: string } | null)?.razon_social ?? '—'}</TableCell>
                      <TableCell><Badge variant="outline">{(p.linea as { codigo?: string } | null)?.codigo ?? '—'}</Badge></TableCell>
                      <TableCell><Badge variant={p.tipo_proyecto === 'grande' ? 'info' : 'secondary'}>{p.tipo_proyecto}</Badge></TableCell>
                      <TableCell className="tabular-nums">{fmtMoney(Number(p.contrato_total))}</TableCell>
                      <TableCell><Badge variant={est.variant}>{est.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{fmtDate(p.fecha_fin)}</TableCell>
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
