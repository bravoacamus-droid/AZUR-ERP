import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText, MessageCircleHeart, Receipt, Upload } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPEN } from '@/lib/utils';
import {
  SOLICITUD_ESTADO_LABEL,
  SOLICITUD_ESTADO_VARIANT,
  SOLICITUD_CATEGORIA_LABEL,
  URGENCIA_LABEL,
  URGENCIA_VARIANT,
  type SolicitudEstado,
  buildWhatsAppShareLink,
} from '@/lib/finanzas/estados';
import { decidirSolicitud, programarPago, subirVoucher } from '../actions';

export const dynamic = 'force-dynamic';

export default async function SolicitudDetallePage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const supabase = createClient();

  const { data: sol } = await supabase
    .from('solicitudes_pago')
    .select(
      '*, proyecto:proyecto_id(id, codigo, nombre)',
    )
    .eq('id', params.id)
    .single();

  if (!sol) notFound();

  const { data: pago } = await supabase
    .from('pagos')
    .select('*')
    .eq('solicitud_id', params.id)
    .maybeSingle();

  const proyecto = Array.isArray(sol.proyecto) ? sol.proyecto[0] : sol.proyecto;
  const estado = sol.estado as SolicitudEstado;
  const moneda = (sol.moneda as 'PEN' | 'USD') ?? 'PEN';
  const fmt = (n: number) =>
    moneda === 'USD'
      ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatPEN(n);

  // Rol-gates
  const puedeAprobar = ['gerencia_general', 'jefe_proyectos', 'jefe_presupuestos'].includes(
    session.rol,
  ) && estado === 'pendiente';
  const puedeProgramar = ['gerencia_general', 'administrador'].includes(session.rol) && estado === 'aprobada_jefe';
  const puedeSubirVoucher =
    ['gerencia_general', 'administrador'].includes(session.rol) && pago && !pago.voucher_path;

  // URL pública del voucher
  let voucherPublicUrl: string | null = null;
  if (pago?.voucher_token) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    voucherPublicUrl = `${origin}/voucher/${pago.voucher_token}`;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={sol.concepto}
        description={`${sol.codigo} · ${SOLICITUD_CATEGORIA_LABEL[sol.categoria] ?? sol.categoria}`}
        icon={Receipt}
        breadcrumbs={[
          { label: 'Finanzas' },
          { label: 'Solicitudes', href: '/finanzas/solicitudes' },
          { label: sol.codigo ?? '—' },
        ]}
        actions={
          <Badge variant={SOLICITUD_ESTADO_VARIANT[estado]}>
            {SOLICITUD_ESTADO_LABEL[estado]}
          </Badge>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="azur-card md:col-span-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Detalle
          </p>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Proyecto</p>
              {proyecto && (
                <Link
                  href={`/proyectos/${proyecto.id}`}
                  className="text-azur-red hover:underline"
                >
                  {proyecto.codigo} · {proyecto.nombre}
                </Link>
              )}
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Beneficiario</p>
              <p className="font-medium text-azur-ink">{sol.beneficiario}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Urgencia</p>
              <Badge variant={URGENCIA_VARIANT[sol.urgencia] ?? 'outline'}>
                {URGENCIA_LABEL[sol.urgencia] ?? sol.urgencia}
              </Badge>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Solicitado</p>
              <p className="font-medium text-azur-ink">
                {new Date(sol.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
              </p>
            </div>
            {sol.notas && (
              <div className="col-span-2">
                <p className="text-[11px] text-muted-foreground">Notas</p>
                <p className="text-sm text-azur-ink">{sol.notas}</p>
              </div>
            )}
            {sol.motivo_rechazo && (
              <div className="col-span-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-[11px] font-semibold uppercase text-destructive">Motivo de rechazo</p>
                <p className="mt-1 text-sm">{sol.motivo_rechazo}</p>
              </div>
            )}
          </div>
        </div>

        <div className="azur-card bg-azur-gradient text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Monto</p>
          <p className="mt-1 font-display text-3xl font-bold">{fmt(Number(sol.monto))}</p>
          <p className="mt-1 text-[11px] opacity-80">{moneda} · {SOLICITUD_CATEGORIA_LABEL[sol.categoria]}</p>
        </div>
      </div>

      {/* Aprobación */}
      {puedeAprobar && (
        <div className="azur-card bg-azur-coral/10">
          <p className="font-display text-base font-bold text-azur-ink">Tu decisión</p>
          <p className="text-xs text-muted-foreground">
            Aprueba para que el administrador la programe, o rechaza con un motivo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={decidirSolicitud} className="contents">
              <input type="hidden" name="id" value={sol.id} />
              <input type="hidden" name="decision" value="aprobar_jefe" />
              <Button type="submit">Aprobar</Button>
            </form>
            <form action={decidirSolicitud} className="contents">
              <input type="hidden" name="id" value={sol.id} />
              <input type="hidden" name="decision" value="rechazar" />
              <input
                name="motivo"
                placeholder="Motivo de rechazo"
                className="h-10 rounded-full border border-input bg-white px-4 text-sm"
              />
              <Button type="submit" variant="destructive">
                Rechazar
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Programar pago */}
      {puedeProgramar && (
        <form action={programarPago} className="azur-card space-y-4">
          <input type="hidden" name="solicitud_id" value={sol.id} />
          <h2 className="font-display text-lg font-bold text-azur-ink">Programar pago</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="monto">Monto</Label>
              <Input id="monto" name="monto" type="number" step="0.01" min={0.01} required defaultValue={Number(sol.monto)} />
            </div>
            <div>
              <Label htmlFor="fecha_programada">Fecha programada</Label>
              <Input
                id="fecha_programada"
                name="fecha_programada"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <Label htmlFor="numero_operacion">N° Operación</Label>
              <Input id="numero_operacion" name="numero_operacion" placeholder="(opcional, post-ejecución)" />
            </div>
            <div>
              <Label htmlFor="banco_origen">Banco origen</Label>
              <Input id="banco_origen" name="banco_origen" placeholder="BCP / BBVA / etc." />
            </div>
            <div>
              <Label htmlFor="cuenta_origen">Cuenta origen</Label>
              <Input id="cuenta_origen" name="cuenta_origen" />
            </div>
            <div>
              <Label htmlFor="banco_destino">Banco destino</Label>
              <Input id="banco_destino" name="banco_destino" />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="cuenta_destino">Cuenta destino / CCI</Label>
              <Input id="cuenta_destino" name="cuenta_destino" />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                name="observaciones"
                rows={2}
                className="flex w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus-visible:border-azur-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azur-coral/40"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Programar y registrar</Button>
          </div>
        </form>
      )}

      {/* Voucher / pago ejecutado */}
      {pago && (
        <div className="azur-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-azur-ink">Pago {pago.codigo}</h2>
            <Badge variant={pago.voucher_path ? 'success' : 'warning'}>
              {pago.voucher_path ? 'Voucher cargado' : 'Pendiente voucher'}
            </Badge>
          </div>
          <div className="grid gap-3 text-xs sm:grid-cols-4">
            <KV label="Fecha programada" value={new Date(pago.fecha_programada).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} />
            <KV
              label="Fecha ejecutado"
              value={pago.fecha_ejecutado ? new Date(pago.fecha_ejecutado).toLocaleDateString('es-PE', { timeZone: 'America/Lima' }) : '—'}
            />
            <KV label="Banco origen" value={pago.banco_origen ?? '—'} />
            <KV label="N° Operación" value={pago.numero_operacion ?? '—'} />
          </div>

          {puedeSubirVoucher && (
            <form action={subirVoucher} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="pago_id" value={pago.id} />
              <div className="flex-1">
                <Label htmlFor="file">Subir voucher (PDF o imagen, máx 5 MB)</Label>
                <input
                  id="file"
                  type="file"
                  name="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  required
                  className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-azur-red file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-azur-bright"
                />
              </div>
              <Button type="submit">
                <Upload className="h-4 w-4" />
                Subir y marcar pagada
              </Button>
            </form>
          )}

          {pago.voucher_path && voucherPublicUrl && (
            <VoucherShareBlock
              voucherUrl={voucherPublicUrl}
              path={pago.voucher_path}
              beneficiario={sol.beneficiario}
              concepto={sol.concepto}
              monto={fmt(Number(pago.monto))}
              fecha={
                pago.fecha_ejecutado
                  ? new Date(pago.fecha_ejecutado).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })
                  : new Date(pago.fecha_programada).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })
              }
            />
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        <Link href="/finanzas/solicitudes" className="inline-flex items-center gap-1 hover:text-azur-red">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al listado
        </Link>
      </p>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-white/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium text-azur-ink">{value}</p>
    </div>
  );
}

async function VoucherShareBlock(props: {
  voucherUrl: string;
  path: string;
  beneficiario: string;
  concepto: string;
  monto: string;
  fecha: string;
}) {
  // Signed URL para preview (no expone el bucket)
  const admin = createAdminClient();
  const { data: signed } = await admin.storage
    .from('vouchers')
    .createSignedUrl(props.path, 60 * 30);

  const wa = buildWhatsAppShareLink({
    beneficiario: props.beneficiario,
    concepto: props.concepto,
    monto: props.monto,
    fecha: props.fecha,
    voucherUrl: props.voucherUrl,
  });

  return (
    <div className="grid gap-4 rounded-2xl border border-success/30 bg-success/5 p-4 md:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-success">
          Voucher disponible
        </p>
        <p className="text-sm">Enlace público (sin login, para compartir):</p>
        <code className="block break-all rounded-lg bg-white p-2 text-[11px] text-azur-ink">
          {props.voucherUrl}
        </code>
        <div className="flex flex-wrap gap-2 pt-1">
          <a
            href={signed?.signedUrl ?? '#'}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-xs font-semibold transition-colors hover:border-azur-coral hover:text-azur-red"
          >
            <FileText className="h-3.5 w-3.5" />
            Ver voucher (preview)
          </a>
          <a
            href={wa}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-xs font-semibold text-white shadow-azur-md hover:opacity-90"
          >
            <MessageCircleHeart className="h-3.5 w-3.5" />
            Compartir por WhatsApp
          </a>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Vista previa pública (página /voucher/{'{token}'})
        </p>
        <iframe
          src={props.voucherUrl}
          className="h-56 w-full rounded-lg border border-border"
          title="Voucher preview"
        />
      </div>
    </div>
  );
}
