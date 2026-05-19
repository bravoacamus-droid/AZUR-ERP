import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, Plus, Trash2, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN, formatNumber } from '@/lib/utils';
import { calcularTotalesCotizacion } from '@/lib/comercial/apu';
import {
  COTIZACION_ESTADO_LABEL,
  COTIZACION_ESTADO_VARIANT,
  type CotizacionEstado,
} from '@/lib/comercial/estados';
import { TipoCambioBanner } from '@/components/finanzas/tipo-cambio-banner';
import { agregarPartida, eliminarPartida, cambiarEstadoCotizacion } from '../actions';

export const dynamic = 'force-dynamic';

export default async function CotizacionDetallePage({ params }: { params: { id: string } }) {
  await requireSession();
  const supabase = createClient();

  const { data: cot } = await supabase
    .from('cotizaciones')
    .select(
      '*, cliente:cliente_id(razon_social, ruc, contacto, email, direccion)',
    )
    .eq('id', params.id)
    .single();

  if (!cot) notFound();

  const { data: partidasRaw } = await supabase
    .from('cotizacion_partidas')
    .select('id, codigo, descripcion, unidad, cantidad, precio_unitario, parcial, orden')
    .eq('cotizacion_id', params.id)
    .order('orden');

  const { data: unidades } = await supabase
    .from('unidades_medida')
    .select('codigo, nombre')
    .order('codigo');

  const partidas = (partidasRaw ?? []).map((p) => ({
    ...p,
    cantidad: Number(p.cantidad),
    precio_unitario: Number(p.precio_unitario),
  }));

  const totales = calcularTotalesCotizacion(partidas, {
    margen_porcentaje: Number(cot.margen_porcentaje),
    gastos_generales_porcentaje: Number(cot.gastos_generales_porcentaje),
    igv_porcentaje: Number(cot.igv_porcentaje),
  });

  const moneda = (cot.moneda as string) === 'USD' ? 'USD' : 'PEN';
  const fmt = (n: number) =>
    moneda === 'USD'
      ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatPEN(n);

  const cliente = Array.isArray(cot.cliente) ? cot.cliente[0] : cot.cliente;
  const estado = cot.estado as CotizacionEstado;
  const isReadonly = estado !== 'borrador';

  return (
    <div className="space-y-8">
      <PageHeader
        title={cot.titulo}
        description={`Código ${cot.codigo} · ${cot.descripcion ?? 'Sin descripción'}`}
        icon={FileText}
        breadcrumbs={[
          { label: 'Comercial' },
          { label: 'Cotizaciones', href: '/comercial/cotizaciones' },
          { label: cot.codigo ?? '—' },
        ]}
        actions={
          <a href={`/api/cotizaciones/${cot.id}/pdf`} target="_blank" rel="noopener">
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              Descargar PDF
            </Button>
          </a>
        }
      />

      <TipoCambioBanner />

      {/* Resumen + cliente */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="azur-card md:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cliente
          </p>
          {cliente ? (
            <>
              <p className="mt-1 font-display text-lg font-bold text-azur-ink">
                {cliente.razon_social}
              </p>
              {cliente.ruc && (
                <p className="text-xs text-muted-foreground">RUC {cliente.ruc}</p>
              )}
              {cliente.contacto && (
                <p className="mt-1 text-sm">{cliente.contacto}</p>
              )}
              {cliente.email && <p className="text-xs text-muted-foreground">{cliente.email}</p>}
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Sin cliente asignado</p>
          )}
        </div>
        <div className="azur-card">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Estado
          </p>
          <Badge variant={COTIZACION_ESTADO_VARIANT[estado]} className="mt-2">
            {COTIZACION_ESTADO_LABEL[estado]}
          </Badge>
          <p className="mt-3 text-xs text-muted-foreground">
            Emisión:{' '}
            {new Date(cot.fecha_emision).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-xs text-muted-foreground">Validez: {cot.validez_dias} días</p>
        </div>
        <div className="azur-card bg-azur-gradient text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Total</p>
          <p className="mt-1 font-display text-2xl font-bold">{fmt(totales.total)}</p>
          <p className="mt-1 text-xs opacity-80">
            CD {fmt(totales.costoDirecto)} + GG {cot.gastos_generales_porcentaje}% + U {cot.margen_porcentaje}% + IGV {cot.igv_porcentaje}%
          </p>
        </div>
      </div>

      {/* Partidas */}
      <div className="azur-card space-y-4 p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-azur-ink">Partidas</h2>
            <p className="text-xs text-muted-foreground">
              Cantidad × precio unitario = parcial. Costo directo total: {fmt(totales.costoDirecto)}
            </p>
          </div>
        </div>

        {partidas.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon={Plus}
              title="Sin partidas"
              description="Agrega la primera partida usando el formulario debajo. Puedes definir el APU detallado en la página de cada partida."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-azur-coral/10 text-left text-xs uppercase tracking-wider text-azur-red">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Descripción</th>
                  <th className="px-4 py-3 font-semibold">Und</th>
                  <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                  <th className="px-4 py-3 text-right font-semibold">P. Unit</th>
                  <th className="px-4 py-3 text-right font-semibold">Parcial</th>
                  {!isReadonly && <th className="px-4 py-3"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {partidas.map((p) => (
                  <tr key={p.id} className="hover:bg-azur-coral/5">
                    <td className="px-4 py-3 font-mono text-xs text-azur-red">{p.codigo}</td>
                    <td className="px-4 py-3 text-azur-ink">{p.descripcion}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.unidad}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatNumber(p.cantidad)}</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(p.precio_unitario)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-azur-ink">
                      {fmt(Number(p.parcial ?? p.cantidad * p.precio_unitario))}
                    </td>
                    {!isReadonly && (
                      <td className="px-4 py-3 text-right">
                        <form action={eliminarPartida} className="inline-flex">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="cotizacion_id" value={cot.id} />
                          <Button type="submit" variant="ghost" size="icon" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-azur-coral/5 text-sm">
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right font-semibold text-muted-foreground">
                    Costo directo
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-azur-ink">
                    {fmt(totales.costoDirecto)}
                  </td>
                  {!isReadonly && <td />}
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">
                    Gastos generales ({cot.gastos_generales_porcentaje}%)
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-azur-ink">
                    {fmt(totales.gastosGenerales)}
                  </td>
                  {!isReadonly && <td />}
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">
                    Utilidad ({cot.margen_porcentaje}%)
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-azur-ink">
                    {fmt(totales.utilidad)}
                  </td>
                  {!isReadonly && <td />}
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right font-semibold text-muted-foreground">
                    Subtotal
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-azur-ink">
                    {fmt(totales.subtotal)}
                  </td>
                  {!isReadonly && <td />}
                </tr>
                <tr>
                  <td colSpan={5} className="px-4 py-2 text-right text-muted-foreground">
                    IGV ({cot.igv_porcentaje}%)
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-azur-ink">{fmt(totales.igv)}</td>
                  {!isReadonly && <td />}
                </tr>
                <tr className="border-t border-azur-red/20">
                  <td colSpan={5} className="px-4 py-3 text-right text-base font-bold text-azur-red">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-lg font-bold text-azur-red">
                    {fmt(totales.total)}
                  </td>
                  {!isReadonly && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Form agregar partida (solo borrador) */}
        {!isReadonly && (
          <form action={agregarPartida} className="border-t border-border/60 bg-muted/30 p-4">
            <input type="hidden" name="cotizacion_id" value={cot.id} />
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Agregar partida
            </p>
            <div className="grid gap-3 sm:grid-cols-6">
              <div className="sm:col-span-1">
                <Label className="text-xs" htmlFor="codigo">
                  Código
                </Label>
                <Input id="codigo" name="codigo" required placeholder="01.01.01" />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs" htmlFor="descripcion">
                  Descripción
                </Label>
                <Input id="descripcion" name="descripcion" required minLength={3} placeholder="Excavación manual" />
              </div>
              <div>
                <Label className="text-xs" htmlFor="unidad">
                  Und
                </Label>
                <select
                  id="unidad"
                  name="unidad"
                  required
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
                  defaultValue="m3"
                >
                  {(unidades ?? []).map((u) => (
                    <option key={u.codigo} value={u.codigo}>
                      {u.codigo} · {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="cantidad">
                  Cantidad
                </Label>
                <Input id="cantidad" name="cantidad" type="number" step="0.0001" min={0} required defaultValue={1} />
              </div>
              <div>
                <Label className="text-xs" htmlFor="precio_unitario">
                  Precio unitario
                </Label>
                <Input id="precio_unitario" name="precio_unitario" type="number" step="0.01" min={0} required defaultValue={0} />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button type="submit">
                <Plus className="h-4 w-4" />
                Agregar partida
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Cambio de estado — siempre disponible salvo cuando ya está aprobada (terminal: generó proyecto) */}
      {estado !== 'aprobada' && partidas.length > 0 && (
        <div className="azur-card flex flex-wrap items-center justify-between gap-3 bg-azur-coral/10">
          <div>
            <p className="font-display text-base font-bold text-azur-ink">Cambiar estado</p>
            <p className="text-xs text-muted-foreground">
              Al marcar como aprobada, se generará automáticamente el proyecto con el presupuesto
              descontado el margen comercial.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {estado !== 'enviada' && (
              <form action={cambiarEstadoCotizacion} className="contents">
                <input type="hidden" name="id" value={cot.id} />
                <input type="hidden" name="estado" value="enviada" />
                <Button type="submit" variant="secondary">
                  Enviada
                </Button>
              </form>
            )}
            {estado !== 'en_negociacion' && (
              <form action={cambiarEstadoCotizacion} className="contents">
                <input type="hidden" name="id" value={cot.id} />
                <input type="hidden" name="estado" value="en_negociacion" />
                <Button type="submit" variant="secondary">
                  En negociación
                </Button>
              </form>
            )}
            {estado !== 'rechazada' && (
              <form action={cambiarEstadoCotizacion} className="contents">
                <input type="hidden" name="id" value={cot.id} />
                <input type="hidden" name="estado" value="rechazada" />
                <Button type="submit" variant="outline">
                  Rechazada
                </Button>
              </form>
            )}
            <form action={cambiarEstadoCotizacion} className="contents">
              <input type="hidden" name="id" value={cot.id} />
              <input type="hidden" name="estado" value="aprobada" />
              <Button type="submit">Marcar aprobada</Button>
            </form>
          </div>
        </div>
      )}

      {estado === 'aprobada' && (
        <div className="azur-card border-success/30 bg-success/5">
          <p className="font-display text-base font-bold text-success">
            ✓ Cotización aprobada
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            El proyecto fue generado automáticamente.{' '}
            {cot.proyecto_id && (
              <Link
                href={`/proyectos/${cot.proyecto_id}`}
                className="font-semibold text-azur-red hover:underline"
              >
                Ver proyecto →
              </Link>
            )}
          </p>
        </div>
      )}

      <p className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <Link href="/comercial/cotizaciones" className="hover:text-azur-red">
          ← Volver al listado
        </Link>
        <span>Última actualización: {new Date(cot.updated_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</span>
      </p>
    </div>
  );
}
