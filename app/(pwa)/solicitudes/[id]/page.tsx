import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  MessageCircleHeart,
  Receipt,
  User,
  XCircle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/server';
import { Badge } from '@/components/ui/badge';
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

export const dynamic = 'force-dynamic';

export default async function PwaSolicitudDetallePage({ params }: { params: { id: string } }) {
  await requireSession();
  const supabase = createClient();

  const { data: sol } = await supabase
    .from('solicitudes_pago')
    .select('*, proyecto:proyecto_id(id, codigo, nombre)')
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

  // URL pública del voucher
  let voucherPublicUrl: string | null = null;
  if (pago?.voucher_token) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    voucherPublicUrl = `${origin}/voucher/${pago.voucher_token}`;
  }

  // Signed URL del voucher para preview
  let voucherPreviewUrl: string | null = null;
  if (pago?.voucher_path) {
    const admin = createAdminClient();
    const { data: signed } = await admin.storage
      .from('vouchers')
      .createSignedUrl(pago.voucher_path, 60 * 30);
    voucherPreviewUrl = signed?.signedUrl ?? null;
  }

  const wa = pago?.voucher_path && voucherPublicUrl
    ? buildWhatsAppShareLink({
        beneficiario: sol.beneficiario,
        concepto: sol.concepto,
        monto: fmt(Number(pago.monto)),
        fecha: pago.fecha_ejecutado
          ? new Date(pago.fecha_ejecutado).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })
          : new Date(pago.fecha_programada).toLocaleDateString('es-PE', { timeZone: 'America/Lima' }),
        voucherUrl: voucherPublicUrl,
      })
    : null;

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <Link href="/solicitudes" className="text-xs font-semibold text-muted-foreground hover:text-azur-red">
          ← Mis solicitudes
        </Link>
        <div className="flex items-start justify-between gap-2">
          <h1 className="flex items-center gap-2 font-display text-xl font-bold text-azur-ink">
            <Receipt className="h-6 w-6 text-azur-red" />
            {sol.codigo}
          </h1>
          <Badge variant={SOLICITUD_ESTADO_VARIANT[estado]}>
            {SOLICITUD_ESTADO_LABEL[estado]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{sol.concepto}</p>
      </header>

      {/* Monto destacado */}
      <div className="azur-card bg-azur-gradient text-white">
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Monto</p>
        <p className="mt-1 font-display text-3xl font-bold">{fmt(Number(sol.monto))}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="default" className="bg-white/20 text-white">
            {SOLICITUD_CATEGORIA_LABEL[sol.categoria] ?? sol.categoria}
          </Badge>
          <Badge variant={URGENCIA_VARIANT[sol.urgencia] ?? 'outline'} className="bg-white/20 text-white">
            {URGENCIA_LABEL[sol.urgencia] ?? sol.urgencia}
          </Badge>
        </div>
      </div>

      {/* Detalle */}
      <div className="azur-card space-y-3 text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Beneficiario
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 font-medium text-azur-ink">
            <User className="h-3.5 w-3.5 text-azur-red" />
            {sol.beneficiario}
          </p>
        </div>
        {proyecto && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Proyecto
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 font-medium text-azur-ink">
              <Building2 className="h-3.5 w-3.5 text-azur-red" />
              <span className="font-mono text-[11px] text-azur-red">{proyecto.codigo}</span>
              {proyecto.nombre}
            </p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Solicitado
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {new Date(sol.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })}
          </p>
        </div>
        {sol.notas && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notas
            </p>
            <p className="mt-0.5 text-azur-ink">{sol.notas}</p>
          </div>
        )}
        {sol.motivo_rechazo && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-destructive">
              <XCircle className="h-3 w-3" />
              Motivo de rechazo
            </p>
            <p className="mt-1 text-azur-ink">{sol.motivo_rechazo}</p>
          </div>
        )}
      </div>

      {/* Estado del flujo */}
      <div className="azur-card space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Estado del flujo
        </p>
        <ol className="space-y-2">
          <StepItem ok done label="Solicitada" />
          <StepItem
            ok={
              estado === 'aprobada_jefe' ||
              estado === 'programada' ||
              estado === 'pagada'
            }
            done={
              estado === 'aprobada_jefe' ||
              estado === 'programada' ||
              estado === 'pagada'
            }
            error={estado === 'rechazada' || estado === 'cancelada'}
            label="Aprobada por jefe"
          />
          <StepItem
            ok={estado === 'programada' || estado === 'pagada'}
            done={estado === 'programada' || estado === 'pagada'}
            label="Programada por administrador"
          />
          <StepItem ok={estado === 'pagada'} done={estado === 'pagada'} label="Pagada · voucher emitido" />
        </ol>
      </div>

      {/* Pago + voucher */}
      {pago && (
        <div className="azur-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-base font-bold text-azur-ink">Pago {pago.codigo}</p>
            <Badge variant={pago.voucher_path ? 'success' : 'warning'}>
              {pago.voucher_path ? 'Voucher emitido' : 'Sin voucher'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {pago.banco_origen && (
              <KV label="Banco origen" value={pago.banco_origen} />
            )}
            {pago.numero_operacion && <KV label="N° Operación" value={pago.numero_operacion} mono />}
            {pago.fecha_ejecutado && (
              <KV label="Fecha pagado" value={new Date(pago.fecha_ejecutado).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })} />
            )}
          </div>
          {voucherPreviewUrl && (
            <a
              href={voucherPreviewUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-azur-coral hover:text-azur-red"
            >
              <Receipt className="h-4 w-4" />
              Ver voucher
            </a>
          )}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-semibold text-white shadow-azur-md hover:opacity-90"
            >
              <MessageCircleHeart className="h-4 w-4" />
              Compartir por WhatsApp
            </a>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-muted-foreground">
        <Link href="/solicitudes" className="inline-flex items-center gap-1 hover:text-azur-red">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a mis solicitudes
        </Link>
      </p>
    </div>
  );
}

function StepItem({
  ok,
  done,
  error,
  label,
}: {
  ok: boolean;
  done: boolean;
  error?: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
          error
            ? 'bg-destructive/15 text-destructive'
            : done
              ? 'bg-success/15 text-success'
              : 'bg-muted text-muted-foreground'
        }`}
      >
        {error ? <XCircle className="h-3.5 w-3.5" /> : done ? <CheckCircle2 className="h-3.5 w-3.5" /> : '·'}
      </span>
      <span className={done || error ? 'font-medium text-azur-ink' : 'text-muted-foreground'}>
        {label}
      </span>
    </li>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 ${mono ? 'font-mono' : 'font-medium'} text-azur-ink`}>{value}</p>
    </div>
  );
}
