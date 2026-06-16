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

export const dynamic = 'force-dynamic';

export default async function ComercialPage() {
  await requireRol(['gerencia', 'comercial', 'presupuestos']);
  const supabase = createClient();

  const { data: cots } = await supabase
    .from('cotizaciones')
    .select('id, codigo, proyecto_nombre, estado, fecha, tipo_proyecto, cliente:clientes(razon_social), linea:lineas_negocio(codigo, nombre)')
    .order('created_at', { ascending: false });

  const cotizaciones = cots ?? [];
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['borrador', 'enviada', 'en_negociacion', 'aceptada'] as const).map((e) => (
          <Card key={e}>
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {ESTADO_COTIZACION[e].label}
              </p>
              <p className="mt-1 text-2xl font-bold">{porEstado(e)}</p>
            </CardContent>
          </Card>
        ))}
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
        </CardContent>
      </Card>
    </div>
  );
}
