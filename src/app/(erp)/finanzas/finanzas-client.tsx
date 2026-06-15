'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, XCircle, CalendarClock, Banknote, MessageCircle, FilePlus,
  HandCoins, Wallet, Plus, ShieldCheck,
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
import {
  aprobarSolicitud, rechazarSolicitud, programarPago, marcarPagada, aprobarGerencia,
  emitirFactura, registrarAbono, crearFacturaManual, movimientoCaja,
} from './actions';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function FinanzasClient({ rol, solicitudes, facturas, armadas, cajas, clientes, proyectos }: any) {
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
      {tab === 'cajas' && <Cajas rol={rol} cajas={cajas} proyectos={proyectos} />}
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
  const [motivo, setMotivo] = useState('');
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
          <Field label="Cuenta bancaria de origen"><Input value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="Caja central / Interbank…" /></Field>
          <Field label="Fecha programada"><Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        </div>
      </Modal>

      {/* Pagar */}
      <Modal open={!!pago} onClose={() => setPago(null)} title={`Marcar como pagada · ${pago?.codigo ?? ''}`}
        description="Sube la URL del voucher tras el desembolso."
        footer={<><Button variant="outline" onClick={() => setPago(null)}>Cancelar</Button>
          <Button variant="gradient" disabled={busy} onClick={async () => { setBusy(true); await marcarPagada(pago.id, voucher, detr); setPago(null); router.refresh(); setBusy(false); }}>Confirmar pago</Button></>}>
        <div className="space-y-3">
          <Field label="URL del voucher (PDF/foto)"><Input value={voucher} onChange={(e) => setVoucher(e.target.value)} placeholder="https://…" /></Field>
          <Field label="Detracción (si aplica)"><Input type="number" value={detr} onChange={(e) => setDetr(Number(e.target.value))} /></Field>
          {Number(pago?.monto) >= 20000 && rol !== 'gerencia' && <p className="rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">Este monto requerirá aprobación final de Gerencia.</p>}
        </div>
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

  return (
    <div className="space-y-4">
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

function Cajas({ rol, cajas, proyectos }: any) {
  const router = useRouter();
  const [mov, setMov] = useState<any>(null);
  const [form, setForm] = useState({ tipo: 'reposicion', monto: 0, concepto: '' });
  const [busy, setBusy] = useState(false);
  const puede = rol === 'administrador' || rol === 'gerencia';

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cajas.length === 0 && <Card><CardContent className="p-6"><EmptyState titulo="Sin cajas" /></CardContent></Card>}
      {cajas.map((c: any) => {
        const pctUso = c.monto_maximo > 0 ? (1 - Number(c.saldo_actual) / Number(c.monto_maximo)) : 0;
        return (
          <Card key={c.caja_id}>
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Wallet className="size-4 text-azur-600" /> {c.nombre}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Saldo actual</span><span className="font-bold tabular-nums">{fmtMoney(Number(c.saldo_actual))}</span></div>
              <div className="flex justify-between text-xs text-muted-foreground"><span>Tope</span><span>{fmtMoney(Number(c.monto_maximo))}</span></div>
              {c.monto_maximo > 0 && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className={`h-full ${pctUso > 0.8 ? 'bg-azur-600' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, pctUso * 100)}%` }} />
                </div>
              )}
              {pctUso > 0.8 && <p className="text-xs text-azur-600">⚠ Consumo &gt; 80% — anticipar reposición</p>}
              {puede && <Button size="sm" variant="outline" className="w-full" onClick={() => { setMov(c); setForm({ tipo: 'reposicion', monto: 0, concepto: '' }); }}><Plus /> Movimiento</Button>}
            </CardContent>
          </Card>
        );
      })}

      <Modal open={!!mov} onClose={() => setMov(null)} title={`Movimiento · ${mov?.nombre ?? ''}`}
        footer={<><Button variant="outline" onClick={() => setMov(null)}>Cancelar</Button><Button variant="gradient" disabled={busy} onClick={async () => { setBusy(true); await movimientoCaja({ caja_id: mov.caja_id, proyecto_id: mov.proyecto_id, tipo: form.tipo, monto: Number(form.monto), concepto: form.concepto }); setMov(null); router.refresh(); setBusy(false); }}>Registrar</Button></>}>
        <div className="space-y-2">
          <Field label="Tipo"><Select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}><option value="reposicion">Reposición (+)</option><option value="abono">Abono (+)</option><option value="egreso">Egreso (−)</option><option value="traslado">Traslado</option><option value="ajuste">Ajuste</option></Select></Field>
          <Field label="Monto"><Input type="number" value={form.monto} onChange={(e) => setForm((f) => ({ ...f, monto: Number(e.target.value) }))} /></Field>
          <Field label="Concepto"><Input value={form.concepto} onChange={(e) => setForm((f) => ({ ...f, concepto: e.target.value }))} /></Field>
        </div>
      </Modal>
    </div>
  );
}
