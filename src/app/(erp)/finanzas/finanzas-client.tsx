'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, CalendarClock, Banknote, MessageCircle, FilePlus,
  HandCoins, Wallet, Plus, ShieldCheck, ArrowLeftRight, Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/dialog';
import { Field, EmptyState } from '@/components/ui/misc';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { fmtMoney, fmtDate, fmtDateInput } from '@/lib/format';
import { STATUS_SOLICITUD, TIPO_SOLICITUD_LABEL } from '@/lib/estados';
import { VoucherUpload } from '@/components/finanzas/voucher-upload';
import {
  aprobarSolicitud, rechazarSolicitud, programarPago, marcarPagada, aprobarGerencia,
  emitirFactura, registrarAbono, crearFacturaManual, movimientoCaja, crearCajaChica,
} from './actions';

/* eslint-disable @typescript-eslint/no-explicit-any */

const METODOS = [
  { v: 'transferencia', l: 'Transferencia' }, { v: 'efectivo', l: 'Efectivo' },
  { v: 'yape', l: 'Yape' }, { v: 'plin', l: 'Plin' }, { v: 'deposito', l: 'Depósito' },
  { v: 'cheque', l: 'Cheque' }, { v: 'tarjeta', l: 'Tarjeta' }, { v: 'otro', l: 'Otro' },
];

export function FinanzasClient({ rol, solicitudes, facturas, armadas, cajas, clientes, proyectos, perfiles }: any) {
  const [tab, setTab] = useState('solicitudes');
  return (
    <div className="space-y-4">
      <Tabs value={tab} onChange={setTab} tabs={[
        { value: 'solicitudes', label: 'Solicitudes de pago' },
        { value: 'cxp', label: 'Cuentas por pagar' },
        { value: 'cxc', label: 'Cuentas por cobrar' },
        { value: 'cajas', label: 'Cajas' },
      ]} />
      {tab === 'solicitudes' && <Solicitudes rol={rol} solicitudes={solicitudes} />}
      {tab === 'cxp' && <CxP solicitudes={solicitudes} />}
      {tab === 'cxc' && <CxC rol={rol} facturas={facturas} armadas={armadas} clientes={clientes} proyectos={proyectos} />}
      {tab === 'cajas' && <Cajas rol={rol} cajas={cajas} proyectos={proyectos} perfiles={perfiles} />}
    </div>
  );
}

function Solicitudes({ rol, solicitudes }: any) {
  const router = useRouter();
  const [prog, setProg] = useState<any>(null);
  const [pago, setPago] = useState<any>(null);
  const [rech, setRech] = useState<any>(null);
  const [banco, setBanco] = useState('');
  const [fecha, setFecha] = useState(fmtDateInput(new Date()));
  const [voucher, setVoucher] = useState('');
  const [detr, setDetr] = useState(0);
  const [metodoPago, setMetodoPago] = useState('transferencia');
  const [numOp, setNumOp] = useState('');
  const [motivo, setMotivo] = useState('');
  const [detalle, setDetalle] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const puedeAprobar = rol === 'jefe_proyectos' || rol === 'gerencia';
  const puedePagar = rol === 'administrador' || rol === 'gerencia';
  const esGerencia = rol === 'gerencia';

  const wa = (s: any) => encodeURIComponent(`*AZUR* Comprobante de pago\n${s.codigo} · ${s.beneficiario_nombre ?? ''}\nMonto: ${fmtMoney(Number(s.monto))}\n${s.voucher_url ?? ''}`);

  return (
    <Card>
      <CardContent className="p-0">
        {solicitudes.length === 0 ? (
          <div className="p-6"><EmptyState titulo="Sin solicitudes" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Proyecto</TableHead>
                <TableHead>Beneficiario</TableHead><TableHead>Monto</TableHead><TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitudes.map((s: any) => {
                const st = STATUS_SOLICITUD[s.status] ?? { label: s.status, variant: 'muted' as const };
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.codigo}</TableCell>
                    <TableCell><Badge variant="outline">{TIPO_SOLICITUD_LABEL[s.tipo] ?? s.tipo}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{s.proyecto?.nombre ?? '—'}</TableCell>
                    <TableCell>{s.beneficiario_nombre ?? s.razon_social ?? '—'}</TableCell>
                    <TableCell className="tabular-nums">{fmtMoney(Number(s.monto))}</TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                      {s.requiere_gerencia && !s.aprobado_gerencia_por && <Badge variant="warning" className="ml-1">Gerencia</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {s.status === 'solicitada' && puedeAprobar && (
                          <>
                            <Button size="sm" variant="outline" onClick={async () => { setBusy(true); await aprobarSolicitud(s.id); router.refresh(); setBusy(false); }}><CheckCircle2 /> Aprobar</Button>
                            <Button size="sm" variant="ghost" onClick={() => setRech(s)}><XCircle className="text-azur-600" /></Button>
                          </>
                        )}
                        {s.status === 'aprobada' && puedePagar && (
                          <Button size="sm" variant="outline" onClick={() => { setProg(s); setBanco(''); }}><CalendarClock /> Programar</Button>
                        )}
                        {s.status === 'programada' && puedePagar && (
                          <Button size="sm" variant="gradient" onClick={() => { setPago(s); setVoucher(''); setDetr(0); }}><Banknote /> Pagar</Button>
                        )}
                        {s.status === 'pagada' && s.requiere_gerencia && !s.aprobado_gerencia_por && esGerencia && (
                          <Button size="sm" variant="gradient" onClick={async () => { setBusy(true); await aprobarGerencia(s.id); router.refresh(); setBusy(false); }}><ShieldCheck /> Aprobar final</Button>
                        )}
                        {s.voucher_url && (
                          <a href={`https://wa.me/?text=${wa(s)}`} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="ghost"><MessageCircle className="text-emerald-600" /></Button>
                          </a>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setDetalle(s)}><Eye /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Programar */}
      <Modal open={!!prog} onClose={() => setProg(null)} title={`Programar pago · ${prog?.codigo ?? ''}`}
        footer={<><Button variant="outline" onClick={() => setProg(null)}>Cancelar</Button>
          <Button variant="gradient" disabled={busy} onClick={async () => { setBusy(true); await programarPago(prog.id, banco, fecha); setProg(null); router.refresh(); setBusy(false); }}>Programar</Button></>}>
        <div className="space-y-3">
          {prog && <DetalleSolicitud s={prog} />}
          <Field label="Cuenta bancaria de origen"><Input value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Caja central / Interbank / BBVA…" /></Field>
          <Field label="Fecha programada"><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        </div>
      </Modal>

      {/* Pagar */}
      <Modal open={!!pago} onClose={() => setPago(null)} title={`Registrar pago · ${pago?.codigo ?? ''}`}
        description="Registra el desembolso: método, N° de operación y voucher."
        footer={<><Button variant="outline" onClick={() => setPago(null)}>Cancelar</Button>
          <Button variant="gradient" disabled={busy} onClick={async () => { setBusy(true); await marcarPagada(pago.id, { voucherUrl: voucher, detraccion: detr, metodo: metodoPago, num_operacion: numOp }); setPago(null); router.refresh(); setBusy(false); }}>Confirmar pago</Button></>}>
        <div className="space-y-3">
          {pago && <DetalleSolicitud s={pago} />}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Método de pago"><Select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>{METODOS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}</Select></Field>
            <Field label="N° de operación"><Input value={numOp} onChange={(e) => setNumOp(e.target.value)} placeholder="Ej. 00123456" /></Field>
          </div>
          <Field label="Detracción (si aplica)"><Input type="number" value={detr} onChange={(e) => setDetr(Number(e.target.value))} /></Field>
          <Field label="Voucher / comprobante"><VoucherUpload value={voucher} onChange={setVoucher} /></Field>
          {Number(pago?.monto) >= 20000 && rol !== 'gerencia' && <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">⚠ Este monto requerirá aprobación final de Gerencia.</p>}
        </div>
      </Modal>

      {/* Detalle completo de la solicitud */}
      <Modal open={!!detalle} onClose={() => setDetalle(null)} title={`Solicitud ${detalle?.codigo ?? ''}`}>
        {detalle && <DetalleSolicitud s={detalle} full />}
      </Modal>

      {/* Rechazar */}
      <Modal open={!!rech} onClose={() => setRech(null)} title={`Rechazar/Devolver · ${rech?.codigo ?? ''}`}
        footer={<><Button variant="ghost" disabled={busy} onClick={async () => { setBusy(true); await rechazarSolicitud(rech.id, motivo, true); setRech(null); router.refresh(); setBusy(false); }}>Devolver</Button>
          <Button variant="destructive" disabled={busy} onClick={async () => { setBusy(true); await rechazarSolicitud(rech.id, motivo, false); setRech(null); router.refresh(); setBusy(false); }}>Rechazar</Button></>}>
        <Field label="Motivo"><Input value={motivo} onChange={(e) => setMotivo(e.target.value)} /></Field>
      </Modal>
    </Card>
  );
}

function DetalleSolicitud({ s, full }: { s: any; full?: boolean }) {
  const st = STATUS_SOLICITUD[s.status] ?? { label: s.status, variant: 'muted' as const };
  const filas: [string, any][] = [
    ['Tipo', TIPO_SOLICITUD_LABEL[s.tipo] ?? s.tipo],
    ['Proyecto', s.proyecto?.nombre],
    ['Partida ppto.', s.partida_ppto],
    ['Beneficiario', s.beneficiario_nombre ?? s.razon_social],
    ['Monto', fmtMoney(Number(s.monto))],
    ...(full
      ? ([
          ['Especialidad/etapa', s.especialidad],
          ['Categoría/etapa', s.categoria_etapa],
          ['Constancia', s.constancia],
          ['N° comprobante', s.num_comprobante],
          ['RUC/DNI', s.ruc_dni],
          ['Razón social', s.razon_social],
          ['Cuenta bancaria', s.cta_bancaria],
          ['Descripción', s.descripcion],
          ['Banco origen', s.banco_origen],
          ['Método', s.metodo],
          ['N° operación', s.num_operacion],
          ['Detracción', s.detraccion_monto ? fmtMoney(Number(s.detraccion_monto)) : null],
          ['Solicitante', s.solicitante?.nombre],
        ] as [string, any][])
      : []),
  ];
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium">{s.codigo}</span>
        <Badge variant={st.variant}>{st.label}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {filas.filter(([, v]) => v != null && v !== '').map(([k, v]) => (
          <div key={k} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-right font-medium">{String(v)}</span>
          </div>
        ))}
      </div>
      {full && s.voucher_url && (
        <a href={s.voucher_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-azur-600 hover:underline">Ver voucher / comprobante</a>
      )}
      {full && s.motivo_rechazo && <p className="mt-2 text-xs text-azur-700">Motivo: {s.motivo_rechazo}</p>}
    </div>
  );
}

function CxP({ solicitudes }: any) {
  const obligaciones = solicitudes.filter((s: any) => ['aprobada', 'programada'].includes(s.status));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Obligaciones pendientes de ejecutar</CardTitle></CardHeader>
      <CardContent className="p-0">
        {obligaciones.length === 0 ? <div className="p-6"><EmptyState titulo="Sin obligaciones pendientes" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Proveedor</TableHead><TableHead>Proyecto</TableHead><TableHead>Monto</TableHead><TableHead>Estado</TableHead><TableHead>Programado</TableHead></TableRow></TableHeader>
            <TableBody>
              {obligaciones.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.codigo}</TableCell>
                  <TableCell>{s.razon_social ?? s.beneficiario_nombre ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.proyecto?.nombre ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">{fmtMoney(Number(s.monto))}</TableCell>
                  <TableCell><Badge variant={STATUS_SOLICITUD[s.status]?.variant}>{STATUS_SOLICITUD[s.status]?.label}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(s.fecha_programada)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function CxC({ rol, facturas, armadas, clientes, proyectos }: any) {
  const router = useRouter();
  const [abono, setAbono] = useState<any>(null);
  const [monto, setMonto] = useState(0);
  const [nueva, setNueva] = useState(false);
  const [fNew, setFNew] = useState({ cliente_id: '', proyecto_id: '', numero: '', monto: 0, fecha_vencimiento: '' });
  const [busy, setBusy] = useState(false);
  const puede = rol === 'administrador' || rol === 'gerencia';

  // Aging de cuentas por cobrar (Sección 5.4)
  const hoy = Date.now();
  const aging = { corriente: 0, d30: 0, d60: 0, mas60: 0 };
  facturas.forEach((f: any) => {
    if (f.estado === 'cobrada' || f.estado === 'anulada') return;
    const saldo = Number(f.monto) - Number(f.monto_cobrado);
    if (saldo <= 0) return;
    const venc = f.fecha_vencimiento ? new Date(f.fecha_vencimiento).getTime() : hoy;
    const dias = Math.floor((hoy - venc) / 86400000);
    if (dias <= 0) aging.corriente += saldo;
    else if (dias <= 30) aging.d30 += saldo;
    else if (dias <= 60) aging.d60 += saldo;
    else aging.mas60 += saldo;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: 'Corriente', v: aging.corriente, c: 'text-emerald-600' },
          { l: '1–30 días', v: aging.d30, c: 'text-amber-600' },
          { l: '31–60 días', v: aging.d60, c: 'text-orange-600' },
          { l: '+60 días', v: aging.mas60, c: 'text-azur-600' },
        ].map((a) => (
          <Card key={a.l}><CardContent className="p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{a.l}</p><p className={`mt-1 text-xl font-bold tabular-nums ${a.c}`}>{fmtMoney(a.v)}</p></CardContent></Card>
        ))}
      </div>
      {armadas.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Armadas por facturar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {armadas.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                <div><p className="font-medium">{a.proyecto?.nombre} · {a.concepto}</p><p className="text-xs text-muted-foreground">{fmtMoney(Number(a.monto))} · {fmtDate(a.fecha_esperada)}</p></div>
                {puede && <Button size="sm" variant="outline" onClick={async () => { setBusy(true); await emitirFactura(a.id); router.refresh(); setBusy(false); }}><FilePlus /> Emitir factura</Button>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Facturas (CxC)</CardTitle>
          {puede && <Button size="sm" variant="gradient" onClick={() => setNueva(true)}><Plus /> Factura manual</Button>}
        </CardHeader>
        <CardContent className="p-0">
          {facturas.length === 0 ? <div className="p-6"><EmptyState titulo="Sin facturas" /></div> : (
            <Table>
              <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Cliente</TableHead><TableHead>Proyecto</TableHead><TableHead>Monto</TableHead><TableHead>Cobrado</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {facturas.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.numero ?? '—'}</TableCell>
                    <TableCell>{f.cliente?.razon_social ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{f.proyecto?.nombre ?? '—'}</TableCell>
                    <TableCell className="tabular-nums">{fmtMoney(Number(f.monto))}</TableCell>
                    <TableCell className="tabular-nums">{fmtMoney(Number(f.monto_cobrado))}</TableCell>
                    <TableCell><Badge variant={f.estado === 'cobrada' ? 'success' : f.estado === 'parcial' ? 'warning' : f.estado === 'vencida' ? 'danger' : 'info'}>{f.estado}</Badge></TableCell>
                    <TableCell>{puede && f.estado !== 'cobrada' && <Button size="sm" variant="outline" onClick={() => { setAbono(f); setMonto(Number(f.monto) - Number(f.monto_cobrado)); }}><HandCoins /> Cobrar</Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal open={!!abono} onClose={() => setAbono(null)} title="Registrar cobro"
        footer={<><Button variant="outline" onClick={() => setAbono(null)}>Cancelar</Button><Button variant="gradient" disabled={busy} onClick={async () => { setBusy(true); await registrarAbono(abono.id, monto); setAbono(null); router.refresh(); setBusy(false); }}>Registrar</Button></>}>
        <Field label="Monto cobrado"><Input type="number" value={monto} onChange={(e) => setMonto(Number(e.target.value))} /></Field>
      </Modal>

      <Modal open={nueva} onClose={() => setNueva(false)} title="Factura manual"
        footer={<><Button variant="outline" onClick={() => setNueva(false)}>Cancelar</Button><Button variant="gradient" disabled={busy || !fNew.cliente_id} onClick={async () => { setBusy(true); await crearFacturaManual({ ...fNew, proyecto_id: fNew.proyecto_id || undefined, fecha_vencimiento: fNew.fecha_vencimiento || undefined }); setNueva(false); router.refresh(); setBusy(false); }}>Crear</Button></>}>
        <div className="space-y-2">
          <Field label="Cliente"><Select value={fNew.cliente_id} onChange={(e) => setFNew((s) => ({ ...s, cliente_id: e.target.value }))}><option value="">Seleccionar…</option>{clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}</Select></Field>
          <Field label="Proyecto (opcional)"><Select value={fNew.proyecto_id} onChange={(e) => setFNew((s) => ({ ...s, proyecto_id: e.target.value }))}><option value="">—</option>{proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="N° factura"><Input value={fNew.numero} onChange={(e) => setFNew((s) => ({ ...s, numero: e.target.value }))} /></Field>
            <Field label="Monto"><Input type="number" value={fNew.monto} onChange={(e) => setFNew((s) => ({ ...s, monto: Number(e.target.value) }))} /></Field>
          </div>
          <Field label="Vencimiento"><Input type="date" value={fNew.fecha_vencimiento} onChange={(e) => setFNew((s) => ({ ...s, fecha_vencimiento: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}

function Cajas({ rol, cajas, proyectos, perfiles = [] }: any) {
  const router = useRouter();
  const [mov, setMov] = useState<any>(null);
  const [form, setForm] = useState({ tipo: 'reposicion', monto: 0, concepto: '', metodo: 'transferencia', num_operacion: '', voucher_url: '' });
  const [busy, setBusy] = useState(false);
  const [nueva, setNueva] = useState(false);
  const [nf, setNf] = useState({ proyecto_id: '', nombre: '', responsable_id: '', asignacion_semanal: 0 });
  const puede = rol === 'administrador' || rol === 'gerencia';

  return (
    <div className="space-y-3">
      {puede && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => { setNueva(true); setNf({ proyecto_id: '', nombre: '', responsable_id: '', asignacion_semanal: 0 }); }}><Plus /> Nueva caja chica</Button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cajas.length === 0 && <Card><CardContent className="p-6"><EmptyState titulo="Sin cajas" /></CardContent></Card>}
      {cajas.map((c: any) => {
        const pctUso = c.monto_maximo > 0 ? (1 - Number(c.saldo_actual) / Number(c.monto_maximo)) : 0;
        return (
          <Card key={c.caja_id} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <Link href={`/finanzas/cajas/${c.caja_id}`} className="flex items-center gap-2 hover:text-azur-600">
                <CardTitle className="text-base flex items-center gap-2"><Wallet className="size-4 text-azur-600" /> {c.nombre}</CardTitle>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2">
              {c.responsable_nombre && <div className="flex justify-between text-xs"><span className="text-muted-foreground">Responsable</span><span className="font-medium">{c.responsable_nombre}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Saldo actual</span><span className="font-bold tabular-nums">{fmtMoney(Number(c.saldo_actual))}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Tope</span><span>{fmtMoney(Number(c.monto_maximo))}</span></div>
              {c.monto_maximo > 0 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className={`h-full ${pctUso > 0.8 ? 'bg-azur-600' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, pctUso * 100)}%` }} />
                </div>
              )}
              {pctUso > 0.8 && <p className="text-xs text-azur-600">⚠ Consumo &gt; 80% — anticipar reposición</p>}
              <div className="flex gap-2">
                <Link href={`/finanzas/cajas/${c.caja_id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full"><ArrowLeftRight /> Abrir</Button>
                </Link>
                {puede && <Button size="sm" variant="gradient" onClick={() => { setMov(c); setForm({ tipo: 'reposicion', monto: 0, concepto: '', metodo: 'transferencia', num_operacion: '', voucher_url: '' }); }}><Plus /></Button>}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Modal open={!!mov} onClose={() => setMov(null)} title={`Movimiento · ${mov?.nombre ?? ''}`}
        footer={<><Button variant="outline" onClick={() => setMov(null)}>Cancelar</Button><Button variant="gradient" disabled={busy} onClick={async () => { setBusy(true); await movimientoCaja({ caja_id: mov.caja_id, proyecto_id: mov.proyecto_id, tipo: form.tipo, monto: Number(form.monto), concepto: form.concepto, metodo: form.metodo, num_operacion: form.num_operacion, voucher_url: form.voucher_url }); setMov(null); router.refresh(); setBusy(false); }}>Registrar</Button></>}>
        <div className="space-y-2">
          <Field label="Tipo"><Select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}><option value="reposicion">Reposición (+)</option><option value="abono">Abono (+)</option><option value="egreso">Egreso (−)</option><option value="traslado">Traslado</option><option value="ajuste">Ajuste</option></Select></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Monto"><Input type="number" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: Number(e.target.value) }))} /></Field>
            <Field label="Método"><Select value={form.metodo} onChange={(e) => setForm((f) => ({ ...f, metodo: e.target.value }))}>{METODOS.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}</Select></Field>
          </div>
          <Field label="N° de operación"><Input value={form.num_operacion} onChange={(e) => setForm((f) => ({ ...f, num_operacion: e.target.value }))} /></Field>
          <Field label="Concepto"><Input value={form.concepto} onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))} /></Field>
          <Field label="Voucher"><VoucherUpload value={form.voucher_url} onChange={(url) => setForm((f) => ({ ...f, voucher_url: url }))} /></Field>
        </div>
      </Modal>
      </div>

      <Modal open={nueva} onClose={() => setNueva(false)} title="Nueva caja chica"
        footer={<><Button variant="outline" onClick={() => setNueva(false)}>Cancelar</Button>
          <Button variant="gradient" disabled={busy || !nf.proyecto_id || !nf.nombre} onClick={async () => { setBusy(true); await crearCajaChica({ proyecto_id: nf.proyecto_id, nombre: nf.nombre, responsable_id: nf.responsable_id || undefined, asignacion_semanal: Number(nf.asignacion_semanal) || 0 }); setNueva(false); router.refresh(); setBusy(false); }}>Crear</Button></>}>
        <div className="space-y-2">
          <Field label="Proyecto"><Select value={nf.proyecto_id} onChange={(e) => setNf((f) => ({ ...f, proyecto_id: e.target.value }))}><option value="">— Selecciona —</option>{proyectos.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Select></Field>
          <Field label="Nombre de la caja"><Input value={nf.nombre} onChange={(e) => setNf((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej. Caja chica — Residente Pérez" /></Field>
          <Field label="Responsable (residente / coordinador)"><Select value={nf.responsable_id} onChange={(e) => setNf((f) => ({ ...f, responsable_id: e.target.value }))}><option value="">— Sin asignar —</option>{perfiles.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}{p.rol ? ` (${p.rol})` : ''}</option>)}</Select></Field>
          <Field label="Asignación semanal (referencia)"><Input type="number" value={nf.asignacion_semanal} onChange={(e) => setNf((f) => ({ ...f, asignacion_semanal: Number(e.target.value) }))} placeholder="Ej. 1500" /></Field>
        </div>
      </Modal>
    </div>
  );
}
