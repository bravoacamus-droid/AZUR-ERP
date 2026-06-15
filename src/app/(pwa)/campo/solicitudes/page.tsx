import Link from 'next/link';
import { ChevronLeft, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth';
import { fmtDate, fmtMoney } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/misc';
import { STATUS_SOLICITUD, TIPO_SOLICITUD_LABEL } from '@/lib/estados';
import { SolicitudForm } from './solicitud-form';

export const dynamic = 'force-dynamic';

export default async function SolicitudesPage() {
  const session = await requireSession();
  const supabase = createClient();

  const [{ data: proyectos }, { data: partidas }, { data: solicitudes }] = await Promise.all([
    supabase.from('proyectos').select('id, nombre').order('created_at', { ascending: false }),
    supabase.from('proyecto_items').select('id, titulo, proyecto_id').eq('es_hoja', true).order('orden'),
    supabase
      .from('solicitudes_pago')
      .select('id, codigo, tipo, monto, status, beneficiario_nombre, created_at')
      .eq('solicitado_por', session.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/campo" className="mb-1 inline-flex items-center text-sm text-muted-foreground">
          <ChevronLeft className="size-4" /> Campo
        </Link>
        <h1 className="text-xl font-bold">Solicitud de pago</h1>
      </div>

      <SolicitudForm proyectos={proyectos ?? []} partidas={partidas ?? []} />

      <div className="rounded-2xl border bg-white p-4">
        <div className="mb-2 flex items-center gap-2">
          <Receipt className="size-4 text-azur-600" />
          <p className="text-sm font-semibold">Mis solicitudes</p>
        </div>
        {!solicitudes || solicitudes.length === 0 ? (
          <EmptyState titulo="Sin solicitudes" descripcion="Aún no has registrado solicitudes." />
        ) : (
          <ul className="divide-y">
            {solicitudes.map((s) => {
              const st = STATUS_SOLICITUD[s.status] ?? { label: s.status, variant: 'muted' as const };
              return (
                <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {s.codigo ?? '—'} · {fmtMoney(s.monto)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {TIPO_SOLICITUD_LABEL[s.tipo] ?? s.tipo}
                      {s.beneficiario_nombre ? ` · ${s.beneficiario_nombre}` : ''} · {fmtDate(s.created_at)}
                    </p>
                  </div>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
