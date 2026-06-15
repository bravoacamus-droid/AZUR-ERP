'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/dialog';
import { Field, EmptyState } from '@/components/ui/misc';
import { KpiCard } from '@/components/ui/page';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { fmtMoney, fmtDateTime } from '@/lib/format';
import { movimientoCaja } from '../../actions';

/* eslint-disable @typescript-eslint/no-explicit-any */

const TIPO_MOV: Record<string, { label: string; signo: number; variant: any }> = {
  abono: { label: 'Abono', signo: 1, variant: 'success' },
  reposicion: { label: 'Reposición', signo: 1, variant: 'success' },
  egreso: { label: 'Egreso', signo: -1, variant: 'danger' },
  traslado: { label: 'Traslado', signo: 1, variant: 'info' },
  ajuste: { label: 'Ajuste', signo: 1, variant: 'muted' },
};

export function CajaDetalle({ caja, movimientos, canManage }: any) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ tipo: 'reposicion', monto: 0, concepto: '' });

  const ingresos = movimientos.filter((m: any) => ['abono', 'reposicion'].includes(m.tipo)).reduce((a: number, m: any) => a + Number(m.monto), 0);
  const egresos = movimientos.filter((m: any) => m.tipo === 'egreso').reduce((a: number, m: any) => a + Number(m.monto), 0);
  const pctUso = caja.monto_maximo > 0 ? 1 - Number(caja.saldo_actual) / Number(caja.monto_maximo) : 0;

  async function registrar() {
    setBusy(true);
    await movimientoCaja({ caja_id: caja.caja_id, proyecto_id: caja.proyecto_id, tipo: form.tipo, monto: Number(form.monto), concepto: form.concepto });
    setOpen(false);
    setForm({ tipo: 'reposicion', monto: 0, concepto: '' });
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-azur-50 text-azur-600"><Wallet className="size-5" /></span>
            <div>
              <h1 className="text-xl font-bold">{caja.nombre}</h1>
              <Badge variant={caja.tipo === 'central' ? 'info' : 'secondary'}>{caja.tipo === 'central' ? 'Caja Central' : 'Caja chica'}</Badge>
            </div>
          </div>
          {canManage && <Button variant="gradient" onClick={() => setOpen(true)}><Plus /> Registrar movimiento</Button>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Saldo actual" value={fmtMoney(Number(caja.saldo_actual))} icon={<Wallet />} tone="azur" />
        <KpiCard label="Ingresos" value={fmtMoney(ingresos)} icon={<ArrowDownCircle />} tone="success" />
        <KpiCard label="Egresos" value={fmtMoney(egresos)} icon={<ArrowUpCircle />} />
        <KpiCard label="Tope" value={fmtMoney(Number(caja.monto_maximo))} sub={caja.monto_maximo > 0 ? `${Math.round(pctUso * 100)}% consumido` : undefined} />
      </div>

      {caja.monto_maximo > 0 && pctUso > 0.8 && (
        <div className="rounded-lg border border-azur-100 bg-azur-50/50 px-4 py-2 text-sm text-azur-700">
          ⚠ Consumo &gt; 80% del tope — anticipar reposición.
        </div>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><ArrowLeftRight className="size-4" /> Historial de transacciones</CardTitle></CardHeader>
        <CardContent className="p-0">
          {movimientos.length === 0 ? (
            <div className="p-6"><EmptyState titulo="Sin movimientos" descripcion="Aún no hay transacciones en esta caja." /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Fecha</TableHead><TableHead>Tipo</TableHead><TableHead>Concepto</TableHead><TableHead>Autor</TableHead><TableHead className="text-right">Monto</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {movimientos.map((m: any) => {
                  const t = TIPO_MOV[m.tipo] ?? { label: m.tipo, signo: 1, variant: 'muted' };
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDateTime(m.created_at)}</TableCell>
                      <TableCell><Badge variant={t.variant}>{t.label}</Badge></TableCell>
                      <TableCell>{m.concepto ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{m.autor?.nombre ?? '—'}</TableCell>
                      <TableCell className={`text-right font-medium tabular-nums ${t.signo < 0 ? 'text-azur-600' : 'text-emerald-600'}`}>
                        {t.signo < 0 ? '−' : '+'} {fmtMoney(Number(m.monto))}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Registrar movimiento"
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="gradient" disabled={busy} onClick={registrar}>{busy ? <Loader2 className="animate-spin" /> : null} Registrar</Button></>}>
        <div className="space-y-2">
          <Field label="Tipo">
            <Select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
              <option value="reposicion">Reposición (+)</option>
              <option value="abono">Abono (+)</option>
              <option value="egreso">Egreso (−)</option>
              <option value="traslado">Traslado</option>
              <option value="ajuste">Ajuste</option>
            </Select>
          </Field>
          <Field label="Monto"><Input type="number" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: Number(e.target.value) }))} /></Field>
          <Field label="Concepto"><Input value={form.concepto} onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}
