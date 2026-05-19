import Link from 'next/link';
import { Plus, Wallet } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { formatPEN } from '@/lib/utils';
import {
  SOLICITUD_ESTADO_LABEL,
  SOLICITUD_ESTADO_VARIANT,
  SOLICITUD_CATEGORIA_LABEL,
  type SolicitudEstado,
} from '@/lib/finanzas/estados';

export const metadata = { title: 'Mis solicitudes de pago' };
export const dynamic = 'force-dynamic';

export default async function PwaSolicitudesPage() {
  const session = await requireSession();
  const supabase = createClient();

  const { data: rows } = await supabase
    .from('solicitudes_pago')
    .select('id, codigo, concepto, beneficiario, monto, moneda, categoria, estado, created_at')
    .eq('solicitado_por', session.userId)
    .order('created_at', { ascending: false })
    .limit(30);

  const solicitudes = rows ?? [];

  return (
    <div className="space-y-5">
      <header className="space-y-1.5">
        <Link href="/inicio" className="text-xs font-semibold text-muted-foreground hover:text-azur-red">
          ← Inicio
        </Link>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-azur-ink">
          <Wallet className="h-6 w-6 text-azur-red" />
          Mis solicitudes
        </h1>
        <p className="text-sm text-muted-foreground">
          Solicita pagos de proveedores, contratistas o caja chica desde tu celular.
        </p>
      </header>

      <Link href="/solicitudes/nueva" className="block">
        <Button size="lg" className="w-full">
          <Plus className="h-5 w-5" />
          Nueva solicitud
        </Button>
      </Link>

      {solicitudes.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin solicitudes propias"
          description="Toca 'Nueva solicitud' para registrar el primer pago. La aprobación pasa por jefe → administrador."
        />
      ) : (
        <ul className="space-y-2">
          {solicitudes.map((s) => {
            const fmt = (n: number) =>
              s.moneda === 'USD'
                ? `$ ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : formatPEN(n);
            return (
              <li key={s.id}>
                <Link
                  href={`/solicitudes/${s.id}`}
                  className="azur-card flex items-center gap-3 transition-all active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-[10px] font-semibold text-azur-red">{s.codigo}</p>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString('es-PE', { timeZone: 'America/Lima',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-azur-ink">
                      {s.concepto}
                    </p>
                    <p className="line-clamp-1 text-[11px] text-muted-foreground">
                      {s.beneficiario} · {SOLICITUD_CATEGORIA_LABEL[s.categoria] ?? s.categoria}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <Badge variant={SOLICITUD_ESTADO_VARIANT[s.estado as SolicitudEstado]}>
                        {SOLICITUD_ESTADO_LABEL[s.estado as SolicitudEstado]}
                      </Badge>
                      <p className="font-mono text-sm font-bold text-azur-ink">
                        {fmt(Number(s.monto))}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
