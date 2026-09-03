'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Loader2, FileText, Receipt, Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field, EmptyState } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { fmtMoney, fmtDate } from '@/lib/format';
import { VoucherUpload } from '@/components/finanzas/voucher-upload';
import { guardarGastoEmpresa, eliminarGastoEmpresa, guardarCategoriaEmpresa, eliminarCategoriaEmpresa } from './gastos-actions';

const VACIO = { id: '', fecha: new Date().toISOString().slice(0, 10), categoria_id: '', proyecto_id: '', descripcion: '', monto: '', sustento_url: '' };

export function GastosEmpresa({ rol, gastos = [], categorias = [], proyectos = [] }: any) {
  const router = useRouter();
  const canEdit = rol === 'administrador';
  const [open, setOpen] = useState(false);
  const [g, setG] = useState<any>(VACIO);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cats, setCats] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const filtrados = useMemo(() => (gastos as any[]).filter((x) => {
    if (desde && x.fecha < desde) return false;
    if (hasta && x.fecha > hasta) return false;
    return true;
  }), [gastos, desde, hasta]);
  const total = filtrados.reduce((a, x) => a + Number(x.monto ?? 0), 0);

  async function guardar() {
    setMsg(null);
    if (!g.monto || Number(g.monto) <= 0) { setMsg('Ingresa un monto válido.'); return; }
    if (!g.fecha) { setMsg('Ingresa la fecha del gasto.'); return; }
    setBusy(true);
    const res = await guardarGastoEmpresa({
      id: g.id || undefined, fecha: g.fecha, categoria_id: g.categoria_id || '', proyecto_id: g.proyecto_id || '',
      descripcion: g.descripcion || '', monto: Number(g.monto), sustento_url: g.sustento_url || '',
    });
    setBusy(false);
    if (res.ok) { setOpen(false); setG(VACIO); router.refresh(); }
    else setMsg(res.error ?? 'No se pudo guardar.');
  }

  async function borrar(x: any) {
    if (!window.confirm('¿Eliminar este gasto de empresa? Esta acción no se puede deshacer.')) return;
    setBusy(true);
    const r = await eliminarGastoEmpresa(x.id);
    if (!r.ok) alert(r.error ?? 'No se pudo eliminar');
    router.refresh(); setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">
            Gastos de la empresa que <strong>no pasan por el flujo de obra</strong> (planilla, publicidad, impuestos, gastos financieros…).
            Se reflejan en el Estado de resultados (empresa y por línea).
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <Field label="Desde"><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" /></Field>
            <Field label="Hasta"><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" /></Field>
            {(desde || hasta) && <Button size="sm" variant="ghost" onClick={() => { setDesde(''); setHasta(''); }}>Limpiar</Button>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && <Button size="sm" variant="outline" onClick={() => setCats(true)}><Tags className="size-3.5" /> Categorías</Button>}
          {canEdit && <Button size="sm" variant="gradient" onClick={() => { setG(VACIO); setMsg(null); setOpen(true); }}><Plus /> Nuevo gasto</Button>}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <div className="p-6"><EmptyState icon={<Receipt className="size-8" />} titulo="Sin gastos de empresa" descripcion={canEdit ? 'Registra el primer gasto (planilla, impuestos, publicidad…).' : 'Aún no hay gastos registrados por Administración.'} /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead><TableHead>Categoría</TableHead><TableHead>Proyecto</TableHead>
                  <TableHead>Descripción</TableHead><TableHead className="text-right">Monto</TableHead>
                  <TableHead>Sustento</TableHead><TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((x: any) => (
                  <TableRow key={x.id}>
                    <TableCell className="tabular-nums">{fmtDate(x.fecha)}</TableCell>
                    <TableCell>{x.categoria ? <Badge variant="muted">{x.categoria}</Badge> : '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{x.proyecto?.nombre ?? '—'}</TableCell>
                    <TableCell className="text-sm">{x.descripcion ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{fmtMoney(Number(x.monto))}</TableCell>
                    <TableCell>{x.sustento_url ? <a href={x.sustento_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-azur-600 hover:underline"><FileText className="size-3.5" /> Ver</a> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {canEdit && <Button size="sm" variant="ghost" title="Editar" onClick={() => { setG({ id: x.id, fecha: x.fecha, categoria_id: x.categoria_id ?? '', proyecto_id: x.proyecto_id ?? '', descripcion: x.descripcion ?? '', monto: String(x.monto), sustento_url: x.sustento_url ?? '' }); setMsg(null); setOpen(true); }}><Pencil className="size-4" /></Button>}
                        {canEdit && <Button size="sm" variant="ghost" className="text-azur-600" title="Eliminar" onClick={() => borrar(x)}><Trash2 className="size-4" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell colSpan={4} className="text-right">Total del periodo</TableCell>
                  <TableCell className="text-right tabular-nums text-azur-600">{fmtMoney(total)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Alta / edición */}
      <Modal open={open} onClose={() => setOpen(false)} title={g.id ? 'Editar gasto de empresa' : 'Nuevo gasto de empresa'}
        description="Fecha, proyecto (opcional), descripción, monto y sustento."
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="gradient" disabled={busy} onClick={guardar}>{busy ? <Loader2 className="animate-spin" /> : null} Guardar</Button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha" required><Input type="date" value={g.fecha} onChange={(e) => setG((f: any) => ({ ...f, fecha: e.target.value }))} /></Field>
            <Field label="Categoría"><Select value={g.categoria_id} onChange={(e) => setG((f: any) => ({ ...f, categoria_id: e.target.value }))}>
              <option value="">— Sin categoría —</option>
              {(categorias as any[]).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select></Field>
          </div>
          <Field label="Proyecto (opcional)" hint="Si el gasto corresponde a un proyecto, hereda su línea de negocio.">
            <Select value={g.proyecto_id} onChange={(e) => setG((f: any) => ({ ...f, proyecto_id: e.target.value }))}>
              <option value="">— Sin proyecto (gasto general de empresa) —</option>
              {(proyectos as any[]).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Descripción"><Input value={g.descripcion} onChange={(e) => setG((f: any) => ({ ...f, descripcion: e.target.value }))} placeholder="Ej. Planilla quincena 1 - setiembre" /></Field>
          <Field label="Monto (S/)" required><Input type="number" step="0.01" value={g.monto} onChange={(e) => setG((f: any) => ({ ...f, monto: e.target.value }))} placeholder="0.00" /></Field>
          <Field label="Sustento (foto o PDF)"><VoucherUpload value={g.sustento_url} onChange={(u) => setG((f: any) => ({ ...f, sustento_url: u }))} carpeta="gastos-empresa" /></Field>
          {msg && <p className="rounded-lg bg-azur-50 px-3 py-2 text-sm text-azur-700">{msg}</p>}
        </div>
      </Modal>

      {cats && <CategoriasEmpresa categorias={categorias} onClose={() => { setCats(false); router.refresh(); }} />}
    </div>
  );
}

function CategoriasEmpresa({ categorias, onClose }: any) {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function agregar() {
    if (!nombre.trim()) return;
    setBusy(true); setErr(null);
    const r = await guardarCategoriaEmpresa({ nombre, orden: 0 });
    setBusy(false);
    if (!r.ok) { setErr(r.error ?? 'Error'); return; }
    setNombre(''); router.refresh();
  }
  async function quitar(id: string) {
    setBusy(true);
    const r = await eliminarCategoriaEmpresa(id);
    if (!r.ok) alert(r.error ?? 'No se pudo eliminar');
    setBusy(false); router.refresh();
  }

  return (
    <Modal open onClose={onClose} title="Categorías de gasto de empresa"
      description="Planilla, publicidad, impuestos, gastos financieros… Agrega las que necesites. Si una categoría ya se usó, se desactiva en vez de borrarse.">
      <div className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1"><Field label="Nueva categoría"><Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Gastos notariales" /></Field></div>
          <Button variant="gradient" disabled={busy} onClick={agregar}><Plus /> Agregar</Button>
        </div>
        {err && <p className="text-sm text-azur-600">{err}</p>}
        <div className="divide-y rounded-lg border">
          {(categorias as any[]).length === 0 ? <p className="p-3 text-sm text-muted-foreground">Sin categorías.</p> : (categorias as any[]).map((c) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{c.nombre}</span>
              <Button size="sm" variant="ghost" className="text-azur-600" disabled={busy} onClick={() => quitar(c.id)}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
