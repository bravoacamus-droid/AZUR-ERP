'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Receipt, Eye, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/misc';
import { SearchBox, Pagination } from '@/components/ui/list-tools';
import { fmtDate, fmtMoney } from '@/lib/format';
import { STATUS_SOLICITUD, TIPO_SOLICITUD_LABEL } from '@/lib/estados';

type Solicitud = {
  id: string; codigo: string | null; tipo: string; categoria: string | null; categoria_etapa: string | null;
  monto: number; moneda: string | null; status: string; beneficiario_nombre: string | null;
  razon_social: string | null; ruc_dni: string | null; descripcion: string | null;
  sustento_url: string | null; sustento_urls?: string[] | null; voucher_url: string | null; detraccion_monto: number | null;
  motivo_rechazo: string | null; fecha_programada: string | null;
  aprobado_at: string | null; programado_at: string | null; pagado_at: string | null;
  num_operacion: string | null; created_at: string; proyecto?: { nombre?: string } | null;
};

const ESTADOS = ['solicitada', 'aprobada', 'programada', 'pagada', 'conciliada', 'rechazada', 'devuelta'];

export function MisSolicitudes({ solicitudes, total, page, pageSize, estado }: {
  solicitudes: Solicitud[]; total: number; page: number; pageSize: number; estado: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [detalle, setDetalle] = React.useState<Solicitud | null>(null);

  const setEstado = (val: string) => {
    const params = new URLSearchParams(Array.from(sp.entries()));
    if (val) params.set('estado', val); else params.delete('estado');
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Receipt className="size-4 text-azur-600" />
        <p className="text-sm font-semibold">Mis solicitudes</p>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchBox placeholder="Buscar por código o beneficiario…" />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-lg border bg-white px-2 py-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((s) => <option key={s} value={s}>{STATUS_SOLICITUD[s]?.label ?? s}</option>)}
        </select>
      </div>

      {solicitudes.length === 0 ? (
        <EmptyState titulo="Sin solicitudes" descripcion={estado || sp.get('q') ? 'No hay solicitudes con ese filtro.' : 'Aún no has registrado solicitudes.'} />
      ) : (
        <ul className="divide-y">
          {solicitudes.map((s) => {
            const st = STATUS_SOLICITUD[s.status] ?? { label: s.status, variant: 'muted' as const };
            return (
              <li key={s.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{s.codigo ?? '—'} · {fmtMoney(s.monto, s.moneda ?? 'PEN')}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {TIPO_SOLICITUD_LABEL[s.tipo] ?? s.tipo}
                    {s.beneficiario_nombre ? ` · ${s.beneficiario_nombre}` : ''} · {fmtDate(s.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={st.variant}>{st.label}</Badge>
                  <button type="button" onClick={() => setDetalle(s)} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-azur-600" aria-label="Ver detalle">
                    <Eye className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {total > pageSize && (
        <div className="-mx-4 -mb-4 mt-2">
          <Pagination page={page} total={total} pageSize={pageSize} />
        </div>
      )}

      <DetalleModal s={detalle} onClose={() => setDetalle(null)} />
    </div>
  );
}

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === '' ) return null;
  return (
    <div className="flex justify-between gap-3 border-b py-1.5 last:border-0">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm">{children}</span>
    </div>
  );
}

function DetalleModal({ s, onClose }: { s: Solicitud | null; onClose: () => void }) {
  if (!s) return null;
  const st = STATUS_SOLICITUD[s.status] ?? { label: s.status, variant: 'muted' as const };
  const moneda = s.moneda ?? 'PEN';
  return (
    <Modal open onClose={onClose} title={s.codigo ?? 'Solicitud de pago'}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">{fmtMoney(s.monto, moneda)}</span>
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>

        <div>
          <Fila label="Tipo">{TIPO_SOLICITUD_LABEL[s.tipo] ?? s.tipo}</Fila>
          <Fila label="Categoría">{s.categoria || s.categoria_etapa || null}</Fila>
          <Fila label="Proyecto">{s.proyecto?.nombre || null}</Fila>
          <Fila label="Beneficiario">{s.beneficiario_nombre || s.razon_social || null}</Fila>
          <Fila label="RUC / DNI">{s.ruc_dni || null}</Fila>
          {s.detraccion_monto ? <Fila label="Detracción">{fmtMoney(Number(s.detraccion_monto), moneda)}</Fila> : null}
          <Fila label="Descripción">{s.descripcion || null}</Fila>
        </div>

        {/* Seguimiento del estado */}
        <div className="rounded-xl bg-secondary/30 p-3">
          <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Seguimiento</p>
          <Fila label="Registrada">{fmtDate(s.created_at)}</Fila>
          {s.aprobado_at ? <Fila label="Aprobada">{fmtDate(s.aprobado_at)}</Fila> : null}
          {(s.programado_at || s.fecha_programada) ? <Fila label="Programada">{fmtDate(s.fecha_programada || s.programado_at!)}</Fila> : null}
          {s.pagado_at ? <Fila label="Pagada">{fmtDate(s.pagado_at)}{s.num_operacion ? ` · Op. ${s.num_operacion}` : ''}</Fila> : null}
          {s.motivo_rechazo ? (
            <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
              <span className="font-semibold">Motivo: </span>{s.motivo_rechazo}
            </div>
          ) : null}
        </div>

        {(s.sustento_url || s.voucher_url || (s.sustento_urls?.length ?? 0) > 0) && (
          <div className="flex flex-wrap gap-2">
            {(s.sustento_urls?.length ? s.sustento_urls : (s.sustento_url ? [s.sustento_url] : [])).map((u, i, arr) => (
              <a key={u} href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-azur-600">
                <ExternalLink className="size-3.5" /> Ver sustento{arr.length > 1 ? ` ${i + 1}/${arr.length}` : ''}
              </a>
            ))}
            {s.voucher_url && (
              <a href={s.voucher_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-azur-600">
                <ExternalLink className="size-3.5" /> Ver voucher
              </a>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
