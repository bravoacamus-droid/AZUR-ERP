import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { formatPEN } from '@/lib/utils';
import { CheckCircle2, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VoucherPublicPage({ params }: { params: { token: string } }) {
  const admin = createAdminClient();

  const { data: pago } = await admin
    .from('pagos')
    .select(
      'codigo, monto, moneda, fecha_programada, fecha_ejecutado, banco_origen, banco_destino, numero_operacion, voucher_path, solicitud:solicitud_id(codigo, concepto, beneficiario, categoria, proyecto:proyecto_id(codigo, nombre))',
    )
    .eq('voucher_token', params.token)
    .maybeSingle();

  if (!pago || !pago.voucher_path) notFound();

  const { data: signed } = await admin.storage
    .from('vouchers')
    .createSignedUrl(pago.voucher_path, 60 * 60 * 24); // 24h

  const sol = Array.isArray(pago.solicitud) ? pago.solicitud[0] : pago.solicitud;
  const proyecto = sol ? (Array.isArray(sol.proyecto) ? sol.proyecto[0] : sol.proyecto) : null;
  const moneda = (pago.moneda as string) === 'USD' ? 'USD' : 'PEN';
  const fmt = (n: number) =>
    moneda === 'USD'
      ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      : formatPEN(n);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white via-white to-azur-coral/20 p-4 sm:p-10">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-azur-coral/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full bg-azur-red/15 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="azur-glass mb-6 flex items-center justify-between gap-4 rounded-3xl p-5">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="AZUR" width={48} height={60} priority />
            <div>
              <p className="font-display text-lg font-bold text-azur-ink">AZUR Constructora</p>
              <p className="text-xs text-muted-foreground">Constancia de pago</p>
            </div>
          </div>
          <Badge variant="success" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Pago ejecutado
          </Badge>
        </div>

        {/* Datos */}
        <div className="azur-card space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <KV label="Código de pago" value={pago.codigo ?? '—'} mono />
            {sol && <KV label="Solicitud" value={sol.codigo ?? '—'} mono />}
            <KV label="Beneficiario" value={sol?.beneficiario ?? '—'} />
            <KV label="Concepto" value={sol?.concepto ?? '—'} />
            {proyecto && (
              <KV label="Proyecto" value={`${proyecto.codigo} · ${proyecto.nombre}`} />
            )}
            {pago.banco_origen && <KV label="Banco origen" value={pago.banco_origen} />}
            {pago.banco_destino && <KV label="Banco destino" value={pago.banco_destino} />}
            {pago.numero_operacion && <KV label="N° Operación" value={pago.numero_operacion} mono />}
            <KV
              label="Fecha de ejecución"
              value={
                pago.fecha_ejecutado
                  ? new Date(pago.fecha_ejecutado).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'
              }
            />
          </div>

          <div className="rounded-2xl bg-azur-gradient p-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">Monto</p>
            <p className="font-display text-3xl font-bold">{fmt(Number(pago.monto))}</p>
          </div>

          {signed?.signedUrl && (
            <div className="rounded-2xl border border-border/60 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Voucher
                </p>
                <a
                  href={signed.signedUrl}
                  target="_blank"
                  rel="noopener"
                  download
                  className="text-xs font-semibold text-azur-red hover:underline"
                >
                  Descargar
                </a>
              </div>
              <iframe
                src={signed.signedUrl}
                title="Voucher"
                className="h-[480px] w-full rounded-xl border border-border"
              />
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Página pública generada por AZUR ERP · El enlace caduca tras 24h o al regenerarse desde el ERP.
        </p>
      </div>
    </main>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm text-azur-ink ${mono ? 'font-mono' : 'font-medium'}`}>{value}</p>
    </div>
  );
}
